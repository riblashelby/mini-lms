import { useState, useRef, DragEvent, ChangeEvent } from 'react'
import { uploadSubmission, validateFile } from '../lib/submissions'
import { ALLOWED_FILE_TYPES, MAX_FILE_SIZE_MB } from '../lib/supabase'

interface UploadHomeworkProps {
  lessonId: string
  studentId: string
  studentName: string
  onUploaded: () => void
}

export function UploadHomework({ lessonId, studentId, studentName, onUploaded }: UploadHomeworkProps) {
  const [dragOver, setDragOver] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const handleFile = async (file: File) => {
    setError(null)
    setSuccess(false)
    const validationError = validateFile(file)
    if (validationError) {
      setError(validationError)
      return
    }

    setUploading(true)
    try {
      await uploadSubmission({ file, lessonId, studentId, studentName })
      setSuccess(true)
      onUploaded()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Ошибка загрузки')
    } finally {
      setUploading(false)
    }
  }

  const onInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) handleFile(file)
  }

  const onDrop = (e: DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    const file = e.dataTransfer.files?.[0]
    if (file) handleFile(file)
  }

  if (success) {
    return (
      <div className="alert alert-success" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        ✅ Домашнее задание загружено!{' '}
        <button
          className="btn btn-sm btn-secondary"
          onClick={() => setSuccess(false)}
          style={{ marginLeft: 'auto' }}
        >
          Загрузить ещё
        </button>
      </div>
    )
  }

  return (
    <div>
      <div
        className={`upload-area ${dragOver ? 'drag-over' : ''}`}
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
        onDragLeave={() => setDragOver(false)}
        onDrop={onDrop}
      >
        <input
          ref={inputRef}
          type="file"
          accept={ALLOWED_FILE_TYPES.join(',')}
          onChange={onInputChange}
          disabled={uploading}
        />
        {uploading ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'center' }}>
            <div className="spinner" />
            <span>Загружаем...</span>
          </div>
        ) : (
          <>
            <div style={{ fontSize: '1.8rem', marginBottom: '6px' }}>📎</div>
            <div style={{ fontWeight: 500, fontSize: '14px' }}>
              Нажмите или перетащите фото
            </div>
            <div className="upload-hint">
              JPG, PNG, WebP — до {MAX_FILE_SIZE_MB} МБ
            </div>
          </>
        )}
      </div>
      {error && <div className="alert alert-error" style={{ marginTop: '8px' }}>{error}</div>}
    </div>
  )
}
