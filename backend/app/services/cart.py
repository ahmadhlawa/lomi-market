from datetime import UTC, datetime
from decimal import ROUND_HALF_UP, Decimal

from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload

from app.errors import ApiError
from app.models import ApplicationSetting, Cart, CartItem, DeliveryZone, Promotion
from app.serializers import money, product_dict

CENT = Decimal("0.01")


def rounded(value: Decimal) -> Decimal:
    return value.quantize(CENT, rounding=ROUND_HALF_UP)


def get_or_create_cart(db: Session, user_id: str) -> Cart:
    cart = db.scalar(
        select(Cart)
        .where(Cart.user_id == user_id)
        .options(selectinload(Cart.items).selectinload(CartItem.product), selectinload(Cart.promotion))
    )
    if not cart:
        cart = Cart(user_id=user_id)
        db.add(cart)
        db.flush()
    return cart


def valid_promotion(promotion: Promotion | None, subtotal: Decimal) -> Promotion | None:
    if not promotion or not promotion.is_active or subtotal < promotion.minimum_order:
        return None
    now = datetime.now(UTC)
    start = promotion.starts_at
    end = promotion.ends_at
    if start and (start if start.tzinfo else start.replace(tzinfo=UTC)) > now:
        return None
    if end and (end if end.tzinfo else end.replace(tzinfo=UTC)) < now:
        return None
    if promotion.usage_limit is not None and promotion.used_count >= promotion.usage_limit:
        return None
    return promotion


def calculate_cart(db: Session, cart: Cart, city: str = "Ramallah") -> dict:
    unavailable = []
    lines = []
    subtotal = Decimal("0")
    count = 0
    for item in cart.items:
        product = item.product
        if not product.is_active or product.deleted_at or product.stock < item.quantity:
            unavailable.append(product.id)
        line_total = rounded(product.price * item.quantity)
        subtotal += line_total
        count += item.quantity
        lines.append(
            {
                "id": item.id,
                "quantity": item.quantity,
                "line_total": money(line_total),
                "available": product.id not in unavailable,
                "product": product_dict(product),
            }
        )
    subtotal = rounded(subtotal)
    zone = db.scalar(select(DeliveryZone).where(DeliveryZone.is_active.is_(True)).order_by(DeliveryZone.created_at))
    if zone and city.casefold() not in {value.casefold() for value in zone.cities}:
        zone = None
    delivery_fee = Decimal("0")
    minimum_order = Decimal("0")
    if count:
        if not zone:
            raise ApiError(422, "Address is outside an active delivery zone", "outside_delivery_zone")
        minimum_order = zone.minimum_order
        delivery_fee = Decimal("0") if subtotal >= zone.free_delivery_threshold else zone.delivery_fee
    setting = db.get(ApplicationSetting, "commerce")
    service_fee = Decimal((setting.value if setting else {}).get("service_fee", "2.00")) if count else Decimal("0")
    promotion = valid_promotion(cart.promotion, subtotal)
    discount = Decimal("0")
    if promotion:
        if promotion.discount_type == "percentage":
            discount = rounded(subtotal * promotion.discount_value / Decimal("100"))
        else:
            discount = min(subtotal, promotion.discount_value)
        if promotion.maximum_discount is not None:
            discount = min(discount, promotion.maximum_discount)
    total = rounded(max(Decimal("0"), subtotal + delivery_fee + service_fee - discount))
    return {
        "id": cart.id,
        "items": lines,
        "item_count": count,
        "subtotal": money(subtotal),
        "delivery_fee": money(delivery_fee),
        "service_fee": money(service_fee),
        "discount": money(discount),
        "tax": "0.00",
        "total": money(total),
        "currency": "ILS",
        "promo_code": promotion.code if promotion else None,
        "minimum_order": money(minimum_order),
        "unavailable_product_ids": unavailable,
    }
