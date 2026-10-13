import { useMemo, useState } from 'react';
import { Download, GraduationCap, CalendarCheck, Wallet, ClipboardCheck, ShieldCheck } from 'lucide-react';
import type { AppUser, SchoolRecord } from '@/data/school';

const L = {
	en: { title: 'Reports & audit', students: 'Students', attendance: 'Attendance', finance: 'Finance', operations: 'Operations', strength: 'Total students', admitted: 'Admissions', withdrawn: 'Withdrawals', present: 'Present', absent: 'Absent', rate: 'Attendance rate', collected: 'Collected', dues: 'Outstanding dues', expenses: 'Expenses paid', audit: 'Audit history', reconcile: 'Totals reconcile to saved records.', filter: 'Filter', session: 'Session', class: 'Class', status: 'Status', all: 'All', export: 'Export CSV', noAudit: 'No authorized changes recorded yet.', who: 'Who · action · reason', when: 'When' },
	ur: { title: 'رپورٹس اور آڈٹ', students: 'طلبہ', attendance: 'حاضری', finance: 'مالیات', operations: 'عملیات', strength: 'کل طلبہ', admitted: 'داخلے', withdrawn: 'منسحبی', present: 'حاضر', absent: 'غیر حاضر', rate: 'حاضری کی شرح', collected: 'وصول شدہ', dues: 'بقایا واجبات', expenses: 'اخراجات ادا شدہ', audit: 'آڈٹ تاریخ', reconcile: 'کل مقداری محفوظہ ریکارڈ سے مطابقت رکھتی ہیں۔', filter: 'فلٹر', session: 'سیشن', class: 'جماعت', status: 'حالت', all: 'تمام', export: 'CSV ایکسپورٹ', noAudit: 'ابھی کوئی مجاز تبدیلی درج نہیں۔', who: 'کون · عمل · وجہ', when: 'کب' },
	ar: { title: 'التقارير والتدقيق', students: 'الطلاب', attendance: 'الحضور', finance: 'المالية', operations: 'العمليات', strength: 'إجمالي الطلاب', admitted: 'القبولات', withdrawn: 'الانسحابات', present: 'حاضر', absent: 'غائب', rate: 'نسبة الحضور', collected: 'المحصّل', dues: 'المستحقات المعلقة', expenses: 'المصروفات المدفوعة', audit: 'سجل التدقيق', reconcile: 'تتطابق الإجماليات مع السجلات المحفوظة.', filter: 'تصفية', session: 'الدورة', class: 'الفصل', status: 'الحالة', all: 'الكل', export: 'تصدير CSV', noAudit: 'لا توجد تغييرات معتمدة بعد.', who: 'من · إجراء · سبب', when: 'متى' },
};
const money = (n: number, lang: string) => new Intl.NumberFormat(lang === 'en' ? 'en-PK' : lang === 'ur' ? 'ur-PK' : 'ar-SA', { maximumFractionDigits: 0 }).format(n || 0);

export function Reports({ rows, lang, loading, user }: { rows: SchoolRecord[]; lang: string; loading: boolean; user: AppUser }) {
	const w = L[lang === 'ur' ? 'ur' : lang === 'ar' ? 'ar' : 'en'];
	const [fClass, setFClass] = useState('all');
	const [fStatus, setFStatus] = useState('all');

	const classes = useMemo(() => Array.from(new Set(rows.map(r => r.class_name).filter(Boolean))), [rows]);
	const statuses = useMemo(() => Array.from(new Set(rows.map(r => r.status).filter(Boolean))), [rows]);

	const filt = (r: SchoolRecord) => (fClass === 'all' || r.class_name === fClass) && (fStatus === 'all' || r.status === fStatus);
	const students = rows.filter(r => r.module === 'Student records' && filt(r));
	const att = rows.filter(r => r.module === 'Attendance' && filt(r));
	const fees = rows.filter(r => r.module === 'Fees & payments' && filt(r));
	const exp = rows.filter(r => r.module === 'Expenses' && filt(r));

	const present = att.filter(r => r.status === 'Present').length;
	const collected = fees.reduce((s, r) => s + (r.paid_amount || 0), 0);
	const dues = fees.reduce((s, r) => s + ((r.amount || 0) - (r.paid_amount || 0)), 0);
	const expPaid = exp.filter(r => r.status === 'Paid').reduce((s, r) => s + r.amount, 0);

	const cards = [
		{ icon: GraduationCap, color: 'blue', title: w.strength, value: String(students.length), note: `${students.filter(s => s.status === 'Active').length} active` },
		{ icon: GraduationCap, color: 'green', title: w.admitted, value: String(students.filter(s => s.status !== 'Withdrawn').length), note: `${students.filter(s => s.status === 'Promoted').length} promoted` },
		{ icon: GraduationCap, color: 'orange', title: w.withdrawn, value: String(students.filter(s => s.status === 'Withdrawn').length), note: 'history preserved' },
		{ icon: CalendarCheck, color: 'purple', title: w.rate, value: att.length ? `${Math.round((present / att.length) * 100)}%` : '—', note: `${present} ${w.present} · ${att.length - present} ${w.absent}` },
		{ icon: Wallet, color: 'green', title: w.collected, value: `${money(collected, lang)}`, note: 'PKR' },
		{ icon: Wallet, color: 'orange', title: w.dues, value: `${money(dues, lang)}`, note: 'PKR outstanding' },
		{ icon: ClipboardCheck, color: 'blue', title: w.expenses, value: `${money(expPaid, lang)}`, note: 'PKR paid' },
		{ icon: ShieldCheck, color: 'purple', title: w.reconcile, value: '✓', note: 'saved records' },
	];

	const exportCsv = () => {
		const csv = ['Module,Title,Class,Status,Amount,Paid,Date,Reason', ...rows.filter(filt).map(r => [r.module, r.title, r.class_name, r.status, r.amount, r.paid_amount || 0, r.date, r.reason].map(v => `"${String(v || '').replaceAll('"', '""')}"`).join(','))].join('\n');
		const url = URL.createObjectURL(new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8' }));
		const a = document.createElement('a'); a.href = url; a.download = 'school-report.csv'; a.click(); URL.revokeObjectURL(url);
	};

	return (
		<section className="panel">
			<div className="section-title"><h2>{w.title}</h2><button className="secondary" onClick={exportCsv}><Download size={16} />{w.export}</button></div>
			<div className="toolbar">
				<label>{w.class}<select value={fClass} onChange={e => setFClass(e.target.value)}><option value="all">{w.all}</option>{classes.map(c => <option key={c}>{c}</option>)}</select></label>
				<label>{w.status}<select value={fStatus} onChange={e => setFStatus(e.target.value)}><option value="all">{w.all}</option>{statuses.map(s => <option key={s}>{s}</option>)}</select></label>
			</div>
			<div className="stats">
				{cards.map(c => { const I = c.icon; return (
					<div className="stat" key={c.title}><div className={`stat-icon ${c.color}`}><I size={21} /></div><span>{c.title}</span><strong>{c.value}</strong><small>{c.note}</small></div>
				); })}
			</div>
			<div className="safety-note"><ShieldCheck size={18} /><span>{w.reconcile}</span></div>
			<h3 style={{ marginTop: 22 }}>{w.audit}</h3>
			{loading ? <div className="empty-state">{lang === 'en' ? 'Loading…' : lang === 'ur' ? 'لوڈ ہو رہا ہے…' : 'جارٍ التحميل…'}</div> : (
				<div className="table-scroll"><table>
					<thead><tr><th>{w.who}</th><th>{w.when}</th></tr></thead>
					<tbody>{rows.filter(r => r.reason).slice(0, 10).map(r => (
						<tr key={r.id}><td>{r.title} · {r.status} · {r.reason}</td><td className="date-cell">{r.date}</td></tr>
					))}{!rows.some(r => r.reason) && <tr><td colSpan={2}>{w.noAudit}</td></tr>}</tbody>
				</table></div>
			)}
		</section>
	);
}
