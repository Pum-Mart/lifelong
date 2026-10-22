'use client';

import React from 'react';
import Link from 'next/link';
import { GraduationCap, ShieldCheck, Heart, Award, Mail, Phone, MapPin, Send } from 'lucide-react';
import { CONTACT } from '@/lib/contact';

// lucide no longer ships brand icons
function Facebook({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" className={className}>
      <path d="M14 8.5V6.8c0-.8.5-1 .9-1H17V2.1L14.2 2C11 2 10.3 4.4 10.3 6v2.5H8V12h2.3v10H14V12h2.7l.4-3.5H14z" />
    </svg>
  );
}

export default function Footer() {
  // Sections live on the home page: scroll there, or go to the home page from other pages
  const scrollTo = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } else {
      window.location.href = `/#${id}`;
    }
  };

  return (
    <footer className="no-print bg-slate-950 text-slate-300 pt-16 pb-12 border-t border-emerald-900/40 font-siemreap">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 pb-12 border-b border-slate-800">
          {/* Brand & Mission */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-emerald-600 via-teal-700 to-slate-900 flex items-center justify-center text-amber-400 shadow-lg border border-amber-400/30">
                <GraduationCap className="w-7 h-7" />
              </div>
              <div>
                <span className="block text-base sm:text-lg font-bold text-white tracking-tight leading-tight uppercase">LIFELONG LEARNING CENTER</span>
                <span className="block text-xs font-semibold text-emerald-400 uppercase tracking-wider">
                  មជ្ឈមណ្ឌលសិក្សាពេញមួយជីវិត
                </span>
              </div>
            </div>

            <p className="text-xs sm:text-sm text-slate-400 leading-relaxed max-w-sm">
              ការអប់រំ និងការអភិវឌ្ឍជំនាញសម្រាប់មនុស្សគ្រប់វ័យ និងគ្រប់កាលៈទេសៈ។ យើងផ្តល់ឱកាសសិក្សាពេញមួយជីវិតប្រកបដោយបរិយាបន្ន តាមរយៈបណ្តាញមជ្ឈមណ្ឌលសិក្សាសហគមន៍ (CLC) និងប្រព័ន្ធឌីជីថលទូទាំងប្រទេសកម្ពុជា។
            </p>

            <div className="flex flex-wrap gap-4 pt-2 text-xs text-slate-400">
              <div className="flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>Accredited CEU Provider</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Award className="w-4 h-4 text-amber-400" />
                <span>UNESCO SDG 4 Aligned</span>
              </div>
            </div>
          </div>

          {/* Core Disciplines */}
          <div>
            <h4 className="text-white font-bold text-sm mb-4 font-moul">វិស័យបណ្តុះបណ្តាល</h4>
            <ul className="space-y-2.5 text-xs text-slate-400">
              <li><button onClick={() => scrollTo('courses')} className="hover:text-emerald-400 transition text-left">ជំនាញឌីជីថល (Digital Skills)</button></li>
              <li><button onClick={() => scrollTo('courses')} className="hover:text-emerald-400 transition text-left">អក្ខរកម្ម (Functional Literacy)</button></li>
              <li><button onClick={() => scrollTo('courses')} className="hover:text-emerald-400 transition text-left">កសិកម្មឆ្លាតវៃ (Agriculture)</button></li>
              <li><button onClick={() => scrollTo('courses')} className="hover:text-emerald-400 transition text-left">សហគ្រិនភាព (Entrepreneurship)</button></li>
              <li><button onClick={() => scrollTo('courses')} className="hover:text-emerald-400 transition text-left">ជំនាញវិជ្ជាជីវៈ (Vocational Skills)</button></li>
            </ul>
          </div>

          {/* Quick Menu */}
          <div>
            <h4 className="text-white font-bold text-sm mb-4 font-moul">រចនាសម្ព័ន្ធគេហទំព័រ</h4>
            <ul className="space-y-2.5 text-xs text-slate-400">
              <li><button onClick={() => scrollTo('home')} className="hover:text-emerald-400 transition text-left">ទំព័រដើម (Home)</button></li>
              <li><Link href="/about" className="hover:text-emerald-400 transition text-left">អំពី LLLc (About LLLc)</Link></li>
              <li><button onClick={() => scrollTo('courses')} className="hover:text-emerald-400 transition text-left">វគ្គសិក្សា & ការបណ្តុះបណ្តាល (Courses)</button></li>
              <li><button onClick={() => scrollTo('news')} className="hover:text-emerald-400 transition text-left">ព័ត៌មាន & សកម្មភាព (News & Activities)</button></li>
              <li><button onClick={() => scrollTo('resources')} className="hover:text-emerald-400 transition text-left">ធនធាន & បណ្ណាល័យ (Resources)</button></li>
              <li><button onClick={() => scrollTo('community')} className="hover:text-emerald-400 transition text-left">សហគមន៍ & ដៃគូ (Community)</button></li>
              <li><button onClick={() => scrollTo('contact')} className="hover:text-emerald-400 transition text-left">ទំនាក់ទំនង & ជំនួយ (Contact)</button></li>
            </ul>
          </div>

          {/* Contact & Campus */}
          <div>
            <h4 className="text-white font-bold text-sm mb-4 font-moul">ទំនាក់ទំនងមជ្ឈមណ្ឌល</h4>
            <ul className="space-y-3 text-xs text-slate-400">
              <li className="flex items-start gap-2">
                <MapPin className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span>វិថីព្រះនរោត្តម សង្កាត់ទន្លេបាសាក់ ខណ្ឌចំការមន រាជធានីភ្នំពេញ</span>
              </li>
              <li className="flex items-start gap-2">
                <Phone className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span>
                  Admin៖{' '}
                  <a href={`tel:${CONTACT.phones[0].replace(/\s/g, '')}`} className="hover:text-emerald-400">{CONTACT.phones[0]}</a>
                  {' / '}
                  <a href={`tel:${CONTACT.phones[1].replace(/\s/g, '')}`} className="hover:text-emerald-400">{CONTACT.phones[1]}</a>
                </span>
              </li>
              <li className="flex items-center gap-2">
                <Facebook className="w-4 h-4 text-emerald-400 shrink-0" />
                <a href={CONTACT.facebookUrl} target="_blank" rel="noopener noreferrer" className="hover:text-emerald-400 transition">
                  Facebook៖ {CONTACT.facebookName}
                </a>
              </li>
              <li className="flex items-center gap-2">
                <Send className="w-4 h-4 text-emerald-400 shrink-0" />
                <a href={CONTACT.telegramUrl} target="_blank" rel="noopener noreferrer" className="hover:text-emerald-400 transition">
                  Telegram៖ {CONTACT.telegramName}
                </a>
              </li>
              <li className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-emerald-400 shrink-0" />
                <a href="https://t.me/lifelonglerning_bot" target="_blank" rel="noopener noreferrer" className="hover:text-emerald-400 transition">
                  Bot៖ @lifelonglerning_bot
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="pt-8 flex flex-col sm:flex-row justify-between items-center gap-4 text-xs text-slate-500">
          <p>© 2026 Lifelong Learning Center. រក្សាសិទ្ធិគ្រប់យ៉ាង។</p>
          <div className="flex gap-6">
            <Link href="/policies#privacy" className="hover:text-slate-300">គោលការណ៍ឯកជនភាព</Link>
            <Link href="/policies#terms" className="hover:text-slate-300">លក្ខខណ្ឌប្រើប្រាស់</Link>
            <Link href="/policies#inclusion" className="hover:text-slate-300">សេចក្តីថ្លែងការណ៍បរិយាបន្ន</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
