/// <reference path="../pb_data/types.d.ts" />

// Release 2 (Academics): seed timetable, homework, notices and exam/marks sample
// rows so the new modules open with realistic data, matching the web demo dataset.
migrate(
  (app) => {
    const records = app.findCollectionByNameOrId('school_records');
    const add = (module, title, class_name, status, date, amount, details, reason) => {
      const r = new Record(records);
      r.set('module', module); r.set('title', title); r.set('class_name', class_name);
      r.set('status', status); r.set('date', date); r.set('amount', amount);
      r.set('details', JSON.stringify(details)); r.set('reason', reason);
      app.save(r);
    };
    add('Notices', 'Mid-Term Exams — 27 October', '', 'Published', '2026-10-02', 0,
      { audience: 'All', cls: '', message: 'Examination schedule for Classes 6–9 begins Monday 27 October. Students must bring admit cards.' }, '');
    add('Notices', 'Parent-Teacher Meeting', '', 'Published', '2026-10-03', 0,
      { audience: 'All', cls: '', message: 'PTM for all classes on Saturday 25 October, 9:00 AM – 1:00 PM.' }, '');
    add('Notices', 'Winter Timetable Notice', '', 'Published', '2026-10-04', 0,
      { audience: 'Students', cls: '', message: 'Assembly moves to 8:15 AM from 1 November. Library open till 4 PM.' }, '');
    add('Notices', 'Staff Meeting — Academic Review', '', 'Published', '2026-10-05', 0,
      { audience: 'Teachers', cls: '', message: 'Review of homework compliance and marks-entry progress.' }, '');

    add('Timetable & homework', 'Class 7 · A timetable', 'Class 7 · A', 'Active', '2026-10-03', 0,
      { Monday: { P1: { subject: 'Mathematics', teacher: 'Sadia Anwar' }, P2: { subject: 'English', teacher: 'Imran Qureshi' }, P3: { subject: 'Urdu', teacher: 'Imran Qureshi' } },
        Tuesday: { P1: { subject: 'Science', teacher: 'Nadia Bashir' }, P2: { subject: 'Islamiat', teacher: 'Rabia Shahid' } } }, '');
    add('Timetable & homework', 'Class 8 · A timetable', 'Class 8 · A', 'Active', '2026-10-03', 0,
      { Monday: { P1: { subject: 'Mathematics', teacher: 'Sadia Anwar' }, P2: { subject: 'English', teacher: 'Imran Qureshi' } },
        Tuesday: { P1: { subject: 'Science', teacher: 'Nadia Bashir' } } }, '');

    add('Timetable & homework', 'Algebra worksheet — ch.4', 'Class 7 · A', 'Active', '2026-10-10', 20,
      { subject: 'Mathematics', due: '2026-10-18', marks: 20, submitted: [], instructions: 'Solve exercises 4.1 to 4.5 completely.' }, '');
    add('Timetable & homework', 'Essay: My School', 'Class 8 · A', 'Active', '2026-10-11', 15,
      { subject: 'English', due: '2026-10-15', marks: 15, submitted: [], instructions: '250 words, neat handwriting.' }, '');

    // Exam setup + published marks sheets (ids captured so the sheets can link them).
    const exam = new Record(records);
    exam.set('module', 'Exams & results'); exam.set('title', 'Mid-Term 2026'); exam.set('class_name', '');
    exam.set('status', 'Published'); exam.set('date', '2026-10-20'); exam.set('amount', 0);
    exam.set('details', JSON.stringify({ session: '2026 – 2027', subjects: [{ subject: 'Mathematics', max: 75 }, { subject: 'English', max: 75 }, { subject: 'Urdu', max: 75 }, { subject: 'Science', max: 50 }] }));
    exam.set('reason', 'Exam set up by admin'); app.save(exam);

    const sheet = (cls, entries) => {
      const r = new Record(records);
      r.set('module', 'Exams & results'); r.set('title', cls); r.set('class_name', cls);
      r.set('status', 'Published'); r.set('date', '2026-10-27'); r.set('amount', 0);
      r.set('details', JSON.stringify({ exam: exam.id, entries }));
      r.set('reason', 'Marks published after review'); app.save(r);
    };
    sheet('Class 7 · A', [
      { roll: 12, marks: { Mathematics: 62, English: 55, Urdu: 68, Science: 38 } },
      { roll: 7, marks: { Mathematics: 48, English: 60, Urdu: 52, Science: 30 } },
    ]);
    sheet('Class 8 · A', [
      { roll: 1, marks: { Mathematics: 70, English: 66, Urdu: 60, Science: 45 } },
      { roll: 5, marks: { Mathematics: 55, English: 40, Urdu: 58, Science: null } },
    ]);
  },
  (app) => {
    const records = app.findCollectionByNameOrId('school_records');
    app.deleteRecords(records, "(module = 'Notices') || ((module = 'Timetable & homework' || module = 'Exams & results') && created < '2026-10-13 23:59:59Z')");
  },
);
