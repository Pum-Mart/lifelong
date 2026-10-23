'use client';

import React from 'react';
import Link from 'next/link';
import { Course } from '@/types';
import { useApp } from '@/context/AppContext';
import { Star, Clock, BookOpen, Award, CheckCircle, Heart, ShoppingBag, Calendar } from 'lucide-react';
import { formatClassDays, formatClassTime } from '@/lib/schedule';

interface CourseCardProps {
  course: Course;
}

export default function CourseCard({ course }: CourseCardProps) {
  const { buyCourse, pendingCourseIds, enrollments, bookmarks, toggleBookmark } = useApp();

  const isEnrolled = enrollments.some(e => e.courseId === course.id);
  const userEnrollment = enrollments.find(e => e.courseId === course.id);
  const isPending = pendingCourseIds.includes(course.id);
  const isBookmarked = bookmarks.includes(course.id);

  return (
    <div className="group bg-white rounded-2xl border border-slate-200/90 shadow-sm hover:shadow-xl hover:border-emerald-200 transition-all duration-300 flex flex-col overflow-hidden">
      {/* Thumbnail Container */}
      <div className="relative aspect-[16/10] overflow-hidden bg-slate-100">
        <img
          src={course.thumbnail}
          alt={course.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />

        {/* Top Badges */}
        <div className="absolute top-3 left-3 flex flex-wrap gap-1.5 z-10">
          {course.badge && (
            <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-amber-500 text-slate-950 shadow-md">
              {course.badge}
            </span>
          )}
          <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-900/80 backdrop-blur-md text-white">
            {course.format}
          </span>
        </div>

        {/* Bookmark Button */}
        <button
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            toggleBookmark(course.id);
          }}
          className="absolute top-3 right-3 p-2 rounded-full bg-white/90 backdrop-blur-md shadow-md text-slate-700 hover:text-red-500 transition hover:scale-110 z-10"
          title={isBookmarked ? 'Remove bookmark' : 'Save course'}
        >
          <Heart className={`w-4 h-4 ${isBookmarked ? 'fill-red-500 text-red-500' : ''}`} />
        </button>

        {/* Level tag at bottom */}
        <div className="absolute bottom-3 left-3 z-10">
          <span className="px-2 py-0.5 rounded-md text-[11px] font-medium bg-slate-900/70 text-slate-200 backdrop-blur-sm">
            {course.level}
          </span>
        </div>
      </div>

      {/* Course Info */}
      <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
        <div>
          {/* Category & Rating */}
          <div className="flex items-center justify-between text-xs text-slate-500 mb-1.5">
            <span className="font-semibold text-emerald-700 uppercase tracking-wider text-[11px]">
              {course.category}
            </span>
            <div className="flex items-center gap-1 text-slate-700">
              <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
              <span className="font-bold text-xs">{course.rating}</span>
              <span className="text-slate-400">({course.reviewsCount})</span>
            </div>
          </div>

          {/* Title */}
          <Link href={`/courses/${course.slug}`}>
            <h3 className="text-base font-bold text-slate-900 group-hover:text-emerald-700 transition line-clamp-2 leading-snug">
              {course.title}
            </h3>
          </Link>

          {/* Subtitle */}
          <p className="text-xs text-slate-500 line-clamp-2 mt-1.5">
            {course.subtitle}
          </p>

          {/* Details Row: duration & CEUs */}
          <div className="flex items-center gap-3 text-xs text-slate-600 mt-3 pt-3 border-t border-slate-100">
            <div className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-slate-400" />
              <span>{course.duration}</span>
            </div>
            <div className="flex items-center gap-1">
              <BookOpen className="w-3.5 h-3.5 text-slate-400" />
              <span>{course.lecturesCount} lessons</span>
            </div>
            {course.classStartTime && (
              <div className="flex items-center gap-1" title={formatClassDays(course.classDays)}>
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                <span>{formatClassTime(course.classStartTime, course.classEndTime)}</span>
              </div>
            )}
            {course.ceus && (
              <div className="flex items-center gap-1 text-indigo-600 font-semibold ml-auto">
                <Award className="w-3.5 h-3.5" />
                <span>{course.ceus} CEUs</span>
              </div>
            )}
          </div>
        </div>

        {/* Footer: Price and Enrollment Button */}
        <div className="pt-2">
          {isEnrolled ? (
            <div className="space-y-2">
              <div className="flex justify-between items-center text-xs">
                <span className="font-semibold text-emerald-800 flex items-center gap-1">
                  <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                  {userEnrollment?.isCompleted ? 'Completed' : 'Enrolled'}
                </span>
                <span className="font-bold text-slate-700">{userEnrollment?.progressPercentage}%</span>
              </div>
              <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                <div
                  className="bg-emerald-600 h-full rounded-full transition-all duration-500"
                  style={{ width: `${userEnrollment?.progressPercentage || 0}%` }}
                />
              </div>
              <Link
                href={`/learn/${course.slug}`}
                className="w-full block text-center py-2 px-3 rounded-xl bg-emerald-50 text-emerald-800 hover:bg-emerald-100 font-bold text-xs transition"
              >
                {userEnrollment?.isCompleted ? 'Review Course & Certificate' : 'Continue Learning →'}
              </Link>
            </div>
          ) : (
            <div className="flex items-center justify-between gap-3">
              <div className="flex flex-col">
                <div className="flex items-baseline gap-1.5">
                  <span className="text-xl font-extrabold text-slate-900">
                    ${course.price}
                  </span>
                  {course.originalPrice > course.price && (
                    <span className="text-xs line-through text-slate-400">
                      ${course.originalPrice}
                    </span>
                  )}
                </div>
                <span className="text-[11px] text-slate-400">Full Lifetime Access</span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => buyCourse(course)}
                  disabled={isPending}
                  className={`py-2 px-3.5 rounded-xl font-bold text-xs flex items-center gap-1.5 transition ${
                    isPending
                      ? 'bg-amber-100 text-amber-800 cursor-default'
                      : 'bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white shadow-md shadow-emerald-600/20'
                  }`}
                >
                  <ShoppingBag className="w-3.5 h-3.5" />
                  <span>{isPending ? 'រង់ចាំផ្ទៀងផ្ទាត់' : 'ចុះឈ្មោះ'}</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
