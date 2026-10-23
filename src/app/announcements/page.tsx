import { Suspense } from 'react';
import { io } from 'next/cache';
import Link from 'next/link';
import { Megaphone, Phone, Send } from 'lucide-react';
import { getAnnouncements } from '@/lib/content';
import { runWithDatabase } from '@/lib/store';
import { CONTACT } from '@/lib/contact';
import AnnouncementBody from '@/components/AnnouncementBody';

export const metadata = { title: 'សេចក្តីជូនដំណឹង | Plllc - Lifelong Learning Center' };

export default function AnnouncementsPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-12 space-y-8 font-siemreap">
      <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-md">
        <Megaphone className="w-3.5 h-3.5" />
        <span>សេចក្តីជូនដំណឹង (Announcements)</span>
      </div>

      <Suspense fallback={<p className="text-sm text-slate-400">កំពុងផ្ទុក...</p>}>
        <List />
      </Suspense>

      <div className="p-5 rounded-2xl bg-white border border-slate-200 text-sm text-slate-700 space-y-2">
        <div className="font-bold text-slate-900">ទំនាក់ទំនង</div>
        <div className="flex items-center gap-2"><Phone className="w-4 h-4 text-emerald-600" /> {CONTACT.phones.join(' / ')}</div>
        <div className="flex items-center gap-2">
          <Send className="w-4 h-4 text-emerald-600" />
          <a href="https://t.me/lifelonglerning_bot" target="_blank" rel="noopener noreferrer" className="text-emerald-700 font-semibold hover:underline">@lifelonglerning_bot</a>
        </div>
      </div>

      <div className="text-center">
        <Link href="/" className="inline-block px-5 py-2.5 rounded-xl bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700">ត្រឡប់ទៅទំព័រដើម</Link>
      </div>
    </div>
  );
}

async function List() {
  // Announcements are edited from /admin/content, so read them per request
  await io();
  const announcements = await runWithDatabase(async () => getAnnouncements());
  if (announcements.length === 0) {
    return <p className="p-10 rounded-3xl bg-white border border-slate-200 text-center text-sm text-slate-400">មិនទាន់មានសេចក្តីជូនដំណឹងទេ</p>;
  }
  return (
    <div className="space-y-8">
      {announcements.map(a => (
        <article key={a.id} id={a.id} className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden scroll-mt-28">
          {a.image && <img src={a.image} alt="" className="w-full max-h-96 object-cover" />}
          <div className="p-6 sm:p-10 space-y-6">
            <header className="space-y-2 text-center border-b border-slate-100 pb-5">
              <h1 className="font-moul text-xl sm:text-2xl text-slate-900 leading-relaxed">សេចក្តីជូនដំណឹង</h1>
              <p className="font-moul text-base sm:text-lg text-emerald-800 leading-relaxed">{a.title}</p>
              <time className="block text-xs text-slate-400">{new Date(a.createdAt).toLocaleDateString('en-GB')}</time>
            </header>
            <AnnouncementBody text={a.body} />
          </div>
        </article>
      ))}
    </div>
  );
}
