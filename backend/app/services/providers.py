from abc import ABC, abstractmethod
from datetime import UTC, datetime

from app.models import NotificationRecord, Order, PaymentRecord, User


class NotificationProvider(ABC):
    @abstractmethod
    def send(self, record: NotificationRecord) -> None: ...


class DevelopmentNotificationProvider(NotificationProvider):
    def send(self, record: NotificationRecord) -> None:
        record.status = "sent"
        record.sent_at = datetime.now(UTC)


class PaymentProvider(ABC):
    @abstractmethod
    def create(self, order: Order) -> PaymentRecord: ...

    @abstractmethod
    def refund(self, payment: PaymentRecord) -> None: ...


class CashOnDeliveryProvider(PaymentProvider):
    def create(self, order: Order) -> PaymentRecord:
        return PaymentRecord(
            order_id=order.id,
            provider="cash",
            amount=order.total,
            currency=order.currency,
            status="pending",
            idempotency_key=f"cash:{order.id}",
        )

    def refund(self, payment: PaymentRecord) -> None:
        payment.status = "not_applicable"


def queue_order_notification(db, user: User, order: Order, event: str) -> NotificationRecord:
    record = NotificationRecord(
        user_id=user.id,
        order_id=order.id,
        event=event,
        recipient=user.phone,
        payload={"order_id": order.id, "order_number": order.order_number, "status": order.status},
    )
    db.add(record)
    DevelopmentNotificationProvider().send(record)
    return record
