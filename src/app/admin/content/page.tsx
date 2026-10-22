'use client';

import React, { useState } from 'react';
import { BookOpen, Camera, FileText, LayoutDashboard, Mail, Megaphone, MoveHorizontal, ShieldCheck } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import LoginRequired from '@/components/LoginRequired';
import AnnouncementsManager from '@/components/admin/AnnouncementsManager';
import ActivitiesManager from '@/components/admin/ActivitiesManager';
import TickerManager from '@/components/admin/TickerManager';
import CourseContentManager from '@/components/admin/CourseContentManager';
import ResourcesManager from '@/components/admin/ResourcesManager';
import MessagesManager from '@/components/admin/MessagesManager';

const TABS = [
  { key: 'announcements', label: 'សេចក្តីជូនដំណឹង', icon: Megaphone },
  { key: 'activities', label: 'សកម្មភាពប្រចាំថ្ងៃ', icon: Camera },
  { key: 'ticker', label: 'អក្សររត់', icon: MoveHorizontal },
  { key: 'courses', label: 'វគ្គសិក្សា & ការបណ្តុះបណ្តាល', icon: BookOpen },
  { key: 'resources', label: 'ធនធាន & បណ្ណាល័យ', icon: FileText },
  { key: 'messages', label: 'សារពីអ្នកទស្សនា', icon: Mail }
] as const;

type Tab = (typeof TABS)[number]['key'];

export default function ContentAdminPage() {
  const { currentUser, authReady } = useApp();
  const [tab, setTab] = useState<Tab>('announcements');

  if (!authReady) return <div className="py-24 text-center text-sm text-slate-400">កំពុងផ្ទុក...</div>;
  if (!currentUser) return <LoginRequired message="សូមចូលគណនី Admin" />;
  if (currentUser.role !== 'admin') {
    return (
      <div className="max-w-md mx-auto py-24 px-4 text-center space-y-3 font-siemreap">
        <ShieldCheck className="w-12 h-12 text-slate-300 mx-auto" />
        <p className="text-sm text-slate-500">ទំព័រនេះសម្រាប់ Admin តែប៉ុណ្ណោះ។</p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10 space-y-6 font-siemreap">
      <div className="space-y-1">
        <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-md">
          <LayoutDashboard className="w-3.5 h-3.5" /> គ្រប់គ្រងមាតិកាគេហទំព័រ
        </div>
        <h1 className="font-moul text-xl sm:text-2xl text-slate-900 leading-relaxed">បញ្ចូលមាតិកា (Admin)</h1>
      </div>

      <div className="flex flex-wrap gap-2" role="tablist">
        {TABS.map(t => (
          <button
            key={t.key}
            role="tab"
            aria-selected={tab === t.key}
            onClick={() => setTab(t.key)}
            className={`px-4 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 transition ${tab === t.key ? 'bg-emerald-700 text-white shadow' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'}`}
          >
            <t.icon className="w-4 h-4" /> {t.label}
          </button>
        ))}
      </div>

      <section className="bg-white rounded-3xl border border-slate-200 shadow-sm p-5 sm:p-6">
        {tab === 'announcements' && <AnnouncementsManager />}
        {tab === 'activities' && <ActivitiesManager />}
        {tab === 'ticker' && <TickerManager />}
        {tab === 'courses' && <CourseContentManager />}
        {tab === 'resources' && <ResourcesManager />}
        {tab === 'messages' && <MessagesManager />}
      </section>
    </div>
  );
}
