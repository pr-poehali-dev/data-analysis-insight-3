"""
Вебхук от ЮКасса — получает уведомление об успешной оплате,
сохраняет payment_id и возвращает ключ для запроса со страницы /success.
"""

import json
import os
import psycopg2
from datetime import datetime, timedelta

SCHEMA = os.environ.get("MAIN_DB_SCHEMA", "public")

PLANS = {
    "30d":  {"name": "30 дней",  "days": 30,  "key": "https://vpnmvp.kak.si/NLQSfrBQUq/q36g5ys7w3i3h2r9"},
    "90d":  {"name": "90 дней",  "days": 90,  "key": "https://vpnmvp.kak.si/NLQSfrBQUq/rqjj7xg58uc0k1xe"},
    "180d": {"name": "180 дней", "days": 180, "key": "https://vpnmvp.kak.si/NLQSfrBQUq/0q48b8yl9od8ld6p"},
    "365d": {"name": "365 дней", "days": 365, "key": "https://vpnmvp.kak.si/NLQSfrBQUq/u1m1jxrij5nwnct5"},
}

CORS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
}


def get_db():
    return psycopg2.connect(os.environ["DATABASE_URL"])


def handler(event: dict, context) -> dict:
    """
    Два режима:
    1. POST от ЮКасса (event payment.succeeded) — помечает платёж оплаченным.
    2. GET ?payment_id=xxx от фронтенда — возвращает ключ если платёж оплачен.
    """

    if event.get("httpMethod") == "OPTIONS":
        return {"statusCode": 200, "headers": CORS, "body": ""}

    method = event.get("httpMethod", "GET")

    if method == "GET":
        params = event.get("queryStringParameters") or {}
        payment_id = params.get("payment_id", "")

        if not payment_id:
            return {"statusCode": 400, "headers": CORS, "body": json.dumps({"error": "payment_id required"})}

        conn = get_db()
        cur = conn.cursor()
        cur.execute(
            f"SELECT plan, status FROM {SCHEMA}.mvp_vpn_payments WHERE payment_id = %s",
            (payment_id,),
        )
        row = cur.fetchone()
        cur.close()
        conn.close()

        if not row:
            return {"statusCode": 404, "headers": CORS, "body": json.dumps({"status": "not_found"})}

        plan_key, status = row
        if status != "succeeded":
            return {"statusCode": 200, "headers": CORS, "body": json.dumps({"status": "pending"})}

        plan = PLANS.get(plan_key, PLANS["30d"])
        return {
            "statusCode": 200,
            "headers": CORS,
            "body": json.dumps({
                "status": "succeeded",
                "vpn_key": plan["key"],
                "plan_name": plan["name"],
            }),
        }

    if method == "POST":
        try:
            body = json.loads(event.get("body") or "{}")
        except Exception:
            body = {}

        event_type = body.get("event", "")
        if event_type != "payment.succeeded":
            return {"statusCode": 200, "headers": CORS, "body": json.dumps({"ok": True})}

        payment_obj = body.get("object", {})
        payment_id = payment_obj.get("id", "")
        metadata = payment_obj.get("metadata", {})
        plan_key = metadata.get("plan", "30d")

        if not payment_id:
            return {"statusCode": 200, "headers": CORS, "body": json.dumps({"ok": True})}

        conn = get_db()
        cur = conn.cursor()

        cur.execute(
            f"SELECT status FROM {SCHEMA}.mvp_vpn_payments WHERE payment_id = %s",
            (payment_id,),
        )
        row = cur.fetchone()

        if row and row[0] == "succeeded":
            cur.close()
            conn.close()
            return {"statusCode": 200, "headers": CORS, "body": json.dumps({"ok": True})}

        if row:
            cur.execute(
                f"UPDATE {SCHEMA}.mvp_vpn_payments SET status = 'succeeded', plan = %s WHERE payment_id = %s",
                (plan_key, payment_id),
            )
        else:
            plan = PLANS.get(plan_key, PLANS["30d"])
            cur.execute(
                f"INSERT INTO {SCHEMA}.mvp_vpn_payments (telegram_id, plan, payment_id, amount, status) VALUES (0, %s, %s, 0, 'succeeded')",
                (plan_key, payment_id),
            )

        conn.commit()
        cur.close()
        conn.close()

        return {"statusCode": 200, "headers": CORS, "body": json.dumps({"ok": True})}

    return {"statusCode": 405, "headers": CORS, "body": json.dumps({"error": "Method not allowed"})}
