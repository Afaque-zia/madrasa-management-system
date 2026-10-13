import { useEffect, useMemo, useState } from 'react';
import { Bell, Megaphone, Plus, X } from 'lucide-react';
import { pocketbaseClient as pb } from '@/lib/pocketbase-client';
import type { AppUser, SchoolRecord } from '@/data/school';
import { AUDIENCES, noticeVisible, parseJson, type NoticeDetails } from '@/lib/academics';

const L = {
  en: { heading: 'Notices', sub: 'Announcements published by the administration.', add: 'New notice', audience: 'Audience', classFor: 'Class', title: 'Notice title', body: 'Message', date: 'Date', publish: 'Publish notice', draft: 'Draft', published: 'Published', none: 'No notices yet.', sign: 'Sign in to view notices.', hist: 'Notice history', all: 'All school', teachersOnly: 'Teachers', studentsOnly: 'Students', classOnly: 'One class', unread: 'Unread', markRead: 'Mark read' },
  ur: { heading: 'اطلاعات', sub: 'انتظامیہ کی جانب سے شائع کردہ اعلانات۔', add: 'نئی اطلاع', audience: 'سامعین', classFor: 'جماعت', title: 'اطلاع کا عنوان', body: 'پیغام', date: 'تاریخ', publish: 'اطلاع شائع کریں', draft: 'مسودہ', published: 'شائع شدہ', none: 'ابھی کوئی اطلاع نہیں۔', sign: 'اطلاعات دیکھنے کے لیے لاگ ان کریں۔', hist: 'اطلاعات کی تاریخ', all: 'تمام اسکول', teachersOnly: 'اساتذہ', studentsOnly: 'طلبہ', classOnly: 'ایک جماعت', unread: 'ن پڑھی ہوئی', markRead: 'پڑھا ہوا نشان زد کریں' },
  ar: { heading: 'الإعلانات', sub: 'إعلانات صادرة عن الإدارة.', add: 'إعلان جديد', audience: 'الجمهور', classFor: 'الفصل', title: 'عنوان الإعلان', body: 'الرسالة', date: 'التاريخ', publish: 'نشر الإعلان', draft: 'مسودة', published: 'منشور', none: 'لا توجد إعلانات بعد.', sign: 'سجل الدخول لعرض الإعلانات.', hist: 'سجل الإعلانات', all: 'المدرسة كلها', teachersOnly: 'المعلمون', studentsOnly: 'الطلاب', classOnly: 'فصل واحد', unread: 'غير مقروء', markRead: 'تحديد كمقروء' },
};
const AUD_LABEL: Record<string, Record<string, string>> = {
  All: { ur: 'تمام اسکول', ar: 'المدرسة كلها' },
  Teachers: { ur: 'اساتذہ', ar: 'المعلمون' },
  Students: { ur: 'طلبہ', ar: 'الطلاب' },
  Class: { ur: 'ایک جماعت', ar: 'فصل واحد' },
};

export function Notices({ rows, lang, user, addTrigger, onMutate, onError }: { rows: SchoolRecord[]; lang: string; loading?: boolean; user: AppUser; addTrigger: number; onMutate: () => void; onError: (m: string) => void }) {
  const w = L[lang === 'ur' ? 'ur' : lang === 'ar' ? 'ar' : 'en'];
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [audience, setAudience] = useState('All');
  const role = user?.role ?? undefined;
  const cls = user?.assigned_class || undefined;
  const seenKey = `notices-seen-${user?.id ?? 'anon'}`;
  const [seen, setSeen] = useState<string[]>(() => { try { return JSON.parse(localStorage.getItem(seenKey) || '[]'); } catch { return []; } });

  useEffect(() => { if (addTrigger > 0 && user?.role === 'admin') setOpen(true); /* eslint-disable-next-line */ }, [addTrigger]);

  const visible = useMemo(
    () => rows.filter((r) => r.status === 'Published' && noticeVisible(parseJson<NoticeDetails>(r.details, { audience: 'All' }), role, cls)),
    [rows, role, cls],
  );
  const unreadCount = visible.filter((r) => !seen.includes(r.id)).length;

  async function publish(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    const f = new FormData(e.currentTarget);
    const body = String(f.get('body') || '').trim();
    const title = String(f.get('title') || '').trim();
    const chosen = String(f.get('audience') || 'All');
    if (!title || !body) { setBusy(false); onError(lang === 'en' ? 'Title and message are required.' : 'ناکام۔'); return; }
    if (chosen === 'Class' && !String(f.get('class_name'))) { setBusy(false); onError(lang === 'en' ? 'Choose the target class.' : 'ناکام۔'); return; }
    try {
      await pb.collection('school_records').create({
        module: 'Notices', title,
        details: JSON.stringify({ audience: chosen, cls: String(f.get('class_name') || ''), message: body }),
        class_name: chosen === 'Class' ? String(f.get('class_name')) : '', date: String(f.get('date')), status: 'Published', amount: 0,
        reason: lang === 'en' ? `Notice published by ${String(user?.email ?? 'admin')} for audience: ${chosen}` : 'اشاعتِ اطلاع',
        owner: (pb.authStore.record as { id?: string } | null)?.id,
      });
      onMutate(); setOpen(false);
    } catch { onError(lang === 'en' ? 'Notice could not be published. Check permissions.' : 'ناکام۔'); }
    finally { setBusy(false); }
  }

  function markAllRead() {
    const ids = visible.map((r) => r.id);
    setSeen(ids);
    try { localStorage.setItem(seenKey, JSON.stringify(ids)); } catch { /* private mode */ }
  }

  const badge = (s: string) => (s === 'Published' ? w.published : w.draft);

  return (
    <section className="panel">
      <div className="section-title"><h2>{w.heading}</h2><span>{visible.length} · {unreadCount} {w.unread}</span></div>
      <div className="safety-note"><Megaphone size={18} /><span>{w.sub}</span></div>
      {!user && <div className="empty-state"><Bell size={35} /><h3>{w.sign}</h3></div>}
      {user && (
        <>
          <div style={{ display: 'flex', gap: 10, marginTop: 14 }}>
            {unreadCount > 0 && <button className="secondary" onClick={markAllRead}>{w.markRead}</button>}
          </div>
          <h3 style={{ marginTop: 20 }}>{w.hist}</h3>
          {!visible.length ? <div className="empty-state"><Bell size={35} /><h3>{w.none}</h3></div> : (
            <div className="notice-list">
              {visible.map((r) => {
                const d = parseJson<NoticeDetails>(r.details, { audience: 'All' });
                const isUnread = !seen.includes(r.id);
                return (
                  <article key={r.id} className={'notice-card' + (isUnread ? ' unread' : '')}>
                    <div className="notice-head">
                      <span className="record-icon"><Bell size={16} /></span>
                      <strong>{r.title}</strong>
                      <span className="tag">{AUD_LABEL[d.audience]?.[lang] || d.audience}{d.audience === 'Class' && d.cls ? ` · ${d.cls}` : ''}</span>
                      <span className="status-badge paid"><i />{badge(r.status)}</span>
                    </div>
                    <p className="notice-body">{noticeBody(r)}</p>
                    <small>{r.date}{isUnread ? ` · ${w.unread}` : ''}</small>
                  </article>
                );
              })}
            </div>
          )}
        </>
      )}
      {role === 'admin' && <button className="primary" style={{ marginTop: 16, width: 'auto' }} onClick={() => setOpen(true)}><Plus size={16} />{w.add}</button>}
      {open && (
        <div className="modal-backdrop"><section role="dialog" aria-modal="true" className="modal">
          <button className="modal-close" aria-label="Close" onClick={() => setOpen(false)}><X /></button>
          <h2>{w.add}</h2>
          <form onSubmit={publish}>
            <label>{w.title}<input name="title" required maxLength={120} /></label>
            <label>{w.body}<textarea name="body" required maxLength={1000} /></label>
            <div className="form-grid">
              <label>{w.audience}<select name="audience" value={audience} onChange={(e) => setAudience(e.target.value)}>{AUDIENCES.map((a) => <option key={a} value={a}>{AUD_LABEL[a]?.[lang] || a}</option>)}</select></label>
              <label>{w.date}<input type="date" name="date" required defaultValue="2026-10-13" /></label>
            </div>
            {audience === 'Class' && (
              <label>{w.classFor}<select name="class_name" required>{Array.from(new Set(rows.map((r) => r.class_name).filter(Boolean))).map((c) => <option key={c}>{c}</option>)}</select></label>
            )}
            <button className="primary" disabled={busy}>{busy ? '…' : w.publish}</button>
          </form>
        </section></div>
      )}
    </section>
  );
}

/** Notice message text is stored inside details JSON under a `message` key so the
 *  record stays language-neutral and audience meta travels with it. */
function noticeBody(r: SchoolRecord): string {
  const d = parseJson<{ message?: string }>(r.details, {});
  return d.message || '';
}
