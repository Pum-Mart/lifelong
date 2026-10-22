'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useApp } from '@/context/AppContext';
import { formatKhr, formatUsd, toKhr } from '@/lib/payment';
import { Trash2, ArrowRight, ShieldCheck, CheckCircle2, ShoppingBag } from 'lucide-react';

export default function CartPage() {
  const { cart, removeFromCart, enrollInCourse, openCheckout, currentUser } = useApp();
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const total = cart.reduce((sum, item) => sum + item.course.price, 0);

  // Free courses enroll right away; paid ones go to the bank payment popup together
  const handleCompleteOrder = async () => {
    if (cart.length === 0) return;
    setIsProcessing(true);
    try {
      const freeItems = cart.filter(item => item.course.price === 0);
      const paidCourses = cart.filter(item => item.course.price > 0).map(item => item.course);
      let allEnrolled = true;
      for (const item of freeItems) {
        allEnrolled = (await enrollInCourse(item.course)) && allEnrolled;
      }
      if (paidCourses.length > 0) {
        openCheckout(paidCourses);
      } else if (allEnrolled) {
        setIsSuccess(true);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsProcessing(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="max-w-xl mx-auto py-24 px-4 text-center space-y-6">
        <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-inner">
          <CheckCircle2 className="w-12 h-12" />
        </div>
        <h1 className="text-3xl font-extrabold text-slate-900">ចុះឈ្មោះបានជោគជ័យ!</h1>
        <p className="text-slate-600 text-sm">
          សូមស្វាគមន៍មកកាន់វគ្គសិក្សាថ្មី។ មេរៀន ឯកសារ និងផ្ទាំងសួរសំណួរ មាននៅ «ការសិក្សារបស់ខ្ញុំ»។
        </p>
        <div className="pt-2">
          <Link
            href="/my-learning"
            className="inline-block px-8 py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl font-bold text-sm shadow-lg shadow-emerald-600/25 transition"
          >
            ទៅកាន់ការសិក្សារបស់ខ្ញុំ →
          </Link>
        </div>
      </div>
    );
  }

  if (cart.length === 0) {
    return (
      <div className="max-w-xl mx-auto py-24 px-4 text-center space-y-6">
        <div className="w-20 h-20 bg-slate-100 text-slate-400 rounded-full flex items-center justify-center mx-auto">
          <ShoppingBag className="w-10 h-10" />
        </div>
        <h1 className="text-2xl font-bold text-slate-800">កន្ត្រកមិនទាន់មានវគ្គសិក្សា</h1>
        <p className="text-slate-500 text-sm">
          ស្វែងរកវគ្គសិក្សា ជំនាញឌីជីថល កសិកម្ម អាជីវកម្ម ភាសា និងច្រើនទៀត។
        </p>
        <div>
          <Link
            href="/courses"
            className="inline-block px-6 py-3 bg-emerald-600 text-white rounded-xl font-bold text-xs shadow hover:bg-emerald-700"
          >
            មើលវគ្គសិក្សា
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12 space-y-8">
      <div>
        <h1 className="text-3xl font-extrabold text-slate-900">កន្ត្រក និងការបញ្ជាទិញ</h1>
        <p className="text-xs text-slate-500 mt-1">
          ពិនិត្យវគ្គដែលបានជ្រើសរើស មុនពេលបង់ប្រាក់។ កូដបញ្ចុះតម្លៃ បញ្ចូលនៅជំហានបង់ប្រាក់។
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        {/* Cart Item List */}
        <div className="lg:col-span-2 space-y-4">
          {cart.map(item => (
            <div
              key={item.courseId}
              className="bg-white p-5 rounded-3xl border border-slate-200/90 shadow-sm flex flex-col sm:flex-row gap-5 items-start sm:items-center justify-between"
            >
              <div className="flex gap-4 items-center">
                <img
                  src={item.course.thumbnail}
                  alt={item.course.title}
                  className="w-20 h-20 rounded-2xl object-cover shrink-0 shadow-sm"
                />
                <div className="space-y-1">
                  <span className="text-[11px] font-bold text-emerald-700 uppercase tracking-wider">
                    {item.course.category}
                  </span>
                  <h3 className="text-sm font-bold text-slate-900 line-clamp-1">
                    {item.course.title}
                  </h3>
                  <div className="text-xs text-slate-500">
                    {item.course.duration} • {item.course.format}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-6 self-end sm:self-center">
                <div className="text-right">
                  <div className="text-lg font-black text-slate-900">{item.course.price > 0 ? formatUsd(item.course.price) : 'ឥតគិតថ្លៃ'}</div>
                  {item.course.originalPrice > item.course.price && (
                    <div className="text-xs line-through text-slate-400">{formatUsd(item.course.originalPrice)}</div>
                  )}
                </div>
                <button
                  onClick={() => removeFromCart(item.courseId)}
                  className="p-2 text-slate-400 hover:text-red-500 rounded-xl hover:bg-slate-50"
                  title="ដកវគ្គចេញ"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Order Summary & Coupon Card */}
        <div className="lg:col-span-1">
          <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm space-y-6">
            <h3 className="text-lg font-bold text-slate-900">សង្ខេបការបញ្ជាទិញ</h3>

            {/* Price Calculations (coupons are applied in the payment popup) */}
            <div className="space-y-2 pt-2 border-t border-slate-100 text-xs text-slate-600">
              <div className="flex justify-between">
                <span>សរុបវគ្គ</span>
                <span>{cart.length} វគ្គ</span>
              </div>
              <div className="flex justify-between text-lg font-black text-slate-900 pt-3 border-t border-slate-200">
                <span>សរុបថវិកា</span>
                <span className="text-right">{formatUsd(total)}{total > 0 && <span className="block text-xs font-normal text-slate-500">ឬ {formatKhr(toKhr(total))}</span>}</span>
              </div>
              <div className="text-[11px] text-slate-400">មានកូដបញ្ចុះតម្លៃ? បញ្ចូលនៅជំហានបង់ប្រាក់</div>
            </div>

            {/* Student info */}
            <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-600 space-y-1">
              {currentUser ? (
                <>
                  <div>សិស្ស៖ <strong>{currentUser.name}</strong>{currentUser.isMember && <span className="text-emerald-700 font-bold"> • សមាជិក -10%</span>}</div>
                  <div>អ៊ីមែល៖ <strong>{currentUser.email}</strong></div>
                </>
              ) : (
                <div>សូម <Link href="/login?next=/cart" className="text-emerald-700 font-bold underline">ចូលគណនី</Link> ឬ <Link href="/signup?next=/cart" className="text-emerald-700 font-bold underline">ចុះឈ្មោះជាសមាជិក</Link> ដើម្បីបង់ប្រាក់ និងទទួលបានការបញ្ចុះតម្លៃ ១០%</div>
              )}
            </div>

            {/* Checkout Button */}
            <button
              onClick={handleCompleteOrder}
              disabled={isProcessing}
              className="w-full py-3.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-lg shadow-emerald-600/25 flex items-center justify-center gap-2 transition disabled:opacity-50"
            >
              {isProcessing ? 'កំពុងដំណើរការ...' : total > 0 ? `បញ្ជាទិញ និងបង់ប្រាក់ • ${formatUsd(total)}` : 'ចុះឈ្មោះ'}
              <ArrowRight className="w-4 h-4" />
            </button>

            <div className="flex items-center justify-center gap-2 text-[11px] text-slate-400 pt-2">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>ABA • ACLEDA • Wing • KHQR • សាច់ប្រាក់ (ដុល្លារ ឬរៀល)</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
