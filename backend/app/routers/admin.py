from datetime import UTC, datetime
from decimal import Decimal

from fastapi import APIRouter, Query, Request, UploadFile
from sqlalchemy import func, or_, select
from sqlalchemy.orm import selectinload

from app.dependencies import AdminUser, DbSession
from app.errors import ApiError
from app.models import (
    Address,
    ApplicationSetting,
    AuditLog,
    Category,
    DeliverySlot,
    DeliveryZone,
    Driver,
    Order,
    OrderStatusHistory,
    Product,
    ProductImage,
    Promotion,
    User,
)
from app.schemas import (
    AdminUserIn,
    AdminUserUpdateIn,
    CategoryIn,
    DeliverySlotIn,
    DeliveryZoneIn,
    DriverIn,
    OrderStatusIn,
    ProductCreateIn,
    ProductUpdateIn,
    PromotionIn,
    SettingIn,
)
from app.security import hash_password, normalize_phone
from app.serializers import category_dict, money, order_dict, product_dict, user_dict
from app.services.providers import queue_order_notification
from app.services.storage import LocalImageStorage

router = APIRouter(prefix="/admin", tags=["admin"])


def audit(
    db,
    actor: User,
    action: str,
    entity_type: str,
    entity_id: str | None,
    request: Request,
    before: dict | None = None,
    after: dict | None = None,
):
    db.add(
        AuditLog(
            actor_user_id=actor.id,
            action=action,
            entity_type=entity_type,
            entity_id=entity_id,
            before=before,
            after=after,
            ip_address=request.client.host if request.client else None,
            request_id=getattr(request.state, "request_id", None),
        )
    )


def page_result(items, total: int, page: int, page_size: int) -> dict:
    return {
        "items": items,
        "total": total,
        "page": page,
        "page_size": page_size,
        "pages": max(1, (total + page_size - 1) // page_size),
    }


@router.get("/dashboard")
def dashboard(admin: AdminUser, db: DbSession):
    del admin
    order_count = db.scalar(select(func.count(Order.id))) or 0
    revenue = db.scalar(
        select(func.coalesce(func.sum(Order.total), 0)).where(Order.status == "delivered")
    ) or Decimal("0")
    statuses = db.execute(select(Order.status, func.count(Order.id)).group_by(Order.status)).all()
    recent = db.scalars(
        select(Order)
        .options(selectinload(Order.items), selectinload(Order.status_history), selectinload(Order.driver))
        .order_by(Order.created_at.desc())
        .limit(8)
    ).all()
    low_stock = db.scalars(
        select(Product)
        .where(Product.is_active.is_(True), Product.stock <= Product.low_stock_threshold)
        .options(selectinload(Product.category), selectinload(Product.images))
        .order_by(Product.stock)
        .limit(10)
    ).all()
    return {
        "total_orders": order_count,
        "revenue": money(revenue),
        "customers": db.scalar(select(func.count(User.id)).where(User.role == "customer")) or 0,
        "products": db.scalar(select(func.count(Product.id)).where(Product.deleted_at.is_(None))) or 0,
        "orders_by_status": {key: value for key, value in statuses},
        "recent_orders": [order_dict(item) for item in recent],
        "low_stock_products": [product_dict(item, True) for item in low_stock],
    }


@router.get("/products")
def admin_products(
    admin: AdminUser,
    db: DbSession,
    search: str | None = Query(None, max_length=120),
    category_id: str | None = None,
    active: bool | None = None,
    low_stock: bool | None = None,
    page: int = Query(1, ge=1),
    page_size: int = Query(25, ge=1, le=100),
):
    del admin
    filters = [Product.deleted_at.is_(None)]
    if search:
        term = f"%{search}%"
        filters.append(or_(Product.name_en.ilike(term), Product.name_ar.ilike(term), Product.sku.ilike(term)))
    if category_id:
        filters.append(Product.category_id == category_id)
    if active is not None:
        filters.append(Product.is_active.is_(active))
    if low_stock:
        filters.append(Product.stock <= Product.low_stock_threshold)
    total = db.scalar(select(func.count(Product.id)).where(*filters)) or 0
    rows = db.scalars(
        select(Product)
        .where(*filters)
        .options(selectinload(Product.category), selectinload(Product.images))
        .order_by(Product.updated_at.desc())
        .offset((page - 1) * page_size)
        .limit(page_size)
    ).all()
    return page_result([product_dict(item, True) for item in rows], total, page, page_size)


@router.post("/products", status_code=201)
def create_product(
    payload: ProductCreateIn,
    request: Request,
    admin: AdminUser,
    db: DbSession,
):
    if db.get(Category, payload.category_id) is None:
        raise ApiError(422, "Category does not exist", "invalid_category")
    if db.scalar(select(Product).where(Product.sku == payload.sku.strip().upper())):
        raise ApiError(409, "SKU already exists", "duplicate_sku")
    values = payload.model_dump()
    values["sku"] = values["sku"].strip().upper()
    product = Product(**values)
    db.add(product)
    db.flush()
    audit(db, admin, "product.create", "product", product.id, request, after={"sku": product.sku})
    db.commit()
    db.refresh(product)
    return product_dict(product, True)


@router.patch("/products/{product_id}")
def update_product(
    product_id: str,
    payload: ProductUpdateIn,
    request: Request,
    admin: AdminUser,
    db: DbSession,
):
    product = db.scalar(
        select(Product)
        .where(Product.id == product_id, Product.deleted_at.is_(None))
        .options(selectinload(Product.category), selectinload(Product.images))
    )
    if not product:
        raise ApiError(404, "Product not found", "product_not_found")
    before = {"price": money(product.price), "stock": product.stock, "is_active": product.is_active}
    for key, value in payload.model_dump(exclude_unset=True).items():
        setattr(product, key, value)
    product.version += 1
    audit(db, admin, "product.update", "product", product.id, request, before=before, after={"version": product.version})
    db.commit()
    return product_dict(product, True)


@router.delete("/products/{product_id}", status_code=204)
def archive_product(
    product_id: str,
    request: Request,
    admin: AdminUser,
    db: DbSession,
):
    product = db.get(Product, product_id)
    if not product or product.deleted_at:
        raise ApiError(404, "Product not found", "product_not_found")
    product.is_active = False
    product.deleted_at = datetime.now(UTC)
    audit(db, admin, "product.archive", "product", product.id, request)
    db.commit()


@router.post("/products/{product_id}/images", status_code=201)
def attach_product_image(
    product_id: str,
    payload: dict,
    request: Request,
    admin: AdminUser,
    db: DbSession,
):
    product = db.get(Product, product_id)
    if not product:
        raise ApiError(404, "Product not found", "product_not_found")
    if not payload.get("url"):
        raise ApiError(422, "Image URL is required", "invalid_image")
    next_sort = db.scalar(select(func.count(ProductImage.id)).where(ProductImage.product_id == product_id)) or 0
    image = ProductImage(
        product_id=product_id,
        url=payload["url"],
        thumbnail_url=payload.get("thumbnail_url"),
        alt_en=payload.get("alt_en"),
        alt_ar=payload.get("alt_ar"),
        sort_order=next_sort,
    )
    db.add(image)
    audit(db, admin, "product.image.attach", "product", product.id, request)
    db.commit()
    return {"id": image.id, "url": image.url, "sort_order": image.sort_order}


@router.put("/products/{product_id}/images/reorder")
def reorder_product_images(
    product_id: str,
    image_ids: list[str],
    request: Request,
    admin: AdminUser,
    db: DbSession,
):
    images = db.scalars(
        select(ProductImage).where(ProductImage.product_id == product_id)
    ).all()
    if {item.id for item in images} != set(image_ids):
        raise ApiError(422, "Image list must contain every product image once", "invalid_image_order")
    by_id = {item.id: item for item in images}
    for index, image in enumerate(images):
        image.sort_order = -(index + 1)
    db.flush()
    for index, image_id in enumerate(image_ids):
        by_id[image_id].sort_order = index
    audit(db, admin, "product.images.reorder", "product", product_id, request)
    db.commit()
    return [{"id": by_id[item].id, "url": by_id[item].url, "sort_order": index} for index, item in enumerate(image_ids)]


@router.delete("/products/{product_id}/images/{image_id}", status_code=204)
def remove_product_image(
    product_id: str,
    image_id: str,
    request: Request,
    admin: AdminUser,
    db: DbSession,
):
    image = db.scalar(
        select(ProductImage).where(ProductImage.id == image_id, ProductImage.product_id == product_id)
    )
    if not image:
        raise ApiError(404, "Product image not found", "image_not_found")
    filenames = [image.url.rsplit("/", 1)[-1]]
    if image.thumbnail_url:
        filenames.append(image.thumbnail_url.rsplit("/", 1)[-1])
    db.delete(image)
    audit(db, admin, "product.image.remove", "product", product_id, request)
    db.commit()
    storage = LocalImageStorage()
    for filename in filenames:
        storage.delete(filename)


@router.get("/categories")
def admin_categories(admin: AdminUser, db: DbSession):
    del admin
    return [category_dict(item) for item in db.scalars(select(Category).order_by(Category.sort_order)).all()]


@router.post("/categories", status_code=201)
def create_category(payload: CategoryIn, request: Request, admin: AdminUser, db: DbSession):
    if db.scalar(select(Category).where(Category.slug == payload.slug)):
        raise ApiError(409, "Category slug already exists", "duplicate_category")
    category = Category(**payload.model_dump())
    db.add(category)
    db.flush()
    audit(db, admin, "category.create", "category", category.id, request)
    db.commit()
    return category_dict(category)


@router.put("/categories/{category_id}")
def update_category(category_id: str, payload: CategoryIn, request: Request, admin: AdminUser, db: DbSession):
    category = db.get(Category, category_id)
    if not category or category.deleted_at:
        raise ApiError(404, "Category not found", "category_not_found")
    for key, value in payload.model_dump().items():
        setattr(category, key, value)
    audit(db, admin, "category.update", "category", category.id, request)
    db.commit()
    return category_dict(category)


@router.delete("/categories/{category_id}", status_code=204)
def archive_category(category_id: str, request: Request, admin: AdminUser, db: DbSession):
    category = db.get(Category, category_id)
    if not category or category.deleted_at:
        raise ApiError(404, "Category not found", "category_not_found")
    if db.scalar(select(func.count(Product.id)).where(Product.category_id == category_id, Product.deleted_at.is_(None))):
        raise ApiError(409, "Category still contains products", "category_not_empty")
    category.is_active = False
    category.deleted_at = datetime.now(UTC)
    audit(db, admin, "category.archive", "category", category.id, request)
    db.commit()


@router.get("/orders")
def admin_orders(
    admin: AdminUser,
    db: DbSession,
    search: str | None = None,
    status_filter: str | None = None,
    page: int = Query(1, ge=1),
    page_size: int = Query(25, ge=1, le=100),
):
    del admin
    filters = []
    if search:
        filters.append(Order.order_number.ilike(f"%{search}%"))
    if status_filter:
        filters.append(Order.status == status_filter)
    total = db.scalar(select(func.count(Order.id)).where(*filters)) or 0
    rows = db.scalars(
        select(Order)
        .where(*filters)
        .options(selectinload(Order.items), selectinload(Order.status_history), selectinload(Order.driver))
        .order_by(Order.created_at.desc())
        .offset((page - 1) * page_size)
        .limit(page_size)
    ).all()
    return page_result([order_dict(item) for item in rows], total, page, page_size)


@router.get("/orders/{order_id}")
def admin_order_detail(order_id: str, admin: AdminUser, db: DbSession):
    del admin
    order = db.scalar(
        select(Order)
        .where(Order.id == order_id)
        .options(selectinload(Order.items), selectinload(Order.status_history), selectinload(Order.driver))
    )
    if not order:
        raise ApiError(404, "Order not found", "order_not_found")
    result = order_dict(order)
    result["customer"] = user_dict(db.get(User, order.user_id))
    return result


@router.patch("/orders/{order_id}/status")
def update_order_status(order_id: str, payload: OrderStatusIn, request: Request, admin: AdminUser, db: DbSession):
    order = db.scalar(
        select(Order)
        .where(Order.id == order_id)
        .options(selectinload(Order.items), selectinload(Order.status_history), selectinload(Order.driver))
    )
    if not order:
        raise ApiError(404, "Order not found", "order_not_found")
    transitions = {
        "placed": {"confirmed", "cancelled"},
        "confirmed": {"preparing", "cancelled"},
        "preparing": {"picked_up", "cancelled"},
        "picked_up": {"out_for_delivery"},
        "out_for_delivery": {"delivered"},
        "delivered": set(),
        "cancelled": set(),
    }
    if payload.status not in transitions.get(order.status, set()):
        raise ApiError(409, f"Cannot move order from {order.status} to {payload.status}", "invalid_status_transition")
    before = order.status
    order.status = payload.status
    order.driver_id = payload.driver_id or order.driver_id
    order.status_history.append(
        OrderStatusHistory(status=payload.status, note=payload.note, changed_by_user_id=admin.id)
    )
    if payload.status == "cancelled":
        order.cancelled_at = datetime.now(UTC)
        for line in order.items:
            if line.product_id:
                product = db.get(Product, line.product_id)
                if product:
                    product.stock += line.quantity
    if payload.status == "delivered":
        order.payment_status = "paid"
    audit(db, admin, "order.status.update", "order", order.id, request, before={"status": before}, after={"status": order.status})
    queue_order_notification(db, db.get(User, order.user_id), order, f"order.{payload.status}")
    db.commit()
    return order_dict(order)


@router.get("/customers")
def customers(
    admin: AdminUser,
    db: DbSession,
    search: str | None = None,
    page: int = Query(1, ge=1),
    page_size: int = Query(25, ge=1, le=100),
):
    del admin
    filters = [User.role == "customer"]
    if search:
        filters.append(User.phone.ilike(f"%{search}%"))
    total = db.scalar(select(func.count(User.id)).where(*filters)) or 0
    rows = db.scalars(
        select(User).where(*filters).order_by(User.created_at.desc()).offset((page - 1) * page_size).limit(page_size)
    ).all()
    data = []
    for user in rows:
        entry = user_dict(user)
        entry["order_count"] = db.scalar(select(func.count(Order.id)).where(Order.user_id == user.id)) or 0
        data.append(entry)
    return page_result(data, total, page, page_size)


@router.get("/customers/{user_id}")
def customer_detail(user_id: str, admin: AdminUser, db: DbSession):
    del admin
    user = db.scalar(select(User).where(User.id == user_id, User.role == "customer"))
    if not user:
        raise ApiError(404, "Customer not found", "customer_not_found")
    result = user_dict(user)
    result["addresses"] = [
        {"id": item.id, "label": item.label, "line1": item.line1, "city": item.city}
        for item in db.scalars(select(Address).where(Address.user_id == user.id, Address.deleted_at.is_(None))).all()
    ]
    orders = db.scalars(
        select(Order)
        .where(Order.user_id == user.id)
        .options(selectinload(Order.items), selectinload(Order.status_history), selectinload(Order.driver))
        .order_by(Order.created_at.desc())
    ).all()
    result["orders"] = [order_dict(item) for item in orders]
    return result


@router.get("/promotions")
def promotions(admin: AdminUser, db: DbSession):
    del admin
    return [promotion_dict(item) for item in db.scalars(select(Promotion).order_by(Promotion.created_at.desc())).all()]


def promotion_dict(item: Promotion) -> dict:
    return {
        "id": item.id,
        "code": item.code,
        "name": item.name,
        "discount_type": item.discount_type,
        "discount_value": money(item.discount_value),
        "minimum_order": money(item.minimum_order),
        "maximum_discount": money(item.maximum_discount) if item.maximum_discount else None,
        "starts_at": item.starts_at.isoformat() if item.starts_at else None,
        "ends_at": item.ends_at.isoformat() if item.ends_at else None,
        "usage_limit": item.usage_limit,
        "used_count": item.used_count,
        "per_user_limit": item.per_user_limit,
        "is_active": item.is_active,
    }


@router.post("/promotions", status_code=201)
def create_promotion(payload: PromotionIn, request: Request, admin: AdminUser, db: DbSession):
    if db.scalar(select(Promotion).where(Promotion.code == payload.code.upper())):
        raise ApiError(409, "Promotion code already exists", "duplicate_promo")
    values = payload.model_dump()
    values["code"] = values["code"].upper()
    item = Promotion(**values)
    db.add(item)
    db.flush()
    audit(db, admin, "promotion.create", "promotion", item.id, request)
    db.commit()
    return promotion_dict(item)


@router.put("/promotions/{promotion_id}")
def update_promotion(promotion_id: str, payload: PromotionIn, request: Request, admin: AdminUser, db: DbSession):
    item = db.get(Promotion, promotion_id)
    if not item:
        raise ApiError(404, "Promotion not found", "promotion_not_found")
    for key, value in payload.model_dump().items():
        setattr(item, key, value.upper() if key == "code" else value)
    audit(db, admin, "promotion.update", "promotion", item.id, request)
    db.commit()
    return promotion_dict(item)


@router.delete("/promotions/{promotion_id}", status_code=204)
def deactivate_promotion(promotion_id: str, request: Request, admin: AdminUser, db: DbSession):
    item = db.get(Promotion, promotion_id)
    if not item:
        raise ApiError(404, "Promotion not found", "promotion_not_found")
    item.is_active = False
    audit(db, admin, "promotion.deactivate", "promotion", item.id, request)
    db.commit()


@router.get("/delivery/zones")
def zones(admin: AdminUser, db: DbSession):
    del admin
    return [zone_dict(item) for item in db.scalars(select(DeliveryZone)).all()]


def zone_dict(item: DeliveryZone):
    return {
        "id": item.id,
        "name_en": item.name_en,
        "name_ar": item.name_ar,
        "cities": item.cities,
        "delivery_fee": money(item.delivery_fee),
        "free_delivery_threshold": money(item.free_delivery_threshold),
        "minimum_order": money(item.minimum_order),
        "estimated_minutes_min": item.estimated_minutes_min,
        "estimated_minutes_max": item.estimated_minutes_max,
        "is_active": item.is_active,
    }


@router.post("/delivery/zones", status_code=201)
def create_zone(payload: DeliveryZoneIn, request: Request, admin: AdminUser, db: DbSession):
    item = DeliveryZone(**payload.model_dump())
    db.add(item)
    db.flush()
    audit(db, admin, "delivery_zone.create", "delivery_zone", item.id, request)
    db.commit()
    return zone_dict(item)


@router.put("/delivery/zones/{zone_id}")
def update_zone(zone_id: str, payload: DeliveryZoneIn, request: Request, admin: AdminUser, db: DbSession):
    item = db.get(DeliveryZone, zone_id)
    if not item:
        raise ApiError(404, "Delivery zone not found", "zone_not_found")
    for key, value in payload.model_dump().items():
        setattr(item, key, value)
    audit(db, admin, "delivery_zone.update", "delivery_zone", item.id, request)
    db.commit()
    return zone_dict(item)


@router.delete("/delivery/zones/{zone_id}", status_code=204)
def deactivate_zone(zone_id: str, request: Request, admin: AdminUser, db: DbSession):
    item = db.get(DeliveryZone, zone_id)
    if not item:
        raise ApiError(404, "Delivery zone not found", "zone_not_found")
    item.is_active = False
    audit(db, admin, "delivery_zone.deactivate", "delivery_zone", item.id, request)
    db.commit()


@router.get("/delivery/slots")
def slots(admin: AdminUser, db: DbSession):
    del admin
    return [
        {
            "id": item.id,
            "label_en": item.label_en,
            "label_ar": item.label_ar,
            "start_time": item.start_time,
            "end_time": item.end_time,
            "day_offset": item.day_offset,
            "capacity": item.capacity,
            "is_active": item.is_active,
        }
        for item in db.scalars(select(DeliverySlot)).all()
    ]


@router.post("/delivery/slots", status_code=201)
def create_slot(payload: DeliverySlotIn, request: Request, admin: AdminUser, db: DbSession):
    item = DeliverySlot(**payload.model_dump())
    db.add(item)
    db.flush()
    audit(db, admin, "delivery_slot.create", "delivery_slot", item.id, request)
    db.commit()
    return {"id": item.id, **payload.model_dump()}


@router.put("/delivery/slots/{slot_id}")
def update_slot(slot_id: str, payload: DeliverySlotIn, request: Request, admin: AdminUser, db: DbSession):
    item = db.get(DeliverySlot, slot_id)
    if not item:
        raise ApiError(404, "Delivery slot not found", "slot_not_found")
    for key, value in payload.model_dump().items():
        setattr(item, key, value)
    audit(db, admin, "delivery_slot.update", "delivery_slot", item.id, request)
    db.commit()
    return {"id": item.id, **payload.model_dump()}


@router.delete("/delivery/slots/{slot_id}", status_code=204)
def deactivate_slot(slot_id: str, request: Request, admin: AdminUser, db: DbSession):
    item = db.get(DeliverySlot, slot_id)
    if not item:
        raise ApiError(404, "Delivery slot not found", "slot_not_found")
    item.is_active = False
    audit(db, admin, "delivery_slot.deactivate", "delivery_slot", item.id, request)
    db.commit()


def driver_dict(item: Driver) -> dict:
    return {"id": item.id, "name": item.name, "phone": item.phone, "vehicle": item.vehicle, "is_active": item.is_active}


@router.get("/delivery/drivers")
def drivers(admin: AdminUser, db: DbSession):
    del admin
    return [driver_dict(item) for item in db.scalars(select(Driver).order_by(Driver.name)).all()]


@router.post("/delivery/drivers", status_code=201)
def create_driver(payload: DriverIn, request: Request, admin: AdminUser, db: DbSession):
    values = payload.model_dump()
    values["phone"] = normalize_phone(values["phone"])
    item = Driver(**values)
    db.add(item)
    db.flush()
    audit(db, admin, "driver.create", "driver", item.id, request)
    db.commit()
    return driver_dict(item)


@router.put("/delivery/drivers/{driver_id}")
def update_driver(driver_id: str, payload: DriverIn, request: Request, admin: AdminUser, db: DbSession):
    item = db.get(Driver, driver_id)
    if not item:
        raise ApiError(404, "Driver not found", "driver_not_found")
    for key, value in payload.model_dump().items():
        setattr(item, key, normalize_phone(value) if key == "phone" else value)
    audit(db, admin, "driver.update", "driver", item.id, request)
    db.commit()
    return driver_dict(item)


@router.get("/settings")
def settings_list(admin: AdminUser, db: DbSession):
    del admin
    return [
        {"key": item.key, "value": item.value, "description": item.description, "is_public": item.is_public}
        for item in db.scalars(select(ApplicationSetting).order_by(ApplicationSetting.key)).all()
    ]


@router.put("/settings/{key}")
def update_setting(key: str, payload: SettingIn, request: Request, admin: AdminUser, db: DbSession):
    item = db.get(ApplicationSetting, key)
    if item:
        before = item.value
        for field, value in payload.model_dump().items():
            setattr(item, field, value)
    else:
        before = None
        item = ApplicationSetting(key=key, **payload.model_dump())
        db.add(item)
    audit(db, admin, "setting.update", "setting", key, request, before={"value": before}, after={"value": payload.value})
    db.commit()
    return {"key": item.key, "value": item.value, "description": item.description, "is_public": item.is_public}


@router.get("/audit-logs")
def audit_logs(
    admin: AdminUser,
    db: DbSession,
    action: str | None = None,
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=100),
):
    del admin
    filters = [AuditLog.action == action] if action else []
    total = db.scalar(select(func.count(AuditLog.id)).where(*filters)) or 0
    rows = db.scalars(
        select(AuditLog).where(*filters).order_by(AuditLog.created_at.desc()).offset((page - 1) * page_size).limit(page_size)
    ).all()
    return page_result(
        [
            {
                "id": item.id,
                "actor_user_id": item.actor_user_id,
                "action": item.action,
                "entity_type": item.entity_type,
                "entity_id": item.entity_id,
                "before": item.before,
                "after": item.after,
                "created_at": item.created_at.isoformat(),
            }
            for item in rows
        ],
        total,
        page,
        page_size,
    )


@router.get("/users")
def admin_users(admin: AdminUser, db: DbSession):
    del admin
    return [user_dict(item) for item in db.scalars(select(User).where(User.role != "customer")).all()]


@router.post("/users", status_code=201)
def create_admin_user(payload: AdminUserIn, request: Request, admin: AdminUser, db: DbSession):
    if admin.role != "admin":
        raise ApiError(403, "Only administrators can manage admin accounts", "forbidden")
    if db.scalar(select(User).where(func.lower(User.email) == payload.email.lower())):
        raise ApiError(409, "Email already exists", "duplicate_email")
    item = User(
        email=payload.email.lower(),
        password_hash=hash_password(payload.password),
        role=payload.role,
        permissions=payload.permissions,
    )
    db.add(item)
    db.flush()
    audit(db, admin, "admin_user.create", "user", item.id, request)
    db.commit()
    return user_dict(item)


@router.put("/users/{user_id}")
def update_admin_user(
    user_id: str,
    payload: AdminUserUpdateIn,
    request: Request,
    admin: AdminUser,
    db: DbSession,
):
    if admin.role != "admin":
        raise ApiError(403, "Only administrators can manage admin accounts", "forbidden")
    item = db.scalar(select(User).where(User.id == user_id, User.role != "customer"))
    if not item:
        raise ApiError(404, "Admin user not found", "admin_user_not_found")
    if item.id == admin.id and not payload.is_active:
        raise ApiError(409, "You cannot deactivate your own account", "self_deactivation")
    before = {"role": item.role, "is_active": item.is_active, "permissions": item.permissions}
    item.role = payload.role
    item.permissions = payload.permissions
    item.is_active = payload.is_active
    audit(db, admin, "admin_user.update", "user", item.id, request, before=before, after=payload.model_dump())
    db.commit()
    return user_dict(item)


@router.post("/media", status_code=201)
async def upload_media(
    file: UploadFile,
    request: Request,
    admin: AdminUser,
    db: DbSession,
):
    result = await LocalImageStorage().save(file)
    audit(db, admin, "media.upload", "media", result["filename"], request, after={"url": result["url"]})
    db.commit()
    return result
