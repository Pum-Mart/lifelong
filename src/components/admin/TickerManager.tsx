'use client';

import React, { useEffect, useState } from 'react';
import { ArrowDown, ArrowUp, Plus, Save, Trash2 } from 'lucide-react';
import { useApp } from '@/context/AppContext';

interface Row { text: string; href: string }

// Messages of the scrolling bar at the bottom of the home page
export default function TickerManager() {
  const { showNotification } = useApp();
  const [rows, setRows] = useState<Row[] | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    fetch('/api/content/ticker')
      .then(res => res.json())
      .then(data => data.success && setRows(data.messages.map((m: { text: string; href?: string }) => ({ text: m.text, href: m.href || '' }))))
      .catch(err => console.error(err));
  }, []);

  if (!rows) return <p className="text-sm text-slate-400">កំពុងផ្ទុក...</p>;

  const update = (i: number, changes: Partial<Row>) => setRows(rows.map((r, k) => (k === i ? { ...r, ...changes } : r)));
  const move = (i: number, d: -1 | 1) => {
    const j = i + d;
    if (j < 0 || j >= rows.length) return;
    const next = [...rows];
    [next[i], next[j]] = [next[j], next[i]];
    setRows(next);
  };

  const save = async () => {
    setBusy(true);
    try {
      const res = await fetch('/api/content/ticker', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: rows })
      });
      const data = await res.json();
      showNotification(data.success ? 'បានរក្សាទុកអក្សររត់' : data.error || 'រក្សាទុកមិនបានទេ', data.success ? 'success' : 'warning');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-4">
      <p className="text-xs text-slate-500">សាររត់ពីស្តាំទៅឆ្វេង នៅខាងក្រោមទំព័រដើម តាមលំដាប់ខាងក្រោម។ តំណ (ស្រេចចិត្ត) ជាទំព័រដែលបើកពេលចុច ឧ. /announcements</p>
      {rows.map((r, i) => (
        <div key={i} className="flex flex-col sm:flex-row gap-2 p-3 rounded-2xl border border-slate-200">
          <input value={r.text} onChange={e => update(i, { text: e.target.value })} placeholder="សារ (អាចប្រើ emoji 📢)" className="flex-1 p-2.5 rounded-xl border border-slate-300 text-sm" aria-label={`សារទី ${i + 1}`} />
          <input value={r.href} onChange={e => update(i, { href: e.target.value })} placeholder="/announcements" className="sm:w-48 p-2.5 rounded-xl border border-slate-300 text-sm font-mono" aria-label={`តំណសារទី ${i + 1}`} />
          <div className="flex gap-1">
            <button onClick={() => move(i, -1)} className="p-2 rounded-lg text-slate-500 hover:bg-slate-100" aria-label="ឡើងលើ"><ArrowUp className="w-4 h-4" /></button>
            <button onClick={() => move(i, 1)} className="p-2 rounded-lg text-slate-500 hover:bg-slate-100" aria-label="ចុះក្រោម"><ArrowDown className="w-4 h-4" /></button>
            <button onClick={() => setRows(rows.filter((_, k) => k !== i))} className="p-2 rounded-lg text-slate-500 hover:text-red-600 hover:bg-red-50" aria-label="លុប"><Trash2 className="w-4 h-4" /></button>
          </div>
        </div>
      ))}
      <div className="flex flex-col sm:flex-row gap-3">
        <button onClick={() => setRows([...rows, { text: '', href: '' }])} className="px-5 py-2.5 rounded-xl border border-slate-300 text-slate-700 font-bold text-sm flex items-center justify-center gap-2 hover:bg-slate-50">
          <Plus className="w-4 h-4" /> បន្ថែមសារ
        </button>
        <button onClick={save} disabled={busy} className="flex-1 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm flex items-center justify-center gap-2 disabled:opacity-50">
          <Save className="w-4 h-4" /> {busy ? 'កំពុងរក្សាទុក...' : 'រក្សាទុកអក្សររត់'}
        </button>
      </div>
    </div>
  );
}
