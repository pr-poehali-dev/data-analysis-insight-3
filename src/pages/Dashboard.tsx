import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

const subscriptions = [
  {
    id: 1,
    name: 'Устройство #1',
    plan: '1 месяц',
    key: 'mvp-xxxx-1a2b-3c4d',
    expires: '27 апреля 2026',
    active: true,
    device: '📱 iPhone 14',
  },
  {
    id: 2,
    name: 'Устройство #2',
    plan: '7 дней',
    key: 'mvp-yyyy-5e6f-7g8h',
    expires: '1 апреля 2026',
    active: true,
    device: '💻 MacBook Pro',
  },
  {
    id: 3,
    name: 'Устройство #3',
    plan: '3 месяца',
    key: 'mvp-zzzz-9i0j-1k2l',
    expires: '10 марта 2026',
    active: false,
    device: '🖥️ Windows PC',
  },
]

const Dashboard = () => {
  const navigate = useNavigate()
  const [copied, setCopied] = useState<number | null>(null)

  const handleCopy = (key: string, id: number) => {
    navigator.clipboard.writeText(key)
    setCopied(id)
    setTimeout(() => setCopied(null), 2000)
  }

  const activeCount = subscriptions.filter(s => s.active).length
  const totalCount = subscriptions.length

  return (
    <div
      className="min-h-screen w-full px-4 py-10 relative overflow-hidden"
      style={{ background: 'linear-gradient(135deg, #020b18 0%, #041428 50%, #020b18 100%)' }}
    >
      {/* Glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] pointer-events-none" style={{ background: 'radial-gradient(ellipse, rgba(0,200,255,0.06) 0%, transparent 70%)' }} />

      <div className="max-w-3xl mx-auto relative z-10">

        {/* Header */}
        <div className="flex items-center justify-between mb-10">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate('/')} className="text-white/40 hover:text-white transition text-sm">← Главная</button>
          </div>
          <a
            href="https://t.me/mvpvpnproxybot"
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm font-bold py-2 px-5 rounded-md text-black transition"
            style={{ background: 'linear-gradient(90deg, #00c8ff, #0077ff)' }}
          >
            + Получить ключ
          </a>
        </div>

        {/* Title */}
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-1">Личный кабинет</h1>
          <p className="text-white/40 text-sm">MVP VPN — управление подписками</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-8">
          <div className="rounded-xl p-4 text-center" style={{ background: 'rgba(0,200,255,0.06)', border: '1px solid rgba(0,200,255,0.15)' }}>
            <div className="text-3xl font-bold text-white">{activeCount}</div>
            <div className="text-white/40 text-xs mt-1">Активных</div>
          </div>
          <div className="rounded-xl p-4 text-center" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
            <div className="text-3xl font-bold text-white">{totalCount - activeCount}</div>
            <div className="text-white/40 text-xs mt-1">Истёкших</div>
          </div>
          <div className="rounded-xl p-4 text-center col-span-2 sm:col-span-1" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
            <div className="text-3xl font-bold text-white">{totalCount}</div>
            <div className="text-white/40 text-xs mt-1">Всего устройств</div>
          </div>
        </div>

        {/* Subscriptions */}
        <h2 className="text-lg font-semibold text-white mb-4">Мои подписки</h2>
        <div className="flex flex-col gap-4">
          {subscriptions.map((sub) => (
            <div
              key={sub.id}
              className="rounded-2xl p-5"
              style={{
                background: sub.active ? 'rgba(0,200,255,0.05)' : 'rgba(255,255,255,0.02)',
                border: sub.active ? '1px solid rgba(0,200,255,0.2)' : '1px solid rgba(255,255,255,0.06)',
                backdropFilter: 'blur(10px)',
              }}
            >
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div className="flex items-center gap-3">
                  <div className="text-2xl">{sub.device.split(' ')[0]}</div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-white font-semibold text-sm">{sub.name}</span>
                      <span
                        className="text-xs px-2 py-0.5 rounded-full font-semibold"
                        style={sub.active
                          ? { background: 'rgba(0,255,150,0.15)', color: '#00ff96' }
                          : { background: 'rgba(255,80,80,0.15)', color: '#ff6060' }
                        }
                      >
                        {sub.active ? '● Активна' : '● Истекла'}
                      </span>
                    </div>
                    <div className="text-white/40 text-xs mt-0.5">{sub.device.split(' ').slice(1).join(' ')} · Тариф: {sub.plan}</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-white/30 text-xs">
                    {sub.active ? 'Действует до' : 'Истекла'}
                  </div>
                  <div className={`text-sm font-semibold ${sub.active ? 'text-white' : 'text-white/30'}`}>{sub.expires}</div>
                </div>
              </div>

              {/* Key */}
              <div className="mt-4 flex items-center gap-2">
                <div
                  className="flex-1 rounded-lg px-3 py-2 text-xs font-mono truncate"
                  style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.07)', color: sub.active ? '#00c8ff' : '#ffffff30' }}
                >
                  {sub.key}
                </div>
                <button
                  onClick={() => handleCopy(sub.key, sub.id)}
                  className="text-xs px-3 py-2 rounded-lg font-semibold transition whitespace-nowrap"
                  style={copied === sub.id
                    ? { background: 'rgba(0,255,150,0.15)', color: '#00ff96' }
                    : { background: 'rgba(0,200,255,0.1)', color: '#00c8ff', border: '1px solid rgba(0,200,255,0.2)' }
                  }
                >
                  {copied === sub.id ? '✓ Скопировано' : 'Копировать'}
                </button>
              </div>

              {!sub.active && (
                <a
                  href="https://t.me/mvpvpnproxybot"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-3 inline-block text-xs font-semibold py-2 px-4 rounded-lg text-black transition"
                  style={{ background: 'linear-gradient(90deg, #00c8ff, #0077ff)' }}
                >
                  Продлить подписку →
                </a>
              )}
            </div>
          ))}
        </div>

        <p className="text-white/20 text-xs text-center mt-10">MVP VPN · Личный кабинет · Управление ключами</p>
      </div>
    </div>
  )
}

export default Dashboard
