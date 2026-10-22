'use client';

import React, { useEffect, useState } from 'react';
import { CheckCircle2, Circle, Mail, UserPlus } from 'lucide-react';
import { VisitorMessage } from '@/types';

// Messages from the contact form and volunteer sign-ups
export default function MessagesManager() {
  const [items, setItems] = useState<VisitorMessage[] | null>(null);
  const [filter, setFilter] = useState<'open' | 'all'>('open');

  const load = () =>
    fetch('/api/contact')
      .then(res => res.json())
      .then(data => setItems(data.success ? data.messages : []))
      .catch(err => console.error(err));

  useEffect(() => {
    load();
  }, []);

  const toggle = async (m: VisitorMessage) => {
    await fetch(`/api/contact/${m.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ handled: !m.handled }) });
    load();
  };

  if (!items) return <p className="text-sm text-slate-400">កំពុងផ្ទុក...</p>;
  const shown = filter === 'open' ? items.filter(m => !m.handled) : items;

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        {(['open', 'all'] as const).map(f => (
          <button key={f} onClick={() => setFilter(f)} className={`px-4 py-2 rounded-xl text-xs font-bold ${filter === f ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-600'}`}>
            {f === 'open' ? `មិនទាន់ដោះស្រាយ (${items.filter(m => !m.handled).length})` : `ទាំងអស់ (${items.length})`}
          </button>
        ))}
      </div>
      {shown.length === 0 && <p className="text-sm text-slate-400 py-6 text-center">មិនមានសារ</p>}
      {shown.map(m => (
        <div key={m.id} className={`p-4 rounded-2xl border ${m.handled ? 'border-slate-200 opacity-70' : 'border-emerald-200 bg-emerald-50/30'}`}>
          <div className="flex items-start justify-between gap-3">
            <div className="space-y-1 text-sm">
              <div className="flex items-center gap-2 font-bold text-slate-900">
                {m.kind === 'volunteer' ? <UserPlus className="w-4 h-4 text-indigo-600" /> : <Mail className="w-4 h-4 text-emerald-600" />}
                {m.name} <span className="font-normal text-slate-500">• {m.contact}</span>
              </div>
              <div className="text-[11px] text-slate-500">
                {m.kind === 'volunteer' ? 'អ្នកស្ម័គ្រចិត្ត' : 'ទម្រង់ទំនាក់ទំនង'}{m.subject ? ` • ${m.subject}` : ''} • {new Date(m.createdAt).toLocaleString('en-GB')}
              </div>
              {m.message && <p className="text-slate-700 whitespace-pre-line">{m.message}</p>}
            </div>
            <button onClick={() => toggle(m)} className="shrink-0 text-xs font-bold flex items-center gap-1 text-emerald-700 hover:underline">
              {m.handled ? <><CheckCircle2 className="w-4 h-4" /> បានដោះស្រាយ</> : <><Circle className="w-4 h-4" /> សម្គាល់ថាបានដោះស្រាយ</>}
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
