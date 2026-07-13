from decimal import Decimal

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.config import settings
from app.models import (
    ApplicationSetting,
    Category,
    DeliverySlot,
    DeliveryZone,
    Driver,
    Product,
    Promotion,
    User,
)
from app.security import hash_password

IMAGES = {
    "tomatoes": "https://images.unsplash.com/photo-1592924357228-91a4daadcfea?auto=format&fit=crop&w=900&q=85",
    "apples": "https://images.unsplash.com/photo-1570913149827-d2ac84ab3f9a?auto=format&fit=crop&w=900&q=85",
    "bananas": "https://images.unsplash.com/photo-1603833665858-e61d17a86224?auto=format&fit=crop&w=900&q=85",
    "cheese": "https://images.unsplash.com/photo-1486297678162-eb2a19b0a32d?auto=format&fit=crop&w=900&q=85",
    "milk": "https://images.unsplash.com/photo-1563636619-e9143da7973b?auto=format&fit=crop&w=900&q=85",
    "bread": "https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=900&q=85",
    "chicken": "https://images.unsplash.com/photo-1604503468506-a8da13d82791?auto=format&fit=crop&w=900&q=85",
    "water": "https://images.unsplash.com/photo-1523362628745-0c100150b504?auto=format&fit=crop&w=900&q=85",
    "chips": "https://images.unsplash.com/photo-1566478989037-eec170784d0b?auto=format&fit=crop&w=900&q=85",
    "oil": "https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?auto=format&fit=crop&w=900&q=85",
}


def seed_database(session: Session) -> None:
    if session.scalar(select(User.id).limit(1)):
        return

    admin = User(
        email=settings.admin_email.lower(),
        password_hash=hash_password(settings.admin_password),
        role="admin",
        permissions=["*"],
    )
    session.add(admin)

    category_data = [
        ("vegetables", "Vegetables", "خضار", "leaf-outline"),
        ("fruits", "Fruits", "فواكه", "nutrition-outline"),
        ("dairy", "Dairy", "ألبان", "water-outline"),
        ("bakery", "Bakery", "مخبوزات", "fast-food-outline"),
        ("meat", "Meat & Chicken", "لحوم ودجاج", "restaurant-outline"),
        ("beverages", "Beverages", "مشروبات", "cafe-outline"),
        ("snacks", "Snacks", "وجبات خفيفة", "ice-cream-outline"),
        ("household", "Household", "منزلي", "home-outline"),
        ("offers", "Offers", "عروض", "pricetag-outline"),
    ]
    categories = {}
    for index, (slug, en, ar, icon) in enumerate(category_data):
        category = Category(slug=slug, name_en=en, name_ar=ar, icon=icon, sort_order=index)
        session.add(category)
        session.flush()
        categories[slug] = category

    products = [
        ("P001", "vegetables", "Fresh Tomatoes", "بندورة طازجة", "6.90", "8.50", "kg", 42, "tomatoes", True, True, True),
        ("P002", "vegetables", "Green Cucumbers", "خيار أخضر", "5.50", None, "kg", 35, "tomatoes", True, True, False),
        ("P003", "fruits", "Crisp Red Apples", "تفاح أحمر مقرمش", "10.00", "14.50", "kg", 50, "apples", True, True, True),
        ("P004", "fruits", "Bananas", "موز", "5.90", None, "kg", 60, "bananas", True, False, False),
        ("P013", "dairy", "Nabulsi Cheese", "جبنة نابلسية", "18.00", "21.00", "500g", 24, "cheese", True, True, True),
        ("P015", "dairy", "Organic Whole Milk", "حليب عضوي كامل الدسم", "8.00", None, "1L", 25, "milk", True, True, False),
        ("P021", "bakery", "Arabic Bread", "خبز عربي", "3.00", None, "pack", 90, "bread", True, True, False),
        ("P023", "meat", "Fresh Chicken Breast", "صدر دجاج طازج", "28.00", "32.00", "kg", 20, "chicken", True, True, True),
        ("P027", "beverages", "Mineral Water", "مياه معدنية", "12.00", "14.00", "12 x 500ml", 70, "water", True, True, True),
        ("P031", "snacks", "Potato Chips", "شيبس بطاطا", "4.50", None, "bag", 55, "chips", False, True, False),
        ("P043", "offers", "Palestinian Olive Oil", "زيت زيتون فلسطيني", "34.00", "42.00", "1L", 25, "oil", True, True, True),
        ("P044", "offers", "Basmati Rice", "أرز بسمتي", "29.00", "35.00", "5kg", 36, "oil", True, True, True),
    ]
    for sku, category, en, ar, price, old, unit, stock, image, featured, best, offer in products:
        session.add(
            Product(
                sku=sku,
                category_id=categories[category].id,
                name_en=en,
                name_ar=ar,
                description_en=f"Fresh {en.lower()} selected for Lomi Market customers.",
                description_ar=f"{ar} مختار بعناية لعملاء لومي ماركت.",
                price=Decimal(price),
                compare_at_price=Decimal(old) if old else None,
                unit=unit,
                stock=stock,
                rating=Decimal("4.70"),
                review_count=84,
                image_url=IMAGES[image],
                freshness_tag="Today delivery",
                is_featured=featured,
                is_best_seller=best,
                is_offer=offer,
            )
        )

    session.add(
        Promotion(
            code="LOMI10",
            name="Lomi launch discount",
            discount_type="percentage",
            discount_value=Decimal("10"),
            minimum_order=Decimal("0"),
            maximum_discount=Decimal("50"),
            per_user_limit=20,
        )
    )
    session.add(
        DeliveryZone(
            name_en="Ramallah Central",
            name_ar="وسط رام الله",
            cities=["Ramallah", "Al-Bireh"],
            delivery_fee=Decimal("7"),
            free_delivery_threshold=Decimal("99"),
            minimum_order=Decimal("0"),
        )
    )
    session.add_all(
        [
            DeliverySlot(label_en="ASAP", label_ar="في أقرب وقت", start_time="09:00", end_time="22:00", day_offset=0),
            DeliverySlot(label_en="Today evening", label_ar="مساء اليوم", start_time="18:00", end_time="20:00", day_offset=0),
            DeliverySlot(label_en="Tomorrow morning", label_ar="صباح الغد", start_time="09:00", end_time="11:00", day_offset=1),
        ]
    )
    session.add(
        Driver(name="Ahmad Saleh", phone="+970599442118", vehicle="Toyota Camry • 31-7842")
    )
    defaults = {
        "store": {"name": "Lomi Market", "open": True, "maintenance_mode": False},
        "commerce": {"currency": "ILS", "service_fee": "2.00", "tax_inclusive": True},
        "support": {"phone": "+970599000000", "whatsapp": "+970599000000"},
        "payments": {"cash_on_delivery": True, "online_card": False},
        "notifications": {"order_updates": True, "promotions": False},
    }
    for key, value in defaults.items():
        session.add(ApplicationSetting(key=key, value=value, is_public=key != "notifications"))
    session.commit()


if __name__ == "__main__":
    from app import models  # noqa: F401
    from app.database import Base, SessionLocal, engine

    Base.metadata.create_all(bind=engine)
    with SessionLocal() as db:
        seed_database(db)
    print("Lomi Market development data seeded.")
