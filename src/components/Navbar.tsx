'use client';

import React, { useState, useEffect, useSyncExternalStore } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useApp } from '@/context/AppContext';
import LanguageSwitcher from '@/components/LanguageSwitcher';
import { 
  GraduationCap, 
  BookOpen, 
  Calendar, 
  ShoppingCart, 
  Bookmark, 
  ShieldCheck, 
  UserCheck, 
  ChevronDown,
  Menu,
  X,
  Type,
  Award,
  Sparkles,
  Info,
  FileText,
  Users,
  PhoneCall,
  LogIn,
  LogOut,
  Bell,
  CalendarCheck,
  BadgeCheck,
  LayoutDashboard,
  type LucideIcon
} from 'lucide-react';

interface NavLinkItem {
  href: string;
  label: string;
  sublabel: string;
  icon: LucideIcon;
  badge?: number;
}

// true only in the browser after hydration (server render and first client render: false)
const subscribeNoop = () => () => {};
const useMounted = () => useSyncExternalStore(subscribeNoop, () => true, () => false);

export default function Navbar() {
  const pathname = usePathname();
  const { 
    currentUser,
    authReady,
    logout,
    cart,
    setIsCartOpen, 
    textSize, 
    setTextSize, 
    enrollments,
    notification 
  } = useApp();

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const mounted = useMounted();

  // Navbar hydrates inside a Suspense boundary, possibly after the session check has
  // finished; render account UI only after mount so it matches the server HTML.
  const showAuth = mounted && authReady;

  // Unread inbox count: refreshed on navigation and when the inbox marks items read
  const [unread, setUnread] = useState(0);
  const userId = currentUser?.id;
  useEffect(() => {
    if (!userId) return;
    const load = () =>
      fetch('/api/notifications')
        .then(res => res.json())
        .then(data => setUnread(data.success ? data.unread : 0))
        .catch(() => {});
    load();
    window.addEventListener('llc:notifications-read', load);
    return () => window.removeEventListener('llc:notifications-read', load);
  }, [userId, pathname]);

  const totalCartCount = cart.length;
  const activeEnrollmentsCount = enrollments.length;

  const navLinks: NavLinkItem[] = [
    { href: '/#home', label: 'ទំព័រដើម', sublabel: 'Home', icon: Sparkles },
    { href: '/about', label: 'អំពី LLLc', sublabel: 'About LLLc', icon: Info },
    { href: '/#courses', label: 'វគ្គសិក្សា', sublabel: 'Courses & Training', icon: BookOpen, badge: activeEnrollmentsCount },
    { href: '/teachers', label: 'គ្រូបង្រៀន', sublabel: 'Teachers', icon: GraduationCap },
    { href: '/#news', label: 'ព័ត៌មាន & សកម្មភាព', sublabel: 'News & Activities', icon: Calendar },
    { href: '/#resources', label: 'ធនធាន & បណ្ណាល័យ', sublabel: 'Resources & Library', icon: FileText },
    { href: '/#community', label: 'សហគមន៍ & ដៃគូ', sublabel: 'Community & Partners', icon: Users },
    { href: '/#contact', label: 'ទំនាក់ទំនង & ជំនួយ', sublabel: 'Contact & Support', icon: PhoneCall }
  ];

  return (
    <>
      {/* Toast Notification */}
      {notification && (
        <div className="fixed top-4 right-4 z-50 animate-bounce transition-all duration-300">
          <div className={`px-4 py-3 rounded-xl shadow-xl flex items-center gap-3 text-sm font-medium border ${
            notification.type === 'info' 
              ? 'bg-blue-900 text-blue-50 border-blue-700' 
              : notification.type === 'warning'
              ? 'bg-amber-900 text-amber-50 border-amber-700'
              : 'bg-emerald-900 text-emerald-50 border-emerald-700'
          }`}>
            <span>{notification.message}</span>
          </div>
        </div>
      )}

      {/* Accessibility & Role Top Bar */}
      <header className="no-print sticky top-0 z-40 bg-gradient-to-r from-emerald-900 via-teal-800 to-emerald-800 border-b-2 border-amber-400 shadow-lg shadow-emerald-950/30">
        <div className="bg-emerald-950 text-emerald-100/80 text-xs py-1.5 px-4 sm:px-6">
          <div className="max-w-7xl mx-auto flex flex-wrap justify-between items-center gap-2">
            <div className="flex items-center gap-2">
              <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              <span>Lifelong Learning Center • Empowering Curious Minds at Every Age</span>
            </div>

            <div className="flex items-center gap-4">
              {/* Accessibility Font Size Switcher */}
              <div className="flex items-center gap-1.5 bg-emerald-900 px-2 py-0.5 rounded-lg border border-emerald-700">
                <Type className="w-3.5 h-3.5 text-slate-400" />
                <span className="text-slate-400 hidden sm:inline mr-1">Text:</span>
                <button 
                  onClick={() => setTextSize('normal')}
                  className={`px-1.5 py-0.5 rounded text-xs font-semibold ${textSize === 'normal' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-white'}`}
                  title="Standard reading text"
                >
                  A
                </button>
                <button 
                  onClick={() => setTextSize('large')}
                  className={`px-1.5 py-0.5 rounded text-xs font-semibold ${textSize === 'large' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-white'}`}
                  title="Large readable text"
                >
                  A+
                </button>
                <button 
                  onClick={() => setTextSize('xlarge')}
                  className={`px-1.5 py-0.5 rounded text-xs font-semibold ${textSize === 'xlarge' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-white'}`}
                  title="Extra-large senior-friendly text"
                >
                  A++
                </button>
              </div>

              <LanguageSwitcher mounted={mounted} />

              {/* Account menu */}
              {!showAuth ? null : currentUser ? (
                <div className="relative">
                  <button
                    onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                    className="flex items-center gap-1.5 text-xs bg-emerald-900 hover:bg-emerald-800 text-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-700 transition"
                  >
                    <UserCheck className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="font-medium">{currentUser.name.split(' ')[0]}</span>
                    {currentUser.isMember && <span className="text-[10px] font-bold text-emerald-300">-10%</span>}
                    <ChevronDown className="w-3 h-3 text-slate-400" />
                  </button>

                  {isUserMenuOpen && (
                    <div className="absolute right-0 mt-1 w-56 bg-white rounded-xl shadow-2xl border border-slate-200 text-slate-800 p-2 z-50">
                      <div className="px-2 py-1.5 border-b border-slate-100 mb-1">
                        <div className="text-xs font-bold truncate">{currentUser.name}</div>
                        <div className="text-[10px] text-slate-500 truncate">{currentUser.email}</div>
                      </div>
                      <Link href="/account" onClick={() => setIsUserMenuOpen(false)} className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium hover:bg-slate-50">
                        <UserCheck className="w-4 h-4 text-emerald-600" /> គណនីរបស់ខ្ញុំ
                      </Link>
                      <Link href="/my-learning" onClick={() => setIsUserMenuOpen(false)} className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium hover:bg-slate-50">
                        <BookOpen className="w-4 h-4 text-emerald-600" /> ការសិក្សារបស់ខ្ញុំ
                      </Link>
                      <Link href="/inbox" onClick={() => setIsUserMenuOpen(false)} className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium hover:bg-slate-50">
                        <Bell className="w-4 h-4 text-emerald-600" /> លិខិតជូនដំណឹង {unread > 0 && <span className="ml-auto px-1.5 rounded-full bg-red-600 text-white text-[10px] font-bold">{unread}</span>}
                      </Link>
                      {(currentUser.role === 'admin' || currentUser.role === 'teacher') && (
                        <Link href="/attendance" onClick={() => setIsUserMenuOpen(false)} className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium hover:bg-slate-50">
                          <CalendarCheck className="w-4 h-4 text-emerald-600" /> វត្តមាន និងពិន្ទុ
                        </Link>
                      )}
                      {(currentUser.staffTitle === 'director' || currentUser.staffTitle === 'committee' || currentUser.role === 'admin') && (
                        <Link href="/approvals" onClick={() => setIsUserMenuOpen(false)} className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium hover:bg-slate-50">
                          <BadgeCheck className="w-4 h-4 text-emerald-600" /> អនុម័តវិញ្ញាបនបត្រ
                        </Link>
                      )}
                      {currentUser.role === 'admin' && (
                        <Link href="/admin" onClick={() => setIsUserMenuOpen(false)} className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium hover:bg-slate-50">
                          <ShieldCheck className="w-4 h-4 text-amber-600" /> ផ្ទាំងគ្រប់គ្រង (Admin)
                        </Link>
                      )}
                      {currentUser.role === 'admin' && (
                        <Link href="/admin/content" onClick={() => setIsUserMenuOpen(false)} className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium hover:bg-slate-50">
                          <LayoutDashboard className="w-4 h-4 text-amber-600" /> បញ្ចូលមាតិកា (សេចក្តីជូនដំណឹង សកម្មភាព...)
                        </Link>
                      )}
                      <button
                        onClick={() => { setIsUserMenuOpen(false); logout(); }}
                        className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium text-red-600 hover:bg-red-50"
                      >
                        <LogOut className="w-4 h-4" /> ចាកចេញ (Log out)
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Link href="/login" className="text-xs text-slate-200 hover:text-white px-2 py-1">ចូលគណនី</Link>
                  <Link href="/signup" className="text-xs font-bold bg-amber-400 hover:bg-amber-300 text-emerald-950 px-2.5 py-1 rounded-lg">
                    សមាជិក -10%
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Main Navigation Bar */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex justify-between items-center h-20">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-2.5 group shrink-0">
              <img
                src="/logo-plllc.svg"
                alt="Plllc"
                width={56}
                height={56}
                className="w-12 h-12 sm:w-14 sm:h-14 rounded-full"
              />
              <div className="hidden sm:block">
                <span className="block text-sm sm:text-base lg:text-lg font-bold tracking-tight text-white group-hover:text-amber-300 transition leading-tight">
                  LIFELONG LEARNING CENTER
                </span>
                <span className="block text-[10px] sm:text-xs font-semibold text-amber-300 tracking-tight font-siemreap">
                  មជ្ឈមណ្ឌលសិក្សាពេញមួយជីវិត
                </span>
              </div>
            </Link>

            {/* Action Buttons: Cart & Profile */}
            <div className="flex items-center gap-3">
              {showAuth && currentUser && (
                <Link
                  href="/inbox"
                  className="relative p-2.5 rounded-xl text-emerald-50 hover:bg-white/10 hover:text-amber-300 transition"
                  title="លិខិតជូនដំណឹង"
                  aria-label={`លិខិតជូនដំណឹង${unread ? ` (${unread} ថ្មី)` : ''}`}
                >
                  <Bell className="w-6 h-6" />
                  {unread > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-600 text-white text-xs font-bold min-w-5 h-5 px-1 rounded-full flex items-center justify-center shadow">
                      {unread}
                    </span>
                  )}
                </Link>
              )}

              {showAuth && (currentUser?.role === 'admin' || currentUser?.role === 'teacher') && (
                <Link
                  href="/attendance"
                  className="p-2.5 rounded-xl text-emerald-50 hover:bg-white/10 hover:text-amber-300 transition"
                  title="វត្តមាន និងពិន្ទុ"
                  aria-label="វត្តមាន និងពិន្ទុ"
                >
                  <CalendarCheck className="w-6 h-6" />
                </Link>
              )}

              {showAuth && currentUser?.role === 'admin' && (
                <Link
                  href="/admin"
                  className="p-2.5 rounded-xl text-emerald-50 hover:bg-white/10 hover:text-amber-300 transition"
                  title="ផ្ទាំងគ្រប់គ្រង (Admin)"
                  aria-label="Admin"
                >
                  <ShieldCheck className="w-6 h-6" />
                </Link>
              )}

              <button
                onClick={() => setIsCartOpen(true)}
                className="relative p-2.5 rounded-xl text-emerald-50 hover:bg-white/10 hover:text-amber-300 transition"
                aria-label="Shopping Cart"
              >
                <ShoppingCart className="w-6 h-6" />
                {totalCartCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-amber-400 text-emerald-950 text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center shadow">
                    {totalCartCount}
                  </span>
                )}
              </button>

              {showAuth && currentUser ? (
                <Link
                  href="/account"
                  className="hidden sm:flex items-center gap-2.5 pl-2 pr-3 py-1.5 rounded-xl border border-white/20 hover:border-amber-300 hover:bg-white/10 transition group"
                >
                  <div className="w-8 h-8 rounded-full bg-amber-400 text-emerald-950 font-black text-sm flex items-center justify-center ring-2 ring-amber-200/40">
                    {currentUser.name.trim().charAt(0).toUpperCase()}
                  </div>
                  <div className="text-left text-xs">
                    <div className="font-bold text-white group-hover:text-amber-200 max-w-[9rem] truncate">{currentUser.name}</div>
                    <div className="text-emerald-100/70">
                      {currentUser.role === 'admin' ? 'Admin' : currentUser.role === 'teacher' ? 'គ្រូ' : 'សិស្ស'}
                      {currentUser.isMember && <span className="text-amber-300 font-bold"> • សមាជិក</span>}
                    </div>
                  </div>
                </Link>
              ) : showAuth ? (
                <Link
                  href="/login"
                  className="hidden sm:flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-emerald-950 text-xs font-bold shadow"
                >
                  <LogIn className="w-4 h-4" /> ចូលគណនី
                </Link>
              ) : null}

              {/* Mobile menu toggle */}
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="lg:hidden p-2 rounded-xl text-white hover:bg-white/10"
                aria-label="Menu"
              >
                {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          </div>

          {/* Desktop Navigation Links (second row so all fit on laptop screens) */}
          <nav className="hidden lg:flex flex-wrap justify-center items-center gap-1 pb-2.5 -mt-1">
              {navLinks.map(link => {
                const Icon = link.icon;
                const isActive = pathname === link.href || (link.href !== '/' && pathname.startsWith(link.href));
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={(e) => {
                      if (link.href.startsWith('/#')) {
                        const targetId = link.href.replace('/#', '');
                        const el = document.getElementById(targetId);
                        if (el) {
                          e.preventDefault();
                          el.scrollIntoView({ behavior: 'smooth', block: 'start' });
                        }
                      }
                    }}
                    className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition ${
                      isActive
                        ? 'bg-amber-400 text-emerald-950 shadow-sm'
                        : 'text-emerald-50/90 hover:text-white hover:bg-white/10'
                    }`}
                  >
                    <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-emerald-900' : 'text-amber-300/80'}`} />
                    <span>{link.label}</span>
                    {mounted && link.badge !== undefined && link.badge > 0 && (
                      <span className="ml-0.5 px-1.5 py-0.2 rounded-full text-[10px] bg-emerald-600 text-white font-bold">
                        {link.badge}
                      </span>
                    )}
                  </Link>
                );
              })}
          </nav>
        </div>

        {/* Mobile Navigation Dropdown */}
        {isMobileMenuOpen && (
          <div className="lg:hidden border-t border-slate-200 bg-white px-4 pt-3 pb-6 space-y-2">
            {navLinks.map(link => {
              const Icon = link.icon;
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={(e) => {
                    setIsMobileMenuOpen(false);
                    if (link.href.startsWith('/#')) {
                      const targetId = link.href.replace('/#', '');
                      const el = document.getElementById(targetId);
                      if (el) {
                        e.preventDefault();
                        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
                      }
                    }
                  }}
                  className={`flex items-center justify-between px-4 py-3 rounded-xl text-base font-medium ${
                    isActive ? 'bg-emerald-50 text-emerald-700 font-bold' : 'text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className="w-5 h-5 text-emerald-600" />
                    <span>{link.label}</span>
                  </div>
                  {mounted && link.badge !== undefined && link.badge > 0 && (
                    <span className="px-2 py-0.5 rounded-full text-xs bg-emerald-600 text-white font-bold">
                      {link.badge}
                    </span>
                  )}
                </Link>
              );
            })}

            <div className="pt-3 mt-2 border-t border-slate-200 grid grid-cols-2 gap-2">
              {currentUser ? (
                <>
                  <Link href="/account" onClick={() => setIsMobileMenuOpen(false)} className="px-4 py-3 rounded-xl bg-emerald-50 text-emerald-800 font-bold text-sm text-center">
                    គណនីរបស់ខ្ញុំ
                  </Link>
                  <button onClick={() => { setIsMobileMenuOpen(false); logout(); }} className="px-4 py-3 rounded-xl border border-red-200 text-red-600 font-bold text-sm">
                    ចាកចេញ
                  </button>
                  {currentUser.role === 'admin' && (
                    <Link href="/admin" onClick={() => setIsMobileMenuOpen(false)} className="col-span-2 px-4 py-3 rounded-xl bg-amber-50 text-amber-800 font-bold text-sm text-center">
                      ផ្ទាំងគ្រប់គ្រង (Admin)
                    </Link>
                  )}
                </>
              ) : (
                <>
                  <Link href="/login" onClick={() => setIsMobileMenuOpen(false)} className="px-4 py-3 rounded-xl border border-slate-300 text-slate-700 font-bold text-sm text-center">
                    ចូលគណនី
                  </Link>
                  <Link href="/signup" onClick={() => setIsMobileMenuOpen(false)} className="px-4 py-3 rounded-xl bg-emerald-600 text-white font-bold text-sm text-center">
                    សមាជិក -10%
                  </Link>
                </>
              )}
            </div>
          </div>
        )}
      </header>
    </>
  );
}
