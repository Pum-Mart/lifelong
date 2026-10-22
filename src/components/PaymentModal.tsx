'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { X, Landmark, Copy, CheckCircle2, Upload, Tag, ShieldCheck, Clock, BadgePercent } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { Course, Payment, SessionUser } from '@/types';
import { CONTACT } from '@/lib/contact';
import {
  BANK_ACCOUNTS,
  COUPONS,
  KHR_PER_USD,
  MEMBER_DISCOUNT_PERCENT,
  PayCurrency,
  quotePayment,
  formatKhr,
  formatUsd,
  normalizeKhPhone
} from '@/lib/payment';

export default function PaymentModal() {
  const { checkoutCourses, currentUser } = useApp();
  if (!checkoutCourses || !currentUser) return null;
  // Keyed by the course list so every opening starts with a fresh form
  return <PaymentModalContent key={checkoutCourses.map(c => c.id).join(',')} courses={checkoutCourses} currentUser={currentUser} />;
}

function PaymentModalContent({ courses, currentUser }: { courses: Course[]; currentUser: SessionUser }) {
  const { closeCheckout, removeFromCart, refreshPayments, showNotification } = useApp();

  const [couponInput, setCouponInput] = useState('');
  const [couponCode, setCouponCode] = useState<string | undefined>();
  const [bankId, setBankId] = useState(BANK_ACCOUNTS[0].id);
  const [payCurrency, setPayCurrency] = useState<PayCurrency>('USD');
  const [qrFailed, setQrFailed] = useState<Record<string, boolean>>({});
  const [payerName, setPayerName] = useState(currentUser.name);
  const [payerPhone, setPayerPhone] = useState('');
  const [transactionRef, setTransactionRef] = useState('');
  const [receipt, setReceipt] = useState<File | null>(null);
  const [receiptPreview, setReceiptPreview] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [submitted, setSubmitted] = useState<Payment | null>(null);

  // Mirrors the server's calculation; the server recomputes it from the database
  const quote = quotePayment(courses.map(c => c.price), couponCode, currentUser.isMember);
  const bank = BANK_ACCOUNTS.find(b => b.id === bankId) || BANK_ACCOUNTS[0];
  const isCash = bank.kind === 'cash';
  const amountDue = payCurrency === 'KHR' ? formatKhr(quote.totalKhr) : formatUsd(quote.total);
  const amountDueRaw = payCurrency === 'KHR' ? String(quote.totalKhr) : quote.total.toFixed(2);

  const applyCoupon = (e: React.SyntheticEvent) => {
    e.preventDefault();
    const code = couponInput.trim().toUpperCase();
    if (COUPONS[code]) {
      setCouponCode(code);
      showNotification(`បានប្រើកូដ ${code} (-${COUPONS[code].percent}%)`);
    } else {
      showNotification('កូដបញ្ចុះតម្លៃមិនត្រឹមត្រូវ', 'warning');
    }
    setCouponInput('');
  };

  const copy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      showNotification('បានចម្លង!');
    } catch {
      showNotification(text, 'info');
    }
  };

  const chooseReceipt = (file: File | null) => {
    if (receiptPreview) URL.revokeObjectURL(receiptPreview);
    setReceipt(file);
    setReceiptPreview(file ? URL.createObjectURL(file) : null);
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const phone = normalizeKhPhone(payerPhone);
    if (!phone) {
      setError('លេខទូរស័ព្ទមិនត្រឹមត្រូវ (ឧ. 012 345 678 ឬ +855 12 345 678)');
      return;
    }
    if (!isCash && !transactionRef.trim() && !receipt) {
      setError('សូមបញ្ចូលលេខប្រតិបត្តិការ ឬភ្ជាប់រូបបង្កាន់ដៃ');
      return;
    }

    const form = new FormData();
    form.append('courseIds', JSON.stringify(courses.map(c => c.id)));
    if (couponCode) form.append('couponCode', couponCode);
    form.append('bankId', bank.id);
    form.append('payCurrency', payCurrency);
    form.append('payerName', payerName);
    form.append('payerPhone', phone);
    if (!isCash) {
      form.append('transactionRef', transactionRef);
      if (receipt) form.append('receipt', receipt);
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/payments', { method: 'POST', body: form });
      const data = await res.json();
      if (!data.success) {
        setError(data.error || 'មិនអាចបញ្ជូនការបង់ប្រាក់បានទេ');
        return;
      }
      courses.forEach(c => removeFromCart(c.id));
      await refreshPayments();
      setSubmitted(data.payment);
    } catch (err) {
      console.error(err);
      setError('មិនអាចភ្ជាប់ទៅម៉ាស៊ីនមេបានទេ សូមព្យាយាមម្តងទៀត');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center sm:p-4 font-siemreap">
      <div className="absolute inset-0 bg-slate-950/70 backdrop-blur-sm" onClick={closeCheckout} />

      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="payment-title"
        className="relative bg-white w-full sm:max-w-2xl max-h-[95vh] overflow-y-auto rounded-t-3xl sm:rounded-3xl shadow-2xl"
      >
        {/* Header */}
        <div className="sticky top-0 z-10 bg-white/95 backdrop-blur border-b border-slate-100 px-5 sm:px-7 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
              <Landmark className="w-5 h-5" />
            </div>
            <div>
              <h2 id="payment-title" className="font-moul text-base text-slate-900 leading-relaxed">បញ្ជាទិញ និងបង់ប្រាក់</h2>
              <p className="text-[11px] text-slate-500">ABA • ACLEDA • Wing • Bakong KHQR • សាច់ប្រាក់</p>
            </div>
          </div>
          <button onClick={closeCheckout} className="p-2 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100" aria-label="បិទ">
            <X className="w-5 h-5" />
          </button>
        </div>

        {submitted ? (
          <div className="px-6 py-12 text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-10 h-10" />
            </div>
            <h3 className="font-moul text-lg text-slate-900 leading-relaxed">បានទទួលការបង់ប្រាក់របស់អ្នក</h3>
            <p className="text-sm text-slate-600 max-w-md mx-auto leading-relaxed">
              លេខបញ្ជាទិញ <strong className="font-mono">{submitted.id}</strong> •{' '}
              {submitted.payCurrency === 'KHR' ? formatKhr(submitted.totalKhr) : formatUsd(submitted.total)}
              <br />
              {submitted.bankId === 'cash'
                ? <>សូមយកលេខបញ្ជាទិញនេះ មកបង់ប្រាក់ផ្ទាល់នៅការិយាល័យមជ្ឈមណ្ឌល (ទូរស័ព្ទ {CONTACT.phones.join(' / ')})។ </>
                : <>យើងកំពុងផ្ទៀងផ្ទាត់ការផ្ទេរប្រាក់។ </>}
              បន្ទាប់ពីការអនុម័ត សូមចូលទៅ «ការសិក្សារបស់ខ្ញុំ» ដើម្បីបំពេញបែបបទចុះឈ្មោះ និងទាញយកសាលាកបត្រ។
            </p>
            <div className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-800 bg-amber-100 px-3 py-1.5 rounded-full">
              <Clock className="w-3.5 h-3.5" /> រង់ចាំការផ្ទៀងផ្ទាត់
            </div>
            <div className="pt-2 flex flex-col sm:flex-row gap-2 justify-center">
              <Link href="/my-learning" onClick={closeCheckout} className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold">
                ទៅកាន់ការសិក្សារបស់ខ្ញុំ
              </Link>
              <button onClick={closeCheckout} className="px-6 py-2.5 rounded-xl border border-slate-300 text-slate-700 text-sm font-bold hover:bg-slate-50">
                បិទ
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={submit} className="px-5 sm:px-7 py-6 space-y-7">
            {/* 1. Order summary */}
            <section className="space-y-3">
              <h3 className="text-sm font-bold text-slate-900">១. សង្ខេបវគ្គសិក្សា</h3>
              <ul className="divide-y divide-slate-100 border border-slate-200 rounded-2xl">
                {courses.map(course => (
                  <li key={course.id} className="flex items-center gap-3 p-3">
                    <img src={course.thumbnail} alt="" className="w-12 h-12 rounded-xl object-cover shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-semibold text-slate-900 line-clamp-1">{course.title}</div>
                      <div className="text-[11px] text-slate-500">{course.duration} • {course.format}</div>
                    </div>
                    <div className="text-sm font-bold text-slate-900 shrink-0">{formatUsd(course.price)}</div>
                  </li>
                ))}
              </ul>

              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Tag className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    value={couponInput}
                    onChange={e => setCouponInput(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') applyCoupon(e); }}
                    placeholder="កូដបញ្ចុះតម្លៃ (ឧ. SENIOR30)"
                    className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-300 text-xs uppercase focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <button type="button" onClick={applyCoupon} className="px-4 rounded-xl bg-slate-900 text-white text-xs font-bold hover:bg-slate-800">
                  ប្រើ
                </button>
              </div>

              <div className="rounded-2xl bg-slate-50 border border-slate-200 p-4 space-y-1.5 text-sm">
                <div className="flex justify-between text-slate-600">
                  <span>សរុបវគ្គ</span>
                  <span className="font-semibold text-slate-900">{courses.length} វគ្គ</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>តម្លៃសរុប</span>
                  <span>{formatUsd(quote.subtotal)}</span>
                </div>
                {currentUser.isMember ? (
                  <div className="flex justify-between text-emerald-700 font-semibold">
                    <span className="flex items-center gap-1.5"><BadgePercent className="w-4 h-4" /> បញ្ចុះតម្លៃសមាជិក (-{MEMBER_DISCOUNT_PERCENT}%)</span>
                    <span>-{formatUsd(quote.memberDiscountAmount)}</span>
                  </div>
                ) : (
                  <Link href="/account" onClick={closeCheckout} className="block text-xs text-emerald-700 font-semibold hover:underline">
                    ចូលជាសមាជិក (ឥតគិតថ្លៃ) ដើម្បីទទួលបានការបញ្ចុះតម្លៃ {MEMBER_DISCOUNT_PERCENT}% →
                  </Link>
                )}
                {quote.couponCode && (
                  <div className="flex justify-between text-emerald-700 font-semibold">
                    <span className="flex items-center gap-2">
                      បញ្ចុះតម្លៃ {quote.couponCode} (-{quote.discountPercent}%)
                      <button type="button" onClick={() => setCouponCode(undefined)} className="text-[11px] underline font-normal">ដកចេញ</button>
                    </span>
                    <span>-{formatUsd(quote.discountAmount)}</span>
                  </div>
                )}
                <div className="flex justify-between items-baseline pt-2 border-t border-slate-200">
                  <span className="font-bold text-slate-900">សរុបថវិកាត្រូវបង់</span>
                  <span className="text-right">
                    <span className="block text-2xl font-black text-emerald-700">{formatUsd(quote.total)}</span>
                    <span className="block text-xs text-slate-500">ឬ {formatKhr(quote.totalKhr)}</span>
                  </span>
                </div>
                <div className="text-[11px] text-slate-400 text-right">អត្រាប្តូរប្រាក់៖ 1 USD = {KHR_PER_USD.toLocaleString('en-US')} ៛</div>
              </div>
            </section>

            {/* 2. Currency & payment method */}
            <section className="space-y-3">
              <h3 className="text-sm font-bold text-slate-900">២. ជ្រើសរូបិយប័ណ្ណ និងវិធីបង់ប្រាក់</h3>
              <div className="grid grid-cols-2 gap-2" role="radiogroup" aria-label="រូបិយប័ណ្ណ">
                {([['USD', 'ដុល្លារ (USD)', formatUsd(quote.total)], ['KHR', 'ប្រាក់រៀល (KHR)', formatKhr(quote.totalKhr)]] as const).map(([code, label, amount]) => (
                  <button
                    key={code}
                    type="button"
                    role="radio"
                    aria-checked={payCurrency === code}
                    onClick={() => setPayCurrency(code)}
                    className={`p-3 rounded-xl border-2 text-left transition ${
                      payCurrency === code ? 'border-emerald-500 bg-emerald-50' : 'border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <span className="block text-xs font-semibold text-slate-600">{label}</span>
                    <span className="block text-base font-black text-slate-900">{amount}</span>
                  </button>
                ))}
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {BANK_ACCOUNTS.map(b => (
                  <button
                    key={b.id}
                    type="button"
                    onClick={() => setBankId(b.id)}
                    aria-pressed={b.id === bankId}
                    className={`px-3 py-2.5 rounded-xl text-xs font-bold transition ring-offset-2 ${b.color} ${
                      b.id === bankId ? 'ring-2 ring-emerald-500 shadow-md' : 'opacity-70 hover:opacity-100'
                    }`}
                  >
                    {b.name}
                  </button>
                ))}
              </div>

              {isCash ? (
                <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 space-y-2 text-sm text-slate-700 leading-relaxed">
                  <div className="font-bold text-slate-900">បង់ប្រាក់ផ្ទាល់នៅការិយាល័យមជ្ឈមណ្ឌល</div>
                  <ol className="list-decimal pl-5 space-y-1 text-xs">
                    <li>ចុច «បញ្ជាទិញ» ខាងក្រោម ដើម្បីទទួលបានលេខបញ្ជាទិញ។</li>
                    <li>យកលេខបញ្ជាទិញ និងប្រាក់ <strong>{amountDue}</strong> មកបង់នៅការិយាល័យ។</li>
                    <li>ទទួលបង្កាន់ដៃពីបុគ្គលិក ហើយវគ្គនឹងបើកឱ្យរៀនភ្លាមៗ។</li>
                  </ol>
                  <div className="text-xs">ព័ត៌មាន៖ {CONTACT.phones.join(' / ')}</div>
                </div>
              ) : (
              <div className="rounded-2xl border border-slate-200 p-4 flex flex-col sm:flex-row gap-4 items-center">
                <div className="w-40 h-40 shrink-0 rounded-xl border border-slate-200 bg-slate-50 flex items-center justify-center overflow-hidden">
                  {bank.qrImage && !qrFailed[bank.id] ? (
                    <img
                      src={bank.qrImage}
                      alt={`${bank.name} QR`}
                      className="w-full h-full object-contain"
                      onError={() => setQrFailed(prev => ({ ...prev, [bank.id]: true }))}
                    />
                  ) : (
                    <span className="text-[11px] text-slate-400 text-center px-3">QR កូដមិនទាន់មាន<br />សូមផ្ទេរតាមលេខគណនី</span>
                  )}
                </div>
                <dl className="flex-1 w-full space-y-2 text-sm">
                  <div>
                    <dt className="text-[11px] text-slate-500">ធនាគារ</dt>
                    <dd className="font-bold text-slate-900">{bank.name}</dd>
                  </div>
                  <div>
                    <dt className="text-[11px] text-slate-500">ឈ្មោះគណនី</dt>
                    <dd className="font-semibold text-slate-900">{bank.accountName}</dd>
                  </div>
                  <div>
                    <dt className="text-[11px] text-slate-500">លេខគណនី</dt>
                    <dd className="flex items-center gap-2">
                      <span className="font-mono font-bold text-slate-900">{bank.accountNumber}</span>
                      <button type="button" onClick={() => copy(bank.accountNumber)} className="p-1 rounded text-slate-400 hover:text-emerald-700" aria-label="ចម្លងលេខគណនី">
                        <Copy className="w-4 h-4" />
                      </button>
                    </dd>
                  </div>
                  <div>
                    <dt className="text-[11px] text-slate-500">ចំនួនទឹកប្រាក់</dt>
                    <dd className="flex items-center gap-2">
                      <span className="font-bold text-emerald-700">{amountDue}</span>
                      <button type="button" onClick={() => copy(amountDueRaw)} className="p-1 rounded text-slate-400 hover:text-emerald-700" aria-label="ចម្លងចំនួនទឹកប្រាក់">
                        <Copy className="w-4 h-4" />
                      </button>
                    </dd>
                  </div>
                  <div className="text-[11px] text-slate-500 leading-relaxed">
                    ផ្ទេរជា{payCurrency === 'KHR' ? 'គណនីរៀល' : 'គណនីដុល្លារ'} ហើយសរសេរក្នុង «ចំណាំ / Remark»៖ <strong>ឈ្មោះ + លេខទូរស័ព្ទ</strong> របស់អ្នក
                  </div>
                </dl>
              </div>
              )}
            </section>

            {/* 3. Confirm payment */}
            <section className="space-y-3">
              <h3 className="text-sm font-bold text-slate-900">៣. {isCash ? 'ព័ត៌មានអ្នកបង់ប្រាក់' : 'បញ្ជាក់ការផ្ទេរប្រាក់'}</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <label className="block text-xs font-semibold text-slate-600">
                  {isCash ? 'ឈ្មោះអ្នកបង់ប្រាក់ *' : 'ឈ្មោះអ្នកផ្ទេរប្រាក់ (ដូចក្នុងគណនីធនាគារ) *'}
                  <input
                    required
                    value={payerName}
                    onChange={e => setPayerName(e.target.value)}
                    className="mt-1 w-full p-2.5 rounded-xl border border-slate-300 text-sm font-normal focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </label>
                <label className="block text-xs font-semibold text-slate-600">
                  លេខទូរស័ព្ទ *
                  <input
                    required
                    type="tel"
                    inputMode="tel"
                    placeholder="012 345 678"
                    value={payerPhone}
                    onChange={e => setPayerPhone(e.target.value)}
                    onBlur={() => { const p = normalizeKhPhone(payerPhone); if (p) setPayerPhone(p); }}
                    aria-invalid={payerPhone !== '' && !normalizeKhPhone(payerPhone)}
                    className="mt-1 w-full p-2.5 rounded-xl border border-slate-300 text-sm font-normal focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                  {payerPhone !== '' && !normalizeKhPhone(payerPhone) && (
                    <span className="block mt-1 text-[11px] font-normal text-red-600">លេខទូរស័ព្ទកម្ពុជា ៩ ឬ ១០ ខ្ទង់ (ឧ. 012 345 678)</span>
                  )}
                </label>
              </div>
              {!isCash && (<>
              <label className="block text-xs font-semibold text-slate-600">
                លេខប្រតិបត្តិការ (Trx. ID / Hash / Reference)
                <input
                  value={transactionRef}
                  onChange={e => setTransactionRef(e.target.value)}
                  placeholder="ឧ. 123456789"
                  className="mt-1 w-full p-2.5 rounded-xl border border-slate-300 text-sm font-normal focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </label>

              <label className="flex items-center gap-3 p-3 rounded-2xl border-2 border-dashed border-slate-300 hover:border-emerald-400 cursor-pointer transition">
                {receiptPreview ? (
                  <img src={receiptPreview} alt="បង្កាន់ដៃ" className="w-14 h-14 rounded-lg object-cover shrink-0" />
                ) : (
                  <div className="w-14 h-14 rounded-lg bg-slate-100 text-slate-400 flex items-center justify-center shrink-0">
                    <Upload className="w-6 h-6" />
                  </div>
                )}
                <span className="text-xs text-slate-600">
                  <strong className="block text-slate-900">{receipt ? receipt.name : 'ភ្ជាប់រូបបង្កាន់ដៃផ្ទេរប្រាក់'}</strong>
                  រូបថតអេក្រង់ពីកម្មវិធីធនាគារ (មិនលើស 5MB)
                </span>
                <input type="file" accept="image/*" className="sr-only" onChange={e => chooseReceipt(e.target.files?.[0] || null)} />
              </label>
              <p className="text-[11px] text-slate-500">* សូមបញ្ចូលលេខប្រតិបត្តិការ ឬភ្ជាប់រូបបង្កាន់ដៃ យ៉ាងហោចណាស់មួយ</p>
              </>)}
            </section>

            {error && (
              <div role="alert" className="p-3 rounded-xl bg-red-50 border border-red-200 text-sm text-red-700">{error}</div>
            )}

            <div className="space-y-2">
              <button
                type="submit"
                disabled={submitting}
                className="w-full py-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-lg shadow-emerald-600/25 transition disabled:opacity-50"
              >
                {submitting ? 'កំពុងបញ្ជូន...' : isCash ? `បញ្ជាទិញ • បង់នៅមជ្ឈមណ្ឌល ${amountDue}` : `ខ្ញុំបានផ្ទេរប្រាក់រួចហើយ • ${amountDue}`}
              </button>
              <p className="flex items-center justify-center gap-1.5 text-[11px] text-slate-500">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                {isCash ? 'វគ្គនឹងបើកឱ្យរៀន បន្ទាប់ពីបង់ប្រាក់នៅការិយាល័យ' : 'វគ្គនឹងបើកឱ្យរៀន បន្ទាប់ពីយើងផ្ទៀងផ្ទាត់ការផ្ទេរប្រាក់'}
              </p>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
