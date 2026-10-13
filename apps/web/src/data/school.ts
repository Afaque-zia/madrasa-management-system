export const modules = ['Overview','Accounts & access','School setup','Student records','Teacher & staff','Attendance','Fees & payments','Expenses','Timetable & homework','Exams & results','Notices','Reports & audit','Release roadmap'];
export const labels: Record<string,string[]> = {
 en: modules,
 ur: ['جائزہ','اکاؤنٹس اور رسائی','اسکول کی ترتیب','طلبہ کا ریکارڈ','اساتذہ اور عملہ','حاضری','فیس اور ادائیگیاں','اخراجات','نظام الاوقات اور ہوم ورک','امتحانات اور نتائج','اطلاعات','رپورٹس اور آڈٹ','اجرا کا منصوبہ'],
 ar: ['نظرة عامة','الحسابات والصلاحيات','إعداد المدرسة','سجلات الطلاب','المعلمون والموظفون','الحضور','الرسوم والمدفوعات','المصروفات','الجدول والواجبات','الامتحانات والنتائج','الإعلانات','التقارير والتدقيق','خطة الإصدارات']
};
export type SchoolRecord = {id:string;module:string;title:string;class_name:string;status:string;amount:number;date:string;details:string;reason?:string;paid_amount?:number;reference?:string;owner?:string};
export type AppUser = { id: string; role?: string; name?: string; email?: string; assigned_class?: string } | null;

const today = (d:number)=>`2026-10-${String(d).padStart(2,'0')}`;

export const expenses: SchoolRecord[] = [['Classroom stationery','Supplies',8500],['Electricity bill','Utilities',24750],['Science lab materials','Academics',12600],['Classroom desk repairs','Maintenance',6800],['Internet connection','Utilities',5500],['Cleaning supplies','Maintenance',4200],['Sports equipment','Activities',15700],['Drinking water service','Utilities',3200],['Exam printing','Academics',9400],['Teacher workshop','Training',18000],['First aid supplies','Health',3600],['School signage','Administration',7500]].map((x,i)=>({id:`sample-exp-${i}`,module:'Expenses',title:String(x[0]),details:String(x[1]),amount:Number(x[2]),status:i===3||i===9?'Pending':'Paid',date:today(i+1),class_name:''}));

export const students: SchoolRecord[] = [
  ['Ayesha Khan','7','A',12,'Active'],['Bilal Ahmed','7','A',7,'Active'],['Hassan Raza','7','B',3,'Active'],
  ['Fatima Noor','8','A',1,'Active'],['Usman Tariq','8','A',5,'Active'],['Zainab Ali','8','B',2,'Active'],
  ['Abdullah Malik','9','A',4,'Active'],['Maryam Iqbal','9','A',6,'Promoted'],['Hamza Sheikh','6','A',8,'Active'],
  ['Sara Yousaf','6','B',1,'Withdrawn']
].map((x,i)=>({id:`sample-stu-${i}`,module:'Student records',title:String(x[0]),class_name:`Class ${x[1]} · ${x[2]}`,status:String(x[4]),date:today(i+1),amount:0,details:`Adm: ADM-${String(1001+i)} · Roll: ${x[3]} · Session: 2026 – 2027`,reason:i===8?'Withdrawal on approved request — history preserved':''}));

export const staff: SchoolRecord[] = [
  ['Sadia Anwar','Teacher','7, 8','Mathematics, Physics','Active'],['Imran Qureshi','Teacher','9','English, Urdu','Active'],
  ['Nadia Bashir','Teacher','6','Science, Biology','Active'],['Tariq Mehmood','Admin','—','Accounts, Admissions','Active'],
  ['Rabia Shahid','Teacher','7','Islamiat, Social Studies','On leave'],['Asif Kamran','Staff','—','Library, Transport','Active']
].map((x,i)=>({id:`sample-stf-${i}`,module:'Teacher & staff',title:String(x[0]),class_name:String(x[2]),status:String(x[4]),date:today(i+1),amount:0,details:`Role: ${x[1]} · Subjects: ${x[3]}`,reason:''}));

export const attendance: SchoolRecord[] = [
  ['Ayesha Khan','Class 7 · A','Present'],['Bilal Ahmed','Class 7 · A','Present'],['Hassan Raza','Class 7 · B','Late'],
  ['Ayesha Khan','Class 7 · A','Absent'],['Bilal Ahmed','Class 7 · A','Present'],['Fatima Noor','Class 8 · A','Present'],
  ['Usman Tariq','Class 8 · A','Approved leave'],['Zainab Ali','Class 8 · B','Present'],['Abdullah Malik','Class 9 · A','Late'],
  ['Maryam Iqbal','Class 9 · A','Present']
].map((x,i)=>({id:`sample-att-${i}`,module:'Attendance',title:String(x[0]),class_name:String(x[1]),status:String(x[2]),date:today((i%5)+1),amount:0,details:'',reason:i===3?'Corrected by admin — student arrived late, marked Late then Absent':''}));

export const fees: SchoolRecord[] = [
  ['Tuition fee','Ayesha Khan','ADM-1001',12000,12000,'Paid','INV-2001','Online · TRX-8841'],
  ['Tuition fee','Bilal Ahmed','ADM-1002',12000,6000,'Partial','INV-2002','Cash · partial'],
  ['Admission fee','Hassan Raza','ADM-1003',25000,25000,'Verified','INV-2003','Online · TRX-8842'],
  ['Tuition fee','Fatima Noor','ADM-1004',12000,0,'Pending','INV-2004',''],
  ['Exam fee','Usman Tariq','ADM-1005',3500,3500,'Paid','INV-2005','Cash · full'],
  ['Transport fee','Zainab Ali','ADM-1006',4000,2000,'Partial','INV-2006','Online · partial'],
  ['Tuition fee','Abdullah Malik','ADM-1007',12000,12000,'Verified','INV-2007','Online · TRX-8843'],
  ['Library fee','Maryam Iqbal','ADM-1008',1500,0,'Pending','INV-2008','']
].map((x,i)=>({id:`sample-fee-${i}`,module:'Fees & payments',title:String(x[0]),class_name:String(x[1]),details:String(x[2]),amount:Number(x[3]),paid_amount:Number(x[4]),status:String(x[5]),date:today(i+1),reason:i===1?'Concession approved — sibling discount applied':'',reference:String(x[7])}));

export const notices: SchoolRecord[] = [
  ['Mid-Term Exams — 27 October','All','Published','Examination schedule for Classes 6–9 begins Monday 27 October. Students must bring admit cards.'],
  ['Parent-Teacher Meeting','All','Published','PTM for all classes on Saturday 25 October, 9:00 AM – 1:00 PM.'],
  ['Winter Timetable Notice','Students','Published','Assembly moves to 8:15 AM from 1 November. Library open till 4 PM.'],
  ['Staff Meeting — Academic Review','Teachers','Published','Head of schools review of homework compliance and marks-entry progress.'],
] .map((x,i)=>({id:`sample-not-${i}`,module:'Notices',title:String(x[0]),class_name:'',status:String(x[2]),date:today(i+2),amount:0,details:JSON.stringify({audience:String(x[1]),cls:'',message:String(x[3])}),reason:''}));

export const timetables: SchoolRecord[] = [['Class 7 · A'],['Class 8 · A']].map((c,i)=>({id:`sample-tt-${i}`,module:'Timetable & homework',title:`${c[0]} timetable`,class_name:c[0],status:'Active',date:today(3),amount:0,details:JSON.stringify({Monday:{P1:{subject:'Mathematics',teacher:'Sadia Anwar'},P2:{subject:'English',teacher:'Imran Qureshi'},P3:{subject:'Urdu',teacher:'Imran Qureshi'}},Tuesday:{P1:{subject:'Science',teacher:i===0?'Nadia Bashir':'Sadia Anwar'},P2:{subject:'Islamiat',teacher:'Rabia Shahid'}}}),reason:''}));

export const homework: SchoolRecord[] = [
  ['Algebra worksheet — ch.4','Class 7 · A','Mathematics','2026-10-18',20,'Active','Solve exercises 4.1 to 4.5 completely.'],
  ['Essay: My School','Class 8 · A','English','2026-10-15',15,'Active','250 words, neat handwriting.'],
].map((x,i)=>({id:`sample-hw-${i}`,module:'Timetable & homework',title:String(x[0]),class_name:String(x[1]),status:String(x[5]),date:today(10+i),amount:Number(x[4]),details:JSON.stringify({subject:String(x[2]),due:String(x[3]),marks:Number(x[4]),submitted:[],instructions:String(x[6])}),reason:''}));

export const exams: SchoolRecord[] = [{id:'sample-exm-0',module:'Exams & results',title:'Mid-Term 2026',class_name:'',status:'Published',date:today(20),amount:0,details:JSON.stringify({session:'2026 – 2027',subjects:[{subject:'Mathematics',max:75},{subject:'English',max:75},{subject:'Urdu',max:75},{subject:'Science',max:50}]}),reason:'Exam set up by admin'}];

export const marksSheets: SchoolRecord[] = [
  ['Class 7 · A',{12:{Mathematics:62,English:55,Urdu:68,Science:38},7:{Mathematics:48,English:60,Urdu:52,Science:30}}],
  ['Class 8 · A',{1:{Mathematics:70,English:66,Urdu:60,Science:45},5:{Mathematics:55,English:40,Urdu:58,Science:null}}],
].map((x,i)=>({id:`sample-mrk-${i}`,module:'Exams & results',title:String(x[0]),class_name:String(x[0]),status:'Published',date:today(27),amount:0,details:JSON.stringify({exam:'sample-exm-0',entries:Object.entries(x[1] as Record<string,Record<string,number|null>>).map(([roll,marks])=>({roll:Number(roll),marks}))}),reason:'Marks published after review'}));

export const sampleRecords: SchoolRecord[] = [...expenses, ...students, ...staff, ...attendance, ...fees, ...notices, ...timetables, ...homework, ...exams, ...marksSheets];

export const workflows: Record<string,string[]> = {
 'Accounts & access':['Closed school accounts','Admin / Teacher / Student','Assigned classes and own records','Password reset'],
 'School setup':['Academic session','Classes and sections','School-approved policy','Finalize school identity'],
 'Student records':['Admit','Allocate session, class and roll number','Manage','Assess','Promote / transfer / withdraw — preserve history'],
 'Teacher & staff':['Staff profile','Assign classes','Assign subjects','Review permissions'],
 Attendance:['Choose class & date','Present / Absent / Late / Approved leave','Save with confirmation','Monthly report / correction reason'],
 'Fees & payments':['Plan fee heads and installments','Invoice student and due date','Verified online / authorized offline payment','Receipt and remaining balance'],
 Expenses:['Record expense','Review category and amount','Approve','Paid / Pending'],
 'Timetable & homework':['Class timetable','Assigned teacher publishes homework','Student submission','Teacher review'],
 'Exams & results':['Set up subjects and max marks','Assigned marks entry','Authorized review','Publish own-student results'],
 Notices:['Draft announcement','Choose audience','Publish','Notice history'],
 'Reports & audit':['Filter session, date, class and status','Reconcile saved totals','Export approved reports','Who, when and why']
};
export const decisions = ['School name, classes, sections and user volume','Fee heads, installments, concessions, refunds and payment provider','Grade bands, pass criteria, absent rules and rounding','Attendance correction approvals and notifications','Android devices and mobile feature list','Approved Urdu, Arabic and English terminology','Data migration, backups, restore testing, support and ownership'];
