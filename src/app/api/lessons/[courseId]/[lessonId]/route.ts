import { NextResponse } from 'next/server';
import { getCourseBySlug, getEnrollments } from '@/lib/db';
import { requireUser } from '@/lib/auth';
import { SessionUser } from '@/types';

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

// Lesson downloads: members enrolled in the course, the centre director, committee and admins
function canDownloadLessons(user: SessionUser, enrolled: boolean): boolean {
  if (user.role === 'admin' || user.staffTitle === 'director' || user.staffTitle === 'committee') return true;
  return user.isMember && enrolled;
}

// Returns the lesson as a self-contained HTML file (opens offline; print → Save as PDF)
export async function GET(
  request: Request,
  { params }: { params: Promise<{ courseId: string; lessonId: string }> }
) {
  const auth = await requireUser();
  if ('response' in auth) return auth.response;
  const { user } = auth;

  const { courseId, lessonId } = await params;
  const course = getCourseBySlug(courseId);
  const lesson = course?.modules.flatMap(m => m.lessons).find(l => l.id === lessonId);
  if (!course || !lesson) return NextResponse.json({ success: false, error: 'Lesson not found' }, { status: 404 });

  const enrolled = getEnrollments(user.id).some(e => e.courseId === course.id);
  if (!canDownloadLessons(user, enrolled)) {
    return NextResponse.json(
      {
        success: false,
        error: !user.isMember
          ? 'ការទាញយកមេរៀន សម្រាប់តែសមាជិកប៉ុណ្ណោះ។ សូមចូលជាសមាជិកនៅទំព័រគណនី។'
          : 'សូមចុះឈ្មោះចូលរៀនវគ្គនេះជាមុនសិន ដើម្បីទាញយកមេរៀន។',
        membershipRequired: !user.isMember
      },
      { status: 403 }
    );
  }

  const paragraphs = (lesson.content || []).map(p => `<p>${esc(p)}</p>`).join('\n');
  const questions = (lesson.quiz || [])
    .map((q, i) => `<li><strong>${i + 1}. ${esc(q.question)}</strong><ol type="a">${q.options.map(o => `<li>${esc(o)}</li>`).join('')}</ol></li>`)
    .join('\n');

  const html = `<!doctype html>
<html lang="km"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(lesson.title)} — ${esc(course.title)}</title>
<link href="https://fonts.googleapis.com/css2?family=Moul&family=Siemreap&display=swap" rel="stylesheet">
<style>
  body { font-family: 'Siemreap', sans-serif; max-width: 780px; margin: 40px auto; padding: 0 20px; line-height: 1.9; color: #0f172a; }
  h1, h2 { font-family: 'Moul', 'Siemreap', serif; line-height: 1.6; color: #064e3b; }
  .meta { color: #64748b; font-size: 14px; border-bottom: 2px solid #fbbf24; padding-bottom: 12px; }
  .box { background: #ecfdf5; border-radius: 12px; padding: 12px 16px; }
  footer { margin-top: 40px; font-size: 12px; color: #94a3b8; border-top: 1px solid #e2e8f0; padding-top: 10px; }
</style></head>
<body>
  <div class="meta">មជ្ឈមណ្ឌលសិក្សាពេញមួយជីវិត • LIFELONG LEARNING CENTER<br>វគ្គ៖ ${esc(course.title)}${course.instructor ? ` • គ្រូ៖ ${esc(course.instructor.name)}` : ''} • រយៈពេល៖ ${esc(lesson.duration)}</div>
  <h1>${esc(lesson.title)}</h1>
  ${lesson.summary ? `<p class="box">${esc(lesson.summary)}</p>` : ''}
  ${paragraphs}
  ${lesson.activity ? `<h2>សកម្មភាពអនុវត្ត</h2><p>${esc(lesson.activity)}</p>` : ''}
  ${lesson.notes ? `<h2>កំណត់ចំណាំ</h2><p>${esc(lesson.notes)}</p>` : ''}
  ${questions ? `<h2>សំណួរកិច្ចការផ្ទះ</h2><ol style="list-style:none;padding:0">${questions}</ol><p style="font-size:13px;color:#64748b">សូមបញ្ជូនចម្លើយនៅលើគេហទំព័រ ដើម្បីទទួលពិន្ទុ។</p>` : ''}
  <footer>ទាញយកដោយ ${esc(user.name)} • ${new Date().toLocaleDateString('en-GB')} • សម្រាប់ការសិក្សាផ្ទាល់ខ្លួនតែប៉ុណ្ណោះ</footer>
</body></html>`;

  const filename = `lesson-${lesson.id}.html`;
  return new Response(html, {
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Cache-Control': 'private, no-store'
    }
  });
}
