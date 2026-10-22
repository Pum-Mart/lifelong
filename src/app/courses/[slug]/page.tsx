'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Course } from '@/types';
import { useApp } from '@/context/AppContext';
import { 
  Star, 
  Clock, 
  BookOpen, 
  Award, 
  ShieldCheck, 
  CheckCircle, 
  PlayCircle, 
  ChevronDown, 
  ChevronUp, 
  User, 
  Share2, 
  Heart, 
  ArrowLeft,
  Sparkles,
  Lock,
  Globe,
  Calendar
} from 'lucide-react';

function CourseDetailContent() {
  const params = useParams();
  const slug = params?.slug as string;
  const router = useRouter();

  const { addToCart, cart, buyCourse, pendingCourseIds, enrollments, bookmarks, toggleBookmark, currentUser, showNotification } = useApp();
  const [course, setCourse] = useState<Course | null>(null);
  const [loading, setLoading] = useState(true);
  const [openModules, setOpenModules] = useState<{ [key: string]: boolean }>({});

  useEffect(() => {
    async function loadCourse() {
      try {
        setLoading(true);
        const res = await fetch(`/api/courses/${slug}`);
        const data = await res.json();
        if (data.success && data.course) {
          setCourse(data.course);
          // Open first module by default
          if (data.course.modules && data.course.modules.length > 0) {
            setOpenModules({ [data.course.modules[0].id]: true });
          }
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    if (slug) {
      loadCourse();
    }
  }, [slug]);

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 text-center space-y-4">
        <div className="w-12 h-12 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-slate-500 text-sm">កំពុងផ្ទុកព័ត៌មានវគ្គសិក្សា...</p>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 text-center space-y-4">
        <h2 className="text-2xl font-bold text-slate-800">រកមិនឃើញវគ្គសិក្សា</h2>
        <p className="text-slate-500 text-sm">វគ្គសិក្សានេះប្រហែលជាត្រូវបានផ្លាស់ប្តូរ ឬលុបចេញ។</p>
        <Link href="/#courses" className="inline-block px-5 py-2.5 bg-emerald-600 text-white rounded-xl font-bold text-xs">
          ត្រឡប់ទៅបញ្ជីវគ្គសិក្សា
        </Link>
      </div>
    );
  }

  const isEnrolled = enrollments.some(e => e.courseId === course.id);
  const isInCart = cart.some(item => item.courseId === course.id);
  const isPending = pendingCourseIds.includes(course.id);
  const isBookmarked = bookmarks.includes(course.id);

  const totalLessons = course.modules.reduce((n, m) => n + m.lessons.length, 0);

  const toggleModule = (modId: string) => {
    setOpenModules(prev => ({ ...prev, [modId]: !prev[modId] }));
  };

  const handleCopyLink = async () => {
    const url = `${window.location.origin}/courses/${course.slug}`;
    try {
      await navigator.clipboard.writeText(url);
      showNotification('បានចម្លងតំណវគ្គសិក្សា! អាចផ្ញើទៅអ្នកសិក្សាបាន។');
    } catch {
      showNotification(url, 'info');
    }
  };

  const handleInstantEnroll = async () => {
    if (isEnrolled) {
      router.push(`/learn/${course.slug}`);
      return;
    }
    // Free courses enroll now; paid ones open the bank payment popup
    const success = await buyCourse(course);
    if (success) {
      router.push(`/learn/${course.slug}`);
    }
  };

  return (
    <div className="space-y-12 pb-20">
      {/* Header Banner */}
      <section className="bg-gradient-to-b from-slate-900 to-slate-950 text-white pt-10 pb-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          {/* Breadcrumbs */}
          <div className="flex items-center gap-2 text-xs text-slate-400 mb-6">
            <Link href="/" className="hover:text-emerald-400">ទំព័រដើម</Link>
            <span>/</span>
            <Link href="/#courses" className="hover:text-emerald-400">វគ្គសិក្សា</Link>
            <span>/</span>
            <span className="text-slate-200">{course.category}</span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
            {/* Left 2 Cols: Main Info */}
            <div className="lg:col-span-2 space-y-5">
              <div className="flex flex-wrap items-center gap-2">
                {course.badge && (
                  <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-500 text-slate-950">
                    {course.badge}
                  </span>
                )}
                <span className="px-3 py-1 rounded-full text-xs font-semibold bg-emerald-900/60 border border-emerald-500/30 text-emerald-300">
                  {course.format}
                </span>
                <span className="px-3 py-1 rounded-full text-xs font-semibold bg-slate-800 text-slate-300">
                  {course.level}
                </span>
              </div>

              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold leading-relaxed text-white">
                {course.title}
              </h1>

              <p className="text-base sm:text-lg text-slate-300 leading-relaxed">
                {course.subtitle}
              </p>

              {/* Rating & Enrollment Meta */}
              <div className="flex flex-wrap items-center gap-6 text-xs text-slate-300 pt-2 border-t border-slate-800">
                <div className="flex items-center gap-1.5">
                  <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                  <span className="font-extrabold text-white text-sm">{course.rating}</span>
                  <span className="text-slate-400">({course.reviewsCount} មតិ)</span>
                </div>
                <div>
                  <span className="font-bold text-white">{course.enrolledStudentsCount.toLocaleString()}</span>
                  <span className="text-slate-400 ml-1">នាក់បានចុះឈ្មោះ</span>
                </div>
                <div className="flex items-center gap-1">
                  <BookOpen className="w-4 h-4 text-emerald-400" />
                  <span>{totalLessons} មេរៀន</span>
                </div>
                <div className="flex items-center gap-1">
                  <Clock className="w-4 h-4 text-emerald-400" />
                  <span>{course.duration}</span>
                </div>
                {course.ceus && (
                  <div className="flex items-center gap-1 text-emerald-300 font-bold">
                    <Award className="w-4 h-4" />
                    <span>{course.ceus} CEUs</span>
                  </div>
                )}
              </div>

              {/* Instructor snippet */}
              {course.instructor && (
                <div className="flex items-center gap-3 pt-3">
                  <img
                    src={course.instructor.avatar}
                    alt={course.instructor.name}
                    className="w-12 h-12 rounded-full object-cover ring-2 ring-emerald-500/30"
                  />
                  <div>
                    <div className="text-xs text-slate-400">បង្រៀនដោយ</div>
                    <div className="text-sm font-bold text-white">{course.instructor.name}</div>
                    <div className="text-xs text-emerald-400">{course.instructor.title}</div>
                  </div>
                </div>
              )}
            </div>

            {/* Right Col: Desktop Enrollment Card Preview */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-3xl p-6 text-slate-900 shadow-2xl border border-slate-200 space-y-6">
                {/* Thumbnail opens the first lesson */}
                <Link
                  href={`/learn/${course.slug}?lesson=${course.modules[0]?.lessons[0]?.id || ''}`}
                  className="relative aspect-video rounded-2xl overflow-hidden cursor-pointer group bg-slate-900 block"
                >
                  <img 
                    src={course.thumbnail} 
                    alt={course.title} 
                    className="w-full h-full object-cover group-hover:opacity-80 transition"
                  />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-14 h-14 rounded-full bg-white/90 text-emerald-700 flex items-center justify-center shadow-lg group-hover:scale-110 transition">
                      <PlayCircle className="w-8 h-8 fill-current" />
                    </div>
                  </div>
                  <div className="absolute bottom-2 left-2 bg-black/70 text-white text-[10px] px-2 py-0.5 rounded font-semibold">
                    សាកល្បងរៀនមេរៀនទី ១
                  </div>
                </Link>

                {/* Price */}
                <div className="flex items-baseline justify-between">
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-black text-slate-900">
                      {course.price === 0 ? <span className="text-emerald-700 text-2xl">ឥតគិតថ្លៃ</span> : `$${course.price}`}
                    </span>
                    {course.originalPrice > course.price && (
                      <span className="text-sm line-through text-slate-400">
                        ${course.originalPrice}
                      </span>
                    )}
                  </div>
                  {course.originalPrice > course.price && (
                    <span className="text-xs font-bold px-2 py-1 bg-emerald-100 text-emerald-800 rounded-lg">
                      សន្សំ {Math.round(((course.originalPrice - course.price) / course.originalPrice) * 100)}%
                    </span>
                  )}
                </div>

                {/* Action CTA Buttons */}
                <div className="space-y-3">
                  {isEnrolled ? (
                    <Link
                      href={`/learn/${course.slug}`}
                      className="w-full py-3.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-lg text-center block transition"
                    >
                      បន្តការរៀន →
                    </Link>
                  ) : (
                    <>
                      {isPending ? (
                        <div className="w-full py-3.5 px-4 rounded-xl bg-amber-100 text-amber-800 font-bold text-sm text-center">
                          បានបង់ប្រាក់ • រង់ចាំការផ្ទៀងផ្ទាត់
                        </div>
                      ) : (
                        <button
                          onClick={handleInstantEnroll}
                          className="w-full py-3.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-[0.99] text-white font-bold text-sm shadow-lg shadow-emerald-600/25 flex items-center justify-center gap-2 transition"
                        >
                          <span>{course.price > 0 ? `ចុះឈ្មោះ និងបង់ប្រាក់ • $${course.price}` : 'ចុះឈ្មោះ និងចាប់ផ្តើមរៀន'}</span>
                        </button>
                      )}

                      <button
                        onClick={() => addToCart(course)}
                        disabled={isInCart}
                        className={`w-full py-2.5 px-4 rounded-xl font-bold text-xs border transition ${
                          isInCart
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-200 cursor-default'
                            : 'border-slate-300 text-slate-700 hover:bg-slate-50'
                        }`}
                      >
                        {isInCart ? 'មានក្នុងកន្ត្រករួចហើយ' : 'ដាក់ក្នុងកន្ត្រក'}
                      </button>
                    </>
                  )}

                  <button
                    onClick={() => toggleBookmark(course.id)}
                    aria-pressed={isBookmarked}
                    className={`w-full py-2.5 px-4 rounded-xl font-bold text-xs border flex items-center justify-center gap-2 transition ${
                      isBookmarked ? 'bg-rose-50 text-rose-700 border-rose-200' : 'border-slate-300 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <Heart className={`w-4 h-4 ${isBookmarked ? 'fill-rose-500 text-rose-500' : ''}`} />
                    {isBookmarked ? 'បានរក្សាទុក' : 'រក្សាទុកវគ្គនេះ'}
                  </button>

                  <button
                    onClick={handleCopyLink}
                    className="w-full py-2.5 px-4 rounded-xl font-bold text-xs border border-slate-300 text-slate-700 hover:bg-slate-50 flex items-center justify-center gap-2 transition"
                  >
                    <Share2 className="w-4 h-4" />
                    <span>ចម្លងតំណវគ្គសិក្សា</span>
                  </button>
                </div>

                {/* Features List */}
                <div className="space-y-2.5 text-xs text-slate-600 pt-3 border-t border-slate-100">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-emerald-600" />
                    <span>រយៈពេលសិក្សា {course.duration}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <BookOpen className="w-4 h-4 text-emerald-600" />
                    <span>{totalLessons} មេរៀន មានខ្លឹមសារ លំហាត់អនុវត្ត និងសំណួរសាកល្បង</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Award className="w-4 h-4 text-emerald-600" />
                    <span>វិញ្ញាបនបត្របញ្ចប់ការសិក្សាដែលអាចផ្ទៀងផ្ទាត់បាន</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-emerald-600" />
                    <span>រៀនតាមល្បឿនផ្ទាល់ខ្លួន លើទូរស័ព្ទ ឬកុំព្យូទ័រ</span>
                  </div>
                </div>

                <div className="text-center pt-2">
                  <span className="text-[11px] text-slate-500">
                    កូដបញ្ចុះតម្លៃសម្រាប់មនុស្សចាស់ <strong className="text-emerald-700">SENIOR30</strong> (៣០%)
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content Details */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          <div className="lg:col-span-2 space-y-12">
            {/* What You'll Learn Box */}
            <div className="p-8 rounded-3xl bg-emerald-50/70 border border-emerald-200/80 space-y-4">
              <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-emerald-600" />
                <span>អ្វីដែលអ្នកនឹងទទួលបានពីវគ្គនេះ</span>
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 pt-2">
                {course.learningOutcomes.map((outcome, idx) => (
                  <div key={idx} className="flex items-start gap-2.5 text-xs sm:text-sm text-slate-800">
                    <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <span>{outcome}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Course Description */}
            <div className="space-y-4">
              <h3 className="text-2xl font-bold text-slate-900">ទិដ្ឋភាពទូទៅនៃវគ្គសិក្សា</h3>
              <div className="prose prose-slate max-w-none text-slate-600 text-sm sm:text-base leading-relaxed space-y-4">
                <p>{course.description}</p>
              </div>
            </div>

            {/* Interactive Curriculum / Syllabus */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-2xl font-bold text-slate-900">កម្មវិធីសិក្សា និងមេរៀន</h3>
                  <p className="text-xs text-slate-500">
                    {course.modules.length} ផ្នែក • {totalLessons} មេរៀន • {course.duration}
                  </p>
                </div>
                <button
                  onClick={() => {
                    const allOpen = Object.keys(openModules).length === course.modules.length;
                    if (allOpen) {
                      setOpenModules({});
                    } else {
                      const all: Record<string, boolean> = {};
                      course.modules.forEach(m => all[m.id] = true);
                      setOpenModules(all);
                    }
                  }}
                  className="text-xs font-semibold text-emerald-700 hover:underline"
                >
                  {Object.keys(openModules).length === course.modules.length ? 'បិទទាំងអស់' : 'បើកទាំងអស់'}
                </button>
              </div>

              <div className="space-y-3">
                {course.modules.map((mod, modIdx) => {
                  const isOpen = openModules[mod.id];
                  return (
                    <div key={mod.id} className="border border-slate-200 rounded-2xl overflow-hidden bg-white shadow-sm">
                      <button
                        onClick={() => toggleModule(mod.id)}
                        className="w-full p-4 text-left flex items-center justify-between bg-slate-50 hover:bg-slate-100/80 transition"
                      >
                        <div>
                          <div className="font-bold text-sm text-slate-900">
                            {mod.title}
                          </div>
                          <div className="text-xs text-slate-500 mt-0.5">
                            {mod.lessons.length} មេរៀន • {mod.description}
                          </div>
                        </div>
                        {isOpen ? <ChevronUp className="w-5 h-5 text-slate-400" /> : <ChevronDown className="w-5 h-5 text-slate-400" />}
                      </button>

                      {isOpen && (
                        <div className="divide-y divide-slate-100">
                          {mod.lessons.map(lesson => (
                            <Link
                              key={lesson.id}
                              href={`/learn/${course.slug}?lesson=${lesson.id}`}
                              className="p-4 flex items-center justify-between gap-3 hover:bg-emerald-50/60 text-xs text-slate-700 transition"
                            >
                              <div className="flex items-center gap-3 min-w-0">
                                <PlayCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                                <div className="min-w-0">
                                  <div className="font-semibold text-slate-900 leading-relaxed">
                                    {lesson.title}
                                  </div>
                                  <div className="text-[11px] text-slate-400 leading-relaxed">
                                    {lesson.summary}
                                  </div>
                                </div>
                              </div>

                              <div className="flex items-center gap-3 shrink-0">
                                {lesson.isFreePreview && (
                                  <span className="px-2 py-0.5 rounded text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200">
                                    រៀនសាកល្បង
                                  </span>
                                )}
                                <span className="text-slate-400 whitespace-nowrap">{lesson.duration}</span>
                              </div>
                            </Link>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Instructor Profile */}
            {course.instructor && (
              <div className="p-8 rounded-3xl bg-white border border-slate-200 space-y-6">
                <h3 className="text-xl font-bold text-slate-900">គ្រូបង្រៀន</h3>
                <div className="flex flex-col sm:flex-row gap-6 items-start">
                  {/* 4x6 portrait */}
                  <img
                    src={course.instructor.avatar}
                    alt={course.instructor.name}
                    className="w-32 aspect-[2/3] rounded-2xl object-cover shrink-0 shadow-md ring-2 ring-emerald-500/20 mx-auto sm:mx-0"
                  />
                  <div className="space-y-3">
                    <div>
                      <h4 className="text-lg font-bold text-slate-900">{course.instructor.name}</h4>
                      <p className="text-xs text-emerald-700 font-semibold">{course.instructor.title}</p>
                    </div>

                    {course.instructor.bio && (
                      <div className="space-y-1">
                        <div className="text-xs font-bold text-slate-800">ប្រវត្តិរូបសង្ខេប</div>
                        <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">{course.instructor.bio}</p>
                      </div>
                    )}

                    {course.instructor.experience && (
                      <div className="space-y-1">
                        <div className="text-xs font-bold text-slate-800">បទពិសោធន៍បង្រៀន</div>
                        <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">{course.instructor.experience}</p>
                      </div>
                    )}

                    <div className="flex flex-wrap gap-2 pt-1">
                      {course.instructor.credentials.map((cred, i) => (
                        <span key={i} className="px-2.5 py-1 rounded-md bg-slate-100 text-slate-700 text-[11px] font-medium">
                          {cred}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Prerequisites & Target Audience */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="p-6 rounded-2xl bg-white border border-slate-200 space-y-3">
                <h4 className="font-bold text-slate-900 text-sm">លក្ខខណ្ឌមុនចូលរៀន</h4>
                <ul className="space-y-2 text-xs text-slate-600">
                  {course.prerequisites.map((p, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 mt-1.5 shrink-0" />
                      <span>{p}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="p-6 rounded-2xl bg-white border border-slate-200 space-y-3">
                <h4 className="font-bold text-slate-900 text-sm">វគ្គនេះសម្រាប់អ្នកណា?</h4>
                <ul className="space-y-2 text-xs text-slate-600">
                  {course.targetAudience.map((t, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-indigo-600 mt-1.5 shrink-0" />
                      <span>{t}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function CourseDetailPage() {
  return (
    <React.Suspense fallback={<div className="max-w-7xl mx-auto py-24 text-center text-slate-500">កំពុងផ្ទុកព័ត៌មានវគ្គសិក្សា...</div>}>
      <CourseDetailContent />
    </React.Suspense>
  );
}
