'use client';

import React, { useState } from 'react';
import { Check, RotateCcw, Send } from 'lucide-react';
import { AssessmentKind, PublicQuestion } from '@/types';

export interface QuizReview {
  id: string;
  correct: boolean;
  correctShownIndex: number;
  explanation: string;
}

export interface QuizResult {
  score: number;
  correct: number;
  total: number;
  review: QuizReview[];
}

interface Props {
  courseId: string;
  kind: AssessmentKind;
  lessonId?: string;
  questions: PublicQuestion[];
  allowRetake?: boolean;
  dark?: boolean;
  submitLabel?: string;
  // Receives the whole API response (result, standing, certificate)
  onSubmitted?: (data: Record<string, unknown>) => void;
}

// Answers are graded on the server; correct answers are only revealed after submitting
export default function QuizRunner({ courseId, kind, lessonId, questions, allowRetake = true, dark = false, submitLabel = 'បញ្ជូនចម្លើយ', onSubmitted }: Props) {
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [result, setResult] = useState<QuizResult | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const c = dark
    ? { card: 'bg-slate-900 border-slate-800', q: 'text-white', opt: 'bg-slate-800/60 border-slate-700/60 text-slate-300 hover:bg-slate-800', sel: 'bg-emerald-950/70 border-emerald-500 text-white' }
    : { card: 'bg-white border-slate-200', q: 'text-slate-900', opt: 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100', sel: 'bg-emerald-50 border-emerald-500 text-emerald-900' };

  const answered = Object.keys(answers).length;

  const submit = async () => {
    if (answered < questions.length && !confirm(`អ្នកបានឆ្លើយ ${answered}/${questions.length} សំណួរ។ សំណួរមិនបានឆ្លើយនឹងរាប់ថាខុស។ បញ្ជូន?`)) return;
    setBusy(true);
    setError('');
    try {
      const res = await fetch(`/api/assessments/${courseId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ kind, lessonId, answers })
      });
      const data = await res.json();
      if (!data.success) {
        setError(data.error || 'បញ្ជូនមិនបានទេ');
        return;
      }
      setResult(data.result);
      onSubmitted?.(data);
    } catch {
      setError('មិនអាចភ្ជាប់ទៅម៉ាស៊ីនមេបានទេ');
    } finally {
      setBusy(false);
    }
  };

  const review = (id: string) => result?.review.find(r => r.id === id);

  return (
    <div className="space-y-4">
      {questions.map((q, idx) => {
        const r = review(q.id);
        return (
          <div key={q.id} className={`p-5 rounded-2xl border space-y-3 ${c.card}`}>
            <div className="flex items-start gap-2">
              <span className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-600 text-xs font-bold flex items-center justify-center shrink-0">{idx + 1}</span>
              <h4 className={`text-sm font-bold leading-relaxed ${c.q}`}>{q.question}</h4>
            </div>
            <div className="space-y-2" role="radiogroup" aria-label={q.question}>
              {q.options.map((option, optIdx) => {
                const selected = answers[q.id] === optIdx;
                const isRight = r && optIdx === r.correctShownIndex;
                return (
                  <button
                    key={optIdx}
                    role="radio"
                    aria-checked={selected}
                    disabled={Boolean(result)}
                    onClick={() => setAnswers(a => ({ ...a, [q.id]: optIdx }))}
                    className={`w-full text-left p-3 rounded-xl text-xs font-medium transition flex items-center justify-between border ${selected ? c.sel : c.opt} ${isRight ? '!border-emerald-500 !bg-emerald-100 !text-emerald-900' : ''} ${r && selected && !r.correct ? '!border-red-400 !bg-red-50 !text-red-800' : ''}`}
                  >
                    <span>{option}</span>
                    {selected && <Check className="w-4 h-4 shrink-0" />}
                  </button>
                );
              })}
            </div>
            {r && (
              <div className={`p-3 rounded-xl text-xs ${r.correct ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-red-50 text-red-800 border border-red-200'}`}>
                <div className="font-bold">{r.correct ? '✓ ត្រឹមត្រូវ' : '✗ មិនត្រឹមត្រូវ'}</div>
                {r.explanation && <div className="mt-1">{r.explanation}</div>}
              </div>
            )}
          </div>
        );
      })}

      {error && <div role="alert" className="p-3 rounded-xl bg-red-50 border border-red-200 text-sm text-red-700">{error}</div>}

      {result ? (
        <div className="flex flex-wrap items-center gap-3">
          <div className={`px-4 py-2 rounded-xl font-black text-lg ${result.score >= 65 ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}`}>
            {result.correct}/{result.total} • {result.score}%
          </div>
          {allowRetake && (
            <button
              onClick={() => { setResult(null); setAnswers({}); }}
              className="px-5 py-2.5 rounded-xl border border-slate-300 text-slate-700 text-xs font-bold flex items-center gap-2 hover:bg-slate-50"
            >
              <RotateCcw className="w-3.5 h-3.5" /> ធ្វើម្តងទៀត
            </button>
          )}
        </div>
      ) : (
        <button
          onClick={submit}
          disabled={busy || answered === 0}
          className="px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold flex items-center gap-2 shadow disabled:opacity-50"
        >
          <Send className="w-4 h-4" /> {busy ? 'កំពុងបញ្ជូន...' : `${submitLabel} (${answered}/${questions.length})`}
        </button>
      )}
    </div>
  );
}
