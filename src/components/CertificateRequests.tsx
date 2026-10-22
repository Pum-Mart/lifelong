'use client';

import React, { useEffect, useState } from 'react';
import { Award, CheckCircle2, Clock, XCircle } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { CertificateRequest } from '@/types';

// Self-study learners who completed every requirement, waiting for the director/committee
export default function CertificateRequests() {
  const { showNotification } = useApp();
  const [requests, setRequests] = useState<CertificateRequest[] | null>(null);
  const [busy, setBusy] = useState<string | null>(null);

  const load = () =>
    fetch('/api/certificate-requests')
      .then(res => res.json())
      .then(data => setRequests(data.success ? data.requests : []))
      .catch(err => console.error(err));

  useEffect(() => {
    load();
  }, []);

  const review = async (r: CertificateRequest, action: 'approve' | 'reject') => {
    let note = '';
    if (action === 'approve') {
      if (!confirm(`អនុម័ត និងចេញវិញ្ញាបនបត្រជូន ${r.name} សម្រាប់វគ្គ «${r.courseTitle}»?`)) return;
    } else {
      note = prompt('មូលហេតុ (អ្នកសិក្សានឹងឃើញ)៖') || '';
      if (!note.trim()) return;
    }
    setBusy(r.id);
    try {
      const res = await fetch(`/api/certificate-requests/${r.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, note })
      });
      const data = await res.json();
      if (data.success) {
        showNotification(action === 'approve' ? `បានចេញវិញ្ញាបនបត្រជូន ${r.name} 🎓` : 'បានបង្វិលសំណើវិញ', action === 'approve' ? 'success' : 'info');
        await load();
      } else {
        showNotification(data.error || 'មិនបានសម្រេច', 'warning');
      }
    } finally {
      setBusy(null);
    }
  };

  if (requests === null) return <p className="text-sm text-slate-400">កំពុងផ្ទុក...</p>;
  const pending = requests.filter(r => r.status === 'pending');

  return (
    <section className="bg-white rounded-3xl border border-amber-200 shadow-sm p-5 sm:p-6 space-y-4">
      <div className="flex items-center justify-between gap-3">
        <h2 className="flex items-center gap-2 font-bold text-slate-900"><Award className="w-5 h-5 text-amber-500" /> សំណើវិញ្ញាបនបត្រ (សិក្សាដោយខ្លួនឯង)</h2>
        <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800">{pending.length} រង់ចាំ</span>
      </div>

      {requests.length === 0 ? (
        <p className="text-sm text-slate-400 py-4 text-center">មិនទាន់មានសំណើទេ</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 text-slate-400">
                <th className="pb-2 font-semibold">អ្នកសិក្សា</th>
                <th className="pb-2 font-semibold">វគ្គ</th>
                <th className="pb-2 font-semibold text-center">តេស្ត</th>
                <th className="pb-2 font-semibold text-center">កិច្ចការផ្ទះ</th>
                <th className="pb-2 font-semibold text-center">វត្តមាន</th>
                <th className="pb-2 font-semibold text-center">ប្រឡង</th>
                <th className="pb-2 font-semibold text-right">សរុប</th>
                <th className="pb-2 font-semibold text-right">សកម្មភាព</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {requests.map(r => (
                <tr key={r.id} className="align-top">
                  <td className="py-2.5 pr-3">
                    <div className="font-semibold text-slate-900">{r.name}</div>
                    <div className="text-[11px] text-slate-500">{r.email}</div>
                  </td>
                  <td className="py-2.5 pr-3 max-w-[14rem]">
                    <div className="text-slate-700 line-clamp-2">{r.courseTitle}</div>
                    <span className={`text-[10px] font-bold ${r.scheme === 'paid' ? 'text-amber-700' : 'text-sky-700'}`}>{r.scheme === 'paid' ? 'បង់ថ្លៃ • ពិន្ទុមិនបង្ហាញលើវិញ្ញាបនបត្រ' : 'ឥតគិតថ្លៃ'}</span>
                  </td>
                  <td className="py-2.5 text-center">{r.breakdown.testPct}%</td>
                  <td className="py-2.5 text-center">{r.breakdown.exercisePct}%</td>
                  <td className="py-2.5 text-center">{r.breakdown.attendancePct === null ? '—' : `${r.breakdown.attendancePct}%`}</td>
                  <td className="py-2.5 text-center">{r.breakdown.examPct}%</td>
                  <td className="py-2.5 text-right font-black text-slate-900">{r.total}</td>
                  <td className="py-2.5 text-right whitespace-nowrap">
                    {r.status === 'pending' ? (
                      <span className="space-x-1.5">
                        <button disabled={busy === r.id} onClick={() => review(r, 'approve')} className="px-2.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold disabled:opacity-50">
                          អនុម័ត
                        </button>
                        <button disabled={busy === r.id} onClick={() => review(r, 'reject')} className="px-2.5 py-1.5 rounded-lg border border-red-200 text-red-600 hover:bg-red-50 font-bold disabled:opacity-50">
                          បង្វិល
                        </button>
                      </span>
                    ) : r.status === 'approved' ? (
                      <a href={`/certificate/${r.certificateId}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-emerald-700 font-bold hover:underline">
                        <CheckCircle2 className="w-3.5 h-3.5" /> {r.reviewedBy}
                      </a>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-red-600 font-bold" title={r.reviewNote}><XCircle className="w-3.5 h-3.5" /> បានបង្វិល</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <p className="text-[11px] text-slate-400 flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> សំណើបង្កើតដោយស្វ័យប្រវត្តិ ពេលអ្នកសិក្សាបំពេញគ្រប់លក្ខខណ្ឌ។ ប្រធាន គណៈកម្មការណាម្នាក់ ឬ Admin អាចអនុម័តបាន។</p>
    </section>
  );
}
