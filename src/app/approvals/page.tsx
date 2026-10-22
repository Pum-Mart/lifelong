'use client';

import React, { useEffect, useState } from 'react';
import { BadgeCheck, CheckCircle2, XCircle, Clock } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import LoginRequired from '@/components/LoginRequired';
import { CourseCompletion } from '@/types';
import { SCHEME_WEIGHTS } from '@/lib/grades';
import CertificateRequests from '@/components/CertificateRequests';
import RetakeRequests from '@/components/RetakeRequests';
import DownloadRequests from '@/components/DownloadRequests';

export default function ApprovalsPage() {
  const { currentUser, authReady } = useApp();
  if (!authReady) return <div className="py-24 text-center text-sm text-slate-400">កំពុងផ្ទុក...</div>;
  if (!currentUser) return <LoginRequired message="សូមចូលគណនីប្រធានមជ្ឈមណ្ឌល" />;
  if (currentUser.staffTitle !== 'director' && currentUser.staffTitle !== 'committee' && currentUser.role !== 'admin') {
    return <div className="max-w-md mx-auto py-24 px-4 text-center text-sm text-slate-500 font-siemreap">ទំព័រនេះសម្រាប់ប្រធានមជ្ឈមណ្ឌល គណៈកម្មការ និង Admin តែប៉ុណ្ណោះ។</div>;
  }
  return <Approvals />;
}

function Approvals() {
  const { showNotification } = useApp();
  const [items, setItems] = useState<CourseCompletion[] | null>(null);
  const [busy, setBusy] = useState<string | null>(null);

  const load = () =>
    fetch('/api/completions')
      .then(res => res.json())
      .then(data => setItems(data.success ? data.completions : []))
      .catch(err => console.error(err));

  useEffect(() => {
    load();
  }, []);

  const review = async (c: CourseCompletion, action: 'approve' | 'reject') => {
    let note = '';
    if (action === 'approve') {
      const passed = c.results.filter(r => r.passed).length;
      if (!confirm(`អនុម័តលទ្ធផលវគ្គ «${c.courseTitle}» ហើយចេញវិញ្ញាបនបត្រ ${passed} សន្លឹក?`)) return;
    } else {
      note = prompt('មូលហេតុនៃការបង្វិលមកវិញ (គ្រូនឹងឃើញ)៖') || '';
      if (!note.trim()) return;
    }
    setBusy(c.courseId);
    try {
      const res = await fetch(`/api/completions/${c.courseId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, note })
      });
      const data = await res.json();
      if (data.success) {
        showNotification(action === 'approve' ? 'បានអនុម័ត និងចេញវិញ្ញាបនបត្រ 🎓' : 'បានបង្វិលទៅគ្រូវិញ', action === 'approve' ? 'success' : 'info');
        await load();
      } else {
        showNotification(data.error || 'មិនបានសម្រេច', 'warning');
      }
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10 space-y-6 font-siemreap">
      <div className="space-y-1">
        <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-md">
          <BadgeCheck className="w-3.5 h-3.5" />
          <span>ការអនុម័តលទ្ធផល</span>
        </div>
        <h1 className="font-moul text-xl sm:text-2xl text-slate-900 leading-relaxed">អនុម័តលទ្ធផលវគ្គ និងចេញវិញ្ញាបនបត្រ</h1>
        <p className="text-xs text-slate-500 leading-relaxed">
          ឥតគិតថ្លៃ៖ តេស្តមុនចូលរៀន {SCHEME_WEIGHTS.free.test}% • កិច្ចការផ្ទះ {SCHEME_WEIGHTS.free.exercise}% • ប្រឡង {SCHEME_WEIGHTS.free.exam}% (≥ 65 ទើបទទួលវិញ្ញាបនបត្រ)។
          បង់ថ្លៃ៖ តេស្ត {SCHEME_WEIGHTS.paid.test}% • កិច្ចការផ្ទះ {SCHEME_WEIGHTS.paid.exercise}% • វត្តមាន {SCHEME_WEIGHTS.paid.attendance}% • ប្រឡង {SCHEME_WEIGHTS.paid.exam}% (ទទួលវិញ្ញាបនបត្រគ្រប់គ្នា ពិន្ទុមិនបង្ហាញ)។
        </p>
      </div>

      <CertificateRequests />

      <RetakeRequests />

      <DownloadRequests />

      <h2 className="text-lg font-bold text-slate-900 pt-2">លទ្ធផលថ្នាក់ (គ្រូបញ្ជូន)</h2>

      {items === null ? (
        <p className="text-sm text-slate-400">កំពុងផ្ទុក...</p>
      ) : items.length === 0 ? (
        <div className="p-10 rounded-3xl bg-white border border-slate-200 text-center text-sm text-slate-400">មិនមានលទ្ធផលរង់ចាំការអនុម័តទេ</div>
      ) : (
        items.map(c => {
          const passed = c.results.filter(r => r.passed).length;
          return (
            <section key={c.courseId} className={`bg-white rounded-3xl border shadow-sm p-5 sm:p-6 space-y-4 ${c.status === 'submitted' ? 'border-amber-300' : 'border-slate-200'}`}>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h2 className="font-bold text-slate-900">{c.courseTitle}</h2>
                  <p className="text-xs text-slate-500">
                    គ្រូ៖ {c.instructorName || '—'} • បញ្ជូនដោយ {c.submittedBy} {c.submittedAt && `• ${new Date(c.submittedAt).toLocaleString('en-GB')}`}
                  </p>
                  <p className="text-xs text-slate-600 pt-1">សិស្ស {c.results.length} នាក់ • ជាប់ {passed} • ធ្លាក់ {c.results.length - passed}</p>
                </div>
                {c.status === 'submitted' ? (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800"><Clock className="w-3.5 h-3.5" /> រង់ចាំអនុម័ត</span>
                ) : c.status === 'approved' ? (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800"><CheckCircle2 className="w-3.5 h-3.5" /> បានអនុម័តដោយ {c.reviewedBy}</span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-red-100 text-red-700"><XCircle className="w-3.5 h-3.5" /> បានបង្វិលមកវិញ</span>
                )}
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-200 text-slate-400">
                      <th className="pb-2 font-semibold">សិស្ស</th>
                      <th className="pb-2 font-semibold text-center">វត្តមាន</th>
                      <th className="pb-2 font-semibold text-center">តេស្ត</th>
                      <th className="pb-2 font-semibold text-center">លំហាត់</th>
                      <th className="pb-2 font-semibold text-center">ប្រឡង</th>
                      <th className="pb-2 font-semibold text-right">សរុប</th>
                      <th className="pb-2 font-semibold text-right">លទ្ធផល</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {c.results.map(r => (
                      <tr key={r.userId}>
                        <td className="py-2 pr-3 font-semibold text-slate-900">{r.name}</td>
                        <td className="py-2 text-center">{r.attendancePct}%</td>
                        <td className="py-2 text-center">{r.testPct}%</td>
                        <td className="py-2 text-center">{r.exercisePct}%</td>
                        <td className="py-2 text-center">{r.examPct}</td>
                        <td className="py-2 text-right font-black text-slate-900">{r.total}</td>
                        <td className="py-2 text-right">
                          {r.certificateId ? (
                            <a href={`/certificate/${r.certificateId}`} target="_blank" rel="noopener noreferrer" className="text-amber-700 font-bold hover:underline">វិញ្ញាបនបត្រ →</a>
                          ) : (
                            <span className={`font-bold ${r.passed ? 'text-emerald-700' : 'text-red-600'}`}>{r.passed ? 'ជាប់' : 'ធ្លាក់'}</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {c.status === 'rejected' && c.reviewNote && <p className="text-xs text-red-700">មូលហេតុ៖ {c.reviewNote}</p>}

              {c.status === 'submitted' && (
                <div className="flex flex-col sm:flex-row gap-3">
                  <button
                    onClick={() => review(c, 'approve')}
                    disabled={busy === c.courseId}
                    className="flex-1 px-5 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm flex items-center justify-center gap-2 shadow disabled:opacity-50"
                  >
                    <CheckCircle2 className="w-4 h-4" /> អនុម័ត និងចេញវិញ្ញាបនបត្រ ({passed})
                  </button>
                  <button
                    onClick={() => review(c, 'reject')}
                    disabled={busy === c.courseId}
                    className="px-5 py-3 rounded-xl border border-red-200 text-red-600 font-bold text-sm hover:bg-red-50 disabled:opacity-50"
                  >
                    បង្វិលទៅគ្រូវិញ
                  </button>
                </div>
              )}
            </section>
          );
        })
      )}
    </div>
  );
}
