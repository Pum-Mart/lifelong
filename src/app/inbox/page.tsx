'use client';

import React, { useEffect, useState } from 'react';
import { Bell, Send } from 'lucide-react';
import Link from 'next/link';
import { useApp } from '@/context/AppContext';
import LoginRequired from '@/components/LoginRequired';
import { AppNotification } from '@/types';

export default function InboxPage() {
  const { currentUser, authReady } = useApp();
  if (!authReady) return <div className="py-24 text-center text-sm text-slate-400">កំពុងផ្ទុក...</div>;
  if (!currentUser) return <LoginRequired message="សូមចូលគណនី ដើម្បីមើលលិខិតជូនដំណឹង" />;
  return <Inbox telegramLinked={currentUser.telegramLinked} />;
}

function Inbox({ telegramLinked }: { telegramLinked: boolean }) {
  const [items, setItems] = useState<AppNotification[] | null>(null);

  useEffect(() => {
    fetch('/api/notifications')
      .then(res => res.json())
      .then(data => {
        if (data.success) setItems(data.notifications);
        // Opening the inbox marks everything as read
        if (data.unread > 0) fetch('/api/notifications', { method: 'POST' }).then(() => window.dispatchEvent(new Event('llc:notifications-read')));
      })
      .catch(err => console.error(err));
  }, []);

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-12 space-y-6 font-siemreap">
      <div className="flex items-center justify-between gap-4">
        <h1 className="flex items-center gap-2 font-moul text-xl text-slate-900 leading-relaxed">
          <Bell className="w-6 h-6 text-emerald-600" /> លិខិតជូនដំណឹង
        </h1>
        {!telegramLinked && (
          <Link href="/account" className="text-xs font-bold text-sky-700 hover:underline flex items-center gap-1">
            <Send className="w-3.5 h-3.5" /> ទទួលលិខិតតាម Telegram
          </Link>
        )}
      </div>

      {items === null ? (
        <p className="text-sm text-slate-400">កំពុងផ្ទុក...</p>
      ) : items.length === 0 ? (
        <div className="p-10 rounded-3xl bg-white border border-slate-200 text-center text-sm text-slate-400">មិនទាន់មានលិខិតជូនដំណឹងទេ</div>
      ) : (
        <ul className="space-y-3">
          {items.map(n => (
            <li key={n.id} className={`p-5 rounded-2xl border bg-white ${n.readAt ? 'border-slate-200' : 'border-emerald-300 shadow-sm'}`}>
              <div className="flex items-start justify-between gap-3">
                <h2 className="font-bold text-slate-900 text-sm">{n.title}</h2>
                <time className="text-[11px] text-slate-400 shrink-0">{new Date(n.createdAt).toLocaleString('en-GB')}</time>
              </div>
              <p className="mt-2 text-sm text-slate-600 whitespace-pre-line leading-relaxed">{n.body}</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
