migrate((app) => {
  const users = app.findCollectionByNameOrId('users');
  users.fields.add(new SelectField({name:'role',values:['admin','teacher','student'],maxSelect:1}));
  users.fields.add(new TextField({name:'assigned_class'}));
  users.createRule = "@request.auth.role = 'admin'";
  users.updateRule = "@request.auth.role = 'admin' || (id = @request.auth.id && @request.body.role:changed = false && @request.body.assigned_class:changed = false)";
  users.listRule = "id = @request.auth.id || @request.auth.role = 'admin'";
  app.save(users);
  const read = "@request.auth.role = 'admin' || (@request.auth.role = 'teacher' && class_name != '' && class_name = @request.auth.assigned_class && (module = 'Attendance' || module = 'Timetable & homework' || module = 'Exams & results')) || (@request.auth.role = 'student' && owner = @request.auth.id && (module != 'Exams & results' || status = 'Published'))";
  const records = new Collection({name:'school_records',type:'base',listRule:read,viewRule:read,createRule:"@request.auth.role = 'admin'",updateRule:"@request.auth.role = 'admin'",deleteRule:null,fields:[
    {name:'module',type:'text',required:true},{name:'title',type:'text',required:true},{name:'class_name',type:'text'},{name:'status',type:'text'},{name:'amount',type:'number',min:0},{name:'date',type:'text'},{name:'details',type:'text'},{name:'reason',type:'text'},{name:'owner',type:'relation',collectionId:users.id,maxSelect:1},{name:'created',type:'autodate',onCreate:true},{name:'updated',type:'autodate',onCreate:true,onUpdate:true}
  ]}); app.save(records);
  const audit = new Collection({name:'school_audit',type:'base',listRule:"@request.auth.role = 'admin'",viewRule:"@request.auth.role = 'admin'",createRule:null,updateRule:null,deleteRule:null,fields:[{name:'actor',type:'text'},{name:'action',type:'text'},{name:'record_id',type:'text'},{name:'reason',type:'text'},{name:'snapshot',type:'json'},{name:'created',type:'autodate',onCreate:true}]}); app.save(audit);
  const expenses = [['Classroom stationery','Supplies',8500],['Electricity bill','Utilities',24750],['Science lab materials','Academics',12600],['Classroom desk repairs','Maintenance',6800],['Internet connection','Utilities',5500],['Cleaning supplies','Maintenance',4200],['Sports equipment','Activities',15700],['Drinking water service','Utilities',3200],['Exam printing','Academics',9400],['Teacher workshop','Training',18000],['First aid supplies','Health',3600],['School signage','Administration',7500]];
  expenses.forEach((x,i)=>{const r=new Record(records);r.set('module','Expenses');r.set('title',x[0]);r.set('details',x[1]);r.set('amount',x[2]);r.set('status',i===3||i===9?'Pending':'Paid');r.set('date','2026-10-'+String(i+1).padStart(2,'0'));app.save(r);});
}, (app) => {app.delete(app.findCollectionByNameOrId('school_audit'));app.delete(app.findCollectionByNameOrId('school_records'));});
