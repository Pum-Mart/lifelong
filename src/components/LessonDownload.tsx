'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Download, Lock } from 'lucide-react';
import { useApp } from '@/context/AppContext';

// Lesson download for members (students), the director, committee and admins.
// The server makes the final decision; this only explains who can download.
export default function LessonDownload({ courseId, lessonId }: { courseId: string; lessonId: string }) {
  const { currentUser } = useApp();
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const staff = currentUser && (currentUser.role === 'admin' || currentUser.staffTitle === 'director' || currentUser.staffTitle === 'committee');
  if (!currentUser || (!currentUser.isMember && !staff)) {
    return (
      <div className="flex flex-wrap items-center gap-2 text-xs text-slate-400">
        <Lock className="w-4 h-4" />
        ការទាញយកមេរៀន សម្រាប់តែសមាជិក ប្រធានមជ្ឈមណ្ឌល គណៈកម្មការ និង Admin។
        <Link href={currentUser ? '/account' : '/signup'} className="font-bold text-amber-300 hover:underline">
          {currentUser ? 'ចូលជាសមាជិក →' : 'ចុះឈ្មោះជាសមាជិក →'}
        </Link>
      </div>
    );
  }

  const download = async () => {
    setBusy(true);
    setError('');
    try {
      const res = await fetch(`/api/lessons/${courseId}/${lessonId}`);
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error || 'ទាញយកមិនបានទេ');
        return;
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `lesson-${lessonId}.html`;
      a.click();
      URL.revokeObjectURL(url);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex flex-wrap items-center gap-3">
      <button onClick={download} disabled={busy} className="px-4 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-600 text-white text-xs font-bold flex items-center gap-2 disabled:opacity-50">
        <Download className="w-4 h-4" /> {busy ? 'កំពុងទាញយក...' : 'ទាញយកមេរៀន'}
      </button>
      {error && <span role="alert" className="text-xs text-rose-300">{error}</span>}
    </div>
  );
}
