onRecordCreateRequest((e) => {
 const actor = e.auth;
 if (!e.record.getString('reason').trim()) throw new BadRequestError('An approval reference or reason is required.');
 e.next();
 const audit = new Record($app.findCollectionByNameOrId('school_audit'));
 audit.set('actor', actor ? actor.getString('email') : 'System');
 audit.set('action', 'Created ' + e.record.getString('module') + ': ' + e.record.getString('title'));
 audit.set('record_id', e.record.id);
 audit.set('reason', e.record.getString('reason'));
 audit.set('snapshot', {title:e.record.getString('title'),status:e.record.getString('status'),amount:e.record.getFloat('amount')});
 $app.save(audit);
}, 'school_records');
onRecordUpdateRequest((e) => {
 const actor = e.auth;
 const previous = e.record.original();
 if (!e.record.getString('reason').trim() || e.record.getString('reason') === previous.getString('reason')) throw new BadRequestError('A new correction reason is required.');
 e.next();
 const audit = new Record($app.findCollectionByNameOrId('school_audit'));
 audit.set('actor', actor ? actor.getString('email') : 'System');
 audit.set('action', 'Corrected ' + e.record.getString('module') + ': ' + e.record.getString('title'));
 audit.set('record_id', e.record.id);
 audit.set('reason', e.record.getString('reason'));
 audit.set('snapshot', {before:{title:previous.getString('title'),status:previous.getString('status'),amount:previous.getFloat('amount')},after:{title:e.record.getString('title'),status:e.record.getString('status'),amount:e.record.getFloat('amount')}});
 $app.save(audit);
}, 'school_records');
