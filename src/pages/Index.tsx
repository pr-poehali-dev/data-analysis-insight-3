import { Canvas, useFrame } from '@react-three/fiber'
import { OrbitControls, Grid } from '@react-three/drei'
import { useEffect, useRef, useState } from 'react'
import * as THREE from 'three'

function SpinningLogo() {
  const groupRef = useRef<THREE.Group>(null)

  useFrame((_, delta) => {
    if (groupRef.current) {
      groupRef.current.rotation.y += delta * 0.5
    }
  })

  return (
    <group ref={groupRef}>
      <mesh position={[0, 0, 0]}>
        <torusGeometry args={[0.6, 0.2, 16, 32]} />
        <meshStandardMaterial color="#00c8ff" emissive="#003a4d" />
      </mesh>
      <mesh position={[0, 0, 0]}>
        <sphereGeometry args={[0.25, 16, 16]} />
        <meshStandardMaterial color="#ffffff" emissive="#aaf0ff" emissiveIntensity={0.3} />
      </mesh>
    </group>
  )
}

function AnimatedBox({ initialPosition }: { initialPosition: [number, number, number] }) {
  const meshRef = useRef<THREE.Mesh>(null)
  const [targetPosition, setTargetPosition] = useState(new THREE.Vector3(...initialPosition))
  const currentPosition = useRef(new THREE.Vector3(...initialPosition))

  const getAdjacentIntersection = (current: THREE.Vector3) => {
    const directions = [[1, 0], [-1, 0], [0, 1], [0, -1]]
    const randomDirection = directions[Math.floor(Math.random() * directions.length)]
    return new THREE.Vector3(
      current.x + randomDirection[0] * 3,
      0.5,
      current.z + randomDirection[1] * 3
    )
  }

  useEffect(() => {
    const interval = setInterval(() => {
      const newPosition = getAdjacentIntersection(currentPosition.current)
      newPosition.x = Math.max(-15, Math.min(15, newPosition.x))
      newPosition.z = Math.max(-15, Math.min(15, newPosition.z))
      setTargetPosition(newPosition)
    }, 1000)
    return () => clearInterval(interval)
  }, [])

  useFrame(() => {
    if (meshRef.current) {
      currentPosition.current.lerp(targetPosition, 0.1)
      meshRef.current.position.copy(currentPosition.current)
    }
  })

  return (
    <mesh ref={meshRef} position={initialPosition}>
      <boxGeometry args={[1, 1, 1]} />
      <meshStandardMaterial color="#00c8ff" opacity={0.5} transparent emissive="#003a4d" />
      <lineSegments>
        <edgesGeometry attach="geometry" args={[new THREE.BoxGeometry(1, 1, 1)]} />
        <lineBasicMaterial attach="material" color="#00c8ff" linewidth={2} />
      </lineSegments>
    </mesh>
  )
}

function Scene() {
  const initialPositions: [number, number, number][] = [
    [-9, 0.5, -9], [-3, 0.5, -3], [0, 0.5, 0], [3, 0.5, 3],
    [9, 0.5, 9], [-6, 0.5, 6], [6, 0.5, -6], [-12, 0.5, 0],
    [12, 0.5, 0], [0, 0.5, 12],
  ]

  return (
    <>
      <OrbitControls enableZoom={false} enablePan={false} />
      <ambientLight intensity={0.3} />
      <pointLight position={[10, 10, 10]} color="#00c8ff" intensity={1.5} />
      <pointLight position={[-10, 5, -10]} color="#0055ff" intensity={0.8} />
      <Grid
        renderOrder={-1}
        position={[0, 0, 0]}
        infiniteGrid
        cellSize={1}
        cellThickness={0.5}
        sectionSize={3}
        sectionThickness={1}
        sectionColor={[0, 0.5, 0.8]}
        fadeDistance={50}
      />
      {initialPositions.map((position, index) => (
        <AnimatedBox key={index} initialPosition={position} />
      ))}
    </>
  )
}

const Index = () => {
  const [menuOpen, setMenuOpen] = useState(false)

  return (
    <div
      className="relative w-full min-h-screen overflow-x-hidden font-inter"
      style={{ background: 'linear-gradient(135deg, #020b18 0%, #041428 50%, #020b18 100%)' }}
    >
      {/* HEADER */}
      <header className="relative z-20 p-4">
        <nav className="flex justify-between items-center max-w-6xl mx-auto">
          <div className="flex items-center gap-2">
            <div className="w-12 h-12">
              <Canvas camera={{ position: [0, 0, 5] }}>
                <ambientLight intensity={0.5} />
                <pointLight position={[10, 10, 10]} color="#00c8ff" />
                <SpinningLogo />
              </Canvas>
            </div>
            <span className="text-xl font-bold text-white tracking-wide">MVP <span style={{ color: '#00c8ff' }}>VPN</span></span>
          </div>

          {/* Desktop nav */}
          <ul className="hidden md:flex space-x-6 text-white/80">
            <li><a href="#features" className="hover:text-cyan-400 transition">Возможности</a></li>
            <li><a href="/how-it-works" className="hover:text-cyan-400 transition">Как работает</a></li>
            <li><a href="/pricing" className="hover:text-cyan-400 transition">Тарифы</a></li>
          </ul>
          <a
            href="https://t.me/mvpvpnproxybot"
            target="_blank"
            rel="noopener noreferrer"
            className="hidden md:block text-sm font-semibold py-2 px-5 rounded-md transition duration-300 text-black"
            style={{ background: 'linear-gradient(90deg, #00c8ff, #0077ff)' }}
          >
            Личный кабинет
          </a>

          {/* Burger */}
          <button
            className="md:hidden flex flex-col gap-1.5 p-2 z-30"
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label="Меню"
          >
            <span className="block w-6 h-0.5 bg-white transition-all" style={{ transform: menuOpen ? 'rotate(45deg) translateY(8px)' : 'none' }} />
            <span className="block w-6 h-0.5 bg-white transition-all" style={{ opacity: menuOpen ? 0 : 1 }} />
            <span className="block w-6 h-0.5 bg-white transition-all" style={{ transform: menuOpen ? 'rotate(-45deg) translateY(-8px)' : 'none' }} />
          </button>
        </nav>

        {/* Mobile menu */}
        {menuOpen && (
          <div className="md:hidden absolute top-full left-0 right-0 z-20 px-4 pb-4 pt-2" style={{ background: 'rgba(2,11,24,0.98)', borderBottom: '1px solid rgba(0,200,255,0.15)' }}>
            <ul className="flex flex-col gap-4 text-white/80 text-base">
              <li><a href="#features" className="block py-2 hover:text-cyan-400 transition" onClick={() => setMenuOpen(false)}>Возможности</a></li>
              <li><a href="/how-it-works" className="block py-2 hover:text-cyan-400 transition" onClick={() => setMenuOpen(false)}>Как работает</a></li>
              <li><a href="/pricing" className="block py-2 hover:text-cyan-400 transition" onClick={() => setMenuOpen(false)}>Тарифы</a></li>
            </ul>
            <a
              href="https://t.me/mvpvpnproxybot"
              target="_blank"
              rel="noopener noreferrer"
              className="mt-4 block text-center font-bold py-3 px-8 rounded-md text-black text-base"
              style={{ background: 'linear-gradient(90deg, #00c8ff, #0077ff)' }}
              onClick={() => setMenuOpen(false)}
            >
              Получить ключ
            </a>
          </div>
        )}
      </header>

      {/* 3D CANVAS — только на десктопе, на мобиле заменяем градиентом */}
      <div className="hidden md:block absolute inset-0 z-0" style={{ top: 0 }}>
        <Canvas shadows camera={{ position: [30, 30, 30], fov: 50 }} style={{ width: '100%', height: '100vh' }}>
          <Scene />
        </Canvas>
      </div>

      {/* Мобильный фоновый градиент вместо 3D */}
      <div className="md:hidden absolute inset-0 z-0 pointer-events-none">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-72 h-72 rounded-full" style={{ background: 'radial-gradient(circle, rgba(0,200,255,0.12) 0%, transparent 70%)' }} />
        <div className="absolute bottom-1/4 right-0 w-48 h-48 rounded-full" style={{ background: 'radial-gradient(circle, rgba(0,119,255,0.1) 0%, transparent 70%)' }} />
      </div>

      {/* HERO */}
      <div className="relative z-10 flex flex-col items-center text-center px-6 pt-12 pb-8 md:absolute md:top-1/3 md:left-1/2 md:transform md:-translate-x-1/2 md:-translate-y-1/2 md:pt-0 md:pb-0">
        <div className="inline-block mb-4 px-3 py-1 rounded-full text-xs font-semibold tracking-widest uppercase" style={{ background: 'rgba(0,200,255,0.1)', border: '1px solid rgba(0,200,255,0.3)', color: '#00c8ff' }}>
          B2B решение
        </div>
        <h1 className="text-3xl sm:text-4xl md:text-6xl font-bold mb-5 max-w-4xl mx-auto text-white leading-tight">
          Корпоративный VPN<br />
          <span style={{ background: 'linear-gradient(90deg, #00c8ff, #0077ff)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            под полным контролем
          </span>
        </h1>
        <h2 className="text-base md:text-xl mb-8 text-white/60 max-w-xl mx-auto">
          Конфигурации и импорт в V2RayTun — через URL, QR-код или файл. Протоколы VLESS Reality и WebSocket с готовыми примерами от сервиса
        </h2>
        <div className="flex flex-col sm:flex-row gap-4 justify-center w-full sm:w-auto">
          <a
            href="https://t.me/mvpvpnproxybot"
            target="_blank"
            rel="noopener noreferrer"
            className="font-bold py-3 px-8 rounded-md transition duration-300 text-black text-base text-center"
            style={{ background: 'linear-gradient(90deg, #00c8ff, #0077ff)' }}
          >
            Получить ключ
          </a>
          <a
            href="/pricing"
            className="font-semibold py-3 px-8 rounded-md transition duration-300 text-base flex items-center justify-center gap-2 group"
            style={{ border: '1px solid rgba(0,200,255,0.3)', background: 'rgba(0,200,255,0.06)', color: '#00c8ff' }}
          >
            <span>Смотреть тарифы</span>
            <span className="group-hover:translate-x-1 transition-transform duration-200">→</span>
          </a>
        </div>

        {/* Работает через */}
        <div className="mt-8 flex flex-col items-center gap-3">
          <p className="text-white/30 text-xs uppercase tracking-widest">Работает через</p>
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2 px-4 py-2 rounded-xl" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}>
              <img src="https://cdn.poehali.dev/projects/d539374e-ced8-4860-9ec9-ebd2c91c5053/bucket/79d56c2a-dca9-4932-b053-376785cf2e33.jpg" alt="MVP VPN" className="h-8 w-auto rounded-md" />
            </div>
            <div className="flex items-center gap-2 px-4 py-2 rounded-xl" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}>
              <img src="https://cdn.poehali.dev/projects/d539374e-ced8-4860-9ec9-ebd2c91c5053/bucket/21a5dc72-19e2-40a4-840d-48799b33eabb.png" alt="V2Ray" className="h-8 w-8 rounded-lg" />
              <span className="text-white font-bold text-sm">V2RayTun</span>
            </div>
          </div>
        </div>
      </div>

      {/* FEATURES */}
      <section
        id="features"
        className="relative z-10 mt-8 md:mt-0 md:absolute md:bottom-0 md:left-0 md:right-0 px-4 pt-8 pb-12"
        style={{ background: 'linear-gradient(to top, #020b18 60%, transparent)' }}
      >
        <div className="max-w-6xl mx-auto">
          <h3 className="text-xl md:text-3xl font-bold text-center mb-6 text-white">Почему MVP VPN?</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="rounded-lg p-5" style={{ background: 'rgba(0,200,255,0.05)', border: '1px solid rgba(0,200,255,0.15)', backdropFilter: 'blur(10px)' }}>
              <div className="text-2xl mb-3">🔐</div>
              <h4 className="text-base font-semibold mb-2 text-white">Личный кабинет компании</h4>
              <p className="text-white/50 text-sm">Управляйте всеми сотрудниками, устройствами и правами доступа из единой панели администратора.</p>
            </div>
            <div className="rounded-lg p-5" style={{ background: 'rgba(0,200,255,0.05)', border: '1px solid rgba(0,200,255,0.15)', backdropFilter: 'blur(10px)' }}>
              <div className="text-2xl mb-3">🌐</div>
              <h4 className="text-base font-semibold mb-2 text-white">Глобальная сеть серверов</h4>
              <p className="text-white/50 text-sm">Высокоскоростные серверы по всему миру обеспечивают стабильное соединение без задержек для всей команды.</p>
            </div>
            <div className="rounded-lg p-5" style={{ background: 'rgba(0,200,255,0.05)', border: '1px solid rgba(0,200,255,0.15)', backdropFilter: 'blur(10px)' }}>
              <div className="text-2xl mb-3">⚡</div>
              <h4 className="text-base font-semibold mb-2 text-white">Быстрый интернет без ограничений</h4>
              <p className="text-white/50 text-sm">Без замедлений и блокировок — сотрудники работают с любыми сервисами и ресурсами по всему миру на полной скорости.</p>
            </div>
            <div className="rounded-lg p-5" style={{ background: 'rgba(0,200,255,0.05)', border: '1px solid rgba(0,200,255,0.15)', backdropFilter: 'blur(10px)' }}>
              <div className="flex flex-wrap gap-1 mb-3 text-xl">📸 ▶️ 🎵 🎮</div>
              <h4 className="text-base font-semibold mb-2 text-white">Доступ к любым платформам</h4>
              <p className="text-white/50 text-sm">TikTok, Instagram, YouTube, Discord, Brawl Stars и другие игры — без блокировок и задержек, как будто их никогда не было.</p>
              <a href="/platforms" className="inline-block mt-3 text-xs font-semibold transition" style={{ color: '#00c8ff' }}>Все платформы →</a>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}

export default Index