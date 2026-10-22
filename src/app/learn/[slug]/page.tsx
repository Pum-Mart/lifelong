'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Course, Lesson, Enrollment, Certificate } from '@/types';
import { useApp } from '@/context/AppContext';
import {
  CheckCircle,
  Circle,
  Award,
  BookOpen,
  ArrowLeft,
  ArrowRight,
  HelpCircle,
  FileText,
  MessageSquare,
  Share2,
  Lightbulb,
  PencilLine,
  Lock
} from 'lucide-react';
import confetti from 'canvas-confetti';
import QuizRunner from '@/components/QuizRunner';
import LessonDownload from '@/components/LessonDownload';

function LearnContent() {
  const params = useParams();
  const slug = params?.slug as string;
  const searchParams = useSearchParams();
  const lessonParam = searchParams.get('lesson');

  const { currentUser, refreshEnrollments, showNotification, buyCourse, pendingCourseIds } = useApp();

  const [course, setCourse] = useState<Course | null>(null);
  const [currentLesson, setCurrentLesson] = useState<Lesson | null>(null);
  const [userEnrollment, setUserEnrollment] = useState<Enrollment | null>(null);
  const [activeTab, setActiveTab] = useState<'lesson' | 'quiz' | 'discussion'>('lesson');
  const [loading, setLoading] = useState(true);


  // Completion modal
  const [earnedCertificate, setEarnedCertificate] = useState<Certificate | null>(null);
  const [showCelebrationModal, setShowCelebrationModal] = useState(false);

  useEffect(() => {
    async function loadCourseAndEnrollment() {
      try {
        setLoading(true);
        const [courseRes, enrollRes] = await Promise.all([
          fetch(`/api/courses/${slug}`),
          // Guests get 401 here and simply have no enrollment
          fetch('/api/enrollments')
        ]);

        const courseData = await courseRes.json();
        const enrollData = await enrollRes.json();

        if (courseData.success && courseData.course) {
          const loadedCourse: Course = courseData.course;
          setCourse(loadedCourse);

          // Find current user enrollment
          let enrollment = enrollData.enrollments?.find(
            (e: Enrollment) => e.courseId === loadedCourse.id
          );

          // Free courses enroll automatically; paid courses need an approved payment
          if (!enrollment && loadedCourse.price === 0 && currentUser) {
            const autoRes = await fetch('/api/enrollments', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ courseId: loadedCourse.id })
            });
            const autoData = await autoRes.json();
            if (autoData.success) {
              enrollment = autoData.enrollment;
            }
          }

          setUserEnrollment(enrollment);

          // Open the lesson from the link (?lesson=...), else the saved lesson, else the first
          const allLessons: Lesson[] = [];
          loadedCourse.modules.forEach(m => m.lessons.forEach(l => allLessons.push(l)));

          const activeLesson =
            allLessons.find(l => l.id === lessonParam) ||
            allLessons.find(l => l.id === enrollment?.currentLessonId) ||
            allLessons[0];
          setCurrentLesson(activeLesson);

          // If already completed and has certificate
          if (enrollment?.isCompleted && enrollment?.certificateId) {
            const certRes = await fetch(`/api/certificates/${enrollment.certificateId}`);
            const certData = await certRes.json();
            if (certData.success) {
              setEarnedCertificate(certData.certificate);
            }
          }
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    if (slug) {
      loadCourseAndEnrollment();
    }
  }, [slug, currentUser?.id]);

  const allLessons: Lesson[] = [];
  if (course) {
    course.modules.forEach(m => m.lessons.forEach(l => allLessons.push(l)));
  }

  const currentLessonIndex = allLessons.findIndex(l => l.id === currentLesson?.id);
  const prevLesson = currentLessonIndex > 0 ? allLessons[currentLessonIndex - 1] : null;
  const nextLesson = currentLessonIndex < allLessons.length - 1 ? allLessons[currentLessonIndex + 1] : null;

  const isCurrentCompleted = userEnrollment?.completedLessonIds.includes(currentLesson?.id || '') || false;

  const goToLesson = (lesson: Lesson) => {
    setCurrentLesson(lesson);
    setActiveTab('lesson');
    window.history.replaceState(null, '', `/learn/${slug}?lesson=${lesson.id}`);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Discussion: the question goes to the course's teachers and admins
  const [question, setQuestion] = useState('');
  const [sendingQuestion, setSendingQuestion] = useState(false);
  const sendQuestion = async () => {
    if (!course || !currentLesson) return;
    if (!currentUser) {
      showNotification('សូមចូលគណនីជាមុនសិន', 'info');
      return;
    }
    setSendingQuestion(true);
    try {
      const res = await fetch(`/api/lessons/${course.id}/${currentLesson.id}/question`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question })
      });
      const data = await res.json();
      if (data.success) {
        setQuestion('');
        showNotification('សំណួររបស់អ្នកត្រូវបានផ្ញើទៅគ្រូទទួលបន្ទុកហើយ! ចម្លើយនឹងមកដល់ប្រអប់លិខិតរបស់អ្នក។');
      } else {
        showNotification(data.error || 'ផ្ញើមិនបានទេ', 'warning');
      }
    } finally {
      setSendingQuestion(false);
    }
  };

  const handleCopyLink = async () => {
    const url = `${window.location.origin}/learn/${slug}${currentLesson ? `?lesson=${currentLesson.id}` : ''}`;
    try {
      await navigator.clipboard.writeText(url);
      showNotification('បានចម្លងតំណមេរៀន! អាចផ្ញើទៅអ្នកសិក្សាបាន។');
    } catch {
      showNotification(url, 'info');
    }
  };

  const handleToggleComplete = async () => {
    if (!course || !currentLesson || !userEnrollment) return;

    const newCompleted = !isCurrentCompleted;

    try {
      const res = await fetch('/api/enrollments/progress', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          courseId: course.id,
          lessonId: currentLesson.id,
          completed: newCompleted
        })
      });

      const data = await res.json();
      if (data.success) {
        setUserEnrollment(data.enrollment);
        await refreshEnrollments();

        if (newCompleted) {
          showNotification('មេរៀនត្រូវបានកត់ត្រាថាបានបញ្ចប់!');
        }

        // If newly completed whole course
        if (data.newCertificate) {
          setEarnedCertificate(data.newCertificate);
          setShowCelebrationModal(true);
          try {
            confetti({
              particleCount: 150,
              spread: 90,
              origin: { y: 0.6 }
            });
          } catch (e) {
            console.error(e);
          }
        }
      }
    } catch (err) {
      console.error('Error toggling progress:', err);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 text-white flex flex-col items-center justify-center space-y-4">
        <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-slate-400 text-sm">កំពុងបើកបន្ទប់រៀន...</p>
      </div>
    );
  }

  if (!course || !currentLesson) {
    return (
      <div className="max-w-4xl mx-auto py-20 px-4 text-center space-y-4">
        <h2 className="text-2xl font-bold">រកមិនឃើញវគ្គសិក្សា</h2>
        <Link href="/#courses" className="px-4 py-2 bg-emerald-600 text-white rounded-xl text-xs font-bold inline-block">
          ត្រឡប់ទៅបញ្ជីវគ្គសិក្សា
        </Link>
      </div>
    );
  }

  // Paid course without an approved payment: only free-preview lessons are open
  if (!userEnrollment && course.price > 0 && !currentLesson.isFreePreview) {
    const isPending = pendingCourseIds.includes(course.id);
    const previewLesson = allLessons.find(l => l.isFreePreview);
    return (
      <div className="max-w-xl mx-auto py-20 px-4 text-center space-y-5">
        <div className="w-16 h-16 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center mx-auto">
          <Lock className="w-8 h-8" />
        </div>
        <h2 className="font-moul text-xl text-slate-900 leading-relaxed">{course.title}</h2>
        {isPending ? (
          <p className="text-sm text-slate-600 leading-relaxed">
            យើងបានទទួលការបង់ប្រាក់របស់អ្នក ហើយកំពុងផ្ទៀងផ្ទាត់។ មេរៀននឹងបើក បន្ទាប់ពីការអនុម័ត។
          </p>
        ) : (
          <>
            <p className="text-sm text-slate-600 leading-relaxed">
              មេរៀននេះសម្រាប់សិស្សដែលបានចុះឈ្មោះ។ សូមបង់ប្រាក់ ${course.price} ដើម្បីចូលរៀនវគ្គពេញលេញ។
            </p>
            <button
              onClick={() => buyCourse(course)}
              className="px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-lg"
            >
              ចុះឈ្មោះ និងបង់ប្រាក់ • ${course.price}
            </button>
          </>
        )}
        <div className="flex justify-center gap-4 text-xs">
          {previewLesson && (
            <button onClick={() => goToLesson(previewLesson)} className="text-emerald-700 font-semibold hover:underline">
              សាកល្បងរៀនមេរៀនឥតគិតថ្លៃ
            </button>
          )}
          <Link href={`/courses/${course.slug}`} className="text-slate-500 hover:underline">ព័ត៌មានវគ្គសិក្សា</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      {/* Course Completion Confetti Modal */}
      {showCelebrationModal && earnedCertificate && (
        <div className="fixed inset-0 z-50 bg-black/85 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-emerald-500/50 rounded-3xl p-8 max-w-lg w-full text-center space-y-6 shadow-2xl relative">
            <div className="w-20 h-20 bg-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center mx-auto border border-emerald-400/40">
              <Award className="w-12 h-12" />
            </div>

            <div className="space-y-2">
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">
                សូមអបអរសាទរ!
              </span>
              <h2 className="text-2xl font-extrabold text-white">
                អ្នកបានបញ្ចប់វគ្គសិក្សា ១០០%
              </h2>
              <p className="text-xs text-slate-300 leading-relaxed">
                <strong>{currentUser?.name}</strong> បានរៀនចប់គ្រប់មេរៀនទាំងអស់នៃវគ្គ <em>{course.title}</em>។
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-800/80 border border-slate-700 text-xs text-slate-300 space-y-1">
              <div>លេខកូដវិញ្ញាបនបត្រ: <strong className="font-mono text-emerald-400">{earnedCertificate.certificateCode}</strong></div>
              <div>ក្រេឌីត: <strong>{earnedCertificate.ceus} CEUs</strong></div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link
                href={`/certificate/${earnedCertificate.id}`}
                className="px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-lg transition"
              >
                មើលវិញ្ញាបនបត្រ
              </Link>
              <button
                onClick={() => setShowCelebrationModal(false)}
                className="px-6 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs transition"
              >
                បន្តរំលឹកមេរៀន
              </button>
            </div>
          </div>
        </div>
      )}

      {/* LMS Header Bar */}
      <div className="border-b border-slate-800 bg-slate-900/90 px-4 sm:px-6 py-3 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <Link
            href={`/courses/${course.slug}`}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition shrink-0"
            title="ត្រឡប់ទៅទំព័រវគ្គសិក្សា"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div className="min-w-0">
            <h1 className="text-sm font-bold text-white line-clamp-1">{course.title}</h1>
            <div className="text-[11px] text-emerald-400 flex items-center gap-2">
              <span>{course.category}</span>
              <span>•</span>
              <span>បានបញ្ចប់ {userEnrollment?.progressPercentage || 0}%</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={handleCopyLink}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 border border-slate-700 text-slate-300 hover:bg-slate-700 text-xs font-bold transition"
            title="ចម្លងតំណមេរៀននេះ"
          >
            <Share2 className="w-4 h-4" />
            <span className="hidden sm:inline">ចម្លងតំណ</span>
          </button>

          {earnedCertificate && (
            <Link
              href={`/certificate/${earnedCertificate.id}`}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-900/60 border border-emerald-500/40 text-emerald-300 hover:bg-emerald-900 text-xs font-bold transition"
            >
              <Award className="w-4 h-4 text-amber-400" />
              <span className="hidden sm:inline">វិញ្ញាបនបត្រ</span>
            </Link>
          )}

          <div className="hidden sm:block w-24 md:w-36 bg-slate-800 h-2 rounded-full overflow-hidden">
            <div
              className="bg-emerald-500 h-full rounded-full transition-all duration-500"
              style={{ width: `${userEnrollment?.progressPercentage || 0}%` }}
            />
          </div>
        </div>
      </div>

      {/* LMS Main Layout: Lesson Left, Syllabus Right */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
        <div className="flex-1 flex flex-col overflow-y-auto">
          {/* Video (only when the lesson has one) */}
          {currentLesson.videoUrl && (
            <div className="bg-black aspect-video w-full max-h-[65vh] relative flex items-center justify-center">
              <video
                key={currentLesson.id}
                src={currentLesson.videoUrl}
                controls
                autoPlay={false}
                className="w-full h-full object-contain"
              />
            </div>
          )}

          {/* Lesson Title & Completion Bar */}
          <div className="p-4 sm:p-6 bg-slate-900 border-b border-slate-800 flex flex-wrap items-center justify-between gap-4">
            <div>
              <div className="text-xs text-emerald-400 font-semibold">
                មេរៀនទី {currentLessonIndex + 1} នៃ {allLessons.length}
              </div>
              <h2 className="text-lg sm:text-xl font-bold text-white mt-0.5 leading-relaxed">
                {currentLesson.title}
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                រយៈពេល: {currentLesson.duration}
              </p>
            </div>

            <button
              onClick={handleToggleComplete}
              className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition ${
                isCurrentCompleted
                  ? 'bg-emerald-600 text-white shadow'
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700'
              }`}
            >
              <CheckCircle className={`w-4 h-4 ${isCurrentCompleted ? 'text-white' : 'text-slate-400'}`} />
              <span>{isCurrentCompleted ? 'បានបញ្ចប់ ✓' : 'កត់ត្រាថាបានរៀនចប់'}</span>
            </button>
          </div>

          {/* Tabs: Lesson, Quiz, Discussion */}
          <div className="p-4 sm:p-6 space-y-6">
            <div className="flex border-b border-slate-800 gap-4 overflow-x-auto">
              <button
                onClick={() => setActiveTab('lesson')}
                className={`pb-3 text-xs font-bold flex items-center gap-2 border-b-2 transition whitespace-nowrap ${
                  activeTab === 'lesson'
                    ? 'border-emerald-500 text-emerald-400'
                    : 'border-transparent text-slate-400 hover:text-white'
                }`}
              >
                <FileText className="w-4 h-4" />
                <span>ខ្លឹមសារមេរៀន</span>
              </button>

              {currentLesson.quiz && currentLesson.quiz.length > 0 && (
                <button
                  onClick={() => setActiveTab('quiz')}
                  className={`pb-3 text-xs font-bold flex items-center gap-2 border-b-2 transition whitespace-nowrap ${
                    activeTab === 'quiz'
                      ? 'border-emerald-500 text-emerald-400'
                      : 'border-transparent text-slate-400 hover:text-white'
                  }`}
                >
                  <HelpCircle className="w-4 h-4" />
                  <span>សំណួរសាកល្បង</span>
                </button>
              )}

              <button
                onClick={() => setActiveTab('discussion')}
                className={`pb-3 text-xs font-bold flex items-center gap-2 border-b-2 transition whitespace-nowrap ${
                  activeTab === 'discussion'
                    ? 'border-emerald-500 text-emerald-400'
                    : 'border-transparent text-slate-400 hover:text-white'
                }`}
              >
                <MessageSquare className="w-4 h-4" />
                <span>សួរគ្រូ</span>
              </button>
            </div>

            {/* Tab 1: Lesson content */}
            {activeTab === 'lesson' && (
              <div className="space-y-5 max-w-3xl">
                <LessonDownload courseId={course.id} lessonId={currentLesson.id} />
                <p className="text-sm text-slate-300 leading-relaxed">{currentLesson.summary}</p>

                {currentLesson.content && currentLesson.content.length > 0 && (
                  <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
                    <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
                      <BookOpen className="w-4 h-4 text-emerald-400" />
                      <span>ខ្លឹមសារសំខាន់</span>
                    </h4>
                    <ol className="space-y-3">
                      {currentLesson.content.map((point, idx) => (
                        <li key={idx} className="flex items-start gap-3 text-sm text-slate-200 leading-relaxed">
                          <span className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                            {idx + 1}
                          </span>
                          <span>{point}</span>
                        </li>
                      ))}
                    </ol>
                  </div>
                )}

                <div className="p-5 rounded-2xl bg-amber-500/10 border border-amber-500/30 space-y-2">
                  <h4 className="text-xs font-bold text-amber-300 uppercase tracking-wider flex items-center gap-2">
                    <Lightbulb className="w-4 h-4" />
                    <span>ចំណុចគន្លឹះត្រូវចងចាំ</span>
                  </h4>
                  <p className="text-sm text-slate-200 leading-relaxed">{currentLesson.notes}</p>
                </div>

                {currentLesson.activity && (
                  <div className="p-5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 space-y-2">
                    <h4 className="text-xs font-bold text-emerald-300 uppercase tracking-wider flex items-center gap-2">
                      <PencilLine className="w-4 h-4" />
                      <span>លំហាត់អនុវត្ត</span>
                    </h4>
                    <p className="text-sm text-slate-200 leading-relaxed">{currentLesson.activity}</p>
                  </div>
                )}

                {currentLesson.quiz && currentLesson.quiz.length > 0 && (
                  <button
                    onClick={() => setActiveTab('quiz')}
                    className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-2 transition"
                  >
                    <HelpCircle className="w-4 h-4" />
                    <span>ធ្វើសំណួរសាកល្បង</span>
                  </button>
                )}
              </div>
            )}

            {/* Tab 2: Quiz — homework graded on the server */}
            {activeTab === 'quiz' && currentLesson.quiz && (
              <div className="space-y-4 max-w-2xl">
                {userEnrollment ? (
                  <QuizRunner
                    key={currentLesson.id}
                    courseId={course.id}
                    kind="homework"
                    lessonId={currentLesson.id}
                    questions={currentLesson.quiz.map(q => ({ id: q.id, question: q.question, options: q.options }))}
                    dark
                    submitLabel="បញ្ជូនកិច្ចការផ្ទះ"
                  />
                ) : (
                  <p className="p-4 rounded-2xl bg-slate-900 border border-slate-800 text-sm text-slate-300">សូមចុះឈ្មោះចូលរៀនវគ្គនេះ ដើម្បីធ្វើកិច្ចការផ្ទះ។</p>
                )}
                <Link href={`/assessments/${course.slug}`} className="inline-flex items-center gap-2 text-xs font-bold text-amber-300 hover:underline">
                  តេស្តមុនចូលរៀន • កិច្ចការផ្ទះទាំងអស់ • ប្រឡង • វិញ្ញាបនបត្រ →
                </Link>
              </div>
            )}
            {/* Tab 3: Discussion */}
            {activeTab === 'discussion' && (
              <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4 max-w-2xl">
                <h4 className="text-sm font-bold text-white">សួរគ្រូ ឬមិត្តរួមថ្នាក់</h4>
                <textarea
                  value={question}
                  onChange={e => setQuestion(e.target.value)}
                  placeholder="សរសេរសំណួរ ឬការយល់ឃើញរបស់អ្នកអំពីមេរៀននេះ..."
                  className="w-full h-24 p-3 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
                <button
                  onClick={sendQuestion}
                  disabled={sendingQuestion || question.trim().length < 3}
                  className="px-4 py-2 bg-emerald-600 text-white rounded-xl text-xs font-bold hover:bg-emerald-500 disabled:opacity-50"
                >
                  {sendingQuestion ? 'កំពុងផ្ញើ...' : 'ផ្ញើសំណួរទៅគ្រូ'}
                </button>
                {!currentUser && <p className="text-[11px] text-slate-400">សូមចូលគណនី ដើម្បីផ្ញើសំណួរ។</p>}
              </div>
            )}

            {/* Previous / Next */}
            <div className="flex items-center justify-between gap-3 pt-4 border-t border-slate-800 max-w-3xl">
              {prevLesson ? (
                <button
                  onClick={() => goToLesson(prevLesson)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold flex items-center gap-1.5 border border-slate-700 transition"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>មេរៀនមុន</span>
                </button>
              ) : <span />}

              {nextLesson && (
                <button
                  onClick={() => goToLesson(nextLesson)}
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1.5 transition"
                >
                  <span>មេរៀនបន្ទាប់</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Right Syllabus Sidebar */}
        <div className="w-full lg:w-80 border-t lg:border-t-0 lg:border-l border-slate-800 bg-slate-900/70 overflow-y-auto p-4 space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              មាតិកាវគ្គសិក្សា
            </h3>
            <span className="text-xs text-emerald-400 font-semibold">
              {userEnrollment?.completedLessonIds.length || 0} / {allLessons.length} មេរៀន
            </span>
          </div>

          <div className="space-y-4">
            {course.modules.map(mod => (
              <div key={mod.id} className="space-y-1.5">
                <div className="text-[11px] font-bold text-slate-400 px-2 leading-relaxed">
                  {mod.title}
                </div>
                <div className="space-y-1">
                  {mod.lessons.map(lesson => {
                    const isCompleted = userEnrollment?.completedLessonIds.includes(lesson.id);
                    const isActive = currentLesson.id === lesson.id;
                    return (
                      <button
                        key={lesson.id}
                        onClick={() => goToLesson(lesson)}
                        className={`w-full text-left p-2.5 rounded-xl text-xs transition flex items-center justify-between ${
                          isActive
                            ? 'bg-emerald-600 text-white font-bold shadow-md'
                            : 'hover:bg-slate-800 text-slate-300'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          {isCompleted ? (
                            <CheckCircle className={`w-4 h-4 shrink-0 ${isActive ? 'text-white' : 'text-emerald-400'}`} />
                          ) : (
                            <Circle className={`w-4 h-4 shrink-0 ${isActive ? 'text-white' : 'text-slate-600'}`} />
                          )}
                          <span className="truncate">{lesson.title}</span>
                        </div>
                        <span className={`text-[10px] shrink-0 ml-2 ${isActive ? 'text-emerald-100' : 'text-slate-500'}`}>
                          {lesson.duration}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function LearnPage() {
  return (
    <React.Suspense fallback={<div className="min-h-screen bg-slate-950 text-white flex items-center justify-center">កំពុងបើកបន្ទប់រៀន...</div>}>
      <LearnContent />
    </React.Suspense>
  );
}
