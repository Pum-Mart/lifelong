'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useApp } from '@/context/AppContext';
import { Course, AdminAnalytics, Payment, Instructor, Registration, SessionUser } from '@/types';
import { formatKhr, formatUsd } from '@/lib/payment';
import CourseFormModal from '@/components/admin/CourseFormModal';
import TeachersManager from '@/components/admin/TeachersManager';
import UsersManager from '@/components/admin/UsersManager';
import LoginRequired from '@/components/LoginRequired';
import {
  DollarSign,
  Users,
  BookOpen,
  Award,
  TrendingUp,
  Plus,
  Trash2,
  Pencil,
  ShieldCheck,
  UserCheck
} from 'lucide-react';

export default function AdminPage() {
  const { currentUser, authReady } = useApp();
  if (!authReady) return <div className="py-24 text-center text-sm text-slate-400">កំពុងផ្ទុក...</div>;
  if (!currentUser) return <LoginRequired message="សូមចូលគណនី Admin ដើម្បីចូលផ្ទាំងគ្រប់គ្រង" />;
  if (currentUser.role !== 'admin') {
    return (
      <div className="max-w-md mx-auto py-24 px-4 text-center space-y-3 font-siemreap">
        <ShieldCheck className="w-12 h-12 text-slate-300 mx-auto" />
        <h1 className="text-lg font-bold text-slate-900">សម្រាប់អ្នកគ្រប់គ្រងតែប៉ុណ្ណោះ</h1>
        <p className="text-sm text-slate-500">គណនី {currentUser.email} មិនមានសិទ្ធិ Admin ទេ។ សូមស្នើ Admin ឱ្យផ្តល់សិទ្ធិ។</p>
      </div>
    );
  }
  return <AdminDashboard currentUser={currentUser} />;
}

function AdminDashboard({ currentUser }: { currentUser: SessionUser }) {
  const { showNotification } = useApp();

  const [stats, setStats] = useState<AdminAnalytics | null>(null);
  const [courses, setCourses] = useState<Course[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [reviewingId, setReviewingId] = useState<string | null>(null);

  // Course form: null = closed, 'new' = add, otherwise the course being edited
  const [courseForm, setCourseForm] = useState<Course | 'new' | null>(null);
  const [instructors, setInstructors] = useState<Instructor[]>([]);
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [users, setUsers] = useState<SessionUser[]>([]);

  async function loadAdminData() {
    try {
      const [statsRes, coursesRes, paymentsRes, instructorsRes, registrationsRes, usersRes] = await Promise.all([
        fetch('/api/admin/stats'),
        fetch('/api/courses'),
        fetch('/api/payments?scope=all'),
        fetch('/api/instructors'),
        fetch('/api/registrations?scope=all'),
        fetch('/api/admin/users')
      ]);
      const statsData = await statsRes.json();
      const coursesData = await coursesRes.json();
      const paymentsData = await paymentsRes.json();
      const instructorsData = await instructorsRes.json();
      const registrationsData = await registrationsRes.json();
      const usersData = await usersRes.json();

      if (statsData.success) setStats(statsData.stats);
      if (coursesData.success) setCourses(coursesData.courses);
      if (paymentsData.success) setPayments(paymentsData.payments);
      if (instructorsData.success) setInstructors(instructorsData.instructors);
      if (registrationsData.success) setRegistrations(registrationsData.registrations);
      if (usersData.success) setUsers(usersData.users);
    } catch (e) {
      console.error(e);
    }
  }

  useEffect(() => {
    loadAdminData();
  }, []);

  const handleSaved = async (message: string) => {
    setCourseForm(null);
    showNotification(message);
    await loadAdminData();
  };

  const handleDeleteCourse = async (courseId: string, courseTitle: string) => {
    if (!confirm(`Are you sure you want to remove "${courseTitle}" from the public curriculum?`)) {
      return;
    }

    try {
      const res = await fetch(`/api/courses/${courseId}`, {
        method: 'DELETE'
      });
      const data = await res.json();
      if (data.success) {
        showNotification(`Course "${courseTitle}" removed`);
        setCourses(prev => prev.filter(c => c.id !== courseId));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleReviewPayment = async (payment: Payment, action: 'approve' | 'reject') => {
    const verb = action === 'approve' ? 'អនុម័ត' : 'បដិសេធ';
    if (!confirm(`${verb}ការបង់ប្រាក់ ${payment.id} ($${payment.total}) របស់ ${payment.studentName}?`)) return;

    try {
      setReviewingId(payment.id);
      const res = await fetch(`/api/payments/${payment.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action })
      });
      const data = await res.json();
      if (data.success) {
        showNotification(`បាន${verb}ការបង់ប្រាក់ ${payment.id}`);
        await loadAdminData();
      } else {
        showNotification(data.error || 'Failed to review payment', 'warning');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setReviewingId(null);
    }
  };

  const [sendingReports, setSendingReports] = useState(false);
  const sendReportsNow = async () => {
    if (!confirm('ផ្ញើរបាយការណ៍ប្រចាំសប្តាហ៍ (៧ ថ្ងៃចុងក្រោយ) ទៅសិស្ស គ្រូ ប្រធាន និងគណៈកម្មការ ឥឡូវនេះ?')) return;
    setSendingReports(true);
    try {
      const res = await fetch('/api/reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'weekly' })
      });
      const data = await res.json();
      if (data.success) {
        showNotification(`បានផ្ញើរបាយការណ៍ ${data.weekly.courses} វគ្គ (${data.weekly.messages} សារ)`);
      } else {
        showNotification(data.error || 'ផ្ញើមិនបានទេ', 'warning');
      }
    } finally {
      setSendingReports(false);
    }
  };

  const pendingPayments = payments.filter(p => p.status === 'pending');

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12 space-y-10">
      {/* Role Banner / Context Switcher */}
      <div className="bg-slate-900 text-white rounded-3xl p-6 sm:p-8 flex flex-col md:flex-row items-center justify-between gap-6 shadow-xl">
        <div className="space-y-1 text-center md:text-left">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-semibold">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Faculty & Administrative Command Center</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white">
            Curriculum, Student Progress & Revenue
          </h1>
          <p className="text-xs text-slate-300 max-w-xl">
            ចូលគណនីជា <strong className="text-white">{currentUser.name}</strong> ({currentUser.email}) • {currentUser.isOwner ? 'ម្ចាស់ / Admin' : 'Admin'}
          </p>
        </div>
        <Link href="/admin/content" className="px-5 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-emerald-950 font-bold text-xs shrink-0">
          📝 បញ្ចូលមាតិកា៖ សេចក្តីជូនដំណឹង • សកម្មភាព • អក្សររត់ • វគ្គសិក្សា
        </Link>
      </div>

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-3xl border border-slate-200/90 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-bold uppercase tracking-wider">Gross Tuition Revenue</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-black text-slate-900">
            ${stats ? stats.totalRevenue.toLocaleString() : '---'}
          </div>
          <div className="text-xs text-emerald-700 font-semibold flex items-center gap-1">
            <TrendingUp className="w-3.5 h-3.5" />
            <span>+18.4% enrollment growth</span>
          </div>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-slate-200/90 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-bold uppercase tracking-wider">Active Adult Scholars</span>
            <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-black text-slate-900">
            {stats ? stats.totalStudents.toLocaleString() : '---'}
          </div>
          <div className="text-xs text-indigo-700 font-semibold">
            Across 42 global lifelong chapters
          </div>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-slate-200/90 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-bold uppercase tracking-wider">Curriculum Offerings</span>
            <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <BookOpen className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-black text-slate-900">
            {courses.length} Courses
          </div>
          <div className="text-xs text-amber-700 font-semibold">
            All accredited with CEU credits
          </div>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-slate-200/90 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-bold uppercase tracking-wider">Certificates Conferred</span>
            <div className="w-8 h-8 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
              <Award className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-black text-slate-900">
            {stats ? stats.certificatesIssued : '---'} Issued
          </div>
          <div className="text-xs text-emerald-700 font-semibold">
            {stats?.completionRate || 82}% Course Completion Rate
          </div>
        </div>
      </div>

      {/* Course Management Table */}
      <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm p-6 sm:p-8 space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h2 className="text-xl font-bold text-slate-900">Curriculum Roster & Catalog Management</h2>
            <p className="text-xs text-slate-500">Add new learning programs, update pricing, or edit syllabus details.</p>
          </div>

          <button
            onClick={() => setCourseForm('new')}
            className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-2 shadow-md shadow-emerald-600/20 transition"
          >
            <Plus className="w-4 h-4" />
            <span>បន្ថែមវគ្គ</span>
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 text-slate-400 uppercase tracking-wider">
                <th className="pb-3 font-semibold">វគ្គ</th>
                <th className="pb-3 font-semibold">គ្រូបង្រៀន</th>
                <th className="pb-3 font-semibold">រយៈពេល</th>
                <th className="pb-3 font-semibold">តម្លៃ</th>
                <th className="pb-3 font-semibold">សិស្ស</th>
                <th className="pb-3 font-semibold text-right">សកម្មភាព</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {courses.map(course => (
                <tr key={course.id} className="hover:bg-slate-50/70 transition">
                  <td className="py-3.5 pr-4">
                    <div className="flex items-center gap-3">
                      <img
                        src={course.thumbnail}
                        alt={course.title}
                        className="w-10 h-10 rounded-xl object-cover shrink-0"
                      />
                      <div className="min-w-0">
                        <div className="font-bold text-slate-900 line-clamp-1">{course.title}</div>
                        <div className="text-[11px] text-slate-400">{course.category} • {course.format}</div>
                      </div>
                    </div>
                  </td>
                  <td className="py-3.5 pr-4 font-medium text-slate-600">{course.instructor?.name || '—'}</td>
                  <td className="py-3.5 pr-4 text-slate-600">{course.duration}</td>
                  <td className="py-3.5 pr-4 font-bold text-slate-900">
                    {course.price === 0 ? 'ឥតគិតថ្លៃ' : `$${course.price}`}
                    {course.originalPrice > course.price && (
                      <span className="ml-1 text-[11px] font-normal line-through text-slate-400">${course.originalPrice}</span>
                    )}
                  </td>
                  <td className="py-3.5 pr-4 font-semibold text-emerald-700">
                    {course.enrolledStudentsCount || 0}
                  </td>
                  <td className="py-3.5 text-right whitespace-nowrap">
                    <button
                      onClick={() => setCourseForm(course)}
                      className="p-1.5 text-slate-400 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition"
                      title="កែប្រែតម្លៃ រយៈពេល គ្រូ..."
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteCourse(course.id, course.title)}
                      className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                      title="Delete course"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Bank Transfer Payments Awaiting Review */}
      <div className="bg-white rounded-3xl border border-amber-200 shadow-sm p-6 sm:p-8 space-y-4">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-slate-900">ការបង់ប្រាក់រង់ចាំផ្ទៀងផ្ទាត់</h2>
            <p className="text-xs text-slate-500">
              ពិនិត្យប្រាក់ចូលគណនីធនាគារ (និងរូបបង្កាន់ដៃក្នុង Telegram) មុនពេលអនុម័ត។ ការអនុម័តនឹងបើកវគ្គឱ្យសិស្សរៀនភ្លាម។
            </p>
          </div>
          <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 shrink-0">
            {pendingPayments.length} រង់ចាំ
          </span>
        </div>

        {pendingPayments.length === 0 ? (
          <p className="text-sm text-slate-400 py-6 text-center">មិនមានការបង់ប្រាក់រង់ចាំទេ</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 text-slate-400 uppercase tracking-wider">
                  <th className="pb-3 font-semibold">លេខ</th>
                  <th className="pb-3 font-semibold">សិស្ស / អ្នកផ្ទេរ</th>
                  <th className="pb-3 font-semibold">វគ្គ</th>
                  <th className="pb-3 font-semibold">សរុប</th>
                  <th className="pb-3 font-semibold">ធនាគារ / លេខប្រតិបត្តិការ</th>
                  <th className="pb-3 font-semibold text-right">សកម្មភាព</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {pendingPayments.map(payment => (
                  <tr key={payment.id} className="align-top">
                    <td className="py-3 pr-4">
                      <div className="font-mono font-bold text-slate-700">{payment.id}</div>
                      <div className="text-[11px] text-slate-400">{new Date(payment.createdAt).toLocaleString()}</div>
                    </td>
                    <td className="py-3 pr-4">
                      <div className="font-semibold text-slate-900">{payment.studentName}</div>
                      <div className="text-[11px] text-slate-500">{payment.payerName} • {payment.payerPhone}</div>
                    </td>
                    <td className="py-3 pr-4 max-w-xs">
                      <div className="font-semibold text-slate-700">{payment.items.length} វគ្គ</div>
                      {payment.items.map(item => (
                        <div key={item.courseId} className="text-[11px] text-slate-500 truncate">• {item.courseTitle}</div>
                      ))}
                    </td>
                    <td className="py-3 pr-4">
                      <div className={payment.payCurrency === 'KHR' ? 'text-[11px] text-slate-400' : 'font-bold text-slate-900'}>{formatUsd(payment.total)}</div>
                      <div className={payment.payCurrency === 'KHR' ? 'font-bold text-slate-900' : 'text-[11px] text-slate-400'}>{formatKhr(payment.totalKhr)}</div>
                      <div className="text-[10px] text-slate-500">បង់ជា{payment.payCurrency === 'KHR' ? 'រៀល' : 'ដុល្លារ'}</div>
                      {payment.couponCode && <div className="text-[11px] text-emerald-700">{payment.couponCode}</div>}
                    </td>
                    <td className="py-3 pr-4">
                      <div className="font-semibold text-slate-700">{payment.bankName}</div>
                      <div className="text-[11px] text-slate-500 font-mono">{payment.transactionRef || '—'}</div>
                      {payment.hasReceipt && <div className="text-[11px] text-sky-700">មានបង្កាន់ដៃ (Telegram)</div>}
                    </td>
                    <td className="py-3 text-right whitespace-nowrap space-x-2">
                      <button
                        onClick={() => handleReviewPayment(payment, 'approve')}
                        disabled={reviewingId === payment.id}
                        className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold disabled:opacity-50"
                      >
                        អនុម័ត
                      </button>
                      <button
                        onClick={() => handleReviewPayment(payment, 'reject')}
                        disabled={reviewingId === payment.id}
                        className="px-3 py-1.5 rounded-lg border border-red-200 text-red-600 hover:bg-red-50 font-bold disabled:opacity-50"
                      >
                        បដិសេធ
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Recent Orders & Enrollments Table */}
      {stats?.recentOrders && (
        <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm p-6 sm:p-8 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-slate-900">Recent Registrations & Tuition Payments</h2>
              <p className="text-xs text-slate-500">Live order feed for student enrollments.</p>
            </div>
            <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800">
              Live Gateway Sync
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 text-slate-400 uppercase tracking-wider">
                  <th className="pb-3 font-semibold">Order ID</th>
                  <th className="pb-3 font-semibold">Learner Name</th>
                  <th className="pb-3 font-semibold">Enrolled Course</th>
                  <th className="pb-3 font-semibold">Amount</th>
                  <th className="pb-3 font-semibold">Date</th>
                  <th className="pb-3 font-semibold text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {stats.recentOrders.map(order => (
                  <tr key={order.id} className="hover:bg-slate-50/70">
                    <td className="py-3 font-mono font-bold text-slate-700">{order.id}</td>
                    <td className="py-3 font-semibold text-slate-900">{order.studentName}</td>
                    <td className="py-3 text-slate-600 max-w-xs truncate">{order.courseTitle}</td>
                    <td className="py-3 font-bold text-slate-900">${order.amount}</td>
                    <td className="py-3 text-slate-400">{order.date}</td>
                    <td className="py-3 text-right">
                      <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold text-[10px]">
                        {order.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Accounts & admin rights */}
      {/* Weekly reports */}
      <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm p-6 sm:p-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4 font-siemreap">
        <div>
          <h2 className="text-xl font-bold text-slate-900">របាយការណ៍ប្រចាំសប្តាហ៍</h2>
          <p className="text-xs text-slate-500 leading-relaxed">
            ផ្ញើដោយស្វ័យប្រវត្តិរៀងរាល់ <strong>ថ្ងៃសុក្រ ម៉ោង ៥ ល្ងាច</strong> (មុនចុងសប្តាហ៍ ១ ថ្ងៃ) ទៅសិស្ស គ្រូ ប្រធានមជ្ឈមណ្ឌល និងគណៈកម្មការ
            (ត្រូវបើក <code>npm run bot</code>)។ ក៏អាចផ្ញើឥឡូវនេះបានដែរ។
          </p>
        </div>
        <button
          onClick={sendReportsNow}
          disabled={sendingReports}
          className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shrink-0 disabled:opacity-50"
        >
          {sendingReports ? 'កំពុងផ្ញើ...' : 'ផ្ញើរបាយការណ៍ឥឡូវនេះ'}
        </button>
      </div>

      <UsersManager
        users={users}
        instructors={instructors}
        currentUserId={currentUser.id}
        onChanged={async message => {
          showNotification(message);
          await loadAdminData();
        }}
        onError={message => showNotification(message, 'warning')}
      />

      {/* Teachers */}
      <TeachersManager
        instructors={instructors}
        courses={courses}
        onChanged={async message => {
          showNotification(message);
          await loadAdminData();
        }}
        onError={message => showNotification(message, 'warning')}
      />

      {/* Course Registrations */}
      <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm p-6 sm:p-8 space-y-4">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-slate-900">បញ្ជីចុះឈ្មោះចូលរៀន</h2>
            <p className="text-xs text-slate-500">សិស្សដែលបានបំពេញបែបបទ។ «បានផ្ទៀងផ្ទាត់» មានន័យថាសិស្សបានផ្ញើសាលាកបត្រក្នុង Telegram រួច។</p>
          </div>
          <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 shrink-0">
            {registrations.length} នាក់
          </span>
        </div>

        {registrations.length === 0 ? (
          <p className="text-sm text-slate-400 py-6 text-center">មិនទាន់មានការចុះឈ្មោះទេ</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 text-slate-400 uppercase tracking-wider">
                  <th className="pb-3 font-semibold">លេខកូដ</th>
                  <th className="pb-3 font-semibold">សិស្ស</th>
                  <th className="pb-3 font-semibold">វគ្គ</th>
                  <th className="pb-3 font-semibold">ទូរស័ព្ទ / Telegram</th>
                  <th className="pb-3 font-semibold text-right">ស្ថានភាព</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {registrations.map(r => (
                  <tr key={r.id} className="align-top">
                    <td className="py-3 pr-4 font-mono font-bold text-slate-700">{r.code}</td>
                    <td className="py-3 pr-4">
                      <div className="flex items-center gap-3">
                        <img src={r.photo} alt="" className="w-9 aspect-[2/3] rounded object-cover shrink-0" />
                        <div>
                          <div className="font-semibold text-slate-900">{r.fullNameKh}</div>
                          <div className="text-[11px] text-slate-500">{r.fullNameEn} • {r.gender}</div>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 pr-4 text-slate-600 max-w-xs">{r.courseTitle}</td>
                    <td className="py-3 pr-4 text-slate-600">
                      <div>{r.phone}</div>
                      {r.telegramUsername && <div className="text-[11px] text-sky-700">@{r.telegramUsername}</div>}
                    </td>
                    <td className="py-3 text-right">
                      {r.verifiedAt ? (
                        <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold text-[10px]">បានផ្ទៀងផ្ទាត់ ✓</span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 font-bold text-[10px]">រង់ចាំ Telegram</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {courseForm && (
        <CourseFormModal
          key={courseForm === 'new' ? 'new' : courseForm.id}
          course={courseForm === 'new' ? undefined : courseForm}
          instructors={instructors}
          onClose={() => setCourseForm(null)}
          onSaved={handleSaved}
        />
      )}
    </div>
  );
}
