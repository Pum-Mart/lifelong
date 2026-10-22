import crypto from 'crypto';
import { readDatabase, writeDatabase } from '@/lib/db';
import { Activity, Announcement, LibraryResource, TickerMessage, VisitorMessage } from '@/types';

// Admin-managed site content, stored alongside everything else in data/database.json.
// The first read seeds the content that used to be hard-coded in the pages.

interface ContentStore {
  announcements?: Announcement[];
  activities?: Activity[];
  ticker?: TickerMessage[];
  resources?: LibraryResource[];
  messages?: VisitorMessage[];
  activityExamplesSeeded?: boolean;
}

const SEED_ANNOUNCEMENT: Omit<Announcement, 'id' | 'createdAt' | 'updatedAt'> = {
  title: 'ស្តីពីការជ្រើសរើសគ្រូបង្គោលបង្រៀនវាយស្គរឆៃយ៉ាំ ចំនួន ០១ នាក់',
  body: [
    'មជ្ឈមណ្ឌលសិក្សាពេញមួយជីវិត ត្រូវការជ្រើសរើស គ្រូបង្គោលបង្រៀនវាយស្គរឆៃយ៉ាំ ចំនួន ០១ នាក់ ដើម្បីបង្រៀនសិស្ស និងរួមចំណែកថែរក្សាសិល្បៈប្រពៃណីខ្មែរ។',
    '',
    'ភារកិច្ច៖',
    '- បង្រៀនបច្ចេកទេសវាយស្គរឆៃយ៉ាំ ចង្វាក់ និងបទភ្លេងប្រពៃណី ចាប់ពីកម្រិតដំបូង',
    '- រៀបចំកម្មវិធីសិក្សា និងតាមដានការរីកចម្រើនរបស់សិស្ស',
    '- ហ្វឹកហាត់ និងដឹកនាំក្រុមសិស្សសម្តែងក្នុងកម្មវិធីបុណ្យ និងព្រឹត្តិការណ៍របស់មជ្ឈមណ្ឌល',
    '',
    'លក្ខខណ្ឌ៖',
    '- ចេះវាយស្គរឆៃយ៉ាំបានល្អ និងមានបទពិសោធន៍យ៉ាងតិច [២] ឆ្នាំ',
    '- ធ្លាប់បង្រៀន ឬដឹកនាំក្រុមឆៃយ៉ាំ ជាអាទិភាព',
    '- មានសីលធម៌ល្អ អត់ធ្មត់ និងស្រលាញ់ការបង្រៀន',
    '',
    'ឯកសារដាក់ពាក្យ៖',
    '- ប្រវត្តិរូបសង្ខេប (CV)',
    '- ច្បាប់ចម្លងអត្តសញ្ញាណប័ណ្ណ',
    '- រូបថត ៤x៦ ចំនួន ០២ សន្លឹក',
    '',
    'ទំនាក់ទំនង៖ 017 566 560 / 097 620 7676 • Telegram៖ @lifelonglerning_bot'
  ].join('\n'),
  published: true
};

const SEED_TICKER: Omit<TickerMessage, 'id'>[] = [
  { text: '📢 សេចក្តីជូនដំណឹង៖ មជ្ឈមណ្ឌលសិក្សាពេញមួយជីវិត ត្រូវការជ្រើសរើសគ្រូបង្គោលបង្រៀនវាយស្គរឆៃយ៉ាំ ចំនួន ០១ នាក់' },
  { text: '🥁 អ្នកមានបទពិសោធន៍វាយស្គរឆៃយ៉ាំ និងស្រលាញ់ការបង្រៀន សូមដាក់ពាក្យឥឡូវនេះ' },
  { text: '📞 ទំនាក់ទំនងតាមទូរស័ព្ទលេខ៖ 017 566 560 / 097 620 7676' },
  { text: '💬 Telegram៖ @lifelonglerning_bot • ចុចទីនេះដើម្បីអានព័ត៌មានលម្អិត' }
];

// Example activities so the About slideshow is not empty; titled «ឧទាហរណ៍» for admins to replace
const SEED_ACTIVITIES: Omit<Activity, 'id' | 'createdAt'>[] = [
  { title: '(ឧទាហរណ៍) ការអនុវត្តប្រព័ន្ធដំណក់ទឹកនៅចម្ការ', description: 'រូបភាពឧទាហរណ៍ — សូមប្តូរជារូបថតសកម្មភាពពិតនៅ /admin/content។', date: '2026-10-20', photo: '/images/agriculture.svg' },
  { title: '(ឧទាហរណ៍) ថ្នាក់សុវត្ថិភាពឌីជីថល និង KHQR', description: 'រូបភាពឧទាហរណ៍ — សូមប្តូរជារូបថតសកម្មភាពពិតនៅ /admin/content។', date: '2026-10-18', photo: 'https://images.unsplash.com/photo-1563986768609-322da13575f3?auto=format&fit=crop&w=1600&q=80' },
  { title: '(ឧទាហរណ៍) ការដំឡើងបន្ទះសូឡាខ្នាតតូច', description: 'រូបភាពឧទាហរណ៍ — សូមប្តូរជារូបថតសកម្មភាពពិតនៅ /admin/content។', date: '2026-10-15', photo: '/images/solar.svg' }
];

// Example library items: guides generated from real courses (lesson titles, summaries, outcomes)
const SEED_RESOURCES: Omit<LibraryResource, 'id' | 'createdAt'>[] = [
  { title: 'មគ្គុទ្ទេសក៍វគ្គ៖ AI & ChatGPT សម្រាប់ជីវិតប្រចាំថ្ងៃ', type: 'guides', category: 'ជំនាញឌីជីថល', description: 'សង្ខេបមេរៀនទាំង ៦ គោលបំណងសិក្សា និងគន្លឹះប្រើ AI ដោយសុវត្ថិភាព។', courseId: 'course-1', downloads: 0 },
  { title: 'មគ្គុទ្ទេសក៍វគ្គ៖ សុវត្ថិភាពឌីជីថល & ធនាគារចល័ត', type: 'guides', category: 'ជំនាញឌីជីថល', description: 'វិធីសម្គាល់សារបោកប្រាស់ ពាក្យសម្ងាត់ខ្លាំង និងការប្រើ KHQR ដោយសុវត្ថិភាព។', courseId: 'course-digital-2', downloads: 0 },
  { title: 'សម្ភារបង្រៀន៖ កសិកម្មឆ្លាតវៃ & ប្រព័ន្ធដំណក់ទឹក', type: 'teaching', category: 'កសិកម្ម', description: 'សង្ខេបមេរៀនសម្រាប់គ្រូឧទ្ទេសយកទៅបង្រៀនកសិករ។', courseId: 'course-agri-1', downloads: 0 },
  { title: 'មគ្គុទ្ទេសក៍វគ្គ៖ អាជីវកម្មខ្នាតតូច & ការគ្រប់គ្រងហិរញ្ញវត្ថុ', type: 'toolkits', category: 'សហគ្រិនភាព', description: 'ការគណនាថ្លៃដើម កំណត់តម្លៃ និងការកត់ត្រាចំណូល-ចំណាយ។', courseId: 'course-biz-1', downloads: 0 }
];

const newId = (prefix: string) => `${prefix}-${crypto.randomUUID()}`;

function load() {
  const db = readDatabase() as ReturnType<typeof readDatabase> & ContentStore;
  let changed = false;
  if (!db.announcements) {
    const now = new Date().toISOString();
    db.announcements = [{ ...SEED_ANNOUNCEMENT, id: newId('ann'), createdAt: now, updatedAt: now }];
    changed = true;
  }
  if (!db.activities) {
    db.activities = [];
    changed = true;
  }
  if (!db.ticker) {
    db.ticker = SEED_TICKER.map(t => ({ ...t, id: newId('tick') }));
    changed = true;
  }
  // Seed example activities once (an admin may delete them all afterwards)
  if (!db.activityExamplesSeeded) {
    if (db.activities.length === 0) {
      const now = new Date().toISOString();
      db.activities = SEED_ACTIVITIES.map(a => ({ ...a, id: newId('act'), createdAt: now }));
    }
    db.activityExamplesSeeded = true;
    changed = true;
  }
  if (!db.resources) {
    const now = new Date().toISOString();
    db.resources = SEED_RESOURCES.map(r => ({ ...r, id: newId('res'), createdAt: now }));
    changed = true;
  }
  if (!db.messages) {
    db.messages = [];
    changed = true;
  }
  if (changed) writeDatabase(db);
  return db as ReturnType<typeof readDatabase> & Required<ContentStore>;
}

// ---------- Announcements ----------

export function getAnnouncements(includeDrafts = false): Announcement[] {
  return load()
    .announcements.filter(a => includeDrafts || a.published)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export function saveAnnouncement(data: Omit<Announcement, 'id' | 'createdAt' | 'updatedAt'> & { id?: string }): Announcement {
  const db = load();
  const now = new Date().toISOString();
  const existing = data.id ? db.announcements.find(a => a.id === data.id) : undefined;
  const saved: Announcement = existing
    ? { ...existing, ...data, id: existing.id, updatedAt: now }
    : { ...data, id: newId('ann'), createdAt: now, updatedAt: now };
  db.announcements = [saved, ...db.announcements.filter(a => a.id !== saved.id)];
  writeDatabase(db);
  return saved;
}

export function deleteAnnouncement(id: string): boolean {
  const db = load();
  const before = db.announcements.length;
  db.announcements = db.announcements.filter(a => a.id !== id);
  writeDatabase(db);
  return db.announcements.length < before;
}

// ---------- Daily activities ----------

export function getActivities(): Activity[] {
  return load().activities.sort((a, b) => b.date.localeCompare(a.date) || b.createdAt.localeCompare(a.createdAt));
}

export function saveActivity(data: Omit<Activity, 'id' | 'createdAt'> & { id?: string }): Activity {
  const db = load();
  const existing = data.id ? db.activities.find(a => a.id === data.id) : undefined;
  const saved: Activity = existing ? { ...existing, ...data, id: existing.id } : { ...data, id: newId('act'), createdAt: new Date().toISOString() };
  db.activities = [saved, ...db.activities.filter(a => a.id !== saved.id)];
  writeDatabase(db);
  return saved;
}

export function deleteActivity(id: string): boolean {
  const db = load();
  const before = db.activities.length;
  db.activities = db.activities.filter(a => a.id !== id);
  writeDatabase(db);
  return db.activities.length < before;
}

// ---------- Ticker ----------

export function getTicker(): TickerMessage[] {
  return load().ticker;
}

export function saveTicker(messages: { text: string; href?: string }[]): TickerMessage[] {
  const db = load();
  db.ticker = messages.map(m => ({ id: newId('tick'), text: m.text, href: m.href }));
  writeDatabase(db);
  return db.ticker;
}

// ---------- Library resources ----------

export function getResources(): LibraryResource[] {
  return load().resources.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export function saveResource(data: Omit<LibraryResource, 'id' | 'createdAt' | 'downloads'> & { id?: string }): LibraryResource {
  const db = load();
  const existing = data.id ? db.resources.find(r => r.id === data.id) : undefined;
  const saved: LibraryResource = existing
    ? { ...existing, ...data, id: existing.id }
    : { ...data, id: newId('res'), downloads: 0, createdAt: new Date().toISOString() };
  db.resources = [saved, ...db.resources.filter(r => r.id !== saved.id)];
  writeDatabase(db);
  return saved;
}

export function deleteResource(id: string): boolean {
  const db = load();
  const before = db.resources.length;
  db.resources = db.resources.filter(r => r.id !== id);
  writeDatabase(db);
  return db.resources.length < before;
}

export function countResourceDownload(id: string): LibraryResource | null {
  const db = load();
  const resource = db.resources.find(r => r.id === id);
  if (!resource) return null;
  resource.downloads = (resource.downloads || 0) + 1;
  writeDatabase(db);
  return resource;
}

// ---------- Visitor messages (contact form, volunteers) ----------

export function getMessages(): VisitorMessage[] {
  return load().messages.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export function addMessage(data: Omit<VisitorMessage, 'id' | 'createdAt' | 'handled'>): VisitorMessage {
  const db = load();
  const message: VisitorMessage = { ...data, id: newId('msg'), createdAt: new Date().toISOString(), handled: false };
  db.messages.push(message);
  writeDatabase(db);
  return message;
}

export function setMessageHandled(id: string, handled: boolean): boolean {
  const db = load();
  const message = db.messages.find(m => m.id === id);
  if (!message) return false;
  message.handled = handled;
  writeDatabase(db);
  return true;
}