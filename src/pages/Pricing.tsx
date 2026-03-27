import { useNavigate } from 'react-router-dom'

const plans = [
  {
    period: '7 дней',
    price: '60',
    perDay: '~8.5',
    emoji: '⚡',
    label: 'Попробовать',
    highlight: false,
    description: 'Идеально для теста перед подключением команды',
  },
  {
    period: '1 месяц',
    price: '200',
    perDay: '~6.7',
    emoji: '🔥',
    label: 'Популярный выбор',
    highlight: true,
    description: 'Оптимальный вариант для постоянного использования',
  },
  {
    period: '3 месяца',
    price: '500',
    perDay: '~5.5',
    emoji: '💎',
    label: 'Выгоднее всего',
    highlight: false,
    description: 'Максимальная экономия для долгосрочного подключения',
  },
]

const Pricing = () => {
  const navigate = useNavigate()

  return (
    <div
      className="min-h-screen w-full flex flex-col items-center justify-center px-4 py-16 relative overflow-hidden"
      style={{ background: 'linear-gradient(135deg, #020b18 0%, #041428 50%, #020b18 100%)' }}
    >
      {/* Background glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full pointer-events-none" style={{ background: 'radial-gradient(circle, rgba(0,200,255,0.06) 0%, transparent 70%)' }} />

      {/* Back */}
      <button
        onClick={() => navigate('/')}
        className="absolute top-6 left-6 text-white/50 hover:text-white transition text-sm flex items-center gap-2"
      >
        ← На главную
      </button>

      {/* Header */}
      <div className="text-center mb-12 z-10">
        <div className="inline-block mb-4 px-3 py-1 rounded-full text-xs font-semibold tracking-widest uppercase" style={{ background: 'rgba(0,200,255,0.1)', border: '1px solid rgba(0,200,255,0.3)', color: '#00c8ff' }}>
          Тарифы
        </div>
        <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
          Прайс на{' '}
          <span style={{ background: 'linear-gradient(90deg, #00c8ff, #0077ff)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            MVP VPN
          </span>
        </h1>
        <p className="text-white/50 text-lg max-w-md mx-auto">
          Выберите удобный период — ключ придёт в Telegram-бот мгновенно
        </p>
      </div>

      {/* Cards */}
      <div className="grid md:grid-cols-3 gap-6 max-w-4xl w-full z-10">
        {plans.map((plan) => (
          <div
            key={plan.period}
            className="relative rounded-2xl p-7 flex flex-col items-center text-center transition-transform hover:-translate-y-1"
            style={{
              background: plan.highlight
                ? 'linear-gradient(135deg, rgba(0,200,255,0.12), rgba(0,119,255,0.12))'
                : 'rgba(255,255,255,0.03)',
              border: plan.highlight
                ? '1px solid rgba(0,200,255,0.5)'
                : '1px solid rgba(255,255,255,0.08)',
              backdropFilter: 'blur(12px)',
              boxShadow: plan.highlight ? '0 0 40px rgba(0,200,255,0.1)' : 'none',
            }}
          >
            {plan.highlight && (
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full text-xs font-bold text-black" style={{ background: 'linear-gradient(90deg, #00c8ff, #0077ff)' }}>
                ХИТ
              </div>
            )}

            <div className="text-4xl mb-4">{plan.emoji}</div>
            <h2 className="text-xl font-bold text-white mb-1">{plan.period}</h2>
            <p className="text-white/40 text-xs mb-5">{plan.description}</p>

            <div className="mb-1">
              <span className="text-5xl font-extrabold text-white">{plan.price}</span>
              <span className="text-white/50 text-lg ml-1">₽</span>
            </div>
            <p className="text-white/30 text-xs mb-7">{plan.perDay} ₽ в день</p>

            <a
              href="/dashboard"
              className="w-full py-3 rounded-lg font-bold text-sm transition duration-300"
              style={
                plan.highlight
                  ? { background: 'linear-gradient(90deg, #00c8ff, #0077ff)', color: '#000' }
                  : { background: 'rgba(0,200,255,0.1)', color: '#00c8ff', border: '1px solid rgba(0,200,255,0.25)' }
              }
            >
              {plan.label} →
            </a>
          </div>
        ))}
      </div>

      {/* Footer note */}
      <p className="text-white/25 text-xs mt-10 z-10 text-center">
        Оплата через Telegram-бот · Ключ активируется мгновенно · Поддержка 24/7
      </p>
    </div>
  )
}

export default Pricing