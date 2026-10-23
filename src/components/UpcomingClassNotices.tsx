'use client';

import React, { useEffect, useState } from 'react';
import { CalendarCheck } from 'lucide-react';
import { formatClassTime, formatKhmerDateWithDay } from '@/lib/schedule';
import { ClassNotice } from '@/types';

// Student view: upcoming class days and breaks for the courses they study
export default function UpcomingClassNotices() {
  const [notices, setNotices] = useState<ClassNotice[]>([]);

  useEffect(() => {
    fetch('/api/class-notices')
      .then(res => res.json())
      .then(data => {
        if (data.success) setNotices(data.notices);
      })
      .catch(err => console.error(err));
  }, []);

  if (notices.length === 0) return null;

  return (
    <section className="bg-white rounded-3xl border border-slate-200 shadow-sm p-5 sm:p-6 space-y-3 font-siemreap">
      <h2 className="font-moul text-base text-slate-900 leading-relaxed flex items-center gap-2">
        <CalendarCheck className="w-5 h-5 text-emerald-600" /> សេចក្តីជូនដំណឹងពីថ្នាក់រៀន
      </h2>
      <ul className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {notices.map(n => (
          <li key={n.id} className={`p-4 rounded-2xl border text-sm ${n.kind === 'class' ? 'border-emerald-200 bg-emerald-50' : 'border-amber-200 bg-amber-50'}`}>
            <div className={`font-bold ${n.kind === 'class' ? 'text-emerald-800' : 'text-amber-800'}`}>
              {n.kind === 'class' ? '📚 ចូលរៀន' : '🌴 ឈប់សម្រាក'}
              <span className="font-normal text-slate-500"> • {n.courseTitle}</span>
            </div>
            <div className="text-slate-800 mt-1">
              {formatKhmerDateWithDay(n.date)}{n.endDate && ` ដល់ ${formatKhmerDateWithDay(n.endDate)}`}
            </div>
            {n.startTime && <div className="text-slate-600 text-xs">ម៉ោង {formatClassTime(n.startTime, n.endTime)}</div>}
            {n.message && <p className="text-slate-600 text-xs mt-1 whitespace-pre-line">{n.message}</p>}
          </li>
        ))}
      </ul>
    </section>
  );
}
