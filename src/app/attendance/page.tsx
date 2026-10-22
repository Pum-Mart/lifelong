'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { CalendarCheck, CheckCircle2, ClipboardCheck, GraduationCap, Plus, Save, Trash2, UserX, Plane } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import LoginRequired from '@/components/LoginRequired';
import CompletionPanel from '@/components/CompletionPanel';
import { ClassSession, ExamScore, GradeBreakdown, StudentDayRecord, TeacherStatus } from '@/types';
import { GRADE_WEIGHTS, gradeLabel } from '@/lib/grades';
import AssessmentEditor from '@/components/AssessmentEditor';

interface ClassCourse {
  id: string;
  title: string;
  instructorName?: string;
  startDate?: string;
  endDate?: string;
  scheme?: 'free' | 'paid';
  weights?: { test: number; exercise: number; attendance: number; exam: number };
}

interface ClassBook {
  course: ClassCourse;
  students: { id: string; name: string; email: string }[];
  sessions: ClassSession[];
  exams: ExamScore[];
  grades: GradeBreakdown[];
}

type Draft = Omit<ClassSession, 'id' | 'courseId' | 'updatedAt' | 'updatedBy'>;

const todayLocal = () => new Date().toLocaleDateString('en-CA');

const emptyRecord = (): StudentDayRecord => ({ present: true, testDone: false, exerciseDone: false });

function newDraft(date: string, students: ClassBook['students']): Draft {
  return {
    date,
    lessonTitle: '',
    teacherStatus: 'present',
    teacherNote: '',
    lessonCompleted: false,
    hasTest: false,
    hasExercise: false,
    records: Object.fromEntries(students.map(s => [s.id, emptyRecord()]))
  };
}

function draftFrom(session: ClassSession, students: ClassBook['students']): Draft {
  return {
    date: session.date,
    lessonTitle: session.lessonTitle,
    teacherStatus: session.teacherStatus,
    teacherNote: session.teacherNote || '',
    lessonCompleted: session.lessonCompleted,
    hasTest: session.hasTest,
    hasExercise: session.hasExercise,
    // Students who enrolled after this day get a default row
    records: Object.fromEntries(students.map(s => [s.id, session.records[s.id] || emptyRecord()]))
  };
}

const STATUS_LABEL: Record<TeacherStatus, string> = {
  present: 'គ្រូមានវត្តមាន',
  absent: 'គ្រូអវត្តមាន',
  mission: 'គ្រូមានបេសកកម្ម'
};

export default function AttendancePage() {
  const { currentUser, authReady } = useApp();
  if (!authReady) return <div className="py-24 text-center text-sm text-slate-400">កំពុងផ្ទុក...</div>;
  if (!currentUser) return <LoginRequired message="សូមចូលគណនីគ្រូ ឬ Admin" />;
  if (currentUser.role !== 'admin' && currentUser.role !== 'teacher') {
    return <div className="max-w-md mx-auto py-24 px-4 text-center text-sm text-slate-500 font-siemreap">ទំព័រនេះសម្រាប់គ្រូ និងអ្នកគ្រប់គ្រងតែប៉ុណ្ណោះ។</div>;
  }
  return <AttendanceBook />;
}

function AttendanceBook() {
  const { showNotification } = useApp();
  const [courses, setCourses] = useState<ClassCourse[]>([]);
  const [courseId, setCourseId] = useState('');
  const [book, setBook] = useState<ClassBook | null>(null);
  const [tab, setTab] = useState<'daily' | 'grades' | 'tests' | 'complete'>('daily');
  const [draft, setDraft] = useState<Draft | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch('/api/classes')
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setCourses(data.courses);
          if (data.courses[0]) setCourseId(data.courses[0].id);
        }
      })
      .catch(err => console.error(err));
  }, []);

  const loadBook = useCallback(async (id: string, openDate?: string) => {
    const res = await fetch(`/api/classes/${id}`);
    const data = await res.json();
    if (!data.success) return;
    setBook(data);
    const date = openDate || todayLocal();
    const existing = data.sessions.find((s: ClassSession) => s.date === date);
    setDraft(existing ? draftFrom(existing, data.students) : newDraft(date, data.students));
  }, []);

  useEffect(() => {
    if (courseId) loadBook(courseId).catch(err => console.error(err));
  }, [courseId, loadBook]);

  const openDate = (date: string) => {
    if (!book) return;
    const existing = book.sessions.find(s => s.date === date);
    setDraft(existing ? draftFrom(existing, book.students) : newDraft(date, book.students));
  };

  const setRecord = (userId: string, changes: Partial<StudentDayRecord>) => {
    setDraft(d => (d ? { ...d, records: { ...d.records, [userId]: { ...d.records[userId], ...changes } } } : d));
  };

  const setAll = (changes: Partial<StudentDayRecord>) => {
    setDraft(d => (d ? { ...d, records: Object.fromEntries(Object.entries(d.records).map(([id, r]) => [id, { ...r, ...changes }])) } : d));
  };

  const save = async () => {
    if (!draft || !book) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/classes/${book.course.id}/sessions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(draft)
      });
      const data = await res.json();
      if (data.success) {
        showNotification(`បានរក្សាទុកវត្តមានថ្ងៃ ${draft.date}`);
        await loadBook(book.course.id, draft.date);
      } else {
        showNotification(data.error || 'រក្សាទុកមិនបានទេ', 'warning');
      }
    } finally {
      setSaving(false);
    }
  };

  const remove = async (session: ClassSession) => {
    if (!book || !confirm(`លុបកំណត់ត្រាថ្ងៃ ${session.date}?`)) return;
    await fetch(`/api/classes/${book.course.id}/sessions?id=${session.id}`, { method: 'DELETE' });
    showNotification(`បានលុបថ្ងៃ ${session.date}`, 'info');
    await loadBook(book.course.id);
  };

  const saveExam = async (userId: string, value: string) => {
    if (!book) return;
    const res = await fetch(`/api/classes/${book.course.id}/exams`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, score: value === '' ? null : Number(value) })
    });
    const data = await res.json();
    if (data.success) {
      showNotification('បានរក្សាទុកពិន្ទុប្រឡង');
      await loadBook(book.course.id, draft?.date);
    } else {
      showNotification(data.error || 'រក្សាទុកមិនបានទេ', 'warning');
    }
  };

  const savedForDraft = book && draft ? book.sessions.find(s => s.date === draft.date) : undefined;
  const w = book?.course.weights || GRADE_WEIGHTS;
  const notCounted = draft ? draft.teacherStatus !== 'present' : false;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10 space-y-6 font-siemreap">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-md">
            <CalendarCheck className="w-3.5 h-3.5" />
            <span>បញ្ជីវត្តមាន និងពិន្ទុ</span>
          </div>
          <h1 className="font-moul text-xl sm:text-2xl text-slate-900 leading-relaxed">វត្តមានគ្រូ និងសិស្សប្រចាំថ្ងៃ</h1>
        </div>
        <select
          value={courseId}
          onChange={e => setCourseId(e.target.value)}
          className="w-full sm:w-96 p-2.5 rounded-xl border border-slate-300 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
        >
          {courses.length === 0 && <option value="">មិនមានវគ្គដែលអ្នកបង្រៀនទេ</option>}
          {courses.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
        </select>
      </div>

      {book && (
        <>
          <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
            <span>គ្រូ៖ <strong className="text-slate-700">{book.course.instructorName || '—'}</strong></span>
            <span>• សិស្ស {book.students.length} នាក់</span>
            {book.course.startDate && <span>• ចាប់ផ្តើម {book.course.startDate}</span>}
            {book.course.endDate && <span>• បញ្ចប់ {book.course.endDate}</span>}
            <span className="ml-auto">
              {book.course.scheme === 'paid' ? 'បង់ថ្លៃ' : 'ឥតគិតថ្លៃ'} • ប្រឡង {w.exam}% • តេស្ត {w.test}% • លំហាត់/កិច្ចការផ្ទះ {w.exercise}%{w.attendance > 0 && ` • វត្តមាន ${w.attendance}%`}
            </span>
          </div>

          <div className="flex gap-6 border-b border-slate-200 text-sm">
            {(['daily', 'grades', 'tests', 'complete'] as const).map(t => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`pb-3 font-bold border-b-2 transition ${tab === t ? 'border-emerald-600 text-emerald-800' : 'border-transparent text-slate-500 hover:text-slate-800'}`}
              >
                {t === 'daily' ? 'វត្តមាន & មេរៀនប្រចាំថ្ងៃ' : t === 'grades' ? 'ពិន្ទុសរុប' : t === 'tests' ? 'តេស្ត & ប្រឡង' : 'បញ្ចប់វគ្គ & វិញ្ញាបនបត្រ'}
              </button>
            ))}
          </div>

          {tab === 'daily' && draft && (
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
              {/* Days list */}
              <aside className="space-y-2">
                <div className="flex gap-2">
                  <input
                    type="date"
                    value={draft.date}
                    onChange={e => e.target.value && openDate(e.target.value)}
                    className="flex-1 p-2 rounded-xl border border-slate-300 text-sm"
                    aria-label="ជ្រើសរើសថ្ងៃ"
                  />
                  <button onClick={() => openDate(todayLocal())} className="px-3 rounded-xl bg-emerald-600 text-white text-xs font-bold flex items-center gap-1" title="ថ្ងៃនេះ">
                    <Plus className="w-4 h-4" /> ថ្ងៃនេះ
                  </button>
                </div>
                <div className="max-h-[32rem] overflow-y-auto space-y-1.5 pr-1">
                  {[...book.sessions].reverse().map(s => (
                    <button
                      key={s.id}
                      onClick={() => openDate(s.date)}
                      className={`w-full text-left p-3 rounded-xl border text-xs transition ${s.date === draft.date ? 'border-emerald-500 bg-emerald-50' : 'border-slate-200 bg-white hover:border-slate-300'}`}
                    >
                      <div className="flex justify-between font-bold text-slate-900">
                        <span>{s.date}</span>
                        {s.lessonCompleted && <CheckCircle2 className="w-4 h-4 text-emerald-600" />}
                      </div>
                      <div className="text-slate-500 truncate">{s.lessonTitle || 'មិនមានចំណងជើង'}</div>
                      {s.teacherStatus !== 'present' && (
                        <div className="mt-1 inline-block px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 font-bold">{STATUS_LABEL[s.teacherStatus]} • មិនរាប់</div>
                      )}
                    </button>
                  ))}
                  {book.sessions.length === 0 && <p className="text-xs text-slate-400 p-3">មិនទាន់មានកំណត់ត្រា</p>}
                </div>
              </aside>

              {/* Day editor */}
              <section className="lg:col-span-3 bg-white rounded-3xl border border-slate-200 shadow-sm p-5 sm:p-6 space-y-5">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <h2 className="font-bold text-slate-900">ថ្ងៃ {draft.date} {savedForDraft ? '' : <span className="text-xs font-normal text-amber-700">(ថ្មី មិនទាន់រក្សាទុក)</span>}</h2>
                  {savedForDraft && (
                    <button onClick={() => remove(savedForDraft)} className="text-xs text-red-600 hover:underline flex items-center gap-1">
                      <Trash2 className="w-3.5 h-3.5" /> លុបថ្ងៃនេះ
                    </button>
                  )}
                </div>

                <label className="block text-xs font-semibold text-slate-600">
                  មេរៀនប្រចាំថ្ងៃ
                  <input
                    value={draft.lessonTitle}
                    onChange={e => setDraft({ ...draft, lessonTitle: e.target.value })}
                    placeholder="ឧ. មេរៀនទី ៣៖ ចង្វាក់ស្គរឆៃយ៉ាំ"
                    className="mt-1 w-full p-2.5 rounded-xl border border-slate-300 text-sm font-normal focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </label>

                {/* Teacher attendance */}
                <fieldset className="space-y-2">
                  <legend className="text-xs font-semibold text-slate-600">វត្តមានគ្រូ</legend>
                  <div className="flex flex-wrap gap-2">
                    {(['present', 'absent', 'mission'] as TeacherStatus[]).map(status => (
                      <label
                        key={status}
                        className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-sm cursor-pointer ${draft.teacherStatus === status ? (status === 'present' ? 'border-emerald-500 bg-emerald-50 text-emerald-800 font-bold' : 'border-amber-500 bg-amber-50 text-amber-800 font-bold') : 'border-slate-300'}`}
                      >
                        <input type="radio" name="teacherStatus" checked={draft.teacherStatus === status} onChange={() => setDraft({ ...draft, teacherStatus: status })} className="sr-only" />
                        {status === 'present' ? <CheckCircle2 className="w-4 h-4" /> : status === 'absent' ? <UserX className="w-4 h-4" /> : <Plane className="w-4 h-4" />}
                        {STATUS_LABEL[status]}
                      </label>
                    ))}
                  </div>
                  {notCounted && (
                    <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900 space-y-2">
                      <p>ថ្ងៃនេះ <strong>មិនរាប់បញ្ចូល</strong> វត្តមាន តេស្ត និងលំហាត់របស់សិស្សទេ។</p>
                      <input
                        value={draft.teacherNote || ''}
                        onChange={e => setDraft({ ...draft, teacherNote: e.target.value })}
                        placeholder="មូលហេតុ (ឧ. បេសកកម្មនៅខេត្ត...)"
                        className="w-full p-2 rounded-lg border border-amber-300 bg-white text-sm"
                      />
                    </div>
                  )}
                </fieldset>

                {/* Lesson checklist */}
                <div className="flex flex-wrap gap-4 text-sm">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={draft.lessonCompleted} onChange={e => setDraft({ ...draft, lessonCompleted: e.target.checked })} className="w-4 h-4 accent-emerald-600" />
                    <span className="font-semibold text-slate-800">បានបញ្ចប់មេរៀន</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={draft.hasTest} onChange={e => setDraft({ ...draft, hasTest: e.target.checked })} className="w-4 h-4 accent-emerald-600" />
                    <span>មានតេស្តថ្ងៃនេះ</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={draft.hasExercise} onChange={e => setDraft({ ...draft, hasExercise: e.target.checked })} className="w-4 h-4 accent-emerald-600" />
                    <span>មានលំហាត់ថ្ងៃនេះ</span>
                  </label>
                </div>

                {/* Students */}
                {book.students.length === 0 ? (
                  <p className="text-sm text-slate-400 py-6 text-center">មិនទាន់មានសិស្សចុះឈ្មោះក្នុងវគ្គនេះទេ</p>
                ) : (
                  <div className={`overflow-x-auto ${notCounted ? 'opacity-50' : ''}`}>
                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr className="border-b border-slate-200 text-slate-400">
                          <th className="pb-2 font-semibold">សិស្ស</th>
                          <th className="pb-2 font-semibold text-center">
                            វត្តមាន
                            <button onClick={() => setAll({ present: true })} className="block mx-auto text-[10px] text-emerald-700 underline">ទាំងអស់</button>
                          </th>
                          {draft.hasTest && (
                            <th className="pb-2 font-semibold text-center">
                              តេស្ត (ពិន្ទុ /100)
                              <button onClick={() => setAll({ testDone: true })} className="block mx-auto text-[10px] text-emerald-700 underline">ធីកទាំងអស់</button>
                            </th>
                          )}
                          {draft.hasExercise && (
                            <th className="pb-2 font-semibold text-center">
                              លំហាត់ (ពិន្ទុ /100)
                              <button onClick={() => setAll({ exerciseDone: true })} className="block mx-auto text-[10px] text-emerald-700 underline">ធីកទាំងអស់</button>
                            </th>
                          )}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {book.students.map(s => {
                          const r = draft.records[s.id] || emptyRecord();
                          return (
                            <tr key={s.id}>
                              <td className="py-2.5 pr-3">
                                <div className="font-semibold text-slate-900">{s.name}</div>
                                <div className="text-[11px] text-slate-400">{s.email}</div>
                              </td>
                              <td className="py-2.5 text-center">
                                <input type="checkbox" checked={r.present} onChange={e => setRecord(s.id, { present: e.target.checked })} className="w-5 h-5 accent-emerald-600" aria-label={`វត្តមាន ${s.name}`} />
                              </td>
                              {draft.hasTest && (
                                <td className="py-2.5 text-center whitespace-nowrap">
                                  <input type="checkbox" checked={r.testDone} onChange={e => setRecord(s.id, { testDone: e.target.checked })} className="w-5 h-5 accent-emerald-600 align-middle" aria-label={`តេស្ត ${s.name}`} />
                                  <input
                                    type="number" min={0} max={100}
                                    value={r.testScore ?? ''}
                                    onChange={e => setRecord(s.id, { testScore: e.target.value === '' ? undefined : Number(e.target.value), testDone: e.target.value !== '' || r.testDone })}
                                    className="ml-2 w-16 p-1 rounded-lg border border-slate-300 text-center"
                                    aria-label={`ពិន្ទុតេស្ត ${s.name}`}
                                  />
                                </td>
                              )}
                              {draft.hasExercise && (
                                <td className="py-2.5 text-center whitespace-nowrap">
                                  <input type="checkbox" checked={r.exerciseDone} onChange={e => setRecord(s.id, { exerciseDone: e.target.checked })} className="w-5 h-5 accent-emerald-600 align-middle" aria-label={`លំហាត់ ${s.name}`} />
                                  <input
                                    type="number" min={0} max={100}
                                    value={r.exerciseScore ?? ''}
                                    onChange={e => setRecord(s.id, { exerciseScore: e.target.value === '' ? undefined : Number(e.target.value), exerciseDone: e.target.value !== '' || r.exerciseDone })}
                                    className="ml-2 w-16 p-1 rounded-lg border border-slate-300 text-center"
                                    aria-label={`ពិន្ទុលំហាត់ ${s.name}`}
                                  />
                                </td>
                              )}
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                    <p className="text-[11px] text-slate-400 pt-2">ធីកដោយគ្មានពិន្ទុ = ពិន្ទុពេញ 100។ មិនធីក = 0។</p>
                  </div>
                )}

                <button
                  onClick={save}
                  disabled={saving}
                  className="w-full sm:w-auto px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm flex items-center justify-center gap-2 shadow disabled:opacity-50"
                >
                  <Save className="w-4 h-4" /> {saving ? 'កំពុងរក្សាទុក...' : 'រក្សាទុកថ្ងៃនេះ'}
                </button>
              </section>
            </div>
          )}

          {tab === 'complete' && <CompletionPanel key={book.course.id} courseId={book.course.id} />}
          {tab === 'tests' && <AssessmentEditor key={book.course.id} courseId={book.course.id} />}

          {tab === 'grades' && (
            <section className="bg-white rounded-3xl border border-slate-200 shadow-sm p-5 sm:p-6 overflow-x-auto">
              {book.grades.length === 0 ? (
                <p className="text-sm text-slate-400 py-6 text-center">មិនទាន់មានសិស្ស</p>
              ) : (
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-200 text-slate-400">
                      <th className="pb-2 font-semibold">សិស្ស</th>
                      <th className="pb-2 font-semibold">វត្តមាន {w.attendance > 0 ? `(${w.attendance}%)` : '(មិនរាប់)'}</th>
                      <th className="pb-2 font-semibold">តេស្ត ({w.test}%)</th>
                      <th className="pb-2 font-semibold">លំហាត់ ({w.exercise}%)</th>
                      <th className="pb-2 font-semibold">ប្រឡង ({w.exam}%)</th>
                      <th className="pb-2 font-semibold text-right">សរុប /100</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {book.grades.map(g => (
                      <tr key={g.userId}>
                        <td className="py-3 pr-3 font-semibold text-slate-900">{g.name}</td>
                        <td className="py-3 pr-3">{g.presentDays}/{g.countedDays} ថ្ងៃ {g.attendancePct !== null && <span className="text-slate-400">({g.attendancePct}%)</span>}</td>
                        <td className="py-3 pr-3">{g.testPct ?? '—'}{g.testPct !== null && '%'}</td>
                        <td className="py-3 pr-3">{g.exercisePct ?? '—'}{g.exercisePct !== null && '%'}</td>
                        <td className="py-3 pr-3">
                          <input
                            type="number" min={0} max={100}
                            defaultValue={g.examPct ?? ''}
                            key={`${g.userId}-${g.examPct}`}
                            onBlur={e => {
                              if (e.target.value !== String(g.examPct ?? '')) saveExam(g.userId, e.target.value);
                            }}
                            placeholder="—"
                            className="w-20 p-1.5 rounded-lg border border-slate-300 text-center"
                            aria-label={`ពិន្ទុប្រឡង ${g.name}`}
                          />
                        </td>
                        <td className="py-3 text-right">
                          <div className="text-base font-black text-slate-900">{g.total}</div>
                          <div className="text-[10px] text-slate-500">{gradeLabel(g.total)}</div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
              <p className="text-[11px] text-slate-400 pt-3 flex items-center gap-1">
                <GraduationCap className="w-3.5 h-3.5" /> ថ្ងៃដែលគ្រូអវត្តមាន ឬមានបេសកកម្ម មិនរាប់បញ្ចូលទេ។ ផ្នែកដែលមិនទាន់មានទិន្នន័យ គិតជា 0 ក្នុងពិន្ទុសរុប។
              </p>
            </section>
          )}
        </>
      )}

      {!book && courses.length > 0 && <p className="text-sm text-slate-400 flex items-center gap-2"><ClipboardCheck className="w-4 h-4" /> កំពុងផ្ទុក...</p>}
    </div>
  );
}
