import { useState } from 'react';
import { GraduationCap, Layers, Wallet, ClipboardCheck, CalendarCheck, Languages, ShieldCheck, Save } from 'lucide-react';

type Lang = 'en' | 'ur' | 'ar';

const t: Record<Lang, Record<string, string>> = {
	en: {
		heading: 'School setup',
		sub: 'Configure the school identity, classes, fee rules, grading and attendance. These are configurable defaults — finalize every value with the school before live operations.',
		draft: 'Configurable default',
		identity: 'School identity',
		schoolName: 'School name',
		schoolCode: 'Short code',
		session: 'Academic session',
		term: 'Current term',
		classes: 'Classes & sections',
		classesHint: 'One class per line, with sections separated by commas.',
		fees: 'Fee configuration',
		feeHeads: 'Fee heads (one per line)',
		installments: 'Installments',
		concessions: 'Concessions policy',
		refunds: 'Refunds policy',
		grading: 'Grading rules',
		gradeBands: 'Grade bands (label : min %)',
		passCriteria: 'Pass criteria (%)',
		rounding: 'Rounding rule',
		attendance: 'Attendance statuses',
		attendanceHint: 'Final list is configured by school policy.',
		languages: 'Languages & direction',
		langHint: 'Urdu and Arabic use RTL layouts; English uses LTR.',
		save: 'Save draft configuration',
		saved: 'Draft saved. Review with the school before going live.',
		note: 'Where the SRS says school-approved values must be finalized, these placeholders stand in — they are not invented school policy.',
	},
	ur: {
		heading: 'اسکول کی ترتیب',
		sub: 'اسکول کی شناخت، جماعتیں، فیس قواعد، درجہ بندی اور حاضری مرتب کریں۔ یہ قابلِ ترتیب طے شدہ اقدار ہیں — لائیو آپریشن سے پہلے ہر قدر اسکول کے ساتھ حتمی کریں۔',
		draft: 'طے شدہ ڈیفالٹ',
		identity: 'اسکول کی شناخت',
		schoolName: 'اسکول کا نام',
		schoolCode: 'مختصر کوڈ',
		session: 'تعلیمی سیشن',
		term: 'موجودہ ٹرم',
		classes: 'جماعتیں اور سیکشنز',
		classesHint: 'ہر لائن پر ایک جماعت، سیکشنز کو کومے سے الگ کریں۔',
		fees: 'فیس کی ترتیب',
		feeHeads: 'فیس ہیڈز (ہر لائن پر ایک)',
		installments: 'قسطیں',
		concessions: 'رعایت کی پالیسی',
		refunds: 'واپسی کی پالیسی',
		grading: 'درجہ بندی کے قواعد',
		gradeBands: 'گریڈ بینڈز (لیبل : کم از کم %)',
		passCriteria: 'پاس کا معیار (%)',
		rounding: 'راؤنڈنگ قاعدہ',
		attendance: 'حاضری کی حیثیتیں',
		attendanceHint: 'حتمی فہرست اسکول کی پالیسی سے طے ہوتی ہے۔',
		languages: 'زبانیں اور سمت',
		langHint: 'اردو اور عربی RTL استعمال کرتی ہیں؛ انگریزی LTR استعمال کرتی ہے۔',
		save: 'ڈرافٹ کنفیگریشن محفوظ کریں',
		saved: 'ڈرافٹ محفوظ ہو گیا۔ لائیو جانے سے پہلے اسکول کے ساتھ جائزہ لیں۔',
		note: 'جہاں SRS کہتا ہے کہ اسکول کی منظور شدہ اقدار حتمی ہونی چاہیئں، یہ پلیس ہولڈرز قائم ہیں — یہ اسکول کی وضع کردہ پالیسی نہیں۔',
	},
	ar: {
		heading: 'إعداد المدرسة',
		sub: 'اضبط هوية المدرسة والفصول وقواعد الرسوم والتقدير والحضور. هذه قيم افتراضية قابلة للضبط — يجب اعتماد كل قيمة مع المدرسة قبل التشغيل الفعلي.',
		draft: 'افتراضي قابل للضبط',
		identity: 'هوية المدرسة',
		schoolName: 'اسم المدرسة',
		schoolCode: 'الرمز المختصر',
		session: 'العام الدراسي',
		term: 'الفصل الحالي',
		classes: 'الفصول والشعب',
		classesHint: 'فصل واحد في كل سطر، والشعب مفصولة بفواصل.',
		fees: 'إعداد الرسوم',
		feeHeads: 'بنود الرسوم (واحد في كل سطر)',
		installments: 'الأقساط',
		concessions: 'سياسة التخفيضات',
		refunds: 'سياسة الاسترداد',
		grading: 'قواعد التقدير',
		gradeBands: 'نطاقات التقدير (التسمية : الحد الأدنى %)',
		passCriteria: 'معيار النجاح (%)',
		rounding: 'قاعدة التقريب',
		attendance: 'حالات الحضور',
		attendanceHint: 'القائمة النهائية تحددها سياسة المدرسة.',
		languages: 'اللغات والاتجاه',
		langHint: 'الأردية والعربية تستخدمان RTL؛ الإنجليزية تستخدم LTR.',
		save: 'حفظ المسودة',
		saved: 'تم حفظ المسودة. راجعها مع المدرسة قبل التشغيل.',
		note: 'حيثما ينص SRS على اعتماد قيم المدرسة، تعمل هذه العناصر النائبة بدلاً منها — وهي ليست سياسة مدرسية مفترضة.',
	},
};

const DEFAULTS = {
	schoolName: 'Sample School',
	schoolCode: 'SCH-001',
	session: '2026 – 2027',
	term: 'Term 1',
	classes: 'Class 1: A, B\nClass 2: A, B\nClass 3: A, B, C\nClass 4: A, B\nClass 5: A, B, C\nClass 6: A, B\nClass 7: A, B\nClass 8: A, B, C\nClass 9: A, B\nClass 10: A, B',
	feeHeads: 'Admission fee\nTuition fee\nExam fee\nTransport fee\nLibrary fee',
	installments: '3',
	concessions: 'Sibling discount and need-based concession — percentage set by school.',
	refunds: 'Refund only on approved withdrawal; prorated per school policy.',
	gradeBands: 'A : 90\nB : 80\nC : 70\nD : 60\nFail : 0',
	passCriteria: '40',
	rounding: 'Round half up to nearest whole mark',
	attendance: ['Present', 'Absent', 'Late', 'Approved leave'],
};

const ALL_STATUSES = ['Present', 'Absent', 'Late', 'Approved leave'];

export function SchoolSetup({ lang }: { lang: string }) {
	const L = (lang === 'ur' ? 'ur' : lang === 'ar' ? 'ar' : 'en') as Lang;
	const w = t[L];
	const [form, setForm] = useState(DEFAULTS);
	const [saved, setSaved] = useState(false);
	const set = (k: keyof typeof DEFAULTS, v: string | string[]) => {
		setForm((p) => ({ ...p, [k]: v }));
		setSaved(false);
	};

	return (
		<section className="panel" style={{ maxWidth: 900 }}>
			<div className="section-title">
				<h2>{w.heading}</h2>
				<span className="tag">{w.draft}</span>
			</div>
			<p style={{ color: '#8190a6', fontSize: 11, lineHeight: 1.9, margin: '0 0 22px' }}>{w.sub}</p>

			<SetupBlock icon={GraduationCap} title={w.identity}>
				<div className="form-grid">
					<label>{w.schoolName}<input value={form.schoolName} onChange={(e) => set('schoolName', e.target.value)} /></label>
					<label>{w.schoolCode}<input value={form.schoolCode} onChange={(e) => set('schoolCode', e.target.value)} /></label>
					<label>{w.session}<input value={form.session} onChange={(e) => set('session', e.target.value)} /></label>
					<label>{w.term}<input value={form.term} onChange={(e) => set('term', e.target.value)} /></label>
				</div>
			</SetupBlock>

			<SetupBlock icon={Layers} title={w.classes} hint={w.classesHint}>
				<label>
					<textarea rows={6} value={form.classes} onChange={(e) => set('classes', e.target.value)} />
				</label>
			</SetupBlock>

			<SetupBlock icon={Wallet} title={w.fees}>
				<label>{w.feeHeads}<textarea rows={5} value={form.feeHeads} onChange={(e) => set('feeHeads', e.target.value)} /></label>
				<div className="form-grid">
					<label>{w.installments}<input type="number" min={1} value={form.installments} onChange={(e) => set('installments', e.target.value)} /></label>
					<label>{w.concessions}<input value={form.concessions} onChange={(e) => set('concessions', e.target.value)} /></label>
				</div>
				<label>{w.refunds}<input value={form.refunds} onChange={(e) => set('refunds', e.target.value)} /></label>
			</SetupBlock>

			<SetupBlock icon={ClipboardCheck} title={w.grading}>
				<label>{w.gradeBands}<textarea rows={5} value={form.gradeBands} onChange={(e) => set('gradeBands', e.target.value)} /></label>
				<div className="form-grid">
					<label>{w.passCriteria}<input type="number" min={0} max={100} value={form.passCriteria} onChange={(e) => set('passCriteria', e.target.value)} /></label>
					<label>{w.rounding}<input value={form.rounding} onChange={(e) => set('rounding', e.target.value)} /></label>
				</div>
			</SetupBlock>

			<SetupBlock icon={CalendarCheck} title={w.attendance} hint={w.attendanceHint}>
				<div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
					{ALL_STATUSES.map((s) => {
						const on = form.attendance.includes(s);
						return (
							<button
								key={s}
								type="button"
								onClick={() => set('attendance', on ? form.attendance.filter((x) => x !== s) : [...form.attendance, s])}
								className="secondary"
								style={on ? { borderColor: 'var(--blue)', color: 'var(--blue)', background: '#eaf0ff' } : undefined}
							>
								<span style={{ width: 8, height: 8, borderRadius: '50%', background: on ? 'var(--blue)' : '#c3cbda' }} />
								{s}
							</button>
						);
					})}
				</div>
			</SetupBlock>

			<SetupBlock icon={Languages} title={w.languages} hint={w.langHint}>
				<div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
					{[['English', 'LTR'], ['اردو', 'RTL'], ['العربية', 'RTL']].map(([name, dir]) => (
						<span key={name} className="tag" style={{ fontSize: 10 }}>{name} · {dir}</span>
					))}
				</div>
			</SetupBlock>

			<div className="safety-note" style={{ marginTop: 18 }}>
				<ShieldCheck size={20} />
				<span>{w.note}</span>
			</div>

			<button className="primary" style={{ marginTop: 18, width: 'auto' }} onClick={() => setSaved(true)}>
				<Save size={16} />{w.save}
			</button>
			{saved && <p className="safety-note" style={{ marginTop: 12, color: '#378d78' }}>{w.saved}</p>}
		</section>
	);
}

function SetupBlock({ icon: Icon, title, hint, children }: { icon: typeof GraduationCap; title: string; hint?: string; children: React.ReactNode }) {
	return (
		<div style={{ borderTop: '1px solid #eff1f6', padding: '20px 0' }}>
			<div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
				<span className="quick-icon blue" style={{ width: 32, height: 32, marginBottom: 0 }}><Icon size={18} /></span>
				<strong style={{ fontSize: 12 }}>{title}</strong>
			</div>
			{hint && <small style={{ marginBottom: 10 }}>{hint}</small>}
			{children}
		</div>
	);
}
