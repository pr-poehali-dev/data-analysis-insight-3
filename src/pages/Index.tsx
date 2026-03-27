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
    const directions = [
      [1, 0],
      [-1, 0],
      [0, 1],
      [0, -1],
    ]
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
    [-9, 0.5, -9],
    [-3, 0.5, -3],
    [0, 0.5, 0],
    [3, 0.5, 3],
    [9, 0.5, 9],
    [-6, 0.5, 6],
    [6, 0.5, -6],
    [-12, 0.5, 0],
    [12, 0.5, 0],
    [0, 0.5, 12],
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
  return (
    <div className="relative w-full h-screen overflow-hidden font-inter" style={{ background: 'linear-gradient(135deg, #020b18 0%, #041428 50%, #020b18 100%)' }}>
      <header className="absolute top-0 left-0 right-0 z-10 p-4">
        <nav className="flex justify-between items-center max-w-6xl mx-auto">
          <div className="flex items-center gap-2">
            <div className="w-14 h-14">
              <Canvas camera={{ position: [0, 0, 5] }}>
                <ambientLight intensity={0.5} />
                <pointLight position={[10, 10, 10]} color="#00c8ff" />
                <SpinningLogo />
              </Canvas>
            </div>
            <span className="text-2xl font-bold text-white tracking-wide">MVP <span style={{ color: '#00c8ff' }}>VPN</span></span>
          </div>
          <ul className="hidden md:flex space-x-6 text-white/80">
            <li><a href="#features" className="hover:text-cyan-400 transition">Возможности</a></li>
            <li><a href="#how-it-works" className="hover:text-cyan-400 transition">Как работает</a></li>
            <li><a href="#pricing" className="hover:text-cyan-400 transition">Тарифы</a></li>
            <li><a href="#contact" className="hover:text-cyan-400 transition">Контакты</a></li>
          </ul>
          <button
            className="hidden md:block text-sm font-semibold py-2 px-5 rounded-md transition duration-300 text-black"
            style={{ background: 'linear-gradient(90deg, #00c8ff, #0077ff)' }}
          >
            Войти в кабинет
          </button>
        </nav>
      </header>

      <div className="absolute top-1/3 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-center z-10 px-4">
        <div className="inline-block mb-4 px-3 py-1 rounded-full text-xs font-semibold tracking-widest uppercase" style={{ background: 'rgba(0,200,255,0.1)', border: '1px solid rgba(0,200,255,0.3)', color: '#00c8ff' }}>
          B2B решение
        </div>
        <h1 className="text-4xl md:text-6xl font-bold mb-5 max-w-4xl mx-auto text-white leading-tight">
          Корпоративный VPN<br />
          <span style={{ background: 'linear-gradient(90deg, #00c8ff, #0077ff)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            под полным контролем
          </span>
        </h1>
        <h2 className="text-lg md:text-xl mb-10 text-white/60 max-w-xl mx-auto">
          Управляйте доступом сотрудников, трафиком и безопасностью компании через единый личный кабинет
        </h2>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <button
            className="font-bold py-3 px-8 rounded-md transition duration-300 text-black text-base"
            style={{ background: 'linear-gradient(90deg, #00c8ff, #0077ff)' }}
          >
            Получить демо-доступ
          </button>
          <button className="font-semibold py-3 px-8 rounded-md transition duration-300 text-white/80 hover:text-white text-base" style={{ border: '1px solid rgba(255,255,255,0.2)', background: 'rgba(255,255,255,0.05)' }}>
            Узнать подробнее
          </button>
        </div>
      </div>

      <Canvas shadows camera={{ position: [30, 30, 30], fov: 50 }} className="absolute inset-0">
        <Scene />
      </Canvas>

      {/* Features Section */}
      <section id="features" className="absolute bottom-0 left-0 right-0 z-10 pt-32 pb-12" style={{ background: 'linear-gradient(to top, #020b18 60%, transparent)' }}>
        <div className="max-w-6xl mx-auto px-4">
          <h3 className="text-2xl md:text-3xl font-bold text-center mb-8 text-white">Почему MVP VPN?</h3>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="rounded-lg p-6" style={{ background: 'rgba(0,200,255,0.05)', border: '1px solid rgba(0,200,255,0.15)', backdropFilter: 'blur(10px)' }}>
              <div className="text-2xl mb-3">🔐</div>
              <h4 className="text-xl font-semibold mb-3 text-white">Личный кабинет компании</h4>
              <p className="text-white/50">Управляйте всеми сотрудниками, устройствами и правами доступа из единой панели администратора.</p>
            </div>
            <div className="rounded-lg p-6" style={{ background: 'rgba(0,200,255,0.05)', border: '1px solid rgba(0,200,255,0.15)', backdropFilter: 'blur(10px)' }}>
              <div className="text-2xl mb-3">🌐</div>
              <h4 className="text-xl font-semibold mb-3 text-white">Глобальная сеть серверов</h4>
              <p className="text-white/50">Высокоскоростные серверы по всему миру обеспечивают стабильное соединение без задержек для всей команды.</p>
            </div>
            <div className="rounded-lg p-6" style={{ background: 'rgba(0,200,255,0.05)', border: '1px solid rgba(0,200,255,0.15)', backdropFilter: 'blur(10px)' }}>
              <div className="text-2xl mb-3">📊</div>
              <h4 className="text-xl font-semibold mb-3 text-white">Аналитика и отчёты</h4>
              <p className="text-white/50">Полная статистика использования, мониторинг трафика и автоматические отчёты для руководства компании.</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}

export default Index
