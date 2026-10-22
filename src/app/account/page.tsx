'use client';

import React, { useState } from 'react';
import { BadgePercent, KeyRound, LogOut, Send, ShieldCheck, UserRound } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import LoginRequired from '@/components/LoginRequired';
import { MEMBER_DISCOUNT_PERCENT } from '@/lib/payment';

const inputClass = 'mt-1 w-full p-2.5 rounded-xl border border-slate-300 text-sm font-normal focus:outline-none focus:ring-2 focus:ring-emerald-500';

export default function AccountPage() {
  const { currentUser, authReady, setCurrentUser, logout, showNotification } = useApp();
  const [name, setName] = useState<string | null>(null);
  const [savingName, setSavingName] = useState(false);
  const [savingMembership, setSavingMembership] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [passwordMessage, setPasswordMessage] = useState<{ ok: boolean; text: string } | null>(null);

  if (!authReady) return <div className="py-24 text-center text-sm text-slate-400">កំពុងផ្ទុក...</div>;
  if (!currentUser) return <LoginRequired />;

  const displayName = name ?? currentUser.name;

  const patchMe = async (body: Record<string, unknown>) => {
    const res = await fetch('/api/auth/me', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
    const data = await res.json();
    if (data.success && data.user) setCurrentUser(data.user);
    return data;
  };

  const saveName = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingName(true);
    const data = await patchMe({ name: displayName });
    setSavingName(false);
    showNotification(data.success ? 'បានរក្សាទុកឈ្មោះ' : data.error || 'រក្សាទុកមិនបានទេ', data.success ? 'success' : 'warning');
    if (data.success) setName(null);
  };

  const toggleMembership = async () => {
    setSavingMembership(true);
    const data = await patchMe({ isMember: !currentUser.isMember });
    setSavingMembership(false);
    if (data.success) {
      showNotification(data.user.isMember ? `អ្នកជាសមាជិកហើយ! ទទួលបានការបញ្ចុះតម្លៃ ${MEMBER_DISCOUNT_PERCENT}%` : 'បានឈប់ជាសមាជិក', 'info');
    }
  };

  const refreshUser = async () => {
    const data = await (await fetch('/api/auth/me')).json();
    if (data.user) setCurrentUser(data.user);
    showNotification(data.user?.telegramLinked ? 'បានភ្ជាប់ Telegram ហើយ ✅' : 'មិនទាន់ភ្ជាប់ — សូមចុច Start ក្នុង Telegram', data.user?.telegramLinked ? 'success' : 'info');
  };

  const linkTelegram = async () => {
    const data = await (await fetch('/api/auth/telegram-link', { method: 'POST' })).json();
    if (data.success) window.open(data.url, '_blank', 'noopener');
  };

  const unlinkTelegram = async () => {
    if (!confirm('ផ្តាច់ Telegram ពីគណនីនេះ?')) return;
    await fetch('/api/auth/telegram-link', { method: 'DELETE' });
    const data = await (await fetch('/api/auth/me')).json();
    if (data.user) setCurrentUser(data.user);
  };

  const changePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordMessage(null);
    const res = await fetch('/api/auth/password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ currentPassword, newPassword })
    });
    const data = await res.json();
    if (data.success) {
      setCurrentPassword('');
      setNewPassword('');
      setPasswordMessage({ ok: true, text: 'បានប្តូរពាក្យសម្ងាត់។ ឧបករណ៍ផ្សេងទៀតត្រូវបានចាកចេញ។' });
    } else {
      setPasswordMessage({ ok: false, text: data.error || 'ប្តូរពាក្យសម្ងាត់មិនបានទេ' });
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-12 space-y-6 font-siemreap">
      <div className="bg-gradient-to-r from-emerald-900 via-slate-900 to-indigo-950 rounded-3xl p-6 sm:p-8 text-white flex flex-col sm:flex-row items-center gap-5 shadow-xl">
        <div className="w-16 h-16 rounded-2xl bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center text-2xl font-black text-emerald-300">
          {currentUser.name.trim().charAt(0).toUpperCase()}
        </div>
        <div className="flex-1 text-center sm:text-left space-y-1">
          <h1 className="text-xl sm:text-2xl font-extrabold">{currentUser.name}</h1>
          <p className="text-xs text-slate-300">{currentUser.email}</p>
          <div className="flex flex-wrap gap-2 justify-center sm:justify-start pt-1">
            {currentUser.role === 'admin' && (
              <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-amber-400 text-slate-900">
                <ShieldCheck className="w-3.5 h-3.5" /> {currentUser.isOwner ? 'ម្ចាស់ / Admin' : 'Admin'}
              </span>
            )}
            {currentUser.role === 'teacher' && (
              <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-sky-300 text-slate-900">គ្រូបង្រៀន</span>
            )}
            {currentUser.staffTitle && (
              <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-white/90 text-slate-900">
                {currentUser.staffTitle === 'director' ? 'ប្រធានមជ្ឈមណ្ឌល' : 'គណៈកម្មការ'}
              </span>
            )}
            {currentUser.isMember && (
              <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-400 text-slate-900">
                <BadgePercent className="w-3.5 h-3.5" /> សមាជិក -{MEMBER_DISCOUNT_PERCENT}%
              </span>
            )}
          </div>
        </div>
        <button onClick={logout} className="px-4 py-2 rounded-xl border border-white/20 hover:bg-white/10 text-sm font-bold flex items-center gap-2">
          <LogOut className="w-4 h-4" /> ចាកចេញ
        </button>
      </div>

      {/* Membership */}
      <section className={`rounded-3xl border p-6 space-y-3 ${currentUser.isMember ? 'bg-emerald-50 border-emerald-200' : 'bg-white border-slate-200'}`}>
        <h2 className="flex items-center gap-2 font-bold text-slate-900"><BadgePercent className="w-5 h-5 text-emerald-600" /> សមាជិកភាព</h2>
        {currentUser.isMember ? (
          <p className="text-sm text-emerald-900 leading-relaxed">
            អ្នកជាសមាជិក{currentUser.memberSince ? ` ចាប់ពី ${new Date(currentUser.memberSince).toLocaleDateString('en-GB')}` : ''}។
            ការបញ្ចុះតម្លៃ {MEMBER_DISCOUNT_PERCENT}% ត្រូវបានគិតដោយស្វ័យប្រវត្តិ ពេលបង់ប្រាក់។
          </p>
        ) : (
          <p className="text-sm text-slate-600 leading-relaxed">ចូលជាសមាជិកដោយឥតគិតថ្លៃ ដើម្បីទទួលបានការបញ្ចុះតម្លៃ {MEMBER_DISCOUNT_PERCENT}% លើគ្រប់វគ្គសិក្សា។</p>
        )}
        <button
          onClick={toggleMembership}
          disabled={savingMembership}
          className={`px-5 py-2.5 rounded-xl font-bold text-sm disabled:opacity-50 ${currentUser.isMember ? 'border border-slate-300 text-slate-600 hover:bg-white' : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow'}`}
        >
          {currentUser.isMember ? 'ឈប់ជាសមាជិក' : `ចូលជាសមាជិក (-${MEMBER_DISCOUNT_PERCENT}%)`}
        </button>
      </section>

      {/* Telegram */}
      <section className={`rounded-3xl border p-6 space-y-3 ${currentUser.telegramLinked ? 'bg-sky-50 border-sky-200' : 'bg-white border-slate-200'}`}>
        <h2 className="flex items-center gap-2 font-bold text-slate-900"><Send className="w-5 h-5 text-sky-600" /> Telegram</h2>
        {currentUser.telegramLinked ? (
          <>
            <p className="text-sm text-sky-900 leading-relaxed">✅ បានភ្ជាប់ Telegram ហើយ។ លិខិតជូនដំណឹង និងរបាយការណ៍ប្រចាំសប្តាហ៍ នឹងផ្ញើទៅ Telegram របស់អ្នកផងដែរ។</p>
            <button onClick={unlinkTelegram} className="px-4 py-2 rounded-xl border border-slate-300 text-slate-600 text-sm font-bold hover:bg-white">ផ្តាច់ Telegram</button>
          </>
        ) : (
          <>
            <p className="text-sm text-slate-600 leading-relaxed">
              ភ្ជាប់ Telegram ដើម្បីទទួលលិខិតជូនដំណឹង (ចំណុចមិនទាន់បំពេញ របាយការណ៍ប្រចាំសប្តាហ៍ ថ្ងៃនៅសល់នៃវគ្គ) ដោយផ្ទាល់។
              ចុចប៊ូតុងខាងក្រោម រួចចុច <strong>Start</strong> ក្នុង Telegram។
            </p>
            <div className="flex flex-wrap gap-2">
              <button onClick={linkTelegram} className="px-5 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-sm font-bold flex items-center gap-2">
                <Send className="w-4 h-4" /> ភ្ជាប់ Telegram
              </button>
              <button onClick={refreshUser} className="px-4 py-2.5 rounded-xl border border-slate-300 text-slate-600 text-sm font-bold hover:bg-slate-50">ពិនិត្យម្តងទៀត</button>
            </div>
          </>
        )}
      </section>

      {/* Profile */}
      <section className="bg-white rounded-3xl border border-slate-200 p-6 space-y-3">
        <h2 className="flex items-center gap-2 font-bold text-slate-900"><UserRound className="w-5 h-5 text-emerald-600" /> ព័ត៌មានគណនី</h2>
        <form onSubmit={saveName} className="flex flex-col sm:flex-row gap-3 text-xs font-semibold text-slate-600">
          <label className="flex-1">
            ឈ្មោះ
            <input required value={displayName} onChange={e => setName(e.target.value)} className={inputClass} />
          </label>
          <button type="submit" disabled={savingName || displayName === currentUser.name} className="self-end px-5 py-2.5 rounded-xl bg-slate-900 text-white font-bold disabled:opacity-40">
            រក្សាទុក
          </button>
        </form>
      </section>

      {/* Password */}
      <section className="bg-white rounded-3xl border border-slate-200 p-6 space-y-3">
        <h2 className="flex items-center gap-2 font-bold text-slate-900"><KeyRound className="w-5 h-5 text-emerald-600" /> ប្តូរពាក្យសម្ងាត់</h2>
        <form onSubmit={changePassword} className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs font-semibold text-slate-600">
          <label>
            ពាក្យសម្ងាត់បច្ចុប្បន្ន
            <input required type="password" autoComplete="current-password" value={currentPassword} onChange={e => setCurrentPassword(e.target.value)} className={inputClass} />
          </label>
          <label>
            ពាក្យសម្ងាត់ថ្មី (យ៉ាងតិច ៨ តួ)
            <input required type="password" minLength={8} autoComplete="new-password" value={newPassword} onChange={e => setNewPassword(e.target.value)} className={inputClass} />
          </label>
          {passwordMessage && (
            <div role="status" className={`sm:col-span-2 p-3 rounded-xl font-normal ${passwordMessage.ok ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
              {passwordMessage.text}
            </div>
          )}
          <button type="submit" className="sm:col-span-2 justify-self-start px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold">
            ប្តូរពាក្យសម្ងាត់
          </button>
        </form>
      </section>
    </div>
  );
}
