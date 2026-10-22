export type CourseLevel = 'All Levels' | 'Beginner' | 'Intermediate' | 'Advanced';
export type CourseFormat = 'Online Self-Paced' | 'Live Webinar' | 'In-Person Workshop';

export interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
}

export interface Lesson {
  id: string;
  title: string;
  duration: string;
  videoUrl?: string;
  summary: string;
  content?: string[]; // Lesson body, one paragraph or step per entry
  notes: string;
  activity?: string; // Hands-on practice task

  isFreePreview?: boolean;
  quiz?: QuizQuestion[];
}

export interface CourseModule {
  id: string;
  title: string;
  description: string;
  lessons: Lesson[];
}

export interface Instructor {
  id: string;
  name: string;
  title: string;
  bio: string;
  avatar: string; // Portrait photo, displayed at 4x6 (2:3)
  experience?: string; // Teaching experience
  credentials: string[];
  rating: number;
  totalStudents: number;
  coursesCount: number;
}

export interface Review {
  id: string;
  userName: string;
  userAvatar: string;
  rating: number;
  date: string;
  comment: string;
  courseTitle?: string;
}

export interface Course {
  id: string;
  slug: string;
  title: string;
  subtitle: string;
  description: string;
  category: string;
  level: CourseLevel;
  format: CourseFormat;
  duration: string;
  lecturesCount: number;
  price: number;
  originalPrice: number;
  rating: number;
  reviewsCount: number;
  featured?: boolean;
  popular?: boolean;
  thumbnail: string;
  instructorId: string;
  instructor?: Instructor;
  tags: string[];
  learningOutcomes: string[];
  prerequisites: string[];
  targetAudience: string[];
  modules: CourseModule[];
  reviews?: Review[];
  enrolledStudentsCount: number;
  ceus?: number; // Continuing Education Units
  badge?: string;
  updatedAt: string;
  assessments?: { preTest?: QuizQuestion[]; exam?: QuizQuestion[] }; // overrides the default bank
  startDate?: string; // YYYY-MM-DD, class schedule for attendance and countdowns
  endDate?: string; // YYYY-MM-DD
  endNoticeSentAt?: string; // when the "course has ended" message went out
}

export type TeacherStatus = 'present' | 'absent' | 'mission';

export interface StudentDayRecord {
  present: boolean;
  testDone: boolean;
  testScore?: number; // 0-100; done without a score counts as 100
  exerciseDone: boolean;
  exerciseScore?: number; // 0-100; done without a score counts as 100
}

// One class day of a course: teacher attendance, lesson checklist and each student's record.
// Days the teacher is absent or on mission are not counted for students.
export interface ClassSession {
  id: string;
  courseId: string;
  date: string; // YYYY-MM-DD
  lessonTitle: string;
  teacherStatus: TeacherStatus;
  teacherNote?: string;
  lessonCompleted: boolean;
  hasTest: boolean;
  hasExercise: boolean;
  records: Record<string, StudentDayRecord>; // keyed by user id
  updatedAt: string;
  updatedBy: string;
}

export interface ExamScore {
  courseId: string;
  userId: string;
  score: number; // 0-100
  updatedAt: string;
}

export interface GradeBreakdown {
  userId: string;
  name: string;
  countedDays: number; // class days where the teacher was present
  presentDays: number;
  attendancePct: number | null;
  testPct: number | null;
  exercisePct: number | null;
  examPct: number | null;
  total: number; // weighted, out of 100 (missing parts count as 0)
}

// Online assessments: pre-test (once), homework (each lesson's quiz) and the final exam
export type AssessmentKind = 'pretest' | 'homework' | 'exam';

export interface AssessmentAttempt {
  id: string;
  userId: string;
  courseId: string;
  kind: AssessmentKind;
  lessonId?: string; // homework only
  score: number; // 0-100
  correct: number;
  total: number;
  createdAt: string;
}

// Questions as sent to a student: no answers, options shuffled per student
export interface PublicQuestion {
  id: string;
  question: string;
  options: string[];
}

export type GradingScheme = 'free' | 'paid';

// A learner's standing for the certificate, combining online work and the class book
export interface Standing {
  scheme: GradingScheme;
  weights: { test: number; exercise: number; attendance: number; exam: number };
  preTest: { required: boolean; done: boolean; score: number | null };
  homework: { lessonsTotal: number; lessonsDone: number; score: number | null; perLesson: Record<string, number> };
  attendance: { pct: number | null; source: 'class' | 'lessons' | 'none' };
  exam: { done: boolean; score: number | null; source: 'teacher' | 'online' | null };
  testPct: number | null;
  exercisePct: number | null;
  total: number;
  complete: boolean; // every required part is done
  passScore: number;
  passed: boolean; // free: total ≥ passScore; paid: always once complete
}

export type CertificateRequestStatus = 'pending' | 'approved' | 'rejected';

// Raised automatically when a self-study learner finishes every required part
export interface CertificateRequest {
  id: string;
  userId: string;
  name: string;
  email: string;
  courseId: string;
  courseTitle: string;
  scheme: GradingScheme;
  total: number;
  breakdown: { testPct: number; exercisePct: number; attendancePct: number | null; examPct: number };
  status: CertificateRequestStatus;
  createdAt: string;
  reviewedBy?: string;
  reviewedAt?: string;
  reviewNote?: string;
  certificateId?: string;
}

// Letter asking the director/committee/admin for another exam round once attempts run out
export interface RetakeRequest {
  id: string;
  userId: string;
  name: string;
  email: string;
  courseId: string;
  courseTitle: string;
  round: number; // exam round being requested (2 = second round, ...)
  reason: string;
  status: CertificateRequestStatus;
  createdAt: string;
  reviewedBy?: string;
  reviewedAt?: string;
  reviewNote?: string;
}

// Request to download a certificate again after the allowed downloads are used
export interface DownloadRequest {
  id: string;
  certificateId: string;
  certificateCode: string;
  userId: string;
  name: string;
  email: string;
  courseTitle: string;
  reason: string;
  status: CertificateRequestStatus;
  createdAt: string;
  reviewedBy?: string;
  reviewedAt?: string;
  reviewNote?: string;
}

// Final result of one student, prefilled from the class book and editable by the teacher
export interface CompletionResult {
  userId: string;
  name: string;
  email: string;
  attendancePct: number;
  testPct: number;
  exercisePct: number;
  examPct: number;
  total: number;
  passed: boolean;
  certificateId?: string; // set when the director approves
}

export type CompletionStatus = 'draft' | 'submitted' | 'approved' | 'rejected';

// End-of-course result sheet: teacher completes → director approves → certificates issued
export interface CourseCompletion {
  courseId: string;
  courseTitle: string;
  instructorName: string;
  status: CompletionStatus;
  courseCompleted: boolean; // teacher's tick that the course has finished
  results: CompletionResult[];
  submittedBy?: string;
  submittedAt?: string;
  reviewedBy?: string;
  reviewedAt?: string;
  reviewNote?: string;
  updatedAt: string;
}

// ---------- Site content managed by admins (/admin/content) ----------

export interface Announcement {
  id: string;
  title: string;
  body: string; // plain text; blank lines separate paragraphs, lines starting with "-" are bullets
  image?: string;
  published: boolean;
  createdAt: string;
  updatedAt: string;
}

// Daily teaching activity with a photo; shown in the About page slideshow
export interface Activity {
  id: string;
  title: string;
  description: string;
  date: string; // YYYY-MM-DD
  photo: string;
  createdAt: string;
}

export type ResourceType = 'guides' | 'curricula' | 'toolkits' | 'publications' | 'teaching';

// Library document: an uploaded file, or a guide generated from a course's lessons
export interface LibraryResource {
  id: string;
  title: string;
  type: ResourceType;
  category: string;
  description: string;
  file?: { url: string; name: string; mime: string; size: number };
  courseId?: string; // generated "course guide" (titles, summaries, outcomes)
  downloads: number;
  createdAt: string;
}

// Contact form / volunteer sign-up from visitors
export interface VisitorMessage {
  id: string;
  kind: 'contact' | 'volunteer';
  name: string;
  contact: string; // phone or email
  subject?: string;
  message: string;
  createdAt: string;
  handled?: boolean;
}

export interface TickerMessage {
  id: string;
  text: string;
  href?: string; // where clicking the ticker goes (default: /announcements)
}

export interface AppNotification {
  id: string;
  userId: string;
  title: string;
  body: string;
  createdAt: string;
  readAt?: string;
}

export interface Enrollment {
  id: string;
  userId: string;
  courseId: string;
  course?: Course;
  enrolledAt: string;
  lastAccessedAt: string;
  progressPercentage: number;
  completedLessonIds: string[];
  currentLessonId?: string;
  isCompleted: boolean;
  completedAt?: string;
  certificateId?: string;
}

export interface Certificate {
  id: string;
  certificateCode: string;
  studentName: string;
  studentEmail: string;
  courseId: string;
  courseTitle: string;
  instructorName: string;
  issueDate: string;
  ceus?: number;
  verificationUrl: string;
  grade?: string;
  approvedBy?: string; // who approved the result (director, committee member or admin)
  approvedByTitle?: string;
  signedBy?: string; // the centre director — the only signature printed on the certificate
  downloadCount?: number; // times the learner downloaded/printed it
  downloadAllowance?: number; // allowed downloads; raised when a download request is approved
}

export interface CartItem {
  courseId: string;
  course: Course;
  addedAt: string;
}

export interface WorkshopEvent {
  id: string;
  title: string;
  description: string;
  instructorName: string;
  instructorAvatar: string;
  date: string;
  time: string;
  location: string; // e.g. "Live Zoom Session" or "Room 204, Lifelong Learning Center"
  format: 'Online' | 'In-Person';
  category: string;
  seatsTotal: number;
  seatsBooked: number;
  isFree: boolean;
  price?: number;
  tags: string[];
}

export type PaymentStatus = 'pending' | 'approved' | 'rejected';

export interface PaymentItem {
  courseId: string;
  courseTitle: string;
  price: number;
}

// A bank-transfer payment submitted from the checkout popup. Courses unlock only
// after an admin approves it.
export interface Payment {
  id: string;
  userId: string;
  studentName: string;
  studentEmail: string;
  items: PaymentItem[];
  subtotal: number;
  memberDiscountAmount?: number;
  couponCode?: string;
  discountAmount: number;
  total: number;
  totalKhr: number;
  payCurrency?: 'USD' | 'KHR'; // currency the payer transferred in (older records: USD)
  bankId: string;
  bankName: string;
  payerName: string;
  payerPhone: string;
  transactionRef?: string;
  hasReceipt: boolean;
  status: PaymentStatus;
  createdAt: string;
  reviewedAt?: string;
}

// Course registration form filled in after enrolling. Its code is printed on the
// downloadable registration card and checked by the Telegram bot.
export interface Registration {
  id: string;
  code: string; // e.g. REG-7K2Q9M
  userId: string;
  courseId: string;
  courseTitle: string;
  courseDuration: string;
  instructorName: string;
  fullNameKh: string;
  fullNameEn: string;
  gender: 'ប្រុស' | 'ស្រី';
  dateOfBirth: string;
  phone: string;
  address: string;
  telegramUsername?: string;
  photo: string; // 4x6 portrait
  createdAt: string;
  verifiedAt?: string;
  verifiedBy?: string; // Telegram user who posted the card
}

export type AccountRole = 'student' | 'teacher' | 'admin';
// Centre leadership who receive the weekly reports
export type StaffTitle = 'director' | 'committee';

// Stored account (server only — contains the password hash)
export interface UserAccount {
  id: string;
  name: string;
  email: string; // lowercase
  passwordHash: string;
  role: AccountRole;
  isMember: boolean;
  memberSince?: string;
  sessionVersion: number; // bumped on password change to sign out other sessions
  createdAt: string;
  instructorId?: string; // teacher accounts: which teacher profile they are
  staffTitle?: StaffTitle;
  telegramChatId?: number; // set when the user links Telegram via the bot
  telegramLinkCode?: string;
}

// What the browser is allowed to see about the signed-in user
export interface SessionUser {
  id: string;
  name: string;
  email: string;
  role: AccountRole;
  isMember: boolean;
  isOwner: boolean; // listed in ADMIN_EMAILS; can never lose admin
  memberSince?: string;
  createdAt: string;
  instructorId?: string;
  staffTitle?: StaffTitle;
  telegramLinked: boolean;
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: 'student' | 'instructor' | 'admin';
  avatar: string;
  bio: string;
  interests: string[];
}

export interface AdminAnalytics {
  totalRevenue: number;
  revenueChangeMonth: number;
  totalStudents: number;
  studentsChangeMonth: number;
  activeCourses: number;
  completionRate: number;
  certificatesIssued: number;
  recentOrders: {
    id: string;
    studentName: string;
    courseTitle: string;
    amount: number;
    date: string;
    status: 'completed' | 'processing';
  }[];
}
