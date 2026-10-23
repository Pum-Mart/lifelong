'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useApp } from '@/context/AppContext';
import { Course, WorkshopEvent, Certificate, AdminAnalytics, Announcement, LibraryResource } from '@/types';
import { CATEGORIES } from '@/lib/data';
import AnnouncementTicker from '@/components/AnnouncementTicker';
import { 
  GraduationCap, 
  BookOpen, 
  PlayCircle, 
  Award, 
  Calendar, 
  ShieldCheck, 
  Search, 
  Star, 
  Clock, 
  CheckCircle, 
  Circle, 
  Users, 
  DollarSign, 
  TrendingUp, 
  Plus, 
  Printer, 
  ArrowRight, 
  ArrowLeft,
  Sparkles, 
  Check, 
  HelpCircle, 
  FileText, 
  Video, 
  Building2, 
  ShoppingBag,
  Layers, 
  Heart, 
  ChevronDown, 
  Trash2, 
  UserCheck, 
  RotateCcw,
  Sprout,
  Briefcase,
  Wrench,
  Download,
  Eye,
  ExternalLink,
  MapPin,
  Phone,
  Mail,
  Send,
  HeartHandshake,
  BookMarked,
  Globe,
  Lightbulb,
  MessageSquare,
  Info,
  BadgeCheck,
  Megaphone,
  Landmark,
  Share2,
  X
} from 'lucide-react';
import confetti from 'canvas-confetti';
import DropLogo from '@/components/DropLogo';

// Library documents come from /api/content/resources (managed at /admin/content)
const RESOURCE_TYPE_NAMES: Record<string, string> = {
  guides: 'សៀវភៅណែនាំ (Guide)',
  curricula: 'កម្មវិធីសិក្សា (Curriculum)',
  toolkits: 'កញ្ចប់ឧបករណ៍ (Toolkit)',
  publications: 'ការបោះពុម្ពផ្សាយ (Publication)',
  teaching: 'សម្ភារឧបទេស (Teaching Materials)'
};

const formatSize = (bytes: number) => (bytes >= 1048576 ? ` MB` : ` KB`);

// Partners of the centre, as provided by the centre
const PARTNERS = [
  { name: 'អង្គការឌីវីវីអន្តរជាតិ', english: 'DVV International', icon: '🌍', color: 'bg-sky-100' },
  { name: 'អង្គការទិន្នន័យអំពីការអភិវឌ្ឍន៍កម្ពុជា', english: '', icon: '📊', color: 'bg-emerald-100' },
  { name: 'អង្គការកួយហៃ', english: '', icon: '🤝', color: 'bg-amber-100' }
];

export default function UnifiedPlatformPage() {
  const { 
    currentUser,
    cart, 
    addToCart, 
    setIsCartOpen,
    enrollments,
    pendingCourseIds,
    buyCourse,
    showNotification,
    requireLogin
  } = useApp();

  // Courses & Data state
  const [courses, setCourses] = useState<Course[]>([]);
  const [events, setEvents] = useState<WorkshopEvent[]>([]);
  const [adminStats, setAdminStats] = useState<AdminAnalytics | null>(null);
  const [loading, setLoading] = useState(true);

  // Certificate showcase state
  const [certificateData, setCertificateData] = useState<Certificate | null>(null);

  // Library documents (admin-managed)
  const [resources, setResources] = useState<LibraryResource[]>([]);
  useEffect(() => {
    fetch('/api/content/resources')
      .then(res => res.json())
      .then(data => {
        if (data.success) setResources(data.resources);
      })
      .catch(err => console.error(err));
  }, []);

  // Two newest published announcements for the News section
  const [latestAnnouncements, setLatestAnnouncements] = useState<Announcement[]>([]);
  useEffect(() => {
    fetch('/api/content/announcements')
      .then(res => res.json())
      .then(data => {
        if (data.success) setLatestAnnouncements(data.announcements.slice(0, 2));
      })
      .catch(err => console.error(err));
  }, []);

  // Filter & Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  // Workshops state
  const [rsvpdEventIds, setRsvpdEventIds] = useState<string[]>([]);

  // Library Resources filter state
  const [resourceSearch, setResourceSearch] = useState('');
  const [selectedResourceType, setSelectedResourceType] = useState('all');

  // Contact form state
  const [contactName, setContactName] = useState('');
  const [contactInfo, setContactInfo] = useState('');
  const [contactSubject, setContactSubject] = useState('ទូទៅ');
  const [contactMessage, setContactMessage] = useState('');
  const [isSendingContact, setIsSendingContact] = useState(false);

  // Volunteer Modal state
  const [isVolunteerModalOpen, setIsVolunteerModalOpen] = useState(false);
  const [volunteerName, setVolunteerName] = useState('');
  const [volunteerSkill, setVolunteerSkill] = useState('ជំនាញឌីជីថល');
  const [volunteerPhone, setVolunteerPhone] = useState('');

  // Admin New Course Form state
  const [newCourseTitle, setNewCourseTitle] = useState('');
  const [newCourseCategory, setNewCourseCategory] = useState('Digital Skills');
  const [newCoursePrice, setNewCoursePrice] = useState(0);
  const [isSubmittingCourse, setIsSubmittingCourse] = useState(false);

  // Smooth scroll helper
  const scrollToSection = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  // Listen to hash changes from navbar
  useEffect(() => {
    const handleHash = () => {
      const hash = window.location.hash.replace('#', '');
      if (hash) {
        scrollToSection(hash);
      }
    };
    window.addEventListener('hashchange', handleHash);
    if (window.location.hash) {
      handleHash();
    }
    return () => window.removeEventListener('hashchange', handleHash);
  }, []);

  // Load all initial data
  async function loadInitialData() {
    try {
      setLoading(true);
      const [coursesRes, eventsRes, statsRes, certRes] = await Promise.all([
        fetch('/api/courses'),
        fetch('/api/events'),
        fetch('/api/admin/stats'),
        fetch('/api/certificates/cert-1001')
      ]);

      const coursesJson = await coursesRes.json();
      const eventsJson = await eventsRes.json();
      const statsJson = await statsRes.json();
      const certJson = await certRes.json();

      if (coursesJson.success && coursesJson.courses && coursesJson.courses.length > 0) {
        setCourses(coursesJson.courses);
      }

      if (eventsJson.success) {
        setEvents(eventsJson.events);
        setRsvpdEventIds(eventsJson.rsvpdEventIds || []);
      }
      if (statsJson.success) setAdminStats(statsJson.stats);
      if (certJson.success && certJson.certificate) {
        setCertificateData(certJson.certificate);
      } else {
        setCertificateData({
          id: 'cert-1001',
          certificateCode: 'LLC-2026-883492',
          studentName: currentUser?.name || 'Sok Sophea',
          studentEmail: currentUser?.email || '',
          courseId: 'course-1',
          courseTitle: 'Generative AI & ChatGPT: ផលិតភាព និងគំនិតច្នៃប្រឌិតប្រចាំថ្ងៃ',
          instructorName: 'លោកបណ្ឌិត ម៉ាកុស វ៉ាន់ (Dr. Marcus Vance)',
          issueDate: 'October 16, 2026',
          ceus: 2.0,
          grade: 'Distinction (Honors)',
          verificationUrl: '/certificate/cert-1001'
        });
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadInitialData();
  }, [currentUser]);

  // Filter courses
  const filteredCourses = courses.filter(course => {
    if (selectedCategory !== 'all' && course.category !== selectedCategory) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        course.title.toLowerCase().includes(q) ||
        course.subtitle.toLowerCase().includes(q) ||
        course.category.toLowerCase().includes(q)
      );
    }
    return true;
  });

  // Filter resources
  const filteredResources = resources.filter(res => {
    if (selectedResourceType !== 'all' && res.type !== selectedResourceType) return false;
    if (resourceSearch.trim()) {
      const q = resourceSearch.toLowerCase();
      return (
        res.title.toLowerCase().includes(q) ||
        res.description.toLowerCase().includes(q) ||
        res.category.toLowerCase().includes(q)
      );
    }
    return true;
  });

  // RSVP: saved on the server (seat count + Telegram notice to the centre)
  const handleRSVP = async (event: WorkshopEvent) => {
    if (rsvpdEventIds.includes(event.id)) return;
    if (event.seatsBooked >= event.seatsTotal) {
      showNotification('សិក្ខាសាលានេះពេញហើយ', 'warning');
      return;
    }
    if (!requireLogin()) return;
    try {
      const res = await fetch('/api/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ eventId: event.id })
      });
      const data = await res.json();
      if (!data.success) {
        showNotification(data.error || 'កក់កន្លែងមិនបានទេ', 'warning');
        return;
      }
      setRsvpdEventIds(prev => [...prev, event.id]);
      setEvents(prev => prev.map(e => (e.id === event.id ? data.event : e)));
      if (data.alreadyBooked) return;
      confetti({ particleCount: 50, spread: 50 });
      showNotification(`អ្នកបានកក់កន្លែងចូលរួម "${event.title}" ដោយជោគជ័យ!`);
    } catch {
      showNotification('មិនអាចភ្ជាប់ទៅម៉ាស៊ីនមេបានទេ', 'warning');
    }
  };

  // Contact form: stored for admins and sent to the centre's Telegram
  const handleContactSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSendingContact(true);
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ kind: 'contact', name: contactName, contact: contactInfo, subject: contactSubject, message: contactMessage })
      });
      const data = await res.json();
      if (!data.success) {
        showNotification(data.error || 'ផ្ញើសារមិនបានទេ', 'warning');
        return;
      }
      showNotification('សូមអរគុណ! សារ និងសំណួររបស់អ្នកត្រូវបានផ្ញើជូនក្រុមការងារដោយជោគជ័យ។');
      setContactName('');
      setContactInfo('');
      setContactMessage('');
    } catch {
      showNotification('មិនអាចភ្ជាប់ទៅម៉ាស៊ីនមេបានទេ', 'warning');
    } finally {
      setIsSendingContact(false);
    }
  };

  // Volunteer sign-up: stored for admins and sent to the centre's Telegram
  const handleVolunteerSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ kind: 'volunteer', name: volunteerName, contact: volunteerPhone, subject: volunteerSkill, message: `ចង់ជួយជាអ្នកស្ម័គ្រចិត្តផ្នែក ${volunteerSkill}` })
      });
      const data = await res.json();
      if (!data.success) {
        showNotification(data.error || 'ចុះឈ្មោះមិនបានទេ', 'warning');
        return;
      }
      setIsVolunteerModalOpen(false);
      confetti({ particleCount: 80, spread: 70 });
      showNotification(`សូមអរគុណ ${volunteerName}! ការចុះឈ្មោះជាអ្នកស្ម័គ្រចិត្តត្រូវបានទទួល។`);
      setVolunteerName('');
      setVolunteerPhone('');
    } catch {
      showNotification('មិនអាចភ្ជាប់ទៅម៉ាស៊ីនមេបានទេ', 'warning');
    }
  };

  // Resource download: the browser downloads the file; the count updates locally
  const handleDownloadResource = (resource: LibraryResource) => {
    window.location.assign(`/api/content/resources/${resource.id}/download`);
    setResources(prev => prev.map(r => (r.id === resource.id ? { ...r, downloads: r.downloads + 1 } : r)));
  };

  // Admin Create Course
  const handleAddCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCourseTitle.trim()) return;

    try {
      setIsSubmittingCourse(true);
      const res = await fetch('/api/courses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: newCourseTitle,
          subtitle: `វគ្គបណ្តុះបណ្តាលជំនាញជាក់ស្តែងក្នុងផ្នែក ${newCourseCategory}`,
          category: newCourseCategory,
          price: Number(newCoursePrice),
          format: 'Online & Community Hub',
          level: 'Beginner',
          duration: '៤ សប្តាហ៍ (១៦ ម៉ោង)',
          instructorId: 'inst-1',
          thumbnail: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=800&q=80',
          ceus: 2.0
        })
      });

      const data = await res.json();
      if (data.success && data.course) {
        setCourses(prev => [data.course, ...prev]);
        setNewCourseTitle('');
        setNewCoursePrice(0);
        confetti({ particleCount: 60, spread: 60 });
        showNotification(`បានបង្កើតវគ្គសិក្សាថ្មី៖ "${data.course.title}"!`);
      }
    } catch (err) {
      console.error(err);
      showNotification('បរាជ័យក្នុងការបង្កើតវគ្គសិក្សា', 'warning');
    } finally {
      setIsSubmittingCourse(false);
    }
  };

  // Admin Delete Course
  const handleDeleteCourse = async (courseId: string, title: string) => {
    if (!confirm(`តើអ្នកពិតជាចង់លុបវគ្គសិក្សា "${title}" នេះមែនទេ?`)) return;

    try {
      const res = await fetch(`/api/courses/${courseId}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        setCourses(prev => prev.filter(c => c.id !== courseId));
        showNotification(`បានលុបវគ្គសិក្សា "${title}" ដោយជោគជ័យ`);
      }
    } catch (err) {
      console.error(err);
      showNotification('កំហុសក្នុងការលុបវគ្គសិក្សា', 'warning');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-28 font-siemreap">
      {/* ======================================================== */}
      {/* 01 HOME: HERO, ANNOUNCEMENTS, HIGHLIGHTS, OVERVIEW       */}
      {/* ======================================================== */}
      <section id="home" className="relative bg-gradient-to-b from-slate-950 via-slate-900 to-emerald-950 text-white pt-10 pb-16 px-4 sm:px-6 shadow-2xl overflow-hidden border-b border-emerald-500/20">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_var(--tw-gradient-stops))] from-emerald-600/10 via-transparent to-transparent pointer-events-none" />
        
        <div className="max-w-7xl mx-auto space-y-6 text-center relative z-10">
          {/* National Platform Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-900/80 border border-emerald-400/40 text-emerald-300 text-xs font-semibold backdrop-blur-md shadow-lg shadow-emerald-950/50">
            <Sparkles className="w-4 h-4 text-amber-400 animate-pulse" />
            <span>🇰🇭 ក្របខ័ណ្ឌជាតិស្តីពីការសិក្សាពេញមួយជីវិត • National Lifelong Learning Platform</span>
          </div>

          <h1 className="text-2xl sm:text-4xl lg:text-5xl font-moul tracking-normal leading-relaxed max-w-4xl mx-auto text-white drop-shadow-sm">
            មជ្ឈមណ្ឌលសិក្សាពេញមួយជីវិត<br />
            LIFELONG LEARNING CENTER
          </h1>
          <p className="text-slate-300 text-sm sm:text-base max-w-3xl mx-auto leading-relaxed">
            ការអប់រំ និងការអភិវឌ្ឍជំនាញសម្រាប់មនុស្សគ្រប់វ័យ និងគ្រប់កាលៈទេសៈ (Education for Every Age & Stage)។ 
            ពង្រឹងសក្តានុពលសហគមន៍ តាមរយៈជំនាញឌីជីថល អក្ខរកម្ម កសិកម្មឆ្លាតវៃ សហគ្រិនភាព និងជំនាញវិជ្ជាជីវៈ។
          </p>

          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5 max-w-4xl mx-auto pt-2 text-left">
            <div className="bg-white/5 border border-white/10 rounded-2xl p-4 backdrop-blur-sm hover:border-emerald-500/40 transition">
              <div className="text-2xl sm:text-3xl font-black text-white">៨៥+ CLCs</div>
              <div className="text-xs text-slate-400">មជ្ឈមណ្ឌលសិក្សាសហគមន៍</div>
            </div>
            <div className="bg-white/5 border border-white/10 rounded-2xl p-4 backdrop-blur-sm hover:border-emerald-500/40 transition">
              <div className="text-2xl sm:text-3xl font-black text-emerald-400">{courses.length} វគ្គសិក្សា</div>
              <div className="text-xs text-slate-400">៥ វិស័យជំនាញអាទិភាព</div>
            </div>
            <div className="bg-white/5 border border-white/10 rounded-2xl p-4 backdrop-blur-sm hover:border-emerald-500/40 transition">
              <div className="text-2xl sm:text-3xl font-black text-amber-400">១០០% វិញ្ញាបនបត្រ</div>
              <div className="text-xs text-slate-400">ទទួលស្គាល់ CEU Credits</div>
            </div>
            <div className="bg-white/5 border border-white/10 rounded-2xl p-4 backdrop-blur-sm hover:border-emerald-500/40 transition">
              <div className="text-2xl sm:text-3xl font-black text-teal-300">ឥតគិតថ្លៃ & ឧបត្ថម្ភ</div>
              <div className="text-xs text-slate-400">កូដមនុស្សចាស់: SENIOR30</div>
            </div>
          </div>

          {/* Breaking Announcements Marquee */}
          <div className="max-w-4xl mx-auto mt-6 bg-slate-900/90 border border-emerald-500/30 rounded-2xl p-3 flex items-center gap-3 text-xs text-left shadow-lg">
            <span className="px-2.5 py-1 bg-amber-500 text-slate-950 font-bold rounded-lg shrink-0 flex items-center gap-1.5 font-siemreap">
              <Megaphone className="w-3.5 h-3.5" />
              <span>សេចក្តីជូនដំណឹង</span>
            </span>
            <div className="overflow-hidden text-slate-300 font-medium truncate">
              📢 បើកទទួលពាក្យវគ្គថ្មីឥតគិតថ្លៃ៖ ជំនាញឌីជីថល AI & កសិកម្មឆ្លាតវៃ នៅគ្រប់មជ្ឈមណ្ឌលសិក្សាសហគមន៍ (CLC) ទូទាំងប្រទេស! • ទិវាជាតិការសិក្សាពេញមួយជីវិតនឹងប្រព្រឹត្តទៅនាថ្ងៃទី ១៨ ខែវិច្ឆិកា ឆ្នាំ ២០២៦។
            </div>
          </div>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10 space-y-20">

        {/* ======================================================== */}
        {/* 03 COURSES & TRAINING: CATALOG, CLASSROOM LMS, CERT      */}
        {/* ======================================================== */}
        <section id="courses" className="space-y-8 scroll-mt-28 border-t border-slate-200 pt-10">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-slate-200 pb-4">
            <div>
              <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-md">
                <BookOpen className="w-3.5 h-3.5" />
                <span>វគ្គសិក្សា & ការបណ្តុះបណ្តាល (Courses & Training)</span>
              </div>
              <h2 className="text-xl sm:text-2xl lg:text-3xl font-moul text-slate-900 mt-2 leading-relaxed">
                ជំនាញឌីជីថល អក្ខរកម្ម កសិកម្ម សហគ្រិនភាព និងវិជ្ជាជីវៈ
              </h2>
              <p className="text-xs sm:text-sm text-slate-500">
                ជ្រើសរើសវគ្គសិក្សាខាងក្រោម ដើម្បី <strong>«ចូលរៀនបន្ទប់ផ្ទាល់»</strong> ឬដាក់កន្ត្រកទិញ។
              </p>
            </div>

            {/* Search */}
            <div className="relative w-full md:w-80">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="ស្វែងរកតាមចំណងជើង ឬជំនាញ..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-sm"
              />
            </div>
          </div>

          {/* 5 Core Category Filter Pills */}
          <div className="flex flex-wrap gap-2">
            {CATEGORIES.map(cat => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition ${
                  selectedCategory === cat.id
                    ? 'bg-emerald-700 text-white shadow-sm'
                    : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
                }`}
              >
                {cat.name}
              </button>
            ))}
          </div>

          {/* Courses Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredCourses.map(course => {
              const isEnrolled = enrollments.some(e => e.courseId === course.id);
              const lessonCount = course.modules.reduce((n, m) => n + m.lessons.length, 0);
              return (
                <div
                  key={course.id}
                  className="bg-white rounded-3xl border border-slate-200 shadow-sm hover:shadow-xl transition flex flex-col justify-between overflow-hidden group"
                >
                  <Link href={`/courses/${course.slug}`} className="relative aspect-[16/10] overflow-hidden bg-slate-100 block">
                    <img 
                      src={course.thumbnail} 
                      alt={course.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                    />
                    <div className="absolute top-3 left-3 bg-slate-900/80 backdrop-blur-sm text-white px-2.5 py-1 rounded-full text-[11px] font-semibold">
                      {course.format}
                    </div>
                    {course.badge && (
                      <div className="absolute bottom-3 left-3 bg-amber-500 text-slate-950 font-bold px-2.5 py-0.5 rounded text-[11px]">
                        {course.badge}
                      </div>
                    )}
                  </Link>

                  <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                    <div className="space-y-1.5">
                      <div className="flex justify-between items-center text-xs">
                        <span className="font-bold text-emerald-700 text-[11px] uppercase">{course.category}</span>
                        <span className="flex items-center gap-1 font-bold text-slate-700">
                          <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                          {course.rating}
                        </span>
                      </div>
                      <h3 className="font-bold text-slate-900 text-base leading-snug line-clamp-2">
                        <Link href={`/courses/${course.slug}`} className="hover:text-emerald-700 transition">
                          {course.title}
                        </Link>
                      </h3>
                      <p className="text-xs text-slate-500 line-clamp-2">
                        {course.subtitle}
                      </p>
                    </div>

                    <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                      <div>
                        <div className="text-lg font-black text-slate-900">
                          {course.price === 0 ? (
                            <span className="text-emerald-700 font-bold">ឥតគិតថ្លៃ (Free)</span>
                          ) : (
                            `$${course.price}`
                          )}
                        </div>
                        <div className="text-[10px] text-slate-400">{lessonCount} មេរៀន • {course.duration} • {course.ceus} CEUs</div>
                      </div>

                      <div className="flex gap-1.5">
                        <button
                          onClick={() => addToCart(course)}
                          className="p-2 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-100 hover:text-emerald-700 transition"
                          title="ដាក់កន្ត្រកទិញ"
                        >
                          <ShoppingBag className="w-4 h-4" />
                        </button>

                        {isEnrolled || course.price === 0 ? (
                          <Link
                            href={`/learn/${course.slug}`}
                            className="px-3.5 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-emerald-700/20 transition whitespace-nowrap"
                          >
                            <PlayCircle className="w-3.5 h-3.5" />
                            <span>{isEnrolled ? 'រៀនបន្ត' : 'ចូលរៀន'}</span>
                          </Link>
                        ) : pendingCourseIds.includes(course.id) ? (
                          <span className="px-3.5 py-2 rounded-xl bg-amber-100 text-amber-800 font-bold text-xs whitespace-nowrap">
                            រង់ចាំផ្ទៀងផ្ទាត់
                          </span>
                        ) : (
                          <button
                            onClick={() => buyCourse(course)}
                            className="px-3.5 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-emerald-700/20 transition whitespace-nowrap"
                          >
                            <Landmark className="w-3.5 h-3.5" />
                            <span>ចុះឈ្មោះ • ${course.price}</span>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Official Digital Certificate */}
          {certificateData && (
            <div id="certificate" className="space-y-6 pt-6">
              <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-slate-200 pb-4">
                <div>
                  <div className="text-xs font-bold text-emerald-700 uppercase">វិញ្ញាបនបត្រឌីជីថលស្របច្បាប់</div>
                  <h3 className="text-xl sm:text-2xl font-moul text-slate-900 mt-1 leading-relaxed">
                    វិញ្ញាបនបត្រនៃការបញ្ចប់ការសិក្សា
                  </h3>
                </div>

                <button
                  onClick={() => {
                    // Sample certificate: printing is not limited
                    document.documentElement.classList.add('print-allowed');
                    window.addEventListener('afterprint', () => document.documentElement.classList.remove('print-allowed'), { once: true });
                    window.print();
                  }}
                  className="px-5 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs flex items-center gap-2 shadow-md transition self-start sm:self-auto"
                >
                  <Printer className="w-4 h-4" />
                  <span>បោះពុម្ព / រក្សាទុកជា PDF</span>
                </button>
              </div>

              {/* Certificate Frame */}
              <div className="max-w-4xl mx-auto bg-white p-8 sm:p-12 rounded-3xl shadow-xl border-4 border-double border-emerald-900 certificate-card relative text-center space-y-6">
                <div className="space-y-2">
                  <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-emerald-800 to-indigo-950 text-amber-400 flex items-center justify-center mx-auto border-2 border-amber-500 shadow-md">
                    <Award className="w-9 h-9" />
                  </div>
                  <div className="text-xs font-bold uppercase tracking-widest text-emerald-900">
                    NATIONAL ACADEMIC BOARD OF LIFELONG LEARNING CENTER
                  </div>
                  <div className="text-lg sm:text-xl font-moul text-emerald-950 tracking-wide">
                    វិញ្ញាបនបត្របញ្ជាក់ការសិក្សា
                  </div>
                  <h4 className="text-xl sm:text-3xl font-serif font-black text-slate-900">
                    Certificate of Academic Mastery
                  </h4>
                </div>

                <div className="space-y-1 pt-2">
                  <p className="text-xs text-slate-500 italic">ប្រគល់ជូនដោយមោទនភាពចំពោះ</p>
                  <div className="text-3xl sm:text-4xl font-serif font-extrabold text-emerald-950 underline decoration-amber-400 decoration-2">
                    {currentUser?.name || certificateData?.studentName}
                  </div>
                  <p className="text-xs text-slate-500 max-w-lg mx-auto pt-3">
                    សម្រាប់ការបញ្ចប់ដោយជោគជ័យនូវកម្មវិធីសិក្សាពេញមួយជីវិតលើមុខវិជ្ជា៖
                  </p>
                  <div className="text-lg sm:text-xl font-bold text-slate-900 pt-1">
                    {certificateData.courseTitle}
                  </div>
                  <div className="inline-block mt-2 px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 text-xs font-bold border border-emerald-200">
                    {certificateData.ceus} CEUs Awarded • Grade: {certificateData.grade}
                  </div>
                </div>

                {/* Seal and the single signature of the centre director */}
                <div className="pt-8 grid grid-cols-1 sm:grid-cols-2 gap-6 items-end border-t border-slate-200 text-xs">
                  <div className="flex flex-col items-center">
                    <DropLogo width={48} alt="" />
                    <span className="text-[10px] text-slate-400 font-mono mt-1">{certificateData.issueDate}</span>
                  </div>
                  <div className="text-center">
                    <div className="font-serif italic font-bold text-slate-800 min-h-5">{certificateData.signedBy || ''}</div>
                    <div className="border-t border-slate-300 pt-1 text-[11px] text-slate-500">ប្រធានមជ្ឈមណ្ឌលសិក្សាពេញមួយជីវិត</div>
                  </div>
                </div>

                <div className="text-[11px] text-slate-400 border-t border-slate-100 pt-3">
                  លេខកូដចុះបញ្ជីផ្លូវការ: <strong className="font-mono text-slate-700">{certificateData.certificateCode}</strong>
                </div>
              </div>
            </div>
          )}
        </section>

        {/* ======================================================== */}
        {/* 04 NEWS & ACTIVITIES: WORKSHOPS, CAMPAIGNS, STORIES      */}
        {/* ======================================================== */}
        <section id="news" className="space-y-8 scroll-mt-28 border-t border-slate-200 pt-10">
          <div className="border-b border-slate-200 pb-4">
            <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-md">
              <Calendar className="w-3.5 h-3.5" />
              <span>ព័ត៌មាន & សកម្មភាព (News & Activities)</span>
            </div>
            <h2 className="text-xl sm:text-2xl lg:text-3xl font-moul text-slate-900 mt-2 leading-relaxed">
              សិក្ខាសាលាសហគមន៍ យុទ្ធនាការ និងរឿងរ៉ាវជោគជ័យ
            </h2>
            <p className="text-xs sm:text-sm text-slate-500">
              ចូលរួមសិក្ខាសាលាផ្សាយផ្ទាល់ តាមដានយុទ្ធនាការជាតិ និងអានរឿងរ៉ាវបំផុសគំនិតរបស់អ្នកសិក្សាគំរូ។
            </p>
          </div>

          {/* Latest announcements (managed at /admin/content) */}
          {latestAnnouncements.map(a => (
            <Link
              key={a.id}
              href={`/announcements#${a.id}`}
              className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-5 rounded-3xl bg-amber-50 border border-amber-200 hover:shadow-md transition"
            >
              <div className="flex items-start gap-3">
                <Megaphone className="w-6 h-6 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <span className="block text-xs font-bold text-amber-700">សេចក្តីជូនដំណឹងថ្មី • {new Date(a.createdAt).toLocaleDateString('en-GB')}</span>
                  <span className="block font-moul text-sm sm:text-base text-slate-900 leading-relaxed">{a.title}</span>
                </div>
              </div>
              <span className="text-xs font-bold text-emerald-700 shrink-0">អានបន្ថែម →</span>
            </Link>
          ))}

          {/* Live Events Grid */}
          <div className="space-y-4">
            <h3 className="font-moul text-base text-slate-900 leading-relaxed">
              កាលវិភាគសិក្ខាសាលាផ្សាយផ្ទាល់ & គ្លីនិកជំនាញ (Upcoming Live Clinics)
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {events.map(event => {
                const isRSVPed = rsvpdEventIds.includes(event.id);
                return (
                  <div 
                    key={event.id}
                    className="bg-white rounded-3xl border border-slate-200 p-6 flex flex-col justify-between shadow-sm hover:shadow-lg transition space-y-4"
                  >
                    <div className="space-y-3">
                      <div className="flex items-center justify-between text-xs">
                        <span className="px-2.5 py-0.5 rounded-full font-bold bg-emerald-100 text-emerald-800">
                          {event.isFree ? 'ឥតគិតថ្លៃ (Free)' : `$${event.price}`}
                        </span>
                        <span className="text-slate-400 font-medium">{event.format}</span>
                      </div>

                      <h4 className="font-bold text-slate-900 text-base leading-snug">{event.title}</h4>
                      <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">{event.description}</p>

                      <div className="text-xs text-slate-600 space-y-1.5 pt-2 border-t border-slate-100">
                        <div className="flex items-center gap-2">
                          <Calendar className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                          <span>{event.date}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span>{event.time}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span className="truncate">{event.location}</span>
                        </div>
                      </div>
                    </div>

                    <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                      <span className="text-[11px] text-slate-500">
                        នៅសល់: <strong>{event.seatsTotal - event.seatsBooked} កៅអី</strong>
                      </span>
                      <button
                        onClick={() => handleRSVP(event)}
                        disabled={isRSVPed}
                        className={`px-4 py-2 rounded-xl text-xs font-bold transition ${
                          isRSVPed
                            ? 'bg-emerald-100 text-emerald-800 cursor-default'
                            : 'bg-slate-900 hover:bg-emerald-700 text-white shadow'
                        }`}
                      >
                        {isRSVPed ? 'បានកក់រួច ✓' : 'កក់កន្លែង (RSVP)'}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Success Stories (រឿងរ៉ាវជោគជ័យ) */}
          <div className="space-y-4 pt-4">
            <div className="flex items-center justify-between">
              <h3 className="font-moul text-base text-slate-900 leading-relaxed">
                រឿងរ៉ាវជោគជ័យរបស់អ្នកសិក្សា (Learner Success Stories)
              </h3>
              <span className="text-xs text-emerald-700 font-semibold">ការផ្លាស់ប្តូរជីវិតពិត</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
                <div className="flex items-center gap-3">
                  <img 
                    src="https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=200&q=80" 
                    alt="យាយ សុខា" 
                    className="w-12 h-12 rounded-full object-cover ring-2 ring-emerald-500/40"
                  />
                  <div>
                    <h4 className="font-bold text-slate-900 text-sm">លោកយាយ សុខា (អាយុ ៦៦ ឆ្នាំ)</h4>
                    <p className="text-[11px] text-emerald-700 font-semibold">ខេត្តកណ្តាល • ជំនាញស្មាតហ្វូន & AI</p>
                  </div>
                </div>
                <blockquote className="text-xs text-slate-600 italic leading-relaxed">
                  «ពីមុនខ្ញុំខ្លាចប៉ះទូរស័ព្ទណាស់ ព្រោះខ្លាចខូច។ ក្រោយរៀននៅមជ្ឈមណ្ឌល LLLc ខ្ញុំចេះផ្ញើប្រាក់ KHQR ដោយខ្លួនឯង និងចេះសួរ AI រកគន្លឹះដាំផ្កា ធ្វើឱ្យជីវិតខ្ញុំមានក្តីសុខខ្លាំងណាស់!»
                </blockquote>
              </div>

              <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
                <div className="flex items-center gap-3">
                  <img 
                    src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80" 
                    alt="លោក ប៊ុនធឿន" 
                    className="w-12 h-12 rounded-full object-cover ring-2 ring-teal-500/40"
                  />
                  <div>
                    <h4 className="font-bold text-slate-900 text-sm">លោក ប៊ុនធឿន (អាយុ ៤៨ ឆ្នាំ)</h4>
                    <p className="text-[11px] text-teal-700 font-semibold">ខេត្តបាត់ដំបង • កសិកម្មឆ្លាតវៃ</p>
                  </div>
                </div>
                <blockquote className="text-xs text-slate-600 italic leading-relaxed">
                  «ការដំឡើងប្រព័ន្ធដំណក់ទឹកជួយខ្ញុំសន្សំសំចៃទឹក ៧០% និងកាត់បន្ថយកម្លាំងពលកម្ម។ ឥឡូវនេះខ្ញុំអាចដាំបន្លែបានពេញមួយឆ្នាំ សូម្បីតែក្នុងរដូវប្រាំងក្តៅខ្លាំងក៏ដោយ។»
                </blockquote>
              </div>

              <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
                <div className="flex items-center gap-3">
                  <img 
                    src="https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=200&q=80" 
                    alt="អ្នកស្រី ស្រីពៅ" 
                    className="w-12 h-12 rounded-full object-cover ring-2 ring-amber-500/40"
                  />
                  <div>
                    <h4 className="font-bold text-slate-900 text-sm">អ្នកស្រី ស្រីពៅ (អាយុ ៣៥ ឆ្នាំ)</h4>
                    <p className="text-[11px] text-amber-700 font-semibold">ខេត្តសៀមរាប • សហគ្រិនភាពអនឡាញ</p>
                  </div>
                </div>
                <blockquote className="text-xs text-slate-600 italic leading-relaxed">
                  «វគ្គបណ្តុះបណ្តាលទីផ្សារឌីជីថលបានជួយឱ្យសិប្បកម្មតម្បាញសូត្រក្នុងភូមិខ្ញុំមានអ្នកបញ្ជាទិញរាប់រយនាក់តាម TikTok និង Telegram ដោយពុំចាំបាច់ឆ្លងកាត់ឈ្មួញកណ្តាលឡើយ។»
                </blockquote>
              </div>
            </div>
          </div>
        </section>

        {/* ======================================================== */}
        {/* 05 RESOURCES & LIBRARY: GUIDES, CURRICULA, TOOLKITS      */}
        {/* ======================================================== */}
        <section id="resources" className="space-y-8 scroll-mt-28 border-t border-slate-200 pt-10">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-slate-200 pb-4">
            <div>
              <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-md">
                <FileText className="w-3.5 h-3.5" />
                <span>ធនធាន & បណ្ណាល័យឌីជីថល (Resources & Library)</span>
              </div>
              <h2 className="text-xl sm:text-2xl lg:text-3xl font-moul text-slate-900 mt-2 leading-relaxed">
                សៀវភៅណែនាំ កម្មវិធីសិក្សា ឧបករណ៍ និងឯកសារបោះពុម្ព
              </h2>
              <p className="text-xs sm:text-sm text-slate-500">
                ឃ្លាំងឯកសារសាធារណៈសម្រាប់សិស្ស គ្រូឧទ្ទេស និងដៃគូអភិវឌ្ឍន៍ អាចទាញយកដោយសេរី។
              </p>
            </div>

            {/* Library Search */}
            <div className="relative w-full md:w-80">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="ស្វែងរកឯកសារ ឬសៀវភៅ..."
                value={resourceSearch}
                onChange={e => setResourceSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-sm"
              />
            </div>
          </div>

          {/* Resource Type Filter Pills */}
          <div className="flex flex-wrap gap-2">
            {[
              { id: 'all', name: 'ធនធានទាំងអស់' },
              { id: 'guides', name: 'សៀវភៅណែនាំ (Guides)' },
              { id: 'curricula', name: 'កម្មវិធីសិក្សា (Curricula)' },
              { id: 'toolkits', name: 'ឧបករណ៍ (Toolkits)' },
              { id: 'publications', name: 'ការបោះពុម្ព (Publications)' },
              { id: 'teaching', name: 'សម្ភារឧបទេស (Teaching Materials)' }
            ].map(type => (
              <button
                key={type.id}
                onClick={() => setSelectedResourceType(type.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
                  selectedResourceType === type.id
                    ? 'bg-emerald-700 text-white shadow-sm'
                    : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
                }`}
              >
                {type.name}
              </button>
            ))}
          </div>

          {/* Resources Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredResources.map(res => (
              <div 
                key={res.id} 
                className="bg-white rounded-3xl border border-slate-200 p-6 flex flex-col justify-between shadow-sm hover:shadow-lg transition space-y-4"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-xs">
                    <span className="px-2.5 py-0.5 rounded-full font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                      {RESOURCE_TYPE_NAMES[res.type]}
                    </span>
                    <span className="text-[11px] font-mono text-slate-400 font-bold">{res.file ? `${res.file.name.split('.').pop()?.toUpperCase()} • ${formatSize(res.file.size)}` : 'HTML • មគ្គុទ្ទេសក៍វគ្គ'}</span>
                  </div>

                  <h3 className="font-bold text-slate-900 text-sm leading-snug">{res.title}</h3>
                  <p className="text-xs text-slate-500 line-clamp-3 leading-relaxed">{res.description}</p>

                  <div className="text-[11px] text-slate-400 flex items-center gap-3 pt-2 border-t border-slate-100">
                    <span>📥 ទាញយក {res.downloads} ដង</span>
                    <span>🏷️ {res.category}</span>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100 flex gap-2">
                  <button
                    onClick={() => handleDownloadResource(res)}
                    className="flex-1 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow transition"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>ទាញយក (Download)</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ======================================================== */}
        {/* 06 COMMUNITY & PARTNERS: AUTHORITIES, CSOS, VOLUNTEERS   */}
        {/* ======================================================== */}
        <section id="community" className="space-y-8 scroll-mt-28 border-t border-slate-200 pt-10">
          <div className="border-b border-slate-200 pb-4">
            <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-md">
              <Users className="w-3.5 h-3.5" />
              <span>សហគមន៍ & ដៃគូសហការ (Community & Partners)</span>
            </div>
            <h2 className="text-xl sm:text-2xl lg:text-3xl font-moul text-slate-900 mt-2 leading-relaxed">
              អាជ្ញាធរមូលដ្ឋាន សង្គមស៊ីវិល ដៃគូអភិវឌ្ឍន៍ និងអ្នកស្ម័គ្រចិត្ត
            </h2>
            <p className="text-xs sm:text-sm text-slate-500">
              ការរួមសហការគ្នាដើម្បីកសាងសង្គមពុទ្ធិ និងបរិយាបន្នការសិក្សាពេញមួយជីវិតនៅទូទាំងប្រទេសកម្ពុជា។
            </p>
          </div>

          {/* Official partners */}
          <div className="space-y-3">
            <h3 className="font-moul text-base text-slate-900 leading-relaxed">ដៃគូសហការ</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {PARTNERS.map(p => (
                <div key={p.name} className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-xl shrink-0 ${p.color}`}>{p.icon}</div>
                  <div>
                    <div className="font-moul text-sm text-slate-900 leading-relaxed">{p.name}</div>
                    {p.english && <div className="text-xs text-slate-500">{p.english}</div>}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-3">
              <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-800 flex items-center justify-center font-bold">🏛️</div>
              <h3 className="font-moul text-sm text-slate-900 leading-relaxed">អាជ្ញាធរមូលដ្ឋាន</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                កិច្ចសហការជាមួយក្រុមប្រឹក្សាឃុំ-សង្កាត់ មេភូមិ និងគណៈកម្មការ CLC ក្នុងការជំរុញប្រជាជនឱ្យចូលរៀន។
              </p>
            </div>
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-100 text-indigo-800 flex items-center justify-center font-bold">🙋</div>
              <h3 className="font-moul text-sm text-slate-900 leading-relaxed">អ្នកស្ម័គ្រចិត្ត & គ្រូណែនាំ</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                យុវជន និងអ្នកជំនាញស្ម័គ្រចិត្ត ដែលចុះជួយបង្រៀនដល់សហគមន៍។
              </p>
            </div>
          </div>
          {/* Volunteer CTA Box */}
          <div className="bg-gradient-to-r from-emerald-900 via-teal-900 to-slate-950 text-white p-8 rounded-3xl shadow-xl flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="space-y-2 text-center md:text-left">
              <h3 className="text-lg sm:text-xl font-moul text-white leading-relaxed">
                ចូលរួមជាអ្នកស្ម័គ្រចិត្ត ឬអ្នកណែនាំចំណេះដឹង (Become a Mentor)
              </h3>
              <p className="text-xs sm:text-sm text-slate-300 max-w-xl leading-relaxed">
                ប្រសិនបើលោកអ្នកមានជំនាញឌីជីថល កសិកម្ម ឬចំណេះដឹងវិជ្ជាជីវៈ សូមចូលរួមចែករំលែកជាមួយសហគមន៍ដើម្បីបង្កើតផលវិជ្ជមាន។
              </p>
            </div>

            <button
              onClick={() => setIsVolunteerModalOpen(true)}
              className="px-6 py-3 rounded-2xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs whitespace-nowrap shadow-lg transition"
            >
              ចុះឈ្មោះជាអ្នកស្ម័គ្រចិត្ត
            </button>
          </div>
        </section>

        {/* ======================================================== */}
        {/* 07 CONTACT & SUPPORT: ENQUIRIES, FEEDBACK, HOTLINE       */}
        {/* ======================================================== */}
        <section id="contact" className="space-y-8 scroll-mt-28 border-t border-slate-200 pt-10">
          <div className="border-b border-slate-200 pb-4">
            <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-md">
              <Phone className="w-3.5 h-3.5" />
              <span>ទំនាក់ទំនង & ជំនួយបច្ចេកទេស (Contact & Support)</span>
            </div>
            <h2 className="text-xl sm:text-2xl lg:text-3xl font-moul text-slate-900 mt-2 leading-relaxed">
              ព័ត៌មានទំនាក់ទំនង មតិកែលម្អ និងជំនួយបច្ចេកទេស
            </h2>
            <p className="text-xs sm:text-sm text-slate-500">
              មានចម្ងល់ ឬត្រូវការជំនួយបច្ចេកទេសក្នុងការចុះឈ្មោះរៀន? សូមទាក់ទងមកកាន់យើងខ្ញុំគ្រប់ពេលវេលា។
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Contact Details Cards */}
            <div className="space-y-4">
              <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-3">
                <div className="flex items-center gap-2.5 text-emerald-700 font-bold text-sm">
                  <MapPin className="w-5 h-5 shrink-0" />
                  <span>ទីស្នាក់ការកណ្តាល</span>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  វិថីព្រះនរោត្តម សង្កាត់ទន្លេបាសាក់ ខណ្ឌចំការមន រាជធានីភ្នំពេញ (អគារអប់រំពេញមួយជីវិត)
                </p>
              </div>

              <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-3">
                <div className="flex items-center gap-2.5 text-emerald-700 font-bold text-sm">
                  <Phone className="w-5 h-5 shrink-0" />
                  <span>លេខទូរស័ព្ទទាន់ហេតុការណ៍</span>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  +855 23 888 999 / +855 12 345 678 (រៀងរាល់ថ្ងៃ ៨:០០ ព្រឹក - ៥:០០ ល្ងាច)
                </p>
              </div>

              <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-3">
                <div className="flex items-center gap-2.5 text-emerald-700 font-bold text-sm">
                  <Mail className="w-5 h-5 shrink-0" />
                  <span>សារអេឡិចត្រូនិក & Telegram</span>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  info@lllc.moeys.gov.kh • Telegram: @LLLCambodiaSupport
                </p>
              </div>

              {/* Senior Assistance Alert */}
              <div className="bg-amber-50 border border-amber-200 p-5 rounded-3xl space-y-1.5 text-xs text-amber-900">
                <div className="font-bold flex items-center gap-1.5">
                  <Heart className="w-4 h-4 text-amber-600" />
                  <span>ជំនួយពិសេសសម្រាប់មនុស្សវ័យចំណាស់</span>
                </div>
                <p className="text-amber-800 leading-relaxed">
                  លោកយាយ លោកតា អាចទូរស័ព្ទមកកាន់លេខទូរស័ព្ទឥតគិតថ្លៃ 1800-88-99 ក្រុមការងារយើងនឹងណែនាំមួយទល់នឹងមួយដោយផ្ទាល់។
                </p>
              </div>
            </div>

            {/* Interactive Feedback & Enquiry Form */}
            <div className="lg:col-span-2 bg-white p-8 rounded-3xl border border-slate-200 shadow-sm space-y-4">
              <h3 className="font-moul text-base text-slate-900 leading-relaxed">
                ផ្ញើសំណួរ ឬមតិកែលម្អ (Send Us an Enquiry / Feedback)
              </h3>
              <p className="text-xs text-slate-500">
                សូមបំពេញទម្រង់បែបបទខាងក្រោម ក្រុមការងារជំនួយបច្ចេកទេសនឹងឆ្លើយតបក្នុងរយៈពេលយ៉ាងយូរ ២៤ ម៉ោង។
              </p>

              <form onSubmit={handleContactSubmit} className="space-y-4 text-xs">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">គោត្តនាម និងនាម</label>
                    <input
                      type="text"
                      required
                      placeholder="ឧទាហរណ៍៖ សុខ វិសាល"
                      value={contactName}
                      onChange={e => setContactName(e.target.value)}
                      className="w-full p-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">លេខទូរស័ព្ទ ឬ អ៊ីមែល</label>
                    <input
                      type="text"
                      required
                      placeholder="ឧទាហរណ៍៖ 012 345 678 ឬ visal@example.com"
                      value={contactInfo}
                      onChange={e => setContactInfo(e.target.value)}
                      className="w-full p-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">ប្រធានបទ</label>
                  <select
                    value={contactSubject}
                    onChange={e => setContactSubject(e.target.value)}
                    className="w-full p-3 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="ទូទៅ">ចម្ងល់ទូទៅអំពីវគ្គសិក្សា</option>
                    <option value="បច្ចេកទេស">ជំនួយបច្ចេកទេសចូលរៀន ឬវិញ្ញាបនបត្រ</option>
                    <option value="មនុស្សចាស់">ការស្នើសុំជំនួយសម្រាប់មនុស្សវ័យចំណាស់</option>
                    <option value="ភាពជាដៃគូ">កិច្ចសហការ និងភាពជាដៃគូសហគមន៍</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">ខ្លឹមសារសារ ឬសំណួរ</label>
                  <textarea
                    rows={4}
                    required
                    placeholder="សូមសរសេរសារ ឬសំណួររបស់អ្នកនៅទីនេះ..."
                    value={contactMessage}
                    onChange={e => setContactMessage(e.target.value)}
                    className="w-full p-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSendingContact}
                  className="px-6 py-3 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs flex items-center gap-2 shadow-md transition disabled:opacity-50"
                >
                  <Send className="w-4 h-4" />
                  <span>{isSendingContact ? 'កំពុងផ្ញើ...' : 'ផ្ញើសារឥឡូវនេះ'}</span>
                </button>
              </form>
            </div>
          </div>
        </section>

        {/* ======================================================== */}
        {/* FACULTY & ADMIN COMMAND PORTAL                           */}
        {/* ======================================================== */}
        {currentUser?.role === 'admin' && (
        <section id="admin" className="space-y-6 scroll-mt-28 border-t border-slate-200 pt-10">
          <div className="border-b border-slate-200 pb-4 flex flex-col sm:flex-row justify-between sm:items-end gap-3">
            <div>
              <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-md">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>ផ្ទាំងគ្រប់គ្រងទូទៅ (Faculty & Admin Command Portal)</span>
              </div>
              <h2 className="text-xl sm:text-2xl lg:text-3xl font-moul text-slate-900 mt-2 leading-relaxed">
                ស្ថិតិហិរញ្ញវត្ថុ និងការគ្រប់គ្រងវគ្គសិក្សា
              </h2>
              <p className="text-xs sm:text-sm text-slate-500">
                មើលចំណូលសរុប ចំនួនសិស្ស បង្កើតវគ្គសិក្សាថ្មី និងលុបវគ្គសិក្សា។{' '}
                <Link href="/admin" className="text-emerald-700 font-bold hover:underline">
                  ផ្ទាំងគ្រប់គ្រងពេញលេញ (តម្លៃ គ្រូ ការបង់ប្រាក់ ការចុះឈ្មោះ) →
                </Link>
              </p>
            </div>

          </div>

          {/* Admin Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-2">
              <div className="flex items-center justify-between text-slate-400">
                <span className="text-xs font-bold uppercase">ចំណូលថ្លៃសិក្សាសរុប</span>
                <DollarSign className="w-4 h-4 text-emerald-600" />
              </div>
              <div className="text-3xl font-black text-slate-900">
                ${adminStats?.totalRevenue || 0}
              </div>
              <div className="text-xs text-emerald-600 font-semibold">+18.4% ក្នុងខែនេះ</div>
            </div>

            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-2">
              <div className="flex items-center justify-between text-slate-400">
                <span className="text-xs font-bold uppercase">សិស្សសកម្មសរុប</span>
                <Users className="w-4 h-4 text-indigo-600" />
              </div>
              <div className="text-3xl font-black text-slate-900">
                {adminStats?.totalStudents || 3420} នាក់
              </div>
              <div className="text-xs text-indigo-600 font-semibold">អត្រាបញ្ចប់ការសិក្សា ៨៨%</div>
            </div>

            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-2">
              <div className="flex items-center justify-between text-slate-400">
                <span className="text-xs font-bold uppercase">វិញ្ញាបនបត្រដែលបានចេញ</span>
                <Award className="w-4 h-4 text-amber-600" />
              </div>
              <div className="text-3xl font-black text-slate-900">
                {adminStats?.certificatesIssued || 1} ច្បាប់
              </div>
              <div className="text-xs text-amber-600 font-semibold">ទទួលស្គាល់ផ្លូវការ</div>
            </div>
          </div>

          {/* Course Management Table */}
          <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-4">
            <h3 className="text-sm sm:text-base font-moul text-slate-900 leading-relaxed">បញ្ជីវគ្គសិក្សាដែលមានស្រាប់ & ការគ្រប់គ្រង</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-400 uppercase">
                    <th className="pb-2">វគ្គសិក្សា</th>
                    <th className="pb-2">ប្រភេទ</th>
                    <th className="pb-2">តម្លៃ</th>
                    <th className="pb-2">CEUs</th>
                    <th className="pb-2 text-right">សកម្មភាព</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {courses.map(course => (
                    <tr key={course.id} className="hover:bg-slate-50">
                      <td className="py-2.5 font-bold text-slate-900 pr-4">{course.title}</td>
                      <td className="py-2.5 text-slate-600 pr-4">{course.category}</td>
                      <td className="py-2.5 font-bold text-slate-900 pr-4">{course.price === 0 ? 'ឥតគិតថ្លៃ' : `$${course.price}`}</td>
                      <td className="py-2.5 text-slate-500 pr-4">{course.ceus}</td>
                      <td className="py-2.5 text-right">
                        <button
                          onClick={() => handleDeleteCourse(course.id, course.title)}
                          className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                          title="លុបវគ្គសិក្សា"
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

          {/* Create New Course Form */}
          <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm sm:text-base font-moul text-slate-900 leading-relaxed">បង្កើតវគ្គសិក្សាថ្មីភ្លាមៗ (Quick Course Publisher)</h3>
                <p className="text-xs text-slate-500">បញ្ចូលវគ្គសិក្សាថ្មីទៅក្នុងប្រព័ន្ធដោយផ្ទាល់</p>
              </div>
              <Plus className="w-5 h-5 text-emerald-600" />
            </div>

            <form onSubmit={handleAddCourse} className="grid grid-cols-1 sm:grid-cols-4 gap-4 text-xs">
              <div className="sm:col-span-2">
                <label className="block font-bold text-slate-700 mb-1">ឈ្មោះវគ្គសិក្សា</label>
                <input
                  type="text"
                  required
                  placeholder="ឧទាហរណ៍៖ បច្ចេកទេសស្រោចស្រពដំណក់ទឹក..."
                  value={newCourseTitle}
                  onChange={e => setNewCourseTitle(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">ប្រភេទ</label>
                <select
                  value={newCourseCategory}
                  onChange={e => setNewCourseCategory(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 text-xs bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                >
                  <option value="Digital Skills">Digital Skills</option>
                  <option value="Literacy">Literacy</option>
                  <option value="Agriculture">Agriculture</option>
                  <option value="Entrepreneurship">Entrepreneurship</option>
                  <option value="Vocational Skills">Vocational Skills</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">តម្លៃ ($) (0 = ឥតគិតថ្លៃ)</label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    min="0"
                    value={newCoursePrice}
                    onChange={e => setNewCoursePrice(Number(e.target.value))}
                    className="w-full p-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                  <button
                    type="submit"
                    disabled={isSubmittingCourse}
                    className="px-4 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-xl whitespace-nowrap shadow transition disabled:opacity-50"
                  >
                    {isSubmittingCourse ? '...' : 'បង្កើត'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </section>
        )}

      </div>

      {/* Volunteer Modal */}
      {isVolunteerModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 space-y-4 shadow-2xl relative border border-slate-100 animate-in fade-in zoom-in-95">
            <button
              onClick={() => setIsVolunteerModalOpen(false)}
              className="absolute top-4 right-4 p-1.5 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="space-y-1">
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-md">
                ចូលរួមជាមួយយើង
              </span>
              <h3 className="text-lg font-moul text-slate-900 mt-2 leading-relaxed">
                ចុះឈ្មោះជាអ្នកស្ម័គ្រចិត្ត / គ្រូណែនាំ
              </h3>
              <p className="text-xs text-slate-500">
                ចែករំលែកពេលវេលា និងជំនាញរបស់អ្នកដើម្បីជួយសហគមន៍កម្ពុជា។
              </p>
            </div>

            <form onSubmit={handleVolunteerSubmit} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">គោត្តនាម និងនាម</label>
                <input
                  type="text"
                  required
                  placeholder="ឧទាហរណ៍៖ ចាន់ ដារ៉ា"
                  value={volunteerName}
                  onChange={e => setVolunteerName(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">លេខទូរស័ព្ទ / Telegram</label>
                <input
                  type="text"
                  required
                  placeholder="ឧទាហរណ៍៖ 012 888 999"
                  value={volunteerPhone}
                  onChange={e => setVolunteerPhone(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">ជំនាញដែលអ្នកចង់ចែករំលែក</label>
                <select
                  value={volunteerSkill}
                  onChange={e => setVolunteerSkill(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="ជំនាញឌីជីថល">ជំនាញឌីជីថល & ស្មាតហ្វូន (Digital Skills)</option>
                  <option value="អក្ខរកម្ម">អក្ខរកម្មមុខងារ (Literacy & Reading)</option>
                  <option value="កសិកម្ម">កសិកម្ម & បច្ចេកវិទ្យាបៃតង (Agriculture)</option>
                  <option value="សហគ្រិនភាព">សហគ្រិនភាព & អាជីវកម្ម (Entrepreneurship)</option>
                  <option value="វិជ្ជាជីវៈ">ជំនាញបច្ចេកទេស & វិជ្ជាជីវៈ (Vocational Skills)</option>
                </select>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  className="w-full py-3 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-xl shadow transition"
                >
                  បញ្ជូនពាក្យចុះឈ្មោះ
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <AnnouncementTicker />
    </div>
  );
}
