def _first_product(client):
    response = client.get("/api/v1/catalog/products?page=1&page_size=5")
    assert response.status_code == 200
    return response.json()["items"][0]


def _create_address(client, headers):
    response = client.post(
        "/api/v1/addresses",
        headers=headers,
        json={
            "label": "Home",
            "recipient_name": "Sami Ahmad",
            "phone": "0599123456",
            "line1": "Al-Irsal Street, Building 4",
            "city": "Ramallah",
            "latitude": 31.9038,
            "longitude": 35.2034,
            "is_default": True,
        },
    )
    assert response.status_code == 201
    return response.json()


def test_catalog_supports_search_filter_and_pagination(client):
    categories = client.get("/api/v1/catalog/categories").json()
    assert categories[0]["name_en"]
    response = client.get(
        "/api/v1/catalog/products",
        params={"search": "tomato", "category_id": categories[0]["id"], "page_size": 10},
    )
    assert response.status_code == 200
    assert response.json()["total"] >= 1
    assert "tomato" in response.json()["items"][0]["name_en"].lower()


def test_cart_totals_are_server_authoritative(client, customer_headers):
    product = _first_product(client)
    added = client.post(
        "/api/v1/cart/items",
        headers=customer_headers,
        json={"product_id": product["id"], "quantity": 2, "client_price": "0.01"},
    )
    assert added.status_code == 200
    cart = added.json()
    assert cart["subtotal"] == f"{float(product['price']) * 2:.2f}"
    assert cart["total"] != "0.02"

    promo = client.post(
        "/api/v1/cart/promo", headers=customer_headers, json={"code": "LOMI10"}
    )
    assert promo.status_code == 200
    assert float(promo.json()["discount"]) > 0


def test_checkout_is_idempotent_and_deducts_inventory(client, customer_headers):
    product = _first_product(client)
    client.post(
        "/api/v1/cart/items",
        headers=customer_headers,
        json={"product_id": product["id"], "quantity": 2},
    )
    address = _create_address(client, customer_headers)
    payload = {
        "address_id": address["id"],
        "payment_method": "cash_on_delivery",
        "delivery_slot_id": None,
        "notes": "Call outside",
    }
    headers = {**customer_headers, "Idempotency-Key": "checkout-test-1"}
    first = client.post("/api/v1/orders", headers=headers, json=payload)
    second = client.post("/api/v1/orders", headers=headers, json=payload)
    assert first.status_code == 201
    assert second.status_code == 200
    assert first.json()["id"] == second.json()["id"]

    current = client.get(f"/api/v1/catalog/products/{product['id']}").json()
    assert current["stock"] == product["stock"] - 2


def test_customer_cannot_read_another_customers_order(client, customer_headers):
    product = _first_product(client)
    client.post(
        "/api/v1/cart/items",
        headers=customer_headers,
        json={"product_id": product["id"], "quantity": 1},
    )
    address = _create_address(client, customer_headers)
    created = client.post(
        "/api/v1/orders",
        headers={**customer_headers, "Idempotency-Key": "owned-order"},
        json={"address_id": address["id"], "payment_method": "cash_on_delivery"},
    ).json()

    client.post("/api/v1/auth/otp/request", json={"phone": "0599000001"})
    other = client.post(
        "/api/v1/auth/otp/verify", json={"phone": "0599000001", "code": "123456"}
    ).json()
    response = client.get(
        f"/api/v1/orders/{created['id']}",
        headers={"Authorization": f"Bearer {other['access_token']}"},
    )
    assert response.status_code == 404

