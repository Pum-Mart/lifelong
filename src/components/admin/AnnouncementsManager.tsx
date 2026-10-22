'use client';

import React, { useEffect, useState } from 'react';
import { Pencil, Plus, Trash2, Upload, Eye, EyeOff } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { Announcement } from '@/types';
import AnnouncementBody from '@/components/AnnouncementBody';

const inputClass = 'mt-1 w-full p-2.5 rounded-xl border border-slate-300 text-sm font-normal focus:outline-none focus:ring-2 focus:ring-emerald-500';

export default function AnnouncementsManager() {
  const { showNotification } = useApp();
  const [items, setItems] = useState<Announcement[]>([]);
  const [editing, setEditing] = useState<Announcement | 'new' | null>(null);

  const load = () =>
    fetch('/api/content/announcements?all=1')
      .then(res => res.json())
      .then(data => data.success && setItems(data.announcements))
      .catch(err => console.error(err));

  useEffect(() => {
    load();
  }, []);

  const remove = async (a: Announcement) => {
    if (!confirm(`លុបសេចក្តីជូនដំណឹង «${a.title}»?`)) return;
    await fetch(`/api/content/announcements/${a.id}`, { method: 'DELETE' });
    showNotification('បានលុប', 'info');
    load();
  };

  if (editing) {
    return (
      <AnnouncementForm
        key={editing === 'new' ? 'new' : editing.id}
        item={editing === 'new' ? undefined : editing}
        onClose={() => setEditing(null)}
        onSaved={() => {
          setEditing(null);
          showNotification('បានរក្សាទុកសេចក្តីជូនដំណឹង');
          load();
        }}
      />
    );
  }

  return (
    <div className="space-y-4">
      <button onClick={() => setEditing('new')} className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm flex items-center gap-2">
        <Plus className="w-4 h-4" /> បញ្ចូលសេចក្តីជូនដំណឹងថ្មី
      </button>
      {items.length === 0 && <p className="text-sm text-slate-400 py-6 text-center">មិនទាន់មានសេចក្តីជូនដំណឹង</p>}
      {items.map(a => (
        <div key={a.id} className="p-4 rounded-2xl border border-slate-200 flex items-start gap-4">
          {a.image ? <img src={a.image} alt="" className="w-20 h-14 rounded-lg object-cover shrink-0" /> : <div className="w-20 h-14 rounded-lg bg-amber-50 shrink-0" />}
          <div className="flex-1 min-w-0">
            <div className="font-bold text-slate-900 text-sm">{a.title}</div>
            <div className="text-[11px] text-slate-500">{new Date(a.createdAt).toLocaleDateString('en-GB')} • {a.published ? <span className="text-emerald-700 font-bold">បានផ្សព្វផ្សាយ</span> : <span className="text-slate-400 font-bold">ព្រាង (មិនបង្ហាញ)</span>}</div>
            <p className="text-xs text-slate-500 line-clamp-2 mt-1">{a.body}</p>
          </div>
          <div className="flex gap-1 shrink-0">
            <button onClick={() => setEditing(a)} className="p-2 rounded-lg text-slate-500 hover:text-emerald-700 hover:bg-emerald-50" aria-label="កែប្រែ"><Pencil className="w-4 h-4" /></button>
            <button onClick={() => remove(a)} className="p-2 rounded-lg text-slate-500 hover:text-red-600 hover:bg-red-50" aria-label="លុប"><Trash2 className="w-4 h-4" /></button>
          </div>
        </div>
      ))}
    </div>
  );
}

function AnnouncementForm({ item, onClose, onSaved }: { item?: Announcement; onClose: () => void; onSaved: () => void }) {
  const [title, setTitle] = useState(item?.title || '');
  const [body, setBody] = useState(item?.body || '');
  const [published, setPublished] = useState(item?.published ?? true);
  const [image, setImage] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(item?.image || null);
  const [removeImage, setRemoveImage] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const choose = (file: File | null) => {
    if (preview?.startsWith('blob:')) URL.revokeObjectURL(preview);
    setImage(file);
    setRemoveImage(false);
    setPreview(file ? URL.createObjectURL(file) : null);
  };

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError('');
    const form = new FormData();
    form.append('title', title);
    form.append('body', body);
    form.append('published', String(published));
    if (image) form.append('image', image);
    if (removeImage) form.append('removeImage', 'true');
    try {
      const res = await fetch(item ? `/api/content/announcements/${item.id}` : '/api/content/announcements', { method: item ? 'PUT' : 'POST', body: form });
      const data = await res.json();
      if (data.success) onSaved();
      else setError(data.error || 'រក្សាទុកមិនបានទេ');
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={save} className="space-y-4 text-xs font-semibold text-slate-600">
      <label className="block">
        ចំណងជើង *
        <input required value={title} onChange={e => setTitle(e.target.value)} placeholder="ឧ. ស្តីពីការចុះឈ្មោះចូលរៀនវគ្គថ្មី" className={inputClass} />
      </label>
      <label className="block">
        ខ្លឹមសារ *
        <textarea required rows={12} value={body} onChange={e => setBody(e.target.value)} className={`${inputClass} font-siemreap leading-relaxed`} />
        <span className="block mt-1 text-[11px] font-normal text-slate-400">បន្ទាត់ទទេ = កថាខណ្ឌថ្មី • ចាប់ផ្តើមដោយ «-» = ចំណុច • បន្ទាត់បញ្ចប់ដោយ «៖» = ចំណងជើងរង</span>
      </label>
      <div className="flex flex-wrap items-center gap-4">
        <label className="flex items-center gap-3 cursor-pointer">
          {preview ? <img src={preview} alt="" className="w-24 h-16 rounded-lg object-cover" /> : <span className="w-24 h-16 rounded-lg bg-slate-100 flex items-center justify-center"><Upload className="w-5 h-5 text-slate-400" /></span>}
          <span className="text-emerald-700">រូបភាព (ស្រេចចិត្ត)</span>
          <input type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" onChange={e => choose(e.target.files?.[0] || null)} />
        </label>
        {preview && <button type="button" onClick={() => { choose(null); setRemoveImage(true); }} className="text-red-600 underline">ដករូបភាព</button>}
        <label className="flex items-center gap-2 cursor-pointer ml-auto">
          <input type="checkbox" checked={published} onChange={e => setPublished(e.target.checked)} className="w-4 h-4 accent-emerald-600" />
          {published ? <Eye className="w-4 h-4 text-emerald-600" /> : <EyeOff className="w-4 h-4" />} ផ្សព្វផ្សាយជាសាធារណៈ
        </label>
      </div>

      <button type="button" onClick={() => setShowPreview(p => !p)} className="text-emerald-700 underline">{showPreview ? 'លាក់ការមើលជាមុន' : 'មើលជាមុន'}</button>
      {showPreview && (
        <div className="p-5 rounded-2xl border border-slate-200 bg-slate-50 font-normal">
          <p className="font-moul text-center text-emerald-800 leading-relaxed pb-3">{title}</p>
          <AnnouncementBody text={body} />
        </div>
      )}

      {error && <div role="alert" className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 font-normal">{error}</div>}
      <div className="flex justify-end gap-3 pt-2 border-t border-slate-100">
        <button type="button" onClick={onClose} className="px-4 py-2.5 rounded-xl border border-slate-300 text-slate-700 font-bold">បោះបង់</button>
        <button type="submit" disabled={busy} className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold disabled:opacity-50">{busy ? 'កំពុងរក្សាទុក...' : 'រក្សាទុក'}</button>
      </div>
    </form>
  );
}
