import fs from 'fs';
import path from 'path';
import { NextResponse } from 'next/server';
import { countResourceDownload, getResources } from '@/lib/content';
import { getCourseBySlug } from '@/lib/db';
import { UPLOAD_DIR } from '@/lib/uploads';

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

// Public library download: the uploaded file, or a course guide generated from the course
// (lesson titles, summaries and learning outcomes only — no full lesson content or answers).
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const resource = getResources().find(r => r.id === id);
  if (!resource) return NextResponse.json({ success: false, error: 'Not found' }, { status: 404 });

  if (resource.file) {
    const name = resource.file.url.split('/').pop() || '';
    const filePath = path.join(UPLOAD_DIR, name);
    if (!/^[a-z0-9-]+\.[a-z]+$/.test(name) || !fs.existsSync(filePath)) {
      return NextResponse.json({ success: false, error: 'File missing' }, { status: 404 });
    }
    countResourceDownload(id);
    const safeName = resource.file.name.replace(/[^\w.\- ]+/g, '_') || name;
    return new Response(fs.readFileSync(filePath), {
      headers: {
        'Content-Type': resource.file.mime,
        'Content-Disposition': `attachment; filename="${safeName}"; filename*=UTF-8''${encodeURIComponent(resource.file.name)}`,
        'X-Content-Type-Options': 'nosniff'
      }
    });
  }

  const course = resource.courseId ? getCourseBySlug(resource.courseId) : null;
  if (!course) return NextResponse.json({ success: false, error: 'Not found' }, { status: 404 });
  countResourceDownload(id);

  const modules = course.modules
    .map(
      m =>
        `<h2>${esc(m.title)}</h2>${m.description ? `<p>${esc(m.description)}</p>` : ''}<ol>${m.lessons
          .map(l => `<li><strong>${esc(l.title)}</strong> (${esc(l.duration)})${l.summary ? `<br>${esc(l.summary)}` : ''}${l.activity ? `<br><em>សកម្មភាពអនុវត្ត៖ ${esc(l.activity)}</em>` : ''}</li>`)
          .join('')}</ol>`
    )
    .join('\n');
  const list = (items: string[]) => (items.length ? `<ul>${items.map(i => `<li>${esc(i)}</li>`).join('')}</ul>` : '');

  const html = `<!doctype html>
<html lang="km"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(resource.title)}</title>
<link href="https://fonts.googleapis.com/css2?family=Moul&family=Siemreap&display=swap" rel="stylesheet">
<style>
  body { font-family: 'Siemreap', sans-serif; max-width: 780px; margin: 40px auto; padding: 0 20px; line-height: 1.9; color: #0f172a; }
  h1, h2 { font-family: 'Moul', 'Siemreap', serif; line-height: 1.6; color: #064e3b; }
  .meta { color: #64748b; font-size: 14px; border-bottom: 2px solid #fbbf24; padding-bottom: 12px; }
  footer { margin-top: 40px; font-size: 12px; color: #94a3b8; border-top: 1px solid #e2e8f0; padding-top: 10px; }
</style></head>
<body>
  <div class="meta">មជ្ឈមណ្ឌលសិក្សាពេញមួយជីវិត • LIFELONG LEARNING CENTER • ${esc(resource.category)}</div>
  <h1>${esc(resource.title)}</h1>
  <p>${esc(course.subtitle || course.description)}</p>
  <p>រយៈពេល៖ ${esc(course.duration)}${course.instructor ? ` • គ្រូបង្រៀន៖ ${esc(course.instructor.name)}` : ''}</p>
  ${course.learningOutcomes.length ? `<h2>គោលបំណងសិក្សា</h2>${list(course.learningOutcomes)}` : ''}
  ${course.targetAudience.length ? `<h2>សម្រាប់អ្នកណា</h2>${list(course.targetAudience)}` : ''}
  ${modules}
  <footer>ឯកសារសាធារណៈ • ចុះឈ្មោះរៀនវគ្គពេញលេញនៅគេហទំព័រមជ្ឈមណ្ឌល</footer>
</body></html>`;

  return new Response(html, {
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Content-Disposition': `attachment; filename="guide-${course.slug}.html"`
    }
  });
}
