import { useEffect, useState } from 'react'
import { useAuth } from '../lib/auth'
import { getAvailableLessons } from '../lib/lessons'
import { getMySubmissions } from '../lib/submissions'
import { checkAndAddPenaltyDay } from '../lib/users'
import { UploadHomework } from '../components/UploadHomework'
import type { Lesson, Submission } from '../types'

function formatDate(dateStr: string): string {
  const [year, month, day] = dateStr.split('-').map(Number)
  return new Date(year, month - 1, day).toLocaleDateString('ru-RU', {
    day: 'numeric',
    month: 'long',
  })
}

export function StudentDashboard() {
  const { user } = useAuth()
  const [lessons, setLessons] = useState<Lesson[]>([])
  const [submissions, setSubmissions] = useState<Submission[]>([])
  const [loading, setLoading] = useState(true)
  const [expandedLesson, setExpandedLesson] = useState<string | null>(null)
  const [penaltyDays, setPenaltyDays] = useState(user?.penalty_days ?? 0)

  const loadData = async () => {
    if (!user) return
    try {
      const [lessonsData, subsData] = await Promise.all([
        getAvailableLessons(user.id),
        getMySubmissions(user.id),
      ])
      setLessons(lessonsData)
      setSubmissions(subsData)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (!user) return
    // Check and maybe add penalty for yesterday
    checkAndAddPenaltyDay(user.id).then(() => {
      // Reload penalty count from DB by checking local user
      setPenaltyDays(user.penalty_days)
    })
    loadData()
  }, [user?.id])

  const isSubmitted = (lessonId: string) =>
    submissions.some((s) => s.lesson_id === lessonId)

  const getSubmissionForLesson = (lessonId: string) =>
    submissions.filter((s) => s.lesson_id === lessonId)

  if (loading) {
    return (
      <div className="loading-center">
        <div className="spinner" />
      </div>
    )
  }

  return (
    <main className="page">
      <div className="container">
        <div className="page-header">
          <div className="page-title">
            <h1>Мои уроки</h1>
            <span className="page-subtitle">
              Доступно сегодня: {lessons.length} {lessons.length === 1 ? 'урок' : 'уроков'}
            </span>
          </div>
          {penaltyDays > 0 && (
            <div className="badge badge-red" style={{ fontSize: '14px', padding: '6px 12px' }}>
              ⚠️ Штрафных дней: {penaltyDays}
            </div>
          )}
        </div>

        {lessons.length === 0 ? (
          <div className="empty">
            <div className="empty-icon">🎯</div>
            <div className="empty-title">Пока нет доступных уроков</div>
            <p>Новые материалы появятся, когда их добавит преподаватель.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {lessons.map((lesson) => {
              const submitted = isSubmitted(lesson.id)
              const expanded = expandedLesson === lesson.id
              const lessonSubs = getSubmissionForLesson(lesson.id)

              return (
                <div key={lesson.id} className="lesson-card">
                  <div className="lesson-card-header">
                    <div>
                      <div className="lesson-date">{formatDate(lesson.available_from)}</div>
                      <div className="lesson-title">{lesson.title}</div>
                    </div>
                    {submitted ? (
                      <span className="badge badge-green">✓ Сдано</span>
                    ) : (
                      <span className="badge badge-orange">Ждёт сдачи</span>
                    )}
                  </div>

                  {lesson.description && (
                    <p className="lesson-desc">{lesson.description}</p>
                  )}

                  <div className="lesson-actions">
                    {lesson.video_url && (
                      <a
                        href={lesson.video_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn btn-primary btn-sm"
                      >
                        ▶ Смотреть урок
                      </a>
                    )}
                    <button
                      className="btn btn-secondary btn-sm"
                      onClick={() => setExpandedLesson(expanded ? null : lesson.id)}
                    >
                      {expanded ? '▲ Свернуть' : '📎 Загрузить домашнее задание'}
                    </button>
                  </div>

                  {expanded && (
                    <div style={{ borderTop: '1px solid var(--border)', paddingTop: '16px' }}>
                      <UploadHomework
                        lessonId={lesson.id}
                        studentId={user!.id}
                        studentName={user!.name}
                        onUploaded={() => {
                          loadData()
                          setExpandedLesson(null)
                        }}
                      />

                      {lessonSubs.length > 0 && (
                        <div style={{ marginTop: '16px' }}>
                          <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '8px', fontWeight: 500 }}>
                            Загруженные работы:
                          </div>
                          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                            {lessonSubs.map((sub) => (
                              <a key={sub.id} href={sub.file_url} target="_blank" rel="noopener noreferrer">
                                <img
                                  src={sub.file_url}
                                  alt="Домашнее задание"
                                  className="submission-thumb"
                                />
                              </a>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </main>
  )
}
