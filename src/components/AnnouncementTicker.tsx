'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Megaphone, X } from 'lucide-react';
import { TickerMessage } from '@/types';

// Bottom-of-screen scrolling announcement bar; messages are managed at /admin/content.
// The text is rendered twice so the -50% translate loops seamlessly.
export default function AnnouncementTicker() {
  const [visible, setVisible] = useState(true);
  const [messages, setMessages] = useState<TickerMessage[]>([]);

  useEffect(() => {
    fetch('/api/content/ticker')
      .then(res => res.json())
      .then(data => {
        if (data.success) setMessages(data.messages);
      })
      .catch(err => console.error(err));
  }, []);

  if (!visible || messages.length === 0) return null;

  const items = messages.map(m => (
    <Link key={m.id} href={m.href || '/announcements'} className="px-8 hover:text-amber-300" tabIndex={-1}>
      {m.text}
    </Link>
  ));

  return (
    // The footer's pb-12 matches this bar's h-12, so it never covers footer content.
    <>
      <div className="no-print fixed bottom-0 inset-x-0 z-40 h-12 flex items-stretch bg-emerald-800 text-white shadow-[0_-4px_16px_rgba(0,0,0,0.15)] font-siemreap">
        <div className="shrink-0 flex items-center gap-1.5 px-3 sm:px-4 bg-amber-500 text-slate-950 font-bold text-xs sm:text-sm">
          <Megaphone className="w-4 h-4" />
          <span className="hidden sm:inline">ព័ត៌មានថ្មី</span>
        </div>

        <div className="ticker-viewport flex-1 overflow-hidden flex items-center" aria-label={messages.map(m => m.text).join(' • ')}>
          <div className="ticker-track flex whitespace-nowrap text-xs sm:text-sm" aria-hidden="true">
            <div className="flex">{items}</div>
            <div className="flex">{items}</div>
          </div>
        </div>

        <button
          onClick={() => setVisible(false)}
          className="shrink-0 px-3 hover:bg-emerald-900 transition"
          aria-label="បិទ"
          title="បិទ"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </>
  );
}
