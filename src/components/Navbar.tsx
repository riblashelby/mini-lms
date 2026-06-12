import { useAuth } from '../lib/auth'

export function Navbar() {
  const { user, logout } = useAuth()
  if (!user) return null

  return (
    <nav className="navbar">
      <div className="container">
        <div className="navbar-inner">
          <span className="navbar-brand">📚 Онлайн-школа</span>
          <div className="navbar-right">
            <span className="navbar-user">
              {user.role === 'admin' ? '👑 ' : ''}{user.name}
            </span>
            <button className="btn btn-secondary btn-sm" onClick={logout}>
              Выйти
            </button>
          </div>
        </div>
      </div>
    </nav>
  )
}
