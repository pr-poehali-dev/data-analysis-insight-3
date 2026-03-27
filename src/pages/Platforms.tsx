import { useNavigate } from 'react-router-dom'

const platforms = [
  { emoji: '🎵', name: 'TikTok', desc: 'Смотри и публикуй видео без ограничений' },
  { emoji: '📸', name: 'Instagram', desc: 'Reels, Stories, DM — всё работает' },
  { emoji: '▶️', name: 'YouTube', desc: 'Видео в 4K без буферизации и задержек' },
  { emoji: '🎮', name: 'Discord', desc: 'Голосовые чаты и серверы без лагов' },
  { emoji: '⚔️', name: 'Brawl Stars', desc: 'Играй на любых серверах мира' },
  { emoji: '🎯', name: 'PUBG Mobile', desc: 'Низкий пинг и стабильное соединение' },
  { emoji: '🏆', name: 'Clash of Clans', desc: 'Без блокировок на любых регионах' },
  { emoji: '🕹️', name: 'Другие игры', desc: 'Любые онлайн-игры и игровые платформы' },
]

const Platforms = () => {
  const navigate = useNavigate()

  return (
    <div
      className="min-h-screen w-full px-4 py-16 relative overflow-hidden"
      style={{ background: 'linear-gradient(135deg, #020b18 0%, #041428 50%, #020b18 100%)' }}
    >
      {/* Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] rounded-full pointer-events-none" style={{ background: 'radial-gradient(circle, rgba(0,200,255,0.07) 0%, transparent 70%)' }} />

      <button
        onClick={() => navigate('/')}
        className="relative z-10 text-white/50 hover:text-white transition text-sm flex items-center gap-2 mb-12"
      >
        ← На главную
      </button>

      <div className="max-w-4xl mx-auto relative z-10">
        {/* Header */}
        <div className="text-center mb-14">
          <div className="inline-block mb-4 px-3 py-1 rounded-full text-xs font-semibold tracking-widest uppercase" style={{ background: 'rgba(0,200,255,0.1)', border: '1px solid rgba(0,200,255,0.3)', color: '#00c8ff' }}>
            Совместимость
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4 leading-tight">
            MVP VPN работает<br />
            <span style={{ background: 'linear-gradient(90deg, #00c8ff, #0077ff)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              везде, где вы
            </span>
          </h1>
          <p className="text-white/50 text-lg max-w-md mx-auto">
            Подключитесь один раз — и все ваши любимые платформы и игры откроются без ограничений
          </p>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-12">
          {platforms.map((p) => (
            <div
              key={p.name}
              className="rounded-2xl p-5 flex flex-col items-center text-center transition-transform hover:-translate-y-1"
              style={{ background: 'rgba(0,200,255,0.05)', border: '1px solid rgba(0,200,255,0.13)', backdropFilter: 'blur(10px)' }}
            >
              <div className="text-4xl mb-3">{p.emoji}</div>
              <h3 className="text-white font-bold text-sm mb-1">{p.name}</h3>
              <p className="text-white/40 text-xs leading-snug">{p.desc}</p>
            </div>
          ))}
        </div>

        {/* Banner */}
        <div
          className="rounded-2xl p-8 text-center mb-8"
          style={{ background: 'linear-gradient(135deg, rgba(0,200,255,0.1), rgba(0,119,255,0.1))', border: '1px solid rgba(0,200,255,0.25)' }}
        >
          <div className="text-3xl mb-3">🌍</div>
          <h2 className="text-xl font-bold text-white mb-2">И любые другие сервисы</h2>
          <p className="text-white/50 text-sm max-w-sm mx-auto">
            MVP VPN снимает блокировки на все платформы — если сайт или игра недоступны в вашем регионе, мы это исправим
          </p>
        </div>

        {/* CTA */}
        <div className="text-center">
          <a
            href="https://t.me/mvpvpnproxybot"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block font-bold py-3 px-10 rounded-lg transition duration-300 text-black text-base"
            style={{ background: 'linear-gradient(90deg, #00c8ff, #0077ff)' }}
          >
            Получить ключ →
          </a>
          <p className="text-white/25 text-xs mt-4">Активация через Telegram-бот · Мгновенно</p>
        </div>
      </div>
    </div>
  )
}

export default Platforms