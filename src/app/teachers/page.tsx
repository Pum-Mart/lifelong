import { Suspense } from 'react';
import { io } from 'next/cache';
import Link from 'next/link';
import { GraduationCap } from 'lucide-react';
import { getInstructors, getCourses } from '@/lib/db';

export default function TeachersPage() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12 space-y-8 font-siemreap">
      <div className="space-y-2">
        <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-md">
          <GraduationCap className="w-3.5 h-3.5" />
          <span>គ្រូបង្រៀន (Teachers)</span>
        </div>
        <h1 className="font-moul text-2xl sm:text-3xl text-slate-900 leading-relaxed">គ្រូបង្រៀនរបស់យើង</h1>
      </div>

      <Suspense fallback={<p className="text-sm text-slate-400">កំពុងផ្ទុក...</p>}>
        <TeacherList />
      </Suspense>
    </div>
  );
}

async function TeacherList() {
  // Teachers are edited from /admin, so read them per request rather than at build time
  await io();
  const instructors = getInstructors();
  const courses = getCourses();

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {instructors.map(teacher => {
        const teaching = courses.filter(c => c.instructorId === teacher.id);
        return (
          <article key={teacher.id} className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 flex flex-col sm:flex-row gap-5">
            <img
              src={teacher.avatar}
              alt={teacher.name}
              className="w-32 aspect-[2/3] rounded-2xl object-cover shrink-0 shadow-md mx-auto sm:mx-0 bg-slate-100"
            />
            <div className="space-y-3 min-w-0">
              <div>
                <h2 className="text-lg font-bold text-slate-900">{teacher.name}</h2>
                {teacher.title && <p className="text-xs text-emerald-700 font-semibold">{teacher.title}</p>}
              </div>
              {teacher.bio && (
                <div className="space-y-1">
                  <h3 className="text-xs font-bold text-slate-800">ប្រវត្តិរូបសង្ខេប</h3>
                  <p className="text-sm text-slate-600 leading-relaxed">{teacher.bio}</p>
                </div>
              )}
              {teacher.experience && (
                <div className="space-y-1">
                  <h3 className="text-xs font-bold text-slate-800">បទពិសោធន៍បង្រៀន</h3>
                  <p className="text-sm text-slate-600 leading-relaxed">{teacher.experience}</p>
                </div>
              )}
              {teaching.length > 0 && (
                <div className="flex flex-wrap gap-2 pt-1">
                  {teaching.map(c => (
                    <Link key={c.id} href={`/courses/${c.slug}`} className="px-2.5 py-1 rounded-md bg-emerald-50 text-emerald-800 text-[11px] font-semibold hover:bg-emerald-100">
                      {c.title}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </article>
        );
      })}
    </div>
  );
}
