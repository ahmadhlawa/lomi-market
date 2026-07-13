from io import BytesIO


def test_admin_can_create_product_and_audit_is_recorded(client, admin_headers):
    category = client.get("/api/v1/catalog/categories").json()[0]
    response = client.post(
        "/api/v1/admin/products",
        headers=admin_headers,
        json={
            "sku": "TEST-001",
            "category_id": category["id"],
            "name_en": "Test Product",
            "name_ar": "منتج تجريبي",
            "description_en": "Integration test product",
            "description_ar": "منتج لاختبار التكامل",
            "price": "12.50",
            "unit": "piece",
            "stock": 10,
            "is_active": True,
        },
    )
    assert response.status_code == 201
    audits = client.get("/api/v1/admin/audit-logs", headers=admin_headers).json()
    assert any(item["action"] == "product.create" for item in audits["items"])


def test_upload_rejects_non_image_content(client, admin_headers):
    response = client.post(
        "/api/v1/admin/media",
        headers=admin_headers,
        files={"file": ("payload.jpg", BytesIO(b"not an image"), "image/jpeg")},
    )
    assert response.status_code == 422
    assert response.json()["code"] == "invalid_image"


def test_admin_can_update_order_status(client, admin_headers, customer_headers):
    product = client.get("/api/v1/catalog/products?page_size=1").json()["items"][0]
    client.post(
        "/api/v1/cart/items",
        headers=customer_headers,
        json={"product_id": product["id"], "quantity": 1},
    )
    address = client.post(
        "/api/v1/addresses",
        headers=customer_headers,
        json={
            "label": "Home",
            "recipient_name": "Sami",
            "phone": "0599123456",
            "line1": "Ramallah",
            "city": "Ramallah",
            "is_default": True,
        },
    ).json()
    order = client.post(
        "/api/v1/orders",
        headers={**customer_headers, "Idempotency-Key": "status-order"},
        json={"address_id": address["id"], "payment_method": "cash_on_delivery"},
    ).json()
    response = client.patch(
        f"/api/v1/admin/orders/{order['id']}/status",
        headers=admin_headers,
        json={"status": "confirmed", "note": "Accepted by store"},
    )
    assert response.status_code == 200
    assert response.json()["status"] == "confirmed"
    assert response.json()["status_history"][-1]["status"] == "confirmed"
