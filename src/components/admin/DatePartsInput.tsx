'use client';

import React, { useState } from 'react';
import { KHMER_MONTHS, daysInMonth } from '@/lib/schedule';

export const INCOMPLETE_DATE = 'incomplete';

interface Props {
  label: string;
  value: string; // 'YYYY-MM-DD' or ''
  onChange: (value: string) => void; // 'YYYY-MM-DD', '' when cleared, INCOMPLETE_DATE when partly chosen
  hint?: string;
}

const selectClass = 'w-full p-2.5 rounded-xl border border-slate-300 text-sm font-normal focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white';

// Separate day / month / year pickers with Khmer month names
export default function DatePartsInput({ label, value, onChange, hint }: Props) {
  const [initY, initM, initD] = /^\d{4}-\d{2}-\d{2}$/.test(value) ? value.split('-').map(Number) : [0, 0, 0];
  const [day, setDay] = useState(initD);
  const [month, setMonth] = useState(initM);
  const [year, setYear] = useState(initY);

  const thisYear = new Date().getFullYear();
  const years = Array.from({ length: 7 }, (_, i) => thisYear - 1 + i);
  if (initY && !years.includes(initY)) years.unshift(initY);
  const maxDay = month ? daysInMonth(year || 2024, month) : 31; // 2024: leap year allows 29 Feb until a year is picked

  const update = (d: number, m: number, y: number) => {
    // 31 March → February becomes the last day of February
    if (d && m) d = Math.min(d, daysInMonth(y || 2024, m));
    setDay(d);
    setMonth(m);
    setYear(y);
    if (!d && !m && !y) onChange('');
    else if (d && m && y) onChange(`${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`);
    else onChange(INCOMPLETE_DATE);
  };

  return (
    <fieldset className="block">
      <legend>{label}</legend>
      <div className="mt-1 grid grid-cols-[1fr_1.6fr_1.2fr] gap-2">
        <select aria-label={`${label} — ថ្ងៃ`} value={day} onChange={e => update(Number(e.target.value), month, year)} className={selectClass}>
          <option value={0}>ថ្ងៃ</option>
          {Array.from({ length: maxDay }, (_, i) => i + 1).map(d => <option key={d} value={d}>{d}</option>)}
        </select>
        <select aria-label={`${label} — ខែ`} value={month} onChange={e => update(day, Number(e.target.value), year)} className={selectClass}>
          <option value={0}>ខែ</option>
          {KHMER_MONTHS.map((name, i) => <option key={name} value={i + 1}>{name}</option>)}
        </select>
        <select aria-label={`${label} — ឆ្នាំ`} value={year} onChange={e => update(day, month, Number(e.target.value))} className={selectClass}>
          <option value={0}>ឆ្នាំ</option>
          {years.map(y => <option key={y} value={y}>{y}</option>)}
        </select>
      </div>
      {(day || month || year) ? (
        <button type="button" onClick={() => update(0, 0, 0)} className="mt-1 text-[11px] font-normal text-slate-400 hover:text-red-600 underline">
          លុបកាលបរិច្ឆេទ
        </button>
      ) : (
        hint && <span className="block mt-1 text-[11px] font-normal text-slate-400">{hint}</span>
      )}
    </fieldset>
  );
}
