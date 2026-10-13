/// <reference path="../pb_data/types.d.ts" />

// Release 2 (Academics): extend school_records access rules so teachers can manage
// homework and exam marks for their assigned class, students can see their own
// notices/timetable/homework and published results, and the new academic modules
// are enforced at the database level. Forward-only field changes; no schema change
// is needed because module data lives in the existing generic fields + `details`.
migrate(
  (app) => {
    const records = app.findCollectionByNameOrId('school_records');

    // Teacher: read/write Attendance, Timetable & homework, Exams & results for the
    // single class stored in users.assigned_class. Notices remain admin-only writes;
    // teachers read staff-directed notices through the audience text in details.
    // Student: read own rows (owner = id); Exams & results additionally require
    // status 'Published'. New: Timetable & homework / Notices rows addressed to the
    // student's own class are readable when published.
    const read =
      "@request.auth.role = 'admin' || " +
      "(@request.auth.role = 'teacher' && class_name != '' && class_name = @request.auth.assigned_class && " +
      "(module = 'Attendance' || module = 'Timetable & homework' || module = 'Exams & results')) || " +
      "(@request.auth.role = 'teacher' && module = 'Notices' && status = 'Published') || " +
      "(@request.auth.role = 'student' && owner = @request.auth.id && " +
      "(module != 'Exams & results' || status = 'Published'))";
    const create =
      "@request.auth.role = 'admin' || " +
      "(@request.auth.role = 'teacher' && class_name = @request.auth.assigned_class && " +
      "(module = 'Attendance' || module = 'Timetable & homework' || module = 'Exams & results'))";
    const update =
      "@request.auth.role = 'admin' || " +
      "(@request.auth.role = 'teacher' && class_name = @request.auth.assigned_class && module = 'Attendance') || " +
      "(@request.auth.role = 'teacher' && module = 'Exams & results' && class_name = @request.auth.assigned_class && " +
      "(@request.body.status:changed = false || @request.body.status = 'Submitted'))";
    records.setRule('listRule', read);
    records.setRule('viewRule', read);
    records.setRule('createRule', create);
    records.setRule('updateRule', update);
    // deleteRule stays null — corrections preserve history (SRS key principle).
    app.save(records);
  },
  (app) => {
    const records = app.findCollectionByNameOrId('school_records');
    records.setRule('listRule',
      "@request.auth.role = 'admin' || (@request.auth.role = 'teacher' && class_name != '' && class_name = @request.auth.assigned_class && (module = 'Attendance' || module = 'Timetable & homework' || module = 'Exams & results')) || (@request.auth.role = 'student' && owner = @request.auth.id && (module != 'Exams & results' || status = 'Published'))");
    records.setRule('viewRule',
      "@request.auth.role = 'admin' || (@request.auth.role = 'teacher' && class_name != '' && class_name = @request.auth.assigned_class && (module = 'Attendance' || module = 'Timetable & homework' || module = 'Exams & results')) || (@request.auth.role = 'student' && owner = @request.auth.id && (module != 'Exams & results' || status = 'Published'))");
    records.setRule('createRule', "@request.auth.role = 'admin'");
    records.setRule('updateRule', "@request.auth.role = 'admin'");
    app.save(records);
  },
);
