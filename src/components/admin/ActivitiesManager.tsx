'use client';

import React, { useEffect, useState } from 'react';
import { Pencil, Plus, Trash2, Upload } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { Activity } from '@/types';

const inputClass = 'mt-1 w-full p-2.5 rounded-xl border border-slate-300 text-sm font-normal focus:outline-none focus:ring-2 focus:ring-emerald-500';

// Daily teaching activities with photos — shown as the slideshow on /about
export default function ActivitiesManager() {
  const { showNotification } = useApp();
  const [items, setItems] = useState<Activity[]>([]);
  const [editing, setEditing] = useState<Activity | 'new' | null>(null);

  const load = () =>
    fetch('/api/content/activities')
      .then(res => res.json())
      .then(data => data.success && setItems(data.activities))
      .catch(err => console.error(err));

  useEffect(() => {
    load();
  }, []);

  const remove = async (a: Activity) => {
    if (!confirm(`លុបសកម្មភាព «${a.title}»?`)) return;
    await fetch(`/api/content/activities/${a.id}`, { method: 'DELETE' });
    showNotification('បានលុប', 'info');
    load();
  };

  if (editing) {
    return (
      <ActivityForm
        key={editing === 'new' ? 'new' : editing.id}
        item={editing === 'new' ? undefined : editing}
        onClose={() => setEditing(null)}
        onSaved={() => {
          setEditing(null);
          showNotification('បានរក្សាទុកសកម្មភាព');
          load();
        }}
      />
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <button onClick={() => setEditing('new')} className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm flex items-center gap-2">
          <Plus className="w-4 h-4" /> បញ្ចូលសកម្មភាពប្រចាំថ្ងៃ
        </button>
        <span className="text-xs text-slate-500">បង្ហាញជាស្លាយនៅទំព័រ «អំពី LLLc» (ប្តូររាល់ ៥ វិនាទី)</span>
      </div>
      {items.length === 0 && <p className="text-sm text-slate-400 py-6 text-center">មិនទាន់មានសកម្មភាព</p>}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {items.map(a => (
          <div key={a.id} className="rounded-2xl border border-slate-200 overflow-hidden">
            <img src={a.photo} alt={a.title} className="w-full aspect-video object-cover" />
            <div className="p-3 flex items-start gap-2">
              <div className="flex-1 min-w-0">
                <div className="text-[11px] text-slate-400">{a.date}</div>
                <div className="font-bold text-slate-900 text-sm line-clamp-1">{a.title}</div>
                {a.description && <p className="text-xs text-slate-500 line-clamp-2">{a.description}</p>}
              </div>
              <button onClick={() => setEditing(a)} className="p-1.5 rounded-lg text-slate-500 hover:text-emerald-700 hover:bg-emerald-50" aria-label="កែប្រែ"><Pencil className="w-4 h-4" /></button>
              <button onClick={() => remove(a)} className="p-1.5 rounded-lg text-slate-500 hover:text-red-600 hover:bg-red-50" aria-label="លុប"><Trash2 className="w-4 h-4" /></button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ActivityForm({ item, onClose, onSaved }: { item?: Activity; onClose: () => void; onSaved: () => void }) {
  const [title, setTitle] = useState(item?.title || '');
  const [description, setDescription] = useState(item?.description || '');
  const [date, setDate] = useState(item?.date || new Date().toLocaleDateString('en-CA'));
  const [photo, setPhoto] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(item?.photo || null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const choose = (file: File | null) => {
    if (preview?.startsWith('blob:')) URL.revokeObjectURL(preview);
    setPhoto(file);
    setPreview(file ? URL.createObjectURL(file) : item?.photo || null);
  };

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!item && !photo) return setError('សូមភ្ជាប់រូបថត');
    setBusy(true);
    setError('');
    const form = new FormData();
    form.append('title', title);
    form.append('description', description);
    form.append('date', date);
    if (photo) form.append('photo', photo);
    try {
      const res = await fetch(item ? `/api/content/activities/${item.id}` : '/api/content/activities', { method: item ? 'PUT' : 'POST', body: form });
      const data = await res.json();
      if (data.success) onSaved();
      else setError(data.error || 'រក្សាទុកមិនបានទេ');
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={save} className="grid grid-cols-1 md:grid-cols-2 gap-5 text-xs font-semibold text-slate-600">
      <label className="cursor-pointer space-y-2">
        <div className="aspect-video rounded-2xl border-2 border-dashed border-slate-300 hover:border-emerald-400 bg-slate-50 overflow-hidden flex items-center justify-center">
          {preview ? <img src={preview} alt="" className="w-full h-full object-cover" /> : <Upload className="w-10 h-10 text-slate-300" />}
        </div>
        <span className="text-emerald-700">រូបថតសកម្មភាព {item ? '' : '*'} (JPG/PNG/WEBP ≤ 5MB)</span>
        <input type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" onChange={e => choose(e.target.files?.[0] || null)} />
      </label>
      <div className="space-y-4">
        <label className="block">
          ចំណងជើង *
          <input required value={title} onChange={e => setTitle(e.target.value)} placeholder="ឧ. វគ្គកសិកម្មឆ្លាតវៃ — អនុវត្តនៅចម្ការ" className={inputClass} />
        </label>
        <label className="block">
          កាលបរិច្ឆេទ *
          <input required type="date" value={date} onChange={e => setDate(e.target.value)} className={inputClass} />
        </label>
        <label className="block">
          ការពិពណ៌នា
          <textarea rows={4} value={description} onChange={e => setDescription(e.target.value)} className={inputClass} />
        </label>
        {error && <div role="alert" className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 font-normal">{error}</div>}
        <div className="flex justify-end gap-3">
          <button type="button" onClick={onClose} className="px-4 py-2.5 rounded-xl border border-slate-300 text-slate-700 font-bold">បោះបង់</button>
          <button type="submit" disabled={busy} className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold disabled:opacity-50">{busy ? 'កំពុងរក្សាទុក...' : 'រក្សាទុក'}</button>
        </div>
      </div>
    </form>
  );
}
