import {
  addNotifications,
  getCourses,
  getCourseStudents,
  getExamScores,
  getSessions,
  getSettings,
  getUsers,
  markCourseEndNoticeSent,
  updateSettings
} from '@/lib/db';
import { missingItems } from '@/lib/grades';
import { gradeForStudent } from '@/lib/assessments';
import { escapeHtml, sendTelegramMessage, sendTelegramTo } from '@/lib/telegram';
import { Course, UserAccount } from '@/types';

const TIME_ZONE = 'Asia/Phnom_Penh';
// Reports go out one day before the weekend (Saturday), i.e. on Friday from this hour
export const REPORT_WEEKDAY = 5; // 0 = Sunday … 5 = Friday
export const REPORT_HOUR = 17; // 5 PM

const THANKS =
  'សូមអរគុណរាល់ការខិតខំសិក្សារបស់សិស្សគ្រប់រូប និងការបង្រៀនរបស់លោកគ្រូ អ្នកគ្រូគ្រប់រូប។';

// Today's date and time in Cambodia, independent of the server's time zone
export function cambodiaNow() {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat('en-CA', {
      timeZone: TIME_ZONE,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      hourCycle: 'h23',
      weekday: 'short'
    })
      .formatToParts(new Date())
      .map(p => [p.type, p.value])
  );
  const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  return {
    date: `${parts.year}-${parts.month}-${parts.day}`,
    hour: Number(parts.hour),
    weekday: weekdays.indexOf(parts.weekday)
  };
}

function daysBetween(from: string, to: string): number {
  return Math.round((Date.parse(`${to}T00:00:00Z`) - Date.parse(`${from}T00:00:00Z`)) / 86400_000);
}

function addDays(date: string, days: number): string {
  return new Date(Date.parse(`${date}T00:00:00Z`) + days * 86400_000).toISOString().slice(0, 10);
}

interface Recipient {
  id: string;
  telegramChatId?: number;
}

// Inbox for every recipient, plus Telegram for those who linked it
export async function deliver(recipients: Recipient[], title: string, body: string) {
  const unique = [...new Map(recipients.map(r => [r.id, r])).values()];
  addNotifications(unique.map(r => ({ userId: r.id, title, body })));
  for (const r of unique) {
    if (r.telegramChatId) await sendTelegramTo(r.telegramChatId, title, body);
  }
}

function courseTeachers(course: Course, users: UserAccount[]) {
  return users.filter(u => u.role === 'teacher' && u.instructorId === course.instructorId);
}

function leadership(users: UserAccount[]) {
  return users.filter(u => u.staffTitle === 'director' || u.staffTitle === 'committee');
}

function countdownLine(course: Course, today: string): string | null {
  if (!course.endDate) return null;
  const left = daysBetween(today, course.endDate);
  if (left < 0) return null;
  return left === 0
    ? `វគ្គ «${course.title}» បញ្ចប់នៅថ្ងៃនេះ។`
    : `នៅសល់ ${left} ថ្ងៃទៀត វគ្គ «${course.title}» នឹងត្រូវបានបញ្ចប់ (${course.endDate})។`;
}

function isActive(course: Course, today: string): boolean {
  if (course.startDate && course.startDate > today) return false;
  // Weekly reports stop once the course has ended (the end notice takes over)
  if (course.endDate && course.endDate < today) return false;
  return true;
}

// Weekly letters for the past 7 days of every active course with class records
export async function sendWeeklyReports(): Promise<{ courses: number; messages: number }> {
  const { date: today } = cambodiaNow();
  const weekStart = addDays(today, -6);
  const users = getUsers();
  const userById = new Map(users.map(u => [u.id, u]));
  const leaders = leadership(users);
  let courseCount = 0;
  let messages = 0;

  for (const course of getCourses().filter(c => isActive(c, today))) {
    const allSessions = getSessions(course.id);
    const weekSessions = allSessions.filter(s => s.date >= weekStart && s.date <= today);
    const students = getCourseStudents(course.id);
    if (weekSessions.length === 0 || students.length === 0) continue;
    courseCount++;

    const exams = getExamScores(course.id);
    const countdown = countdownLine(course, today);
    const period = `${weekStart} ដល់ ${today}`;
    const teacherDays = weekSessions.map(s => {
      const status = s.teacherStatus === 'present' ? 'មានវត្តមាន' : s.teacherStatus === 'mission' ? 'បេសកកម្ម (មិនរាប់)' : 'អវត្តមាន (មិនរាប់)';
      return `• ${s.date}: គ្រូ${status}${s.lessonCompleted ? ' • បានបញ្ចប់មេរៀន' : ' • មិនទាន់បញ្ចប់មេរៀន'}`;
    });

    const summaryLines: string[] = [];
    for (const student of students) {
      const missing = missingItems(student.id, weekSessions);
      const grade = gradeForStudent(student, course);
      summaryLines.push(
        missing.length
          ? `❌ ${student.name}: មិនទាន់បំពេញ ${missing.length} ចំណុច — ${missing.join('; ')} (ពិន្ទុបច្ចុប្បន្ន ${grade.total}/100)`
          : `✅ ${student.name}: បានបំពេញគ្រប់ចំណុច (ពិន្ទុបច្ចុប្បន្ន ${grade.total}/100)`
      );

      const body = [
        `វគ្គ៖ ${course.title}`,
        `សប្តាហ៍៖ ${period}`,
        '',
        missing.length
          ? `អ្នកមិនទាន់បានបំពេញចំណុចខាងក្រោម៖\n${missing.map(m => `• ${m}`).join('\n')}\n\nសូមបំពេញឱ្យបានគ្រប់ ហើយទាក់ទងលោកគ្រូ/អ្នកគ្រូ ប្រសិនបើមានបញ្ហា។`
          : 'អ្នកបានបំពេញវត្តមាន តេស្ត និងលំហាត់ គ្រប់ចំណុចក្នុងសប្តាហ៍នេះ។ សូមបន្តការខិតខំ! 👏',
        '',
        `វត្តមាន ${grade.presentDays}/${grade.countedDays} ថ្ងៃ • ពិន្ទុបច្ចុប្បន្ន ${grade.total}/100`,
        ...(countdown ? ['', countdown] : [])
      ].join('\n');
      const target = userById.get(student.id);
      if (target) {
        await deliver([target], missing.length ? '📋 លិខិតជូនដំណឹង៖ ចំណុចមិនទាន់បំពេញ' : '✅ របាយការណ៍ប្រចាំសប្តាហ៍៖ បំពេញគ្រប់ចំណុច', body);
        messages++;
      }
    }

    // Teacher and centre leadership get the class report
    const report = [
      `វគ្គ៖ ${course.title}`,
      `គ្រូបង្រៀន៖ ${course.instructor?.name || '—'}`,
      `សប្តាហ៍៖ ${period}`,
      '',
      'វត្តមានគ្រូ និងមេរៀន៖',
      ...teacherDays,
      '',
      `សិស្ស (${students.length} នាក់)៖`,
      ...summaryLines,
      ...(countdown ? ['', countdown] : [])
    ].join('\n');
    const staff = [...courseTeachers(course, users), ...leaders];
    if (staff.length) {
      await deliver(staff, `📊 របាយការណ៍ប្រចាំសប្តាហ៍ — ${course.title}`, report);
      messages += staff.length;
    }
    // Copy to the centre's Telegram chat
    await sendTelegramMessage(`📊 <b>របាយការណ៍ប្រចាំសប្តាហ៍</b>\n\n${escapeHtml(report)}`);
  }

  updateSettings({ lastWeeklyReportDate: today });
  return { courses: courseCount, messages };
}

// Once a course reaches its end date: thank-you notice to students, teachers and leadership
export async function sendCourseEndNotices(): Promise<number> {
  const { date: today } = cambodiaNow();
  const users = getUsers();
  const userById = new Map(users.map(u => [u.id, u]));
  let sent = 0;

  for (const course of getCourses()) {
    if (!course.endDate || course.endNoticeSentAt || course.endDate > today) continue;
    const students = getCourseStudents(course.id).map(s => userById.get(s.id)).filter((u): u is UserAccount => Boolean(u));
    const recipients = [...students, ...courseTeachers(course, users), ...leadership(users)];
    const body = [`វគ្គ «${course.title}» ត្រូវបានបញ្ចប់ហើយ (${course.endDate})។`, '', THANKS].join('\n');
    await deliver(recipients, '🎓 វគ្គសិក្សាត្រូវបានបញ្ចប់', body);
    await sendTelegramMessage(`🎓 <b>វគ្គសិក្សាត្រូវបានបញ្ចប់</b>\n${escapeHtml(body)}`);
    markCourseEndNoticeSent(course.id);
    sent++;
  }
  return sent;
}

// Called regularly by the scheduler: weekly reports on Friday afternoon (once), end notices daily
export async function runScheduledReports() {
  const now = cambodiaNow();
  const endNotices = await sendCourseEndNotices();
  const due = now.weekday === REPORT_WEEKDAY && now.hour >= REPORT_HOUR && getSettings().lastWeeklyReportDate !== now.date;
  const weekly = due ? await sendWeeklyReports() : null;
  return { now, endNotices, weekly };
}
