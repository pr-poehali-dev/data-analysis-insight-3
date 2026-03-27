import { useNavigate } from 'react-router-dom'

const HowItWorks = () => {
  const navigate = useNavigate()

  return (
    <div
      className="min-h-screen w-full flex flex-col items-center justify-center px-4 py-16 relative overflow-hidden"
      style={{ background: 'linear-gradient(135deg, #020b18 0%, #041428 50%, #020b18 100%)' }}
    >
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full pointer-events-none" style={{ background: 'radial-gradient(circle, rgba(0,200,255,0.06) 0%, transparent 70%)' }} />

      <button
        onClick={() => navigate('/')}
        className="absolute top-6 left-6 text-white/50 hover:text-white transition text-sm flex items-center gap-2"
      >
        ← На главную
      </button>

      <div className="max-w-2xl w-full z-10">
        <div className="text-center mb-10">
          <div className="inline-block mb-4 px-3 py-1 rounded-full text-xs font-semibold tracking-widest uppercase" style={{ background: 'rgba(0,200,255,0.1)', border: '1px solid rgba(0,200,255,0.3)', color: '#00c8ff' }}>
            Как это работает
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
            Ключи{' '}
            <span style={{ background: 'linear-gradient(90deg, #00c8ff, #0077ff)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              V2Ray + TUN
            </span>
          </h1>
          <p className="text-white/50 text-lg">Технология, которая делает ваш VPN невидимым</p>
        </div>

        <div className="rounded-2xl p-8 mb-6" style={{ background: 'rgba(0,200,255,0.05)', border: '1px solid rgba(0,200,255,0.15)', backdropFilter: 'blur(12px)' }}>
          <div className="flex items-start gap-4 mb-6">
            <div className="text-3xl">🔑</div>
            <div>
              <h2 className="text-xl font-bold text-white mb-2">Что такое ключ доступа</h2>
              <p className="text-white/55 text-sm leading-relaxed">
                Ключи для VPN через <span className="text-cyan-400 font-medium">V2Ray с TUN</span> — это секретные токены, которые аутентифицируют устройство и позволяют установить безопасное соединение.
              </p>
            </div>
          </div>

          <div className="w-full h-px mb-6" style={{ background: 'rgba(0,200,255,0.1)' }} />

          <div className="flex items-start gap-4">
            <div className="text-3xl">🛡️</div>
            <div>
              <h2 className="text-xl font-bold text-white mb-2">Как работает TUN-адаптер</h2>
              <p className="text-white/55 text-sm leading-relaxed">
                TUN-адаптер обеспечивает прозрачную маршрутизацию <span className="text-white/80 font-medium">всего системного трафика</span> через зашифрованный канал — без ручных настроек для каждого приложения.
              </p>
            </div>
          </div>

          <div className="w-full h-px my-6" style={{ background: 'rgba(0,200,255,0.1)' }} />

          <div className="flex items-start gap-4">
            <div className="text-3xl">⚡</div>
            <div>
              <h2 className="text-xl font-bold text-white mb-2">Результат</h2>
              <p className="text-white/55 text-sm leading-relaxed">
                Работа VPN максимально <span className="text-cyan-400 font-medium">удобная и скрытая</span> — весь трафик шифруется автоматически, не требуя дополнительных действий от пользователя.
              </p>
            </div>
          </div>
        </div>

        <div className="text-center">
          <a
            href="https://t.me/mvpvpnproxybot"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block font-bold py-3 px-10 rounded-lg transition duration-300 text-black"
            style={{ background: 'linear-gradient(90deg, #00c8ff, #0077ff)' }}
          >
            Получить ключ →
          </a>
        </div>
      </div>
    </div>
  )
}

export default HowItWorks
