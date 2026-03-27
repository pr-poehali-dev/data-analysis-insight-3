"""
Авторизация пользователей MVP VPN по логину и паролю.
POST register — регистрация нового пользователя
POST login — вход, возвращает сессию
GET / — получить данные по сессии
"""
import os
import json
import hashlib
import psycopg2

CORS_HEADERS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, X-Session-Id',
}

def get_conn():
    return psycopg2.connect(os.environ['DATABASE_URL'])

def get_schema():
    return os.environ.get('MAIN_DB_SCHEMA', 'public')

def hash_password(password: str) -> str:
    secret = os.environ.get('TELEGRAM_BOT_TOKEN', 'mvp_secret')
    return hashlib.sha256(f"{password}:{secret}".encode()).hexdigest()

def make_session(username: str) -> str:
    secret = os.environ.get('TELEGRAM_BOT_TOKEN', 'mvp_secret')
    return hashlib.sha256(f"session:{username}:{secret}".encode()).hexdigest()

def handler(event: dict, context) -> dict:
    if event.get('httpMethod') == 'OPTIONS':
        return {'statusCode': 200, 'headers': CORS_HEADERS, 'body': ''}

    method = event.get('httpMethod', 'GET')
    schema = get_schema()

    # GET — получить пользователя по сессии
    if method == 'GET':
        session_id = event.get('headers', {}).get('X-Session-Id', '')
        if not session_id:
            return {'statusCode': 401, 'headers': CORS_HEADERS, 'body': json.dumps({'error': 'no session'})}
        conn = get_conn()
        cur = conn.cursor()
        cur.execute(f"SELECT id, username_login FROM {schema}.mvp_vpn_users WHERE username_login IS NOT NULL")
        rows = cur.fetchall()
        conn.close()
        for row in rows:
            if make_session(row[1]) == session_id:
                return {'statusCode': 200, 'headers': CORS_HEADERS, 'body': json.dumps({'id': row[0], 'username': row[1]})}
        return {'statusCode': 401, 'headers': CORS_HEADERS, 'body': json.dumps({'error': 'invalid session'})}

    body = json.loads(event.get('body') or '{}')
    action = body.get('action', '')

    # POST register
    if action == 'register':
        username = (body.get('username') or '').strip().lower()
        password = body.get('password', '')
        if not username or not password:
            return {'statusCode': 400, 'headers': CORS_HEADERS, 'body': json.dumps({'error': 'Заполните все поля'})}
        if len(password) < 6:
            return {'statusCode': 400, 'headers': CORS_HEADERS, 'body': json.dumps({'error': 'Пароль минимум 6 символов'})}
        conn = get_conn()
        cur = conn.cursor()
        cur.execute(f"SELECT id FROM {schema}.mvp_vpn_users WHERE username_login = %s", (username,))
        if cur.fetchone():
            conn.close()
            return {'statusCode': 409, 'headers': CORS_HEADERS, 'body': json.dumps({'error': 'Такой пользователь уже существует'})}
        cur.execute(
            f"INSERT INTO {schema}.mvp_vpn_users (username_login, password_hash, telegram_id) VALUES (%s, %s, %s)",
            (username, hash_password(password), 0)
        )
        conn.commit()
        conn.close()
        session = make_session(username)
        return {'statusCode': 200, 'headers': CORS_HEADERS, 'body': json.dumps({'ok': True, 'session': session, 'username': username})}

    # POST login
    if action == 'login':
        username = (body.get('username') or '').strip().lower()
        password = body.get('password', '')
        if not username or not password:
            return {'statusCode': 400, 'headers': CORS_HEADERS, 'body': json.dumps({'error': 'Заполните все поля'})}
        conn = get_conn()
        cur = conn.cursor()
        cur.execute(f"SELECT id, password_hash FROM {schema}.mvp_vpn_users WHERE username_login = %s", (username,))
        row = cur.fetchone()
        conn.close()
        if not row or row[1] != hash_password(password):
            return {'statusCode': 401, 'headers': CORS_HEADERS, 'body': json.dumps({'error': 'Неверный логин или пароль'})}
        session = make_session(username)
        return {'statusCode': 200, 'headers': CORS_HEADERS, 'body': json.dumps({'ok': True, 'session': session, 'username': username})}

    return {'statusCode': 404, 'headers': CORS_HEADERS, 'body': json.dumps({'error': 'not found'})}
