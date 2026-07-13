import secrets
from datetime import UTC, datetime, timedelta
from decimal import Decimal

from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload

from app.errors import ApiError
from app.models import (
    Address,
    Cart,
    CartItem,
    Order,
    OrderItem,
    OrderStatusHistory,
    Product,
    User,
)
from app.schemas import CheckoutIn
from app.services.cart import calculate_cart, get_or_create_cart
from app.services.providers import CashOnDeliveryProvider, queue_order_notification


def create_order(
    db: Session, user: User, payload: CheckoutIn, idempotency_key: str
) -> tuple[Order, bool]:
    existing = db.scalar(
        select(Order)
        .where(Order.user_id == user.id, Order.idempotency_key == idempotency_key)
        .options(selectinload(Order.items), selectinload(Order.status_history), selectinload(Order.driver))
    )
    if existing:
        return existing, False
    address = db.scalar(
        select(Address).where(
            Address.id == payload.address_id,
            Address.user_id == user.id,
            Address.deleted_at.is_(None),
        )
    )
    if not address:
        raise ApiError(404, "Address not found", "address_not_found")
    cart = get_or_create_cart(db, user.id)
    if not cart.items:
        raise ApiError(422, "Cart is empty", "empty_cart")
    totals = calculate_cart(db, cart, address.city)
    if totals["unavailable_product_ids"]:
        raise ApiError(409, "Some cart products are unavailable", "stock_conflict")
    if Decimal(totals["subtotal"]) < Decimal(totals["minimum_order"]):
        raise ApiError(422, "Cart does not meet the minimum order", "minimum_order")

    product_ids = [item.product_id for item in cart.items]
    locked_products = db.scalars(
        select(Product).where(Product.id.in_(product_ids)).with_for_update()
    ).all()
    products = {item.id: item for item in locked_products}
    for item in cart.items:
        product = products.get(item.product_id)
        if not product or not product.is_active or product.stock < item.quantity:
            raise ApiError(409, f"Insufficient stock for {item.product.name_en}", "stock_conflict")

    now = datetime.now(UTC)
    order = Order(
        order_number=f"LM-{now.year}-{secrets.token_hex(4).upper()}",
        user_id=user.id,
        address_id=address.id,
        delivery_slot_id=payload.delivery_slot_id,
        idempotency_key=idempotency_key,
        status="placed",
        payment_method=payload.payment_method,
        subtotal=Decimal(totals["subtotal"]),
        delivery_fee=Decimal(totals["delivery_fee"]),
        service_fee=Decimal(totals["service_fee"]),
        discount=Decimal(totals["discount"]),
        tax=Decimal(totals["tax"]),
        total=Decimal(totals["total"]),
        promo_code=totals["promo_code"],
        customer_notes=payload.notes,
        address_snapshot={
            "label": address.label,
            "recipient_name": address.recipient_name,
            "phone": address.phone,
            "line1": address.line1,
            "line2": address.line2,
            "city": address.city,
            "latitude": str(address.latitude) if address.latitude is not None else None,
            "longitude": str(address.longitude) if address.longitude is not None else None,
        },
        estimated_delivery_at=now + timedelta(minutes=45),
    )
    db.add(order)
    db.flush()
    for item in cart.items:
        product = products[item.product_id]
        product.stock -= item.quantity
        product.version += 1
        order.items.append(
            OrderItem(
                product_id=product.id,
                sku_snapshot=product.sku,
                name_en_snapshot=product.name_en,
                name_ar_snapshot=product.name_ar,
                unit_snapshot=product.unit,
                image_url_snapshot=product.image_url,
                unit_price=product.price,
                quantity=item.quantity,
                line_total=product.price * item.quantity,
            )
        )
    order.status_history.append(
        OrderStatusHistory(status="placed", note="Order submitted", changed_by_user_id=user.id)
    )
    db.add(CashOnDeliveryProvider().create(order))
    if cart.promotion:
        cart.promotion.used_count += 1
    for item in list(cart.items):
        db.delete(item)
    cart.promotion_id = None
    queue_order_notification(db, user, order, "order.created")
    db.commit()
    db.refresh(order)
    return order, True


def reorder_to_cart(db: Session, user: User, order: Order) -> Cart:
    cart = get_or_create_cart(db, user.id)
    existing = {item.product_id: item for item in cart.items}
    products = db.scalars(
        select(Product).where(Product.id.in_([line.product_id for line in order.items if line.product_id]))
    ).all()
    for product in products:
        if not product.is_active or product.stock <= 0:
            continue
        quantity = next(line.quantity for line in order.items if line.product_id == product.id)
        quantity = min(quantity, product.stock, 99)
        if product.id in existing:
            existing[product.id].quantity = min(99, existing[product.id].quantity + quantity)
        else:
            db.add(CartItem(cart_id=cart.id, product_id=product.id, quantity=quantity))
    db.commit()
    return get_or_create_cart(db, user.id)
