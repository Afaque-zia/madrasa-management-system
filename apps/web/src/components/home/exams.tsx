import { useEffect, useMemo, useState } from 'react';
import { ClipboardCheck, Eye, Plus, Save, Send, X } from 'lucide-react';
import { pocketbaseClient as pb } from '@/lib/pocketbase-client';
import type { AppUser, SchoolRecord } from '@/data/school';
import {
  SUBJECTS, SUBJECT_LABEL, computeExamTotals, gradeFor, parseJson, positions, remarkFor,
  type ExamSetupDetails, type MarksDetails, type MarksEntry, type ExamSubject,
} from '@/lib/academics';

const L = {
  en: { heading: 'Exams & results', flow: 'Set up subjects and max marks → assigned teacher enters marks → authorized review → publish to students.', setup: 'Exam setup', subject: 'Subject', examName: 'Exam name', session: 'Session', subjects: 'Subjects & max marks', addSubject: 'Add subject', saveSetup: 'Save exam (Draft)', create: 'Create exam', marks: 'Marks entry', pickExam: 'Exam', cls: 'Class', roll: 'Roll', student: 'Student', saveDraft: 'Save draft', submit: 'Submit for review', reviewed: 'Mark reviewed', publish: 'Publish results', status: 'Status', none: 'No exams set up yet.', sign: 'Sign in to manage exams.', roster: 'My published results', total: 'Total', pct: 'Percentage', grade: 'Grade', position: 'Position', remark: 'Remarks', absent: 'Absent', report: 'Report card', back: 'Close', passPct: 'Pass', loading: 'Loading…', notPublished: 'Results are published by the administration; nothing is visible until then.' },
  ur: { heading: 'امتحانات اور نتائج', flow: 'مضامین اور کل نمبر مقرر کریں → متعین استاد نمبر درج کرے → جائزہ → طلبہ کے لیے شائع۔', setup: 'امتحان کی ترتیب', subject: 'مضمون', examName: 'امتحان کا نام', session: 'سیشن', subjects: 'مضامین اور کل نمبر', addSubject: 'مضمون شامل کریں', saveSetup: 'امتحان محفوظ کریں (مسودہ)', create: 'امتحان بنائیں', marks: 'نمبرات کی تعمیل', pickExam: 'امتحان', cls: 'جماعت', roll: 'رول', student: 'طالب علم', saveDraft: 'مسودہ محفوظ کریں', submit: 'جائزے کے لیے بھیجیں', reviewed: 'جائزہ تکمیل', publish: 'نتائج شائع کریں', status: 'حالت', none: 'ابھی کوئی امتحان نہیں۔', sign: 'امتحانات کے لیے لاگ ان کریں۔', roster: 'میرے شائع شدہ نتائج', total: 'کل', pct: 'صدی', grade: 'گریڈ', position: 'پوزیشن', remark: 'تبصرہ', absent: 'غیر حاضر', report: 'رپورٹ کارڈ', back: 'بند کریں', passPct: 'پاس', loading: 'لوڈ ہو رہا ہے…', notPublished: 'نتائج انتظامیہ شائع کرتی ہے؛ اس وقت تک کچھ نظر نہیں آئے گا۔' },
  ar: { heading: 'الامتحانات والنتائج', flow: 'إعداد المواد والعلامات ← إدخال المعلم المخصص ← مراجعة معتمدة ← نشر للطلاب.', setup: 'إعداد الامتحان', subject: 'المادة', examName: 'اسم الامتحان', session: 'العام', subjects: 'المواد والعلامات', addSubject: 'إضافة مادة', saveSetup: 'حفظ الامتحان (مسودة)', create: 'إنشاء امتحان', marks: 'إدخال العلامات', pickExam: 'الامتحان', cls: 'الفصل', roll: 'الرقم', student: 'الطالب', saveDraft: 'حفظ المسودة', submit: 'إرسال للمراجعة', reviewed: 'تمت المراجعة', publish: 'نشر النتائج', status: 'الحالة', none: 'لا توجد امتحانات بعد.', sign: 'سجل الدخول لإدارة الامتحانات.', roster: 'نتائجي المنشورة', total: 'الإجمالي', pct: 'النسبة', grade: 'التقدير', position: 'الترتيب', remark: 'ملاحظات', absent: 'غائب', report: 'بطاقة الدرجات', back: 'إغلاق', passPct: 'النجاح', loading: 'جارٍ التحميل…', notPublished: 'تنشر الإدارة النتائج؛ لا يظهر شيء قبل النشر.' },
};
const STATUS_LABEL: Record<string, Record<string, string>> = { Draft: { ur: 'مسودہ', ar: 'مسودة' }, Submitted: { ur: 'جمع شدہ', ar: 'مُرسَل' }, Reviewed: { ur: 'جائزہ شدہ', ar: 'مراجَع' }, Published: { ur: 'شائع شدہ', ar: 'منشور' } };


function rollOf(s: SchoolRecord): number {
  return Number(String(s.details).match(/Roll:\s*(\d+)/)?.[1] ?? -1);
}

export function Exams({ rows, students, lang, user, addTrigger, onMutate, onError }: { rows: SchoolRecord[]; students: SchoolRecord[]; lang: string; loading?: boolean; user: AppUser; addTrigger: number; onMutate: () => void; onError: (m: string) => void }) {
  const w = L[lang === 'ur' ? 'ur' : lang === 'ar' ? 'ar' : 'en'];
  const Lg = (x: string) => (x === 'ur' ? 'ur' : x === 'ar' ? 'ar' : 'en');
  const isAdmin = user?.role === 'admin';
  const isTeacher = user?.role === 'teacher';
  const isStudent = user?.role === 'student';

  const examRows = useMemo(() => rows.filter((r) => r.module === 'Exams & results'), [rows]);
  // A setup row carries subjects in details.subjects; a marks row carries details.entries.
  // A sample-data id starting with 'sample-exm' or a real record whose details carry
  // `subjects` is an exam setup; anything carrying `entries` is a marks sheet.
  const isSetup = (r: SchoolRecord) => r.id.startsWith('sample-exm') || Array.isArray(parseJson<ExamSetupDetails>(r.details, { session: '', subjects: [] }).subjects);
  const isMarks = (r: SchoolRecord) => r.id.startsWith('sample-mrk') || Array.isArray(parseJson<MarksDetails>(r.details, { exam: '', entries: [] }).entries);
  const setups = examRows.filter(isSetup);
  const marksRows = examRows.filter((r) => !isSetup(r) && isMarks(r));

  const classes = useMemo(() => Array.from(new Set(students.map((s) => s.class_name).filter(Boolean))), [students]);
  const [openSetup, setOpenSetup] = useState(false);
  const [subjectList, setSubjectList] = useState<ExamSubject[]>([{ subject: 'Mathematics', max: 75 }, { subject: 'English', max: 75 }, { subject: 'Urdu', max: 75 }, { subject: 'Science', max: 50 }]);
  const [busy, setBusy] = useState(false);
  const [examId, setExamId] = useState(setups[0]?.id ?? '');
  const [cls, setCls] = useState(isTeacher ? user?.assigned_class || '' : classes[0] || '');
  const [card, setCard] = useState<{ name: string; cls: string; roll: number; status?: string; obtained: number; total: number; pct: number; grade: string; pos: number; remark: string; lines: { subject: string; got: number | null; max: number }[] } | null>(null);

  useEffect(() => { if (addTrigger > 0 && isAdmin) setOpenSetup(true); /* eslint-disable-next-line */ }, [addTrigger]);

  async function createExam(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault(); setBusy(true);
    const f = new FormData(e.currentTarget);
    const valid = subjectList.filter((s) => s.subject && s.max > 0);
    if (!valid.length) { setBusy(false); onError(lang === 'en' ? 'Add at least one subject with max marks.' : 'ناکام۔'); return; }
    try {
      await pb.collection('school_records').create({
        module: 'Exams & results', title: String(f.get('name')), class_name: '', status: 'Draft', date: String(f.get('date') || '2026-10-13'), amount: 0,
        details: JSON.stringify({ session: String(f.get('session') || '2026 – 2027'), subjects: valid } satisfies ExamSetupDetails),
        reason: `Exam "${String(f.get('name'))}" set up by ${String(user?.email ?? '')}`, owner: (pb.authStore.record as { id?: string } | null)?.id,
      });
      onMutate(); setOpenSetup(false);
    } catch { onError(lang === 'en' ? 'Exam could not be created.' : 'ناکام۔'); }
    finally { setBusy(false); }
  }

  async function transition(r: SchoolRecord, next: string) {
    setBusy(true);
    try {
      await pb.collection('school_records').update(r.id, { status: next, reason: `${next}: ${r.title} (${r.class_name}) by ${String(user?.email ?? '')}` });
      onMutate();
    } catch { onError(lang === 'en' ? 'This change is not permitted for your role (teachers may only submit).' : 'ناکام۔'); }
    finally { setBusy(false); }
  }

  async function createMarksSheet() {
    if (!cls || !examId) return;
    setBusy(true);
    const roster = students.filter((s) => s.class_name === cls);
    const entries: MarksEntry[] = roster.map((s) => ({ roll: rollOf(s), marks: {} }));
    const exam = setups.find((x) => x.id === examId);
    try {
      await pb.collection('school_records').create({
        module: 'Exams & results', title: cls, class_name: cls, status: 'Draft', date: String(exam?.date ?? '2026-10-13'), amount: 0,
        details: JSON.stringify({ exam: examId, entries } satisfies MarksDetails),
        reason: `Marks sheet opened for ${cls} · ${String(exam?.title ?? '')}`, owner: (pb.authStore.record as { id?: string } | null)?.id,
      });
      onMutate();
    } catch { onError(lang === 'en' ? 'Marks sheet could not be created.' : 'ناکام۔'); }
    finally { setBusy(false); }
  }

  const canEnter = isAdmin || isTeacher;
  const activeSetup = setups.find((s) => s.id === examId) ?? setups[0];
  const activeSubjects = activeSetup ? parseJson<ExamSetupDetails>(activeSetup.details, { session: '', subjects: [] }).subjects : [];
  const sheets = marksRows.filter((r) => {
    const d = parseJson<MarksDetails>(r.details, { exam: '', entries: [] });
    const linked = !activeSetup ? false : d.exam === activeSetup.id || (!!activeSetup.title && String(d.exam).includes(activeSetup.title));
    return linked && (isTeacher ? r.class_name === user?.assigned_class : true);
  });

  function buildCards() {
    if (!activeSetup) return [];
    const visibleSheets = isStudent ? sheets.filter((s) => s.status === 'Published') : sheets;
    // Positions are computed across every published sheet so the ranking matches
    // what an administrator sees; each viewer then filters to their own rows.
    const byClass = new Map<string, { roll: number; pct: number }[]>();
    for (const sheet of visibleSheets) {
      const d = parseJson<MarksDetails>(sheet.details, { exam: '', entries: [] });
      const list = byClass.get(sheet.class_name) ?? [];
      for (const en of d.entries) list.push({ roll: en.roll, pct: computeExamTotals(activeSubjects, en.marks).pct });
      byClass.set(sheet.class_name, list);
    }
    const posByClass = new Map<string, Map<number, number>>();
    byClass.forEach((list, c) => posByClass.set(c, positions(list)));
    const cards: NonNullable<typeof card>[] = [];
    for (const sheet of visibleSheets) {
      const d = parseJson<MarksDetails>(sheet.details, { exam: '', entries: [] });
      for (const en of d.entries) {
        const student = students.find((s) => s.class_name === sheet.class_name && rollOf(s) === en.roll);
        if (isStudent && student?.id !== user?.id) continue;
        const t = computeExamTotals(activeSubjects, en.marks);
        cards.push({
          name: student?.title ?? `${w.cls} ${sheet.class_name} · ${w.roll} ${en.roll}`, cls: sheet.class_name, roll: en.roll, status: sheet.status,
          obtained: t.obtained, total: t.total, pct: t.pct, grade: gradeFor(t.pct), pos: posByClass.get(sheet.class_name)?.get(en.roll) ?? 0,
          remark: remarkFor(t.pct, 50, Lg(lang)), lines: activeSubjects.map((s) => ({ subject: s.subject, got: en.marks[s.subject] ?? null, max: s.max })),
        });
      }
    }
    return cards;
  }

  const badge = (s: string) => <span className={`status-badge ${s === 'Published' ? 'paid' : 'pending'}`}><i />{STATUS_LABEL[s]?.[Lg(lang)] || s}</span>;

  return (
    <section className="panel">
      <div className="section-title"><h2>{w.heading}</h2><span>{setups.length} · {marksRows.length}</span></div>
      <div className="safety-note"><ClipboardCheck size={18} /><span>{w.flow}</span></div>
      {!user && <div className="empty-state"><ClipboardCheck size={35} /><h3>{w.sign}</h3></div>}

      {isStudent && (
        <>
          <h3 style={{ marginTop: 18 }}>{w.roster}</h3>
          {(() => { const c = buildCards(); return !c.length ? <div className="empty-state"><p>{w.notPublished}</p></div> : (
            <div className="table-scroll"><table>
              <thead><tr><th>{w.examName}</th><th>{w.total}</th><th>{w.pct}</th><th>{w.grade}</th><th>{w.position}</th><th></th></tr></thead>
              <tbody>{c.map((x, i) => (
                <tr key={i}><td>{String(activeSetup?.title)}</td><td className="amount-cell">{x.obtained}/{x.total}</td><td>{x.pct}%</td><td>{x.grade}</td><td>{x.pos || '—'}</td>
                  <td><button className="text-button" onClick={() => setCard(x)}><Eye size={13} />{w.report}</button></td></tr>
              ))}</tbody>
            </table></div>
          ); })()}
        </>
      )}

      {canEnter && (
        <>
          <div className="toolbar" style={{ marginTop: 14 }}>
            <label style={{ display: 'flex', flexDirection: 'column', gap: 5, fontSize: 10, color: '#8a98ad' }}>{w.pickExam}
              <select value={activeSetup?.id ?? ''} onChange={(e) => setExamId(e.target.value)}>{setups.map((s) => <option key={s.id} value={s.id}>{s.title}</option>)}</select>
            </label>
            <label style={{ display: 'flex', flexDirection: 'column', gap: 5, fontSize: 10, color: '#8a98ad' }}>{w.cls}
              <select value={cls} disabled={isTeacher} onChange={(e) => setCls(e.target.value)}>{classes.map((c) => <option key={c}>{c}</option>)}</select>
            </label>
            <button className="secondary" onClick={createMarksSheet} disabled={busy || !activeSetup || !cls}>{w.marks}</button>
          </div>

          <h3 style={{ marginTop: 18 }}>{w.marks}</h3>
          {!sheets.length ? <div className="empty-state"><p>{w.none}</p></div> : sheets.map((sheet) => {
            const d = parseJson<MarksDetails>(sheet.details, { exam: '', entries: [] });
            const editable = sheet.status === 'Draft' && (isAdmin || (isTeacher && sheet.class_name === user?.assigned_class));
            return (
              <div key={sheet.id} style={{ marginBottom: 18 }}>
                <div className="section-title"><h2>{sheet.class_name}</h2><span>{badge(sheet.status)}</span></div>
                <div className="table-scroll"><table>
                  <thead><tr><th>{w.roll}</th>{activeSubjects.map((s) => <th key={s.subject}>{SUBJECT_LABEL[s.subject]?.[Lg(lang)] || s.subject}<small>/{s.max}</small></th>)}</tr></thead>
                  <tbody>{d.entries.map((en) => (
                    <tr key={en.roll}>
                      <td>{en.roll}</td>
                      {activeSubjects.map((s) => (
                        <td key={s.subject}>{editable
                          ? <input aria-label={`${en.roll} ${s.subject}`} type="number" min={0} max={s.max} defaultValue={en.marks[s.subject] ?? ''} placeholder={w.absent}
                              onBlur={(ev) => {
                                const val = ev.target.value === '' ? null : Math.min(s.max, Math.max(0, Number(ev.target.value)));
                                const nextEntries = d.entries.map((x) => (x.roll === en.roll ? { ...x, marks: { ...x.marks, [s.subject]: val } } : x));
                                void pb.collection('school_records').update(sheet.id, { details: JSON.stringify({ ...d, entries: nextEntries }), reason: `Marks entered for roll ${en.roll} · ${s.subject} (${sheet.class_name})` }).then(onMutate).catch(() => onError(lang === 'en' ? 'Marks could not be saved.' : 'ناکام۔'));
                              }}
                              style={{ width: 60, border: '1px solid #e6ebf2', borderRadius: 6, padding: '5px 7px', fontSize: 11 }} />
                          : <span className="amount-cell">{en.marks[s.subject] ?? w.absent}</span>}</td>
                      ))}
                    </tr>
                  ))}</tbody>
                </table></div>
                <div style={{ display: 'flex', gap: 10, marginTop: 10 }}>
                  {sheet.status === 'Draft' && (isAdmin || (isTeacher && sheet.class_name === user?.assigned_class)) && <button className="primary" style={{ width: 'auto' }} disabled={busy} onClick={() => transition(sheet, 'Submitted')}><Send size={14} />{w.submit}</button>}
                  {sheet.status === 'Submitted' && isAdmin && <button className="secondary" disabled={busy} onClick={() => transition(sheet, 'Reviewed')}>{w.reviewed}</button>}
                  {sheet.status === 'Reviewed' && isAdmin && <button className="primary" style={{ width: 'auto' }} disabled={busy} onClick={() => transition(sheet, 'Published')}><Save size={14} />{w.publish}</button>}
                </div>
              </div>
            );
          })}

          <h3 style={{ marginTop: 22 }}>{w.setup}</h3>
          <div className="table-scroll"><table>
            <thead><tr><th>{w.examName}</th><th>{w.session}</th><th>{w.subjects}</th><th>{w.status}</th></tr></thead>
            <tbody>{setups.map((s) => {
              const d = parseJson<ExamSetupDetails>(s.details, { session: '', subjects: [] });
              return <tr key={s.id}><td>{s.title}</td><td>{d.session}</td><td>{d.subjects.map((x) => `${SUBJECT_LABEL[x.subject]?.[Lg(lang)] || x.subject}/${x.max}`).join(' · ')}</td><td>{badge(s.status)}</td></tr>;
            })}</tbody>
          </table></div>
          {isAdmin && <button className="primary" style={{ marginTop: 14, width: 'auto' }} onClick={() => setOpenSetup(true)}><Plus size={16} />{w.create}</button>}

          {/* result cards for staff — printable once published */}
          {(() => { const c = buildCards().filter((x) => x.status === 'Published'); return c.length > 0 && (
            <><h3 style={{ marginTop: 22 }}>{w.roster}</h3><div className="table-scroll"><table>
              <thead><tr><th>{w.student}</th><th>{w.cls}</th><th>{w.total}</th><th>{w.pct}</th><th>{w.grade}</th><th>{w.position}</th><th></th></tr></thead>
              <tbody>{c.map((x, i) => (
                <tr key={i}><td>{x.name}</td><td>{x.cls}</td><td className="amount-cell">{x.obtained}/{x.total}</td><td>{x.pct}%</td><td>{x.grade}</td><td>{x.pos || '—'}</td>
                  <td><button className="text-button" onClick={() => setCard(x)}><Eye size={13} />{w.report}</button></td></tr>
              ))}</tbody>
            </table></div></>
          ); })()}
        </>
      )}

      {openSetup && (
        <div className="modal-backdrop"><section role="dialog" aria-modal="true" className="modal">
          <button className="modal-close" aria-label="Close" onClick={() => setOpenSetup(false)}><X /></button>
          <h2>{w.create}</h2>
          <form onSubmit={createExam}>
            <label>{w.examName}<input name="name" required maxLength={80} placeholder={lang === 'en' ? 'Mid-Term 2026' : 'امتحان وسطی ۲۰۲۶'} /></label>
            <div className="form-grid">
              <label>{w.session}<input name="session" defaultValue="2026 – 2027" /></label>
              <label>{w.status}<input value={w.saveSetup} readOnly /></label>
            </div>
            <h3 style={{ margin: '12px 0 8px' }}>{w.subjects}</h3>
            {subjectList.map((s, i) => (
              <div className="form-grid" key={i} style={{ gridTemplateColumns: '1fr 110px auto', alignItems: 'end', marginBottom: 6 }}>
                <label>{w.subject}<select value={s.subject} onChange={(e) => setSubjectList((p) => p.map((x, j) => (j === i ? { ...x, subject: e.target.value } : x)))}>{SUBJECTS.map((o) => <option key={o}>{SUBJECT_LABEL[o][Lg(lang)]}</option>)}</select></label>
                <label>{w.marks}<input type="number" min={1} max={200} value={s.max} onChange={(e) => setSubjectList((p) => p.map((x, j) => (j === i ? { ...x, max: Number(e.target.value) } : x)))} /></label>
                <button type="button" className="text-button" onClick={() => setSubjectList((p) => p.filter((_, j) => j !== i))}>×</button>
              </div>
            ))}
            <button type="button" className="secondary" onClick={() => setSubjectList((p) => [...p, { subject: 'Islamiat', max: 50 }])}>{w.addSubject}</button>
            <button className="primary" disabled={busy}>{busy ? '…' : w.saveSetup}</button>
          </form>
        </section></div>
      )}

      {card && (
        <div className="modal-backdrop"><section role="dialog" aria-modal="true" className="modal report-card">
          <button className="modal-close" aria-label="Close" onClick={() => setCard(null)}><X /></button>
          <h2>{w.report}</h2>
          <div className="receipt">
            <p><strong>{card.name}</strong> · {card.cls} · {w.roll} {card.roll}</p>
            <p>{String(activeSetup?.title ?? '')} · {String(activeSetup?.date ?? '')}</p>
            <hr />
            {card.lines.map((ln) => (
              <p key={ln.subject}>{SUBJECT_LABEL[ln.subject]?.[Lg(lang)] || ln.subject} — {ln.got ?? w.absent} / {ln.max}</p>
            ))}
            <hr />
            <p><strong>{w.total}: {card.obtained} / {card.total} ({card.pct}%)</strong></p>
            <p>{w.grade}: <strong>{card.grade}</strong> · {w.position}: <strong>{card.pos || '—'}</strong></p>
            <p>{w.remark}: {card.remark}</p>
          </div>
          <button className="primary" style={{ marginTop: 12 }} onClick={() => window.print()}>{w.report}</button>
          <button className="secondary" style={{ marginTop: 8 }} onClick={() => setCard(null)}>{w.back}</button>
        </section></div>
      )}
    </section>
  );
}
