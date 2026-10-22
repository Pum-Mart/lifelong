import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { Course, Enrollment, Certificate, WorkshopEvent, AdminAnalytics, Instructor, Payment, PaymentStatus, Registration, UserAccount, ClassSession, ExamScore, AppNotification, CourseCompletion, AssessmentAttempt, CertificateRequest, QuizQuestion, RetakeRequest, DownloadRequest } from '@/types';
import { INITIAL_COURSES, INSTRUCTORS, WORKSHOP_EVENTS } from './data';

interface DatabaseSchema {
  courses: Course[];
  instructors: Instructor[];
  enrollments: Enrollment[];
  certificates: Certificate[];
  events: WorkshopEvent[];
  orders: {
    id: string;
    studentName: string;
    studentEmail: string;
    courseId: string;
    courseTitle: string;
    amount: number;
    date: string;
    status: 'completed' | 'processing';
  }[];
  payments: Payment[];
  registrations: Registration[];
  users: UserAccount[];
  sessions: ClassSession[];
  examScores: ExamScore[];
  notifications: AppNotification[];
  settings: { lastWeeklyReportDate?: string };
  completions: CourseCompletion[];
  attempts: AssessmentAttempt[];
  certificateRequests: CertificateRequest[];
  retakeRequests: RetakeRequest[];
  downloadRequests: DownloadRequest[];
}

const DATA_DIR = path.join(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'database.json');

function getInitialData(): DatabaseSchema {
  const initialEnrollments: Enrollment[] = [
    {
      id: 'enr-1',
      userId: 'user-student',
      courseId: 'course-1',
      enrolledAt: '2026-09-20T10:00:00Z',
      lastAccessedAt: '2026-10-15T14:30:00Z',
      progressPercentage: 66,
      completedLessonIds: ['les-101', 'les-102'],
      currentLessonId: 'les-103',
      isCompleted: false,
    },
    {
      id: 'enr-2',
      userId: 'user-student',
      courseId: 'course-2',
      enrolledAt: '2026-09-01T09:00:00Z',
      lastAccessedAt: '2026-10-10T16:00:00Z',
      progressPercentage: 100,
      completedLessonIds: ['les-201', 'les-202', 'les-203'],
      currentLessonId: 'les-203',
      isCompleted: true,
      completedAt: '2026-10-10T16:00:00Z',
      certificateId: 'cert-1001'
    }
  ];

  const initialCertificates: Certificate[] = [
    {
      id: 'cert-1001',
      certificateCode: 'LLC-2026-883492',
      studentName: 'Eleanor Vance',
      studentEmail: 'eleanor.vance@example.com',
      courseId: 'course-2',
      courseTitle: 'Mindful Botanical Watercolor & Nature Illustration',
      instructorName: 'Elena Rostova, MFA',
      issueDate: 'October 10, 2026',
      ceus: 1.5,
      grade: 'Distinction (Honors)',
      verificationUrl: '/certificate/cert-1001'
    }
  ];

  const initialOrders = [
    {
      id: 'ORD-9821',
      studentName: 'Eleanor Vance',
      studentEmail: 'eleanor.vance@example.com',
      courseId: 'course-1',
      courseTitle: 'Generative AI & ChatGPT: Everyday Productivity & Creativity',
      amount: 49,
      date: '2026-09-20',
      status: 'completed' as const
    },
    {
      id: 'ORD-9755',
      studentName: 'Eleanor Vance',
      studentEmail: 'eleanor.vance@example.com',
      courseId: 'course-2',
      courseTitle: 'Mindful Botanical Watercolor & Nature Illustration',
      amount: 55,
      date: '2026-09-01',
      status: 'completed' as const
    },
    {
      id: 'ORD-9712',
      studentName: 'Robert MacIntyre',
      studentEmail: 'robert.m@example.com',
      courseId: 'course-3',
      courseTitle: 'Functional Mobility, Posture & Vitality for Lifelong Independence',
      amount: 45,
      date: '2026-09-29',
      status: 'completed' as const
    },
    {
      id: 'ORD-9690',
      studentName: 'Grace Holloway',
      studentEmail: 'grace.h@example.com',
      courseId: 'course-4',
      courseTitle: 'Modern Retirement & Legacy Blueprint: Taxes, Income & Security',
      amount: 69,
      date: '2026-10-02',
      status: 'completed' as const
    }
  ];

  return {
    courses: INITIAL_COURSES,
    instructors: INSTRUCTORS,
    enrollments: initialEnrollments,
    certificates: initialCertificates,
    events: WORKSHOP_EVENTS,
    orders: initialOrders,
    payments: [],
    registrations: [],
    users: [],
    sessions: [],
    examScores: [],
    notifications: [],
    settings: {},
    completions: [],
    attempts: [],
    certificateRequests: [],
    retakeRequests: [],
    downloadRequests: []
  };
}

export function readDatabase(): DatabaseSchema {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }

    if (!fs.existsSync(DB_FILE)) {
      const initial = getInitialData();
      fs.writeFileSync(DB_FILE, JSON.stringify(initial, null, 2), 'utf-8');
      return initial;
    }

    const fileContent = fs.readFileSync(DB_FILE, 'utf-8');
    const parsed = JSON.parse(fileContent);
    // Databases created before these features existed lack their lists
    parsed.payments = parsed.payments || [];
    parsed.registrations = parsed.registrations || [];
    parsed.users = parsed.users || [];
    parsed.sessions = parsed.sessions || [];
    parsed.examScores = parsed.examScores || [];
    parsed.notifications = parsed.notifications || [];
    parsed.settings = parsed.settings || {};
    parsed.completions = parsed.completions || [];
    parsed.attempts = parsed.attempts || [];
    parsed.certificateRequests = parsed.certificateRequests || [];
    parsed.retakeRequests = parsed.retakeRequests || [];
    parsed.downloadRequests = parsed.downloadRequests || [];
    return parsed;
  } catch (error) {
    console.error('Failed reading database file, returning in-memory initial data', error);
    return getInitialData();
  }
}

export function writeDatabase(data: DatabaseSchema): boolean {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf-8');
    return true;
  } catch (error) {
    console.error('Failed writing database file:', error);
    return false;
  }
}

// Helpers for specific entities
export function getCourses(): Course[] {
  const db = readDatabase();
  return db.courses.map(course => {
    const instructor = db.instructors.find(i => i.id === course.instructorId);
    return { ...course, instructor };
  });
}

export function getCourseBySlug(slug: string): Course | null {
  const courses = getCourses();
  return courses.find(c => c.slug === slug || c.id === slug) || null;
}

export function saveCourse(course: Course): Course {
  const db = readDatabase();
  // The instructor is joined in on read; storing a copy would go stale when the teacher is edited
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { instructor, ...stored } = course;
  course = stored;
  const existingIdx = db.courses.findIndex(c => c.id === course.id);
  if (existingIdx >= 0) {
    db.courses[existingIdx] = course;
  } else {
    db.courses.unshift(course);
  }
  writeDatabase(db);
  return course;
}

export function deleteCourse(courseId: string): boolean {
  const db = readDatabase();
  db.courses = db.courses.filter(c => c.id !== courseId);
  writeDatabase(db);
  return true;
}

export function getEnrollments(userId?: string): Enrollment[] {
  const db = readDatabase();
  const courses = getCourses();
  let list = db.enrollments;
  if (userId) {
    list = list.filter(e => e.userId === userId);
  }
  return list.map(e => ({
    ...e,
    course: courses.find(c => c.id === e.courseId)
  }));
}

export function enrollStudent(
  userId: string,
  courseId: string,
  studentName: string = 'Learner',
  studentEmail: string = 'learner@example.com',
  amountPaid?: number
): Enrollment {
  const db = readDatabase();
  let existing = db.enrollments.find(e => e.userId === userId && e.courseId === courseId);
  const targetCourse = db.courses.find(c => c.id === courseId);

  if (!existing) {
    const firstLessonId = targetCourse?.modules[0]?.lessons[0]?.id;
    existing = {
      id: `enr-${Date.now()}`,
      userId,
      courseId,
      enrolledAt: new Date().toISOString(),
      lastAccessedAt: new Date().toISOString(),
      progressPercentage: 0,
      completedLessonIds: [],
      currentLessonId: firstLessonId,
      isCompleted: false
    };
    db.enrollments.unshift(existing);

    // Increase course enrollment count
    if (targetCourse) {
      targetCourse.enrolledStudentsCount = (targetCourse.enrolledStudentsCount || 0) + 1;
    }

    // Record order
    if (targetCourse) {
      db.orders.unshift({
        id: `ORD-${Math.floor(1000 + Math.random() * 9000)}`,
        studentName,
        studentEmail,
        courseId: targetCourse.id,
        courseTitle: targetCourse.title,
        amount: amountPaid ?? targetCourse.price,
        date: new Date().toISOString().split('T')[0],
        status: 'completed'
      });
    }

    writeDatabase(db);
  }

  const courses = getCourses();
  return {
    ...existing,
    course: courses.find(c => c.id === existing?.courseId)
  };
}

export function updateLessonProgress(
  userId: string,
  courseId: string,
  lessonId: string,
  completed: boolean,
  student: { name: string; email: string } = { name: 'Learner', email: '' }
): { enrollment: Enrollment; newCertificate?: Certificate } {
  const db = readDatabase();
  const enrollment = db.enrollments.find(e => e.userId === userId && e.courseId === courseId);
  const course = db.courses.find(c => c.id === courseId);
  if (!course) {
    throw new Error('Course not found');
  }

  if (!enrollment) {
    // Only free courses can be joined just by starting a lesson
    if (course.price > 0) {
      throw new Error('Payment required');
    }
    enrollStudent(userId, courseId, student.name, student.email);
    return updateLessonProgress(userId, courseId, lessonId, completed, student);
  }

  // Count total lessons
  const allLessonIds: string[] = [];
  course.modules.forEach(m => {
    m.lessons.forEach(l => allLessonIds.push(l.id));
  });

  const completedSet = new Set(enrollment.completedLessonIds);
  if (completed) {
    completedSet.add(lessonId);
  } else {
    completedSet.delete(lessonId);
  }

  enrollment.completedLessonIds = Array.from(completedSet);
  enrollment.currentLessonId = lessonId;
  enrollment.lastAccessedAt = new Date().toISOString();

  const totalLessons = allLessonIds.length || 1;
  const progressPercent = Math.min(100, Math.round((enrollment.completedLessonIds.length / totalLessons) * 100));
  enrollment.progressPercentage = progressPercent;

  // Finishing every lesson no longer issues a certificate by itself: certificates need the
  // pre-test, homework and exam, plus approval by the director/committee (see lib/assessments).
  const newCertificate: Certificate | undefined = undefined;
  if (progressPercent === 100 && !enrollment.completedAt) {
    enrollment.completedAt = new Date().toISOString();
  }

  writeDatabase(db);
  const courses = getCourses();

  return {
    enrollment: {
      ...enrollment,
      course: courses.find(c => c.id === enrollment.courseId)
    },
    newCertificate
  };
}

export function getCertificateById(id: string): Certificate | null {
  const db = readDatabase();
  return db.certificates.find(c => c.id === id || c.certificateCode === id) || null;
}

export function getAdminAnalytics(): AdminAnalytics {
  const db = readDatabase();
  const totalRevenue = db.orders.reduce((acc, curr) => acc + (curr.amount || 0), 0);
  const totalEnrollments = db.enrollments.length;
  const completedEnrollments = db.enrollments.filter(e => e.isCompleted).length;
  const completionRate = totalEnrollments > 0 ? Math.round((completedEnrollments / totalEnrollments) * 100) : 0;

  return {
    totalRevenue,
    revenueChangeMonth: 18.4,
    totalStudents: 3420 + db.enrollments.length,
    studentsChangeMonth: 12.6,
    activeCourses: db.courses.length,
    completionRate: completionRate || 82,
    certificatesIssued: db.certificates.length,
    recentOrders: db.orders.slice(0, 8)
  };
}

export function getUsers(): UserAccount[] {
  return readDatabase().users;
}

export function getUserById(id: string): UserAccount | null {
  return readDatabase().users.find(u => u.id === id) || null;
}

export function getUserByEmail(email: string): UserAccount | null {
  const lower = email.trim().toLowerCase();
  return readDatabase().users.find(u => u.email === lower) || null;
}

export function createUser(data: Omit<UserAccount, 'id' | 'createdAt' | 'sessionVersion'>): UserAccount {
  const db = readDatabase();
  const user: UserAccount = {
    ...data,
    email: data.email.trim().toLowerCase(),
    id: `user-${crypto.randomUUID()}`,
    sessionVersion: 1,
    createdAt: new Date().toISOString()
  };
  db.users.push(user);
  writeDatabase(db);
  return user;
}

export function updateUser(id: string, changes: Partial<Omit<UserAccount, 'id' | 'email' | 'createdAt'>>): UserAccount | null {
  const db = readDatabase();
  const user = db.users.find(u => u.id === id);
  if (!user) return null;
  Object.assign(user, changes);
  writeDatabase(db);
  return user;
}

export function getUserByTelegramCode(code: string): UserAccount | null {
  return readDatabase().users.find(u => u.telegramLinkCode === code) || null;
}

// ---------- Class sessions, exams ----------

export function getSessions(courseId: string): ClassSession[] {
  return readDatabase().sessions.filter(s => s.courseId === courseId).sort((a, b) => a.date.localeCompare(b.date));
}

// One session per course per date: saving the same date again updates it
export function saveSession(data: Omit<ClassSession, 'id' | 'updatedAt'>): ClassSession {
  const db = readDatabase();
  const existing = db.sessions.find(s => s.courseId === data.courseId && s.date === data.date);
  const session: ClassSession = {
    ...data,
    id: existing?.id || `sess-${crypto.randomUUID()}`,
    updatedAt: new Date().toISOString()
  };
  if (existing) Object.assign(existing, session);
  else db.sessions.push(session);
  writeDatabase(db);
  return session;
}

export function deleteSession(courseId: string, sessionId: string): boolean {
  const db = readDatabase();
  const before = db.sessions.length;
  db.sessions = db.sessions.filter(s => !(s.id === sessionId && s.courseId === courseId));
  writeDatabase(db);
  return db.sessions.length < before;
}

export function getExamScores(courseId: string): ExamScore[] {
  return readDatabase().examScores.filter(e => e.courseId === courseId);
}

export function saveExamScore(courseId: string, userId: string, score: number | null) {
  const db = readDatabase();
  db.examScores = db.examScores.filter(e => !(e.courseId === courseId && e.userId === userId));
  if (score !== null) db.examScores.push({ courseId, userId, score, updatedAt: new Date().toISOString() });
  writeDatabase(db);
}

// Students of a course: enrolled real accounts (demo enrollments without an account are skipped)
export function getCourseStudents(courseId: string): { id: string; name: string; email: string }[] {
  const db = readDatabase();
  const ids = new Set(db.enrollments.filter(e => e.courseId === courseId).map(e => e.userId));
  return db.users.filter(u => ids.has(u.id)).map(u => ({ id: u.id, name: u.name, email: u.email }));
}

export function markCourseEndNoticeSent(courseId: string) {
  const db = readDatabase();
  const course = db.courses.find(c => c.id === courseId);
  if (course) {
    course.endNoticeSentAt = new Date().toISOString();
    writeDatabase(db);
  }
}

// ---------- Notifications (account inbox) ----------

export function addNotifications(items: Omit<AppNotification, 'id' | 'createdAt'>[]) {
  if (items.length === 0) return;
  const db = readDatabase();
  const now = new Date().toISOString();
  for (const item of items) {
    db.notifications.push({ ...item, id: `ntf-${crypto.randomUUID()}`, createdAt: now });
  }
  writeDatabase(db);
}

export function getNotifications(userId: string): AppNotification[] {
  return readDatabase().notifications.filter(n => n.userId === userId).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export function markNotificationsRead(userId: string) {
  const db = readDatabase();
  const now = new Date().toISOString();
  for (const n of db.notifications) {
    if (n.userId === userId && !n.readAt) n.readAt = now;
  }
  writeDatabase(db);
}

// ---------- Course completion & certificates ----------

export function getCompletion(courseId: string): CourseCompletion | null {
  return readDatabase().completions.find(c => c.courseId === courseId) || null;
}

export function getCompletions(): CourseCompletion[] {
  return readDatabase().completions;
}

export function saveCompletion(completion: CourseCompletion): CourseCompletion {
  const db = readDatabase();
  db.completions = db.completions.filter(c => c.courseId !== completion.courseId);
  db.completions.push({ ...completion, updatedAt: new Date().toISOString() });
  writeDatabase(db);
  return completion;
}

// Issues (or returns the existing) certificate of a learner for a course. Paid courses do
// not print the score; free courses do. Also marks the enrollment completed.
function issueCertificateIn(
  db: DatabaseSchema,
  course: Course,
  learner: { userId: string; name: string; email: string; total: number },
  reviewer: string,
  reviewerTitle?: string
): Certificate {
  const existing = db.certificates.find(c => c.courseId === course.id && c.studentEmail === learner.email);
  if (existing) return existing;

  const certId = `cert-${crypto.randomUUID()}`;
  const instructor = db.instructors.find(i => i.id === course.instructorId);
  // Serial number per series: Lllcf-0001 (free study), Lllc-0001 (paid study)
  const prefix = course.price > 0 ? PAID_CERT_PREFIX : FREE_CERT_PREFIX;
  const serial =
    db.certificates
      .filter(c => c.certificateCode.startsWith(prefix))
      .reduce((max, c) => Math.max(max, Number(c.certificateCode.slice(prefix.length)) || 0), 0) + 1;
  const certificate: Certificate = {
    id: certId,
    certificateCode: `${prefix}${String(serial).padStart(4, '0')}`,
    studentName: learner.name,
    studentEmail: learner.email,
    courseId: course.id,
    courseTitle: course.title,
    instructorName: instructor?.name || 'Lifelong Learning Center',
    issueDate: new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }),
    ceus: course.ceus || 1.5,
    grade: course.price > 0 ? undefined : `${learner.total}/100`,
    verificationUrl: `/certificate/${certId}`,
    approvedBy: reviewer,
    approvedByTitle: reviewerTitle,
    // Whoever approves (director, committee or admin), only the director signs
    signedBy: db.users.find(u => u.staffTitle === 'director')?.name,
    // Issued only after approval by the director/committee/admin — that approval is the
    // handover. Both series then get DOWNLOADS_PER_GRANT downloads; more need a request.
    downloadCount: 0,
    downloadAllowance: DOWNLOADS_PER_GRANT
  };
  db.certificates.unshift(certificate);

  const enrollment = db.enrollments.find(e => e.userId === learner.userId && e.courseId === course.id);
  if (enrollment) {
    enrollment.isCompleted = true;
    enrollment.completedAt = enrollment.completedAt || new Date().toISOString();
    enrollment.certificateId = certId;
  }
  // A pending self-study request for the same learner is settled by this certificate
  for (const r of db.certificateRequests) {
    if (r.userId === learner.userId && r.courseId === course.id && r.status === 'pending') {
      r.status = 'approved';
      r.reviewedBy = reviewer;
      r.reviewedAt = new Date().toISOString();
      r.certificateId = certId;
    }
  }
  return certificate;
}

// Approves a submitted class sheet: certificates for every result marked passed (on paid
// courses every learner is marked passed). Returns the updated sheet.
export function approveCompletion(courseId: string, reviewer: string, reviewerTitle?: string): CourseCompletion | null {
  const db = readDatabase();
  const completion = db.completions.find(c => c.courseId === courseId);
  const course = db.courses.find(c => c.id === courseId);
  if (!completion || completion.status !== 'submitted' || !course) return null;

  for (const result of completion.results) {
    if (!result.passed) continue;
    result.certificateId = issueCertificateIn(db, course, result, reviewer, reviewerTitle).id;
  }

  completion.status = 'approved';
  completion.reviewedBy = reviewer;
  completion.reviewedAt = new Date().toISOString();
  completion.updatedAt = completion.reviewedAt;
  writeDatabase(db);
  return completion;
}

// ---------- Online assessments ----------

export function getAttempts(userId: string, courseId: string): AssessmentAttempt[] {
  return readDatabase().attempts.filter(a => a.userId === userId && a.courseId === courseId);
}

export function addAttempt(data: Omit<AssessmentAttempt, 'id' | 'createdAt'>): AssessmentAttempt {
  const db = readDatabase();
  const attempt: AssessmentAttempt = { ...data, id: `att-${crypto.randomUUID()}`, createdAt: new Date().toISOString() };
  db.attempts.push(attempt);
  writeDatabase(db);
  return attempt;
}

export function saveCourseAssessments(courseId: string, assessments: { preTest: QuizQuestion[]; exam: QuizQuestion[] }) {
  const db = readDatabase();
  const course = db.courses.find(c => c.id === courseId);
  if (!course) return false;
  course.assessments = assessments;
  writeDatabase(db);
  return true;
}

// ---------- Certificate downloads ----------

export const FREE_CERT_PREFIX = 'Lllcf-';
export const PAID_CERT_PREFIX = 'Lllc-';
// Each learner may download/print a certificate this many times; more needs approval
export const DOWNLOADS_PER_GRANT = 2;

export function downloadsLeft(cert: Certificate): number {
  return Math.max(0, (cert.downloadAllowance ?? DOWNLOADS_PER_GRANT) - (cert.downloadCount ?? 0));
}

// Uses one download; returns the downloads left afterwards, or null when none were left
export function consumeCertificateDownload(certId: string): number | null {
  const db = readDatabase();
  const cert = db.certificates.find(c => c.id === certId);
  if (!cert || downloadsLeft(cert) <= 0) return null;
  cert.downloadCount = (cert.downloadCount ?? 0) + 1;
  writeDatabase(db);
  return downloadsLeft(cert);
}

export function getDownloadRequests(): DownloadRequest[] {
  return readDatabase().downloadRequests;
}

export function getDownloadRequestsFor(certificateId: string): DownloadRequest[] {
  return readDatabase()
    .downloadRequests.filter(r => r.certificateId === certificateId)
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
}

export function createDownloadRequest(data: Omit<DownloadRequest, 'id' | 'status' | 'createdAt'>): DownloadRequest {
  const db = readDatabase();
  const request: DownloadRequest = { ...data, id: `dlr-${crypto.randomUUID()}`, status: 'pending', createdAt: new Date().toISOString() };
  db.downloadRequests.push(request);
  writeDatabase(db);
  return request;
}

// Approving grants DOWNLOADS_PER_GRANT more downloads
export function reviewDownloadRequest(id: string, action: 'approve' | 'reject', reviewer: string, note?: string): DownloadRequest | null {
  const db = readDatabase();
  const request = db.downloadRequests.find(r => r.id === id);
  const cert = request && db.certificates.find(c => c.id === request.certificateId);
  if (!request || !cert || request.status !== 'pending') return null;
  request.status = action === 'approve' ? 'approved' : 'rejected';
  request.reviewedBy = reviewer;
  request.reviewedAt = new Date().toISOString();
  request.reviewNote = note;
  if (action === 'approve') {
    cert.downloadAllowance = Math.max(cert.downloadAllowance ?? DOWNLOADS_PER_GRANT, cert.downloadCount ?? 0) + DOWNLOADS_PER_GRANT;
  }
  writeDatabase(db);
  return request;
}

// ---------- Exam retake requests ----------

export function getRetakeRequests(): RetakeRequest[] {
  return readDatabase().retakeRequests;
}

export function getRetakeRequestsFor(userId: string, courseId: string): RetakeRequest[] {
  return readDatabase()
    .retakeRequests.filter(r => r.userId === userId && r.courseId === courseId)
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
}

export function createRetakeRequest(data: Omit<RetakeRequest, 'id' | 'status' | 'createdAt'>): RetakeRequest {
  const db = readDatabase();
  const request: RetakeRequest = { ...data, id: `rtk-${crypto.randomUUID()}`, status: 'pending', createdAt: new Date().toISOString() };
  db.retakeRequests.push(request);
  writeDatabase(db);
  return request;
}

export function reviewRetakeRequest(id: string, action: 'approve' | 'reject', reviewer: string, note?: string): RetakeRequest | null {
  const db = readDatabase();
  const request = db.retakeRequests.find(r => r.id === id);
  if (!request || request.status !== 'pending') return null;
  request.status = action === 'approve' ? 'approved' : 'rejected';
  request.reviewedBy = reviewer;
  request.reviewedAt = new Date().toISOString();
  request.reviewNote = note;
  writeDatabase(db);
  return request;
}

// ---------- Self-study certificate requests ----------

export function getCertificateRequests(): CertificateRequest[] {
  return readDatabase().certificateRequests;
}

export function getCertificateRequestFor(userId: string, courseId: string): CertificateRequest | null {
  return (
    readDatabase()
      .certificateRequests.filter(r => r.userId === userId && r.courseId === courseId)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0] || null
  );
}

export function hasCertificate(email: string, courseId: string): Certificate | null {
  return readDatabase().certificates.find(c => c.courseId === courseId && c.studentEmail === email) || null;
}

export function createCertificateRequest(data: Omit<CertificateRequest, 'id' | 'status' | 'createdAt'>): CertificateRequest {
  const db = readDatabase();
  const request: CertificateRequest = { ...data, id: `creq-${crypto.randomUUID()}`, status: 'pending', createdAt: new Date().toISOString() };
  db.certificateRequests.push(request);
  writeDatabase(db);
  return request;
}

export function reviewCertificateRequest(
  id: string,
  action: 'approve' | 'reject',
  reviewer: string,
  note?: string,
  reviewerTitle?: string
): { request: CertificateRequest; certificate?: Certificate } | null {
  const db = readDatabase();
  const request = db.certificateRequests.find(r => r.id === id);
  const course = request && db.courses.find(c => c.id === request.courseId);
  if (!request || !course || request.status !== 'pending') return null;

  if (action === 'reject') {
    request.status = 'rejected';
    request.reviewedBy = reviewer;
    request.reviewedAt = new Date().toISOString();
    request.reviewNote = note;
    writeDatabase(db);
    return { request };
  }
  const certificate = issueCertificateIn(db, course, request, reviewer, reviewerTitle);
  request.status = 'approved';
  request.reviewedBy = reviewer;
  request.reviewedAt = new Date().toISOString();
  request.certificateId = certificate.id;
  writeDatabase(db);
  return { request, certificate };
}

export function getSettings() {
  return readDatabase().settings;
}

export function updateSettings(changes: Partial<DatabaseSchema['settings']>) {
  const db = readDatabase();
  db.settings = { ...db.settings, ...changes };
  writeDatabase(db);
}

export function getInstructors(): Instructor[] {
  return readDatabase().instructors;
}

export function saveInstructor(instructor: Instructor): Instructor {
  const db = readDatabase();
  const idx = db.instructors.findIndex(i => i.id === instructor.id);
  if (idx >= 0) {
    db.instructors[idx] = instructor;
  } else {
    db.instructors.push(instructor);
  }
  writeDatabase(db);
  return instructor;
}

// Refuses to delete a teacher who still teaches a course
export function deleteInstructor(instructorId: string): { ok: boolean; courseCount: number } {
  const db = readDatabase();
  const courseCount = db.courses.filter(c => c.instructorId === instructorId).length;
  if (courseCount > 0) return { ok: false, courseCount };
  db.instructors = db.instructors.filter(i => i.id !== instructorId);
  writeDatabase(db);
  return { ok: true, courseCount: 0 };
}

export function getRegistrations(userId?: string): Registration[] {
  const db = readDatabase();
  return userId ? db.registrations.filter(r => r.userId === userId) : db.registrations;
}

export function getRegistrationByCode(code: string): Registration | null {
  const upper = code.toUpperCase();
  return readDatabase().registrations.find(r => r.code === upper) || null;
}

// Unambiguous characters only (no 0/O, 1/I), so codes are easy to read off a card
const CODE_ALPHABET = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';

function newRegistrationCode(existing: Registration[]): string {
  for (;;) {
    const bytes = crypto.randomBytes(6);
    const code = 'REG-' + Array.from(bytes, b => CODE_ALPHABET[b % CODE_ALPHABET.length]).join('');
    if (!existing.some(r => r.code === code)) return code;
  }
}

export function createRegistration(
  data: Omit<Registration, 'id' | 'code' | 'createdAt' | 'verifiedAt' | 'verifiedBy'>
): Registration {
  const db = readDatabase();
  const registration: Registration = {
    ...data,
    id: `regn-${Date.now()}`,
    code: newRegistrationCode(db.registrations),
    createdAt: new Date().toISOString()
  };
  db.registrations.unshift(registration);
  writeDatabase(db);
  return registration;
}

export function markRegistrationVerified(code: string, verifiedBy: string): Registration | null {
  const db = readDatabase();
  const registration = db.registrations.find(r => r.code === code.toUpperCase());
  if (!registration) return null;
  if (!registration.verifiedAt) {
    registration.verifiedAt = new Date().toISOString();
    registration.verifiedBy = verifiedBy;
    writeDatabase(db);
  }
  return registration;
}

export function getPayments(userId?: string): Payment[] {
  const db = readDatabase();
  return userId ? db.payments.filter(p => p.userId === userId) : db.payments;
}

export function createPayment(payment: Omit<Payment, 'id' | 'status' | 'createdAt'>): Payment {
  const db = readDatabase();
  const created: Payment = {
    ...payment,
    id: `PAY-${Date.now().toString(36).toUpperCase()}`,
    status: 'pending',
    createdAt: new Date().toISOString()
  };
  db.payments.unshift(created);
  writeDatabase(db);
  return created;
}

// Approving enrolls the student in every course of the payment, recording each
// course's share of the discounted total as the order amount.
export function reviewPayment(paymentId: string, status: Exclude<PaymentStatus, 'pending'>): Payment | null {
  const db = readDatabase();
  const payment = db.payments.find(p => p.id === paymentId);
  if (!payment || payment.status !== 'pending') return null;

  payment.status = status;
  payment.reviewedAt = new Date().toISOString();
  writeDatabase(db);

  if (status === 'approved') {
    const ratio = payment.subtotal > 0 ? payment.total / payment.subtotal : 0;
    for (const item of payment.items) {
      const amountPaid = Math.round(item.price * ratio * 100) / 100;
      enrollStudent(payment.userId, item.courseId, payment.studentName, payment.studentEmail, amountPaid);
    }
  }
  return payment;
}

export function rsvpWorkshopEvent(eventId: string): WorkshopEvent | null {
  const db = readDatabase();
  const event = db.events.find(e => e.id === eventId);
  if (!event) return null;

  if (event.seatsBooked < event.seatsTotal) {
    event.seatsBooked += 1;
    writeDatabase(db);
  }
  return event;
}
