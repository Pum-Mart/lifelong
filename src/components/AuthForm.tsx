'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { BadgePercent, Eye, EyeOff, GraduationCap } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { MEMBER_DISCOUNT_PERCENT } from '@/lib/payment';

const inputClass = 'mt-1 w-full p-3 rounded-xl border border-slate-300 text-sm font-normal focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white';

// Only same-site paths are allowed as a post-login destination
function safeNext(next: string | null): string {
  return next && next.startsWith('/') && !next.startsWith('//') ? next : '/my-learning';
}

export default function AuthForm({ mode }: { mode: 'login' | 'signup' }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = safeNext(searchParams.get('next'));
  const { login, signup } = useApp();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [joinMembership, setJoinMembership] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    const failure = mode === 'login'
      ? await login(email, password)
      : await signup(name, email, password, joinMembership);
    setSubmitting(false);
    if (failure) {
      setError(failure);
      return;
    }
    router.push(next);
  };

  const otherHref = `${mode === 'login' ? '/signup' : '/login'}?next=${encodeURIComponent(next)}`;

  return (
    <div className="max-w-md mx-auto px-4 py-14 font-siemreap">
      <div className="bg-white rounded-3xl border border-slate-200 shadow-xl p-6 sm:p-8 space-y-6">
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-700 to-slate-900 text-amber-400 flex items-center justify-center mx-auto">
            <GraduationCap className="w-7 h-7" />
          </div>
          <h1 className="font-moul text-xl text-slate-900 leading-relaxed">
            {mode === 'login' ? 'ចូលគណនី' : 'ចុះឈ្មោះជាសមាជិក'}
          </h1>
          {mode === 'signup' && (
            <p className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-800 bg-emerald-50 px-3 py-1 rounded-full">
              <BadgePercent className="w-4 h-4" /> សមាជិកទទួលបានការបញ្ចុះតម្លៃ {MEMBER_DISCOUNT_PERCENT}% គ្រប់វគ្គ
            </p>
          )}
        </div>

        <form onSubmit={submit} className="space-y-4 text-xs font-semibold text-slate-600">
          {mode === 'signup' && (
            <label className="block">
              ឈ្មោះពេញ *
              <input required autoComplete="name" value={name} onChange={e => setName(e.target.value)} className={inputClass} />
            </label>
          )}
          <label className="block">
            អ៊ីមែល *
            <input required type="email" autoComplete="email" value={email} onChange={e => setEmail(e.target.value)} className={inputClass} />
          </label>
          <label className="block">
            ពាក្យសម្ងាត់ *
            <div className="relative">
              <input
                required
                type={showPassword ? 'text' : 'password'}
                autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                minLength={mode === 'signup' ? 8 : undefined}
                value={password}
                onChange={e => setPassword(e.target.value)}
                className={`${inputClass} pr-11`}
              />
              <button
                type="button"
                onClick={() => setShowPassword(s => !s)}
                className="absolute right-3 top-1/2 -translate-y-1/2 mt-0.5 text-slate-400 hover:text-slate-700"
                aria-label={showPassword ? 'លាក់ពាក្យសម្ងាត់' : 'បង្ហាញពាក្យសម្ងាត់'}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {mode === 'signup' && <span className="block mt-1 text-[11px] font-normal text-slate-400">យ៉ាងតិច ៨ តួអក្សរ</span>}
          </label>

          {mode === 'signup' && (
            <label className="flex items-start gap-3 p-3 rounded-xl border border-emerald-200 bg-emerald-50/60 cursor-pointer">
              <input type="checkbox" checked={joinMembership} onChange={e => setJoinMembership(e.target.checked)} className="mt-0.5 w-4 h-4 accent-emerald-600" />
              <span className="text-emerald-900 font-normal leading-relaxed">
                <strong>ចូលជាសមាជិក (ឥតគិតថ្លៃ)</strong> — ទទួលបានការបញ្ចុះតម្លៃ {MEMBER_DISCOUNT_PERCENT}% លើវគ្គសិក្សាដែលមានតម្លៃ
              </span>
            </label>
          )}

          {error && <div role="alert" className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 font-normal">{error}</div>}

          <button type="submit" disabled={submitting} className="w-full py-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-lg shadow-emerald-600/25 disabled:opacity-50">
            {submitting ? 'សូមរង់ចាំ...' : mode === 'login' ? 'ចូលគណនី' : 'បង្កើតគណនី'}
          </button>
        </form>

        <p className="text-center text-xs text-slate-500">
          {mode === 'login' ? 'មិនទាន់មានគណនី? ' : 'មានគណនីរួចហើយ? '}
          <Link href={otherHref} className="text-emerald-700 font-bold hover:underline">
            {mode === 'login' ? 'ចុះឈ្មោះជាសមាជិក' : 'ចូលគណនី'}
          </Link>
        </p>
      </div>
    </div>
  );
}
