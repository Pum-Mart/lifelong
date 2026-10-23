'use client';

import React, { useEffect, useState } from 'react';
import { BookOpen, Palmtree, Send, Trash2, Users } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import DatePartsInput, { INCOMPLETE_DATE } from '@/components/admin/DatePartsInput';
import { formatClassTime, formatKhmerDateWithDay } from '@/lib/schedule';
import { ClassNotice, ClassNoticeKind } from '@/types';

interface Props {
  courseId?: string; // fixed course (attendance page); otherwise the staff member picks one
}

const inputClass = 'mt-1 w-full p-2.5 rounded-xl border border-slate-300 text-sm font-normal focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white';

// Notify a class's students that they have class on a day, or that there is a break
export default function ClassNoticesManager({ courseId: fixedCourseId }: Props) {
  const { currentUser, showNotification } = useApp();
  const isAdmin = currentUser?.role === 'admin';
  const [courses, setCourses] = useState<{ id: string; title: string }[]>([]);
  const [notices, setNotices] = useState<ClassNotice[]>([]);
  const [courseId, setCourseId] = useState(fixedCourseId || '');
  const [kind, setKind] = useState<ClassNoticeKind>('break');
  const [date, setDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  // Remounts the date pickers to clear them after sending
  const [formKey, setFormKey] = useState(0);

  useEffect(() => {
    Promise.all([fetch('/api/class-notices').then(r => r.json()), fixedCourseId ? null : fetch('/api/classes').then(r => r.json())])
      .then(([noticeData, classData]) => {
        if (noticeData.success) setNotices(noticeData.notices);
        if (classData?.success) {
          setCourses(classData.courses);
          if (classData.courses[0]) setCourseId(prev => prev || classData.courses[0].id);
        }
      })
      .catch(err => console.error(err));
  }, [fixedCourseId]);

  const shown = fixedCourseId ? notices.filter(n => n.courseId === fixedCourseId) : notices;

  const send = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!courseId) return setError('សូមជ្រើសរើសវគ្គ');
    const lastDay = kind === 'break' ? endDate : '';
    if (!date || date === INCOMPLETE_DATE || lastDay === INCOMPLETE_DATE) return setError('សូមជ្រើសរើស ថ្ងៃ ខែ និងឆ្នាំ ឱ្យគ្រប់');
    if (lastDay && lastDay < date) return setError('ថ្ងៃបញ្ចប់ត្រូវនៅក្រោយថ្ងៃចាប់ផ្តើម');
    if (kind === 'class' && startTime && endTime && endTime <= startTime) return setError('ម៉ោងចប់ត្រូវនៅក្រោយម៉ោងចាប់ផ្តើម');

    setSending(true);
    try {
      const res = await fetch('/api/class-notices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ courseId, kind, date, endDate: lastDay, startTime, endTime, message })
      });
      const data = await res.json();
      if (!data.success) {
        setError(data.error || 'ផ្ញើមិនបានទេ');
        return;
      }
      setNotices(prev => [data.notice, ...prev]);
      setDate('');
      setEndDate('');
      setMessage('');
      setFormKey(k => k + 1);
      showNotification(`បានផ្ញើសេចក្តីជូនដំណឹងទៅសិស្ស ${data.notice.recipientCount} នាក់`);
    } catch (err) {
      console.error(err);
      setError('មិនអាចភ្ជាប់ទៅម៉ាស៊ីនមេបានទេ');
    } finally {
      setSending(false);
    }
  };

  const remove = async (notice: ClassNotice) => {
    if (!confirm('លុបសេចក្តីជូនដំណឹងនេះចេញពីបញ្ជី? (សារដែលសិស្សបានទទួលរួចនៅតែមាន)')) return;
    try {
      const data = await (await fetch(`/api/class-notices/${notice.id}`, { method: 'DELETE' })).json();
      if (!data.success) return showNotification(data.error || 'លុបមិនបានទេ', 'warning');
      setNotices(prev => prev.filter(n => n.id !== notice.id));
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 font-siemreap">
      <form onSubmit={send} className="lg:col-span-3 space-y-4 text-xs font-semibold text-slate-600">
        <div>
          <h2 className="font-moul text-base text-slate-900 leading-relaxed">ជូនដំណឹងដល់សិស្ស៖ ចូលរៀន ឬ ឈប់សម្រាក</h2>
          <p className="text-[11px] font-normal text-slate-400">សិស្សទាំងអស់ក្នុងវគ្គនឹងទទួលបានសារក្នុងប្រអប់សារលើគេហទំព័រ និងតាម Telegram (បើបានភ្ជាប់)។</p>
        </div>

        <div className="grid grid-cols-2 gap-3" role="radiogroup" aria-label="ប្រភេទសេចក្តីជូនដំណឹង">
          {([
            { value: 'class', label: 'ចូលរៀន', hint: 'មានការសិក្សានៅថ្ងៃនេះ', icon: BookOpen, on: 'border-emerald-600 bg-emerald-50 text-emerald-800' },
            { value: 'break', label: 'ឈប់សម្រាក', hint: 'គ្មានការសិក្សា', icon: Palmtree, on: 'border-amber-500 bg-amber-50 text-amber-800' }
          ] as const).map(opt => (
            <button
              key={opt.value}
              type="button"
              role="radio"
              aria-checked={kind === opt.value}
              onClick={() => setKind(opt.value)}
              className={`p-3 rounded-2xl border-2 text-left flex items-center gap-3 transition ${kind === opt.value ? opt.on : 'border-slate-200 bg-white text-slate-500 hover:border-slate-300'}`}
            >
              <opt.icon className="w-6 h-6 shrink-0" />
              <span>
                <span className="block text-sm font-bold">{opt.label}</span>
                <span className="block text-[11px] font-normal opacity-80">{opt.hint}</span>
              </span>
            </button>
          ))}
        </div>

        {!fixedCourseId && (
          <label className="block">
            វគ្គសិក្សា *
            <select required value={courseId} onChange={e => setCourseId(e.target.value)} className={inputClass}>
              {isAdmin && <option value="all">— គ្រប់វគ្គសិក្សាទាំងអស់ —</option>}
              {courses.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
            </select>
          </label>
        )}

        <div key={formKey} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <DatePartsInput label={kind === 'class' ? 'ថ្ងៃសិក្សា *' : 'ឈប់សម្រាកពីថ្ងៃ *'} value={date} onChange={setDate} />
          {kind === 'break' && (
            <DatePartsInput label="ដល់ថ្ងៃ" value={endDate} onChange={setEndDate} hint="ទុកទទេ បើសម្រាកតែមួយថ្ងៃ" />
          )}
        </div>

        {kind === 'class' && (
          <div className="grid grid-cols-2 gap-4">
            <label className="block">
              ម៉ោងចាប់ផ្តើម
              <input type="time" value={startTime} onChange={e => setStartTime(e.target.value)} className={inputClass} />
            </label>
            <label className="block">
              ម៉ោងចប់
              <input type="time" value={endTime} onChange={e => setEndTime(e.target.value)} className={inputClass} />
            </label>
          </div>
        )}

        <label className="block">
          សារបន្ថែម
          <textarea
            value={message}
            onChange={e => setMessage(e.target.value)}
            rows={3}
            maxLength={1000}
            placeholder={kind === 'class' ? 'ឧ. សូមយកកុំព្យូទ័រយួរដៃមកជាមួយ' : 'ឧ. ឈប់សម្រាកថ្ងៃបុណ្យអុំទូក ចូលរៀនវិញថ្ងៃច័ន្ទ'}
            className={inputClass}
          />
        </label>

        {error && <div role="alert" className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 font-normal">{error}</div>}

        <button type="submit" disabled={sending} className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold shadow flex items-center gap-2 disabled:opacity-50">
          <Send className="w-4 h-4" /> {sending ? 'កំពុងផ្ញើ...' : 'ផ្ញើទៅសិស្ស'}
        </button>
      </form>

      <div className="lg:col-span-2 space-y-3">
        <h3 className="text-sm font-bold text-slate-800">សេចក្តីជូនដំណឹងបានផ្ញើ</h3>
        {shown.length === 0 && <p className="text-xs text-slate-400">មិនទាន់មានសេចក្តីជូនដំណឹងនៅឡើយ។</p>}
        <ul className="space-y-2 max-h-[520px] overflow-y-auto pr-1">
          {shown.map(n => (
            <li key={n.id} className={`p-3 rounded-2xl border text-xs ${n.kind === 'class' ? 'border-emerald-200 bg-emerald-50/50' : 'border-amber-200 bg-amber-50/50'}`}>
              <div className="flex items-start justify-between gap-2">
                <div className="space-y-0.5 min-w-0">
                  <div className={`font-bold ${n.kind === 'class' ? 'text-emerald-800' : 'text-amber-800'}`}>
                    {n.kind === 'class' ? '📚 ចូលរៀន' : '🌴 ឈប់សម្រាក'}
                  </div>
                  <div className="text-slate-700">
                    {formatKhmerDateWithDay(n.date)}{n.endDate && ` → ${formatKhmerDateWithDay(n.endDate)}`}
                    {n.startTime && ` • ${formatClassTime(n.startTime, n.endTime)}`}
                  </div>
                  {!fixedCourseId && <div className="text-slate-500 truncate">{n.courseTitle}</div>}
                  {n.message && <p className="text-slate-500 whitespace-pre-line">{n.message}</p>}
                  <div className="text-[11px] text-slate-400 flex items-center gap-1">
                    <Users className="w-3 h-3" /> {n.recipientCount} នាក់ • {n.createdBy}
                  </div>
                </div>
                <button onClick={() => remove(n)} className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg shrink-0" aria-label="លុប">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
