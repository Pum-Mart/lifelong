'use client';

import React, { useEffect, useState } from 'react';
import { CalendarCheck, ChevronDown } from 'lucide-react';
import { GradeBreakdown, StudentDayRecord, TeacherStatus } from '@/types';
import Link from 'next/link';
import { gradeLabel } from '@/lib/grades';

interface CourseGrades {
  courseId: string;
  courseTitle: string;
  endDate?: string;
  scheme: 'free' | 'paid';
  weights: { test: number; exercise: number; attendance: number; exam: number };
  grade: GradeBreakdown;
  days: {
    date: string;
    lessonTitle: string;
    teacherStatus: TeacherStatus;
    counted: boolean;
    lessonCompleted: boolean;
    hasTest: boolean;
    hasExercise: boolean;
    record: StudentDayRecord | null;
  }[];
}

const mark = (ok: boolean) => (ok ? <span className="text-emerald-600 font-bold">✓</span> : <span className="text-red-500 font-bold">✗</span>);

function Part({ label, weight, value }: { label: string; weight: number; value: number | null }) {
  return (
    <div className="p-3 rounded-xl bg-slate-50 text-center">
      <div className="text-[11px] text-slate-500">{label} ({weight}%)</div>
      <div className="text-lg font-black text-slate-900">{value === null ? '—' : `${value}%`}</div>
    </div>
  );
}

// The signed-in student's attendance, daily checklist and grades per course
export default function MyGrades() {
  const [courses, setCourses] = useState<CourseGrades[]>([]);
  const [open, setOpen] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/my-grades')
      .then(res => res.json())
      .then(data => {
        if (data.success) setCourses(data.courses);
      })
      .catch(err => console.error(err));
  }, []);

  if (courses.length === 0) return null;
  const today = new Date().toLocaleDateString('en-CA');

  return (
    <section className="space-y-4 font-siemreap">
      <h2 className="flex items-center gap-2 text-lg font-bold text-slate-900">
        <CalendarCheck className="w-5 h-5 text-emerald-600" /> វត្តមាន និងពិន្ទុ
      </h2>
      {courses.map(c => {
        const daysLeft = c.endDate ? Math.round((Date.parse(c.endDate) - Date.parse(today)) / 86400_000) : null;
        return (
          <div key={c.courseId} className="bg-white rounded-3xl border border-slate-200 shadow-sm p-5 space-y-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h3 className="font-bold text-slate-900">{c.courseTitle}</h3>
                <p className="text-xs text-slate-500">
                  វត្តមាន {c.grade.presentDays}/{c.grade.countedDays} ថ្ងៃ
                  {daysLeft !== null && daysLeft >= 0 && ` • នៅសល់ ${daysLeft} ថ្ងៃ វគ្គនឹងបញ្ចប់`}
                </p>
              </div>
              <div className="text-right">
                <div className="text-2xl font-black text-emerald-700">{c.grade.total}<span className="text-sm text-slate-400">/100</span></div>
                <div className="text-[11px] text-slate-500">{gradeLabel(c.grade.total)}</div>
                <Link href={`/assessments/${c.courseId}`} className="text-[11px] font-bold text-emerald-700 hover:underline">តេស្ត & ប្រឡង →</Link>
              </div>
            </div>

            <div className={`grid grid-cols-2 ${c.scheme === 'paid' ? 'sm:grid-cols-4' : 'sm:grid-cols-3'} gap-2`}>
              {c.scheme === 'paid' && <Part label="វត្តមាន" weight={c.weights.attendance} value={c.grade.attendancePct} />}
              <Part label="តេស្ត" weight={c.weights.test} value={c.grade.testPct} />
              <Part label="លំហាត់/កិច្ចការផ្ទះ" weight={c.weights.exercise} value={c.grade.exercisePct} />
              <Part label="ប្រឡង" weight={c.weights.exam} value={c.grade.examPct} />
            </div>

            <button
              onClick={() => setOpen(open === c.courseId ? null : c.courseId)}
              className="text-xs font-bold text-emerald-700 flex items-center gap-1"
              aria-expanded={open === c.courseId}
            >
              <ChevronDown className={`w-4 h-4 transition ${open === c.courseId ? 'rotate-180' : ''}`} /> មើលប្រចាំថ្ងៃ ({c.days.length} ថ្ងៃ)
            </button>

            {open === c.courseId && (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-200 text-slate-400">
                      <th className="pb-2 font-semibold">ថ្ងៃ / មេរៀន</th>
                      <th className="pb-2 font-semibold text-center">វត្តមាន</th>
                      <th className="pb-2 font-semibold text-center">តេស្ត</th>
                      <th className="pb-2 font-semibold text-center">លំហាត់</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {c.days.map(d => (
                      <tr key={d.date} className={d.counted ? '' : 'text-slate-400'}>
                        <td className="py-2 pr-3">
                          <div className="font-semibold">{d.date}{d.lessonCompleted && <span className="ml-1 text-emerald-600">• បានបញ្ចប់មេរៀន</span>}</div>
                          <div className="text-[11px]">{d.lessonTitle}</div>
                          {!d.counted && <div className="text-[11px] text-amber-700">គ្រូ{d.teacherStatus === 'mission' ? 'មានបេសកកម្ម' : 'អវត្តមាន'} • មិនរាប់</div>}
                        </td>
                        <td className="py-2 text-center">{d.counted ? mark(Boolean(d.record?.present)) : '—'}</td>
                        <td className="py-2 text-center">
                          {d.counted && d.hasTest ? <>{mark(Boolean(d.record?.testDone))} {d.record?.testScore !== undefined && <span className="text-slate-500">{d.record.testScore}</span>}</> : '—'}
                        </td>
                        <td className="py-2 text-center">
                          {d.counted && d.hasExercise ? <>{mark(Boolean(d.record?.exerciseDone))} {d.record?.exerciseScore !== undefined && <span className="text-slate-500">{d.record.exerciseScore}</span>}</> : '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        );
      })}
    </section>
  );
}
