from datetime import datetime
from decimal import Decimal
from typing import Literal

from pydantic import BaseModel, EmailStr, Field, field_validator


class OtpRequestIn(BaseModel):
    phone: str = Field(min_length=8, max_length=30)


class OtpVerifyIn(OtpRequestIn):
    code: str = Field(pattern=r"^\d{6}$")


class RefreshIn(BaseModel):
    refresh_token: str = Field(min_length=32, max_length=500)


class AdminLoginIn(BaseModel):
    email: EmailStr
    password: str = Field(min_length=10, max_length=200)


class ProfileUpdateIn(BaseModel):
    full_name: str | None = Field(None, min_length=2, max_length=120)
    language: Literal["en", "ar"] | None = None
    notifications_enabled: bool | None = None
    promotional_notifications: bool | None = None


class ProductCreateIn(BaseModel):
    sku: str = Field(min_length=2, max_length=80)
    category_id: str
    name_en: str = Field(min_length=2, max_length=180)
    name_ar: str = Field(min_length=2, max_length=180)
    description_en: str = Field(default="", max_length=5000)
    description_ar: str = Field(default="", max_length=5000)
    price: Decimal = Field(gt=0, max_digits=12, decimal_places=2)
    compare_at_price: Decimal | None = Field(None, gt=0, max_digits=12, decimal_places=2)
    unit: str = Field(default="piece", min_length=1, max_length=40)
    stock: int = Field(default=0, ge=0, le=1_000_000)
    low_stock_threshold: int = Field(default=5, ge=0, le=100_000)
    image_url: str | None = Field(None, max_length=500)
    freshness_tag: str | None = Field(None, max_length=120)
    is_featured: bool = False
    is_best_seller: bool = False
    is_offer: bool = False
    is_active: bool = True

    @field_validator("compare_at_price")
    @classmethod
    def compare_price_is_valid(cls, value: Decimal | None, info):
        price = info.data.get("price")
        if value is not None and price is not None and value <= price:
            raise ValueError("compare_at_price must be greater than price")
        return value


class ProductUpdateIn(BaseModel):
    category_id: str | None = None
    name_en: str | None = Field(None, min_length=2, max_length=180)
    name_ar: str | None = Field(None, min_length=2, max_length=180)
    description_en: str | None = Field(None, max_length=5000)
    description_ar: str | None = Field(None, max_length=5000)
    price: Decimal | None = Field(None, gt=0, max_digits=12, decimal_places=2)
    compare_at_price: Decimal | None = Field(None, gt=0, max_digits=12, decimal_places=2)
    unit: str | None = Field(None, min_length=1, max_length=40)
    stock: int | None = Field(None, ge=0, le=1_000_000)
    low_stock_threshold: int | None = Field(None, ge=0, le=100_000)
    image_url: str | None = Field(None, max_length=500)
    freshness_tag: str | None = Field(None, max_length=120)
    is_featured: bool | None = None
    is_best_seller: bool | None = None
    is_offer: bool | None = None
    is_active: bool | None = None


class CategoryIn(BaseModel):
    slug: str = Field(pattern=r"^[a-z0-9]+(?:-[a-z0-9]+)*$", min_length=2, max_length=100)
    name_en: str = Field(min_length=2, max_length=120)
    name_ar: str = Field(min_length=2, max_length=120)
    description_en: str | None = Field(None, max_length=2000)
    description_ar: str | None = Field(None, max_length=2000)
    icon: str | None = Field(None, max_length=80)
    image_url: str | None = Field(None, max_length=500)
    sort_order: int = Field(0, ge=0, le=10_000)
    is_active: bool = True


class CartItemIn(BaseModel):
    product_id: str
    quantity: int = Field(ge=1, le=99)
    client_price: Decimal | None = None


class CartItemUpdateIn(BaseModel):
    quantity: int = Field(ge=1, le=99)


class PromoApplyIn(BaseModel):
    code: str = Field(min_length=2, max_length=50)


class AddressIn(BaseModel):
    label: str = Field(min_length=1, max_length=80)
    recipient_name: str = Field(min_length=2, max_length=120)
    phone: str = Field(min_length=8, max_length=30)
    line1: str = Field(min_length=2, max_length=250)
    line2: str | None = Field(None, max_length=250)
    city: str = Field(default="Ramallah", min_length=2, max_length=100)
    latitude: Decimal | None = Field(None, ge=-90, le=90)
    longitude: Decimal | None = Field(None, ge=-180, le=180)
    delivery_instructions: str | None = Field(None, max_length=1000)
    is_default: bool = False


class CheckoutIn(BaseModel):
    address_id: str
    delivery_slot_id: str | None = None
    payment_method: Literal["cash_on_delivery"] = "cash_on_delivery"
    notes: str | None = Field(None, max_length=1000)


class OrderStatusIn(BaseModel):
    status: Literal[
        "confirmed", "preparing", "picked_up", "out_for_delivery", "delivered", "cancelled"
    ]
    note: str | None = Field(None, max_length=1000)
    driver_id: str | None = None


class PromotionIn(BaseModel):
    code: str = Field(pattern=r"^[A-Za-z0-9_-]+$", min_length=2, max_length=50)
    name: str = Field(min_length=2, max_length=160)
    discount_type: Literal["percentage", "fixed"]
    discount_value: Decimal = Field(gt=0, max_digits=12, decimal_places=2)
    minimum_order: Decimal = Field(default=0, ge=0)
    maximum_discount: Decimal | None = Field(None, gt=0)
    starts_at: datetime | None = None
    ends_at: datetime | None = None
    usage_limit: int | None = Field(None, ge=1)
    per_user_limit: int = Field(default=1, ge=1)
    is_active: bool = True


class DeliveryZoneIn(BaseModel):
    name_en: str = Field(min_length=2, max_length=120)
    name_ar: str = Field(min_length=2, max_length=120)
    cities: list[str] = Field(min_length=1, max_length=50)
    delivery_fee: Decimal = Field(ge=0)
    free_delivery_threshold: Decimal = Field(ge=0)
    minimum_order: Decimal = Field(ge=0)
    estimated_minutes_min: int = Field(ge=1, le=1440)
    estimated_minutes_max: int = Field(ge=1, le=1440)
    is_active: bool = True


class DeliverySlotIn(BaseModel):
    label_en: str = Field(min_length=2, max_length=120)
    label_ar: str = Field(min_length=2, max_length=120)
    start_time: str = Field(pattern=r"^(?:[01]\d|2[0-3]):[0-5]\d$")
    end_time: str = Field(pattern=r"^(?:[01]\d|2[0-3]):[0-5]\d$")
    day_offset: int = Field(default=0, ge=0, le=14)
    capacity: int = Field(default=50, ge=1, le=10_000)
    is_active: bool = True


class SettingIn(BaseModel):
    value: dict
    description: str | None = Field(None, max_length=1000)
    is_public: bool = False


class AdminUserIn(BaseModel):
    email: EmailStr
    password: str = Field(min_length=12, max_length=200)
    role: Literal["admin", "manager", "operator"] = "operator"
    permissions: list[str] = Field(default_factory=list, max_length=50)


class AdminUserUpdateIn(BaseModel):
    role: Literal["admin", "manager", "operator"]
    permissions: list[str] = Field(default_factory=list, max_length=50)
    is_active: bool = True


class DriverIn(BaseModel):
    name: str = Field(min_length=2, max_length=120)
    phone: str = Field(min_length=8, max_length=30)
    vehicle: str | None = Field(None, max_length=160)
    is_active: bool = True


class DeviceTokenIn(BaseModel):
    token: str = Field(min_length=10, max_length=500)
    platform: Literal["ios", "android", "web"]
