import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

const ADMIN_URL = 'https://functions.poehali.dev/f99ba45e-5232-486a-9d4d-a67429d80605'

const PLANS = ['7 дней', '1 месяц', '3 месяца']

type User = {
  id: number
  username: string
  created_at: string
  subscription: {
    plan: string
    expires_at: string | null
    vpn_key: string | null
    active: boolean
  } | null
}

type KeyRow = {
  id: number
  vpn_key: string
  plan: string
  used: boolean
  assigned_to: string | null
}

const cardStyle = { background: 'rgba(0,200,255,0.05)', border: '1px solid rgba(0,200,255,0.15)', backdropFilter: 'blur(12px)' }

const Admin = () => {
  const navigate = useNavigate()
  const [authed, setAuthed] = useState(false)
  const [password, setPassword] = useState('')
  const [token, setToken] = useState('')
  const [authError, setAuthError] = useState('')
  const [users, setUsers] = useState<User[]>([])
  const [keys, setKeys] = useState<KeyRow[]>([])
  const [tab, setTab] = useState<'users' | 'keys'>('users')
  const [loading, setLoading] = useState(false)
  const [assignUsername, setAssignUsername] = useState('')
  const [assignPlan, setAssignPlan] = useState('1 месяц')
  const [assignKey, setAssignKey] = useState('')
  const [assignMsg, setAssignMsg] = useState('')
  const [assignError, setAssignError] = useState('')

  useEffect(() => {
    const saved = localStorage.getItem('mvp_admin_token')
    if (saved) { setToken(saved); setAuthed(true); loadData(saved) }
  }, [])

  const login = async () => {
    setAuthError('')
    const res = await fetch(ADMIN_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'login', password }),
    })
    const data = await res.json()
    if (data.ok) {
      localStorage.setItem('mvp_admin_token', data.token)
      setToken(data.token)
      setAuthed(true)
      loadData(data.token)
    } else {
      setAuthError(data.error || 'Неверный пароль')
    }
  }

  const loadData = async (t: string) => {
    setLoading(true)
    const [uRes, kRes] = await Promise.all([
      fetch(`${ADMIN_URL}?type=users`, { headers: { 'X-Admin-Token': t } }),
      fetch(`${ADMIN_URL}?type=keys`, { headers: { 'X-Admin-Token': t } }),
    ])
    const uData = await uRes.json()
    const kData = await kRes.json()
    setUsers(uData.users || [])
    setKeys(kData.keys || [])
    setLoading(false)
  }

  const assign = async () => {
    setAssignMsg(''); setAssignError('')
    const res = await fetch(ADMIN_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Admin-Token': token },
      body: JSON.stringify({ action: 'assign', username: assignUsername, plan: assignPlan, vpn_key: assignKey }),
    })
    const data = await res.json()
    if (data.ok) {
      setAssignMsg(`✅ Выдан ключ для ${data.username} (${data.plan}) до ${formatDate(data.expires_at)}`)
      setAssignUsername(''); setAssignKey('')
      loadData(token)
    } else {
      setAssignError(data.error || 'Ошибка')
    }
  }

  const logout = () => {
    localStorage.removeItem('mvp_admin_token')
    setAuthed(false); setToken(''); setUsers([]); setKeys([])
  }

  const formatDate = (iso: string | null) => {
    if (!iso) return '—'
    return new Date(iso).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short', year: 'numeric' })
  }

  const freeKeys = (plan: string) => keys.filter(k => k.plan === plan && !k.used).length

  const inputStyle: React.CSSProperties = { background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(0,200,255,0.2)', outline: 'none', color: 'white' }

  return (
    <div className="min-h-screen w-full px-4 py-10 relative overflow-hidden"
      style={{ background: 'linear-gradient(135deg, #020b18 0%, #041428 50%, #020b18 100%)' }}>
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] pointer-events-none"
        style={{ background: 'radial-gradient(ellipse, rgba(0,200,255,0.06) 0%, transparent 70%)' }} />

      <button onClick={() => navigate('/')} className="relative z-10 text-white/40 hover:text-white transition text-sm mb-8 block">← Главная</button>

      <div className="max-w-4xl mx-auto relative z-10">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-white">MVP VPN <span style={{ color: '#00c8ff' }}>Админ</span></h1>
            <p className="text-white/30 text-xs mt-0.5">Управление подписками</p>
          </div>
          {authed && <button onClick={logout} className="text-white/30 hover:text-white/60 text-xs transition">Выйти</button>}
        </div>

        {/* LOGIN */}
        {!authed && (
          <div className="max-w-sm mx-auto rounded-2xl p-7" style={cardStyle}>
            <h2 className="text-lg font-bold text-white mb-5">Вход в панель</h2>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && login()}
              placeholder="Пароль" className="w-full rounded-lg px-4 py-3 text-sm mb-3"
              style={inputStyle} />
            {authError && <p className="text-red-400 text-xs mb-3">{authError}</p>}
            <button onClick={login} className="w-full font-bold py-3 rounded-lg text-black"
              style={{ background: 'linear-gradient(90deg, #00c8ff, #0077ff)' }}>Войти</button>
          </div>
        )}

        {authed && (
          <>
            {/* Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
              <div className="rounded-xl p-4 text-center" style={cardStyle}>
                <div className="text-2xl font-bold text-white">{users.length}</div>
                <div className="text-white/40 text-xs mt-0.5">Пользователей</div>
              </div>
              <div className="rounded-xl p-4 text-center" style={cardStyle}>
                <div className="text-2xl font-bold text-white">{users.filter(u => u.subscription?.active).length}</div>
                <div className="text-white/40 text-xs mt-0.5">Активных</div>
              </div>
              {PLANS.slice(0, 2).map(plan => (
                <div key={plan} className="rounded-xl p-4 text-center" style={cardStyle}>
                  <div className="text-2xl font-bold" style={{ color: freeKeys(plan) > 0 ? '#00ff96' : '#ff6060' }}>{freeKeys(plan)}</div>
                  <div className="text-white/40 text-xs mt-0.5">Ключей «{plan}»</div>
                </div>
              ))}
            </div>

            {/* Assign form */}
            <div className="rounded-2xl p-6 mb-6" style={{ background: 'rgba(0,200,255,0.04)', border: '1px solid rgba(0,200,255,0.15)' }}>
              <h3 className="text-white font-bold mb-4">Выдать ключ пользователю</h3>
              <div className="grid sm:grid-cols-3 gap-3 mb-3">
                <div>
                  <label className="block text-white/40 text-xs mb-1">Логин пользователя</label>
                  <input value={assignUsername} onChange={e => setAssignUsername(e.target.value)}
                    placeholder="username" className="w-full rounded-lg px-3 py-2 text-sm" style={inputStyle} />
                </div>
                <div>
                  <label className="block text-white/40 text-xs mb-1">Тариф</label>
                  <select value={assignPlan} onChange={e => setAssignPlan(e.target.value)}
                    className="w-full rounded-lg px-3 py-2 text-sm" style={inputStyle}>
                    {PLANS.map(p => <option key={p} value={p}>{p}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-white/40 text-xs mb-1">Свой ключ (необязательно)</label>
                  <input value={assignKey} onChange={e => setAssignKey(e.target.value)}
                    placeholder="Автоматически из пула" className="w-full rounded-lg px-3 py-2 text-sm" style={inputStyle} />
                </div>
              </div>
              {assignMsg && <p className="text-green-400 text-xs mb-2">{assignMsg}</p>}
              {assignError && <p className="text-red-400 text-xs mb-2">{assignError}</p>}
              <button onClick={assign} className="font-bold py-2 px-6 rounded-lg text-black text-sm"
                style={{ background: 'linear-gradient(90deg, #00c8ff, #0077ff)' }}>
                Выдать ключ
              </button>
            </div>

            {/* Tabs */}
            <div className="flex gap-2 mb-4">
              {(['users', 'keys'] as const).map(t => (
                <button key={t} onClick={() => setTab(t)}
                  className="px-4 py-2 rounded-lg text-sm font-semibold transition"
                  style={tab === t
                    ? { background: 'linear-gradient(90deg, #00c8ff, #0077ff)', color: '#000' }
                    : { background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.5)', border: '1px solid rgba(255,255,255,0.1)' }
                  }>
                  {t === 'users' ? `Пользователи (${users.length})` : `Ключи (${keys.filter(k => !k.used).length} свободных)`}
                </button>
              ))}
              <button onClick={() => loadData(token)} className="ml-auto text-white/30 hover:text-white text-xs transition">↻ Обновить</button>
            </div>

            {loading && <p className="text-white/40 text-sm text-center py-8">Загрузка...</p>}

            {/* Users table */}
            {!loading && tab === 'users' && (
              <div className="rounded-2xl overflow-hidden" style={cardStyle}>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr style={{ borderBottom: '1px solid rgba(0,200,255,0.1)' }}>
                        <th className="text-left px-4 py-3 text-white/40 text-xs font-medium">Логин</th>
                        <th className="text-left px-4 py-3 text-white/40 text-xs font-medium">Статус</th>
                        <th className="text-left px-4 py-3 text-white/40 text-xs font-medium">Тариф</th>
                        <th className="text-left px-4 py-3 text-white/40 text-xs font-medium">Истекает</th>
                        <th className="text-left px-4 py-3 text-white/40 text-xs font-medium">Ключ</th>
                      </tr>
                    </thead>
                    <tbody>
                      {users.map(u => (
                        <tr key={u.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                          <td className="px-4 py-3 text-white font-medium">{u.username}</td>
                          <td className="px-4 py-3">
                            {u.subscription?.active
                              ? <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: 'rgba(0,255,150,0.15)', color: '#00ff96' }}>● Активна</span>
                              : u.subscription
                                ? <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: 'rgba(255,80,80,0.15)', color: '#ff6060' }}>● Истекла</span>
                                : <span className="text-xs text-white/30">Нет</span>
                            }
                          </td>
                          <td className="px-4 py-3 text-white/60 text-xs">{u.subscription?.plan || '—'}</td>
                          <td className="px-4 py-3 text-white/60 text-xs">{formatDate(u.subscription?.expires_at || null)}</td>
                          <td className="px-4 py-3 text-xs font-mono max-w-[160px] truncate" style={{ color: '#00c8ff' }}>
                            {u.subscription?.vpn_key || '—'}
                          </td>
                        </tr>
                      ))}
                      {users.length === 0 && (
                        <tr><td colSpan={5} className="text-center text-white/30 py-8 text-sm">Пользователей пока нет</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Keys table */}
            {!loading && tab === 'keys' && (
              <div className="rounded-2xl overflow-hidden" style={cardStyle}>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr style={{ borderBottom: '1px solid rgba(0,200,255,0.1)' }}>
                        <th className="text-left px-4 py-3 text-white/40 text-xs font-medium">Тариф</th>
                        <th className="text-left px-4 py-3 text-white/40 text-xs font-medium">Статус</th>
                        <th className="text-left px-4 py-3 text-white/40 text-xs font-medium">Выдан</th>
                        <th className="text-left px-4 py-3 text-white/40 text-xs font-medium">Ключ</th>
                      </tr>
                    </thead>
                    <tbody>
                      {keys.map(k => (
                        <tr key={k.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                          <td className="px-4 py-3 text-white/80 text-xs">{k.plan}</td>
                          <td className="px-4 py-3">
                            {k.used
                              ? <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: 'rgba(255,80,80,0.15)', color: '#ff6060' }}>Использован</span>
                              : <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: 'rgba(0,255,150,0.15)', color: '#00ff96' }}>Свободен</span>
                            }
                          </td>
                          <td className="px-4 py-3 text-white/40 text-xs">{k.assigned_to || '—'}</td>
                          <td className="px-4 py-3 text-xs font-mono truncate max-w-[200px]" style={{ color: k.used ? 'rgba(255,255,255,0.2)' : '#00c8ff' }}>
                            {k.vpn_key}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}

export default Admin
