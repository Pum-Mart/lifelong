'use client';

import React, { Suspense, useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { ClipboardList, Lock, Upload, UserRound } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { Course, Registration } from '@/types';
import RegistrationCard from '@/components/RegistrationCard';
import LoginRequired from '@/components/LoginRequired';

const inputClass = 'mt-1 w-full p-2.5 rounded-xl border border-slate-300 text-sm font-normal focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white';

export default function RegisterPage() {
  return (
    <Suspense fallback={<div className="max-w-3xl mx-auto py-24 text-center text-sm text-slate-400">កំពុងផ្ទុក...</div>}>
      <RegisterContent />
    </Suspense>
  );
}

function RegisterContent() {
  const params = useParams();
  const slug = params?.slug as string;
  const { currentUser, authReady, enrollments, pendingCourseIds, buyCourse } = useApp();
  const userId = currentUser?.id;

  const [course, setCourse] = useState<Course | null>(null);
  const [registration, setRegistration] = useState<Registration | null>(null);
  const [loading, setLoading] = useState(true);

  const loadRegistration = useCallback(async (courseId: string) => {
    if (!userId) return;
    const res = await fetch('/api/registrations');
    const data = await res.json();
    if (data.success) {
      setRegistration(data.registrations.find((r: Registration) => r.courseId === courseId) || null);
    }
  }, [userId]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`/api/courses/${slug}`);
        const data = await res.json();
        if (cancelled) return;
        if (data.success) {
          setCourse(data.course);
          await loadRegistration(data.course.id);
        }
      } catch (err) {
        console.error(err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [slug, loadRegistration]);

  const refresh = useCallback(async () => {
    if (course) await loadRegistration(course.id);
  }, [course, loadRegistration]);

  if (loading || !authReady) {
    return <div className="max-w-3xl mx-auto py-24 text-center text-sm text-slate-400">កំពុងផ្ទុក...</div>;
  }

  if (!currentUser) {
    return <LoginRequired message="សូមចូលគណនី ដើម្បីបំពេញបែបបទចុះឈ្មោះចូលរៀន" />;
  }

  if (!course) {
    return (
      <div className="max-w-3xl mx-auto py-24 px-4 text-center space-y-4">
        <h1 className="text-xl font-bold">រកមិនឃើញវគ្គសិក្សា</h1>
        <Link href="/#courses" className="inline-block px-5 py-2.5 rounded-xl bg-emerald-600 text-white text-xs font-bold">ត្រឡប់ទៅវគ្គសិក្សា</Link>
      </div>
    );
  }

  const isEnrolled = enrollments.some(e => e.courseId === course.id);

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12 space-y-8 font-siemreap">
      <div className="space-y-2">
        <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-md">
          <ClipboardList className="w-3.5 h-3.5" />
          <span>ការចុះឈ្មោះចូលរៀន</span>
        </div>
        <h1 className="font-moul text-xl sm:text-2xl text-slate-900 leading-relaxed">{course.title}</h1>
        <p className="text-xs text-slate-500">
          រយៈពេល៖ {course.duration}{course.instructor ? ` • គ្រូបង្រៀន៖ ${course.instructor.name}` : ''}
        </p>
      </div>

      {registration ? (
        <RegistrationCard registration={registration} onRefresh={refresh} />
      ) : !isEnrolled ? (
        <div className="p-8 rounded-3xl bg-white border border-slate-200 text-center space-y-4">
          <Lock className="w-10 h-10 text-amber-600 mx-auto" />
          {pendingCourseIds.includes(course.id) ? (
            <p className="text-sm text-slate-600">ការបង់ប្រាក់របស់អ្នកកំពុងរង់ចាំការផ្ទៀងផ្ទាត់។ អ្នកអាចបំពេញបែបបទបាន បន្ទាប់ពីការអនុម័ត។</p>
          ) : (
            <>
              <p className="text-sm text-slate-600">សូមបង់ប្រាក់សម្រាប់វគ្គនេះជាមុនសិន ទើបអាចបំពេញបែបបទចុះឈ្មោះបាន។</p>
              <button onClick={() => buyCourse(course)} className="px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm">
                ចុះឈ្មោះ និងបង់ប្រាក់ • ${course.price}
              </button>
            </>
          )}
        </div>
      ) : (
        <RegistrationForm course={course} defaultName={currentUser.name} onDone={setRegistration} />
      )}
    </div>
  );
}

function RegistrationForm({
  course,
  defaultName,
  onDone
}: {
  course: Course;
  defaultName: string;
  onDone: (registration: Registration) => void;
}) {
  const [fullNameKh, setFullNameKh] = useState('');
  const [fullNameEn, setFullNameEn] = useState(defaultName);
  const [gender, setGender] = useState<'ប្រុស' | 'ស្រី' | ''>('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [telegramUsername, setTelegramUsername] = useState('');
  const [photo, setPhoto] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const choosePhoto = (file: File | null) => {
    if (preview) URL.revokeObjectURL(preview);
    setPhoto(file);
    setPreview(file ? URL.createObjectURL(file) : null);
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!gender) return setError('សូមជ្រើសរើសភេទ');
    if (!photo) return setError('សូមភ្ជាប់រូបថត ៤x៦');

    const form = new FormData();
    form.append('courseId', course.id);
    form.append('fullNameKh', fullNameKh);
    form.append('fullNameEn', fullNameEn);
    form.append('gender', gender);
    form.append('dateOfBirth', dateOfBirth);
    form.append('phone', phone);
    form.append('address', address);
    form.append('telegramUsername', telegramUsername);
    form.append('photo', photo);

    setSubmitting(true);
    try {
      const res = await fetch('/api/registrations', { method: 'POST', body: form });
      const data = await res.json();
      if (!data.success) {
        setError(data.error || 'មិនអាចបញ្ជូនបែបបទបានទេ');
        return;
      }
      onDone(data.registration);
    } catch (err) {
      console.error(err);
      setError('មិនអាចភ្ជាប់ទៅម៉ាស៊ីនមេបានទេ');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={submit} className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 sm:p-8 flex flex-col sm:flex-row gap-8 text-xs font-semibold text-slate-600">
      <label className="shrink-0 w-40 mx-auto sm:mx-0 cursor-pointer space-y-2 text-center">
        <div className="w-40 aspect-[2/3] rounded-xl border-2 border-dashed border-slate-300 hover:border-emerald-400 bg-slate-50 overflow-hidden flex items-center justify-center transition">
          {preview ? <img src={preview} alt="" className="w-full h-full object-cover" /> : <UserRound className="w-14 h-14 text-slate-300" />}
        </div>
        <span className="inline-flex items-center gap-1 text-emerald-700"><Upload className="w-3.5 h-3.5" /> រូបថត ៤x៦ *</span>
        <input type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" onChange={e => choosePhoto(e.target.files?.[0] || null)} />
      </label>

      <div className="flex-1 space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <label className="block">
            ឈ្មោះ (អក្សរខ្មែរ) *
            <input required value={fullNameKh} onChange={e => setFullNameKh(e.target.value)} placeholder="ឧ. សុខ សុភា" className={inputClass} />
          </label>
          <label className="block">
            ឈ្មោះ (អក្សរឡាតាំង) *
            <input required value={fullNameEn} onChange={e => setFullNameEn(e.target.value)} placeholder="e.g. SOK SOPHEA" className={inputClass} />
          </label>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <fieldset>
            <legend>ភេទ *</legend>
            <div className="mt-1 flex gap-2">
              {(['ប្រុស', 'ស្រី'] as const).map(g => (
                <label key={g} className={`flex-1 p-2.5 rounded-xl border text-center text-sm cursor-pointer transition ${gender === g ? 'border-emerald-500 bg-emerald-50 text-emerald-800 font-bold' : 'border-slate-300 font-normal'}`}>
                  <input type="radio" name="gender" value={g} checked={gender === g} onChange={() => setGender(g)} className="sr-only" />
                  {g}
                </label>
              ))}
            </div>
          </fieldset>
          <label className="block">
            ថ្ងៃខែឆ្នាំកំណើត *
            <input required type="date" value={dateOfBirth} onChange={e => setDateOfBirth(e.target.value)} className={inputClass} />
          </label>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <label className="block">
            លេខទូរស័ព្ទ *
            <input required type="tel" inputMode="tel" value={phone} onChange={e => setPhone(e.target.value)} placeholder="012 345 678" className={inputClass} />
          </label>
          <label className="block">
            Telegram username
            <input value={telegramUsername} onChange={e => setTelegramUsername(e.target.value)} placeholder="@username" className={inputClass} />
          </label>
        </div>

        <label className="block">
          អាសយដ្ឋាន *
          <textarea required rows={2} value={address} onChange={e => setAddress(e.target.value)} placeholder="ភូមិ ឃុំ/សង្កាត់ ស្រុក/ខណ្ឌ ខេត្ត/រាជធានី" className={inputClass} />
        </label>

        {error && <div role="alert" className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 font-normal">{error}</div>}

        <button type="submit" disabled={submitting} className="w-full py-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-lg shadow-emerald-600/25 disabled:opacity-50">
          {submitting ? 'កំពុងបញ្ជូន...' : 'បញ្ជូនបែបបទ និងបង្កើតសាលាកបត្រ'}
        </button>
      </div>
    </form>
  );
}
