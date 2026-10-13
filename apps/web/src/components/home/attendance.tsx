import { useEffect, useMemo, useState } from 'react';
import { CalendarCheck, ClipboardCheck, X } from 'lucide-react';
import { pocketbaseClient as pb } from '@/lib/pocketbase-client';
import type { AppUser, SchoolRecord } from '@/data/school';

const L = {
	en: { mark: 'Mark attendance', cls: 'Class', date: 'Date', load: 'Load roster', save: 'Save attendance', confirm: 'Attendance saved with confirmation.', sign: 'Sign in as admin or teacher to mark attendance.', recent: 'Recent attendance', monthly: 'Monthly summary', student: 'Student', present: 'Present', absent: 'Absent', late: 'Late', leave: 'Approved leave', rate: 'Rate', none: 'No attendance records yet.', loading: 'Loading attendance…', correct: 'Correct', reason: 'Correction reason (who, when, why)', cStudent: 'Student', cClass: 'Class', cStatus: 'Status', cDate: 'Date' },
	ur: { mark: 'حاضری لگائیں', cls: 'جماعت', date: 'تاریخ', load: 'فہرست لوڈ کریں', save: 'حاضری محفوظ کریں', confirm: 'حاضری تصدیق کے ساتھ محفوظ ہو گئی۔', sign: 'حاضری لگانے کے لیے بطور ایڈمن یا استاد لاگ ان کریں۔', recent: 'حالیہ حاضری', monthly: 'ماہانہ خلاصہ', student: 'طالب علم', present: 'حاضر', absent: 'غیر حاضر', late: 'دیر سے', leave: 'منظور شدہ رخصت', rate: 'شرح', none: 'ابھی کوئی حاضری ریکارڈ نہیں۔', loading: 'حاضری لوڈ ہو رہی ہے…', correct: 'درست', reason: 'درست کا وجہ (کون، کب، کیوں)', cStudent: 'طالب علم', cClass: 'جماعت', cStatus: 'حالت', cDate: 'تاریخ' },
	ar: { mark: 'تسجيل الحضور', cls: 'الفصل', date: 'التاريخ', load: 'تحميل القائمة', save: 'حفظ الحضور', confirm: 'تم حفظ الحضور مع التأكيد.', sign: 'سجل الدخول كمشرف أو معلم لتسجيل الحضور.', recent: 'الحضور الأخير', monthly: 'الملخص الشهري', student: 'الطالب', present: 'حاضر', absent: 'غائب', late: 'متأخر', leave: 'إجازة معتمدة', rate: 'النسبة', none: 'لا توجد سجلات حضور بعد.', loading: 'جارٍ تحميل الحضور…', correct: 'تصحيح', reason: 'سبب التصحيح (من، متى، لماذا)', cStudent: 'الطالب', cClass: 'الفصل', cStatus: 'الحالة', cDate: 'التاريخ' },
};
const STATUSES = ['Present', 'Absent', 'Late', 'Approved leave'];
const STATUS_LABEL: Record<string, Record<string, string>> = { Present: { ur: 'حاضر', ar: 'حاضر' }, Absent: { ur: 'غیر حاضر', ar: 'غائب' }, Late: { ur: 'دیر سے', ar: 'متأخر' }, 'Approved leave': { ur: 'رخصت', ar: 'إجازة' } };

export function Attendance({ rows, students, lang, loading, user, addTrigger, onMutate, onError }: { rows: SchoolRecord[]; students: SchoolRecord[]; lang: string; loading: boolean; user: AppUser; addTrigger: number; onMutate: () => void; onError: (m: string) => void }) {
	const w = L[lang === 'ur' ? 'ur' : lang === 'ar' ? 'ar' : 'en'];
	const classes = useMemo(() => Array.from(new Set(students.map(s => s.class_name).filter(Boolean))), [students]);
	const [cls, setCls] = useState(classes[0] || '');
	const [date, setDate] = useState('2026-10-12');
	const [roster, setRoster] = useState<{ name: string; cls: string; status: string }[]>([]);
	const [busy, setBusy] = useState(false);
	const [edit, setEdit] = useState<SchoolRecord | null>(null);
	const canMark = user?.role === 'admin' || user?.role === 'teacher';
	const canEdit = canMark;

	useEffect(() => { if (addTrigger > 0) loadRoster(); /* eslint-disable-next-line */ }, [addTrigger]);
	useEffect(() => { if (classes.length && !cls) setCls(classes[0]); }, [classes, cls]);

	function loadRoster() {
		const list = students.filter(s => (!cls || s.class_name === cls)).map(s => {
			const existing = rows.find(r => r.title === s.title && r.class_name === s.class_name && r.date === date);
			return { name: s.title, cls: s.class_name, status: existing?.status || 'Present' };
		});
		setRoster(list);
	}

	async function saveAll() {
		if (!canMark) return;
		setBusy(true);
		try {
			await Promise.all(roster.map((m, i) => {
				const existing = rows.find(r => r.title === m.name && r.class_name === m.cls && r.date === date);
				if (existing) return pb.collection('school_records').update(existing.id, { status: m.status }, { requestKey: `att-up-${i}` });
				return pb.collection('school_records').create({ module: 'Attendance', title: m.name, class_name: m.cls, status: m.status, date, amount: 0, details: '', reason: '', owner: (pb.authStore.record as { id?: string } | null)?.id }, { requestKey: `att-cr-${i}` });
			}));
			onMutate(); setRoster([]);
		} catch { onError(lang === 'en' ? 'Could not save attendance.' : 'ناکام۔'); }
		finally { setBusy(false); }
	}

	async function correct(e: React.FormEvent<HTMLFormElement>) {
		e.preventDefault(); setBusy(true);
		if (!edit) return;
		const f = new FormData(e.currentTarget);
		try {
			await pb.collection('school_records').update(edit.id, { status: String(f.get('status')), reason: String(f.get('reason') || '') });
			onMutate(); setEdit(null);
		} catch { onError(lang === 'en' ? 'Correction failed. A reason is required.' : 'ناکام۔'); }
		finally { setBusy(false); }
	}

	const label = (s: string) => STATUS_LABEL[s]?.[lang] || s;
	const monthly = useMemo(() => {
		const map = new Map<string, { present: number; total: number }>();
		rows.forEach(r => { const cur = map.get(r.title) || { present: 0, total: 0 }; cur.total++; if (r.status === 'Present') cur.present++; map.set(r.title, cur); });
		return Array.from(map.entries()).map(([name, v]) => ({ name, ...v, rate: v.total ? Math.round((v.present / v.total) * 100) : 0 }));
	}, [rows]);

	return (
		<section className="panel">
			<div className="section-title"><h2>{lang === 'en' ? 'Attendance' : lang === 'ur' ? 'حاضری' : 'الحضور'}</h2><span>{rows.length} {lang === 'en' ? 'records' : lang === 'ur' ? 'ریکارڈ' : 'سجلات'}</span></div>
			<div className="safety-note"><CalendarCheck size={18} /><span>{lang === 'en' ? 'Corrections retain who changed the record, when and why.' : lang === 'ur' ? 'درست میں کس نے، کب اور کیوں تبدیل کیا، محفوظ رہتا ہے۔' : 'تحتفظ التصحيحات بمن ومتى ولماذا.'}</span></div>
			<div className="attendance-mark">
				<div className="toolbar">
					<label>{w.cls}<select value={cls} onChange={e => setCls(e.target.value)}>{classes.map(c => <option key={c}>{c}</option>)}</select></label>
					<label>{w.date}<input type="date" value={date} onChange={e => setDate(e.target.value)} /></label>
					<button className="secondary" onClick={loadRoster}>{w.load}</button>
				</div>
				{roster.length > 0 && (<>
					<div className="table-scroll"><table>
						<thead><tr><th>{w.student}</th><th>{w.cls}</th><th>{w.cStatus}</th></tr></thead>
						<tbody>{roster.map((m, i) => (
							<tr key={m.name + i}><td>{m.name}</td><td>{m.cls}</td>
								<td><select value={m.status} onChange={e => setRoster(p => p.map((x, j) => j === i ? { ...x, status: e.target.value } : x))}>{STATUSES.map(s => <option key={s}>{label(s)}</option>)}</select></td>
							</tr>))}</tbody>
					</table></div>
					{canMark ? <button className="primary" style={{ marginTop: 14, width: 'auto' }} disabled={busy} onClick={saveAll}>{busy ? '…' : w.save}</button>
						: <div className="safety-note" style={{ background: '#f3f1ff', color: '#6b5ea8' }}><ClipboardCheck size={18} /><span>{w.sign}</span></div>}
				</>)}
			</div>

			<h3 style={{ marginTop: 22 }}>{w.recent}</h3>
			{loading ? <div className="empty-state">{w.loading}</div> : !rows.length ? <div className="empty-state"><CalendarCheck size={35} /><h3>{w.none}</h3></div> : (
				<div className="table-scroll"><table>
					<thead><tr><th>{w.cStudent}</th><th>{w.cClass}</th><th>{w.cStatus}</th><th>{w.cDate}</th>{canEdit && <th></th>}</tr></thead>
					<tbody>{rows.slice(0, 12).map(r => (
						<tr key={r.id}><td>{r.title}</td><td>{r.class_name}</td>
							<td><span className={'status-badge ' + (r.status === 'Present' ? 'paid' : 'pending')}><i />{label(r.status)}</span></td>
							<td className="date-cell">{r.date}</td>
							{canEdit && <td>{r.reason ? <small>{r.reason}</small> : <button className="text-button" onClick={() => setEdit(r)}>{w.correct}</button>}</td>}
						</tr>))}</tbody>
				</table></div>
			)}

			<h3 style={{ marginTop: 22 }}>{w.monthly}</h3>
			<div className="table-scroll"><table>
				<thead><tr><th>{w.student}</th><th>{w.present}</th><th>{lang === 'en' ? 'Total' : lang === 'ur' ? 'کل' : 'الإجمالي'}</th><th>{w.rate}</th></tr></thead>
				<tbody>{monthly.map(m => (
					<tr key={m.name}><td>{m.name}</td><td>{m.present}</td><td>{m.total}</td>
						<td><span className={'status-badge ' + (m.rate >= 75 ? 'paid' : 'pending')}><i />{m.rate}%</span></td>
					</tr>))}</tbody>
			</table></div>

			{edit && <div className="modal-backdrop"><section role="dialog" aria-modal="true" className="modal">
				<button className="modal-close" aria-label="Close" onClick={() => setEdit(null)}><X /></button>
				<h2>{w.correct}</h2>
				<form onSubmit={correct}>
					<label>{w.cStatus}<select name="status" defaultValue={edit.status}>{STATUSES.map(s => <option key={s}>{s}</option>)}</select></label>
					<label>{w.reason}<textarea name="reason" required placeholder={lang === 'en' ? 'e.g. Corrected by Admin (2026-10-12) — student arrived late' : ''} /></label>
					<button className="primary" disabled={busy}>{busy ? '…' : w.save}</button>
				</form>
			</section></div>}
		</section>
	);
}
