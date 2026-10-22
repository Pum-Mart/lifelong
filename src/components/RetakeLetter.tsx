'use client';

import React, { useState } from 'react';
import { Hourglass, Send, XCircle } from 'lucide-react';
import { useApp } from '@/context/AppContext';

const khmer = (n: number) => String(n).replace(/\d/g, d => '០១២៣៤៥៦៧៨៩'[Number(d)]);

interface Props {
  courseId: string;
  courseTitle: string;
  learnerName: string;
  nextRound: number;
  pending: { round: number; createdAt: string } | null;
  rejected: { round: number; reviewNote?: string; reviewedBy?: string } | null;
  onSent: () => void;
}

// Shown when the exam attempts of the current round are used up
export default function RetakeLetter({ courseId, courseTitle, learnerName, nextRound, pending, rejected, onSent }: Props) {
  const { showNotification } = useApp();
  const [reason, setReason] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  if (pending) {
    return (
      <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-sm text-amber-900 flex items-start gap-2">
        <Hourglass className="w-5 h-5 shrink-0 mt-0.5" />
        <span>
          លិខិតស្នើសុំប្រឡងលើកទី «{khmer(pending.round)}» របស់អ្នក កំពុងរង់ចាំការអនុម័តពីប្រធានមជ្ឈមណ្ឌល គណៈកម្មការ ឬ Admin។
          អ្នកនឹងទទួលបានលិខិតជូនដំណឹង ពេលត្រូវបានអនុញ្ញាត។
        </span>
      </div>
    );
  }

  const today = new Date().toLocaleDateString('en-GB');

  const send = async () => {
    setError('');
    if (reason.trim().length < 5) return setError('សូមសរសេរមូលហេតុនៃការស្នើសុំ');
    setBusy(true);
    try {
      const res = await fetch(`/api/assessments/${courseId}/retake`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason })
      });
      const data = await res.json();
      if (data.success) {
        showNotification('បានបញ្ជូនលិខិតស្នើសុំ');
        onSent();
      } else {
        setError(data.error || 'បញ្ជូនមិនបានទេ');
      }
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-4">
      <p className="text-sm text-slate-600">អ្នកបានប្រឡងគ្រប់ចំនួនដងក្នុងលើកនេះហើយ។ ដើម្បីប្រឡងម្តងទៀត សូមដាក់លិខិតស្នើសុំ។</p>
      {rejected && (
        <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-800 flex items-start gap-2">
          <XCircle className="w-4 h-4 shrink-0" />
          <span>លិខិតស្នើសុំប្រឡងលើកទី «{khmer(rejected.round)}» មិនត្រូវបានអនុញ្ញាត{rejected.reviewNote ? `៖ ${rejected.reviewNote}` : ''}។ អ្នកអាចដាក់លិខិតថ្មីបាន។</span>
        </div>
      )}

      {/* The letter */}
      <div className="p-6 rounded-2xl border-2 border-slate-200 bg-slate-50/60 space-y-3 text-sm text-slate-800 leading-loose">
        <h3 className="font-moul text-center text-base leading-relaxed">លិខិតស្នើសុំប្រឡងលើកទី «{khmer(nextRound)}»</h3>
        <p><strong>គោរពជូន៖</strong> លោកប្រធានមជ្ឈមណ្ឌល និងគណៈកម្មការ មជ្ឈមណ្ឌលសិក្សាពេញមួយជីវិត</p>
        <p><strong>កម្មវត្ថុ៖</strong> សំណើសុំប្រឡងលើកទី «{khmer(nextRound)}» នៃវគ្គ «{courseTitle}»</p>
        <p>ខ្ញុំបាទ/នាងខ្ញុំឈ្មោះ <strong>{learnerName}</strong> ជាអ្នកសិក្សាក្នុងវគ្គខាងលើ សូមគោរពស្នើសុំការអនុញ្ញាតឱ្យប្រឡងម្តងទៀត ដោយមូលហេតុ៖</p>
        <textarea
          value={reason}
          onChange={e => setReason(e.target.value)}
          rows={3}
          maxLength={1000}
          placeholder="សរសេរមូលហេតុ (ឧ. ខ្ញុំបានរៀនឡើងវិញ និងធ្វើកិច្ចការផ្ទះបន្ថែម...)"
          className="w-full p-3 rounded-xl border border-slate-300 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
        />
        <p>សូមលោកប្រធាន និងគណៈកម្មការ មេត្តាពិនិត្យ និងអនុញ្ញាតដោយក្តីអនុគ្រោះ។ សូមអរគុណ។</p>
        <p className="text-right">ធ្វើនៅថ្ងៃទី {today}<br />ហត្ថលេខាអ្នកស្នើសុំ៖ <strong>{learnerName}</strong></p>
      </div>

      {error && <div role="alert" className="p-3 rounded-xl bg-red-50 border border-red-200 text-sm text-red-700">{error}</div>}
      <button onClick={send} disabled={busy} className="px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold flex items-center gap-2 shadow disabled:opacity-50">
        <Send className="w-4 h-4" /> {busy ? 'កំពុងបញ្ជូន...' : 'បញ្ជូនលិខិតស្នើសុំ'}
      </button>
    </div>
  );
}
