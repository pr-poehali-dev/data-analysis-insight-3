"""
Telegram-бот MVP VPN.
Обрабатывает команды: /start, /buy, /key, /help
После выбора тарифа отправляет ссылку на оплату.
После нажатия "Я оплатил" выдаёт ключ из пула и ссылку на личный кабинет.
"""
import os
import json
import hashlib
import psycopg2
import urllib.request
import urllib.parse
from datetime import datetime, timedelta

PLAN_DAYS = {'7': 7, '30': 30, '90': 90}
PLAN_NAMES = {'7': '7 дней', '30': '1 месяц', '90': '3 месяца'}
PLAN_PRICES = {'7': '60 руб', '30': '200 руб', '90': '500 руб'}
PAYMENT_LINKS = {
    '7': 'https://yookassa.ru/my/i/acbmaggaAb-9/l',
    '30': 'https://yookassa.ru/my/i/acbmk0uCW9xF/l',
    '90': 'https://yookassa.ru/my/i/acbmyVbQjTXa/l',
}
SITE_URL = 'https://mvpvpn.poehali.dev'

CORS = {'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'POST, GET, OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type'}

def get_conn():
    return psycopg2.connect(os.environ['DATABASE_URL'])

def schema():
    return os.environ.get('MAIN_DB_SCHEMA', 'public')

def tg(method: str, data: dict):
    token = os.environ['TELEGRAM_BOT_TOKEN']
    url = f'https://api.telegram.org/bot{token}/{method}'
    body = json.dumps(data).encode()
    req = urllib.request.Request(url, data=body, headers={'Content-Type': 'application/json'}, method='POST')
    urllib.request.urlopen(req, timeout=10)

def send(chat_id: int, text: str, reply_markup: dict = None):
    data = {'chat_id': chat_id, 'text': text, 'parse_mode': 'HTML'}
    if reply_markup:
        data['reply_markup'] = reply_markup
    tg('sendMessage', data)

def get_or_create_user(telegram_id: int, username: str, first_name: str):
    s = schema()
    conn = get_conn()
    cur = conn.cursor()
    cur.execute(f"SELECT id FROM {s}.mvp_vpn_users WHERE telegram_id = %s", (telegram_id,))
    row = cur.fetchone()
    if not row:
        login = username or f'tg_{telegram_id}'
        cur.execute(
            f"INSERT INTO {s}.mvp_vpn_users (telegram_id, username, first_name, username_login) VALUES (%s, %s, %s, %s) ON CONFLICT DO NOTHING",
            (telegram_id, username, first_name, login)
        )
        conn.commit()
    conn.close()

def get_subscription(telegram_id: int):
    s = schema()
    conn = get_conn()
    cur = conn.cursor()
    cur.execute(
        f"SELECT plan, expires_at, vpn_key FROM {s}.mvp_vpn_subscriptions WHERE telegram_id = %s ORDER BY expires_at DESC LIMIT 1",
        (telegram_id,)
    )
    row = cur.fetchone()
    conn.close()
    return row

def assign_key(telegram_id: int, plan_days: int) -> str | None:
    s = schema()
    plan_name = {7: '7 дней', 30: '1 месяц', 90: '3 месяца'}.get(plan_days, '1 месяц')
    conn = get_conn()
    cur = conn.cursor()
    cur.execute(f"SELECT id, vpn_key FROM {s}.mvp_vpn_keys_pool WHERE plan = %s AND used = FALSE LIMIT 1", (plan_name,))
    key_row = cur.fetchone()
    if not key_row:
        conn.close()
        return None
    expires_at = datetime.now() + timedelta(days=plan_days)
    cur.execute(f"UPDATE {s}.mvp_vpn_keys_pool SET used = TRUE, assigned_to = %s, assigned_at = NOW() WHERE id = %s", (str(telegram_id), key_row[0]))
    cur.execute(
        f"INSERT INTO {s}.mvp_vpn_subscriptions (telegram_id, plan, expires_at, vpn_key) VALUES (%s, %s, %s, %s)",
        (telegram_id, plan_name, expires_at, key_row[1])
    )
    conn.commit()
    conn.close()
    return key_row[1]

def make_session(telegram_id: int) -> str:
    secret = os.environ.get('TELEGRAM_BOT_TOKEN', 'secret')
    raw = f"tg_session:{telegram_id}:{secret}"
    return hashlib.sha256(raw.encode()).hexdigest()

def ensure_tg_user_login(telegram_id: int):
    s = schema()
    conn = get_conn()
    cur = conn.cursor()
    login = f'tg_{telegram_id}'
    cur.execute(f"SELECT username_login FROM {s}.mvp_vpn_users WHERE telegram_id = %s", (telegram_id,))
    row = cur.fetchone()
    if row and not row[0]:
        cur.execute(f"UPDATE {s}.mvp_vpn_users SET username_login = %s WHERE telegram_id = %s", (login, telegram_id))
        conn.commit()
    conn.close()
    return login

def handler(event: dict, context) -> dict:
    if event.get('httpMethod') == 'OPTIONS':
        return {'statusCode': 200, 'headers': CORS, 'body': ''}

    # Webhook setup check
    if event.get('httpMethod') == 'GET':
        return {'statusCode': 200, 'headers': CORS, 'body': json.dumps({'ok': True, 'bot': 'MVP VPN Bot'})}

    body = json.loads(event.get('body') or '{}')

    message = body.get('message')
    callback = body.get('callback_query')

    if message:
        chat_id = message['chat']['id']
        text = message.get('text', '')
        user = message.get('from', {})
        first_name = user.get('first_name', '')
        username = user.get('username', '')

        get_or_create_user(chat_id, username, first_name)

        if text == '/start':
            send(chat_id,
                f'👋 Привет, <b>{first_name}</b>!\n\n'
                f'Я бот <b>MVP VPN</b> — быстрый и надёжный VPN для работы и отдыха.\n\n'
                f'🔐 TikTok, Instagram, YouTube, Discord и любые игры — без блокировок.\n\n'
                f'Выбери действие:',
                {'inline_keyboard': [
                    [{'text': '💳 Купить подписку', 'callback_data': 'buy'}],
                    [{'text': '🔑 Мой ключ', 'callback_data': 'mykey'}],
                    [{'text': '👤 Личный кабинет', 'url': SITE_URL + '/dashboard'}],
                ]}
            )

        elif text == '/buy':
            send(chat_id, '💳 Выберите тариф:', {'inline_keyboard': [
                [{'text': '⚡ 7 дней — 60 руб', 'callback_data': 'plan_7'}],
                [{'text': '🔥 1 месяц — 200 руб', 'callback_data': 'plan_30'}],
                [{'text': '💎 3 месяца — 500 руб', 'callback_data': 'plan_90'}],
            ]})

        elif text == '/key':
            row = get_subscription(chat_id)
            if row and row[2]:
                active = row[1] > datetime.now() if row[1] else False
                status = '✅ Активна' if active else '❌ Истекла'
                expires = row[1].strftime('%d.%m.%Y') if row[1] else '—'
                send(chat_id,
                    f'🔑 <b>Ваш VPN ключ</b>\n\n'
                    f'<code>{row[2]}</code>\n\n'
                    f'Статус: {status}\n'
                    f'Тариф: {row[0]}\n'
                    f'Истекает: {expires}\n\n'
                    f'👤 <a href="{SITE_URL}/dashboard">Открыть личный кабинет</a>'
                )
            else:
                send(chat_id, '❌ У вас нет активной подписки.\n\nНажмите /buy чтобы купить.')

        elif text == '/help':
            send(chat_id,
                '📌 <b>Команды бота:</b>\n\n'
                '/start — главное меню\n'
                '/buy — купить подписку\n'
                '/key — мой ключ\n'
                '/help — помощь\n\n'
                f'💬 Поддержка: @mvpvpnproxybot'
            )

    elif callback:
        chat_id = callback['message']['chat']['id']
        data = callback.get('data', '')
        user = callback.get('from', {})
        first_name = user.get('first_name', '')
        username = user.get('username', '')

        get_or_create_user(chat_id, username, first_name)
        tg('answerCallbackQuery', {'callback_query_id': callback['id']})

        if data == 'buy':
            send(chat_id, '💳 Выберите тариф:', {'inline_keyboard': [
                [{'text': '⚡ 7 дней — 60 руб', 'callback_data': 'plan_7'}],
                [{'text': '🔥 1 месяц — 200 руб', 'callback_data': 'plan_30'}],
                [{'text': '💎 3 месяца — 500 руб', 'callback_data': 'plan_90'}],
            ]})

        elif data == 'mykey':
            row = get_subscription(chat_id)
            if row and row[2]:
                active = row[1] > datetime.now() if row[1] else False
                status = '✅ Активна' if active else '❌ Истекла'
                expires = row[1].strftime('%d.%m.%Y') if row[1] else '—'
                send(chat_id,
                    f'🔑 <b>Ваш VPN ключ</b>\n\n'
                    f'<code>{row[2]}</code>\n\n'
                    f'Статус: {status}\n'
                    f'Тариф: {row[0]}\n'
                    f'Истекает: {expires}',
                    {'inline_keyboard': [[{'text': '👤 Личный кабинет', 'url': SITE_URL + '/dashboard'}]]}
                )
            else:
                send(chat_id, '❌ У вас нет активной подписки.', {'inline_keyboard': [[{'text': '💳 Купить', 'callback_data': 'buy'}]]})

        elif data.startswith('plan_'):
            days_str = data.split('_')[1]
            plan_name = PLAN_NAMES.get(days_str, '1 месяц')
            price = PLAN_PRICES.get(days_str, '')
            pay_link = PAYMENT_LINKS.get(days_str, '')
            send(chat_id,
                f'💳 <b>Тариф: {plan_name}</b>\n'
                f'Цена: <b>{price}</b>\n\n'
                f'1. Нажмите кнопку «Оплатить»\n'
                f'2. После оплаты нажмите «✅ Я оплатил»\n'
                f'3. Получите ключ прямо здесь',
                {'inline_keyboard': [
                    [{'text': f'💳 Оплатить {price}', 'url': pay_link}],
                    [{'text': '✅ Я оплатил', 'callback_data': f'paid_{days_str}'}],
                    [{'text': '← Назад', 'callback_data': 'buy'}],
                ]}
            )

        elif data.startswith('paid_'):
            days_str = data.split('_')[1]
            days = PLAN_DAYS.get(days_str, 30)
            plan_name = PLAN_NAMES.get(days_str, '1 месяц')

            vpn_key = assign_key(chat_id, days)
            ensure_tg_user_login(chat_id)
            session = make_session(chat_id)
            cabinet_url = f'{SITE_URL}/dashboard'

            if vpn_key:
                expires = (datetime.now() + timedelta(days=days)).strftime('%d.%m.%Y')
                send(chat_id,
                    f'🎉 <b>Подписка активирована!</b>\n\n'
                    f'📦 Тариф: {plan_name}\n'
                    f'📅 Истекает: {expires}\n\n'
                    f'🔑 <b>Ваш ключ:</b>\n'
                    f'<code>{vpn_key}</code>\n\n'
                    f'Нажмите на ключ чтобы скопировать, затем вставьте в приложение VPN.\n\n'
                    f'👤 Все ваши данные доступны в личном кабинете:',
                    {'inline_keyboard': [
                        [{'text': '👤 Открыть личный кабинет', 'url': cabinet_url}],
                        [{'text': '❓ Как подключиться?', 'url': SITE_URL + '/how-it-works'}],
                    ]}
                )
            else:
                send(chat_id,
                    '⚠️ Ключи временно закончились. Мы выдадим ключ вручную в течение 15 минут.\n\n'
                    'Спасибо за понимание! 🙏',
                    {'inline_keyboard': [[{'text': '👤 Личный кабинет', 'url': cabinet_url}]]}
                )

    return {'statusCode': 200, 'headers': CORS, 'body': json.dumps({'ok': True})}
