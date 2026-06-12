import { supabase } from './supabase'
import type { Lesson } from '../types'

/** Returns lessons for a student that are available today or earlier */
export async function getAvailableLessons(studentId: string): Promise<Lesson[]> {
  const today = new Date().toISOString().split('T')[0] // YYYY-MM-DD

  const { data, error } = await supabase
    .from('lessons')
    .select('*')
    .eq('student_id', studentId)
    .lte('available_from', today)
    .order('available_from', { ascending: true })

  if (error) throw new Error(error.message)
  return data ?? []
}

/** Returns ALL lessons for a student (for admin view) */
export async function getAllLessonsForStudent(studentId: string): Promise<Lesson[]> {
  const { data, error } = await supabase
    .from('lessons')
    .select('*')
    .eq('student_id', studentId)
    .order('available_from', { ascending: true })

  if (error) throw new Error(error.message)
  return data ?? []
}

/** Admin: create a new lesson */
export async function createLesson(lesson: {
  student_id: string
  title: string
  video_url: string
  description?: string
  available_from: string
}): Promise<Lesson> {
  const { data, error } = await supabase
    .from('lessons')
    .insert(lesson)
    .select()
    .single()

  if (error) throw new Error(error.message)
  return data
}

/** Admin: delete a lesson */
export async function deleteLesson(lessonId: string): Promise<void> {
  const { error } = await supabase.from('lessons').delete().eq('id', lessonId)
  if (error) throw new Error(error.message)
}
