import { useEffect, useState } from 'react';
import { Download, Receipt, ShieldCheck, Wallet, X } from 'lucide-react';
import { pocketbaseClient as pb } from '@/lib/pocketbase-client';
import type { AppUser, SchoolRecord } from '@/data/school';

const L = {
	en: { add: 'Create invoice', student: 'Student name', adm: 'Admission ref', head: 'Fee head', amount: 'Invoice amount (PKR)', due: 'Due date', save: 'Save invoice', sign: 'Sign in as admin to manage fees.', plan: 'Fee plan (from School setup)', heads: 'Fee heads', installments: 'Installments', pay: 'Pay', verify: 'Verify', adjust: 'Adjust', receipt: 'Receipt', payAmount: 'Payment amount (PKR)', reference: 'Payment reference', payBtn: 'Record payment', adjustAmount: 'New invoice amount', adjustReason: 'Adjustment reason (refund / concession)', adjustBtn: 'Apply adjustment', balance: 'Balance', paid: 'Paid', total: 'Total', status: 'Status', none: 'No invoices yet.', loading: 'Loading fees…', verified: 'Payment verified', partial: 'Partial payment recorded', safety: 'Online status is verified; app redirect alone is not proof. Refunds and concessions require approval and a reason.' },
	ur: { add: 'انوائس بنائیں', student: 'طالب علم کا نام', adm: 'داخلہ حوالہ', head: 'فیس ہیڈ', amount: 'انوائس رقم (روپے)', due: 'آخری تاریخ', save: 'محفوظ کریں', sign: 'فیس کے انتظام کے لیے بطور ایڈمن لاگ ان کریں۔', plan: 'فیس پلان (اسکول سیٹ اپ سے)', heads: 'فیس ہیڈز', installments: 'قسطیں', pay: 'ادائیگی', verify: 'تصدیق', adjust: 'ترتیب', receipt: 'رسید', payAmount: 'ادائیگی کی رقم (روپے)', reference: 'ادائیگی کا حوالہ', payBtn: 'ادائیگی درج کریں', adjustAmount: 'نئی انوائس رقم', adjustReason: 'ترتیب کا وجہ (واپسی / رعایت)', adjustBtn: 'ترتیب لگائیں', balance: 'بقایا', paid: 'ادا شدہ', total: 'کل', status: 'حالت', none: 'ابھی کوئی انوائس نہیں۔', loading: 'فیس لوڈ ہو رہی ہے…', verified: 'ادائیگی تصدیق شدہ', partial: 'جزوی ادائیگی درج ہوئی', safety: 'آن لائن حالت تصدیق شدہ ہے؛ ایپ ریڈائریکٹ تنہا ثبوت نہیں۔ واپسی اور رعایت کے لیے منظوری اور وجہ درکار ہے۔' },
	ar: { add: 'إنشاء فاتورة', student: 'اسم الطالب', adm: 'مرجع القبول', head: 'بند الرسوم', amount: 'مبلغ الفاتورة (روبية)', due: 'تاريخ الاستحقاق', save: 'حفظ', sign: 'سجل الدخول كمشرف لإدارة الرسوم.', plan: 'خطة الرسوم (من إعداد المدرسة)', heads: 'بنود الرسوم', installments: 'الأقساط', pay: 'دفع', verify: 'تحقق', adjust: 'تعديل', receipt: 'إيصال', payAmount: 'مبلغ الدفع (روبية)', reference: 'مرجع الدفع', payBtn: 'تسجيل الدفع', adjustAmount: 'مبلغ الفاتورة الجديد', adjustReason: 'سبب التعديل (استرداد / تخفيض)', adjustBtn: 'تطبيق التعديل', balance: 'الرصيد', paid: 'المدفوع', total: 'الإجمالي', status: 'الحالة', none: 'لا توجد فواتير بعد.', loading: 'جارٍ تحميل الرسوم…', verified: 'تم التحقق من الدفع', partial: 'تم تسجيل دفع جزئي', safety: 'يتم التحقق من الحالة عبر الإنترنت؛ إعادة توجيه التطبيق وحدها ليست دليلاً. الاسترداد والتخفيض يتطلبان موافقة وسبباً.' },
};
const HEADS = ['Admission fee', 'Tuition fee', 'Exam fee', 'Transport fee', 'Library fee'];
const money = (n: number, lang: string) => new Intl.NumberFormat(lang === 'en' ? 'en-PK' : lang === 'ur' ? 'ur-PK' : 'ar-SA', { maximumFractionDigits: 0 }).format(n || 0);

export function Fees({ rows, lang, loading, user, addTrigger, onMutate, onError }: { rows: SchoolRecord[]; lang: string; loading: boolean; user: AppUser; addTrigger: number; onMutate: () => void; onError: (m: string) => void }) {
	const w = L[lang === 'ur' ? 'ur' : lang === 'ar' ? 'ar' : 'en'];
	const [open, setOpen] = useState(false);
	const [busy, setBusy] = useState(false);
	const [payFor, setPayFor] = useState<SchoolRecord | null>(null);
	const [adjFor, setAdjFor] = useState<SchoolRecord | null>(null);
	const [rcpt, setRcpt] = useState<SchoolRecord | null>(null);
	useEffect(() => { if (addTrigger > 0) setOpen(true); }, [addTrigger]);
	const canAdd = user?.role === 'admin';
	const canVerify = user?.role === 'admin';

	const totalDue = rows.reduce((s, r) => s + (r.amount || 0), 0);
	const totalPaid = rows.reduce((s, r) => s + (r.paid_amount || 0), 0);

	async function save(e: React.FormEvent<HTMLFormElement>) {
		e.preventDefault(); setBusy(true);
		const f = new FormData(e.currentTarget);
		try {
			await pb.collection('school_records').create({
				module: 'Fees & payments', title: String(f.get('head')), class_name: String(f.get('student')),
				details: String(f.get('adm')), amount: Number(f.get('amount') || 0), paid_amount: 0,
				status: 'Pending', date: String(f.get('due')), reference: '', reason: '',
				owner: (pb.authStore.record as { id?: string } | null)?.id,
			});
			onMutate(); setOpen(false);
		} catch { onError(lang === 'en' ? 'Could not create invoice. Sign in as admin.' : 'ناکام۔'); }
		finally { setBusy(false); }
	}

	async function pay(e: React.FormEvent<HTMLFormElement>) {
		e.preventDefault(); setBusy(true);
		if (!payFor) return;
		const f = new FormData(e.currentTarget);
		const amt = Number(f.get('amount') || 0);
		const ref = String(f.get('reference') || '');
		try {
			const newPaid = (payFor.paid_amount || 0) + amt;
			const status = newPaid >= (payFor.amount || 0) ? 'Paid' : 'Partial';
			const newRef = [payFor.reference, ref].filter(Boolean).join(' · ');
			await pb.collection('school_records').update(payFor.id, { paid_amount: newPaid, status, reference: newRef });
			onMutate(); setPayFor(null);
		} catch { onError(lang === 'en' ? 'Payment could not be recorded.' : 'ناکام۔'); }
		finally { setBusy(false); }
	}

	async function verify(r: SchoolRecord) {
		try { await pb.collection('school_records').update(r.id, { status: 'Verified' }); onMutate(); }
		catch { onError(lang === 'en' ? 'Verification failed.' : 'ناکام۔'); }
	}

	async function adjust(e: React.FormEvent<HTMLFormElement>) {
		e.preventDefault(); setBusy(true);
		if (!adjFor) return;
		const f = new FormData(e.currentTarget);
		try {
			await pb.collection('school_records').update(adjFor.id, { amount: Number(f.get('amount') || 0), reason: String(f.get('reason') || '') });
			onMutate(); setAdjFor(null);
		} catch { onError(lang === 'en' ? 'Adjustment failed. A reason is required.' : 'ناکام۔'); }
		finally { setBusy(false); }
	}

	const exportCsv = () => {
		const csv = ['Student,Head,Total,Paid,Balance,Status,Reference', ...rows.map(r => [r.class_name, r.title, r.amount, r.paid_amount || 0, (r.amount || 0) - (r.paid_amount || 0), r.status, r.reference].map(v => `"${String(v).replaceAll('"', '""')}"`).join(','))].join('\n');
		const url = URL.createObjectURL(new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8' }));
		const a = document.createElement('a'); a.href = url; a.download = 'fees.csv'; a.click(); URL.revokeObjectURL(url);
	};

	return (
		<section className="panel">
			<div className="section-title"><h2>{lang === 'en' ? 'Fees & payments' : lang === 'ur' ? 'فیس اور ادائیگیاں' : 'الرسوم والمدفوعات'}</h2>
				<button className="secondary" onClick={exportCsv}><Download size={16} />CSV</button></div>
			<div className="safety-note"><ShieldCheck size={18} /><span>{w.safety}</span></div>

			<div className="fee-plan">
				<div><strong>{w.heads}</strong><ul>{HEADS.map(h => <li key={h}>{h}</li>)}</ul></div>
				<div><strong>{w.installments}</strong><p>3 (Term 1 · Term 2 · Term 3)</p></div>
				<div><strong>{w.total}</strong><p>{money(totalDue, lang)} PKR</p></div>
				<div><strong>{w.paid}</strong><p>{money(totalPaid, lang)} PKR</p></div>
				<div><strong>{w.balance}</strong><p>{money(totalDue - totalPaid, lang)} PKR</p></div>
			</div>

			{!canAdd && <div className="safety-note" style={{ background: '#f3f1ff', color: '#6b5ea8' }}><Wallet size={18} /><span>{w.sign}</span></div>}
			{loading ? <div className="empty-state">{w.loading}</div> : !rows.length ? <div className="empty-state"><Receipt size={35} /><h3>{w.none}</h3></div> : (
				<div className="table-scroll"><table>
					<thead><tr><th>{w.student}</th><th>{w.head}</th><th>{w.total}</th><th>{w.paid}</th><th>{w.balance}</th><th>{w.status}</th><th></th></tr></thead>
					<tbody>{rows.map(r => { const bal = (r.amount || 0) - (r.paid_amount || 0); return (
						<tr key={r.id}>
							<td><span className="record-title"><span className="record-icon"><Receipt size={16} /></span><span>{r.class_name}<small>{r.details}</small></span></span></td>
							<td>{r.title}</td>
							<td className="amount-cell">{money(r.amount, lang)}</td>
							<td className="amount-cell">{money(r.paid_amount || 0, lang)}</td>
							<td className="amount-cell">{money(bal, lang)}</td>
							<td><span className={'status-badge ' + (r.status === 'Paid' || r.status === 'Verified' ? 'paid' : 'pending')}><i />{r.status}</span></td>
							<td>
								<button className="text-button" onClick={() => setRcpt(r)}>{w.receipt}</button>
								{canAdd && bal > 0 && <button className="text-button" onClick={() => setPayFor(r)}>{w.pay}</button>}
								{canVerify && r.status === 'Paid' && <button className="text-button" onClick={() => verify(r)}>{w.verify}</button>}
								{canAdd && <button className="text-button" onClick={() => setAdjFor(r)}>{w.adjust}</button>}
							</td>
						</tr>); })}</tbody>
				</table></div>
			)}

			{(open || payFor || adjFor || rcpt) && <div className="modal-backdrop"><section role="dialog" aria-modal="true" className="modal">
				<button className="modal-close" aria-label="Close" onClick={() => { setOpen(false); setPayFor(null); setAdjFor(null); setRcpt(null); }}><X /></button>
				{rcpt ? (<>
					<h2>{w.receipt}</h2>
					<div className="receipt">
						<p><strong>{rcpt.class_name}</strong> · {rcpt.details}</p>
						<p>{rcpt.title} · {lang === 'en' ? 'Due' : lang === 'ur' ? 'آخری' : 'الاستحقاق'}: {rcpt.date}</p>
						<hr />
						<p>{w.total}: {money(rcpt.amount, lang)} PKR</p>
						<p>{w.paid}: {money(rcpt.paid_amount || 0, lang)} PKR</p>
						<p>{w.balance}: {money((rcpt.amount || 0) - (rcpt.paid_amount || 0), lang)} PKR</p>
						<p>{w.status}: <span className={'status-badge ' + (rcpt.status === 'Paid' || rcpt.status === 'Verified' ? 'paid' : 'pending')}><i />{rcpt.status}</span></p>
						{rcpt.reference && <p>{w.reference}: {rcpt.reference}</p>}
						{rcpt.reason && <p>{w.adjustReason}: {rcpt.reason}</p>}
					</div>
				</>) : payFor ? (<>
					<h2>{w.pay} — {payFor.class_name}</h2>
					<p>{w.balance}: {money((payFor.amount || 0) - (payFor.paid_amount || 0), lang)} PKR</p>
					<form onSubmit={pay}>
						<label>{w.payAmount}<input name="amount" type="number" min={1} step="0.01" required /></label>
						<label>{w.reference}<input name="reference" placeholder="Online TRX-… / Cash" /></label>
						<button className="primary" disabled={busy}>{busy ? '…' : w.payBtn}</button>
					</form>
				</>) : adjFor ? (<>
					<h2>{w.adjust} — {adjFor.class_name}</h2>
					<form onSubmit={adjust}>
						<label>{w.adjustAmount}<input name="amount" type="number" min={0} step="0.01" defaultValue={adjFor.amount} required /></label>
						<label>{w.adjustReason}<textarea name="reason" required placeholder={lang === 'en' ? 'e.g. Sibling concession 10% — approved by principal' : ''} /></label>
						<button className="primary" disabled={busy}>{busy ? '…' : w.adjustBtn}</button>
					</form>
				</>) : (<>
					<h2>{w.add}</h2>
					<form onSubmit={save}>
						<label>{w.student}<input name="student" required /></label>
						<div className="form-grid">
							<label>{w.adm}<input name="adm" placeholder="ADM-1001" /></label>
							<label>{w.head}<select name="head" defaultValue="Tuition fee">{HEADS.map(h => <option key={h}>{h}</option>)}</select></label>
						</div>
						<div className="form-grid">
							<label>{w.amount}<input name="amount" type="number" min={0} step="0.01" required /></label>
							<label>{w.due}<input name="due" type="date" required /></label>
						</div>
						<button className="primary" disabled={busy}>{busy ? '…' : w.save}</button>
					</form>
				</>)}
			</section></div>}
		</section>
	);
}
