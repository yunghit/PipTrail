import { useEffect, useState } from 'react'
import { collection, deleteDoc, doc, getDoc, getDocs, onSnapshot, setDoc, updateDoc } from 'firebase/firestore'
import { User } from 'firebase/auth'
import { Copy, Megaphone, Trash2, GraduationCap } from 'lucide-react'
import { db } from './firebase'
import { Trade, gameStats, discipline, expectancy, tilt, localDate } from '@piptrail/shared'
const newCode = () => Array.from(crypto.getRandomValues(new Uint8Array(12)), b => 'abcdefghjkmnpqrstuvwxyz23456789'[b % 31]).join('')
const money = (n: number) => (n < 0 ? '-' : '') + '$' + Math.abs(n).toFixed(2)
const DAY = 864e5
function summary(trades: Trade[], hasPlan: boolean, nick: string) {
  const g = gameStats(trades, 0, 0), ex = expectancy(trades)
  return { nick: nick.slice(0, 20), level: g.level, xp: g.xp, streak: g.streak, winRate: Math.round(ex.wr * 100), discipline: discipline(trades) ?? -1, trades: trades.length, weekTrades: trades.filter(t => t.ts > Date.now() - 7 * DAY).length, plan: hasPlan, ts: Date.now() }
}
function detail(trades: Trade[]) {
  const now = Date.now(), wk = trades.filter(t => t.ts > now - 7 * DAY), mo = trades.filter(t => t.ts > now - 30 * DAY).sort((a, b) => a.ts - b.ts)
  let run = 0, peak = 0, dd = 0; mo.forEach(t => { run += t.pl; peak = Math.max(peak, run); dd = Math.max(dd, peak - run) })
  const moods: Record<string, number> = {}; trades.filter(t => t.ts > now - 14 * DAY).forEach(t => { const m = t.x?.Mood; if (m) moods[m] = (moods[m] || 0) + 1 })
  const last = [...trades].sort((a, b) => b.ts - a.ts).find(t => (t.lesson || '').trim())
  return { weekPl: +wk.reduce((s, t) => s + t.pl, 0).toFixed(2), monthPl: +mo.reduce((s, t) => s + t.pl, 0).toFixed(2), ddMax: +dd.toFixed(2), tilt: tilt(trades.filter(t => t.date === localDate())), topMood: Object.entries(moods).sort((a, b) => b[1] - a[1])[0]?.[0] || '', lastLesson: (last?.lesson || '').slice(0, 300), ts: now }
}
export async function deleteGroup(gid: string) {
  for (const c of ['members', 'private', 'posts', 'notes']) for (const d of (await getDocs(collection(db, `groups/${gid}/${c}`))).docs) await deleteDoc(d.ref)
  await deleteDoc(doc(db, 'groups', gid))
}
export async function leaveAll(uid: string, base: string) {
  for (const d of (await getDocs(collection(db, `${base}/groups`))).docs) {
    try { if (d.data().role === 'mentor') await deleteGroup(d.id); else { await deleteDoc(doc(db, `groups/${d.id}/private/${uid}`)); await deleteDoc(doc(db, `groups/${d.id}/members/${uid}`)) } } catch { /* group may be gone */ }
  }
}
type G = { id: string; name: string; role: 'mentor' | 'student'; detail?: boolean }
export default function Groups({ u, base, trades, pro, hasPlan }: { u: User; base: string; trades: Trade[]; pro: boolean; hasPlan: boolean }) {
  const [mine, setMine] = useState<G[]>([]), [open, setOpen] = useState(''), [code, setCode] = useState(''), [nick, setNick] = useState(localStorage.getItem('gnick') || ''), [gname, setGname] = useState(''), [msg, setMsg] = useState('')
  useEffect(() => onSnapshot(collection(db, `${base}/groups`), s => setMine(s.docs.map(d => ({ id: d.id, ...d.data() }) as G))), [base])
  const key = mine.map(g => g.id + g.role + g.detail).join()
  useEffect(() => { mine.filter(g => g.role === 'student').forEach(g => {
    setDoc(doc(db, `groups/${g.id}/members/${u.uid}`), summary(trades, hasPlan, localStorage.getItem('gnick') || 'Trader')).catch(() => {})
    if (g.detail) setDoc(doc(db, `groups/${g.id}/private/${u.uid}`), detail(trades)).catch(() => {}); else deleteDoc(doc(db, `groups/${g.id}/private/${u.uid}`)).catch(() => {})
  }) }, [trades.length, hasPlan, key])
  const join = async () => {
    const c = code.trim().toLowerCase(); if (!/^[a-z0-9]{12}$/.test(c)) return setMsg('Codes are 12 letters/numbers.'); if (!nick.trim()) return setMsg('Pick a nickname first.')
    const g = await getDoc(doc(db, 'groups', c)).catch(() => null); if (!g?.exists()) return setMsg('Group not found.')
    localStorage.setItem('gnick', nick.trim())
    await setDoc(doc(db, `groups/${c}/members/${u.uid}`), summary(trades, hasPlan, nick.trim())); await setDoc(doc(db, `${base}/groups/${c}`), { name: String(g.data()!.name).slice(0, 40), role: 'student', ts: Date.now(), detail: false }); setCode(''); setMsg('Joined 🎉')
  }
  const create = async () => {
    if (!pro) return setMsg('Mentor groups need Pro (Me tab → Go Pro).'); if (!gname.trim() || !nick.trim()) return setMsg('Group name and your nickname are required.')
    const c = newCode(); localStorage.setItem('gnick', nick.trim())
    await setDoc(doc(db, 'groups', c), { name: gname.trim().slice(0, 40), owner: u.uid, nick: nick.trim().slice(0, 20), ts: Date.now() }); await setDoc(doc(db, `${base}/groups/${c}`), { name: gname.trim().slice(0, 40), role: 'mentor', ts: Date.now(), detail: false }); setGname(''); setOpen(c)
  }
  const cur = mine.find(g => g.id === open)
  if (cur) return <><button className="alt" onClick={() => setOpen('')}>← Groups</button><br /><br />{cur.role === 'mentor' ? <Mentor g={cur} base={base} /> : <Student g={cur} u={u} base={base} />}</>
  return <>
    <div className="c"><h3><GraduationCap size={16} /> My groups</h3>{mine.map(g => <div key={g.id} className="row" style={{ padding: '6px 0', borderTop: '1px solid var(--bd)' }}><span><b>{g.name}</b> <span className="chip">{g.role}</span></span><button className="alt" onClick={() => setOpen(g.id)}>Open</button></div>)}{!mine.length && <p className="mu">Join a mentor's group with their code, or start your own below.</p>}</div>
    <div className="c"><h3>Join a group</h3><input placeholder="Group code (12 characters)" value={code} onChange={e => setCode(e.target.value)} /><br /><br /><input placeholder="Your nickname" maxLength={20} value={nick} onChange={e => setNick(e.target.value)} /><br /><br /><button onClick={join}>Join</button><p className="mu">Mentors see your level, streak, win rate, discipline score, trade count and whether you set a plan. Never equity, pairs or notes unless you switch on "detailed view" inside the group.</p></div>
    <div className="c"><h3>Start a mentor group {pro ? '' : <span className="chip">Pro</span>}</h3><input placeholder="Group name" maxLength={40} value={gname} onChange={e => setGname(e.target.value)} /><br /><br /><button onClick={create}>Create group</button><p className="mu">{msg}</p></div></>
}
function Student({ g, u, base }: { g: G; u: User; base: string }) {
  const [members, setMembers] = useState<any[]>([]), [posts, setPosts] = useState<any[]>([]), [note, setNote] = useState<any>(null), [gone, setGone] = useState(false)
  useEffect(() => { const e = () => setGone(true); const a = onSnapshot(collection(db, `groups/${g.id}/members`), s => setMembers(s.docs.map(d => ({ id: d.id, ...d.data() }))), e), b = onSnapshot(collection(db, `groups/${g.id}/posts`), s => setPosts(s.docs.map(d => ({ id: d.id, ...d.data() }))), () => {}), c = onSnapshot(doc(db, `groups/${g.id}/notes/${u.uid}`), s => setNote(s.data() || null), () => {}); return () => { a(); b(); c() } }, [g.id])
  const leave = async () => { if (!confirm('Leave this group?')) return; await deleteDoc(doc(db, `groups/${g.id}/private/${u.uid}`)).catch(() => {}); await deleteDoc(doc(db, `groups/${g.id}/members/${u.uid}`)).catch(() => {}); await deleteDoc(doc(db, `${base}/groups/${g.id}`)) }
  if (gone) return <div className="c">This group no longer exists or you were removed. <button className="alt" onClick={() => deleteDoc(doc(db, `${base}/groups/${g.id}`))}>Remove from my list</button></div>
  return <>
    <div className="c"><h3>{g.name}</h3>{note && <div className="msg">🧑‍🏫 Mentor note: {note.text}</div>}
      {[...posts].sort((a, b) => b.ts - a.ts).slice(0, 10).map(p => <div key={p.id} className="msg">{p.kind === 'assignment' ? '📝 Assignment: ' : '📣 '}{p.text}<div className="mu">{new Date(p.ts).toLocaleDateString()}</div></div>)}{!posts.length && !note && <p className="mu">No posts yet.</p>}</div>
    <div className="c"><h3>Group board</h3>{[...members].sort((a, b) => b.xp - a.xp).map((m, i) => <div key={m.id} className="row" style={{ padding: '5px 0', borderTop: '1px solid var(--bd)' }}><span>{['🥇', '🥈', '🥉'][i] || i + 1 + '.'} <b>{m.id === u.uid ? 'You' : m.nick}</b> <span className="chip">Lv {m.level}</span></span><span className="mu">🔥{m.streak}d · {m.winRate}% · disc {m.discipline < 0 ? '–' : m.discipline} {m.plan ? '📋' : ''}</span></div>)}</div>
    <div className="c"><label className="row"><span>Share detailed view with mentor<br /><span className="mu">Weekly/monthly P/L, drawdown, tilt, top mood, last lesson</span></span><input type="checkbox" style={{ width: 'auto' }} checked={!!g.detail} onChange={e => updateDoc(doc(db, `${base}/groups/${g.id}`), { detail: e.target.checked })} /></label><br /><button className="alt" onClick={leave}>Leave group</button></div></>
}
function Mentor({ g, base }: { g: G; base: string }) {
  const [members, setMembers] = useState<any[]>([]), [priv, setPriv] = useState<Record<string, any>>({}), [posts, setPosts] = useState<any[]>([]), [text, setText] = useState(''), [kind, setKind] = useState('announcement'), [to, setTo] = useState(''), [nt, setNt] = useState(''), [msg, setMsg] = useState('')
  useEffect(() => { const a = onSnapshot(collection(db, `groups/${g.id}/members`), s => setMembers(s.docs.map(d => ({ id: d.id, ...d.data() })))), b = onSnapshot(collection(db, `groups/${g.id}/private`), s => setPriv(Object.fromEntries(s.docs.map(d => [d.id, d.data()])))), c = onSnapshot(collection(db, `groups/${g.id}/posts`), s => setPosts(s.docs.map(d => ({ id: d.id, ...d.data() })))); return () => { a(); b(); c() } }, [g.id])
  const flags = (m: any) => { const f: string[] = [], p = priv[m.id], d = (Date.now() - m.ts) / DAY
    if (d >= 3) f.push(`inactive ${Math.floor(d)}d`); if (!m.plan) f.push('no plan today'); if (m.discipline >= 0 && m.discipline < 50) f.push('low discipline'); if (p?.tilt >= 2) f.push(`tilting (${p.tilt} losses)`); if (p && p.monthPl < 0 && p.ddMax > Math.abs(p.monthPl) * 2) f.push('deep drawdown'); return f }
  const act = members.filter(m => Date.now() - m.ts < 3 * DAY).length, dsc = members.filter(m => m.discipline >= 0), avgD = dsc.length ? Math.round(dsc.reduce((s, m) => s + m.discipline, 0) / dsc.length) : null
  const invite = `Join my PipTrail trading group "${g.name}". Install PipTrail, open Crew → Groups → Join, and enter code: ${g.id}`
  const post = async () => { await setDoc(doc(db, `groups/${g.id}/posts/p${Date.now()}`), { text: text.slice(0, 1000), kind, ts: Date.now() }); setText('') }
  return <>
    <div className="c"><h3>{g.name}</h3><div className="grid"><div><span className="mu">Members</span><div className="big">{members.length}</div></div><div><span className="mu">Active (3d)</span><div className="big">{act}</div></div><div><span className="mu">Avg discipline</span><div className="big">{avgD ?? '–'}</div></div><div><span className="mu">Plan today</span><div className="big">{members.filter(m => m.plan).length}</div></div></div><br />
      <div className="row"><span className="mu">Code: <b style={{ letterSpacing: 1 }}>{g.id}</b></span><button className="alt" onClick={() => navigator.clipboard?.writeText(invite).then(() => setMsg('Invite copied'))}><Copy size={14} /> Copy invite</button></div><p className="mu">{msg}</p></div>
    <div className="c"><h3>Students</h3><div style={{ overflowX: 'auto' }}><table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}><thead><tr style={{ textAlign: 'left', color: 'var(--mu)' }}><th>Trader</th><th>Lv</th><th>🔥</th><th>Win%</th><th>Disc</th><th>Wk</th><th>Wk P/L</th><th>Flags</th><th></th></tr></thead><tbody>
      {[...members].sort((a, b) => flags(b).length - flags(a).length || b.xp - a.xp).map(m => { const p = priv[m.id], f = flags(m); return <tr key={m.id} style={{ borderTop: '1px solid var(--bd)', whiteSpace: 'nowrap' }}><td><b>{m.nick}</b></td><td>{m.level}</td><td>{m.streak}d</td><td>{m.winRate}</td><td>{m.discipline < 0 ? '–' : m.discipline}</td><td>{m.weekTrades}</td><td>{p ? <span className={p.weekPl >= 0 ? 'pos' : 'neg'}>{money(p.weekPl)}</span> : <span className="mu">private</span>}</td><td>{f.length ? <span className="neg">{f.join(', ')}</span> : <span className="pos">on track</span>}</td><td><button className="alt" onClick={() => setTo(m.id)}>Note</button> <button className="alt" onClick={() => confirm('Remove ' + m.nick + '?') && deleteDoc(doc(db, `groups/${g.id}/members/${m.id}`))}><Trash2 size={12} /></button></td></tr> })}</tbody></table></div>{!members.length && <p className="mu">No students yet. Share the invite.</p>}
      {to && <><br /><b>Note to {members.find(m => m.id === to)?.nick}</b> (only they see it)<br /><textarea maxLength={1000} value={nt} onChange={e => setNt(e.target.value)} /><br /><br /><div className="row"><button disabled={!nt} onClick={async () => { await setDoc(doc(db, `groups/${g.id}/notes/${to}`), { text: nt, ts: Date.now() }); setNt(''); setTo('') }}>Send note</button><button className="alt" onClick={() => setTo('')}>Cancel</button></div></>}
      {Object.keys(priv).length > 0 && <p className="mu">Detailed students: {members.filter(m => priv[m.id]).map(m => `${m.nick} (month ${money(priv[m.id].monthPl)}, DD ${money(priv[m.id].ddMax)}${priv[m.id].topMood ? ', mood ' + priv[m.id].topMood : ''})`).join(' · ')}</p>}</div>
    <div className="c"><h3><Megaphone size={16} /> Post to the group</h3><select value={kind} onChange={e => setKind(e.target.value)}><option value="announcement">📣 Announcement</option><option value="assignment">📝 Assignment</option></select><br /><br /><textarea maxLength={1000} placeholder="e.g. This week: tag your mood on every trade and write one lesson per loss." value={text} onChange={e => setText(e.target.value)} /><br /><br /><button disabled={!text} onClick={post}>Post</button>
      {[...posts].sort((a, b) => b.ts - a.ts).map(p => <div key={p.id} className="row" style={{ padding: '6px 0' }}><span>{p.kind === 'assignment' ? '📝' : '📣'} {p.text}</span><button className="alt" onClick={() => deleteDoc(doc(db, `groups/${g.id}/posts/${p.id}`))}><Trash2 size={12} /></button></div>)}</div>
    <div className="c"><button className="danger" onClick={async () => { if (confirm('Delete this group for everyone?')) { await deleteGroup(g.id); await deleteDoc(doc(db, `${base}/groups/${g.id}`)) } }}><Trash2 size={14} /> Delete group</button></div></>
}
