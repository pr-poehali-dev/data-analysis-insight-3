import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'

const WEBHOOK_URL = 'https://functions.poehali.dev/0c9fd5e0-701d-4caf-b002-d30e09615d4f'

const PLAN_NAMES: Record<string, string> = {
  '30d': '30 дней',
  '90d': '90 дней',
  '180d': '180 дней',
  '365d': '365 дней',
}

const Success = () => {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const planFromUrl = searchParams.get('plan') || ''

  const [status, setStatus] = useState<'loading' | 'success' | 'pending' | 'error'>('loading')
  const [vpnKey, setVpnKey] = useState('')
  const [planName, setPlanName] = useState('')
  const [copied, setCopied] = useState(false)
  const [attempts, setAttempts] = useState(0)

  useEffect(() => {
    const paymentId = localStorage.getItem('mvp_payment_id')
    const plan = localStorage.getItem('mvp_payment_plan') || planFromUrl

    if (!paymentId) {
      setStatus('error')
      return
    }

    setPlanName(PLAN_NAMES[plan] || plan)

    const check = async () => {
      try {
        const res = await fetch(`${WEBHOOK_URL}?payment_id=${paymentId}`)
        const data = await res.json()

        if (data.status === 'succeeded') {
          setVpnKey(data.vpn_key)
          setPlanName(data.plan_name || PLAN_NAMES[plan] || plan)
          setStatus('success')
          localStorage.removeItem('mvp_payment_id')
          localStorage.removeItem('mvp_payment_plan')
        } else if (data.status === 'pending') {
          setStatus('pending')
          setAttempts(a => a + 1)
        } else {
          setStatus('error')
        }
      } catch {
        setStatus('error')
      }
    }

    check()
  }, [])

  useEffect(() => {
    if (status === 'pending' && attempts < 12) {
      const t = setTimeout(() => {
        const paymentId = localStorage.getItem('mvp_payment_id')
        if (!paymentId) return
        fetch(`${WEBHOOK_URL}?payment_id=${paymentId}`)
          .then(r => r.json())
          .then(data => {
            if (data.status === 'succeeded') {
              setVpnKey(data.vpn_key)
              setPlanName(data.plan_name || planName)
              setStatus('success')
              localStorage.removeItem('mvp_payment_id')
              localStorage.removeItem('mvp_payment_plan')
            } else {
              setAttempts(a => a + 1)
            }
          })
          .catch(() => setAttempts(a => a + 1))
      }, 3000)
      return () => clearTimeout(t)
    }
    if (status === 'pending' && attempts >= 12) {
      setStatus('error')
    }
  }, [status, attempts])

  const copyKey = () => {
    navigator.clipboard.writeText(vpnKey)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div
      className="min-h-screen w-full flex flex-col items-center justify-center px-4 py-16 relative overflow-hidden"
      style={{ background: 'linear-gradient(135deg, #020b18 0%, #041428 50%, #020b18 100%)' }}
    >
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full pointer-events-none" style={{ background: 'radial-gradient(circle, rgba(0,200,255,0.06) 0%, transparent 70%)' }} />

      <div className="w-full max-w-lg z-10">

        {status === 'loading' && (
          <div className="text-center">
            <div className="text-5xl mb-4 animate-spin">⏳</div>
            <h1 className="text-2xl font-bold text-white mb-2">Проверяем оплату...</h1>
            <p className="text-white/50">Подождите несколько секунд</p>
          </div>
        )}

        {status === 'pending' && (
          <div className="text-center">
            <div className="text-5xl mb-4">🔄</div>
            <h1 className="text-2xl font-bold text-white mb-2">Ожидаем подтверждение...</h1>
            <p className="text-white/50">Платёж обрабатывается, это займёт до 30 секунд</p>
            <div className="mt-4 flex justify-center gap-1">
              {[0,1,2].map(i => (
                <div key={i} className="w-2 h-2 rounded-full animate-pulse" style={{ background: '#00c8ff', animationDelay: `${i * 0.2}s` }} />
              ))}
            </div>
          </div>
        )}

        {status === 'error' && (
          <div className="text-center">
            <div className="text-5xl mb-4">😕</div>
            <h1 className="text-2xl font-bold text-white mb-2">Что-то пошло не так</h1>
            <p className="text-white/50 mb-6">Если деньги списались — напишите нам в Telegram, выдадим ключ вручную</p>
            <a
              href="https://t.me/mvpvpnproxybot"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block px-6 py-3 rounded-xl font-bold text-black"
              style={{ background: 'linear-gradient(90deg, #00c8ff, #0077ff)' }}
            >
              Написать в поддержку →
            </a>
          </div>
        )}

        {status === 'success' && (
          <div>
            <div className="text-center mb-8">
              <div className="text-5xl mb-4">✅</div>
              <h1 className="text-3xl font-bold text-white mb-2">Оплата прошла!</h1>
              <p className="text-white/50">Тариф <span className="text-white font-semibold">{planName}</span> активирован</p>
            </div>

            {/* Ключ */}
            <div className="rounded-2xl p-6 mb-6" style={{ background: 'rgba(0,200,255,0.06)', border: '1px solid rgba(0,200,255,0.3)' }}>
              <p className="text-white/60 text-sm mb-3">🔑 Твой VPN-ключ:</p>
              <div
                className="rounded-xl p-4 mb-3 cursor-pointer select-all break-all text-sm font-mono"
                style={{ background: 'rgba(0,0,0,0.3)', color: '#00c8ff', border: '1px solid rgba(0,200,255,0.15)' }}
                onClick={copyKey}
              >
                {vpnKey}
              </div>
              <button
                onClick={copyKey}
                className="w-full py-3 rounded-xl font-bold text-black transition"
                style={{ background: copied ? 'rgba(0,200,100,0.8)' : 'linear-gradient(90deg, #00c8ff, #0077ff)' }}
              >
                {copied ? '✓ Скопировано!' : 'Скопировать ключ'}
              </button>
            </div>

            {/* Инструкция */}
            <div className="rounded-2xl p-6 mb-6" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}>
              <p className="text-white font-bold mb-4">Как подключиться:</p>
              <ol className="space-y-3 text-white/70 text-sm">
                <li className="flex gap-3">
                  <span className="text-cyan-400 font-bold">1.</span>
                  <span>Скачай приложение V2RayTun на своё устройство</span>
                </li>
                <li className="flex gap-3">
                  <span className="text-cyan-400 font-bold">2.</span>
                  <span>Скопируй ключ выше и вставь его в приложение</span>
                </li>
                <li className="flex gap-3">
                  <span className="text-cyan-400 font-bold">3.</span>
                  <span>Нажми «Подключиться» — готово!</span>
                </li>
              </ol>
            </div>

            {/* Ссылки на приложения */}
            <div className="grid grid-cols-2 gap-4 mb-6">
              <a
                href="https://apps.apple.com/ru/app/v2raytun/id6476628951"
                target="_blank"
                rel="noopener noreferrer"
                className="flex flex-col items-center gap-2 py-4 px-3 rounded-xl transition hover:opacity-90"
                style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}
              >
                <span className="text-3xl">🍎</span>
                <span className="text-white font-semibold text-sm">App Store</span>
                <span className="text-white/40 text-xs">для iPhone / iPad</span>
              </a>
              <a
                href="https://play.google.com/store/apps/details?id=com.v2raytun.android"
                target="_blank"
                rel="noopener noreferrer"
                className="flex flex-col items-center gap-2 py-4 px-3 rounded-xl transition hover:opacity-90"
                style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}
              >
                <span className="text-3xl">🤖</span>
                <span className="text-white font-semibold text-sm">Google Play</span>
                <span className="text-white/40 text-xs">для Android</span>
              </a>
            </div>

            <div className="text-center">
              <p className="text-white/30 text-xs">
                Нужна помощь?{' '}
                <a href="https://t.me/mvpvpnproxybot" target="_blank" rel="noopener noreferrer" className="text-cyan-400 hover:underline">
                  Напишите нам
                </a>
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default Success
