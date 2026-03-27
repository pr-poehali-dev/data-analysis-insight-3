import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

const AUTH_URL = 'https://functions.poehali.dev/ca76c96e-ba03-4401-8b5e-9d5a771d5f18'
const SUB_URL = 'https://functions.poehali.dev/62ca2764-c2a8-4b8a-b222-1bf01cfbb727'

const PAYMENT_LINKS: Record<string, string> = {
  '7 дней': 'https://yookassa.ru/my/i/acbmaggaAb-9/l',
  '1 месяц': 'https://yookassa.ru/my/i/acbmk0uCW9xF/l',
  '3 месяца': 'https://yookassa.ru/my/i/acbmyVbQjTXa/l',
}

const PAYMENT_PRICES: Record<string, string> = {
  '7 дней': '60 ₽',
  '1 месяц': '200 ₽',
  '3 месяца': '500 ₽',
}

type Subscription = {
  plan: string
  expires_at: string | null
  vpn_key: string | null
  active: boolean
} | null

type Step = 'login' | 'code' | 'dashboard'

const Dashboard = () => {
  const navigate = useNavigate()
  const [step, setStep] = useState<Step>('login')
  const [telegramId, setTelegramId] = useState('')
  const [code, setCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [subscription, setSubscription] = useState<Subscription>(null)
  const [firstName, setFirstName] = useState('')
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    const session = localStorage.getItem('mvp_session')
    if (session) loadDashboard(session)
  }, [])

  const loadDashboard = async (session: string) => {
    setLoading(true)
    try {
      const [userRes, subRes] = await Promise.all([
        fetch(AUTH_URL, { headers: { 'X-Session-Id': session } }),
        fetch(SUB_URL, { headers: { 'X-Session-Id': session } }),
      ])
      if (!userRes.ok) {
        localStorage.removeItem('mvp_session')
        setStep('login')
        return
      }
      const userData = await userRes.json()
      setFirstName(userData.first_name || '')
      const subData = await subRes.json()
      setSubscription(subData.subscription)
      setStep('dashboard')
    } finally {
      setLoading(false)
    }
  }

  const sendCode = async () => {
    if (!telegramId.trim()) return setError('Введите Telegram ID')
    setLoading(true)
    setError('')
    try {
      const res = await fetch(AUTH_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ telegram_id: parseInt(telegramId), action: 'send-code' }),
      })
      if (res.ok) setStep('code')
      else setError('Не удалось отправить код. Убедитесь, что вы написали боту хотя бы одно сообщение.')
    } catch {
      setError('Ошибка соединения')
    } finally {
      setLoading(false)
    }
  }

  const verifyCode = async () => {
    if (!code.trim()) return setError('Введите код')
    setLoading(true)
    setError('')
    try {
      const res = await fetch(AUTH_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ telegram_id: parseInt(telegramId), code, action: 'verify-code' }),
      })
      const data = await res.json()
      if (data.ok) {
        localStorage.setItem('mvp_session', data.session)
        await loadDashboard(data.session)
      } else {
        setError('Неверный или истёкший код')
      }
    } catch {
      setError('Ошибка соединения')
    } finally {
      setLoading(false)
    }
  }

  const logout = () => {
    localStorage.removeItem('mvp_session')
    setStep('login')
    setTelegramId('')
    setCode('')
    setSubscription(null)
  }

  const handleCopy = () => {
    if (subscription?.vpn_key) {
      navigator.clipboard.writeText(subscription.vpn_key)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const formatDate = (iso: string | null) => {
    if (!iso) return '—'
    return new Date(iso).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' })
  }

  const bgStyle = { background: 'linear-gradient(135deg, #020b18 0%, #041428 50%, #020b18 100%)' }
  const cardStyle = { background: 'rgba(0,200,255,0.05)', border: '1px solid rgba(0,200,255,0.15)', backdropFilter: 'blur(12px)' }

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center px-4 py-12 relative overflow-hidden" style={bgStyle}>
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full pointer-events-none" style={{ background: 'radial-gradient(circle, rgba(0,200,255,0.07) 0%, transparent 70%)' }} />

      <button onClick={() => navigate('/')} className="absolute top-6 left-6 text-white/40 hover:text-white transition text-sm z-10">← Главная</button>

      {loading && step !== 'dashboard' && (
        <div className="text-white/50 text-sm">Загрузка...</div>
      )}

      {!loading || step === 'dashboard' ? (
        <div className="w-full max-w-md relative z-10">

          {/* LOGO */}
          <div className="text-center mb-8">
            <span className="text-2xl font-bold text-white">MVP <span style={{ color: '#00c8ff' }}>VPN</span></span>
            <p className="text-white/40 text-sm mt-1">Личный кабинет</p>
          </div>

          {/* STEP: LOGIN */}
          {step === 'login' && (
            <div className="rounded-2xl p-7" style={cardStyle}>
              <h2 className="text-xl font-bold text-white mb-1">Вход через Telegram</h2>
              <p className="text-white/40 text-sm mb-6">Введите ваш Telegram ID — бот пришлёт код для входа</p>

              <label className="block text-white/50 text-xs mb-1">Telegram ID</label>
              <input
                type="number"
                value={telegramId}
                onChange={e => setTelegramId(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && sendCode()}
                placeholder="123456789"
                className="w-full rounded-lg px-4 py-3 text-white text-sm mb-1 outline-none"
                style={{ background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(0,200,255,0.2)' }}
              />
              <p className="text-white/25 text-xs mb-5">
                Узнать свой ID: напишите{' '}
                <a href="https://t.me/userinfobot" target="_blank" rel="noopener noreferrer" className="underline" style={{ color: '#00c8ff' }}>@userinfobot</a>
                {' '}в Telegram
              </p>

              {error && <p className="text-red-400 text-xs mb-3">{error}</p>}

              <button
                onClick={sendCode}
                disabled={loading}
                className="w-full font-bold py-3 rounded-lg text-black transition disabled:opacity-50"
                style={{ background: 'linear-gradient(90deg, #00c8ff, #0077ff)' }}
              >
                {loading ? 'Отправляю...' : 'Получить код'}
              </button>
            </div>
          )}

          {/* STEP: CODE */}
          {step === 'code' && (
            <div className="rounded-2xl p-7" style={cardStyle}>
              <h2 className="text-xl font-bold text-white mb-1">Введите код</h2>
              <p className="text-white/40 text-sm mb-6">
                Код отправлен в Telegram на ID <span style={{ color: '#00c8ff' }}>{telegramId}</span>
              </p>

              <input
                type="number"
                value={code}
                onChange={e => setCode(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && verifyCode()}
                placeholder="000000"
                className="w-full rounded-lg px-4 py-3 text-white text-2xl font-bold mb-5 outline-none text-center tracking-widest"
                style={{ background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(0,200,255,0.2)' }}
              />

              {error && <p className="text-red-400 text-xs mb-3">{error}</p>}

              <button
                onClick={verifyCode}
                disabled={loading}
                className="w-full font-bold py-3 rounded-lg text-black transition disabled:opacity-50 mb-3"
                style={{ background: 'linear-gradient(90deg, #00c8ff, #0077ff)' }}
              >
                {loading ? 'Проверяю...' : 'Войти'}
              </button>
              <button onClick={() => { setStep('login'); setError('') }} className="w-full text-white/40 hover:text-white text-sm transition py-2">
                ← Назад
              </button>
            </div>
          )}

          {/* STEP: DASHBOARD */}
          {step === 'dashboard' && (
            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-white">
                    {firstName ? `Привет, ${firstName}! 👋` : 'Личный кабинет'}
                  </h2>
                  <p className="text-white/40 text-xs mt-0.5">MVP VPN — ваша подписка</p>
                </div>
                <button onClick={logout} className="text-white/30 hover:text-white/60 text-xs transition">Выйти</button>
              </div>

              {/* Активная подписка */}
              {subscription && subscription.active && (
                <div className="rounded-2xl p-6" style={cardStyle}>
                  <div className="flex items-center gap-2 mb-4">
                    <span className="text-xs px-2 py-0.5 rounded-full font-semibold" style={{ background: 'rgba(0,255,150,0.15)', color: '#00ff96' }}>● Активна</span>
                    <span className="text-white/50 text-xs">{subscription.plan}</span>
                  </div>
                  <p className="text-white/40 text-xs mb-1">Действует до</p>
                  <p className="text-white text-2xl font-bold mb-5">{formatDate(subscription.expires_at)}</p>

                  {subscription.vpn_key && (
                    <>
                      <p className="text-white/40 text-xs mb-2">Ваш VPN ключ</p>
                      <div className="flex items-center gap-2">
                        <div className="flex-1 rounded-lg px-3 py-2 text-xs font-mono truncate" style={{ background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(0,200,255,0.15)', color: '#00c8ff' }}>
                          {subscription.vpn_key}
                        </div>
                        <button
                          onClick={handleCopy}
                          className="text-xs px-3 py-2 rounded-lg font-semibold whitespace-nowrap transition"
                          style={copied
                            ? { background: 'rgba(0,255,150,0.15)', color: '#00ff96' }
                            : { background: 'rgba(0,200,255,0.1)', color: '#00c8ff', border: '1px solid rgba(0,200,255,0.2)' }
                          }
                        >
                          {copied ? '✓ Скопировано' : 'Копировать'}
                        </button>
                      </div>
                    </>
                  )}
                </div>
              )}

              {/* Истекшая подписка */}
              {subscription && !subscription.active && (
                <div className="rounded-2xl p-4" style={{ background: 'rgba(255,80,80,0.05)', border: '1px solid rgba(255,80,80,0.2)' }}>
                  <span className="text-xs px-2 py-0.5 rounded-full font-semibold" style={{ background: 'rgba(255,80,80,0.15)', color: '#ff6060' }}>● Истекла</span>
                  <p className="text-white/40 text-xs mt-2">Истекла {formatDate(subscription.expires_at)}</p>
                </div>
              )}

              {/* Нет подписки или истекла — оплата */}
              {(!subscription || !subscription.active) && (
                <div className="rounded-2xl p-6" style={{ background: 'rgba(0,200,255,0.04)', border: '1px solid rgba(0,200,255,0.12)' }}>
                  <h3 className="text-white font-bold mb-1">Выберите тариф</h3>
                  <p className="text-white/40 text-xs mb-4">После оплаты ключ придёт в Telegram-бот</p>
                  <div className="flex flex-col gap-3">
                    {Object.entries(PAYMENT_LINKS).map(([plan, link]) => (
                      <a
                        key={plan}
                        href={link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-between rounded-xl px-4 py-3 transition hover:-translate-y-0.5"
                        style={{ background: 'rgba(0,200,255,0.07)', border: '1px solid rgba(0,200,255,0.18)' }}
                      >
                        <span className="text-white font-semibold text-sm">{plan}</span>
                        <span className="font-bold text-sm" style={{ color: '#00c8ff' }}>{PAYMENT_PRICES[plan]} →</span>
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      ) : null}
    </div>
  )
}

export default Dashboard
