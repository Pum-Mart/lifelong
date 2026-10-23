// Class schedule: which weekdays a course meets, at what time, and Khmer date formatting.
// Shared by the admin form, the course pages and the course API.

// Monday first, as on the centre's timetables; value = JavaScript getDay() (0 = Sunday)
export const WEEKDAYS = [
  { value: 1, label: 'ច័ន្ទ' },
  { value: 2, label: 'អង្គារ' },
  { value: 3, label: 'ពុធ' },
  { value: 4, label: 'ព្រហស្បតិ៍' },
  { value: 5, label: 'សុក្រ' },
  { value: 6, label: 'សៅរ៍' },
  { value: 0, label: 'អាទិត្យ' }
];

export const KHMER_MONTHS = ['មករា', 'កុម្ភៈ', 'មីនា', 'មេសា', 'ឧសភា', 'មិថុនា', 'កក្កដា', 'សីហា', 'កញ្ញា', 'តុលា', 'វិច្ឆិកា', 'ធ្នូ'];

const DATE = /^\d{4}-\d{2}-\d{2}$/;
const TIME = /^([01]\d|2[0-3]):[0-5]\d$/;

// '2026-11-03' → '3 វិច្ឆិកា 2026'
export function formatKhmerDate(iso?: string): string {
  if (!iso || !DATE.test(iso)) return '';
  const [y, m, d] = iso.split('-').map(Number);
  return `${d} ${KHMER_MONTHS[m - 1]} ${y}`;
}

// '2026-11-03' → 'ថ្ងៃអង្គារ ទី3 វិច្ឆិកា 2026'
export function formatKhmerDateWithDay(iso?: string): string {
  if (!iso || !DATE.test(iso)) return '';
  const [y, m, d] = iso.split('-').map(Number);
  const weekday = WEEKDAYS.find(w => w.value === new Date(Date.UTC(y, m - 1, d)).getUTCDay())?.label;
  return `ថ្ងៃ${weekday} ទី${d} ${KHMER_MONTHS[m - 1]} ${y}`;
}

export function formatClassDays(days?: number[]): string {
  if (!days?.length) return '';
  if (days.length === 7) return 'រៀងរាល់ថ្ងៃ';
  return WEEKDAYS.filter(w => days.includes(w.value)).map(w => w.label).join(', ');
}

export function formatClassTime(start?: string, end?: string): string {
  if (!start) return '';
  return end ? `${start} – ${end}` : start;
}

// Days in a month, for the day picker (month 1-12)
export function daysInMonth(year: number, month: number): number {
  return new Date(year, month, 0).getDate();
}

export function isValidDate(iso: string): boolean {
  if (!DATE.test(iso)) return false;
  const [y, m, d] = iso.split('-').map(Number);
  return m >= 1 && m <= 12 && d >= 1 && d <= daysInMonth(y, m);
}

export interface ClassSchedule {
  classDays?: number[];
  classStartTime?: string;
  classEndTime?: string;
}

// Validates schedule fields from a request body. A field left out of the body is not returned,
// so an update keeps its saved value; an empty value clears it.
export function parseSchedule(body: Record<string, unknown>): { schedule: Partial<ClassSchedule>; error?: string } {
  const schedule: Partial<ClassSchedule> = {};

  if (body.classDays !== undefined) {
    if (!Array.isArray(body.classDays) || body.classDays.some(d => !Number.isInteger(d) || d < 0 || d > 6)) {
      return { schedule, error: 'ថ្ងៃរៀនមិនត្រឹមត្រូវ' };
    }
    const days = [...new Set(body.classDays as number[])].sort((a, b) => a - b);
    schedule.classDays = days.length ? days : undefined;
  }

  for (const key of ['classStartTime', 'classEndTime'] as const) {
    if (body[key] === undefined) continue;
    const value = String(body[key]).trim();
    if (value && !TIME.test(value)) return { schedule, error: 'ម៉ោងរៀនមិនត្រឹមត្រូវ' };
    schedule[key] = value || undefined;
  }

  if (schedule.classStartTime && schedule.classEndTime && schedule.classEndTime <= schedule.classStartTime) {
    return { schedule, error: 'ម៉ោងចប់ត្រូវនៅក្រោយម៉ោងចាប់ផ្តើម' };
  }
  return { schedule };
}
