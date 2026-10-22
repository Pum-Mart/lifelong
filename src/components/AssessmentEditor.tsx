'use client';

import React, { useEffect, useState } from 'react';
import { Plus, Save, Trash2 } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { QuizQuestion } from '@/types';

const blank = (prefix: string): QuizQuestion => ({ id: `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`, question: '', options: ['', '', '', ''], correctAnswer: 0, explanation: '' });

// Teacher/admin editor for a course's pre-test and exam (homework = each lesson's quiz)
export default function AssessmentEditor({ courseId }: { courseId: string }) {
  const { showNotification } = useApp();
  const [preTest, setPreTest] = useState<QuizQuestion[] | null>(null);
  const [exam, setExam] = useState<QuizQuestion[]>([]);
  const [homeworkLessons, setHomeworkLessons] = useState(0);
  const [tab, setTab] = useState<'pre' | 'exam'>('pre');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch(`/api/classes/${courseId}/assessments`)
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setPreTest(data.preTest);
          setExam(data.exam);
          setHomeworkLessons(data.homeworkLessons);
        }
      })
      .catch(err => console.error(err));
  }, [courseId]);

  if (!preTest) return <p className="text-sm text-slate-400">កំពុងផ្ទុក...</p>;

  const list = tab === 'pre' ? preTest : exam;
  const setList = tab === 'pre' ? setPreTest : setExam;
  const update = (i: number, changes: Partial<QuizQuestion>) => setList(list.map((q, idx) => (idx === i ? { ...q, ...changes } : q)));

  const save = async () => {
    setSaving(true);
    try {
      const res = await fetch(`/api/classes/${courseId}/assessments`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ preTest, exam })
      });
      const data = await res.json();
      if (data.success) {
        setPreTest(data.preTest);
        setExam(data.exam);
        showNotification('បានរក្សាទុកសំណួរ');
      } else {
        showNotification(data.error || 'រក្សាទុកមិនបានទេ', 'warning');
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="bg-white rounded-3xl border border-slate-200 shadow-sm p-5 sm:p-6 space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex gap-2">
          {(['pre', 'exam'] as const).map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-4 py-2 rounded-xl text-sm font-bold ${tab === t ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
            >
              {t === 'pre' ? `តេស្តមុនចូលរៀន (${preTest.length})` : `ប្រឡង (${exam.length})`}
            </button>
          ))}
        </div>
        <span className="text-xs text-slate-500">កិច្ចការផ្ទះ៖ ប្រើសំណួរក្នុងមេរៀននីមួយៗ ({homeworkLessons} មេរៀន)</span>
      </div>

      <div className="space-y-4">
        {list.map((q, i) => (
          <div key={q.id} className="p-4 rounded-2xl border border-slate-200 space-y-3">
            <div className="flex items-start gap-2">
              <span className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-700 text-xs font-bold flex items-center justify-center shrink-0 mt-2">{i + 1}</span>
              <textarea
                value={q.question}
                onChange={e => update(i, { question: e.target.value })}
                rows={2}
                placeholder="សំណួរ"
                className="flex-1 p-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
              <button onClick={() => setList(list.filter((_, idx) => idx !== i))} className="p-2 text-slate-400 hover:text-red-600" aria-label="លុបសំណួរ">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pl-8">
              {q.options.map((opt, oi) => (
                <label key={oi} className={`flex items-center gap-2 p-2 rounded-xl border ${q.correctAnswer === oi ? 'border-emerald-500 bg-emerald-50' : 'border-slate-200'}`}>
                  <input type="radio" name={`correct-${q.id}`} checked={q.correctAnswer === oi} onChange={() => update(i, { correctAnswer: oi })} className="accent-emerald-600" aria-label={`ចម្លើយត្រឹមត្រូវ ${oi + 1}`} />
                  <input
                    value={opt}
                    onChange={e => update(i, { options: q.options.map((o, k) => (k === oi ? e.target.value : o)) })}
                    placeholder={`ជម្រើស ${oi + 1}`}
                    className="flex-1 bg-transparent text-sm focus:outline-none"
                  />
                </label>
              ))}
            </div>
            <input
              value={q.explanation}
              onChange={e => update(i, { explanation: e.target.value })}
              placeholder="ការពន្យល់ (បង្ហាញក្រោយសិស្សបញ្ជូន)"
              className="ml-8 w-[calc(100%-2rem)] p-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
        ))}
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <button onClick={() => setList([...list, blank(tab)])} className="px-5 py-2.5 rounded-xl border border-slate-300 text-slate-700 font-bold text-sm flex items-center justify-center gap-2 hover:bg-slate-50">
          <Plus className="w-4 h-4" /> បន្ថែមសំណួរ
        </button>
        <button onClick={save} disabled={saving} className="flex-1 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm flex items-center justify-center gap-2 shadow disabled:opacity-50">
          <Save className="w-4 h-4" /> {saving ? 'កំពុងរក្សាទុក...' : 'រក្សាទុកតេស្ត និងប្រឡង'}
        </button>
      </div>
      <p className="text-[11px] text-slate-400">សិស្សមិនឃើញចម្លើយទេ រហូតដល់បញ្ជូន។ ជម្រើសចម្លើយត្រូវបានរៀបលំដាប់ផ្សេងៗគ្នាសម្រាប់សិស្សម្នាក់ៗ។</p>
    </section>
  );
}
