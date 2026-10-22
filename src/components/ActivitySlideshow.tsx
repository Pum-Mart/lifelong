'use client';

import React, { useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight, Pause, Play, Camera } from 'lucide-react';
import { Activity } from '@/types';

const INTERVAL_MS = 5000;

// Teaching-activity photos, advancing every 5 seconds. Pauses on hover/focus and with the
// pause button.
export default function ActivitySlideshow({ activities }: { activities: Activity[] }) {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const [hovered, setHovered] = useState(false);
  const count = activities.length;

  useEffect(() => {
    if (count < 2 || paused || hovered) return;
    const timer = setInterval(() => setIndex(i => (i + 1) % count), INTERVAL_MS);
    return () => clearInterval(timer);
  }, [count, paused, hovered]);

  if (count === 0) {
    return (
      <div className="aspect-[16/7] rounded-3xl border-2 border-dashed border-slate-300 bg-slate-50 flex flex-col items-center justify-center gap-2 text-slate-400 text-sm">
        <Camera className="w-10 h-10" />
        មិនទាន់មានរូបថតសកម្មភាព
      </div>
    );
  }

  const go = (n: number) => setIndex(((n % count) + count) % count);
  const current = activities[index % count];

  return (
    <div
      className="relative rounded-3xl overflow-hidden shadow-xl bg-slate-900 group"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onFocus={() => setHovered(true)}
      onBlur={() => setHovered(false)}
      aria-roledescription="carousel"
      aria-label="សកម្មភាពបង្ហាត់បង្រៀន"
    >
      <div className="relative aspect-[16/9] sm:aspect-[16/7]">
        {activities.map((a, i) => (
          <img
            key={a.id}
            src={a.photo}
            alt={a.title}
            className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-700 motion-reduce:transition-none ${i === index % count ? 'opacity-100' : 'opacity-0'}`}
            aria-hidden={i !== index % count}
          />
        ))}
        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/95 via-black/70 to-transparent pt-16 p-5 sm:p-8 text-white [text-shadow:0_1px_3px_rgba(0,0,0,0.8)]" aria-live={paused ? 'polite' : 'off'}>
          <div className="text-[11px] sm:text-xs text-amber-300 font-bold">{new Date(current.date).toLocaleDateString('en-GB')}</div>
          <h3 className="font-moul text-base sm:text-xl leading-relaxed">{current.title}</h3>
          {current.description && <p className="text-xs sm:text-sm text-white/85 line-clamp-2 max-w-3xl">{current.description}</p>}
        </div>
      </div>

      {count > 1 && (
        <>
          <button onClick={() => go(index - 1)} className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/40 hover:bg-black/60 text-white flex items-center justify-center" aria-label="រូបមុន">
            <ChevronLeft className="w-6 h-6" />
          </button>
          <button onClick={() => go(index + 1)} className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/40 hover:bg-black/60 text-white flex items-center justify-center" aria-label="រូបបន្ទាប់">
            <ChevronRight className="w-6 h-6" />
          </button>
          <div className="absolute top-3 right-3 flex items-center gap-2">
            <button onClick={() => setPaused(p => !p)} className="w-8 h-8 rounded-full bg-black/40 hover:bg-black/60 text-white flex items-center justify-center" aria-label={paused ? 'ចាក់បន្ត' : 'ផ្អាក'}>
              {paused ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
            </button>
          </div>
          <div className="absolute bottom-3 right-4 flex gap-1.5">
            {activities.map((a, i) => (
              <button
                key={a.id}
                onClick={() => go(i)}
                className={`h-2 rounded-full transition-all ${i === index % count ? 'w-6 bg-amber-400' : 'w-2 bg-white/60 hover:bg-white'}`}
                aria-label={`រូបទី ${i + 1}`}
                aria-current={i === index % count}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
