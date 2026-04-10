"""
Telegram бот MVP VPN — приём обновлений от Telegram через вебхук. v2
Обрабатывает команды /start, /buy, /mykeys, /help и колбэки кнопок.
Принимает уведомления об оплате от ЮКасса и выдаёт VPN-ключ пользователю.
"""

import json
import os
import uuid
import requests
import psycopg2
from datetime import datetime, timedelta

TELEGRAM_API = "https://api.telegram.org/bot"
SCHEMA = os.environ.get("MAIN_DB_SCHEMA", "public")

PLANS = {
    "7d": {"name": "7 дней", "price": 60, "days": 7},
    "1m": {"name": "1 месяц", "price": 200, "days": 30},
    "3m": {"name": "3 месяца", "price": 500, "days": 90},
}


def get_db():
    return psycopg2.connect(os.environ["DATABASE_URL"])


def send_message(chat_id, text, reply_markup=None):
    token = os.environ["TELEGRAM_BOT_TOKEN"]
    payload = {"chat_id": chat_id, "text": text, "parse_mode": "HTML"}
    if reply_markup:
        payload["reply_markup"] = json.dumps(reply_markup)
    requests.post(f"{TELEGRAM_API}{token}/sendMessage", json=payload, timeout=10)


def send_invoice(chat_id, plan_key, plan, user_id):
    token = os.environ["TELEGRAM_BOT_TOKEN"]
    shop_id = os.environ["YUKASSA_SHOP_ID"]
    secret_key = os.environ["YUKASSA_SECRET_KEY"]

    idempotence_key = str(uuid.uuid4())
    payment_data = {
        "amount": {"value": str(plan["price"]) + ".00", "currency": "RUB"},
        "confirmation": {"type": "redirect", "return_url": f"https://t.me/mvpvpnproxybot"},
        "capture": True,
        "description": f"MVP VPN — {plan['name']} (tg:{user_id})",
        "metadata": {"telegram_id": str(user_id), "plan": plan_key},
    }

    resp = requests.post(
        "https://api.yookassa.ru/v3/payments",
        json=payment_data,
        auth=(shop_id, secret_key),
        headers={"Idempotence-Key": idempotence_key},
        timeout=15,
    )
    data = resp.json()

    if resp.status_code == 200 and data.get("confirmation", {}).get("confirmation_url"):
        pay_url = data["confirmation"]["confirmation_url"]
        payment_id = data["id"]

        conn = get_db()
        cur = conn.cursor()
        cur.execute(
            f"INSERT INTO {SCHEMA}.mvp_vpn_payments (telegram_id, plan, payment_id, amount, status) VALUES (%s, %s, %s, %s, 'pending')",
            (user_id, plan_key, payment_id, plan["price"]),
        )
        conn.commit()
        cur.close()
        conn.close()

        keyboard = {"inline_keyboard": [[{"text": f"💳 Оплатить {plan['price']} ₽", "url": pay_url}]]}
        send_message(
            chat_id,
            f"🔐 <b>MVP VPN — {plan['name']}</b>\n\n"
            f"Цена: <b>{plan['price']} ₽</b>\n"
            f"Срок: <b>{plan['name']}</b>\n\n"
            f"Нажми кнопку ниже для оплаты. После успешной оплаты ключ придёт автоматически ✅",
            reply_markup=keyboard,
        )
    else:
        send_message(chat_id, "❌ Ошибка при создании платежа. Попробуй позже или напиши нам.")


def ensure_user(telegram_id, username, first_name):
    conn = get_db()
    cur = conn.cursor()
    cur.execute(
        f"SELECT id FROM {SCHEMA}.mvp_vpn_users WHERE telegram_id = %s",
        (telegram_id,),
    )
    if not cur.fetchone():
        cur.execute(
            f"INSERT INTO {SCHEMA}.mvp_vpn_users (telegram_id, username, first_name) VALUES (%s, %s, %s)",
            (telegram_id, username, first_name),
        )
        conn.commit()
    cur.close()
    conn.close()


def get_user_keys(telegram_id):
    conn = get_db()
    cur = conn.cursor()
    cur.execute(
        f"SELECT vpn_key, plan, expires_at FROM {SCHEMA}.mvp_vpn_subscriptions WHERE telegram_id = %s ORDER BY created_at DESC",
        (telegram_id,),
    )
    rows = cur.fetchall()
    cur.close()
    conn.close()
    return rows


def assign_key(telegram_id, plan_key):
    conn = get_db()
    cur = conn.cursor()

    cur.execute(
        f"SELECT id, vpn_key FROM {SCHEMA}.mvp_vpn_keys_pool WHERE used = false AND plan = %s LIMIT 1 FOR UPDATE SKIP LOCKED",
        (plan_key,),
    )
    row = cur.fetchone()
    if not row:
        cur.execute(
            f"SELECT id, vpn_key FROM {SCHEMA}.mvp_vpn_keys_pool WHERE used = false LIMIT 1 FOR UPDATE SKIP LOCKED",
        )
        row = cur.fetchone()

    if not row:
        cur.close()
        conn.close()
        return None

    key_id, vpn_key = row
    plan = PLANS[plan_key]
    expires_at = datetime.utcnow() + timedelta(days=plan["days"])

    cur.execute(
        f"UPDATE {SCHEMA}.mvp_vpn_keys_pool SET used = true, assigned_to = %s, assigned_at = now() WHERE id = %s",
        (str(telegram_id), key_id),
    )
    cur.execute(
        f"INSERT INTO {SCHEMA}.mvp_vpn_subscriptions (telegram_id, plan, expires_at, vpn_key) VALUES (%s, %s, %s, %s)",
        (telegram_id, plan_key, expires_at, vpn_key),
    )
    conn.commit()
    cur.close()
    conn.close()
    return vpn_key, expires_at


def handle_yukassa_notification(body):
    shop_id = os.environ["YUKASSA_SHOP_ID"]
    secret_key = os.environ["YUKASSA_SECRET_KEY"]

    event = body.get("event")
    if event != "payment.succeeded":
        return

    payment = body.get("object", {})
    payment_id = payment.get("id")
    metadata = payment.get("metadata", {})
    telegram_id = int(metadata.get("telegram_id", 0))
    plan_key = metadata.get("plan", "1m")

    if not telegram_id or not plan_key:
        return

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
        return

    cur.execute(
        f"UPDATE {SCHEMA}.mvp_vpn_payments SET status = 'succeeded' WHERE payment_id = %s",
        (payment_id,),
    )
    conn.commit()
    cur.close()
    conn.close()

    result = assign_key(telegram_id, plan_key)
    plan = PLANS.get(plan_key, PLANS["1m"])

    if result:
        vpn_key, expires_at = result
        expires_str = expires_at.strftime("%d.%m.%Y")
        send_message(
            telegram_id,
            f"✅ <b>Оплата прошла успешно!</b>\n\n"
            f"📦 Тариф: <b>{plan['name']}</b>\n"
            f"📅 Действует до: <b>{expires_str}</b>\n\n"
            f"🔑 <b>Твой VPN-ключ:</b>\n<code>{vpn_key}</code>\n\n"
            f"Скопируй ключ и вставь в приложение V2RayTun.\n"
            f"Если нужна помощь с настройкой — нажми /help",
        )
    else:
        send_message(
            telegram_id,
            "✅ Оплата прошла, но свободных ключей временно нет.\n"
            "Мы выдадим ключ в ближайшее время. Напишите нам если ждёте долго.",
        )


def handle_start(chat_id, telegram_id, username, first_name):
    ensure_user(telegram_id, username, first_name)
    name = first_name or username or "Привет"
    keyboard = {
        "inline_keyboard": [
            [{"text": "🛒 Купить VPN-ключ", "callback_data": "buy"}],
            [{"text": "🔑 Мои ключи", "callback_data": "mykeys"}],
            [{"text": "❓ Помощь", "callback_data": "help"}],
        ]
    }
    send_message(
        chat_id,
        f"👋 <b>Привет, {name}!</b>\n\n"
        f"Это бот <b>MVP VPN</b> — быстрый и стабильный VPN на протоколе VLESS.\n\n"
        f"Выбери действие:",
        reply_markup=keyboard,
    )


def handle_buy(chat_id):
    keyboard = {
        "inline_keyboard": [
            [{"text": "7 дней — 60 ₽", "callback_data": "plan_7d"}],
            [{"text": "1 месяц — 200 ₽ 🔥", "callback_data": "plan_1m"}],
            [{"text": "3 месяца — 500 ₽ 💎", "callback_data": "plan_3m"}],
            [{"text": "◀️ Назад", "callback_data": "start"}],
        ]
    }
    send_message(chat_id, "💳 <b>Выбери тариф:</b>", reply_markup=keyboard)


def handle_mykeys(chat_id, telegram_id):
    keys = get_user_keys(telegram_id)
    if not keys:
        keyboard = {"inline_keyboard": [[{"text": "🛒 Купить ключ", "callback_data": "buy"}]]}
        send_message(chat_id, "У тебя пока нет активных ключей.", reply_markup=keyboard)
        return

    text = "🔑 <b>Твои VPN-ключи:</b>\n\n"
    for vpn_key, plan, expires_at in keys:
        plan_name = PLANS.get(plan, {}).get("name", plan)
        expires_str = expires_at.strftime("%d.%m.%Y") if expires_at else "—"
        text += f"📦 <b>{plan_name}</b> (до {expires_str})\n<code>{vpn_key}</code>\n\n"

    keyboard = {"inline_keyboard": [[{"text": "🛒 Купить ещё", "callback_data": "buy"}]]}
    send_message(chat_id, text, reply_markup=keyboard)


def handle_help(chat_id):
    send_message(
        chat_id,
        "❓ <b>Как подключиться:</b>\n\n"
        "1. Скачай приложение <b>V2RayTun</b>\n"
        "   iOS: App Store → V2RayTun\n"
        "   Android: Google Play → V2RayTun\n\n"
        "2. Открой бота и нажми <b>Мои ключи</b>\n"
        "3. Скопируй ключ и вставь в V2RayTun\n"
        "4. Нажми <b>Подключиться</b> ✅\n\n"
        "Если что-то не работает — пиши сюда, поможем!",
    )


def handler(event: dict, context) -> dict:
    """Вебхук Telegram бота MVP VPN — обрабатывает сообщения и уведомления ЮКасса."""

    cors = {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
    }

    if event.get("httpMethod") == "OPTIONS":
        return {"statusCode": 200, "headers": cors, "body": ""}

    body_raw = event.get("body", "{}")
    try:
        body = json.loads(body_raw) if body_raw else {}
    except Exception:
        body = {}

    if not body:
        return {"statusCode": 200, "headers": cors, "body": json.dumps({"ok": True})}

    if "event" in body and body.get("event", "").startswith("payment."):
        handle_yukassa_notification(body)
        return {"statusCode": 200, "headers": cors, "body": json.dumps({"ok": True})}

    message = body.get("message")
    callback = body.get("callback_query")

    if callback:
        chat_id = callback["message"]["chat"]["id"]
        telegram_id = callback["from"]["id"]
        username = callback["from"].get("username", "")
        first_name = callback["from"].get("first_name", "")
        data = callback.get("data", "")

        token = os.environ["TELEGRAM_BOT_TOKEN"]
        requests.post(
            f"{TELEGRAM_API}{token}/answerCallbackQuery",
            json={"callback_query_id": callback["id"]},
            timeout=5,
        )

        if data == "start":
            handle_start(chat_id, telegram_id, username, first_name)
        elif data == "buy":
            handle_buy(chat_id)
        elif data == "mykeys":
            handle_mykeys(chat_id, telegram_id)
        elif data == "help":
            handle_help(chat_id)
        elif data.startswith("plan_"):
            plan_key = data[5:]
            plan = PLANS.get(plan_key)
            if plan:
                ensure_user(telegram_id, username, first_name)
                send_invoice(chat_id, plan_key, plan, telegram_id)

    elif message:
        chat_id = message["chat"]["id"]
        telegram_id = message["from"]["id"]
        username = message["from"].get("username", "")
        first_name = message["from"].get("first_name", "")
        text = message.get("text", "")

        if text.startswith("/start"):
            handle_start(chat_id, telegram_id, username, first_name)
        elif text.startswith("/buy"):
            ensure_user(telegram_id, username, first_name)
            handle_buy(chat_id)
        elif text.startswith("/mykeys"):
            handle_mykeys(chat_id, telegram_id)
        elif text.startswith("/help"):
            handle_help(chat_id)
        else:
            handle_start(chat_id, telegram_id, username, first_name)

    return {"statusCode": 200, "headers": cors, "body": json.dumps({"ok": True})}