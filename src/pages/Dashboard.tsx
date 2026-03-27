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

type Subscription = { plan: string; expires_at: string | null; vpn_key: string | null; active: boolean } | null
type Step = 'login' | 'register' | 'dashboard'

const cardStyle = { background: 'rgba(0,200,255,0.05)', border: '1px solid rgba(0,200,255,0.15)', backdropFilter: 'blur(12px)' }

const Dashboard = () => {
  const navigate = useNavigate()
  const [step, setStep] = useState<Step>('login')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [password2, setPassword2] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [currentUser, setCurrentUser] = useState('')
  const [subscription, setSubscription] = useState<Subscription>(null)
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
      if (!userRes.ok) { localStorage.removeItem('mvp_session'); setStep('login'); return }
      const userData = await userRes.json()
      setCurrentUser(userData.username)
      const subData = await subRes.json()
      setSubscription(subData.subscription)
      setStep('dashboard')
    } finally {
      setLoading(false)
    }
  }

  const doAuth = async (action: 'login' | 'register') => {
    if (!username.trim() || !password.trim()) return setError('Заполните все поля')
    if (action === 'register' && password !== password2) return setError('Пароли не совпадают')
    setLoading(true); setError('')
    try {
      const res = await fetch(AUTH_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, username: username.trim(), password }),
      })
      const data = await res.json()
      if (data.ok) {
        localStorage.setItem('mvp_session', data.session)
        await loadDashboard(data.session)
      } else {
        setError(data.error || 'Ошибка')
      }
    } catch {
      setError('Ошибка соединения')
    } finally {
      setLoading(false)
    }
  }

  const logout = () => {
    localStorage.removeItem('mvp_session')
    setStep('login'); setUsername(''); setPassword(''); setPassword2(''); setSubscription(null)
  }

  const handleCopy = () => {
    if (subscription?.vpn_key) {
      navigator.clipboard.writeText(subscription.vpn_key)
      setCopied(true); setTimeout(() => setCopied(false), 2000)
    }
  }

  const formatDate = (iso: string | null) => {
    if (!iso) return '—'
    return new Date(iso).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' })
  }

  const inputStyle: React.CSSProperties = { background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(0,200,255,0.2)', outline: 'none' }

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center px-4 py-12 relative overflow-hidden"
      style={{ background: 'linear-gradient(135deg, #020b18 0%, #041428 50%, #020b18 100%)' }}>
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(0,200,255,0.07) 0%, transparent 70%)' }} />

      <button onClick={() => navigate('/')} className="absolute top-6 left-6 text-white/40 hover:text-white transition text-sm z-10">← Главная</button>

      {loading && step !== 'dashboard' ? (
        <p className="text-white/40 text-sm">Загрузка...</p>
      ) : (
        <div className="w-full max-w-md relative z-10">
          <div className="text-center mb-8">
            <span className="text-2xl font-bold text-white">MVP <span style={{ color: '#00c8ff' }}>VPN</span></span>
            <p className="text-white/40 text-sm mt-1">Личный кабинет</p>
          </div>

          {/* LOGIN */}
          {step === 'login' && (
            <div className="rounded-2xl p-7" style={cardStyle}>
              <h2 className="text-xl font-bold text-white mb-1">Вход</h2>
              <p className="text-white/40 text-sm mb-6">Введите логин и пароль</p>

              <label className="block text-white/50 text-xs mb-1">Логин</label>
              <input value={username} onChange={e => setUsername(e.target.value)}
                placeholder="your_username" className="w-full rounded-lg px-4 py-3 text-white text-sm mb-3"
                style={inputStyle} onKeyDown={e => e.key === 'Enter' && doAuth('login')} />

              <label className="block text-white/50 text-xs mb-1">Пароль</label>
              <input type="password" value={password} onChange={e => setPassword(e.target.value)}
                placeholder="••••••••" className="w-full rounded-lg px-4 py-3 text-white text-sm mb-5"
                style={inputStyle} onKeyDown={e => e.key === 'Enter' && doAuth('login')} />

              {error && <p className="text-red-400 text-xs mb-3">{error}</p>}

              <button onClick={() => doAuth('login')} disabled={loading}
                className="w-full font-bold py-3 rounded-lg text-black transition disabled:opacity-50 mb-3"
                style={{ background: 'linear-gradient(90deg, #00c8ff, #0077ff)' }}>
                {loading ? 'Вхожу...' : 'Войти'}
              </button>
              <p className="text-center text-white/40 text-sm">
                Нет аккаунта?{' '}
                <button onClick={() => { setStep('register'); setError('') }} style={{ color: '#00c8ff' }} className="font-semibold">
                  Зарегистрироваться
                </button>
              </p>
            </div>
          )}

          {/* REGISTER */}
          {step === 'register' && (
            <div className="rounded-2xl p-7" style={cardStyle}>
              <h2 className="text-xl font-bold text-white mb-1">Регистрация</h2>
              <p className="text-white/40 text-sm mb-6">Придумайте логин и пароль</p>

              <label className="block text-white/50 text-xs mb-1">Логин</label>
              <input value={username} onChange={e => setUsername(e.target.value)}
                placeholder="your_username" className="w-full rounded-lg px-4 py-3 text-white text-sm mb-3"
                style={inputStyle} />

              <label className="block text-white/50 text-xs mb-1">Пароль</label>
              <input type="password" value={password} onChange={e => setPassword(e.target.value)}
                placeholder="Минимум 6 символов" className="w-full rounded-lg px-4 py-3 text-white text-sm mb-3"
                style={inputStyle} />

              <label className="block text-white/50 text-xs mb-1">Повторите пароль</label>
              <input type="password" value={password2} onChange={e => setPassword2(e.target.value)}
                placeholder="••••••••" className="w-full rounded-lg px-4 py-3 text-white text-sm mb-5"
                style={inputStyle} onKeyDown={e => e.key === 'Enter' && doAuth('register')} />

              {error && <p className="text-red-400 text-xs mb-3">{error}</p>}

              <button onClick={() => doAuth('register')} disabled={loading}
                className="w-full font-bold py-3 rounded-lg text-black transition disabled:opacity-50 mb-3"
                style={{ background: 'linear-gradient(90deg, #00c8ff, #0077ff)' }}>
                {loading ? 'Создаю аккаунт...' : 'Создать аккаунт'}
              </button>
              <p className="text-center text-white/40 text-sm">
                Уже есть аккаунт?{' '}
                <button onClick={() => { setStep('login'); setError('') }} style={{ color: '#00c8ff' }} className="font-semibold">
                  Войти
                </button>
              </p>
            </div>
          )}

          {/* DASHBOARD */}
          {step === 'dashboard' && (
            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-white">Привет, {currentUser}! 👋</h2>
                  <p className="text-white/40 text-xs mt-0.5">MVP VPN — ваша подписка</p>
                </div>
                <button onClick={logout} className="text-white/30 hover:text-white/60 text-xs transition">Выйти</button>
              </div>

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
                        <div className="flex-1 rounded-lg px-3 py-2 text-xs font-mono truncate"
                          style={{ background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(0,200,255,0.15)', color: '#00c8ff' }}>
                          {subscription.vpn_key}
                        </div>
                        <button onClick={handleCopy} className="text-xs px-3 py-2 rounded-lg font-semibold whitespace-nowrap transition"
                          style={copied
                            ? { background: 'rgba(0,255,150,0.15)', color: '#00ff96' }
                            : { background: 'rgba(0,200,255,0.1)', color: '#00c8ff', border: '1px solid rgba(0,200,255,0.2)' }}>
                          {copied ? '✓ Скопировано' : 'Копировать'}
                        </button>
                      </div>
                    </>
                  )}
                </div>
              )}

              {subscription && !subscription.active && (
                <div className="rounded-2xl p-4" style={{ background: 'rgba(255,80,80,0.05)', border: '1px solid rgba(255,80,80,0.2)' }}>
                  <span className="text-xs px-2 py-0.5 rounded-full font-semibold" style={{ background: 'rgba(255,80,80,0.15)', color: '#ff6060' }}>● Истекла</span>
                  <p className="text-white/40 text-xs mt-2">Истекла {formatDate(subscription.expires_at)}</p>
                </div>
              )}

              {(!subscription || !subscription.active) && (
                <div className="rounded-2xl p-6" style={{ background: 'rgba(0,200,255,0.04)', border: '1px solid rgba(0,200,255,0.12)' }}>
                  <h3 className="text-white font-bold mb-1">Выберите тариф</h3>
                  <p className="text-white/40 text-xs mb-4">После оплаты ключ придёт в Telegram-бот</p>
                  <div className="flex flex-col gap-3">
                    {Object.entries(PAYMENT_LINKS).map(([plan, link]) => (
                      <a key={plan} href={link} target="_blank" rel="noopener noreferrer"
                        className="flex items-center justify-between rounded-xl px-4 py-3 transition hover:-translate-y-0.5"
                        style={{ background: 'rgba(0,200,255,0.07)', border: '1px solid rgba(0,200,255,0.18)' }}>
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
      )}
    </div>
  )
}

export default Dashboard
