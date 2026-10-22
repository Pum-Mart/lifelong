'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { Award, RefreshCw, Send, Save, CheckCircle2, Clock, XCircle } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { CompletionResult, CourseCompletion } from '@/types';
import { SCHEME_WEIGHTS, weightedTotal } from '@/lib/grades';

type Part = 'attendancePct' | 'testPct' | 'exercisePct' | 'examPct';

type Scheme = 'free' | 'paid';

// Free courses have no attendance part
function partsFor(scheme: Scheme): { key: Part; label: string; weight: number }[] {
  const w = SCHEME_WEIGHTS[scheme];
  return [
    ...(scheme === 'paid' ? [{ key: 'attendancePct' as Part, label: 'វត្តមាន', weight: w.attendance }] : []),
    { key: 'testPct', label: 'តេស្ត', weight: w.test },
    { key: 'exercisePct', label: 'លំហាត់/កិច្ចការផ្ទះ', weight: w.exercise },
    { key: 'examPct', label: 'ប្រឡង', weight: w.exam }
  ];
}

const STATUS: Record<CourseCompletion['status'], { label: string; className: string; icon: React.ReactNode }> = {
  draft: { label: 'ព្រាង', className: 'bg-slate-100 text-slate-700', icon: <Save className="w-3.5 h-3.5" /> },
  submitted: { label: 'រង់ចាំប្រធានអនុម័ត', className: 'bg-amber-100 text-amber-800', icon: <Clock className="w-3.5 h-3.5" /> },
  approved: { label: 'បានអនុម័ត • វិញ្ញាបនបត្របានចេញ', className: 'bg-emerald-100 text-emerald-800', icon: <CheckCircle2 className="w-3.5 h-3.5" /> },
  rejected: { label: 'បានបង្វិលមកវិញ', className: 'bg-red-100 text-red-700', icon: <XCircle className="w-3.5 h-3.5" /> }
};

// End-of-course sheet for the teacher: scores pulled from the class book, editable,
// then sent to the centre director for approval.
export default function CompletionPanel({ courseId }: { courseId: string }) {
  const { showNotification } = useApp();
  const [completion, setCompletion] = useState<CourseCompletion | null>(null);
  const [passScore, setPassScore] = useState(65);
  const [scheme, setScheme] = useState<Scheme>('free');
  const [endDate, setEndDate] = useState<string | undefined>();
  const [busy, setBusy] = useState(false);

  const load = useCallback(async (recompute = false) => {
    const res = await fetch(`/api/classes/${courseId}/completion${recompute ? '?recompute=1' : ''}`);
    const data = await res.json();
    if (data.success) {
      setCompletion(data.completion);
      setPassScore(data.passScore);
      setScheme(data.scheme);
      setEndDate(data.endDate);
    }
  }, [courseId]);

  useEffect(() => {
    load().catch(err => console.error(err));
  }, [load]);

  if (!completion) return <p className="text-sm text-slate-400">កំពុងផ្ទុក...</p>;

  const locked = completion.status === 'submitted' || completion.status === 'approved';
  const today = new Date().toLocaleDateString('en-CA');
  const beforeEnd = endDate ? today < endDate : false;

  const setPart = (userId: string, key: Part, value: string) => {
    setCompletion(c => {
      if (!c) return c;
      const results = c.results.map(r => {
        if (r.userId !== userId) return r;
        const n = value === '' ? 0 : Math.max(0, Math.min(100, Number(value)));
        const next = { ...r, [key]: n };
        const total = weightedTotal(next, scheme);
        return { ...next, total, passed: scheme === 'paid' || total >= passScore };
      });
      return { ...c, results };
    });
  };

  const save = async (submit: boolean) => {
    if (submit && !confirm('បញ្ជូនលទ្ធផលនេះទៅប្រធានមជ្ឈមណ្ឌលអនុម័ត? បន្ទាប់ពីបញ្ជូន មិនអាចកែប្រែបានទេ លុះត្រាប្រធានបង្វិលមកវិញ។')) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/classes/${courseId}/completion`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          courseCompleted: completion.courseCompleted,
          submit,
          results: completion.results.map(({ userId, attendancePct, testPct, exercisePct, examPct }) => ({ userId, attendancePct, testPct, exercisePct, examPct }))
        })
      });
      const data = await res.json();
      if (data.success) {
        setCompletion(data.completion);
        showNotification(submit ? 'បានបញ្ជូនទៅប្រធានមជ្ឈមណ្ឌលអនុម័ត' : 'បានរក្សាទុក');
      } else {
        showNotification(data.error || 'រក្សាទុកមិនបានទេ', 'warning');
      }
    } finally {
      setBusy(false);
    }
  };

  const status = STATUS[completion.status];
  const PARTS = partsFor(scheme);
  const passed = completion.results.filter(r => r.passed).length;

  return (
    <section className="bg-white rounded-3xl border border-slate-200 shadow-sm p-5 sm:p-6 space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="flex items-center gap-2 font-bold text-slate-900"><Award className="w-5 h-5 text-amber-500" /> បញ្ចប់វគ្គ និងលទ្ធផលចុងក្រោយ</h2>
        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold ${status.className}`}>{status.icon} {status.label}</span>
      </div>

      {completion.status === 'rejected' && completion.reviewNote && (
        <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-sm text-red-800">
          <strong>ប្រធានបានបង្វិលមកវិញ៖</strong> {completion.reviewNote}
        </div>
      )}

      <label className={`flex items-start gap-3 p-4 rounded-2xl border-2 ${completion.courseCompleted ? 'border-emerald-400 bg-emerald-50' : 'border-slate-200'} ${locked ? 'opacity-70' : 'cursor-pointer'}`}>
        <input
          type="checkbox"
          disabled={locked}
          checked={completion.courseCompleted}
          onChange={e => setCompletion({ ...completion, courseCompleted: e.target.checked })}
          className="mt-0.5 w-5 h-5 accent-emerald-600"
        />
        <span className="text-sm">
          <strong className="text-slate-900">បានបញ្ចប់វគ្គហើយ</strong>
          <span className="block text-xs text-slate-500">
            {endDate ? `ថ្ងៃបញ្ចប់វគ្គ៖ ${endDate}` : 'មិនទាន់កំណត់ថ្ងៃបញ្ចប់វគ្គ'}
            {beforeEnd && ' • មិនទាន់ដល់ថ្ងៃបញ្ចប់'}
          </span>
        </span>
      </label>

      <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500">
        <span>ពិន្ទុត្រូវបានទាញចេញដោយស្វ័យប្រវត្តិពី {scheme === 'paid' ? 'វត្តមាន ' : ''}តេស្ត កិច្ចការផ្ទះ និងប្រឡង (រួមទាំងការធ្វើអនឡាញ)។ អាចកែបានមុនពេលបញ្ជូន។ {scheme === 'paid' ? 'វគ្គបង់ថ្លៃ៖ ទទួលវិញ្ញាបនបត្រគ្រប់គ្នា ពិន្ទុមិនបង្ហាញលើវិញ្ញាបនបត្រ។' : `វគ្គឥតគិតថ្លៃ៖ ≥ ${passScore}/100 ទើបទទួលវិញ្ញាបនបត្រ។`}</span>
        {!locked && (
          <button onClick={() => load(true)} className="flex items-center gap-1 font-bold text-emerald-700 hover:underline">
            <RefreshCw className="w-3.5 h-3.5" /> ទាញពិន្ទុម្តងទៀត
          </button>
        )}
      </div>

      {completion.results.length === 0 ? (
        <p className="text-sm text-slate-400 py-6 text-center">មិនមានសិស្សក្នុងវគ្គនេះទេ</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 text-slate-400">
                <th className="pb-2 font-semibold">សិស្ស</th>
                {PARTS.map(p => <th key={p.key} className="pb-2 font-semibold text-center">{p.label} ({p.weight}%)</th>)}
                <th className="pb-2 font-semibold text-right">សរុប</th>
                <th className="pb-2 font-semibold text-right">លទ្ធផល</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {completion.results.map((r: CompletionResult) => (
                <tr key={r.userId}>
                  <td className="py-2.5 pr-3 font-semibold text-slate-900">{r.name}</td>
                  {PARTS.map(p => (
                    <td key={p.key} className="py-2.5 text-center">
                      <input
                        type="number" min={0} max={100} step="0.1"
                        disabled={locked}
                        value={r[p.key]}
                        onChange={e => setPart(r.userId, p.key, e.target.value)}
                        className="w-20 p-1.5 rounded-lg border border-slate-300 text-center disabled:bg-slate-50"
                        aria-label={`${p.label} ${r.name}`}
                      />
                    </td>
                  ))}
                  <td className="py-2.5 text-right text-base font-black text-slate-900">{r.total}</td>
                  <td className="py-2.5 text-right">
                    {r.certificateId ? (
                      <a href={`/certificate/${r.certificateId}`} target="_blank" rel="noopener noreferrer" className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 font-bold text-[10px] hover:underline">វិញ្ញាបនបត្រ →</a>
                    ) : (
                      <span className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${r.passed ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-700'}`}>{r.passed ? 'ទទួលវិញ្ញាបនបត្រ' : 'មិនគ្រប់ ៦៥'}</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="text-[11px] text-slate-500 pt-2">ជាប់ {passed} នាក់ • ធ្លាក់ {completion.results.length - passed} នាក់ • សិស្សដែលជាប់នឹងទទួលបានវិញ្ញាបនបត្រ ពេលប្រធានអនុម័ត។</p>
        </div>
      )}

      {!locked && (
        <div className="flex flex-col sm:flex-row gap-3">
          <button onClick={() => save(false)} disabled={busy} className="px-5 py-3 rounded-xl border border-slate-300 text-slate-700 font-bold text-sm flex items-center justify-center gap-2 hover:bg-slate-50 disabled:opacity-50">
            <Save className="w-4 h-4" /> រក្សាទុកព្រាង
          </button>
          <button
            onClick={() => save(true)}
            disabled={busy || !completion.courseCompleted}
            className="flex-1 px-5 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm flex items-center justify-center gap-2 shadow disabled:opacity-50"
            title={completion.courseCompleted ? '' : 'សូមធីក «បានបញ្ចប់វគ្គហើយ» ជាមុនសិន'}
          >
            <Send className="w-4 h-4" /> បញ្ជូនទៅប្រធានមជ្ឈមណ្ឌលអនុម័ត
          </button>
        </div>
      )}
      {completion.status === 'submitted' && <p className="text-xs text-amber-800">បានបញ្ជូនដោយ {completion.submittedBy} • {completion.submittedAt && new Date(completion.submittedAt).toLocaleString('en-GB')}</p>}
      {completion.status === 'approved' && <p className="text-xs text-emerald-800">អនុម័តដោយ {completion.reviewedBy} • {completion.reviewedAt && new Date(completion.reviewedAt).toLocaleString('en-GB')}</p>}
    </section>
  );
}
