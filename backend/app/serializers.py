from decimal import Decimal

from app.models import Address, Category, Order, Product, User


def money(value: Decimal | int | None) -> str:
    return f"{Decimal(value or 0):.2f}"


def category_dict(item: Category) -> dict:
    return {
        "id": item.id,
        "slug": item.slug,
        "name_en": item.name_en,
        "name_ar": item.name_ar,
        "icon": item.icon,
        "image_url": item.image_url,
        "sort_order": item.sort_order,
        "is_active": item.is_active,
    }


def product_dict(item: Product, include_admin: bool = False) -> dict:
    compare = item.compare_at_price
    discount = int(((compare - item.price) / compare) * 100) if compare else 0
    data = {
        "id": item.id,
        "sku": item.sku,
        "category_id": item.category_id,
        "category_name": item.category.name_en if item.category else None,
        "name_en": item.name_en,
        "name_ar": item.name_ar,
        "description_en": item.description_en,
        "description_ar": item.description_ar,
        "price": money(item.price),
        "compare_at_price": money(compare) if compare else None,
        "currency": item.currency,
        "unit": item.unit,
        "stock": item.stock,
        "in_stock": item.stock > 0 and item.is_active,
        "rating": float(item.rating),
        "review_count": item.review_count,
        "image_url": item.image_url,
        "images": [
            {"id": image.id, "url": image.url, "thumbnail_url": image.thumbnail_url}
            for image in item.images
        ],
        "freshness_tag": item.freshness_tag,
        "discount_percentage": discount,
        "is_featured": item.is_featured,
        "is_best_seller": item.is_best_seller,
        "is_offer": item.is_offer,
        "is_active": item.is_active,
    }
    if include_admin:
        data.update(
            {
                "low_stock_threshold": item.low_stock_threshold,
                "created_at": item.created_at.isoformat(),
                "updated_at": item.updated_at.isoformat(),
            }
        )
    return data


def address_dict(item: Address) -> dict:
    return {
        "id": item.id,
        "label": item.label,
        "recipient_name": item.recipient_name,
        "phone": item.phone,
        "line1": item.line1,
        "line2": item.line2,
        "city": item.city,
        "latitude": float(item.latitude) if item.latitude is not None else None,
        "longitude": float(item.longitude) if item.longitude is not None else None,
        "delivery_instructions": item.delivery_instructions,
        "is_default": item.is_default,
    }


def user_dict(item: User) -> dict:
    return {
        "id": item.id,
        "phone": item.phone,
        "email": item.email,
        "role": item.role,
        "permissions": item.permissions or [],
        "is_active": item.is_active,
        "full_name": item.profile.full_name if item.profile else None,
        "avatar_url": item.profile.avatar_url if item.profile else None,
        "language": item.preferences.language if item.preferences else "en",
        "notifications_enabled": (
            item.preferences.notifications_enabled if item.preferences else True
        ),
    }


def order_dict(item: Order) -> dict:
    return {
        "id": item.id,
        "order_number": item.order_number,
        "status": item.status,
        "payment_method": item.payment_method,
        "payment_status": item.payment_status,
        "currency": item.currency,
        "subtotal": money(item.subtotal),
        "delivery_fee": money(item.delivery_fee),
        "service_fee": money(item.service_fee),
        "discount": money(item.discount),
        "tax": money(item.tax),
        "total": money(item.total),
        "promo_code": item.promo_code,
        "notes": item.customer_notes,
        "internal_notes": item.internal_notes,
        "address": item.address_snapshot,
        "created_at": item.created_at.isoformat(),
        "estimated_delivery_at": (
            item.estimated_delivery_at.isoformat() if item.estimated_delivery_at else None
        ),
        "driver": (
            {"id": item.driver.id, "name": item.driver.name, "phone": item.driver.phone, "vehicle": item.driver.vehicle}
            if item.driver
            else None
        ),
        "items": [
            {
                "id": line.id,
                "product_id": line.product_id,
                "sku": line.sku_snapshot,
                "name_en": line.name_en_snapshot,
                "name_ar": line.name_ar_snapshot,
                "unit": line.unit_snapshot,
                "image_url": line.image_url_snapshot,
                "unit_price": money(line.unit_price),
                "quantity": line.quantity,
                "line_total": money(line.line_total),
            }
            for line in item.items
        ],
        "status_history": [
            {
                "id": history.id,
                "status": history.status,
                "note": history.note,
                "created_at": history.created_at.isoformat(),
            }
            for history in item.status_history
        ],
    }
