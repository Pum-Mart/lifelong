'use client';

import React, { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { X, Trash2, Tag, Landmark, ArrowRight, CheckCircle2 } from 'lucide-react';
import Link from 'next/link';
import { formatKhr, formatUsd, toKhr } from '@/lib/payment';

export default function CartDrawer() {
  const { cart, removeFromCart, isCartOpen, setIsCartOpen, enrollInCourse, openCheckout } = useApp();
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [checkoutComplete, setCheckoutComplete] = useState(false);

  if (!isCartOpen) return null;

  const total = cart.reduce((sum, item) => sum + item.course.price, 0);

  // Free courses enroll right away; paid ones go to the bank payment popup together
  const handleCheckout = async () => {
    if (cart.length === 0) return;
    setIsCheckingOut(true);

    try {
      const freeItems = cart.filter(item => item.course.price === 0);
      const paidCourses = cart.filter(item => item.course.price > 0).map(item => item.course);
      for (const item of freeItems) {
        await enrollInCourse(item.course);
      }
      if (paidCourses.length > 0) {
        openCheckout(paidCourses);
      } else {
        setCheckoutComplete(true);
        setTimeout(() => {
          setIsCartOpen(false);
          setCheckoutComplete(false);
        }, 2500);
      }
    } catch (err) {
      console.error('Checkout error:', err);
    } finally {
      setIsCheckingOut(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      <div 
        className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm transition-opacity" 
        onClick={() => setIsCartOpen(false)}
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-white shadow-2xl flex flex-col">
          {/* Header */}
          <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50">
            <div>
              <h2 className="text-xl font-bold text-slate-900">កន្ត្រកវគ្គសិក្សា</h2>
              <p className="text-xs text-slate-500">
                {cart.length} វគ្គ រង់ចាំការបញ្ជាទិញ
              </p>
            </div>
            <button
              onClick={() => setIsCartOpen(false)}
              className="p-2 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-200/50"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Cart Contents */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {checkoutComplete ? (
              <div className="text-center py-12 space-y-4">
                <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-10 h-10" />
                </div>
                <h3 className="text-xl font-bold text-slate-900">ចុះឈ្មោះបានជោគជ័យ!</h3>
                <p className="text-sm text-slate-600">
                  អ្នកបានចុះឈ្មោះចូលរៀនហើយ។ មេរៀនរបស់អ្នកមាននៅ «ការសិក្សារបស់ខ្ញុំ»។
                </p>
                <Link
                  href="/my-learning"
                  onClick={() => setIsCartOpen(false)}
                  className="inline-block mt-4 px-6 py-2.5 rounded-xl bg-emerald-600 text-white font-semibold shadow hover:bg-emerald-700"
                >
                  ចូលរៀនភ្លាមៗ
                </Link>
              </div>
            ) : cart.length === 0 ? (
              <div className="text-center py-16 space-y-3">
                <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto text-slate-400">
                  <Tag className="w-8 h-8" />
                </div>
                <h3 className="text-base font-semibold text-slate-700">កន្ត្រកមិនទាន់មានវគ្គសិក្សា</h3>
                <p className="text-xs text-slate-500 max-w-xs mx-auto">
                  ស្វែងរកវគ្គសិក្សា ជំនាញឌីជីថល កសិកម្ម អាជីវកម្ម ភាសា និងច្រើនទៀត។
                </p>
                <button
                  onClick={() => {
                    setIsCartOpen(false);
                    document.getElementById('courses')?.scrollIntoView({ behavior: 'smooth' });
                  }}
                  className="mt-4 px-5 py-2 rounded-xl text-sm font-semibold bg-emerald-600 text-white hover:bg-emerald-700"
                >
                  មើលវគ្គសិក្សា
                </button>
              </div>
            ) : (
              cart.map(item => (
                <div key={item.courseId} className="flex gap-4 p-3.5 rounded-2xl border border-slate-200 bg-white hover:border-slate-300 transition">
                  <img
                    src={item.course.thumbnail}
                    alt={item.course.title}
                    className="w-20 h-20 rounded-xl object-cover shrink-0"
                  />
                  <div className="flex-1 min-w-0 flex flex-col justify-between">
                    <div>
                      <div className="text-[11px] font-semibold text-emerald-600 uppercase tracking-wide">
                        {item.course.category}
                      </div>
                      <h4 className="text-sm font-bold text-slate-900 line-clamp-1">
                        {item.course.title}
                      </h4>
                      <p className="text-xs text-slate-500">
                        {item.course.duration} • {item.course.format}
                      </p>
                    </div>
                    <div className="flex items-center justify-between pt-2">
                      <div className="flex items-baseline gap-1.5">
                        <span className="text-base font-extrabold text-slate-900">
                          {item.course.price > 0 ? formatUsd(item.course.price) : 'ឥតគិតថ្លៃ'}
                        </span>
                        {item.course.originalPrice > item.course.price && (
                          <span className="text-xs line-through text-slate-400">
                            {formatUsd(item.course.originalPrice)}
                          </span>
                        )}
                      </div>
                      <button
                        onClick={() => removeFromCart(item.courseId)}
                        className="text-slate-400 hover:text-red-500 p-1"
                        title="ដកវគ្គចេញ"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer & Checkout */}
          {cart.length > 0 && !checkoutComplete && (
            <div className="p-6 border-t border-slate-200 bg-slate-50 space-y-4">
              {/* Price Breakdown (coupons are applied in the payment popup) */}
              <div className="space-y-1.5 text-xs text-slate-600">
                <div className="flex justify-between">
                  <span>សរុបវគ្គ</span>
                  <span>{cart.length} វគ្គ</span>
                </div>
                <div className="flex justify-between text-base font-bold text-slate-900 pt-2 border-t border-slate-200">
                  <span>សរុបថវិកា</span>
                  <span className="text-right">{formatUsd(total)}{total > 0 && <span className="block text-[11px] font-normal text-slate-500">ឬ {formatKhr(toKhr(total))}</span>}</span>
                </div>
              </div>

              {/* Checkout Button */}
              <button
                onClick={handleCheckout}
                disabled={isCheckingOut}
                className="w-full py-3.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-[0.99] text-white font-bold text-sm shadow-lg shadow-emerald-600/25 flex items-center justify-center gap-2 transition disabled:opacity-50"
              >
                {isCheckingOut ? (
                  <span>កំពុងដំណើរការ...</span>
                ) : (
                  <>
                    <span>{total > 0 ? `បញ្ជាទិញ និងបង់ប្រាក់ • ${formatUsd(total)}` : 'ចុះឈ្មោះ'}</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>

              <div className="flex items-center justify-center gap-2 text-[11px] text-slate-500">
                <Landmark className="w-4 h-4 text-emerald-600" />
                <span>បង់តាម ABA, ACLEDA, Wing, KHQR ឬសាច់ប្រាក់ • ជាដុល្លារ ឬរៀល</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
