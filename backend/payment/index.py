"""
Создание платежа в ЮКасса для оплаты VPN-ключа на сайте.
Принимает plan и email, возвращает ссылку на оплату.
"""

import json
import os
import uuid
import requests
import psycopg2

SCHEMA = os.environ.get("MAIN_DB_SCHEMA", "public")

PLANS = {
    "30d":  {"name": "30 дней",  "price": 200,  "days": 30},
    "90d":  {"name": "90 дней",  "price": 500,  "days": 90},
    "180d": {"name": "180 дней", "price": 900,  "days": 180},
    "365d": {"name": "365 дней", "price": 1500, "days": 365},
}

CORS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
}


def get_db():
    return psycopg2.connect(os.environ["DATABASE_URL"])


def handler(event: dict, context) -> dict:
    """Создаёт платёж в ЮКасса и возвращает ссылку для оплаты VPN-ключа."""

    if event.get("httpMethod") == "OPTIONS":
        return {"statusCode": 200, "headers": CORS, "body": ""}

    try:
        body = json.loads(event.get("body") or "{}")
    except Exception:
        body = {}

    plan_key = body.get("plan", "")
    email = body.get("email", "")

    plan = PLANS.get(plan_key)
    if not plan:
        return {
            "statusCode": 400,
            "headers": CORS,
            "body": json.dumps({"error": "Неверный тариф"}),
        }

    site_url = body.get("return_url", "https://mvpvpn.poehali.dev")
    idempotence_key = str(uuid.uuid4())

    payment_data = {
        "amount": {"value": f"{plan['price']}.00", "currency": "RUB"},
        "confirmation": {
            "type": "redirect",
            "return_url": f"{site_url}/success?plan={plan_key}",
        },
        "capture": True,
        "description": f"MVP VPN — {plan['name']}",
        "metadata": {"plan": plan_key},
    }

    if email:
        payment_data["receipt"] = {
            "customer": {"email": email},
            "items": [
                {
                    "description": f"MVP VPN {plan['name']}",
                    "quantity": "1",
                    "amount": {"value": f"{plan['price']}.00", "currency": "RUB"},
                    "vat_code": 1,
                    "payment_mode": "full_payment",
                    "payment_subject": "service",
                }
            ],
        }

    shop_id = os.environ["YUKASSA_SHOP_ID"]
    secret_key = os.environ["YUKASSA_SECRET_KEY"]

    resp = requests.post(
        "https://api.yookassa.ru/v3/payments",
        json=payment_data,
        auth=(shop_id, secret_key),
        headers={"Idempotence-Key": idempotence_key},
        timeout=15,
    )
    data = resp.json()

    if resp.status_code != 200 or "id" not in data:
        return {
            "statusCode": 502,
            "headers": CORS,
            "body": json.dumps({"error": "Ошибка создания платежа", "detail": data}),
        }

    payment_id = data["id"]
    pay_url = data["confirmation"]["confirmation_url"]

    conn = get_db()
    cur = conn.cursor()
    cur.execute(
        f"INSERT INTO {SCHEMA}.mvp_vpn_payments (telegram_id, plan, payment_id, amount, status) VALUES (%s, %s, %s, %s, 'pending')",
        (0, plan_key, payment_id, plan["price"]),
    )
    conn.commit()
    cur.close()
    conn.close()

    return {
        "statusCode": 200,
        "headers": CORS,
        "body": json.dumps({"payment_id": payment_id, "pay_url": pay_url}),
    }
