import { supabase, STORAGE_BUCKET, MAX_FILE_SIZE_BYTES, ALLOWED_FILE_TYPES } from './supabase'
import type { Submission } from '../types'

export function validateFile(file: File): string | null {
  if (!ALLOWED_FILE_TYPES.includes(file.type)) {
    return 'Только JPG, PNG или WebP файлы'
  }
  if (file.size > MAX_FILE_SIZE_BYTES) {
    return `Файл слишком большой. Максимум 10 МБ`
  }
  return null
}

export async function uploadSubmission(params: {
  file: File
  lessonId: string
  studentId: string
  studentName: string
}): Promise<Submission> {
  const { file, lessonId, studentId, studentName } = params

  const validationError = validateFile(file)
  if (validationError) throw new Error(validationError)

  // Build a unique storage path: homework/student_id/lesson_id/timestamp.ext
  const ext = file.name.split('.').pop() ?? 'jpg'
  const filePath = `${studentId}/${lessonId}/${Date.now()}.${ext}`

  const { error: uploadError } = await supabase.storage
    .from(STORAGE_BUCKET)
    .upload(filePath, file, { upsert: false })

  if (uploadError) throw new Error(uploadError.message)

  // Get public URL
  const { data: urlData } = supabase.storage.from(STORAGE_BUCKET).getPublicUrl(filePath)
  const fileUrl = urlData.publicUrl

  // Save record to DB
  const { data, error: dbError } = await supabase
    .from('submissions')
    .insert({
      lesson_id: lessonId,
      student_id: studentId,
      student_name: studentName,
      file_url: fileUrl,
    })
    .select()
    .single()

  if (dbError) throw new Error(dbError.message)
  return data
}

export async function getSubmissionsForLesson(lessonId: string): Promise<Submission[]> {
  const { data, error } = await supabase
    .from('submissions')
    .select('*')
    .eq('lesson_id', lessonId)
    .order('uploaded_at', { ascending: false })

  if (error) throw new Error(error.message)
  return data ?? []
}

export async function getMySubmissions(studentId: string): Promise<Submission[]> {
  const { data, error } = await supabase
    .from('submissions')
    .select('*')
    .eq('student_id', studentId)
    .order('uploaded_at', { ascending: false })

  if (error) throw new Error(error.message)
  return data ?? []
}
