"""
Управление подписками пользователей MVP VPN.
GET / — получить подписку пользователя по session
POST /admin/add — добавить подписку (для бота)
"""
import os
import json
import hashlib
import psycopg2
from datetime import datetime, timedelta

CORS_HEADERS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, X-Session-Id',
}

PLAN_DAYS = {'7 дней': 7, '1 месяц': 30, '3 месяца': 90}

def get_conn():
    return psycopg2.connect(os.environ['DATABASE_URL'])

def get_schema():
    return os.environ.get('MAIN_DB_SCHEMA', 'public')

def make_session_token(telegram_id: int) -> str:
    secret = os.environ.get('TELEGRAM_BOT_TOKEN', 'secret')
    raw = f"{telegram_id}:{secret}"
    return hashlib.sha256(raw.encode()).hexdigest()

def get_telegram_id_by_session(session_id: str) -> int | None:
    schema = get_schema()
    conn = get_conn()
    cur = conn.cursor()
    cur.execute(f"SELECT telegram_id FROM {schema}.mvp_vpn_users")
    rows = cur.fetchall()
    conn.close()
    for row in rows:
        tid = row[0]
        if make_session_token(tid) == session_id:
            return tid
    return None

def handler(event: dict, context) -> dict:
    if event.get('httpMethod') == 'OPTIONS':
        return {'statusCode': 200, 'headers': CORS_HEADERS, 'body': ''}

    method = event.get('httpMethod', 'GET')
    path = event.get('path', '/')
    schema = get_schema()

    # GET / — подписка текущего пользователя
    if method == 'GET':
        session_id = event.get('headers', {}).get('X-Session-Id', '')
        telegram_id = get_telegram_id_by_session(session_id)
        if not telegram_id:
            return {'statusCode': 401, 'headers': CORS_HEADERS, 'body': json.dumps({'error': 'unauthorized'})}
        conn = get_conn()
        cur = conn.cursor()
        cur.execute(
            f"SELECT plan, expires_at, vpn_key FROM {schema}.mvp_vpn_subscriptions WHERE telegram_id = %s ORDER BY expires_at DESC LIMIT 1",
            (telegram_id,)
        )
        row = cur.fetchone()
        conn.close()
        if not row:
            return {'statusCode': 200, 'headers': CORS_HEADERS, 'body': json.dumps({'subscription': None})}
        expires_at = row[1]
        active = expires_at > datetime.now() if expires_at else False
        return {
            'statusCode': 200,
            'headers': CORS_HEADERS,
            'body': json.dumps({
                'subscription': {
                    'plan': row[0],
                    'expires_at': expires_at.isoformat() if expires_at else None,
                    'vpn_key': row[2],
                    'active': active
                }
            })
        }

    # POST /admin/add — добавить подписку (вызывается ботом после оплаты)
    if method == 'POST' and '/admin/add' in path:
        body = json.loads(event.get('body') or '{}')
        telegram_id = body.get('telegram_id')
        plan = body.get('plan')
        vpn_key = body.get('vpn_key', '')
        if not telegram_id or not plan:
            return {'statusCode': 400, 'headers': CORS_HEADERS, 'body': json.dumps({'error': 'fields required'})}
        days = PLAN_DAYS.get(plan, 30)
        expires_at = datetime.now() + timedelta(days=days)
        conn = get_conn()
        cur = conn.cursor()
        cur.execute(
            f"INSERT INTO {schema}.mvp_vpn_users (telegram_id) VALUES (%s) ON CONFLICT (telegram_id) DO NOTHING",
            (int(telegram_id),)
        )
        cur.execute(
            f"INSERT INTO {schema}.mvp_vpn_subscriptions (telegram_id, plan, expires_at, vpn_key) VALUES (%s, %s, %s, %s)",
            (int(telegram_id), plan, expires_at, vpn_key)
        )
        conn.commit()
        conn.close()
        return {'statusCode': 200, 'headers': CORS_HEADERS, 'body': json.dumps({'ok': True, 'expires_at': expires_at.isoformat()})}

    return {'statusCode': 404, 'headers': CORS_HEADERS, 'body': json.dumps({'error': 'not found'})}
