import { useState, FormEvent } from 'react'
import { useAuth } from '../lib/auth'

export function LoginPage() {
  const { login } = useAuth()
  const [code, setCode] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)
    const result = await login(code)
    if (result.error) {
      setError(result.error)
    }
    setLoading(false)
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
      }}
    >
      <div style={{ width: '100%', maxWidth: '380px' }}>
        {/* Logo / brand */}
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div style={{ fontSize: '2.8rem', marginBottom: '12px' }}>📚</div>
          <h1 style={{ fontSize: '1.6rem', marginBottom: '6px' }}>Онлайн-школа</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>
            Введите код доступа, чтобы войти
          </p>
        </div>

        <div className="card">
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div className="form-group">
              <label htmlFor="code">Код доступа</label>
              <input
                id="code"
                type="password"
                placeholder="Введите ваш код..."
                value={code}
                onChange={(e) => setCode(e.target.value)}
                autoFocus
                autoComplete="current-password"
                required
              />
            </div>

            {error && <div className="alert alert-error">{error}</div>}

            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading || !code.trim()}
              style={{ width: '100%', justifyContent: 'center', padding: '10px' }}
            >
              {loading ? <><span className="spinner" style={{ width: 16, height: 16 }} /> Проверяем...</> : 'Войти'}
            </button>
          </form>
        </div>

        <p style={{ textAlign: 'center', fontSize: '12px', color: 'var(--text-muted)', marginTop: '20px' }}>
          Код выдаёт администратор школы
        </p>
      </div>
    </div>
  )
}
