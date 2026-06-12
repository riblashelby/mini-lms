import { supabase } from './supabase'
import type { AppUser } from '../types'

export async function getAllStudents(): Promise<AppUser[]> {
  const { data, error } = await supabase
    .from('users')
    .select('id, name, role, penalty_days')
    .eq('role', 'student')
    .order('name')

  if (error) throw new Error(error.message)
  return data ?? []
}

export async function updatePenaltyDays(
  studentId: string,
  newValue: number
): Promise<void> {
  if (newValue < 0) newValue = 0
  const { error } = await supabase
    .from('users')
    .update({ penalty_days: newValue })
    .eq('id', studentId)

  if (error) throw new Error(error.message)
}

/**
 * Penalty day logic:
 * A "penalty day" is added when a student had lessons available on a given date
 * but submitted no homework that day.
 *
 * This function checks yesterday and adds a penalty if needed.
 * Call it once per day (e.g. on student login).
 */
export async function checkAndAddPenaltyDay(studentId: string): Promise<void> {
  const yesterday = new Date()
  yesterday.setDate(yesterday.getDate() - 1)
  const yDate = yesterday.toISOString().split('T')[0]

  // Were there any lessons available yesterday for this student?
  const { data: lessons } = await supabase
    .from('lessons')
    .select('id')
    .eq('student_id', studentId)
    .eq('available_from', yDate)

  if (!lessons || lessons.length === 0) return // No lessons → no penalty

  // Did student submit anything yesterday?
  const lessonIds = lessons.map((l) => l.id)

  const { data: subs } = await supabase
    .from('submissions')
    .select('id')
    .in('lesson_id', lessonIds)
    .eq('student_id', studentId)

  if (subs && subs.length > 0) return // Submitted → no penalty

  // No submission → add 1 penalty day
  // First get current value
  const { data: user } = await supabase
    .from('users')
    .select('penalty_days')
    .eq('id', studentId)
    .single()

  if (!user) return

  await supabase
    .from('users')
    .update({ penalty_days: (user.penalty_days ?? 0) + 1 })
    .eq('id', studentId)
}
