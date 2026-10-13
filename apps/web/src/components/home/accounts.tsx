import { useEffect, useState } from 'react';
import { ShieldCheck, Users, X } from 'lucide-react';
import { pocketbaseClient as pb } from '@/lib/pocketbase-client';
import type { AppUser } from '@/data/school';

type PbUser = { id: string; email: string; name?: string; role?: string; assigned_class?: string; created?: string };

const L = {
	en: { title: 'Accounts & access', add: 'Create account', name: 'Full name', email: 'Email', password: 'Password (min 8 chars)', role: 'Role', assigned: 'Assigned class (teachers)', save: 'Create account', sign: 'Only an admin can create school accounts. Sign-up is closed.', list: 'School accounts', none: 'No accounts yet.', loading: 'Loading accounts…', cName: 'Name', cEmail: 'Email', cRole: 'Role', cClass: 'Class', created: 'Created', closed: 'Closed sign-up', roles: 'Admin · Teacher · Student', perm: 'Permissions follow role and assignment', createdOk: 'Account created.', fail: 'Could not create account. Check the email is unique and password ≥ 8 chars.' },
	ur: { title: 'اکاؤنٹس اور رسائی', add: 'اکاؤنٹ بنائیں', name: 'پورا نام', email: 'ای میل', password: 'پاس ورڈ (کم از کم ۸ حروف)', role: 'کردار', assigned: 'تفویض جماعت (اساتذہ)', save: 'اکاؤنٹ بنائیں', sign: 'صرف ایڈمن اسکول اکاؤنٹس بنا سکتا ہے۔ سائن اپ بند ہے۔', list: 'اسکول اکاؤنٹس', none: 'ابھی کوئی اکاؤنٹ نہیں۔', loading: 'اکاؤنٹس لوڈ ہو رہے ہیں…', cName: 'نام', cEmail: 'ای میل', cRole: 'کردار', cClass: 'جماعت', created: 'تاریخ', closed: 'بند سائن اپ', roles: 'ایڈمن · استاد · طالب علم', perm: 'اجازتیں کردار اور تفویض کے مطابق', createdOk: 'اکاؤنٹ بنا۔', fail: 'اکاؤنٹ نہیں بنا۔ ای میل منفرد اور پاس ورڈ ≥ ۸ حروف ہو۔' },
	ar: { title: 'الحسابات والصلاحيات', add: 'إنشاء حساب', name: 'الاسم الكامل', email: 'البريد الإلكتروني', password: 'كلمة المرور (٨ أحرف على الأقل)', role: 'الدور', assigned: 'الفصل المخصص (للمعلمين)', save: 'إنشاء حساب', sign: 'فقط المشرف يمكنه إنشاء حسابات المدرسة. التسجيل مغلق.', list: 'حسابات المدرسة', none: 'لا توجد حسابات بعد.', loading: 'جارٍ تحميل الحسابات…', cName: 'الاسم', cEmail: 'البريد', cRole: 'الدور', cClass: 'الفصل', created: 'تاريخ', closed: 'تسجيل مغلق', roles: 'مشرف · معلم · طالب', perm: 'الصلاحيات تتبع الدور والتعيين', createdOk: 'تم إنشاء الحساب.', fail: 'تعذر إنشاء الحساب. تحقق من تفرد البريد وكلمة المرور ≥ ٨.' },
};
const ROLES = ['admin', 'teacher', 'student'];

export function Accounts({ lang, user, addTrigger, onMutate, onError }: { lang: string; user: AppUser; addTrigger: number; onMutate: () => void; onError: (m: string) => void }) {
	const w = L[lang === 'ur' ? 'ur' : lang === 'ar' ? 'ar' : 'en'];
	const [users, setUsers] = useState<PbUser[]>([]);
	const [loading, setLoading] = useState(false);
	const [open, setOpen] = useState(false);
	const [busy, setBusy] = useState(false);
	const isAdmin = user?.role === 'admin';

	useEffect(() => { if (addTrigger > 0) setOpen(true); }, [addTrigger]);
	useEffect(() => {
		if (!isAdmin) return;
		setLoading(true);
		pb.collection('users').getFullList<PbUser>({ sort: '-created' }).then(setUsers).catch(() => onError(lang === 'en' ? 'Could not load accounts.' : 'ناکام۔')).finally(() => setLoading(false));
	}, [isAdmin, lang, onError]);

	async function save(e: React.FormEvent<HTMLFormElement>) {
		e.preventDefault(); setBusy(true);
		const f = new FormData(e.currentTarget);
		try {
			await pb.collection('users').create({
				email: String(f.get('email')), password: String(f.get('password')), passwordConfirm: String(f.get('password')),
				name: String(f.get('name')), role: String(f.get('role')), assigned_class: String(f.get('assigned_class') || ''),
			});
			pb.collection('users').getFullList<PbUser>({ sort: '-created' }).then(setUsers).catch(() => {});
			setOpen(false); onMutate();
		} catch { onError(w.fail); }
		finally { setBusy(false); }
	}

	if (!isAdmin) return (
		<section className="panel">
			<div className="section-title"><h2>{w.title}</h2><span className="tag">{w.closed}</span></div>
			<div className="safety-note" style={{ background: '#f3f1ff', color: '#6b5ea8' }}><ShieldCheck size={18} /><span>{w.sign}</span></div>
		</section>
	);

	return (
		<section className="panel">
			<div className="section-title"><h2>{w.title}</h2><span className="tag">{w.roles}</span></div>
			<div className="safety-note"><ShieldCheck size={18} /><span>{w.perm}</span></div>
			<h3 style={{ marginTop: 18 }}>{w.list}</h3>
			{loading ? <div className="empty-state">{w.loading}</div> : !users.length ? <div className="empty-state"><Users size={35} /><h3>{w.none}</h3></div> : (
				<div className="table-scroll"><table>
					<thead><tr><th>{w.cName}</th><th>{w.cEmail}</th><th>{w.cRole}</th><th>{w.cClass}</th><th>{w.created}</th></tr></thead>
					<tbody>{users.map(u => (
						<tr key={u.id}><td><span className="record-title"><span className="record-icon"><Users size={16} /></span><span>{u.name || u.email}</span></span></td>
							<td>{u.email}</td><td><span className={'status-badge ' + (u.role === 'admin' ? 'paid' : 'pending')}><i />{u.role}</span></td>
							<td>{u.assigned_class || '—'}</td><td className="date-cell">{u.created?.slice(0, 10) || '—'}</td>
						</tr>))}</tbody>
				</table></div>
			)}
			{open && <div className="modal-backdrop"><section role="dialog" aria-modal="true" className="modal">
				<button className="modal-close" aria-label="Close" onClick={() => setOpen(false)}><X /></button>
				<h2>{w.add}</h2>
				<form onSubmit={save}>
					<label>{w.name}<input name="name" required /></label>
					<label>{w.email}<input name="email" type="email" required /></label>
					<label>{w.password}<input name="password" type="password" minLength={8} required /></label>
					<div className="form-grid">
						<label>{w.role}<select name="role" defaultValue="teacher">{ROLES.map(r => <option key={r}>{r}</option>)}</select></label>
						<label>{w.assigned}<input name="assigned_class" placeholder="Class 7 · A" /></label>
					</div>
					<button className="primary" disabled={busy}>{busy ? '…' : w.save}</button>
				</form>
			</section></div>}
		</section>
	);
}
