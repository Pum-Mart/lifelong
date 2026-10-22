'use client';

import React, { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { ChevronDown, Plus, Save, Trash2, Upload, ArrowUp, ArrowDown } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { Course } from '@/types';

interface LessonDraft { id?: string; title: string; duration: string; summary: string; content: string; videoUrl: string; activity: string; isFreePreview: boolean; hasQuiz: boolean }
interface ModuleDraft { id?: string; title: string; description: string; lessons: LessonDraft[] }

const inputClass = 'w-full p-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500';

function toDraft(course: Course): ModuleDraft[] {
  return course.modules.map(m => ({
    id: m.id,
    title: m.title,
    description: m.description,
    lessons: m.lessons.map(l => ({
      id: l.id,
      title: l.title,
      duration: l.duration,
      summary: l.summary,
      content: (l.content || []).join('\n\n'),
      videoUrl: l.videoUrl || '',
      activity: l.activity || '',
      isFreePreview: Boolean(l.isFreePreview),
      hasQuiz: Boolean(l.quiz?.length)
    }))
  }));
}

const blankLesson = (): LessonDraft => ({ title: '', duration: '30 នាទី', summary: '', content: '', videoUrl: '', activity: '', isFreePreview: false, hasQuiz: false });

// Course content: cover image, description, chapters and lessons. Price/duration/teacher are
// edited in /admin → course list; pre-test & exam questions in /attendance.
export default function CourseContentManager() {
  const { showNotification } = useApp();
  const [courses, setCourses] = useState<Course[]>([]);
  const [courseId, setCourseId] = useState('');
  const [description, setDescription] = useState('');
  const [thumbnail, setThumbnail] = useState('');
  const [modules, setModules] = useState<ModuleDraft[]>([]);
  const [openLesson, setOpenLesson] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    fetch('/api/courses')
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setCourses(data.courses);
          if (data.courses[0]) setCourseId(data.courses[0].id);
        }
      })
      .catch(err => console.error(err));
  }, []);

  const loadCourse = useCallback(async (id: string) => {
    const data = await (await fetch(`/api/courses/${id}`)).json();
    if (!data.success) return;
    setDescription(data.course.description || '');
    setThumbnail(data.course.thumbnail || '');
    setModules(toDraft(data.course));
    setOpenLesson(null);
  }, []);

  useEffect(() => {
    if (courseId) loadCourse(courseId).catch(err => console.error(err));
  }, [courseId, loadCourse]);

  const uploadCover = async (file: File | null) => {
    if (!file) return;
    const form = new FormData();
    form.append('file', file);
    const data = await (await fetch('/api/uploads', { method: 'POST', body: form })).json();
    if (data.success) setThumbnail(data.url);
    else showNotification(data.error || 'ផ្ទុករូបភាពមិនបាន', 'warning');
  };

  const setModule = (mi: number, changes: Partial<ModuleDraft>) => setModules(modules.map((m, i) => (i === mi ? { ...m, ...changes } : m)));
  const setLesson = (mi: number, li: number, changes: Partial<LessonDraft>) =>
    setModule(mi, { lessons: modules[mi].lessons.map((l, i) => (i === li ? { ...l, ...changes } : l)) });
  const moveLesson = (mi: number, li: number, d: -1 | 1) => {
    const lessons = [...modules[mi].lessons];
    const j = li + d;
    if (j < 0 || j >= lessons.length) return;
    [lessons[li], lessons[j]] = [lessons[j], lessons[li]];
    setModule(mi, { lessons });
  };

  const save = async () => {
    setBusy(true);
    try {
      const res = await fetch(`/api/courses/${courseId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ description, thumbnail, modules })
      });
      const data = await res.json();
      if (data.success) {
        showNotification('បានរក្សាទុកមាតិកាវគ្គសិក្សា');
        await loadCourse(courseId);
      } else {
        showNotification(data.error || 'រក្សាទុកមិនបានទេ', 'warning');
      }
    } finally {
      setBusy(false);
    }
  };

  const course = courses.find(c => c.id === courseId);
  const lessonCount = modules.reduce((n, m) => n + m.lessons.length, 0);

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        <select value={courseId} onChange={e => setCourseId(e.target.value)} className={`${inputClass} sm:max-w-md bg-white`} aria-label="ជ្រើសរើសវគ្គ">
          {courses.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
        </select>
        <Link href="/admin" className="text-xs font-bold text-emerald-700 hover:underline">+ បន្ថែមវគ្គថ្មី / កែតម្លៃ រយៈពេល គ្រូ (ផ្ទាំង Admin)</Link>
      </div>

      {course && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <label className="cursor-pointer space-y-2 text-xs font-semibold text-slate-600">
              <div className="aspect-video rounded-2xl overflow-hidden border border-slate-200 bg-slate-50 flex items-center justify-center">
                {thumbnail ? <img src={thumbnail} alt="" className="w-full h-full object-cover" /> : <Upload className="w-8 h-8 text-slate-300" />}
              </div>
              <span className="text-emerald-700 flex items-center gap-1"><Upload className="w-3.5 h-3.5" /> ប្តូររូបភាពគម្រប</span>
              <input type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" onChange={e => uploadCover(e.target.files?.[0] || null)} />
            </label>
            <label className="md:col-span-2 text-xs font-semibold text-slate-600 space-y-1">
              ការពិពណ៌នាវគ្គ
              <textarea rows={6} value={description} onChange={e => setDescription(e.target.value)} className={inputClass} />
            </label>
          </div>

          <div className="flex items-center justify-between">
            <h3 className="font-bold text-slate-900">ជំពូក និងមេរៀន ({lessonCount} មេរៀន)</h3>
            <button onClick={() => setModules([...modules, { title: `ជំពូកទី ${modules.length + 1}`, description: '', lessons: [blankLesson()] }])} className="px-3 py-2 rounded-xl border border-slate-300 text-slate-700 text-xs font-bold flex items-center gap-1 hover:bg-slate-50">
              <Plus className="w-3.5 h-3.5" /> បន្ថែមជំពូក
            </button>
          </div>

          {modules.map((m, mi) => (
            <div key={m.id || `new-${mi}`} className="rounded-2xl border border-slate-200 p-4 space-y-3">
              <div className="flex gap-2">
                <input value={m.title} onChange={e => setModule(mi, { title: e.target.value })} placeholder="ចំណងជើងជំពូក" className={`${inputClass} font-bold`} aria-label="ចំណងជើងជំពូក" />
                <button onClick={() => confirm(`លុបជំពូក «${m.title}» និងមេរៀនទាំងអស់?`) && setModules(modules.filter((_, i) => i !== mi))} className="p-2 rounded-lg text-slate-500 hover:text-red-600 hover:bg-red-50" aria-label="លុបជំពូក"><Trash2 className="w-4 h-4" /></button>
              </div>
              <input value={m.description} onChange={e => setModule(mi, { description: e.target.value })} placeholder="ការពិពណ៌នាជំពូក" className={inputClass} aria-label="ការពិពណ៌នាជំពូក" />

              {m.lessons.map((l, li) => {
                const key = `${mi}-${li}`;
                const open = openLesson === key;
                return (
                  <div key={l.id || key} className="ml-2 sm:ml-6 rounded-xl border border-slate-200">
                    <div className="flex items-center gap-2 p-2">
                      <button onClick={() => setOpenLesson(open ? null : key)} className="flex-1 flex items-center gap-2 text-left text-sm font-semibold text-slate-800 p-1" aria-expanded={open}>
                        <ChevronDown className={`w-4 h-4 transition ${open ? 'rotate-180' : ''}`} />
                        {l.title || <span className="text-slate-400">មេរៀនថ្មី</span>}
                        {l.hasQuiz && <span className="text-[10px] px-1.5 rounded bg-emerald-100 text-emerald-700">មានកិច្ចការផ្ទះ</span>}
                        {l.isFreePreview && <span className="text-[10px] px-1.5 rounded bg-sky-100 text-sky-700">សាកល្បងឥតគិតថ្លៃ</span>}
                      </button>
                      <button onClick={() => moveLesson(mi, li, -1)} className="p-1.5 rounded text-slate-400 hover:bg-slate-100" aria-label="ឡើងលើ"><ArrowUp className="w-3.5 h-3.5" /></button>
                      <button onClick={() => moveLesson(mi, li, 1)} className="p-1.5 rounded text-slate-400 hover:bg-slate-100" aria-label="ចុះក្រោម"><ArrowDown className="w-3.5 h-3.5" /></button>
                      <button onClick={() => confirm(`លុបមេរៀន «${l.title}»?`) && setModule(mi, { lessons: m.lessons.filter((_, i) => i !== li) })} className="p-1.5 rounded text-slate-400 hover:text-red-600 hover:bg-red-50" aria-label="លុបមេរៀន"><Trash2 className="w-3.5 h-3.5" /></button>
                    </div>
                    {open && (
                      <div className="p-3 pt-0 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs font-semibold text-slate-600">
                        <label className="sm:col-span-2">ចំណងជើងមេរៀន *<input value={l.title} onChange={e => setLesson(mi, li, { title: e.target.value })} className={inputClass} /></label>
                        <label>រយៈពេល<input value={l.duration} onChange={e => setLesson(mi, li, { duration: e.target.value })} className={inputClass} /></label>
                        <label>តំណវីដេអូ (https://...)<input value={l.videoUrl} onChange={e => setLesson(mi, li, { videoUrl: e.target.value })} className={`${inputClass} font-mono`} /></label>
                        <label className="sm:col-span-2">សេចក្តីសង្ខេប<input value={l.summary} onChange={e => setLesson(mi, li, { summary: e.target.value })} className={inputClass} /></label>
                        <label className="sm:col-span-2">ខ្លឹមសារមេរៀន (បន្ទាត់ទទេ = កថាខណ្ឌថ្មី)<textarea rows={6} value={l.content} onChange={e => setLesson(mi, li, { content: e.target.value })} className={inputClass} /></label>
                        <label className="sm:col-span-2">សកម្មភាពអនុវត្ត<input value={l.activity} onChange={e => setLesson(mi, li, { activity: e.target.value })} className={inputClass} /></label>
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input type="checkbox" checked={l.isFreePreview} onChange={e => setLesson(mi, li, { isFreePreview: e.target.checked })} className="w-4 h-4 accent-emerald-600" /> អនុញ្ញាតឱ្យសាកល្បងរៀនឥតគិតថ្លៃ
                        </label>
                      </div>
                    )}
                  </div>
                );
              })}
              <button onClick={() => { setModule(mi, { lessons: [...m.lessons, blankLesson()] }); setOpenLesson(`${mi}-${m.lessons.length}`); }} className="ml-2 sm:ml-6 text-xs font-bold text-emerald-700 flex items-center gap-1">
                <Plus className="w-3.5 h-3.5" /> បន្ថែមមេរៀន
              </button>
            </div>
          ))}

          <button onClick={save} disabled={busy} className="w-full px-5 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm flex items-center justify-center gap-2 shadow disabled:opacity-50">
            <Save className="w-4 h-4" /> {busy ? 'កំពុងរក្សាទុក...' : 'រក្សាទុកមាតិកាវគ្គ'}
          </button>
          <p className="text-[11px] text-slate-400">កិច្ចការផ្ទះ (សំណួរក្នុងមេរៀន) របស់មេរៀនដែលមានស្រាប់ត្រូវបានរក្សាទុក។ តេស្តមុនចូលរៀន និងប្រឡង កែនៅ «វត្តមាន និងពិន្ទុ → តេស្ត & ប្រឡង»។</p>
        </>
      )}
    </div>
  );
}
