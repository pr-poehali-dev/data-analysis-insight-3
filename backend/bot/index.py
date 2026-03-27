"""
Telegram-бот MVP VPN.
Приём платежей отключён. Бот только информирует и направляет на сайт.
"""
import os
import json
import urllib.request
from datetime import datetime

SITE_URL = 'https://mvpvpn.poehali.dev'
CORS = {'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'POST, GET, OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type'}

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

def handler(event: dict, context) -> dict:
    if event.get('httpMethod') == 'OPTIONS':
        return {'statusCode': 200, 'headers': CORS, 'body': ''}

    if event.get('httpMethod') == 'GET':
        return {'statusCode': 200, 'headers': CORS, 'body': json.dumps({'ok': True, 'bot': 'MVP VPN Bot'})}

    body = json.loads(event.get('body') or '{}')
    message = body.get('message')
    callback = body.get('callback_query')

    if message:
        chat_id = message['chat']['id']
        text = message.get('text', '')
        first_name = message.get('from', {}).get('first_name', '')

        if text in ('/start', '/help'):
            send(chat_id,
                f'👋 Привет, <b>{first_name}</b>!\n\n'
                f'Я бот <b>MVP VPN</b> — быстрый VPN для работы и отдыха.\n\n'
                f'🔐 TikTok, Instagram, YouTube, Discord, игры — без блокировок.\n\n'
                f'Для покупки подписки и управления ключом — перейди на сайт:',
                {'inline_keyboard': [
                    [{'text': '🔑 Получить ключ', 'url': SITE_URL}],
                    [{'text': '💳 Тарифы', 'url': SITE_URL + '/pricing'}],
                    [{'text': '👤 Личный кабинет', 'url': SITE_URL + '/dashboard'}],
                ]}
            )
        else:
            send(chat_id,
                '👤 Для управления подпиской и получения ключа перейди в личный кабинет на сайте:',
                {'inline_keyboard': [
                    [{'text': '👤 Личный кабинет', 'url': SITE_URL + '/dashboard'}],
                    [{'text': '💳 Тарифы', 'url': SITE_URL + '/pricing'}],
                ]}
            )

    elif callback:
        chat_id = callback['message']['chat']['id']
        tg('answerCallbackQuery', {'callback_query_id': callback['id']})
        send(chat_id,
            '👤 Для управления подпиской перейди на сайт:',
            {'inline_keyboard': [
                [{'text': '👤 Личный кабинет', 'url': SITE_URL + '/dashboard'}],
            ]}
        )

    return {'statusCode': 200, 'headers': CORS, 'body': json.dumps({'ok': True})}
