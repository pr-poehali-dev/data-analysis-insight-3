"""
Админ-панель MVP VPN.
POST /login — вход по паролю
GET /users — список пользователей и их подписок
POST /assign — выдать ключ пользователю вручную
GET /keys — состояние пула ключей
"""
import os
import json
import hashlib
import psycopg2
from datetime import datetime, timedelta

CORS_HEADERS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, X-Admin-Token',
}

PLAN_DAYS = {'7 дней': 7, '1 месяц': 30, '3 месяца': 90}

def get_conn():
    return psycopg2.connect(os.environ['DATABASE_URL'])

def get_schema():
    return os.environ.get('MAIN_DB_SCHEMA', 'public')

def make_admin_token() -> str:
    pw = os.environ.get('ADMIN_PASSWORD', '')
    return hashlib.sha256(f"admin:{pw}".encode()).hexdigest()

def is_authorized(event: dict) -> bool:
    token = event.get('headers', {}).get('X-Admin-Token', '')
    return token == make_admin_token()

def handler(event: dict, context) -> dict:
    if event.get('httpMethod') == 'OPTIONS':
        return {'statusCode': 200, 'headers': CORS_HEADERS, 'body': ''}

    method = event.get('httpMethod', 'GET')
    path = event.get('path', '/')
    schema = get_schema()
    body = json.loads(event.get('body') or '{}')

    # POST login
    if method == 'POST' and body.get('action') == 'login':
        password = body.get('password', '')
        if password == os.environ.get('ADMIN_PASSWORD', ''):
            return {'statusCode': 200, 'headers': CORS_HEADERS, 'body': json.dumps({'ok': True, 'token': make_admin_token()})}
        return {'statusCode': 401, 'headers': CORS_HEADERS, 'body': json.dumps({'error': 'Неверный пароль'})}

    if not is_authorized(event):
        return {'statusCode': 401, 'headers': CORS_HEADERS, 'body': json.dumps({'error': 'Unauthorized'})}

    # GET /keys — пул ключей
    if method == 'GET' and 'keys' in path:
        conn = get_conn()
        cur = conn.cursor()
        cur.execute(f"SELECT id, vpn_key, plan, used, assigned_to, assigned_at FROM {schema}.mvp_vpn_keys_pool ORDER BY plan, used, id")
        rows = cur.fetchall()
        conn.close()
        return {'statusCode': 200, 'headers': CORS_HEADERS, 'body': json.dumps({'keys': [
            {'id': r[0], 'vpn_key': r[1], 'plan': r[2], 'used': r[3], 'assigned_to': r[4], 'assigned_at': r[5].isoformat() if r[5] else None}
            for r in rows
        ]})}

    # GET /users — пользователи + подписки
    if method == 'GET' and 'users' in path:
        conn = get_conn()
        cur = conn.cursor()
        cur.execute(f"""
            SELECT u.id, u.username_login, u.created_at,
                   s.plan, s.expires_at, s.vpn_key
            FROM {schema}.mvp_vpn_users u
            LEFT JOIN {schema}.mvp_vpn_subscriptions s ON s.telegram_id = u.telegram_id
            WHERE u.username_login IS NOT NULL
            ORDER BY u.created_at DESC
        """)
        rows = cur.fetchall()
        conn.close()
        users = {}
        for r in rows:
            uid = r[0]
            if uid not in users:
                users[uid] = {'id': uid, 'username': r[1], 'created_at': r[2].isoformat() if r[2] else None, 'subscription': None}
            if r[3]:
                active = r[4] > datetime.now() if r[4] else False
                users[uid]['subscription'] = {'plan': r[3], 'expires_at': r[4].isoformat() if r[4] else None, 'vpn_key': r[5], 'active': active}
        return {'statusCode': 200, 'headers': CORS_HEADERS, 'body': json.dumps({'users': list(users.values())})}

    # POST assign — выдать ключ пользователю
    if method == 'POST' and body.get('action') == 'assign':
        username = body.get('username', '').strip().lower()
        plan = body.get('plan', '')
        custom_key = body.get('vpn_key', '').strip()

        if not username or not plan:
            return {'statusCode': 400, 'headers': CORS_HEADERS, 'body': json.dumps({'error': 'username и plan обязательны'})}

        conn = get_conn()
        cur = conn.cursor()

        # получить telegram_id пользователя
        cur.execute(f"SELECT telegram_id FROM {schema}.mvp_vpn_users WHERE username_login = %s", (username,))
        user = cur.fetchone()
        if not user:
            conn.close()
            return {'statusCode': 404, 'headers': CORS_HEADERS, 'body': json.dumps({'error': 'Пользователь не найден'})}
        telegram_id = user[0]

        # взять ключ из пула или использовать переданный
        if custom_key:
            vpn_key = custom_key
        else:
            cur.execute(f"SELECT id, vpn_key FROM {schema}.mvp_vpn_keys_pool WHERE plan = %s AND used = FALSE LIMIT 1", (plan,))
            key_row = cur.fetchone()
            if not key_row:
                conn.close()
                return {'statusCode': 400, 'headers': CORS_HEADERS, 'body': json.dumps({'error': f'Нет свободных ключей для тарифа «{plan}»'})}
            vpn_key = key_row[1]
            cur.execute(f"UPDATE {schema}.mvp_vpn_keys_pool SET used = TRUE, assigned_to = %s, assigned_at = NOW() WHERE id = %s", (username, key_row[0]))

        days = PLAN_DAYS.get(plan, 30)
        expires_at = datetime.now() + timedelta(days=days)

        cur.execute(f"""
            INSERT INTO {schema}.mvp_vpn_subscriptions (telegram_id, plan, expires_at, vpn_key)
            VALUES (%s, %s, %s, %s)
        """, (telegram_id, plan, expires_at, vpn_key))
        conn.commit()
        conn.close()

        return {'statusCode': 200, 'headers': CORS_HEADERS, 'body': json.dumps({
            'ok': True, 'username': username, 'plan': plan,
            'vpn_key': vpn_key, 'expires_at': expires_at.isoformat()
        })}

    return {'statusCode': 404, 'headers': CORS_HEADERS, 'body': json.dumps({'error': 'not found'})}
