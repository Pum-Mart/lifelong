# Continuum Lifelong Learning Center (Full-Stack Platform)

An accredited, multigenerational lifelong learning academy and course e-commerce platform built with **Next.js 16 (Turbopack)**, **React 19**, **TypeScript**, **Tailwind CSS**, and an atomic persistent database layer.

---

## 🌟 Key Features

### 1. 🎓 Multigenerational Accessibility & Senior-Friendly UI
- **Dynamic Text Scaler**: Integrated accessibility font switcher (`A`, `A+`, `A++`) in the navigation bar to enlarge font scale application-wide for comfortable reading.
- **High-Contrast Design**: Clean typography, clear visual hierarchy, and warm color palette designed for adult learners of all generations.
- **Printable Certificates**: Dedicated `@media print` stylesheet for clean, framable PDF and paper printouts.

### 2. 📚 Course Catalog & E-Commerce
- **Categorized Programs**: Technology & AI for Everyday Life, Creative Arts & Expression, Health & Longevity, Retirement & Financial Security, and World Languages & Culture.
- **Search & Multi-Facet Filtering**: Real-time keyword search, filter by format (Online Self-Paced, Live Webinar, Campus Workshop), level (Beginner, Intermediate, All Levels), and sorting.
- **Cart & Instant Checkout**:
  - Sliding cart drawer and dedicated checkout page.
  - Promo code discounts:
    - `SENIOR30`: 30% Senior Scholar Discount
    - `LIFELONG20`: 20% Lifelong Learning Discount
    - `WELCOME50`: 50% New Learner Welcome Discount
  - Instant enrollment with automated order creation and student library syncing.

### 3. 🖥️ Interactive Learning Management System (LMS Player)
- Accessible at `/learn/[slug]`.
- Clean, distraction-free HTML5 video playback.
- **Interactive Quizzes**: Multiple-choice evaluation per lesson with instant answers and pedagogical explanations.
- **Lesson Notes & Faculty Q&A**: Downloadable summaries, key reflection takeaways, and discussion board.
- **Milestone Celebration**: Dynamic progress calculation with **Canvas Confetti blast** upon 100% course completion and automatic digital credential issuance.

### 4. 📜 Official Digital Certificates of Completion
- Accessible at `/certificate/[id]`.
- Verified Registry ID, student name, instructor endorsement, CEUs awarded, and academic seal.
- Direct **Print / Save PDF** action.

### 5. 🛡️ Faculty & Admin Command Portal
- Accessible at `/admin`.
- **Tuition & Revenue Analytics**: Gross revenue, enrollment trajectory (+18.4% growth), active student count, and course completion rate.
- **Curriculum Manager**: Create new courses with custom categories, formats, tuition fees, CEUs, and syllabi.
- **Live Transaction Feed**: Real-time order log with student names, dates, amounts, and statuses.

### 6. 📅 Live Interactive Workshops & Community Events
- Accessible at `/events`.
- Live webinars and on-campus workshops with real-time seat reservation (RSVP) counter.

### 7. 👤 1-Click Role Switcher
- Switch instantly in the top bar between:
  - **Student**: Eleanor Vance (retired teacher learning AI and watercolor)
  - **Instructor**: Dr. Marcus Vance (Professor Emeritus of Computer Science & AI Ethics)
  - **Admin**: Sophia Chen, Ed.D. (Executive Director of Continuing Education)

---

## 🚀 Getting Started

### Prerequisites
- Node.js v18+ (tested on Node v24.19)
- npm v10+

### Development Server
```bash
npm run dev
```
Open [http://localhost:3001](http://localhost:3001) in your browser.

### Production Build
```bash
npm run build
npm start
```

---

## 📂 Project Structure

```
├── data/
│   └── database.json          # Persistent database store (courses, enrollments, certificates, orders)
├── src/
│   ├── app/
│   │   ├── page.tsx           # Homepage & Hero with Course Discovery
│   │   ├── courses/           # Course Catalog with dynamic filters
│   │   │   ├── page.tsx
│   │   │   └── [slug]/page.tsx# In-depth Course Overview & Syllabus Explorer
│   │   ├── learn/[slug]/      # Interactive LMS Player with Quizzes & Notes
│   │   ├── certificate/[id]/  # Official Printable Certificate of Completion
│   │   ├── my-learning/       # Student Portal (In-Progress & Completed Courses)
│   │   ├── events/            # Live Workshops & Webinar RSVPs
│   │   ├── cart/              # Cart & Checkout Simulation
│   │   ├── admin/             # Faculty & Admin Analytics Dashboard
│   │   └── api/               # Next.js Route Handlers
│   │       ├── courses/       # CRUD courses
│   │       ├── enrollments/   # Student enrollments & lesson progress
│   │       ├── certificates/  # Certificate verification
│   │       ├── events/        # Workshop RSVP tracking
│   │       └── admin/stats/   # Revenue and student analytics
│   ├── components/
│   │   ├── Navbar.tsx         # Accessible Nav with Text Scaler & Role Switcher
│   │   ├── CourseCard.tsx     # Reusable Course Card with Progress
│   │   ├── CartDrawer.tsx     # Slide-over Cart & Promo Codes
│   │   └── Footer.tsx         # Academic accreditation and links
│   ├── context/
│   │   └── AppContext.tsx     # Global State (User, Cart, Bookmarks, Text Scale)
│   ├── lib/
│   │   ├── data.ts            # Seed Data (Adult learning courses, instructors)
│   │   └── db.ts              # Atomic persistent database controller
│   └── types/
│       └── index.ts           # Comprehensive TypeScript interfaces
```
