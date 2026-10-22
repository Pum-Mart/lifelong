'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Course } from '@/types';
import CourseCard from '@/components/CourseCard';
import { Search, Filter, SlidersHorizontal, BookOpen, RotateCcw } from 'lucide-react';
import { CATEGORIES } from '@/lib/data';

function CoursesContent() {
  const searchParams = useSearchParams();
  const initialCategory = searchParams.get('category') || 'all';
  const initialSearch = searchParams.get('search') || '';

  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState(initialSearch);
  const [selectedCategory, setSelectedCategory] = useState(initialCategory);
  const [selectedFormat, setSelectedFormat] = useState('all');
  const [selectedLevel, setSelectedLevel] = useState('all');
  const [sortBy, setSortBy] = useState('popular');

  useEffect(() => {
    async function fetchCourses() {
      try {
        setLoading(true);
        const res = await fetch('/api/courses');
        const data = await res.json();
        if (data.success) {
          setCourses(data.courses);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    fetchCourses();
  }, []);

  // Filter and sort courses
  const filteredCourses = courses.filter(course => {
    // Category
    if (selectedCategory !== 'all' && course.category !== selectedCategory) {
      return false;
    }
    // Format
    if (selectedFormat !== 'all' && course.format !== selectedFormat) {
      return false;
    }
    // Level
    if (selectedLevel !== 'all' && course.level !== selectedLevel) {
      return false;
    }
    // Search
    if (search.trim()) {
      const q = search.toLowerCase();
      const matchTitle = course.title.toLowerCase().includes(q);
      const matchSub = course.subtitle.toLowerCase().includes(q);
      const matchTags = course.tags.some(t => t.toLowerCase().includes(q));
      if (!matchTitle && !matchSub && !matchTags) return false;
    }
    return true;
  }).sort((a, b) => {
    if (sortBy === 'rating') return b.rating - a.rating;
    if (sortBy === 'price-low') return a.price - b.price;
    if (sortBy === 'price-high') return b.price - a.price;
    return b.enrolledStudentsCount - a.enrolledStudentsCount; // default popular
  });

  const resetFilters = () => {
    setSearch('');
    setSelectedCategory('all');
    setSelectedFormat('all');
    setSelectedLevel('all');
    setSortBy('popular');
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12 space-y-10">
      {/* Header */}
      <div className="space-y-3">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold">
          <BookOpen className="w-3.5 h-3.5" />
          <span>Course Catalog</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
          Lifelong Learning Curriculum
        </h1>
        <p className="text-slate-600 text-sm sm:text-base max-w-2xl">
          Browse our complete roster of continuing education programs. All courses include lifetime access, downloadable materials, interactive quizzes, and accredited certificates of completion.
        </p>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-5 rounded-3xl border border-slate-200/90 shadow-sm space-y-5">
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
          {/* Search Input */}
          <div className="relative w-full md:w-96">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by topic, instructor, or skill..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 text-xs sm:text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-slate-50/50"
            />
            {search && (
              <button 
                onClick={() => setSearch('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600"
              >
                Clear
              </button>
            )}
          </div>

          {/* Sort Dropdown */}
          <div className="flex items-center gap-2 w-full md:w-auto justify-end">
            <SlidersHorizontal className="w-4 h-4 text-slate-400" />
            <span className="text-xs text-slate-500 font-medium whitespace-nowrap">Sort by:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="text-xs font-semibold px-3 py-2 rounded-xl border border-slate-200 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="popular">Most Popular</option>
              <option value="rating">Highest Rated</option>
              <option value="price-low">Price: Low to High</option>
              <option value="price-high">Price: High to Low</option>
            </select>
          </div>
        </div>

        {/* Category Pills */}
        <div className="flex flex-wrap gap-2 pt-2 border-t border-slate-100">
          {CATEGORIES.map(cat => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
                selectedCategory === cat.id
                  ? 'bg-emerald-700 text-white shadow-sm'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>

        {/* Secondary Filters: Format and Level */}
        <div className="flex flex-wrap items-center gap-4 pt-2 text-xs text-slate-600">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-500">Format:</span>
            <select
              value={selectedFormat}
              onChange={(e) => setSelectedFormat(e.target.value)}
              className="px-2.5 py-1 rounded-lg border border-slate-200 bg-slate-50 font-medium"
            >
              <option value="all">All Formats</option>
              <option value="Online Self-Paced">Online Self-Paced</option>
              <option value="Live Webinar">Live Webinar</option>
              <option value="In-Person Workshop">In-Person Workshop</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-500">Level:</span>
            <select
              value={selectedLevel}
              onChange={(e) => setSelectedLevel(e.target.value)}
              className="px-2.5 py-1 rounded-lg border border-slate-200 bg-slate-50 font-medium"
            >
              <option value="all">All Levels</option>
              <option value="Beginner">Beginner</option>
              <option value="Intermediate">Intermediate</option>
              <option value="All Levels">All Levels (Open)</option>
            </select>
          </div>

          {(selectedCategory !== 'all' || selectedFormat !== 'all' || selectedLevel !== 'all' || search) && (
            <button
              onClick={resetFilters}
              className="ml-auto text-xs text-red-600 hover:text-red-700 flex items-center gap-1 font-semibold"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Reset All Filters</span>
            </button>
          )}
        </div>
      </div>

      {/* Results Count */}
      <div className="flex items-center justify-between text-xs text-slate-500">
        <span>Showing <strong>{filteredCourses.length}</strong> {filteredCourses.length === 1 ? 'course' : 'courses'}</span>
        {selectedCategory !== 'all' && (
          <span className="bg-emerald-50 text-emerald-700 font-semibold px-2 py-0.5 rounded">
            Filtered by: {selectedCategory}
          </span>
        )}
      </div>

      {/* Course Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <div key={i} className="h-96 bg-slate-100 rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : filteredCourses.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-3xl border border-slate-200 p-8 space-y-4">
          <div className="w-16 h-16 bg-slate-100 text-slate-400 rounded-full flex items-center justify-center mx-auto">
            <Filter className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold text-slate-900">No courses match your filters</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Try resetting your search terms or choosing a different category to see available courses.
          </p>
          <button
            onClick={resetFilters}
            className="px-5 py-2 rounded-xl bg-emerald-600 text-white font-bold text-xs hover:bg-emerald-700 shadow"
          >
            Reset Filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredCourses.map(course => (
            <CourseCard key={course.id} course={course} />
          ))}
        </div>
      )}
    </div>
  );
}

export default function CoursesPage() {
  return (
    <Suspense fallback={<div className="max-w-7xl mx-auto p-12 text-center text-slate-400">Loading Course Catalog...</div>}>
      <CoursesContent />
    </Suspense>
  );
}
