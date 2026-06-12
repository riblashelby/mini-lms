import { useEffect, useState } from 'react'
import { getAllStudents, updatePenaltyDays } from '../lib/users'
import { getAllLessonsForStudent, deleteLesson } from '../lib/lessons'
import { getSubmissionsForLesson } from '../lib/submissions'
import { AddLessonModal } from '../components/AddLessonModal'
import type { AppUser, Lesson, Submission } from '../types'

function formatDate(dateStr: string): string {
  const [year, month, day] = dateStr.split('-').map(Number)
  return new Date(year, month - 1, day).toLocaleDateString('ru-RU', {
    day: 'numeric', month: 'short', year: 'numeric',
  })
}

export function AdminDashboard() {
  const [students, setStudents] = useState<AppUser[]>([])
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null)
  const [lessons, setLessons] = useState<Lesson[]>([])
  const [submissions, setSubmissions] = useState<Record<string, Submission[]>>({})
  const [loading, setLoading] = useState(true)
  const [showAddModal, setShowAddModal] = useState(false)
  const [activeTab, setActiveTab] = useState<'lessons' | 'penalties'>('lessons')
  const [expandedSubmissions, setExpandedSubmissions] = useState<string | null>(null)
  const [penaltyEdit, setPenaltyEdit] = useState<Record<string, number>>({})
  const [savingPenalty, setSavingPenalty] = useState<string | null>(null)

  const loadStudents = async () => {
    try {
      const data = await getAllStudents()
      setStudents(data)
      if (data.length > 0 && !selectedStudentId) {
        setSelectedStudentId(data[0].id)
      }
      const penaltyMap: Record<string, number> = {}
      data.forEach((s) => { penaltyMap[s.id] = s.penalty_days })
      setPenaltyEdit(penaltyMap)
    } catch (e) {
      console.error(e)
    }
  }

  const loadLessons = async (studentId: string) => {
    setLoading(true)
    try {
      const data = await getAllLessonsForStudent(studentId)
      setLessons(data)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadStudents() }, [])

  useEffect(() => {
    if (selectedStudentId) loadLessons(selectedStudentId)
  }, [selectedStudentId])

  const handleDeleteLesson = async (lessonId: string) => {
    if (!confirm('Удалить этот урок?')) return
    await deleteLesson(lessonId)
    if (selectedStudentId) loadLessons(selectedStudentId)
  }

  const toggleSubmissions = async (lessonId: string) => {
    if (expandedSubmissions === lessonId) {
      setExpandedSubmissions(null)
      return
    }
    if (!submissions[lessonId]) {
      const subs = await getSubmissionsForLesson(lessonId)
      setSubmissions((prev) => ({ ...prev, [lessonId]: subs }))
    }
    setExpandedSubmissions(lessonId)
  }

  const handleSavePenalty = async (studentId: string) => {
    setSavingPenalty(studentId)
    try {
      await updatePenaltyDays(studentId, penaltyEdit[studentId] ?? 0)
      await loadStudents()
    } catch (e) {
      console.error(e)
    } finally {
      setSavingPenalty(null)
    }
  }

  const selectedStudent = students.find((s) => s.id === selectedStudentId)
  const today = new Date().toISOString().split('T')[0]

  return (
    <main className="page">
      <div className="container">
        <div className="page-header">
          <div className="page-title">
            <h1>Панель администратора</h1>
            <span className="page-subtitle">{students.length} учеников</span>
          </div>
          <button className="btn btn-primary" onClick={() => setShowAddModal(true)}>
            + Добавить урок
          </button>
        </div>

        {/* Student tabs */}
        {students.length > 0 && (
          <div className="tabs">
            {students.map((s) => (
              <button
                key={s.id}
                className={`tab ${selectedStudentId === s.id ? 'active' : ''}`}
                onClick={() => setSelectedStudentId(s.id)}
              >
                {s.name}
              </button>
            ))}
          </div>
        )}

        {/* Section tabs */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '20px' }}>
          <button
            className={`btn btn-sm ${activeTab === 'lessons' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setActiveTab('lessons')}
          >
            📚 Уроки
          </button>
          <button
            className={`btn btn-sm ${activeTab === 'penalties' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setActiveTab('penalties')}
          >
            ⚠️ Штрафные дни
          </button>
        </div>

        {activeTab === 'lessons' && (
          <>
            {loading ? (
              <div className="loading-center"><div className="spinner" /></div>
            ) : lessons.length === 0 ? (
              <div className="empty">
                <div className="empty-icon">📭</div>
                <div className="empty-title">Уроков пока нет</div>
                <p>Нажмите «Добавить урок», чтобы создать первый.</p>
              </div>
            ) : (
              <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Дата</th>
                      <th>Название</th>
                      <th>Статус</th>
                      <th>Задание</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {lessons.map((lesson) => {
                      const isPast = lesson.available_from <= today
                      const lessonSubs = submissions[lesson.id]
                      const hasSubmissions = lessonSubs && lessonSubs.length > 0

                      return (
                        <>
                          <tr key={lesson.id}>
                            <td style={{ whiteSpace: 'nowrap', color: 'var(--text-muted)', fontSize: '13px' }}>
                              {formatDate(lesson.available_from)}
                            </td>
                            <td>
                              <div style={{ fontWeight: 500 }}>{lesson.title}</div>
                              {lesson.video_url && (
                                <a
                                  href={lesson.video_url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  style={{ fontSize: '12px', color: 'var(--accent)' }}
                                >
                                  ▶ Видео
                                </a>
                              )}
                            </td>
                            <td>
                              {!isPast ? (
                                <span className="badge badge-orange">Запланирован</span>
                              ) : (
                                <span className="badge badge-green">Доступен</span>
                              )}
                            </td>
                            <td>
                              <button
                                className="btn btn-secondary btn-sm"
                                onClick={() => toggleSubmissions(lesson.id)}
                              >
                                {expandedSubmissions === lesson.id ? '▲' : '▼'}{' '}
                                {hasSubmissions ? `${lessonSubs.length} работ` : 'Работы'}
                              </button>
                            </td>
                            <td>
                              <button
                                className="btn btn-danger btn-sm"
                                onClick={() => handleDeleteLesson(lesson.id)}
                              >
                                Удалить
                              </button>
                            </td>
                          </tr>
                          {expandedSubmissions === lesson.id && (
                            <tr key={`${lesson.id}-subs`}>
                              <td colSpan={5} style={{ background: 'var(--bg)', padding: '16px' }}>
                                {!lessonSubs || lessonSubs.length === 0 ? (
                                  <span style={{ color: 'var(--text-muted)', fontSize: '14px' }}>
                                    Домашних работ ещё нет
                                  </span>
                                ) : (
                                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                    {lessonSubs.map((sub) => (
                                      <div key={sub.id} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                        <a href={sub.file_url} target="_blank" rel="noopener noreferrer">
                                          <img src={sub.file_url} alt="Работа" className="submission-thumb" />
                                        </a>
                                        <div>
                                          <div style={{ fontWeight: 500, fontSize: '14px' }}>{sub.student_name}</div>
                                          <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                                            {new Date(sub.uploaded_at).toLocaleString('ru-RU')}
                                          </div>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </td>
                            </tr>
                          )}
                        </>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}

        {activeTab === 'penalties' && (
          <div className="card">
            <h2 style={{ marginBottom: '20px' }}>Штрафные дни</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {students.map((student) => (
                <div key={student.id} style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
                  <div style={{ minWidth: '140px', fontWeight: 500 }}>{student.name}</div>
                  <div className="penalty-row">
                    <button
                      className="btn btn-secondary btn-sm"
                      onClick={() =>
                        setPenaltyEdit((prev) => ({
                          ...prev,
                          [student.id]: Math.max(0, (prev[student.id] ?? 0) - 1),
                        }))
                      }
                    >
                      −
                    </button>
                    <span className="penalty-value">{penaltyEdit[student.id] ?? 0}</span>
                    <button
                      className="btn btn-secondary btn-sm"
                      onClick={() =>
                        setPenaltyEdit((prev) => ({
                          ...prev,
                          [student.id]: (prev[student.id] ?? 0) + 1,
                        }))
                      }
                    >
                      +
                    </button>
                  </div>
                  <button
                    className="btn btn-primary btn-sm"
                    disabled={
                      savingPenalty === student.id ||
                      penaltyEdit[student.id] === student.penalty_days
                    }
                    onClick={() => handleSavePenalty(student.id)}
                  >
                    {savingPenalty === student.id ? 'Сохраняем...' : 'Сохранить'}
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {showAddModal && (
        <AddLessonModal
          students={students}
          preselectedStudentId={selectedStudentId ?? undefined}
          onClose={() => setShowAddModal(false)}
          onCreated={() => {
            setShowAddModal(false)
            if (selectedStudentId) loadLessons(selectedStudentId)
          }}
        />
      )}
    </main>
  )
}
