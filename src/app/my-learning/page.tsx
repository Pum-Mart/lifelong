'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useApp } from '@/context/AppContext';
import { Course, Registration, SessionUser } from '@/types';
import CourseCard from '@/components/CourseCard';
import LoginRequired from '@/components/LoginRequired';
import MyGrades from '@/components/MyGrades';
import {
  Award,
  PlayCircle,
  CheckCircle,
  BookOpen,
  Sparkles,
  ClipboardList,
  Heart
} from 'lucide-react';

function RegistrationLink({ courseSlug, registration }: { courseSlug: string; registration?: Registration }) {
  const style = !registration
    ? 'bg-amber-500 hover:bg-amber-600 text-slate-950'
    : registration.verifiedAt
      ? 'border border-emerald-300 text-emerald-800 hover:bg-emerald-50'
      : 'border border-amber-300 text-amber-800 hover:bg-amber-50';
  const label = !registration
    ? 'បំពេញបែបបទចុះឈ្មោះ'
    : registration.verifiedAt
      ? 'សាលាកបត្រ ✓'
      : 'សាលាកបត្រ • ផ្ញើទៅ Telegram';
  return (
    <Link href={`/register/${courseSlug}`} className={`flex-1 py-2.5 px-4 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition ${style}`}>
      <ClipboardList className="w-4 h-4" />
      <span>{label}</span>
    </Link>
  );
}

export default function MyLearningPage() {
  const { currentUser, authReady } = useApp();
  if (!authReady) return <div className="py-24 text-center text-sm text-slate-400">កំពុងផ្ទុក...</div>;
  if (!currentUser) return <LoginRequired message="សូមចូលគណនី ដើម្បីមើលវគ្គសិក្សារបស់អ្នក" />;
  return <MyLearningContent currentUser={currentUser} />;
}

function MyLearningContent({ currentUser }: { currentUser: SessionUser }) {
  const { enrollments, bookmarks } = useApp();
  const [activeTab, setActiveTab] = useState<'in-progress' | 'completed' | 'saved'>('in-progress');
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [allCourses, setAllCourses] = useState<Course[]>([]);

  // Courses saved with ❤️ (kept in this browser)
  useEffect(() => {
    fetch('/api/courses')
      .then(res => res.json())
      .then(data => {
        if (data.success) setAllCourses(data.courses);
      })
      .catch(err => console.error(err));
  }, []);
  const savedCourses = allCourses.filter(c => bookmarks.includes(c.id));

  useEffect(() => {
    fetch('/api/registrations')
      .then(res => res.json())
      .then(data => {
        if (data.success) setRegistrations(data.registrations);
      })
      .catch(err => console.error(err));
  }, [currentUser.id]);

  const inProgressList = enrollments.filter(e => !e.isCompleted);
  const completedList = enrollments.filter(e => e.isCompleted);

  // Calculate totals
  const totalCEUs = completedList.reduce((sum, e) => sum + (e.course?.ceus || 0), 0);
  const totalCompletedCount = completedList.length;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12 space-y-10">
      {/* Student Welcome Header */}
      <div className="bg-gradient-to-r from-emerald-900 via-slate-900 to-indigo-950 rounded-3xl p-6 sm:p-10 text-white shadow-xl flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-5">
          <div className="w-20 h-20 rounded-2xl bg-emerald-500/20 ring-4 ring-emerald-500/30 shadow-lg flex items-center justify-center text-3xl font-black text-emerald-300">
            {currentUser.name.trim().charAt(0).toUpperCase()}
          </div>
          <div className="space-y-1 text-left">
            {currentUser.isMember ? (
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-semibold">
                <Sparkles className="w-3.5 h-3.5" />
                <span>សមាជិក • បញ្ចុះតម្លៃ ១០%</span>
              </div>
            ) : (
              <Link href="/account" className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-400/20 text-amber-300 text-xs font-semibold hover:bg-amber-400/30">
                <Sparkles className="w-3.5 h-3.5" />
                <span>ចូលជាសមាជិក ដើម្បីទទួលបានការបញ្ចុះតម្លៃ ១០% →</span>
              </Link>
            )}
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white">
              សូមស្វាគមន៍ {currentUser.name}!
            </h1>
            <p className="text-xs text-slate-300 max-w-md">{currentUser.email}</p>
          </div>
        </div>

        {/* Quick Stats Grid */}
        <div className="grid grid-cols-3 gap-4 text-center w-full md:w-auto border-t md:border-t-0 md:border-l border-slate-700/80 pt-4 md:pt-0 md:pl-8">
          <div className="px-3">
            <div className="text-2xl font-extrabold text-white">{enrollments.length}</div>
            <div className="text-[11px] text-slate-400 font-medium">Enrolled</div>
          </div>
          <div className="px-3">
            <div className="text-2xl font-extrabold text-emerald-400">{totalCompletedCount}</div>
            <div className="text-[11px] text-slate-400 font-medium">Completed</div>
          </div>
          <div className="px-3">
            <div className="text-2xl font-extrabold text-amber-400">{totalCEUs}</div>
            <div className="text-[11px] text-slate-400 font-medium">CEUs Earned</div>
          </div>
        </div>
      </div>

      <MyGrades />

      {/* Tabs */}
      <div className="space-y-6">
        <div className="flex border-b border-slate-200 gap-4 sm:gap-8 text-sm">
          <button
            onClick={() => setActiveTab('in-progress')}
            className={`pb-3 font-bold flex items-center gap-2 border-b-2 transition ${
              activeTab === 'in-progress'
                ? 'border-emerald-600 text-emerald-800'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            <span>In Progress ({inProgressList.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('completed')}
            className={`pb-3 font-bold flex items-center gap-2 border-b-2 transition ${
              activeTab === 'completed'
                ? 'border-emerald-600 text-emerald-800'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Award className="w-4 h-4" />
            <span>Completed & Certificates ({completedList.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('saved')}
            className={`pb-3 font-bold flex items-center gap-2 border-b-2 transition ${
              activeTab === 'saved'
                ? 'border-emerald-600 text-emerald-800'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Heart className="w-4 h-4" />
            <span>រក្សាទុក ({savedCourses.length})</span>
          </button>
        </div>

        {/* Tab 1: In Progress */}
        {activeTab === 'in-progress' && (
          <div className="space-y-6">
            {inProgressList.length === 0 ? (
              <div className="text-center py-16 bg-white rounded-3xl border border-slate-200 p-8 space-y-4">
                <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center mx-auto text-emerald-600">
                  <BookOpen className="w-8 h-8" />
                </div>
                <h3 className="text-lg font-bold text-slate-900">No courses in progress</h3>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  Browse our course catalog to discover exciting topics in AI, healthy mobility, arts, and languages.
                </p>
                <Link
                  href="/courses"
                  className="inline-block px-5 py-2.5 bg-emerald-600 text-white rounded-xl font-bold text-xs shadow hover:bg-emerald-700"
                >
                  Explore Course Catalog
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {inProgressList.map(enrollment => {
                  const course = enrollment.course;
                  if (!course) return null;
                  return (
                    <div
                      key={enrollment.id}
                      className="bg-white rounded-3xl border border-slate-200/90 p-5 shadow-sm hover:shadow-lg transition flex flex-col justify-between space-y-4"
                    >
                      <div className="flex gap-4">
                        <img
                          src={course.thumbnail}
                          alt={course.title}
                          className="w-24 h-24 rounded-2xl object-cover shrink-0 shadow-sm"
                        />
                        <div className="space-y-1 min-w-0">
                          <span className="text-[11px] font-bold text-emerald-700 uppercase tracking-wider">
                            {course.category}
                          </span>
                          <h3 className="text-sm font-bold text-slate-900 line-clamp-2">
                            {course.title}
                          </h3>
                          <p className="text-xs text-slate-500">
                            {course.duration} • {course.format}
                          </p>
                        </div>
                      </div>

                      {/* Progress Bar */}
                      <div className="space-y-2 pt-2 border-t border-slate-100">
                        <div className="flex justify-between items-center text-xs">
                          <span className="font-semibold text-slate-600">
                            {enrollment.completedLessonIds.length} lessons finished
                          </span>
                          <span className="font-bold text-emerald-700">
                            {enrollment.progressPercentage}%
                          </span>
                        </div>
                        <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                          <div
                            className="bg-emerald-600 h-full rounded-full transition-all duration-500"
                            style={{ width: `${enrollment.progressPercentage}%` }}
                          />
                        </div>
                      </div>

                      <div className="flex flex-col sm:flex-row gap-2">
                        <Link
                          href={`/learn/${course.slug}`}
                          className="flex-1 py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-2 shadow transition"
                        >
                          <PlayCircle className="w-4 h-4" />
                          <span>Resume Course</span>
                        </Link>
                        <Link
                          href={`/assessments/${course.slug}`}
                          className="flex-1 py-2.5 px-4 rounded-xl border border-emerald-300 text-emerald-800 hover:bg-emerald-50 font-bold text-xs flex items-center justify-center gap-2 transition"
                        >
                          <Award className="w-4 h-4" />
                          <span>តេស្ត កិច្ចការផ្ទះ & ប្រឡង</span>
                        </Link>
                        <RegistrationLink courseSlug={course.slug} registration={registrations.find(r => r.courseId === course.id)} />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Completed */}
        {activeTab === 'completed' && (
          <div className="space-y-6">
            {completedList.length === 0 ? (
              <div className="text-center py-16 bg-white rounded-3xl border border-slate-200 p-8 space-y-4">
                <div className="w-16 h-16 bg-amber-50 rounded-full flex items-center justify-center mx-auto text-amber-600">
                  <Award className="w-8 h-8" />
                </div>
                <h3 className="text-lg font-bold text-slate-900">No completed courses yet</h3>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  When you complete 100% of the lessons in a course, your official certificate will appear here!
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {completedList.map(enrollment => {
                  const course = enrollment.course;
                  if (!course) return null;
                  return (
                    <div
                      key={enrollment.id}
                      className="bg-white rounded-3xl border border-emerald-200/90 p-5 shadow-sm hover:shadow-lg transition flex flex-col justify-between space-y-4"
                    >
                      <div className="flex gap-4">
                        <img
                          src={course.thumbnail}
                          alt={course.title}
                          className="w-24 h-24 rounded-2xl object-cover shrink-0 shadow-sm"
                        />
                        <div className="space-y-1 min-w-0">
                          <div className="flex items-center gap-1.5 text-xs text-emerald-700 font-bold">
                            <CheckCircle className="w-4 h-4 text-emerald-600" />
                            <span>Course Completed 100%</span>
                          </div>
                          <h3 className="text-sm font-bold text-slate-900 line-clamp-2">
                            {course.title}
                          </h3>
                          <p className="text-xs text-slate-500">
                            {course.ceus} Continuing Education Units Awarded
                          </p>
                        </div>
                      </div>

                      <div className="pt-2 border-t border-slate-100 flex flex-col sm:flex-row gap-3">
                        {enrollment.certificateId ? (
                          <Link
                            href={`/certificate/${enrollment.certificateId}`}
                            className="flex-1 py-2.5 px-4 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs flex items-center justify-center gap-2 shadow transition"
                          >
                            <Award className="w-4 h-4" />
                            <span>View Digital Certificate</span>
                          </Link>
                        ) : (
                          <Link
                            href={`/learn/${course.slug}`}
                            className="flex-1 py-2.5 px-4 rounded-xl bg-emerald-600 text-white font-bold text-xs text-center"
                          >
                            Claim Certificate
                          </Link>
                        )}

                        <Link
                          href={`/learn/${course.slug}`}
                          className="py-2.5 px-4 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-50 font-semibold text-xs text-center"
                        >
                          Review Syllabus
                        </Link>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Tab 3: Saved courses */}
        {activeTab === 'saved' && (
          savedCourses.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-3xl border border-slate-200 p-8 space-y-3">
              <Heart className="w-10 h-10 text-rose-300 mx-auto" />
              <p className="text-sm text-slate-500">មិនទាន់មានវគ្គដែលបានរក្សាទុកទេ។ ចុច ❤️ លើវគ្គណាមួយ ដើម្បីរក្សាទុក។</p>
              <Link href="/courses" className="inline-block px-5 py-2.5 bg-emerald-600 text-white rounded-xl font-bold text-xs hover:bg-emerald-700">មើលវគ្គសិក្សា</Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {savedCourses.map(course => <CourseCard key={course.id} course={course} />)}
            </div>
          )
        )}
      </div>
    </div>
  );
}
