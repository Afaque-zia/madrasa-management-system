import { useEffect, useState } from 'react';
import { FileText, History, ShieldCheck, X } from 'lucide-react';
import { pocketbaseClient as pb } from '@/lib/pocketbase-client';
import type { AppUser, SchoolRecord } from '@/data/school';

const L = {
	en: { add: 'Admit student', name: 'Full name', adm: 'Admission number', session: 'Academic session', cls: 'Class', sec: 'Section', roll: 'Roll number', date: 'Admission date', status: 'Lifecycle status', reason: 'Reason / approval reference', save: 'Save student', correct: 'Update lifecycle', history: 'Lifecycle history is preserved across promotions, transfers and withdrawals.', sign: 'Sign in as admin to admit students.', none: 'No students admitted yet.', loading: 'Loading students…', cAdm: 'Admission #', cName: 'Student', cClass: 'Class / section', cRoll: 'Roll', cStatus: 'Status', cDate: 'Admitted', cAction: '' },
	ur: { add: 'طلبہ داخل کریں', name: 'پورا نام', adm: 'داخلہ نمبر', session: 'تعلیمی سیشن', cls: 'جماعت', sec: 'سیکشن', roll: 'رول نمبر', date: 'داخلہ کی تاریخ', status: 'حالت کا دور', reason: 'وجہ / منظوری کا حوالہ', save: 'محفوظ کریں', correct: 'حالت اپ ڈیٹ کریں', history: 'ترقی، منتقلی اور علیحدگی کے دوران حالت کی تاریخ محفوظ رہتی ہے۔', sign: 'طلبہ داخل کرنے کے لیے بطور ایڈمن لاگ ان کریں۔', none: 'ابھی کوئی طالب علم داخل نہیں ہوا۔', loading: 'طلباء لوڈ ہو رہے ہیں…', cAdm: 'داخلہ #', cName: 'طالب علم', cClass: 'جماعت / سیکشن', cRoll: 'رول', cStatus: 'حالت', cDate: 'داخلہ', cAction: '' },
	ar: { add: 'قبول طالب', name: 'الاسم الكامل', adm: 'رقم القبول', session: 'العام الدراسي', cls: 'الفصل', sec: 'الشعبة', roll: 'رقم الدور', date: 'تاريخ القبول', status: 'حالة الدورة', reason: 'السبب / مرجع الموافقة', save: 'حفظ', correct: 'تحديث الحالة', history: 'يتم الحفاظ على سجل الحالة عبر الترقيات والانتقالات والانسحابات.', sign: 'سجل الدخول كمشرف لقبول الطلاب.', none: 'لم يتم قبول طلاب بعد.', loading: 'جارٍ تحميل الطلاب…', cAdm: 'القبول #', cName: 'الطالب', cClass: 'الفصل / الشعبة', cRoll: 'الدور', cStatus: 'الحالة', cDate: 'القبول', cAction: '' },
};
const STATUSES = ['Admitted', 'Allocated', 'Active', 'Promoted', 'Transferred', 'Withdrawn'];
const STATUS_LABEL: Record<string, Record<string, string>> = {
	Promoted: { ur: 'ترقی یافتہ', ar: 'مُرقّى' }, Transferred: { ur: 'منتقل', ar: 'منقول' }, Withdrawn: { ur: 'منسحب', ar: 'منسحب' }, Active: { ur: 'جاری', ar: 'نشط' }, Admitted: { ur: 'داخل', ar: 'مقبول' }, Allocated: { ur: 'مختص', ar: 'مخصص' },
};

export function StudentRecords({ rows, lang, loading, user, addTrigger, onMutate, onError }: { rows: SchoolRecord[]; lang: string; loading: boolean; user: AppUser; addTrigger: number; onMutate: () => void; onError: (m: string) => void }) {
	const w = L[lang === 'ur' ? 'ur' : lang === 'ar' ? 'ar' : 'en'];
	const [open, setOpen] = useState(false);
	const [edit, setEdit] = useState<SchoolRecord | null>(null);
	const [busy, setBusy] = useState(false);
	useEffect(() => { if (addTrigger > 0) { setEdit(null); setOpen(true); } }, [addTrigger]);
	const canAdd = user?.role === 'admin';
	const canEdit = user?.role === 'admin';

	const parse = (d: string) => {
		const adm = (d.match(/Adm:\s*([^·]+)/) || [])[1]?.trim() || '—';
		const roll = (d.match(/Roll:\s*([^·]+)/) || [])[1]?.trim() || '—';
		return { adm, roll };
	};

	async function save(e: React.FormEvent<HTMLFormElement>) {
		e.preventDefault(); setBusy(true);
		const f = new FormData(e.currentTarget);
		try {
			await pb.collection('school_records').create({
				module: 'Student records', title: String(f.get('title')), class_name: `${f.get('class_name')} · ${f.get('section')}`,
				date: String(f.get('date')), status: String(f.get('status')), amount: 0,
				details: `Adm: ${f.get('adm')} · Roll: ${f.get('roll')} · Session: ${f.get('session')}`,
				reason: String(f.get('reason') || ''), owner: (pb.authStore.record as { id?: string } | null)?.id,
			});
			onMutate(); setOpen(false);
		} catch { onError(lang === 'en' ? 'Could not admit student. Sign in as admin.' : lang === 'ur' ? 'داخلہ ناکام۔ ایڈمن کے طور پر لاگ ان کریں۔' : 'تعذر القبول.'); }
		finally { setBusy(false); }
	}

	async function update(e: React.FormEvent<HTMLFormElement>) {
		e.preventDefault(); setBusy(true);
		if (!edit) return;
		const f = new FormData(e.currentTarget);
		try {
			await pb.collection('school_records').update(edit.id, { status: String(f.get('status')), reason: String(f.get('reason') || '') });
			onMutate(); setEdit(null);
		} catch { onError(lang === 'en' ? 'Lifecycle update failed. A reason is required.' : 'ناکام۔'); }
		finally { setBusy(false); }
	}

	const label = (s: string) => STATUS_LABEL[s]?.[lang] || s;

	return (
		<section className="panel">
			<div className="section-title"><h2>{lang === 'en' ? 'Student records' : lang === 'ur' ? 'طلبہ کا ریکارڈ' : 'سجلات الطلاب'}</h2><span>{rows.length} {lang === 'en' ? 'students' : lang === 'ur' ? 'طلبہ' : 'طالب'}</span></div>
			<div className="safety-note"><History size={18} /><span>{w.history}</span></div>
			{!canAdd && <div className="safety-note" style={{ background: '#f3f1ff', color: '#6b5ea8' }}><ShieldCheck size={18} /><span>{w.sign}</span></div>}
			{loading ? <div className="empty-state">{w.loading}</div> : !rows.length ? <div className="empty-state"><FileText size={35} /><h3>{w.none}</h3></div> : (
				<div className="table-scroll"><table>
					<thead><tr><th>{w.cAdm}</th><th>{w.cName}</th><th>{w.cClass}</th><th>{w.cRoll}</th><th>{w.cStatus}</th><th>{w.cDate}</th>{canEdit && <th></th>}</tr></thead>
					<tbody>{rows.map(r => { const p = parse(r.details); return (
						<tr key={r.id}>
							<td className="date-cell">{p.adm}</td>
							<td><span className="record-title"><span className="record-icon"><FileText size={16} /></span><span>{r.title}</span></span></td>
							<td>{r.class_name || '—'}</td>
							<td>{p.roll}</td>
							<td><span className={'status-badge ' + (r.status === 'Active' || r.status === 'Promoted' ? 'paid' : r.status === 'Withdrawn' ? 'pending' : '')}><i />{label(r.status)}</span></td>
							<td className="date-cell">{r.date || '—'}</td>
							{canEdit && <td><button className="text-button" onClick={() => setEdit(r)}>{w.correct}</button></td>}
						</tr>); })}</tbody>
				</table></div>
			)}
			{(open || edit) && <div className="modal-backdrop"><section role="dialog" aria-modal="true" className="modal">
				<button className="modal-close" aria-label="Close" onClick={() => { setOpen(false); setEdit(null); }}><X /></button>
				<h2>{edit ? w.correct : w.add}</h2>
				{edit ? (
					<form onSubmit={update}>
						<label>{w.status}<select name="status" defaultValue={edit.status}>{STATUSES.map(s => <option key={s}>{s}</option>)}</select></label>
						<label>{w.reason}<textarea name="reason" required placeholder={lang === 'en' ? 'e.g. Promoted to Class 8 — approved by principal' : ''} /></label>
						<button className="primary" disabled={busy}>{busy ? '…' : w.save}</button>
					</form>
				) : (
					<form onSubmit={save}>
						<label>{w.name}<input name="title" required /></label>
						<div className="form-grid">
							<label>{w.adm}<input name="adm" placeholder="ADM-1009" required /></label>
							<label>{w.session}<input name="session" defaultValue="2026 – 2027" /></label>
							<label>{w.cls}<input name="class_name" placeholder="7" required /></label>
							<label>{w.sec}<input name="section" placeholder="A" required /></label>
							<label>{w.roll}<input name="roll" type="number" min={1} /></label>
							<label>{w.date}<input name="date" type="date" required /></label>
						</div>
						<label>{w.status}<select name="status" defaultValue="Admitted">{STATUSES.map(s => <option key={s}>{s}</option>)}</select></label>
						<label>{w.reason}<input name="reason" placeholder={lang === 'en' ? 'Optional admission note' : ''} /></label>
						<button className="primary" disabled={busy}>{busy ? '…' : w.save}</button>
					</form>
				)}
			</section></div>}
		</section>
	);
}
