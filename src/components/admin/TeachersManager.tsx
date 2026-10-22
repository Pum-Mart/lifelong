'use client';

import React, { useState } from 'react';
import { Plus, Pencil, Trash2, X, Upload, UserRound } from 'lucide-react';
import { Course, Instructor } from '@/types';

interface Props {
  instructors: Instructor[];
  courses: Course[];
  onChanged: (message: string) => void;
  onError: (message: string) => void;
}

export default function TeachersManager({ instructors, courses, onChanged, onError }: Props) {
  // null = closed, 'new' = add form, otherwise the teacher being edited
  const [editing, setEditing] = useState<Instructor | 'new' | null>(null);

  const remove = async (teacher: Instructor) => {
    if (!confirm(`លុបគ្រូ «${teacher.name}»?`)) return;
    const res = await fetch(`/api/instructors/${teacher.id}`, { method: 'DELETE' });
    const data = await res.json();
    if (data.success) onChanged(`បានលុបគ្រូ «${teacher.name}»`);
    else onError(data.error || 'លុបមិនបានទេ');
  };

  return (
    <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm p-6 sm:p-8 space-y-6 font-siemreap">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900">គ្រូបង្រៀន</h2>
          <p className="text-xs text-slate-500">ឈ្មោះ រូបថត ៤x៦ ប្រវត្តិរូបសង្ខេប និងបទពិសោធន៍បង្រៀន</p>
        </div>
        <button
          onClick={() => setEditing('new')}
          className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-2 shadow-md shadow-emerald-600/20 transition"
        >
          <Plus className="w-4 h-4" />
          <span>បន្ថែមគ្រូ</span>
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {instructors.map(teacher => {
          const courseCount = courses.filter(c => c.instructorId === teacher.id).length;
          return (
            <div key={teacher.id} className="flex gap-4 p-4 rounded-2xl border border-slate-200">
              <img src={teacher.avatar} alt={teacher.name} className="w-20 aspect-[2/3] rounded-xl object-cover shrink-0 bg-slate-100" />
              <div className="min-w-0 flex-1 space-y-1">
                <div className="font-bold text-sm text-slate-900">{teacher.name}</div>
                {teacher.title && <div className="text-[11px] text-emerald-700 font-semibold line-clamp-2">{teacher.title}</div>}
                {teacher.experience && <div className="text-[11px] text-slate-600 line-clamp-2">បទពិសោធន៍៖ {teacher.experience}</div>}
                <div className="text-[11px] text-slate-400">{courseCount} វគ្គ</div>
                <div className="flex gap-1 pt-1">
                  <button onClick={() => setEditing(teacher)} className="p-1.5 rounded-lg text-slate-500 hover:text-emerald-700 hover:bg-emerald-50" title="កែប្រែ">
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button onClick={() => remove(teacher)} className="p-1.5 rounded-lg text-slate-500 hover:text-red-600 hover:bg-red-50" title="លុប">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {editing && (
        <TeacherFormModal
          key={editing === 'new' ? 'new' : editing.id}
          teacher={editing === 'new' ? undefined : editing}
          onClose={() => setEditing(null)}
          onSaved={message => {
            setEditing(null);
            onChanged(message);
          }}
        />
      )}
    </div>
  );
}

const inputClass = 'mt-1 w-full p-2.5 rounded-xl border border-slate-300 text-sm font-normal focus:outline-none focus:ring-2 focus:ring-emerald-500';

function TeacherFormModal({ teacher, onClose, onSaved }: { teacher?: Instructor; onClose: () => void; onSaved: (message: string) => void }) {
  const [name, setName] = useState(teacher?.name || '');
  const [title, setTitle] = useState(teacher?.title || '');
  const [bio, setBio] = useState(teacher?.bio || '');
  const [experience, setExperience] = useState(teacher?.experience || '');
  const [credentials, setCredentials] = useState(teacher?.credentials.join('\n') || '');
  const [photo, setPhoto] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(teacher?.avatar || null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const choosePhoto = (file: File | null) => {
    if (preview?.startsWith('blob:')) URL.revokeObjectURL(preview);
    setPhoto(file);
    setPreview(file ? URL.createObjectURL(file) : teacher?.avatar || null);
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!teacher && !photo) return setError('សូមភ្ជាប់រូបថត ៤x៦');

    const form = new FormData();
    form.append('name', name);
    form.append('title', title);
    form.append('bio', bio);
    form.append('experience', experience);
    form.append('credentials', credentials);
    if (photo) form.append('photo', photo);

    setSaving(true);
    try {
      const res = await fetch(teacher ? `/api/instructors/${teacher.id}` : '/api/instructors', {
        method: teacher ? 'PUT' : 'POST',
        body: form
      });
      const data = await res.json();
      if (!data.success) {
        setError(data.error || 'រក្សាទុកមិនបានទេ');
        return;
      }
      onSaved(teacher ? `បានកែប្រែព័ត៌មានគ្រូ «${name}»` : `បានបន្ថែមគ្រូ «${name}»`);
    } catch (err) {
      console.error(err);
      setError('មិនអាចភ្ជាប់ទៅម៉ាស៊ីនមេបានទេ');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-2xl w-full shadow-2xl max-h-[92vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-slate-100 px-6 py-4 flex items-center justify-between">
          <h3 className="font-moul text-base text-slate-900 leading-relaxed">{teacher ? 'កែប្រែព័ត៌មានគ្រូ' : 'បន្ថែមគ្រូបង្រៀន'}</h3>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100" aria-label="បិទ">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={submit} className="p-6 flex flex-col sm:flex-row gap-6 text-xs font-semibold text-slate-600">
          {/* 4x6 portrait */}
          <label className="shrink-0 w-36 mx-auto sm:mx-0 cursor-pointer space-y-2 text-center">
            <div className="w-36 aspect-[2/3] rounded-xl border-2 border-dashed border-slate-300 hover:border-emerald-400 bg-slate-50 overflow-hidden flex items-center justify-center transition">
              {preview ? (
                <img src={preview} alt="" className="w-full h-full object-cover" />
              ) : (
                <UserRound className="w-12 h-12 text-slate-300" />
              )}
            </div>
            <span className="inline-flex items-center gap-1 text-emerald-700"><Upload className="w-3.5 h-3.5" /> រូបថត ៤x៦ {teacher ? '' : '*'}</span>
            <input type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" onChange={e => choosePhoto(e.target.files?.[0] || null)} />
          </label>

          <div className="flex-1 space-y-4">
            <label className="block">
              ឈ្មោះគ្រូ *
              <input required value={name} onChange={e => setName(e.target.value)} className={inputClass} />
            </label>
            <label className="block">
              តួនាទី / ជំនាញ
              <input value={title} onChange={e => setTitle(e.target.value)} placeholder="ឧ. គ្រូបង្គោលវាយស្គរឆៃយ៉ាំ" className={inputClass} />
            </label>
            <label className="block">
              ប្រវត្តិរូបសង្ខេប
              <textarea rows={3} value={bio} onChange={e => setBio(e.target.value)} className={inputClass} />
            </label>
            <label className="block">
              បទពិសោធន៍បង្រៀន
              <textarea rows={2} value={experience} onChange={e => setExperience(e.target.value)} placeholder="ឧ. បង្រៀន ១០ ឆ្នាំ នៅ..." className={inputClass} />
            </label>
            <label className="block">
              សញ្ញាបត្រ / វិញ្ញាបនបត្រ (មួយបន្ទាត់ មួយ)
              <textarea rows={2} value={credentials} onChange={e => setCredentials(e.target.value)} className={inputClass} />
            </label>

            {error && <div role="alert" className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 font-normal">{error}</div>}

            <div className="pt-3 flex justify-end gap-3 border-t border-slate-100">
              <button type="button" onClick={onClose} className="px-4 py-2.5 rounded-xl border border-slate-300 text-slate-700 font-bold">
                បោះបង់
              </button>
              <button type="submit" disabled={saving} className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow disabled:opacity-50">
                {saving ? 'កំពុងរក្សាទុក...' : teacher ? 'រក្សាទុក' : 'បន្ថែមគ្រូ'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
