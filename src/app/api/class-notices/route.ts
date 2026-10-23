import { NextResponse } from 'next/server';
import { addClassNotice, getClassNotices, getCourses, getEnrollments, getUsers, readDatabase } from '@/lib/db';
import { canManageCourse, requireStaff, requireUser } from '@/lib/auth';
import { cambodiaNow, deliver } from '@/lib/reports';
import { formatClassTime, formatKhmerDateWithDay, isValidDate } from '@/lib/schedule';
import { ClassNotice, ClassNoticeKind } from '@/types';

const TIME = /^([01]\d|2[0-3]):[0-5]\d$/;

// Staff: the notices for the courses they manage. Students: upcoming notices for their courses.
export async function GET() {
  const auth = await requireUser();
  if ('response' in auth) return auth.response;
  const { user } = auth;
  const notices = getClassNotices();

  if (user.role === 'admin' || user.role === 'teacher') {
    const courses = getCourses();
    const visible = notices.filter(n => {
      if (user.role === 'admin') return true;
      const course = courses.find(c => c.id === n.courseId);
      return Boolean(course && canManageCourse(user, course));
    });
    return NextResponse.json({ success: true, notices: visible });
  }

  const today = cambodiaNow().date;
  const myCourseIds = new Set(getEnrollments(user.id).map(e => e.courseId));
  const upcoming = notices
    .filter(n => (n.courseId === 'all' || myCourseIds.has(n.courseId)) && (n.endDate || n.date) >= today)
    .sort((a, b) => a.date.localeCompare(b.date));
  return NextResponse.json({ success: true, notices: upcoming });
}

export async function POST(request: Request) {
  const auth = await requireStaff();
  if ('response' in auth) return auth.response;
  const { user } = auth;

  try {
    const body = await request.json();
    const kind = body.kind as ClassNoticeKind;
    const courseId = String(body.courseId || '');
    const date = String(body.date || '');
    const endDate = kind === 'break' ? String(body.endDate || '') || undefined : undefined;
    const startTime = kind === 'class' ? String(body.startTime || '') || undefined : undefined;
    const endTime = kind === 'class' ? String(body.endTime || '') || undefined : undefined;
    const message = String(body.message || '').trim().slice(0, 1000);

    if (kind !== 'class' && kind !== 'break') return NextResponse.json({ success: false, error: 'ប្រភេទមិនត្រឹមត្រូវ' }, { status: 400 });
    if (!isValidDate(date)) return NextResponse.json({ success: false, error: 'សូមជ្រើសរើសថ្ងៃ' }, { status: 400 });
    if (endDate && (!isValidDate(endDate) || endDate < date)) {
      return NextResponse.json({ success: false, error: 'ថ្ងៃបញ្ចប់ត្រូវនៅក្រោយថ្ងៃចាប់ផ្តើម' }, { status: 400 });
    }
    if ((startTime && !TIME.test(startTime)) || (endTime && !TIME.test(endTime)) || (startTime && endTime && endTime <= startTime)) {
      return NextResponse.json({ success: false, error: 'ម៉ោងមិនត្រឹមត្រូវ' }, { status: 400 });
    }

    // Which courses, and is this staff member allowed to message them
    const courses = getCourses();
    let targets;
    if (courseId === 'all') {
      if (user.role !== 'admin') return NextResponse.json({ success: false, error: 'សម្រាប់អ្នកគ្រប់គ្រងតែប៉ុណ្ណោះ' }, { status: 403 });
      targets = courses;
    } else {
      const course = courses.find(c => c.id === courseId);
      if (!course) return NextResponse.json({ success: false, error: 'រកមិនឃើញវគ្គ' }, { status: 404 });
      if (!canManageCourse(user, course)) return NextResponse.json({ success: false, error: 'អ្នកមិនមានសិទ្ធិលើវគ្គនេះទេ' }, { status: 403 });
      targets = [course];
    }

    const targetIds = new Set(targets.map(c => c.id));
    const studentIds = new Set(readDatabase().enrollments.filter(e => targetIds.has(e.courseId)).map(e => e.userId));
    const recipients = getUsers().filter(u => studentIds.has(u.id));

    const courseTitle = courseId === 'all' ? 'គ្រប់វគ្គសិក្សា' : targets[0].title;
    const notice: Omit<ClassNotice, 'id' | 'createdAt'> = {
      courseId,
      courseTitle,
      kind,
      date,
      endDate: endDate && endDate !== date ? endDate : undefined,
      startTime,
      endTime,
      message,
      createdBy: user.name,
      recipientCount: recipients.length
    };

    const when = notice.endDate
      ? `${formatKhmerDateWithDay(date)} ដល់ ${formatKhmerDateWithDay(notice.endDate)}`
      : formatKhmerDateWithDay(date);
    const title = kind === 'class' ? '📚 ជូនដំណឹង៖ មានការសិក្សា' : '🌴 ជូនដំណឹង៖ ឈប់សម្រាក';
    const lines = [
      `វគ្គ៖ ${courseTitle}`,
      `${kind === 'class' ? 'ថ្ងៃសិក្សា' : 'ឈប់សម្រាក'}៖ ${when}`,
      startTime ? `ម៉ោង៖ ${formatClassTime(startTime, endTime)}` : '',
      message ? `\n${message}` : '',
      `\n— ${user.name}`
    ];
    await deliver(recipients, title, lines.filter(Boolean).join('\n'));

    const saved = addClassNotice(notice);
    return NextResponse.json({ success: true, notice: saved });
  } catch (error) {
    console.error('Error sending class notice:', error);
    return NextResponse.json({ success: false, error: 'Failed to send notice' }, { status: 500 });
  }
}
