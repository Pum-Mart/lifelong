'use client';

import React, { Suspense, useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { Award, BookOpenCheck, CalendarCheck, ChevronDown, ClipboardCheck, GraduationCap, Hourglass, Lock, PencilLine } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import LoginRequired from '@/components/LoginRequired';
import QuizRunner from '@/components/QuizRunner';
import { PublicQuestion, Standing } from '@/types';
import { gradeLabel } from '@/lib/grades';
import RetakeLetter from '@/components/RetakeLetter';

const khmer = (n: number) => String(n).replace(/\d/g, d => '០១២៣៤៥៦៧៨៩'[Number(d)]);

type CertificateState =
  | { state: 'incomplete' }
  | { state: 'retry'; total: number }
  | { state: 'pending'; requestId: string }
  | { state: 'rejected'; note?: string }
  | { state: 'issued'; certificateId: string };

interface Data {
  course: { id: string; slug: string; title: string; price: number };
  standing: Standing;
  certificate: CertificateState;
  preTest: PublicQuestion[];
  exam: PublicQuestion[];
  examAttempts: number;
  examAllowance: { round: number; used: number; left: number; perRound: number; pendingRequest: { round: number; createdAt: string } | null; lastRejected: { round: number; reviewNote?: string; reviewedBy?: string } | null };
  homework: { lessonId: string; title: string; questions: PublicQuestion[]; best: number | null }[];
}

export default function AssessmentsPage() {
  return (
    <Suspense fallback={<div className="py-24 text-center text-sm text-slate-400">កំពុងផ្ទុក...</div>}>
      <AssessmentsContent />
    </Suspense>
  );
}

function AssessmentsContent() {
  const params = useParams();
  const slug = params?.slug as string;
  const { currentUser, authReady } = useApp();
  const [data, setData] = useState<Data | null>(null);
  const [error, setError] = useState<{ message: string; notEnrolled?: boolean } | null>(null);
  const [open, setOpen] = useState<string | null>(null);

  const load = useCallback(async () => {
    const res = await fetch(`/api/assessments/${slug}`);
    const json = await res.json();
    if (json.success) {
      setData(json);
      setError(null);
    } else {
      setError({ message: json.error || 'មិនអាចផ្ទុកបានទេ', notEnrolled: json.notEnrolled });
    }
  }, [slug]);

  const userId = currentUser?.id;
  useEffect(() => {
    if (userId) load().catch(err => console.error(err));
  }, [userId, load]);

  if (!authReady) return <div className="py-24 text-center text-sm text-slate-400">កំពុងផ្ទុក...</div>;
  if (!currentUser) return <LoginRequired message="សូមចូលគណនី ដើម្បីធ្វើតេស្ត កិច្ចការផ្ទះ និងប្រឡង" />;
  if (error) {
    return (
      <div className="max-w-md mx-auto py-24 px-4 text-center space-y-4 font-siemreap">
        <Lock className="w-10 h-10 text-amber-600 mx-auto" />
        <p className="text-sm text-slate-600">{error.message}</p>
        <Link href={`/courses/${slug}`} className="inline-block px-5 py-2.5 rounded-xl bg-emerald-600 text-white text-sm font-bold">ទៅទំព័រវគ្គសិក្សា</Link>
      </div>
    );
  }
  if (!data) return <div className="py-24 text-center text-sm text-slate-400">កំពុងផ្ទុក...</div>;

  const { standing: s, certificate: cert } = data;
  const paid = s.scheme === 'paid';
  const toggle = (key: string) => setOpen(o => (o === key ? null : key));
  const onSubmitted = () => load().catch(err => console.error(err));

  const steps = [
    { key: 'pretest', icon: ClipboardCheck, label: 'តេស្តមុនចូលរៀន', weight: s.weights.test, done: !s.preTest.required || s.preTest.done, value: s.preTest.score },
    { key: 'homework', icon: PencilLine, label: 'លំហាត់ ឬកិច្ចការផ្ទះ', weight: s.weights.exercise, done: s.homework.lessonsDone === s.homework.lessonsTotal, value: s.homework.score, extra: `${s.homework.lessonsDone}/${s.homework.lessonsTotal} មេរៀន` },
    ...(paid ? [{ key: 'attendance', icon: CalendarCheck, label: 'វត្តមាន', weight: s.weights.attendance, done: true, value: s.attendance.pct, extra: s.attendance.source === 'class' ? 'តាមបញ្ជីវត្តមានថ្នាក់' : 'តាមមេរៀនដែលបានបញ្ចប់' }] : []),
    { key: 'exam', icon: GraduationCap, label: 'ប្រឡង', weight: s.weights.exam, done: s.exam.done, value: s.exam.score }
  ];

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10 space-y-6 font-siemreap">
      <div className="space-y-2">
        <div className="flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-md">
            <BookOpenCheck className="w-3.5 h-3.5" /> តេស្ត កិច្ចការផ្ទះ និងប្រឡង
          </span>
          <span className={`text-xs font-bold px-2.5 py-1 rounded-md ${paid ? 'bg-amber-100 text-amber-800' : 'bg-sky-100 text-sky-800'}`}>
            {paid ? 'អ្នកសិក្សាបង់ថ្លៃ' : 'អ្នកសិក្សាឥតគិតថ្លៃ'}
          </span>
        </div>
        <h1 className="font-moul text-xl sm:text-2xl text-slate-900 leading-relaxed">{data.course.title}</h1>
        <p className="text-xs text-slate-500 leading-relaxed">
          {paid
            ? 'លក្ខខណ្ឌ៖ តេស្តមុនចូលរៀន • លំហាត់/កិច្ចការផ្ទះ • វត្តមាន • ប្រឡង។ ពេលបំពេញគ្រប់ វិញ្ញាបនបត្រនឹងចេញជូនបន្ទាប់ពីប្រធានមជ្ឈមណ្ឌល ឬគណៈកម្មការអនុម័ត (ពិន្ទុមិនបង្ហាញលើវិញ្ញាបនបត្រ)។'
            : `លក្ខខណ្ឌ៖ តេស្តមុនចូលរៀន • លំហាត់/កិច្ចការផ្ទះ • ប្រឡង។ ពិន្ទុ ${s.passScore}/100 ឡើងទៅ (កម្រិត «ល្អ») ទើបទទួលបានវិញ្ញាបនបត្រ ក្រោយការអនុម័តពីប្រធានមជ្ឈមណ្ឌល ឬគណៈកម្មការ។`}
        </p>
      </div>

      {/* Certificate status */}
      {cert.state === 'issued' && (
        <div className="p-5 rounded-3xl bg-gradient-to-r from-emerald-500 via-teal-500 to-amber-400 text-white shadow-lg flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-3"><Award className="w-8 h-8" /><div><div className="font-moul leading-relaxed">សូមអបអរសាទរ!</div><div className="text-sm">វិញ្ញាបនបត្ររបស់អ្នករួចរាល់ហើយ</div></div></div>
          <Link href={`/certificate/${cert.certificateId}`} className="px-5 py-2.5 rounded-xl bg-white text-emerald-800 font-bold text-sm">មើលវិញ្ញាបនបត្រ →</Link>
        </div>
      )}
      {cert.state === 'pending' && (
        <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-sm text-amber-900 flex items-center gap-2">
          <Hourglass className="w-5 h-5 shrink-0" /> អ្នកបានបំពេញគ្រប់លក្ខខណ្ឌ។ កំពុងរង់ចាំប្រធានមជ្ឈមណ្ឌល ឬគណៈកម្មការអនុម័ត ហើយវិញ្ញាបនបត្រនឹងចេញជូនដោយស្វ័យប្រវត្តិ។
        </div>
      )}
      {cert.state === 'retry' && (
        <div className="p-4 rounded-2xl bg-red-50 border border-red-200 text-sm text-red-800 space-y-1">
          <div className="font-bold">ពិន្ទុ {cert.total}/100 — កម្រិត «{gradeLabel(cert.total)}» មិនទាន់គ្រប់លក្ខខណ្ឌទទួលវិញ្ញាបនបត្រ</div>
          <div>សូម {currentUser.name} ព្យាយាមរៀនម្តងទៀត ដោយបានលើស {s.passScore} ពិន្ទុ ដើម្បីបានទទួលវិញ្ញាបនបត្រនេះ។ អ្នកអាចធ្វើកិច្ចការផ្ទះ និងប្រឡងម្តងទៀតបាន។</div>
        </div>
      )}
      {cert.state === 'rejected' && (
        <div className="p-4 rounded-2xl bg-red-50 border border-red-200 text-sm text-red-800">
          សំណើវិញ្ញាបនបត្រត្រូវបានបង្វិលមកវិញ{cert.note ? `៖ ${cert.note}` : ''}។ សូមធ្វើប្រឡងម្តងទៀត។
        </div>
      )}

      {/* Score overview */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-5 space-y-4">
        <div className="flex items-center justify-between gap-3">
          <h2 className="font-bold text-slate-900">ពិន្ទុរបស់អ្នក</h2>
          <div className="text-right">
            <div className="text-2xl font-black text-emerald-700">{s.total}<span className="text-sm text-slate-400">/100</span></div>
            <div className="text-[11px] text-slate-500">{gradeLabel(s.total)}{!s.complete && ' • មិនទាន់បំពេញគ្រប់'}</div>
          </div>
        </div>
        <div className={`grid grid-cols-2 ${paid ? 'sm:grid-cols-4' : 'sm:grid-cols-3'} gap-2`}>
          {steps.map(step => (
            <div key={step.key} className={`p-3 rounded-xl border text-center ${step.done ? 'border-emerald-200 bg-emerald-50' : 'border-slate-200 bg-slate-50'}`}>
              <step.icon className={`w-5 h-5 mx-auto ${step.done ? 'text-emerald-600' : 'text-slate-400'}`} />
              <div className="text-[11px] text-slate-600 mt-1">{step.label} ({step.weight}%)</div>
              <div className="text-lg font-black text-slate-900">{step.value === null ? '—' : `${step.value}%`}</div>
              {'extra' in step && step.extra && <div className="text-[10px] text-slate-500">{step.extra}</div>}
            </div>
          ))}
        </div>
      </div>

      {/* 1. Pre-test */}
      {s.preTest.required && (
        <Section title="១. តេស្តមុនចូលរៀន" subtitle={s.preTest.done ? `បានធ្វើរួច • ${s.preTest.score}%` : `${data.preTest.length} សំណួរ • ធ្វើបានតែម្តង`} done={s.preTest.done} open={open === 'pretest'} onToggle={() => toggle('pretest')}>
          {s.preTest.done ? (
            <p className="text-sm text-slate-600">អ្នកបានធ្វើតេស្តមុនចូលរៀនរួចហើយ ({s.preTest.score}%)។</p>
          ) : (
            <QuizRunner courseId={data.course.id} kind="pretest" questions={data.preTest} allowRetake={false} onSubmitted={onSubmitted} />
          )}
        </Section>
      )}

      {/* 2. Homework */}
      <Section title="២. លំហាត់ ឬកិច្ចការផ្ទះ" subtitle={`${s.homework.lessonsDone}/${s.homework.lessonsTotal} មេរៀន • អាចធ្វើម្តងទៀតបាន (រាប់ពិន្ទុខ្ពស់បំផុត)`} done={s.homework.lessonsDone === s.homework.lessonsTotal} open={open === 'homework'} onToggle={() => toggle('homework')}>
        <div className="space-y-3">
          {data.homework.map(h => (
            <div key={h.lessonId} className="border border-slate-200 rounded-2xl">
              <button onClick={() => toggle(`hw-${h.lessonId}`)} className="w-full p-4 flex items-center justify-between gap-3 text-left" aria-expanded={open === `hw-${h.lessonId}`}>
                <span className="text-sm font-semibold text-slate-900">{h.title}</span>
                <span className={`text-xs font-bold shrink-0 ${h.best === null ? 'text-slate-400' : 'text-emerald-700'}`}>{h.best === null ? 'មិនទាន់ធ្វើ' : `${h.best}%`}</span>
              </button>
              {open === `hw-${h.lessonId}` && (
                <div className="px-4 pb-4">
                  <QuizRunner key={h.lessonId} courseId={data.course.id} kind="homework" lessonId={h.lessonId} questions={h.questions} onSubmitted={onSubmitted} />
                </div>
              )}
            </div>
          ))}
        </div>
      </Section>

      {/* 3. Attendance (paid) */}
      {paid && (
        <div className="bg-white rounded-3xl border border-slate-200 p-5 text-sm text-slate-600 flex items-center gap-3">
          <CalendarCheck className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>
            <strong className="text-slate-900">៣. វត្តមាន៖ {s.attendance.pct ?? 0}%</strong> —{' '}
            {s.attendance.source === 'class' ? 'គិតដោយស្វ័យប្រវត្តិពីបញ្ជីវត្តមានរបស់គ្រូ។' : 'គិតដោយស្វ័យប្រវត្តិពីមេរៀនដែលអ្នកបានបញ្ចប់។'}
          </span>
        </div>
      )}

      {/* Exam */}
      <Section
        title={`${paid ? '៤' : '៣'}. ប្រឡង`}
        subtitle={`ប្រឡងលើកទី ${khmer(data.examAllowance.round)} • នៅសល់ ${data.examAllowance.left}/${data.examAllowance.perRound} ដង${s.exam.done ? ` • ពិន្ទុខ្ពស់បំផុត ${s.exam.score}%${s.exam.source === 'teacher' ? ' (គ្រូបញ្ចូល)' : ''}` : ''}`}
        done={s.exam.done}
        open={open === 'exam'}
        onToggle={() => toggle('exam')}
      >
        {cert.state === 'issued' || cert.state === 'pending' ? (
          <p className="text-sm text-slate-600">អ្នកបានប្រឡងរួចហើយ ({s.exam.score}%)។</p>
        ) : (
          <>
            {(s.preTest.required && !s.preTest.done) || s.homework.lessonsDone < s.homework.lessonsTotal ? (
              <p className="mb-3 p-3 rounded-xl bg-amber-50 text-xs text-amber-900">ណែនាំ៖ សូមបញ្ចប់តេស្តមុនចូលរៀន និងកិច្ចការផ្ទះទាំងអស់ មុនពេលប្រឡង។</p>
            ) : null}
            {data.examAllowance.left > 0 ? (
              <QuizRunner
                key={`exam-${data.examAttempts}`}
                courseId={data.course.id}
                kind="exam"
                questions={data.exam}
                allowRetake={data.examAllowance.left > 1}
                submitLabel="បញ្ជូនការប្រឡង"
                onSubmitted={onSubmitted}
              />
            ) : (
              <RetakeLetter
                courseId={data.course.id}
                courseTitle={data.course.title}
                learnerName={currentUser.name}
                nextRound={data.examAllowance.round + 1}
                pending={data.examAllowance.pendingRequest}
                rejected={data.examAllowance.lastRejected}
                onSent={onSubmitted}
              />
            )}
          </>
        )}
      </Section>

      <div className="text-center">
        <Link href={`/learn/${data.course.slug}`} className="text-sm font-bold text-emerald-700 hover:underline">← ត្រឡប់ទៅមេរៀន</Link>
      </div>
    </div>
  );
}

function Section({ title, subtitle, done, open, onToggle, children }: { title: string; subtitle: string; done: boolean; open: boolean; onToggle: () => void; children: React.ReactNode }) {
  return (
    <section className={`bg-white rounded-3xl border shadow-sm ${done ? 'border-emerald-200' : 'border-slate-200'}`}>
      <button onClick={onToggle} className="w-full p-5 flex items-center justify-between gap-3 text-left" aria-expanded={open}>
        <div>
          <h2 className="font-bold text-slate-900 flex items-center gap-2">{done && <span className="text-emerald-600">✓</span>} {title}</h2>
          <p className="text-xs text-slate-500">{subtitle}</p>
        </div>
        <ChevronDown className={`w-5 h-5 text-slate-400 transition ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && <div className="px-5 pb-5">{children}</div>}
    </section>
  );
}
