import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { supabase } from '../lib/supabase'
import type { AppUser } from '../types'

interface AuthContextValue {
  user: AppUser | null
  loading: boolean
  login: (accessCode: string) => Promise<{ error: string | null }>
  logout: () => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

const SESSION_KEY = 'lms_session'

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AppUser | null>(null)
  const [loading, setLoading] = useState(true)

  // Restore session from localStorage on mount
  useEffect(() => {
    const raw = localStorage.getItem(SESSION_KEY)
    if (raw) {
      try {
        const saved = JSON.parse(raw) as AppUser
        setUser(saved)
      } catch {
        localStorage.removeItem(SESSION_KEY)
      }
    }
    setLoading(false)
  }, [])

  /**
   * Login by access_code.
   * The code is compared server-side via Supabase RLS + a DB lookup.
   * The secret codes live only in the `users` table — never in frontend code.
   */
  const login = async (accessCode: string): Promise<{ error: string | null }> => {
    const code = accessCode.trim().toLowerCase()
    if (!code) return { error: 'Введите код доступа' }

    const { data, error } = await supabase
      .from('users')
      .select('id, name, role, penalty_days')
      .eq('access_code', code)
      .single()

    if (error || !data) {
      return { error: 'Неверный код. Попробуйте ещё раз.' }
    }

    const appUser: AppUser = {
      id: data.id,
      name: data.name,
      role: data.role,
      penalty_days: data.penalty_days,
    }

    localStorage.setItem(SESSION_KEY, JSON.stringify(appUser))
    setUser(appUser)
    return { error: null }
  }

  const logout = () => {
    localStorage.removeItem(SESSION_KEY)
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
