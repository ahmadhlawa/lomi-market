from fastapi import APIRouter, Query
from sqlalchemy import func, or_, select
from sqlalchemy.orm import selectinload

from app.dependencies import DbSession
from app.errors import ApiError
from app.models import ApplicationSetting, Category, DeliverySlot, Product
from app.serializers import category_dict, product_dict

router = APIRouter(prefix="/catalog", tags=["catalog"])


@router.get("/categories")
def list_categories(db: DbSession):
    rows = db.scalars(
        select(Category)
        .where(Category.is_active.is_(True), Category.deleted_at.is_(None))
        .order_by(Category.sort_order, Category.name_en)
    ).all()
    return [category_dict(row) for row in rows]


@router.get("/products")
def list_products(
    db: DbSession,
    search: str | None = Query(None, max_length=120),
    category_id: str | None = None,
    featured: bool | None = None,
    best_seller: bool | None = None,
    offer: bool | None = None,
    in_stock: bool | None = None,
    sort: str = Query("featured", pattern="^(featured|price_asc|price_desc|newest|name)$"),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
):
    filters = [Product.is_active.is_(True), Product.deleted_at.is_(None)]
    if search:
        term = f"%{search.strip()}%"
        filters.append(
            or_(
                Product.name_en.ilike(term),
                Product.name_ar.ilike(term),
                Product.description_en.ilike(term),
                Product.description_ar.ilike(term),
                Product.sku.ilike(term),
            )
        )
    if category_id:
        filters.append(Product.category_id == category_id)
    if featured is not None:
        filters.append(Product.is_featured.is_(featured))
    if best_seller is not None:
        filters.append(Product.is_best_seller.is_(best_seller))
    if offer is not None:
        filters.append(Product.is_offer.is_(offer))
    if in_stock is True:
        filters.append(Product.stock > 0)
    order_by = {
        "featured": (Product.is_featured.desc(), Product.is_best_seller.desc(), Product.name_en),
        "price_asc": (Product.price.asc(),),
        "price_desc": (Product.price.desc(),),
        "newest": (Product.created_at.desc(),),
        "name": (Product.name_en.asc(),),
    }[sort]
    total = db.scalar(select(func.count(Product.id)).where(*filters)) or 0
    rows = db.scalars(
        select(Product)
        .where(*filters)
        .options(selectinload(Product.category), selectinload(Product.images))
        .order_by(*order_by)
        .offset((page - 1) * page_size)
        .limit(page_size)
    ).all()
    return {
        "items": [product_dict(row) for row in rows],
        "total": total,
        "page": page,
        "page_size": page_size,
        "pages": max(1, (total + page_size - 1) // page_size),
    }


@router.get("/products/{product_id}")
def get_product(product_id: str, db: DbSession):
    product = db.scalar(
        select(Product)
        .where(Product.id == product_id, Product.is_active.is_(True), Product.deleted_at.is_(None))
        .options(selectinload(Product.category), selectinload(Product.images))
    )
    if not product:
        raise ApiError(404, "Product not found", "product_not_found")
    result = product_dict(product)
    related = db.scalars(
        select(Product)
        .where(
            Product.category_id == product.category_id,
            Product.id != product.id,
            Product.is_active.is_(True),
        )
        .options(selectinload(Product.category), selectinload(Product.images))
        .limit(6)
    ).all()
    result["related"] = [product_dict(item) for item in related]
    return result


@router.get("/delivery-slots")
def list_delivery_slots(db: DbSession):
    return [
        {
            "id": item.id,
            "label_en": item.label_en,
            "label_ar": item.label_ar,
            "start_time": item.start_time,
            "end_time": item.end_time,
            "day_offset": item.day_offset,
        }
        for item in db.scalars(select(DeliverySlot).where(DeliverySlot.is_active.is_(True))).all()
    ]


@router.get("/settings")
def public_settings(db: DbSession):
    return {
        item.key: item.value
        for item in db.scalars(select(ApplicationSetting).where(ApplicationSetting.is_public.is_(True))).all()
    }
