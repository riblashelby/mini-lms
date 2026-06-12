export type Role = 'admin' | 'student'

export interface AppUser {
  id: string
  name: string
  role: Role
  penalty_days: number
}

export interface Lesson {
  id: string
  student_id: string
  title: string
  video_url: string
  description: string | null
  available_from: string // ISO date string YYYY-MM-DD
  created_at: string
}

export interface Submission {
  id: string
  lesson_id: string
  student_id: string
  student_name: string
  file_url: string
  uploaded_at: string
}

export interface AuthSession {
  user: AppUser
  token: string // stored in localStorage
}
