'use client';

import React, { useState } from 'react';
import { X } from 'lucide-react';
import { Course, CourseFormat, CourseLevel, Instructor } from '@/types';
import { CATEGORIES } from '@/lib/data';

const LEVELS: CourseLevel[] = ['All Levels', 'Beginner', 'Intermediate', 'Advanced'];
const FORMATS: CourseFormat[] = ['Online Self-Paced', 'Live Webinar', 'In-Person Workshop'];

interface Props {
  course?: Course; // edit when given, otherwise create
  instructors: Instructor[];
  onClose: () => void;
  onSaved: (message: string) => void;
}

const inputClass = 'mt-1 w-full p-2.5 rounded-xl border border-slate-300 text-sm font-normal focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white';

export default function CourseFormModal({ course, instructors, onClose, onSaved }: Props) {
  const [title, setTitle] = useState(course?.title || '');
  const [subtitle, setSubtitle] = useState(course?.subtitle || '');
  const [category, setCategory] = useState(course?.category || CATEGORIES.find(c => c.id !== 'all')?.id || '');
  const [level, setLevel] = useState<CourseLevel>(course?.level || 'All Levels');
  const [format, setFormat] = useState<CourseFormat>(course?.format || 'Online Self-Paced');
  const [duration, setDuration] = useState(course?.duration || '4 សប្តាហ៍');
  const [price, setPrice] = useState(String(course?.price ?? 25));
  const [originalPrice, setOriginalPrice] = useState(String(course?.originalPrice ?? ''));
  const [ceus, setCeus] = useState(String(course?.ceus ?? 1.5));
  const [instructorId, setInstructorId] = useState(course?.instructorId || instructors[0]?.id || '');
  const [startDate, setStartDate] = useState(course?.startDate || '');
  const [endDate, setEndDate] = useState(course?.endDate || '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const priceNum = Number(price);
    if (!title.trim()) return setError('សូមបញ្ចូលឈ្មោះវគ្គ');
    if (!Number.isFinite(priceNum) || priceNum < 0) return setError('តម្លៃត្រូវជាលេខ ០ ឬច្រើនជាងនេះ');
    if (startDate && endDate && endDate < startDate) return setError('ថ្ងៃបញ្ចប់ត្រូវនៅក្រោយថ្ងៃចាប់ផ្តើម');

    const body = {
      title: title.trim(),
      subtitle: subtitle.trim(),
      category,
      level,
      format,
      duration: duration.trim(),
      price: priceNum,
      // Blank original price means "no strike-through"
      originalPrice: originalPrice.trim() === '' ? priceNum : Number(originalPrice),
      ceus: Number(ceus) || 0,
      instructorId,
      startDate,
      endDate
    };

    setSaving(true);
    try {
      const res = await fetch(course ? `/api/courses/${course.id}` : '/api/courses', {
        method: course ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      const data = await res.json();
      if (!data.success) {
        setError(data.error || 'រក្សាទុកមិនបានទេ');
        return;
      }
      onSaved(course ? `បានកែប្រែវគ្គ «${body.title}»` : `បានបន្ថែមវគ្គ «${body.title}»`);
    } catch (err) {
      console.error(err);
      setError('មិនអាចភ្ជាប់ទៅម៉ាស៊ីនមេបានទេ');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4 font-siemreap">
      <div className="bg-white rounded-3xl max-w-2xl w-full shadow-2xl max-h-[92vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-slate-100 px-6 py-4 flex items-center justify-between">
          <h3 className="font-moul text-base text-slate-900 leading-relaxed">{course ? 'កែប្រែវគ្គសិក្សា' : 'បន្ថែមវគ្គសិក្សាថ្មី'}</h3>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100" aria-label="បិទ">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={submit} className="p-6 space-y-4 text-xs font-semibold text-slate-600">
          <label className="block">
            ឈ្មោះវគ្គ *
            <input required value={title} onChange={e => setTitle(e.target.value)} className={inputClass} />
          </label>
          <label className="block">
            សេចក្តីសង្ខេប
            <input value={subtitle} onChange={e => setSubtitle(e.target.value)} className={inputClass} />
          </label>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <label className="block">
              តម្លៃ ($) *
              <input required type="number" min="0" step="0.01" value={price} onChange={e => setPrice(e.target.value)} className={inputClass} />
              <span className="block mt-1 text-[11px] font-normal text-slate-400">0 = ឥតគិតថ្លៃ</span>
            </label>
            <label className="block">
              តម្លៃដើម ($)
              <input type="number" min="0" step="0.01" value={originalPrice} onChange={e => setOriginalPrice(e.target.value)} placeholder="ទុកទទេ = គ្មាន" className={inputClass} />
              <span className="block mt-1 text-[11px] font-normal text-slate-400">បង្ហាញជាតម្លៃគូសចេញ</span>
            </label>
            <label className="block">
              រយៈពេលវគ្គ *
              <input required value={duration} onChange={e => setDuration(e.target.value)} placeholder="ឧ. 6 សប្តាហ៍ (18 ម៉ោង)" className={inputClass} />
            </label>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <label className="block">
              ថ្ងៃចាប់ផ្តើមវគ្គ
              <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className={inputClass} />
            </label>
            <label className="block">
              ថ្ងៃបញ្ចប់វគ្គ
              <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className={inputClass} />
              <span className="block mt-1 text-[11px] font-normal text-slate-400">ប្រើសម្រាប់រាប់ថ្ងៃនៅសល់ និងសារបញ្ចប់វគ្គ</span>
            </label>
          </div>

          <label className="block">
            គ្រូបង្រៀន *
            <select required value={instructorId} onChange={e => setInstructorId(e.target.value)} className={inputClass}>
              {instructors.map(i => (
                <option key={i.id} value={i.id}>{i.name}{i.title ? ` — ${i.title}` : ''}</option>
              ))}
            </select>
          </label>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <label className="block">
              ប្រភេទ
              <select value={category} onChange={e => setCategory(e.target.value)} className={inputClass}>
                {CATEGORIES.filter(c => c.id !== 'all').map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </label>
            <label className="block">
              ទម្រង់
              <select value={format} onChange={e => setFormat(e.target.value as CourseFormat)} className={inputClass}>
                {FORMATS.map(f => <option key={f} value={f}>{f}</option>)}
              </select>
            </label>
            <label className="block">
              កម្រិត
              <select value={level} onChange={e => setLevel(e.target.value as CourseLevel)} className={inputClass}>
                {LEVELS.map(l => <option key={l} value={l}>{l}</option>)}
              </select>
            </label>
            <label className="block">
              CEUs
              <input type="number" min="0" step="0.1" value={ceus} onChange={e => setCeus(e.target.value)} className={inputClass} />
            </label>
          </div>

          {error && <div role="alert" className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 font-normal">{error}</div>}

          <div className="pt-3 flex justify-end gap-3 border-t border-slate-100">
            <button type="button" onClick={onClose} className="px-4 py-2.5 rounded-xl border border-slate-300 text-slate-700 font-bold">
              បោះបង់
            </button>
            <button type="submit" disabled={saving} className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow disabled:opacity-50">
              {saving ? 'កំពុងរក្សាទុក...' : course ? 'រក្សាទុកការកែប្រែ' : 'បន្ថែមវគ្គ'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
