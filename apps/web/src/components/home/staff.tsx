import { useEffect, useState } from 'react';
import { Users, X } from 'lucide-react';
import { pocketbaseClient as pb } from '@/lib/pocketbase-client';
import type { AppUser, SchoolRecord } from '@/data/school';

const L = {
	en: { add: 'Add staff', name: 'Full name', role: 'Role', classes: 'Assigned classes', subjects: 'Subjects / duties', date: 'Join date', status: 'Status', save: 'Save staff', sign: 'Sign in as admin to manage staff.', none: 'No staff records yet.', loading: 'Loading staff…', cName: 'Staff member', cRole: 'Role', cClasses: 'Classes', cSubjects: 'Subjects', cStatus: 'Status' },
	ur: { add: 'عملہ شامل کریں', name: 'پورا نام', role: 'کردار', classes: 'تفویض جماعتیں', subjects: 'مضامین / ذمہ داریاں', date: 'شمولیت کی تاریخ', status: 'حالت', save: 'محفوظ کریں', sign: 'عملہ کے انتظام کے لیے بطور ایڈمن لاگ ان کریں۔', none: 'ابھی کوئی عملہ نہیں۔', loading: 'عملہ لوڈ ہو رہا ہے…', cName: 'عملہ', cRole: 'کردار', cClasses: 'جماعتیں', cSubjects: 'مضامین', cStatus: 'حالت' },
	ar: { add: 'إضافة موظف', name: 'الاسم الكامل', role: 'الدور', classes: 'الفصول المخصصة', subjects: 'المواد / المهام', date: 'تاريخ الانضمام', status: 'الحالة', save: 'حفظ', sign: 'سجل الدخول كمشرف لإدارة الموظفين.', none: 'لا يوجد موظفون بعد.', loading: 'جارٍ تحميل الموظفين…', cName: 'الموظف', cRole: 'الدور', cClasses: 'الفصول', cSubjects: 'المواد', cStatus: 'الحالة' },
};
const ROLES = ['Admin', 'Teacher', 'Staff'];

export function Staff({ rows, lang, loading, user, addTrigger, onMutate, onError }: { rows: SchoolRecord[]; lang: string; loading: boolean; user: AppUser; addTrigger: number; onMutate: () => void; onError: (m: string) => void }) {
	const w = L[lang === 'ur' ? 'ur' : lang === 'ar' ? 'ar' : 'en'];
	const [open, setOpen] = useState(false);
	const [busy, setBusy] = useState(false);
	useEffect(() => { if (addTrigger > 0) setOpen(true); }, [addTrigger]);
	const canAdd = user?.role === 'admin';
	const parse = (d: string) => { const role = (d.match(/Role:\s*([^·]+)/) || [])[1]?.trim() || '—'; const subj = (d.match(/Subjects:\s*(.+)$/m) || [])[1]?.trim() || '—'; return { role, subj }; };

	async function save(e: React.FormEvent<HTMLFormElement>) {
		e.preventDefault(); setBusy(true);
		const f = new FormData(e.currentTarget);
		try {
			await pb.collection('school_records').create({
				module: 'Teacher & staff', title: String(f.get('title')), class_name: String(f.get('class_name') || '—'),
				date: String(f.get('date')), status: String(f.get('status')), amount: 0,
				details: `Role: ${f.get('role')} · Subjects: ${f.get('subjects')}`, reason: '',
				owner: (pb.authStore.record as { id?: string } | null)?.id,
			});
			onMutate(); setOpen(false);
		} catch { onError(lang === 'en' ? 'Could not save staff. Sign in as admin.' : 'ناکام۔'); }
		finally { setBusy(false); }
	}

	return (
		<section className="panel">
			<div className="section-title"><h2>{lang === 'en' ? 'Teacher & staff' : lang === 'ur' ? 'اساتذہ اور عملہ' : 'المعلمون والموظفون'}</h2><span>{rows.length} {lang === 'en' ? 'members' : lang === 'ur' ? 'ارکان' : 'أعضاء'}</span></div>
			{!canAdd && <div className="safety-note" style={{ background: '#f3f1ff', color: '#6b5ea8' }}><Users size={18} /><span>{w.sign}</span></div>}
			{loading ? <div className="empty-state">{w.loading}</div> : !rows.length ? <div className="empty-state"><Users size={35} /><h3>{w.none}</h3></div> : (
				<div className="table-scroll"><table>
					<thead><tr><th>{w.cName}</th><th>{w.cRole}</th><th>{w.cClasses}</th><th>{w.cSubjects}</th><th>{w.cStatus}</th></tr></thead>
					<tbody>{rows.map(r => { const p = parse(r.details); return (
						<tr key={r.id}>
							<td><span className="record-title"><span className="record-icon"><Users size={16} /></span><span>{r.title}</span></span></td>
							<td>{p.role}</td>
							<td>{r.class_name || '—'}</td>
							<td>{p.subj}</td>
							<td><span className={'status-badge ' + (r.status === 'Active' ? 'paid' : 'pending')}><i />{r.status}</span></td>
						</tr>); })}</tbody>
				</table></div>
			)}
			{open && <div className="modal-backdrop"><section role="dialog" aria-modal="true" className="modal">
				<button className="modal-close" aria-label="Close" onClick={() => setOpen(false)}><X /></button>
				<h2>{w.add}</h2>
				<form onSubmit={save}>
					<label>{w.name}<input name="title" required /></label>
					<div className="form-grid">
						<label>{w.role}<select name="role" defaultValue="Teacher">{ROLES.map(r => <option key={r}>{r}</option>)}</select></label>
						<label>{w.classes}<input name="class_name" placeholder="7, 8" /></label>
					</div>
					<label>{w.subjects}<input name="subjects" placeholder="Mathematics, Physics" /></label>
					<div className="form-grid">
						<label>{w.date}<input name="date" type="date" required /></label>
						<label>{w.status}<select name="status" defaultValue="Active"><option>Active</option><option>On leave</option></select></label>
					</div>
					<button className="primary" disabled={busy}>{busy ? '…' : w.save}</button>
				</form>
			</section></div>}
		</section>
	);
}
