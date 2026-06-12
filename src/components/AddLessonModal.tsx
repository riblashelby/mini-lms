import { useState, FormEvent } from 'react'
import { createLesson } from '../lib/lessons'
import type { AppUser } from '../types'

interface AddLessonModalProps {
  students: AppUser[]
  onClose: () => void
  onCreated: () => void
  preselectedStudentId?: string
}

export function AddLessonModal({ students, onClose, onCreated, preselectedStudentId }: AddLessonModalProps) {
  const today = new Date().toISOString().split('T')[0]
  const [studentId, setStudentId] = useState(preselectedStudentId ?? students[0]?.id ?? '')
  const [title, setTitle] = useState('')
  const [videoUrl, setVideoUrl] = useState('')
  const [description, setDescription] = useState('')
  const [availableFrom, setAvailableFrom] = useState(today)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)
    if (!studentId || !title.trim() || !availableFrom) {
      setError('Заполните все обязательные поля')
      return
    }

    setLoading(true)
    try {
      await createLesson({
        student_id: studentId,
        title: title.trim(),
        video_url: videoUrl.trim(),
        description: description.trim() || undefined,
        available_from: availableFrom,
      })
      onCreated()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Ошибка создания урока')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-header">
          <span className="modal-title">Добавить урок</span>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>

        <form className="modal-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Ученик *</label>
            <select value={studentId} onChange={(e) => setStudentId(e.target.value)} required>
              {students.map((s) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>Название урока *</label>
            <input
              type="text"
              placeholder="Например: Урок 3 — Акварельные переходы"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label>Ссылка на видео</label>
            <input
              type="url"
              placeholder="https://youtube.com/..."
              value={videoUrl}
              onChange={(e) => setVideoUrl(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label>Описание / задание</label>
            <textarea
              placeholder="Что нужно сделать, какие материалы подготовить..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label>Доступен с *</label>
            <input
              type="date"
              value={availableFrom}
              onChange={(e) => setAvailableFrom(e.target.value)}
              required
            />
          </div>

          {error && <div className="alert alert-error">{error}</div>}

          <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Отмена
            </button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Сохраняем...' : 'Добавить урок'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
