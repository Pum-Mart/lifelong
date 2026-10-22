'use client';

import React, { useEffect, useState } from 'react';
import { CheckCircle2, Download, XCircle } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { DownloadRequest } from '@/types';

// Requests to download a certificate again, for the director, committee and admins
export default function DownloadRequests() {
  const { showNotification } = useApp();
  const [requests, setRequests] = useState<DownloadRequest[] | null>(null);
  const [busy, setBusy] = useState<string | null>(null);

  const load = () =>
    fetch('/api/download-requests')
      .then(res => res.json())
      .then(data => setRequests(data.success ? data.requests : []))
      .catch(err => console.error(err));

  useEffect(() => {
    load();
  }, []);

  const review = async (r: DownloadRequest, action: 'approve' | 'reject') => {
    let note = '';
    if (action === 'approve') {
      if (!confirm(`អនុញ្ញាតឱ្យ ${r.name} ទាញយកវិញ្ញាបនបត្រ ${r.certificateCode} ម្តងទៀត?`)) return;
    } else {
      note = prompt('មូលហេតុ (អ្នកសិក្សានឹងឃើញ)៖') || '';
      if (!note.trim()) return;
    }
    setBusy(r.id);
    try {
      const res = await fetch(`/api/download-requests/${r.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, note })
      });
      const data = await res.json();
      if (data.success) {
        showNotification(action === 'approve' ? `បានអនុញ្ញាតឱ្យ ${r.name} ទាញយកម្តងទៀត` : 'បានបដិសេធសំណើ', action === 'approve' ? 'success' : 'info');
        await load();
      } else {
        showNotification(data.error || 'មិនបានសម្រេច', 'warning');
      }
    } finally {
      setBusy(null);
    }
  };

  if (requests === null) return null;
  const pending = requests.filter(r => r.status === 'pending').length;

  return (
    <section className="bg-white rounded-3xl border border-emerald-200 shadow-sm p-5 sm:p-6 space-y-4">
      <div className="flex items-center justify-between gap-3">
        <h2 className="flex items-center gap-2 font-bold text-slate-900"><Download className="w-5 h-5 text-emerald-600" /> សំណើទាញយកវិញ្ញាបនបត្រម្តងទៀត</h2>
        <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800">{pending} រង់ចាំ</span>
      </div>
      {requests.length === 0 ? (
        <p className="text-sm text-slate-400 py-4 text-center">មិនទាន់មានសំណើទេ</p>
      ) : (
        <ul className="space-y-3">
          {requests.map(r => (
            <li key={r.id} className={`p-4 rounded-2xl border ${r.status === 'pending' ? 'border-emerald-300 bg-emerald-50/40' : 'border-slate-200'}`}>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="space-y-1 text-sm">
                  <div className="font-bold text-slate-900">{r.name} • <span className="font-mono">{r.certificateCode}</span></div>
                  <div className="text-xs text-slate-500">{r.email} • {r.courseTitle} • {new Date(r.createdAt).toLocaleString('en-GB')}</div>
                  <p className="text-slate-700 whitespace-pre-line">មូលហេតុ៖ {r.reason}</p>
                </div>
                {r.status === 'pending' ? (
                  <div className="flex gap-2 shrink-0">
                    <button disabled={busy === r.id} onClick={() => review(r, 'approve')} className="px-3 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold disabled:opacity-50">អនុញ្ញាត</button>
                    <button disabled={busy === r.id} onClick={() => review(r, 'reject')} className="px-3 py-2 rounded-lg border border-red-200 text-red-600 hover:bg-red-50 text-xs font-bold disabled:opacity-50">បដិសេធ</button>
                  </div>
                ) : r.status === 'approved' ? (
                  <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700"><CheckCircle2 className="w-4 h-4" /> អនុញ្ញាតដោយ {r.reviewedBy}</span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-xs font-bold text-red-600" title={r.reviewNote}><XCircle className="w-4 h-4" /> បដិសេធ</span>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
