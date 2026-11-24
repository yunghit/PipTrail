import { useEffect, useState } from 'react'
import { onAuthStateChanged, signInWithEmailAndPassword, signOut, User } from 'firebase/auth'
import { collection, doc, getDoc, onSnapshot, setDoc, updateDoc, deleteDoc } from 'firebase/firestore'
import { auth, db } from './firebase'
import { Lesson, Template } from '@piptrail/shared'

function useCol<T>(p: string) { const [d, s] = useState<T[]>([]); useEffect(() => onSnapshot(collection(db, p), x => s(x.docs.map(y => ({ id: y.id, ...y.data() }) as T))), [p]); return d }
export default function App() {
  const [u, setU] = useState<User | null | undefined>(undefined), [ok, setOk] = useState<boolean | null>(null)
  const [e, setE] = useState(''), [p, setP] = useState(''), [err, setErr] = useState('')
  useEffect(() => onAuthStateChanged(auth, async x => { setU(x); setOk(x && x.emailVerified ? (await getDoc(doc(db, 'admins', x.uid)).catch(() => null))?.exists() ?? false : x ? false : null) }), [])
  if (u === undefined) return <div className="w">Loading…</div>
  if (!u) return <div className="w"><div className="c"><h2>PipTrail Admin</h2><input placeholder="Email" value={e} onChange={x => setE(x.target.value)} /><br /><br /><input type="password" placeholder="Password" value={p} onChange={x => setP(x.target.value)} /><br /><br />
    <button onClick={() => signInWithEmailAndPassword(auth, e, p).catch(x => setErr(x.message))}>Sign in</button><p className="neg">{err}</p></div></div>
  if (!ok) return <div className="w"><div className="c">This account is not an admin (or its email is not verified). <button className="alt" onClick={() => signOut(auth)}>Sign out</button></div></div>
  return <Panel />
}
function Panel() {
  const lessons = useCol<Lesson>('lessons'), tpls = useCol<Template>('templates')
  const [l, setL] = useState({ title: '', cat: '', body: '' }), [t, setT] = useState({ name: '', fields: '', checks: '' })
  const anns = useCol<{ id: string; text: string; ts: number }>('announcements'), [an, setAn] = useState('')
  const [pt, setPt] = useState(''), [pb, setPb] = useState(''), [pm, setPm] = useState('')
  const send = async () => { setPm('Sending…'); const t = await auth.currentUser!.getIdToken(); const r = await fetch(import.meta.env.VITE_PUSH_URL + '/broadcast', { method: 'POST', headers: { 'content-type': 'application/json', authorization: 'Bearer ' + t }, body: JSON.stringify({ title: pt, body: pb }) }); const j = await r.json().catch(() => ({})); setPm(r.ok ? `Sent to ${j.sent} devices` : j.error || 'Failed') }
  const pays = useCol<{ id: string; uid: string; ref: string; note: string; plan: string; status: string; ts: number }>('payments'), [bp, setBp] = useState(''), [bt, setBt] = useState(''), [gu, setGu] = useState('')
  const pros = useCol<{ id: string; until: number }>('pro'), fbs = useCol<{ id: string; text: string; ts: number; app: string }>('feedback')
  const DAYS: Record<string, number> = { '1 month': 30, '3 months': 90, '12 months': 365 }
  const grant = async (uid: string, days: number) => { const cur = Number((await getDoc(doc(db, 'pro', uid))).data()?.until || 0); await setDoc(doc(db, 'pro', uid), { until: Math.max(Date.now(), cur) + days * 864e5, plan: 'pro' }) }
  const approve = async (p: { id: string; uid: string; plan: string }) => { await grant(p.uid, DAYS[p.plan] || 30); await updateDoc(doc(db, 'payments', p.id), { status: 'approved' }) }
  const ln = (s: string) => s.split('\n').map(x => x.trim()).filter(Boolean)
  return <div className="w"><div className="row"><b>PipTrail Admin</b><button className="alt" onClick={() => signOut(auth)}>Sign out</button></div><br />
    <div className="c"><h3>Add lesson (visible to all users)</h3><input placeholder="Title" value={l.title} onChange={e => setL({ ...l, title: e.target.value })} /><br /><br /><input placeholder="Category" value={l.cat} onChange={e => setL({ ...l, cat: e.target.value })} /><br /><br />
      <textarea placeholder="Body" value={l.body} onChange={e => setL({ ...l, body: e.target.value })} /><br /><br />
      <button disabled={!l.title || !l.body} onClick={async () => { await setDoc(doc(db, 'lessons/l' + Date.now()), { ...l, ts: Date.now() }); setL({ title: '', cat: '', body: '' }) }}>Publish lesson</button>
      {lessons.map(x => <div key={x.id} className="row" style={{ padding: '6px 0' }}><span>{x.title}</span><button className="alt" onClick={() => deleteDoc(doc(db, 'lessons', x.id))}>Delete</button></div>)}</div>
    <div className="c"><h3>New tracking template</h3><input placeholder="Name" value={t.name} onChange={e => setT({ ...t, name: e.target.value })} /><br /><br />
      <textarea placeholder="Extra trade fields, one per line" value={t.fields} onChange={e => setT({ ...t, fields: e.target.value })} /><br /><br />
      <textarea placeholder="Pre-trade checklist, one per line" value={t.checks} onChange={e => setT({ ...t, checks: e.target.value })} /><br /><br />
      <button disabled={!t.name} onClick={async () => { await setDoc(doc(db, 'templates/p' + Date.now()), { name: t.name, fields: ln(t.fields), checks: ln(t.checks), ts: Date.now() }); setT({ name: '', fields: '', checks: '' }) }}>Save template</button>
      {tpls.map(x => <div key={x.id} className="row" style={{ padding: '6px 0' }}><span>{x.name}</span><button className="alt" onClick={() => deleteDoc(doc(db, 'templates', x.id))}>Delete</button></div>)}</div>
    <div className="c"><h3>Announcement (shown on every user's Desk)</h3><input placeholder="Message" maxLength={200} value={an} onChange={e => setAn(e.target.value)} /><br /><br /><button disabled={!an} onClick={async () => { await setDoc(doc(db, 'announcements/a' + Date.now()), { text: an, ts: Date.now() }); setAn('') }}>Post</button>{anns.map(x => <div key={x.id} className="row" style={{ padding: '6px 0' }}><span>{x.text}</span><button className="alt" onClick={() => deleteDoc(doc(db, 'announcements', x.id))}>Delete</button></div>)}</div>
    <div className="c"><h3>Push notification (all app installs)</h3><input placeholder="Title" maxLength={80} value={pt} onChange={e => setPt(e.target.value)} /><br /><br /><input placeholder="Message" maxLength={200} value={pb} onChange={e => setPb(e.target.value)} /><br /><br /><button disabled={!pt || !pb} onClick={send}>Send push</button><p className="mu">{pm}</p></div>
    <div className="c"><h3>Billing page (users see this on Upgrade)</h3><input placeholder="Price label, e.g. P60 / month" value={bp} onChange={e => setBp(e.target.value)} /><br /><br /><textarea placeholder="Instructions, e.g. Send to Orange Money 7X XXX XXX, use your reference" value={bt} onChange={e => setBt(e.target.value)} /><br /><br /><button disabled={!bt} onClick={() => setDoc(doc(db, 'config/billing'), { price: bp, text: bt })}>Save billing info</button></div>
    <div className="c"><h3>Payment requests ({pays.filter(p => p.status === 'pending').length} pending)</h3>{[...pays].sort((a, b) => b.ts - a.ts).map(p => <div key={p.id} className="row" style={{ padding: '6px 0' }}><span>{p.ref} · {p.plan} · {p.note} · {new Date(p.ts).toLocaleDateString()} · <b>{p.status}</b></span>{p.status === 'pending' && <button className="alt" onClick={() => approve(p)}>Approve → Pro</button>}</div>)}</div>
    <div className="c"><h3>Grant Pro manually</h3><input placeholder="User UID (from Firebase Authentication)" value={gu} onChange={e => setGu(e.target.value)} /><br /><br /><button className="alt" disabled={!gu} onClick={() => grant(gu.trim(), 30).then(() => setGu(''))}>Grant 30 days</button></div>
    <div className="c"><h3>Pro members ({pros.filter(p => p.until > Date.now()).length} active)</h3>{[...pros].sort((a, b) => b.until - a.until).map(p => <div key={p.id} className="row" style={{ padding: '6px 0' }}><span style={{ wordBreak: 'break-all' }}>{p.id.slice(0, 8)}… · {p.until > Date.now() ? 'until ' + new Date(p.until).toLocaleDateString() : 'expired'}</span><span><button className="alt" onClick={() => grant(p.id, 30)}>+30d</button> <button className="alt" onClick={() => confirm('Revoke Pro?') && deleteDoc(doc(db, 'pro', p.id))}>Revoke</button></span></div>)}{!pros.length && <p className="mu">No Pro members yet.</p>}</div>
    <div className="c"><h3>User feedback ({fbs.length})</h3>{[...fbs].sort((a, b) => b.ts - a.ts).map(f => <div key={f.id} style={{ padding: '6px 0', borderTop: '1px solid var(--bd)' }}><div className="row"><span className="mu">{new Date(f.ts).toLocaleDateString()} · {f.app}</span><button className="alt" onClick={() => deleteDoc(doc(db, 'feedback', f.id))}>Delete</button></div><div style={{ whiteSpace: 'pre-wrap' }}>{f.text}</div></div>)}{!fbs.length && <p className="mu">No feedback yet.</p>}</div></div>
}
