from fastapi import APIRouter, Header, Response, status
from sqlalchemy import select
from sqlalchemy.orm import selectinload

from app.dependencies import CurrentUser, DbSession
from app.errors import ApiError
from app.models import (
    Address,
    CartItem,
    DeviceToken,
    Order,
    Product,
    Promotion,
)
from app.schemas import (
    AddressIn,
    CartItemIn,
    CartItemUpdateIn,
    CheckoutIn,
    DeviceTokenIn,
    PromoApplyIn,
)
from app.security import normalize_phone
from app.serializers import address_dict, order_dict
from app.services.cart import calculate_cart, get_or_create_cart
from app.services.orders import create_order, reorder_to_cart

router = APIRouter(tags=["customer"])


@router.get("/cart")
def read_cart(user: CurrentUser, db: DbSession):
    cart = get_or_create_cart(db, user.id)
    return calculate_cart(db, cart)


@router.post("/cart/items")
def add_cart_item(payload: CartItemIn, user: CurrentUser, db: DbSession):
    product = db.scalar(
        select(Product).where(
            Product.id == payload.product_id,
            Product.is_active.is_(True),
            Product.deleted_at.is_(None),
        )
    )
    if not product:
        raise ApiError(404, "Product not found", "product_not_found")
    cart = get_or_create_cart(db, user.id)
    existing = next((item for item in cart.items if item.product_id == product.id), None)
    requested = payload.quantity + (existing.quantity if existing else 0)
    if requested > product.stock:
        raise ApiError(409, "Requested quantity exceeds current stock", "stock_conflict")
    if existing:
        existing.quantity = requested
    else:
        db.add(CartItem(cart_id=cart.id, product_id=product.id, quantity=payload.quantity))
    db.commit()
    db.expire_all()
    return calculate_cart(db, get_or_create_cart(db, user.id))


@router.patch("/cart/items/{item_id}")
def update_cart_item(item_id: str, payload: CartItemUpdateIn, user: CurrentUser, db: DbSession):
    cart = get_or_create_cart(db, user.id)
    item = db.scalar(
        select(CartItem)
        .where(CartItem.id == item_id, CartItem.cart_id == cart.id)
        .options(selectinload(CartItem.product))
    )
    if not item:
        raise ApiError(404, "Cart item not found", "cart_item_not_found")
    if payload.quantity > item.product.stock:
        raise ApiError(409, "Requested quantity exceeds current stock", "stock_conflict")
    item.quantity = payload.quantity
    db.commit()
    return calculate_cart(db, get_or_create_cart(db, user.id))


@router.delete("/cart/items/{item_id}")
def remove_cart_item(item_id: str, user: CurrentUser, db: DbSession):
    cart = get_or_create_cart(db, user.id)
    item = db.scalar(select(CartItem).where(CartItem.id == item_id, CartItem.cart_id == cart.id))
    if not item:
        raise ApiError(404, "Cart item not found", "cart_item_not_found")
    db.delete(item)
    db.commit()
    return calculate_cart(db, get_or_create_cart(db, user.id))


@router.delete("/cart", status_code=204)
def clear_cart(user: CurrentUser, db: DbSession):
    cart = get_or_create_cart(db, user.id)
    for item in list(cart.items):
        db.delete(item)
    cart.promotion_id = None
    db.commit()
    return None


@router.post("/cart/promo")
def apply_promo(payload: PromoApplyIn, user: CurrentUser, db: DbSession):
    promotion = db.scalar(
        select(Promotion).where(Promotion.code == payload.code.strip().upper(), Promotion.is_active.is_(True))
    )
    if not promotion:
        raise ApiError(422, "Promotion code is invalid", "invalid_promo")
    cart = get_or_create_cart(db, user.id)
    cart.promotion_id = promotion.id
    db.commit()
    db.expire_all()
    result = calculate_cart(db, get_or_create_cart(db, user.id))
    if result["promo_code"] is None:
        cart.promotion_id = None
        db.commit()
        raise ApiError(422, "Promotion conditions are not met", "promo_not_applicable")
    return result


@router.delete("/cart/promo")
def remove_promo(user: CurrentUser, db: DbSession):
    cart = get_or_create_cart(db, user.id)
    cart.promotion_id = None
    db.commit()
    return calculate_cart(db, cart)


@router.get("/addresses")
def list_addresses(user: CurrentUser, db: DbSession):
    return [
        address_dict(item)
        for item in db.scalars(
            select(Address)
            .where(Address.user_id == user.id, Address.deleted_at.is_(None))
            .order_by(Address.is_default.desc(), Address.created_at.desc())
        ).all()
    ]


@router.post("/addresses", status_code=201)
def create_address(payload: AddressIn, user: CurrentUser, db: DbSession):
    values = payload.model_dump()
    values["phone"] = normalize_phone(values["phone"])
    if payload.is_default:
        for item in db.scalars(select(Address).where(Address.user_id == user.id)).all():
            item.is_default = False
    address = Address(user_id=user.id, **values)
    db.add(address)
    db.commit()
    db.refresh(address)
    return address_dict(address)


@router.patch("/addresses/{address_id}")
def update_address(address_id: str, payload: AddressIn, user: CurrentUser, db: DbSession):
    address = db.scalar(
        select(Address).where(
            Address.id == address_id, Address.user_id == user.id, Address.deleted_at.is_(None)
        )
    )
    if not address:
        raise ApiError(404, "Address not found", "address_not_found")
    if payload.is_default:
        for item in db.scalars(select(Address).where(Address.user_id == user.id)).all():
            item.is_default = False
    for key, value in payload.model_dump().items():
        setattr(address, key, normalize_phone(value) if key == "phone" else value)
    db.commit()
    return address_dict(address)


@router.delete("/addresses/{address_id}", status_code=204)
def delete_address(address_id: str, user: CurrentUser, db: DbSession):
    from app.models import utcnow

    address = db.scalar(select(Address).where(Address.id == address_id, Address.user_id == user.id))
    if not address:
        raise ApiError(404, "Address not found", "address_not_found")
    address.deleted_at = utcnow()
    db.commit()
    return None


@router.post("/checkout/preview")
def checkout_preview(payload: CheckoutIn, user: CurrentUser, db: DbSession):
    address = db.scalar(
        select(Address).where(
            Address.id == payload.address_id,
            Address.user_id == user.id,
            Address.deleted_at.is_(None),
        )
    )
    if not address:
        raise ApiError(404, "Address not found", "address_not_found")
    result = calculate_cart(db, get_or_create_cart(db, user.id), address.city)
    result["address"] = address_dict(address)
    result["payment_method"] = payload.payment_method
    return result


@router.post("/orders")
def place_order(
    payload: CheckoutIn,
    response: Response,
    user: CurrentUser,
    db: DbSession,
    idempotency_key: str = Header(..., alias="Idempotency-Key", min_length=8, max_length=100),
):
    order, created = create_order(db, user, payload, idempotency_key)
    response.status_code = status.HTTP_201_CREATED if created else status.HTTP_200_OK
    return order_dict(order)


@router.get("/orders")
def list_orders(user: CurrentUser, db: DbSession, status_filter: str | None = None):
    filters = [Order.user_id == user.id]
    if status_filter:
        filters.append(Order.status == status_filter)
    rows = db.scalars(
        select(Order)
        .where(*filters)
        .options(selectinload(Order.items), selectinload(Order.status_history), selectinload(Order.driver))
        .order_by(Order.created_at.desc())
    ).all()
    return [order_dict(item) for item in rows]


@router.get("/orders/{order_id}")
def get_order(order_id: str, user: CurrentUser, db: DbSession):
    order = db.scalar(
        select(Order)
        .where(Order.id == order_id, Order.user_id == user.id)
        .options(selectinload(Order.items), selectinload(Order.status_history), selectinload(Order.driver))
    )
    if not order:
        raise ApiError(404, "Order not found", "order_not_found")
    return order_dict(order)


@router.post("/orders/{order_id}/cancel")
def cancel_order(order_id: str, user: CurrentUser, db: DbSession):
    from app.models import OrderStatusHistory, utcnow

    order = db.scalar(
        select(Order)
        .where(Order.id == order_id, Order.user_id == user.id)
        .options(selectinload(Order.items), selectinload(Order.status_history), selectinload(Order.driver))
    )
    if not order:
        raise ApiError(404, "Order not found", "order_not_found")
    if order.status not in {"placed", "confirmed"}:
        raise ApiError(409, "Order can no longer be cancelled", "order_not_cancellable")
    order.status = "cancelled"
    order.cancelled_at = utcnow()
    order.status_history.append(
        OrderStatusHistory(status="cancelled", note="Cancelled by customer", changed_by_user_id=user.id)
    )
    for line in order.items:
        if line.product_id:
            product = db.get(Product, line.product_id)
            if product:
                product.stock += line.quantity
    db.commit()
    return order_dict(order)


@router.post("/orders/{order_id}/reorder")
def reorder(order_id: str, user: CurrentUser, db: DbSession):
    order = db.scalar(
        select(Order)
        .where(Order.id == order_id, Order.user_id == user.id)
        .options(selectinload(Order.items))
    )
    if not order:
        raise ApiError(404, "Order not found", "order_not_found")
    cart = reorder_to_cart(db, user, order)
    return calculate_cart(db, cart)


@router.post("/devices", status_code=201)
def register_device(payload: DeviceTokenIn, user: CurrentUser, db: DbSession):
    device = db.scalar(select(DeviceToken).where(DeviceToken.token == payload.token))
    if device:
        device.user_id = user.id
        device.platform = payload.platform
        device.is_active = True
    else:
        device = DeviceToken(user_id=user.id, **payload.model_dump())
        db.add(device)
    db.commit()
    return {"id": device.id, "platform": device.platform, "is_active": device.is_active}


@router.delete("/devices/{token}", status_code=204)
def unregister_device(token: str, user: CurrentUser, db: DbSession):
    device = db.scalar(
        select(DeviceToken).where(DeviceToken.token == token, DeviceToken.user_id == user.id)
    )
    if device:
        device.is_active = False
        db.commit()
    return None
