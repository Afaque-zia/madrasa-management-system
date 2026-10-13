// Shared helpers for Release 2 (Academics) modules. All functions are pure and
// language-neutral: stored records keep English canonical values (subjects, days,
// statuses) exactly like Release 1 does for attendance statuses and fee statuses.

export type Lang = 'en' | 'ur' | 'ar';

export const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'] as const;
export const PERIODS = ['P1', 'P2', 'P3', 'P4', 'P5', 'P6'] as const;

export const DAY_LABEL: Record<string, Record<Lang, string>> = {
  Monday: { en: 'Monday', ur: 'پیر', ar: 'الاثنين' },
  Tuesday: { en: 'Tuesday', ur: 'منگل', ar: 'الثلاثاء' },
  Wednesday: { en: 'Wednesday', ur: 'بدھ', ar: 'الأربعاء' },
  Thursday: { en: 'Thursday', ur: 'جمعرات', ar: 'الخميس' },
  Friday: { en: 'Friday', ur: 'جمعہ', ar: 'الجمعة' },
};

export const SUBJECTS = [
  'Mathematics', 'English', 'Urdu', 'Science', 'Islamiat', 'Social Studies', 'Computer', 'Arabic',
] as const;

export const SUBJECT_LABEL: Record<string, Record<Lang, string>> = {
  Mathematics: { en: 'Mathematics', ur: 'ریاضی', ar: 'الرياضيات' },
  English: { en: 'English', ur: 'انگریزی', ar: 'الإنجليزية' },
  Urdu: { en: 'Urdu', ur: 'اردو', ar: 'الأردية' },
  Science: { en: 'Science', ur: 'سائنس', ar: 'العلوم' },
  Islamiat: { en: 'Islamiat', ur: 'اسلامیات', ar: 'الإسلاميات' },
  'Social Studies': { en: 'Social Studies', ur: 'مطالعہ سماجی', ar: 'الاجتماعيات' },
  Computer: { en: 'Computer', ur: 'کمپیوٹر', ar: 'الحاسوب' },
  Arabic: { en: 'Arabic', ur: 'عربی', ar: 'العربية' },
};

// ---- structured payloads kept inside school_records.details -------------------

export type TimetableSlot = { subject: string; teacher: string };
/** Timetable & homework row, title = class name. details = JSON grid. */
export type TimetableGrid = Record<string, Record<string, TimetableSlot | null>>; // day -> period -> slot

export type HomeworkDetails = { subject: string; due: string; marks: number; submitted: string[] };
/** Homework row: module 'Timetable & homework', title = short assignment title,
 *  class_name = class, date = publish date, status = 'Active' | 'Closed'. */

export type ExamSubject = { subject: string; max: number };
export type ExamSetupDetails = { session: string; subjects: ExamSubject[] };
/** Exam setup row: module 'Exams & results', title = exam name, status = 'Draft' | 'Published'. */

export type MarksEntry = { roll: number; marks: Record<string, number | null> };
export type MarksDetails = { exam: string; entries: MarksEntry[] };
/** Marks row: module 'Exams & results', title = class name, status = Draft|Submitted|Reviewed|Published. */

export function parseJson<T>(raw: string | undefined, fallback: T): T {
  if (!raw) return fallback;
  try { return JSON.parse(raw) as T; } catch { return fallback; }
}

// ---- grading ------------------------------------------------------------------

export type GradeBand = { label: string; min: number };
export const DEFAULT_BANDS: GradeBand[] = [
  { label: 'A+', min: 90 }, { label: 'A', min: 80 }, { label: 'B', min: 70 },
  { label: 'C', min: 60 }, { label: 'D', min: 50 }, { label: 'F', min: 0 },
];
export const DEFAULT_PASS_PCT = 50;

export function gradeFor(pct: number, bands: GradeBand[] = DEFAULT_BANDS): string {
  const sorted = [...bands].sort((a, b) => b.min - a.min);
  return (sorted.find((band) => pct >= band.min) ?? sorted[sorted.length - 1]).label;
}

export function computeExamTotals(subjects: ExamSubject[], marks: Record<string, number | null>) {
  let obtained = 0;
  let total = 0;
  let absent = 0;
  for (const s of subjects) {
    total += s.max;
    const m = marks[s.subject];
    if (m === null || m === undefined) absent++;
    else obtained += m;
  }
  const pct = total > 0 ? Math.round((obtained / total) * 1000) / 10 : 0;
  return { obtained, total, pct, absent, subjectsCounted: subjects.length };
}

/** Rank students by percentage; returns position per roll number (ties share rank). */
export function positions(scores: { roll: number; pct: number }[]): Map<number, number> {
  const ordered = [...scores].sort((a, b) => b.pct - a.pct);
  const map = new Map<number, number>();
  let lastPct = Number.POSITIVE_INFINITY;
  let lastPos = 0;
  ordered.forEach((s, i) => {
    const pos = s.pct === lastPct ? lastPos : i + 1;
    map.set(s.roll, pos);
    lastPct = s.pct;
    lastPos = pos;
  });
  return map;
}

export function remarkFor(pct: number, passPct: number, lang: Lang): string {
  if (pct >= 90) return lang === 'ur' ? 'شاندار کارکردگی' : lang === 'ar' ? 'أداء ممتاز' : 'Outstanding performance';
  if (pct >= 80) return lang === 'ur' ? 'بہت اچھی کارکردگی' : lang === 'ar' ? 'أداء جيد جداً' : 'Very good performance';
  if (pct >= passPct) return lang === 'ur' ? 'اچھی کارکردگی، مزید کوشش کریں' : lang === 'ar' ? 'أداء جيد، واصل الجهد' : 'Good performance, keep it up';
  return lang === 'ur' ? 'کمزور کارکردگی — اضافی رہنمائی ضروری ہے' : lang === 'ar' ? 'أداء ضعيف — يحتاج متابعة' : 'Weak performance — extra support needed';
}

// ---- notices ------------------------------------------------------------------

export const AUDIENCES = ['All', 'Teachers', 'Students', 'Class'] as const;
export type NoticeDetails = { audience: string; cls?: string };
export function noticeVisible(details: NoticeDetails, role: string | undefined, cls: string | undefined): boolean {
  if (details.audience === 'All') return true;
  if (details.audience === 'Teachers') return role === 'teacher' || role === 'admin';
  if (details.audience === 'Students') return role === 'student' || role === 'admin';
  if (details.audience === 'Class') return role === 'admin' || (!!cls && details.cls === cls);
  return role === 'admin';
}

// ---- timetable conflicts ------------------------------------------------------

/** Returns list of "Day Period" keys where the same teacher is double-booked. */
export function teacherConflicts(grids: { cls: string; grid: TimetableGrid }[], teacher: string): string[] {
  if (!teacher) return [];
  const seen = new Map<string, string>();
  const clashes: string[] = [];
  for (const { cls, grid } of grids) {
    for (const day of DAYS) {
      for (const p of PERIODS) {
        const slot = grid[day]?.[p];
        if (!slot || !slot.teacher.includes(teacher)) continue;
        const key = `${day} ${p}`;
        const other = seen.get(key);
        if (other && other !== cls) clashes.push(`${key}: ${other} ↔ ${cls}`);
        else seen.set(key, cls);
      }
    }
  }
  return Array.from(new Set(clashes));
}
