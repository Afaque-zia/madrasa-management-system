import { useEffect, useMemo, useState } from 'react';
import { BookOpen, CalendarDays, Plus, Save, X } from 'lucide-react';
import { pocketbaseClient as pb } from '@/lib/pocketbase-client';
import type { AppUser, SchoolRecord } from '@/data/school';
import {
  DAYS, DAY_LABEL, PERIODS, SUBJECTS, SUBJECT_LABEL, parseJson, teacherConflicts,
  type TimetableGrid, type TimetableSlot,
} from '@/lib/academics';

type HomeworkRow = HomeworkMeta & { due: string };
type HomeworkMeta = { subject?: string; due?: string; marks?: number; submitted?: string[]; instructions?: string };

const L = {
  en: { tt: 'Class timetable', hw: 'Homework', cls: 'Class', day: 'Day', period: 'Period', subject: 'Subject', teacher: 'Teacher', saveTt: 'Save timetable', savedTt: 'Timetable saved.', publish: 'Publish homework', title: 'Assignment title', due: 'Due date', marks: 'Total marks', instructions: 'Instructions', none: 'Nothing scheduled yet.', noHw: 'No homework published yet.', roster: 'My timetable', myHw: 'Homework list', submitted: 'Submitted', overdue: 'Overdue', upcoming: 'Upcoming', sign: 'Sign in to view academics.', conflict: 'Teacher double-booked:', closed: 'Closed', active: 'Active', emptyCls: 'Choose a class first.' },
  ur: { tt: 'جماعت کا نظام الاوقات', hw: 'ہوم ورک', cls: 'جماعت', day: 'دن', period: 'پیریڈ', subject: 'مضمون', teacher: 'استاد', saveTt: 'نظام الاوقات محفوظ کریں', savedTt: 'نظام الاوقات محفوظ ہو گیا۔', publish: 'ہوم ورک شائع کریں', title: 'تقسیم کا عنوان', due: 'آخری تاریخ', marks: 'کل نمبر', instructions: 'ہدایات', none: 'ابھی کچھ مقرر نہیں۔', noHw: 'ابھی کوئی ہوم ورک نہیں۔', roster: 'میرا نظام الاوقات', myHw: 'ہوم ورک فہرست', submitted: 'جمع شدہ', overdue: 'میعاد ختم', upcoming: 'آنے والا', sign: 'تعلیمی سیکشن کے لیے لاگ ان کریں۔', conflict: 'استاد کا وقت ایک ساتھ دو جماعتوں میں:', closed: 'بند', active: 'جاری', emptyCls: 'پہلے جماعت منتخب کریں۔' },
  ar: { tt: 'جدول الفصل', hw: 'الواجبات', cls: 'الفصل', day: 'اليوم', period: 'الحصة', subject: 'المادة', teacher: 'المعلم', saveTt: 'حفظ الجدول', savedTt: 'تم حفظ الجدول.', publish: 'نشر الواجب', title: 'عنوان الواجب', due: 'تاريخ التسليم', marks: 'العلامات الكلية', instructions: 'التعليمات', none: 'لا يوجد جدول بعد.', noHw: 'لا توجد واجبات بعد.', roster: 'جدولي', myHw: 'قائمة الواجبات', submitted: 'تم التسليم', overdue: 'متأخر', upcoming: 'قادم', sign: 'سجل الدخول لعرض القسم الأكاديمي.', conflict: 'المعلم محجوز في فصلين معًا:', closed: 'مغلق', active: 'جاري', emptyCls: 'اختر الفصل أولًا.' },
};
const STATUS_LABEL: Record<string, Record<string, string>> = { Active: { ur: 'جاری', ar: 'جاري' }, Closed: { ur: 'بند', ar: 'مغلق' } };

export function TimetableHomework({ rows, students, lang, user, addTrigger, onMutate, onError }: { rows: SchoolRecord[]; students: SchoolRecord[]; lang: string; loading?: boolean; user: AppUser; addTrigger: number; onMutate: () => void; onError: (m: string) => void }) {
  const w = L[lang === 'ur' ? 'ur' : lang === 'ar' ? 'ar' : 'en'];
  const Lg = (x: string) => (x === 'ur' ? 'ur' : x === 'ar' ? 'ar' : 'en');
  const classes = useMemo(() => Array.from(new Set(students.map((s) => s.class_name).filter(Boolean))), [students]);
  const teachers = useMemo(() => Array.from(new Set(rows.filter((r) => r.module === 'Teacher & staff').map((r) => r.title))), [rows]);
  const canEdit = user?.role === 'admin' || user?.role === 'teacher';
  const scopedCls = user?.role === 'teacher' ? user.assigned_class || '' : '';

  const ttRows = useMemo(() => rows.filter((r) => r.module === 'Timetable & homework' && !parseJson<HomeworkMeta>(r.details, { subject: '', due: '', marks: 0, submitted: [] }).due), [rows]);
  const hwRows = useMemo(() => rows.filter((r) => r.module === 'Timetable & homework' && !!parseJson<HomeworkMeta>(r.details, { subject: '', due: '', marks: 0, submitted: [] }).due), [rows]);

  const [cls, setCls] = useState(scopedCls || classes[0] || '');
  const [grid, setGrid] = useState<TimetableGrid>({});
  const [busy, setBusy] = useState(false);
  const [ok, setOk] = useState('');
  const [open, setOpen] = useState(false);
  const [subject, setSubject] = useState('Mathematics');

  useEffect(() => { if (addTrigger > 0 && canEdit) setOpen(true); /* eslint-disable-next-line */ }, [addTrigger]);
  useEffect(() => { if (user?.role === 'teacher' && user.assigned_class) setCls(user.assigned_class); }, [user]);

  const existing = ttRows.find((r) => r.class_name === cls);
  useEffect(() => { setGrid(parseJson<TimetableGrid>(existing?.details, {})); }, [existing?.id, cls]); // eslint-disable-line

  const clashes = useMemo(() => {
    if (!canEdit) return [];
    const grids = ttRows.map((r) => ({ cls: r.class_name, grid: parseJson<TimetableGrid>(r.details, {}) })).concat([{ cls, grid }]);
    const names = new Set<string>();
    for (const day of DAYS) for (const p of PERIODS) { const t = grid[day]?.[p]?.teacher; if (t) names.add(t); }
    return Array.from(names).flatMap((t) => teacherConflicts(grids, t));
  }, [ttRows, grid, cls, canEdit]);

  async function saveTt() {
    if (!cls) { onError(w.emptyCls); return; }
    setBusy(true); setOk('');
    const payload = JSON.stringify(grid);
    try {
      if (existing) await pb.collection('school_records').update(existing.id, { details: payload, reason: `Timetable updated for ${cls} by ${String(user?.email ?? '')}` });
      else await pb.collection('school_records').create({ module: 'Timetable & homework', title: `${cls} timetable`, class_name: cls, status: 'Active', date: '2026-10-13', amount: 0, details: payload, reason: `Timetable created for ${cls}`, owner: (pb.authStore.record as { id?: string } | null)?.id });
      setOk(w.savedTt); onMutate();
    } catch { onError(lang === 'en' ? 'Timetable could not be saved.' : 'ناکام۔'); }
    finally { setBusy(false); }
  }

  async function publishHw(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault(); setBusy(true);
    const f = new FormData(e.currentTarget);
    const dueDate = String(f.get('due') || '');
    const chosenCls = String(f.get('class_name') || cls);
    try {
      await pb.collection('school_records').create({
        module: 'Timetable & homework', title: String(f.get('title')), class_name: chosenCls, status: 'Active', date: '2026-10-13', amount: Number(f.get('marks') || 0),
        details: JSON.stringify({ subject: String(f.get('subject')), due: dueDate, marks: Number(f.get('marks') || 0), submitted: [], instructions: String(f.get('instructions') || '') } satisfies HomeworkRow),
        reason: `Homework published for ${chosenCls}`, owner: (pb.authStore.record as { id?: string } | null)?.id,
      });
      onMutate(); setOpen(false);
    } catch { onError(lang === 'en' ? 'Homework could not be published.' : 'ناکام۔'); }
    finally { setBusy(false); }
  }

  async function toggleSubmit(r: SchoolRecord) {
    const d = parseJson<HomeworkMeta>(r.details, { subject: '', due: '', marks: 0, submitted: [] });
    const me = (pb.authStore.record as { id?: string } | null)?.id || user?.id || '';
    if (!me) return;
    const submitted = (d.submitted ?? []).includes(me) ? (d.submitted ?? []).filter((x) => x !== me) : [...(d.submitted ?? []), me];
    try { await pb.collection('school_records').update(r.id, { details: JSON.stringify({ ...d, submitted }), reason: `Submission marked for homework "${r.title}"` }); onMutate(); }
    catch { onError(lang === 'en' ? 'Submission could not be recorded. Students may only update their own submissions.' : 'ناکام۔'); }
  }

  const today = '2026-10-13';
  const myHw = hwRows
    .filter((r) => (user?.role === 'teacher' ? r.class_name === user.assigned_class : true))
    .sort((a, b) => String(a.date).localeCompare(String(b.date)));

  return (
    <section className="panel">
      <div className="section-title"><h2>{w.tt}</h2><span>{ttRows.length}</span></div>
      {!user && <div className="empty-state"><CalendarDays size={35} /><h3>{w.sign}</h3></div>}
      {user && (
        <>
          <div className="toolbar" style={{ marginTop: 12 }}>
            {user.role !== 'teacher' && (
              <label style={{ display: 'flex', flexDirection: 'column', gap: 5, fontSize: 10, color: '#8a98ad' }}>{w.cls}
                <select value={cls} onChange={(e) => setCls(e.target.value)}>{classes.map((c) => <option key={c}>{c}</option>)}</select>
              </label>
            )}
          </div>
          {clashes.length > 0 && <div className="error" role="alert">{w.conflict} {clashes.join(' · ')}</div>}
          {canEdit ? (
            <>
              <div className="table-scroll"><table>
                <thead><tr><th>{w.day}</th>{PERIODS.map((p) => <th key={p}>{p}</th>)}</tr></thead>
                <tbody>{DAYS.map((d) => (
                  <tr key={d}><td>{DAY_LABEL[d][Lg(lang)]}</td>{PERIODS.map((p) => {
                    const slot: TimetableSlot | null = grid[d]?.[p] ?? null;
                    return (
                      <td key={p}>
                        <input aria-label={`${d} ${p} subject`} list="subjects" value={slot?.subject ?? ''} placeholder="—"
                          onChange={(e) => setGrid((g) => ({ ...g, [d]: { ...(g[d] || {}), [p]: e.target.value ? { subject: e.target.value, teacher: g[d]?.[p]?.teacher ?? '' } : null } }))} />
                        <input aria-label={`${d} ${p} teacher`} list="teachers" value={slot?.teacher ?? ''} placeholder={w.teacher}
                          onChange={(e) => setGrid((g) => ({ ...g, [d]: { ...(g[d] || {}), [p]: { subject: g[d]?.[p]?.subject ?? '', teacher: e.target.value } } }))} />
                      </td>
                    );
                  })}</tr>
                ))}</tbody>
              </table></div>
              <datalist id="subjects">{SUBJECTS.map((s) => <option key={s} value={s} />)}</datalist>
              <datalist id="teachers">{teachers.map((t) => <option key={t} value={t} />)}</datalist>
              <button className="primary" style={{ marginTop: 14, width: 'auto' }} disabled={busy || !cls} onClick={saveTt}><Save size={15} />{busy ? '…' : w.saveTt}</button>
              {ok && <div className="safety-note">{ok}</div>}
            </>
          ) : (
            <div className="table-scroll"><table>
              <thead><tr><th>{w.day}</th>{PERIODS.map((p) => <th key={p}>{p}</th>)}</tr></thead>
              <tbody>{DAYS.map((d) => (
                <tr key={d}><td>{DAY_LABEL[d][Lg(lang)]}</td>{PERIODS.map((p) => {
                  const slot = grid[d]?.[p];
                  return <td key={p}>{slot?.subject ? <span className="record-title">{SUBJECT_LABEL[slot.subject]?.[Lg(lang)] || slot.subject}<small>{slot.teacher}</small></span> : '—'}</td>;
                })}</tr>
              ))}</tbody>
            </table></div>
          )}

          <div className="section-title" style={{ marginTop: 26 }}><h2>{w.hw}</h2><span>{hwRows.length}</span></div>
          {!hwRows.length ? <div className="empty-state"><BookOpen size={35} /><h3>{w.noHw}</h3></div> : (
            <div className="table-scroll"><table>
              <thead><tr><th>{w.title}</th><th>{w.cls}</th><th>{w.subject}</th><th>{w.due}</th><th>{w.marks}</th><th>{user?.role === 'student' ? w.submitted : w.active}</th></tr></thead>
              <tbody>{myHw.map((r) => {
                const d = parseJson<HomeworkMeta>(r.details, { subject: '', due: '', marks: 0, submitted: [] });
                const me = user?.id || '';
                const isSub = (d.submitted ?? []).includes(me);
                const late = !isSub && String(d.due ?? '') < today;
                return (
                  <tr key={r.id}>
                    <td><span className="record-title"><span className="record-icon"><BookOpen size={16} /></span><span>{r.title}</span></span></td>
                    <td>{r.class_name}</td>
                    <td>{SUBJECT_LABEL[d.subject ?? '']?.[Lg(lang)] || d.subject || '—'}</td>
                    <td className="date-cell">{d.due || '—'}</td>
                    <td className="amount-cell">{d.marks || r.amount || '—'}</td>
                    <td>{user?.role === 'student'
                      ? <button className="text-button" onClick={() => toggleSubmit(r)}><span className={`status-badge ${isSub ? 'paid' : late ? 'pending' : 'pending'}`}><i />{isSub ? w.submitted : late ? w.overdue : w.upcoming}</span></button>
                      : <span className="status-badge paid"><i />{STATUS_LABEL[r.status]?.[Lg(lang)] || r.status} · {(d.submitted ?? []).length}</span>}</td>
                  </tr>
                );
              })}</tbody>
            </table></div>
          )}
          {canEdit && <button className="primary" style={{ marginTop: 16, width: 'auto' }} onClick={() => setOpen(true)}><Plus size={16} />{w.publish}</button>}
        </>
      )}
      {open && (
        <div className="modal-backdrop"><section role="dialog" aria-modal="true" className="modal">
          <button className="modal-close" aria-label="Close" onClick={() => setOpen(false)}><X /></button>
          <h2>{w.publish}</h2>
          <form onSubmit={publishHw}>
            <label>{w.title}<input name="title" required maxLength={120} /></label>
            <div className="form-grid">
              <label>{w.cls}<select name="class_name" defaultValue={cls || scopedCls}>{(user?.role === 'teacher' ? [scopedCls] : classes).filter(Boolean).map((c) => <option key={c}>{c}</option>)}</select></label>
              <label>{w.subject}<select name="subject" value={subject} onChange={(e) => setSubject(e.target.value)}>{SUBJECTS.map((s) => <option key={s}>{SUBJECT_LABEL[s][Lg(lang)]}</option>)}</select></label>
            </div>
            <div className="form-grid">
              <label>{w.due}<input type="date" name="due" required defaultValue="2026-10-20" min={today} /></label>
              <label>{w.marks}<input type="number" name="marks" min={0} max={100} defaultValue={20} /></label>
            </div>
            <label>{w.instructions}<textarea name="instructions" maxLength={500} /></label>
            <button className="primary" disabled={busy}>{busy ? '…' : w.publish}</button>
          </form>
        </section></div>
      )}
    </section>
  );
}
