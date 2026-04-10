import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'

const PAYMENT_URL = 'https://functions.poehali.dev/ac99adbe-a47b-4170-b8f0-2422f89cface'

const Checkout = () => {
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const plan = params.get('plan') || '30d'
  const price = params.get('price') || '200'
  const period = params.get('period') || '30 дней'

  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handlePay = async () => {
    setError('')
    if (!email || !email.includes('@')) {
      setError('Введите корректный email — на него придёт чек об оплате')
      return
    }
    setLoading(true)
    try {
      const res = await fetch(PAYMENT_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          plan,
          email,
          return_url: window.location.origin,
        }),
      })
      const data = await res.json()
      if (data.pay_url) {
        localStorage.setItem('mvp_payment_id', data.payment_id)
        localStorage.setItem('mvp_payment_plan', plan)
        window.location.href = data.pay_url
      } else {
        setError('Ошибка создания платежа. Попробуйте ещё раз.')
      }
    } catch {
      setError('Сетевая ошибка. Проверьте соединение и попробуйте снова.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      className="min-h-screen w-full flex flex-col items-center justify-center px-4 py-16 relative overflow-hidden"
      style={{ background: 'linear-gradient(135deg, #020b18 0%, #041428 50%, #020b18 100%)' }}
    >
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full pointer-events-none" style={{ background: 'radial-gradient(circle, rgba(0,200,255,0.06) 0%, transparent 70%)' }} />

      <button
        onClick={() => navigate('/pricing')}
        className="absolute top-6 left-6 text-white/50 hover:text-white transition text-sm flex items-center gap-2"
      >
        ← Назад к тарифам
      </button>

      <div className="w-full max-w-md z-10">
        <div className="text-center mb-8">
          <div className="inline-block mb-4 px-3 py-1 rounded-full text-xs font-semibold tracking-widest uppercase" style={{ background: 'rgba(0,200,255,0.1)', border: '1px solid rgba(0,200,255,0.3)', color: '#00c8ff' }}>
            Оформление заказа
          </div>
          <h1 className="text-3xl font-bold text-white">Оплата VPN-ключа</h1>
        </div>

        <div
          className="rounded-2xl p-6 mb-6"
          style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
        >
          <div className="flex justify-between items-center mb-2">
            <span className="text-white/60">Тариф</span>
            <span className="text-white font-bold">{period}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-white/60">К оплате</span>
            <span className="text-2xl font-extrabold" style={{ color: '#00c8ff' }}>{price} ₽</span>
          </div>
        </div>

        <div className="mb-6">
          <label className="block text-white/60 text-sm mb-2">Email для чека</label>
          <input
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="your@email.com"
            className="w-full px-4 py-3 rounded-xl text-white outline-none transition"
            style={{
              background: 'rgba(255,255,255,0.06)',
              border: '1px solid rgba(255,255,255,0.12)',
              fontSize: '16px',
            }}
            onKeyDown={e => e.key === 'Enter' && handlePay()}
          />
          {error && <p className="text-red-400 text-sm mt-2">{error}</p>}
        </div>

        <button
          onClick={handlePay}
          disabled={loading}
          className="w-full py-4 rounded-xl font-bold text-black text-base transition duration-300 disabled:opacity-60"
          style={{ background: 'linear-gradient(90deg, #00c8ff, #0077ff)' }}
        >
          {loading ? 'Создаём платёж...' : `Оплатить ${price} ₽ →`}
        </button>

        <p className="text-white/25 text-xs text-center mt-4">
          Безопасная оплата через ЮКасса · Ключ придёт сразу после оплаты
        </p>
      </div>
    </div>
  )
}

export default Checkout
