"""
Авторизация пользователей через Telegram-бот.
POST /send-code — отправляет код в Telegram
POST /verify-code — проверяет код и возвращает сессию
GET /me — возвращает данные текущего пользователя по сессии
"""
import os
import json
import random
import string
import hashlib
import psycopg2
import urllib.request
import urllib.parse

CORS_HEADERS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, X-Session-Id',
}

def get_conn():
    return psycopg2.connect(os.environ['DATABASE_URL'])

def get_schema():
    return os.environ.get('MAIN_DB_SCHEMA', 'public')

def send_telegram_message(chat_id: int, text: str):
    token = os.environ['TELEGRAM_BOT_TOKEN']
    url = f"https://api.telegram.org/bot{token}/sendMessage"
    data = urllib.parse.urlencode({'chat_id': chat_id, 'text': text}).encode()
    req = urllib.request.Request(url, data=data, method='POST')
    urllib.request.urlopen(req, timeout=10)

def make_session_token(telegram_id: int) -> str:
    secret = os.environ.get('TELEGRAM_BOT_TOKEN', 'secret')
    raw = f"{telegram_id}:{secret}"
    return hashlib.sha256(raw.encode()).hexdigest()

def handler(event: dict, context) -> dict:
    if event.get('httpMethod') == 'OPTIONS':
        return {'statusCode': 200, 'headers': CORS_HEADERS, 'body': ''}

    path = event.get('path', '/')
    method = event.get('httpMethod', 'GET')
    schema = get_schema()

    # GET — получить пользователя по сессии
    if method == 'GET':
        session_id = event.get('headers', {}).get('X-Session-Id', '')
        if not session_id:
            return {'statusCode': 401, 'headers': CORS_HEADERS, 'body': json.dumps({'error': 'no session'})}
        conn = get_conn()
        cur = conn.cursor()
        cur.execute(f"SELECT telegram_id, username, first_name FROM {schema}.mvp_vpn_users WHERE id > 0")
        rows = cur.fetchall()
        for row in rows:
            tid = row[0]
            if make_session_token(tid) == session_id:
                cur.execute(
                    f"SELECT plan, expires_at, vpn_key FROM {schema}.mvp_vpn_subscriptions WHERE telegram_id = %s ORDER BY expires_at DESC",
                    (tid,)
                )
                subs = cur.fetchall()
                conn.close()
                return {
                    'statusCode': 200,
                    'headers': CORS_HEADERS,
                    'body': json.dumps({
                        'telegram_id': tid,
                        'username': row[1],
                        'first_name': row[2],
                        'subscriptions': [
                            {'plan': s[0], 'expires_at': s[1].isoformat() if s[1] else None, 'vpn_key': s[2]}
                            for s in subs
                        ]
                    })
                }
        conn.close()
        return {'statusCode': 401, 'headers': CORS_HEADERS, 'body': json.dumps({'error': 'invalid session'})}

    body = json.loads(event.get('body') or '{}')

    # POST /send-code
    if method == 'POST' and (body.get('action') == 'send-code' or '/send-code' in path):
        telegram_id = body.get('telegram_id')
        if not telegram_id:
            return {'statusCode': 400, 'headers': CORS_HEADERS, 'body': json.dumps({'error': 'telegram_id required'})}
        telegram_id = int(telegram_id)
        code = ''.join(random.choices(string.digits, k=6))
        conn = get_conn()
        cur = conn.cursor()
        cur.execute(
            f"INSERT INTO {schema}.mvp_vpn_auth_codes (telegram_id, code) VALUES (%s, %s)",
            (telegram_id, code)
        )
        conn.commit()
        conn.close()
        send_telegram_message(telegram_id, f"🔐 Ваш код для входа в MVP VPN: {code}\n\nКод действителен 5 минут.")
        return {'statusCode': 200, 'headers': CORS_HEADERS, 'body': json.dumps({'ok': True})}

    # POST /verify-code
    if method == 'POST' and (body.get('action') == 'verify-code' or '/verify-code' in path):
        telegram_id = int(body.get('telegram_id', 0))
        code = body.get('code', '')
        if not telegram_id or not code:
            return {'statusCode': 400, 'headers': CORS_HEADERS, 'body': json.dumps({'error': 'fields required'})}
        conn = get_conn()
        cur = conn.cursor()
        cur.execute(
            f"""SELECT id FROM {schema}.mvp_vpn_auth_codes
                WHERE telegram_id = %s AND code = %s AND used = FALSE
                AND created_at > NOW() - INTERVAL '5 minutes'
                ORDER BY created_at DESC LIMIT 1""",
            (telegram_id, code)
        )
        row = cur.fetchone()
        if not row:
            conn.close()
            return {'statusCode': 401, 'headers': CORS_HEADERS, 'body': json.dumps({'error': 'invalid or expired code'})}
        cur.execute(f"UPDATE {schema}.mvp_vpn_auth_codes SET used = TRUE WHERE id = %s", (row[0],))
        cur.execute(
            f"INSERT INTO {schema}.mvp_vpn_users (telegram_id) VALUES (%s) ON CONFLICT (telegram_id) DO NOTHING",
            (telegram_id,)
        )
        conn.commit()
        conn.close()
        session = make_session_token(telegram_id)
        return {'statusCode': 200, 'headers': CORS_HEADERS, 'body': json.dumps({'ok': True, 'session': session, 'telegram_id': telegram_id})}

    return {'statusCode': 404, 'headers': CORS_HEADERS, 'body': json.dumps({'error': 'not found'})}