'use client';

import React, { useEffect, useState } from 'react';
import { Download, FileText, Pencil, Plus, Trash2, Upload } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { LibraryResource, ResourceType } from '@/types';

const TYPES: { id: ResourceType; name: string }[] = [
  { id: 'guides', name: 'សៀវភៅណែនាំ' },
  { id: 'curricula', name: 'កម្មវិធីសិក្សា' },
  { id: 'toolkits', name: 'កញ្ចប់ឧបករណ៍' },
  { id: 'publications', name: 'ការបោះពុម្ពផ្សាយ' },
  { id: 'teaching', name: 'សម្ភារឧបទេស' }
];
const inputClass = 'mt-1 w-full p-2.5 rounded-xl border border-slate-300 text-sm font-normal focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white';

// Library documents shown in the home page "Resources & Library" section
export default function ResourcesManager() {
  const { showNotification } = useApp();
  const [items, setItems] = useState<LibraryResource[]>([]);
  const [editing, setEditing] = useState<LibraryResource | 'new' | null>(null);

  const load = () =>
    fetch('/api/content/resources')
      .then(res => res.json())
      .then(data => data.success && setItems(data.resources))
      .catch(err => console.error(err));

  useEffect(() => {
    load();
  }, []);

  const remove = async (r: LibraryResource) => {
    if (!confirm(`លុបឯកសារ «${r.title}»?`)) return;
    await fetch(`/api/content/resources/${r.id}`, { method: 'DELETE' });
    showNotification('បានលុប', 'info');
    load();
  };

  if (editing) {
    return (
      <ResourceForm
        key={editing === 'new' ? 'new' : editing.id}
        item={editing === 'new' ? undefined : editing}
        onClose={() => setEditing(null)}
        onSaved={() => {
          setEditing(null);
          showNotification('បានរក្សាទុកឯកសារ');
          load();
        }}
      />
    );
  }

  return (
    <div className="space-y-4">
      <button onClick={() => setEditing('new')} className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm flex items-center gap-2">
        <Plus className="w-4 h-4" /> បញ្ចូលឯកសារថ្មី (PDF, Word, Excel...)
      </button>
      {items.length === 0 && <p className="text-sm text-slate-400 py-6 text-center">មិនទាន់មានឯកសារ</p>}
      {items.map(r => (
        <div key={r.id} className="p-4 rounded-2xl border border-slate-200 flex items-start gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0"><FileText className="w-6 h-6" /></div>
          <div className="flex-1 min-w-0">
            <div className="font-bold text-slate-900 text-sm">{r.title}</div>
            <div className="text-[11px] text-slate-500">
              {TYPES.find(t => t.id === r.type)?.name} • {r.category || '—'} • {r.file ? r.file.name : 'មគ្គុទ្ទេសក៍បង្កើតពីវគ្គ'} • ទាញយក {r.downloads} ដង
            </div>
            {r.description && <p className="text-xs text-slate-500 line-clamp-2 mt-1">{r.description}</p>}
          </div>
          <div className="flex gap-1 shrink-0">
            <a href={`/api/content/resources/${r.id}/download`} className="p-2 rounded-lg text-slate-500 hover:text-emerald-700 hover:bg-emerald-50" aria-label="ទាញយក"><Download className="w-4 h-4" /></a>
            <button onClick={() => setEditing(r)} className="p-2 rounded-lg text-slate-500 hover:text-emerald-700 hover:bg-emerald-50" aria-label="កែប្រែ"><Pencil className="w-4 h-4" /></button>
            <button onClick={() => remove(r)} className="p-2 rounded-lg text-slate-500 hover:text-red-600 hover:bg-red-50" aria-label="លុប"><Trash2 className="w-4 h-4" /></button>
          </div>
        </div>
      ))}
    </div>
  );
}

function ResourceForm({ item, onClose, onSaved }: { item?: LibraryResource; onClose: () => void; onSaved: () => void }) {
  const [title, setTitle] = useState(item?.title || '');
  const [type, setType] = useState<ResourceType>(item?.type || 'guides');
  const [category, setCategory] = useState(item?.category || '');
  const [description, setDescription] = useState(item?.description || '');
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!item && !file) return setError('សូមភ្ជាប់ឯកសារ');
    setBusy(true);
    setError('');
    const form = new FormData();
    form.append('title', title);
    form.append('type', type);
    form.append('category', category);
    form.append('description', description);
    if (file) form.append('file', file);
    try {
      const res = await fetch(item ? `/api/content/resources/${item.id}` : '/api/content/resources', { method: item ? 'PUT' : 'POST', body: form });
      const data = await res.json();
      if (data.success) onSaved();
      else setError(data.error || 'រក្សាទុកមិនបានទេ');
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={save} className="space-y-4 text-xs font-semibold text-slate-600">
      <label className="block">ចំណងជើង *<input required value={title} onChange={e => setTitle(e.target.value)} className={inputClass} /></label>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <label className="block">ប្រភេទ *
          <select value={type} onChange={e => setType(e.target.value as ResourceType)} className={inputClass}>
            {TYPES.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
          </select>
        </label>
        <label className="block">ផ្នែក / មុខវិជ្ជា<input value={category} onChange={e => setCategory(e.target.value)} placeholder="ឧ. កសិកម្ម" className={inputClass} /></label>
      </div>
      <label className="block">ការពិពណ៌នា<textarea rows={3} value={description} onChange={e => setDescription(e.target.value)} className={inputClass} /></label>
      <label className="flex items-center gap-3 p-3 rounded-2xl border-2 border-dashed border-slate-300 hover:border-emerald-400 cursor-pointer">
        <Upload className="w-5 h-5 text-slate-400" />
        <span>
          <strong className="block text-slate-900">{file ? file.name : item?.file ? `បច្ចុប្បន្ន៖ ${item.file.name}` : item?.courseId ? 'បច្ចុប្បន្ន៖ មគ្គុទ្ទេសក៍បង្កើតពីវគ្គ' : 'ជ្រើសរើសឯកសារ *'}</strong>
          <span className="font-normal text-slate-500">PDF, Word, Excel, PowerPoint, TXT ឬរូបភាព (មិនលើស 15MB)</span>
        </span>
        <input type="file" accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,image/jpeg,image/png,image/webp" className="sr-only" onChange={e => setFile(e.target.files?.[0] || null)} />
      </label>
      {error && <div role="alert" className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 font-normal">{error}</div>}
      <div className="flex justify-end gap-3 pt-2 border-t border-slate-100">
        <button type="button" onClick={onClose} className="px-4 py-2.5 rounded-xl border border-slate-300 text-slate-700 font-bold">បោះបង់</button>
        <button type="submit" disabled={busy} className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold disabled:opacity-50">{busy ? 'កំពុងរក្សាទុក...' : 'រក្សាទុក'}</button>
      </div>
    </form>
  );
}
