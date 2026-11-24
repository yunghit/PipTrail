import { useEffect, useRef, useState } from 'react'
import { onAuthStateChanged, signInWithEmailAndPassword, createUserWithEmailAndPassword, sendEmailVerification, signOut, deleteUser, User } from 'firebase/auth'
import { collection, doc, getDoc, getDocs, onSnapshot, setDoc, updateDoc, deleteDoc } from 'firebase/firestore'
import { Users, TrendingUp, Target, BookOpen, GraduationCap, Sparkles, UserRound, Flame, Trophy, Download, Trash2, LogOut, ShieldCheck } from 'lucide-react'
import { auth, db } from './firebase'
import { SLOTS, Trade, Lesson, Template, Account, equity, suggestSlot, nextBatch, milestone, cycleTrades, groupStats, gameStats, localDate, tilt, DayPlan, MOODS, limits, extra, expectancy } from '@piptrail/shared'
import Stats from './Stats'
import CrewHub from './CrewHub'
import { RulesBar, RulesCard, useRules, MISTAKES, ThemeCard, useSetups, SetupsCard, OfflineBanner, ComfortCard } from './Extras'
import Diagnostics from './Diagnostics'
import FeedbackCard from './Feedback'
import ShareCard from './Share'
import { LockGate, LockCard } from './Lock'
import BatchCard from './Batch'
import Tour from './Tour'
import Cooldown from './Cooldown'
import { STARTER } from './starter'
import { leaveAll } from './Groups'
import Reminders from './Reminders'
import AdBanner from './AdBanner'
import Upgrade, { usePro, Pro, FREE_COACH } from './Upgrade'
import ImportCard, { BackupCard } from './Import'
import { reschedule, registerPush, loadPrefs } from './notify'
import DayPlanCard from './Plan'
import { PartnerCard } from './Pip'

const money = (n: number) => (n < 0 ? '-' : '') + '$' + Math.abs(n).toFixed(2)
const today = () => localDate()
const buzz = (p: number | number[]) => { if (!localStorage.getItem('nohaptic')) navigator.vibrate?.(p) }
const API = import.meta.env.VITE_API_BASE || ''
function useCol<T>(path: string | null) {
  const [d, setD] = useState<T[]>([])
  useEffect(() => { if (!path) return; return onSnapshot(collection(db, path), s => setD(s.docs.map(x => ({ id: x.id, ...x.data() }) as T))) }, [path])
  return d
}
const Logo = ({ s = 36 }: { s?: number }) => <svg width={s} height={s} viewBox="0 0 512 512" aria-label="PipTrail"><rect width="512" height="512" rx="112" fill="#0A0F1E" /><polyline points="96,356 190,270 252,320 410,150" fill="none" stroke="#14D69A" strokeWidth="38" strokeLinecap="round" strokeLinejoin="round" /><circle cx="410" cy="150" r="34" fill="#FFB020" /><circle cx="96" cy="356" r="14" fill="#E8ECF1" opacity=".8" /></svg>
const Brand = () => <div className="brand"><Logo /><div>PipTrail<small>Every pip, on the record.</small></div></div>
function Confetti({ on }: { on: number }) {
  if (!on) return null
  return <div className="conf" key={on}>{Array.from({ length: 34 }, (_, i) => <i key={i} style={{ left: Math.random() * 100 + '%', background: ['#14D69A', '#FFB020', '#E8ECF1', '#FF5D6C'][i % 4], animationDelay: Math.random() * .4 + 's' }} />)}</div>
}
function useIdleLogout(min = 20) {
  useEffect(() => {
    let t: number; const reset = () => { clearTimeout(t); t = window.setTimeout(() => signOut(auth), min * 60000) }
    const ev = ['click', 'keydown', 'touchstart']; ev.forEach(e => addEventListener(e, reset)); reset()
    return () => { clearTimeout(t); ev.forEach(e => removeEventListener(e, reset)) }
  }, [min])
}
function Login() {
  const [e, setE] = useState(''), [p, setP] = useState(''), [err, setErr] = useState('')
  const signup = async () => {
    if (p.length < 10) return setErr('Use at least 10 characters.')
    try { const c = await createUserWithEmailAndPassword(auth, e, p); await sendEmailVerification(c.user) } catch (x: any) { setErr(x.code || 'Error') }
  }
  return <div className="w"><div className="c"><Brand /><br /><input type="email" autoComplete="email" placeholder="Email" value={e} onChange={x => setE(x.target.value)} /><br /><br />
    <input type="password" autoComplete="current-password" placeholder="Password (10+ characters)" value={p} onChange={x => setP(x.target.value)} /><br /><br />
    <div className="row"><button onClick={() => signInWithEmailAndPassword(auth, e, p).catch(x => setErr(x.code || 'Error'))}>Sign in</button><button className="alt" onClick={signup}>Create account</button></div>
    <p className="neg">{err}</p><p className="mu"><ShieldCheck size={14} /> Email verification required. Your data is private to you.</p></div></div>
}
function Verify({ u }: { u: User }) {
  const [m, setM] = useState('')
  return <div className="w"><div className="c"><Brand /><h3>Verify your email</h3><p>We sent a link to <b>{u.email}</b>. Open it, then continue.</p>
    <div className="row"><button onClick={async () => { await u.reload(); await u.getIdToken(true); location.reload() }}>I verified</button>
      <button className="alt" onClick={() => sendEmailVerification(u).then(() => setM('Sent.'))}>Resend</button><button className="alt" onClick={() => signOut(auth)}>Sign out</button></div><p className="mu">{m}</p></div></div>
}
export default function App() {
  const [u, setU] = useState<User | null | undefined>(undefined)
  useEffect(() => onAuthStateChanged(auth, setU), [])
  if (u === undefined) return <div className="w"><Brand /></div>
  return !u ? <Login /> : !u.emailVerified ? <Verify u={u} /> : <LockGate><Main u={u} /></LockGate>
}
function Main({ u }: { u: User }) {
  useIdleLogout()
  const [tab, setTab] = useState('home'), base = `users/${u.uid}`, [boom, setBoom] = useState(0)
  const trades = useCol<Trade>(`${base}/trades`).sort((a, b) => a.ts - b.ts)
  const mine = useCol<Lesson>(`${base}/lessons`), shared = useCol<Lesson>('lessons'), tpls = useCol<Template>('templates')
  const days = useCol<DayPlan & { id: string }>(`${base}/days`), anns = useCol<{ id: string; text: string; ts: number }>('announcements')
  const plan = days.find(d => d.id === today()) || null, ann = [...anns].sort((x, y) => y.ts - x.ts)[0] || null
  extra.days = days.filter(d => d.skip).map(d => d.id)
  const [acct, setAcct] = useState<Account | null | undefined>(undefined)
  useEffect(() => onSnapshot(doc(db, `${base}/meta/acct`), s => setAcct(s.exists() ? (s.data() as Account) : null)), [base])
  useEffect(() => { reschedule(trades.some(t => t.date === today())) }, [trades.length])
  useEffect(() => { if (loadPrefs().push) registerPush(u.uid) }, [u.uid])
  const pro = usePro(u.uid)
  const lotd = shared.length ? [...shared].sort((x, y) => x.ts - y.ts)[Math.floor(Date.now() / 864e5) % shared.length] : null
  const party = () => { setBoom(Date.now()); buzz([30, 40, 30]); setTimeout(() => setBoom(0), 2200) }
  const T: [string, any, string][] = [['home', Target, 'Desk'], ['journal', BookOpen, 'Journal'], ['stats', TrendingUp, 'Stats'], ['coach', Sparkles, 'Coach'], ['crew', Users, 'Crew'], ['me', UserRound, 'Me']]
  return <div className="w"><Confetti on={boom} /><Tour /><OfflineBanner /><AdBanner show={!pro.active && ['journal', 'stats', 'crew'].includes(tab)} /><div className="row"><Brand /></div><br />
    {acct === undefined ? 'Loading…' : acct === null ? <Setup base={base} /> :
      tab === 'home' ? <Desk base={base} a={acct} trades={trades} tpls={tpls} party={party} plan={plan} ann={ann} lotd={lotd} /> :
      tab === 'journal' ? <Journal base={base} trades={trades} lessons={[...shared, ...mine, ...STARTER]} /> :
      tab === 'stats' ? <Stats a={acct} trades={trades} base={base} /> :
      tab === 'crew' ? <CrewHub u={u} base={base} trades={trades} a={acct} pro={pro.active} hasPlan={!!plan} /> :
      tab === 'coach' ? <Coach u={u} base={base} trades={trades} lessons={[...shared, ...mine]} pro={pro.active} /> : <Me u={u} base={base} a={acct} trades={trades} pro={pro} />}
    <nav className="nav">{T.map(([k, I, l]) => <button key={k} className={tab === k ? 'on' : ''} onClick={() => setTab(k)}><I size={22} />{l}</button>)}</nav></div>
}
function Setup({ base }: { base: string }) {
  const [v, setV] = useState('')
  return <div className="c"><h3>Let's start your trail</h3><p>Current account equity (USD)?</p><input type="number" value={v} onChange={e => setV(e.target.value)} /><br /><br />
    <button disabled={v === '' || +v < 0} onClick={() => setDoc(doc(db, `${base}/meta/acct`), { base: +v, cycle: 1, hist: [] })}>Start</button></div>
}
function Desk({ base, a, trades, tpls, party, plan, ann, lotd }: { base: string; a: Account; trades: Trade[]; tpls: Template[]; party: () => void; plan: DayPlan | null; ann: { text: string } | null; lotd: Lesson | null }) {
  const E = equity(a, trades), m = milestone(E), c = cycleTrades(a, trades), g = gameStats(trades, a.hist.length, a.hist.length ? 640 : E)
  const setups = useSetups(base), [setup, setSetup] = useState(''), [acc, setAcc] = useState(localStorage.getItem('acct') || 'Live'), [recent, setRecent] = useState<string[]>(() => { try { return JSON.parse(localStorage.getItem('pairs') || '[]') } catch { return [] } }), ex0 = expectancy(c), proj = ex0.exp > 0 && E < m.to ? Math.ceil((m.to - E) / ex0.exp) : 0
  const lim = limits(plan, trades.filter(t => t.date === today())), [mood, setMood] = useState('')
  const losses = tilt(trades.filter(t => t.date === today())), [ck, setCk] = useState<Record<string, boolean>>({})
  const [tpl, setTpl] = useState(''), TP = tpls.find(t => t.id === tpl), [shake, setShake] = useState(false), [tip, setTip] = useState('')
  const [f, setF] = useState({ pair: '', side: 'BUY', model: 'CRT', tf: '', pl: '', lesson: '' }), [slot, setSlot] = useState(suggestSlot(a, trades)), [x, setX] = useState<Record<string, string>>({})
  useEffect(() => setSlot(suggestSlot(a, trades)), [trades.length])
  const save = async () => {
    const pl = +f.pl
    if (pl < 0 && !f.lesson.trim() && !shake) { setShake(true); setTip('Losses teach the most. Add one line (+15 XP).'); setTimeout(() => setShake(false), 500); return }
    if (lim.hit && !confirm('Daily limit reached. Trade anyway?')) return
    if (losses >= 3 && !confirm('3 losses in a row today. Take it anyway?')) return
    const xx = { ...(TP?.checks.length ? { ...x, '✔ Checklist': `${TP.checks.filter(k => ck[k]).length}/${TP.checks.length}` } : x), ...(mood ? { Mood: mood } : {}), ...(setup ? { Setup: setup } : {}), Account: acc }
    await setDoc(doc(db, `${base}/trades/t${Date.now()}`), { ts: Date.now(), date: today(), cycle: a.cycle, ...f, pair: f.pair.toUpperCase().slice(0, 20), pl, slot, x: xx })
    const up = f.pair.toUpperCase().slice(0, 20), np = [up, ...recent.filter(x => x !== up)].slice(0, 6); setRecent(np); localStorage.setItem('pairs', JSON.stringify(np))
    setF({ ...f, pair: '', pl: '', lesson: '' }); setX({}); setCk({}); setMood(''); setSetup(''); setTip(''); if (pl > 0) buzz(20)
    const E2 = E + pl; if (E2 >= 160 && E < 160 || E2 >= 640 && E < 640) party()
  }
  const withdraw = async () => { party(); await setDoc(doc(db, `${base}/meta/acct`), { base: 40, cycle: a.cycle + 1, hist: [...a.hist, { cycle: a.cycle, date: today(), n: c.length, w: E - 40 }] }) }
  return <>
    {ann && <div className="c" style={{ borderColor: 'var(--am)' }}>📣 {ann.text}</div>}
    <PartnerCard trades={trades} plan={plan} g={g} />
    <RulesBar base={base} />
    {lotd && <div className="c">💡 <b>{lotd.title}</b><div className="mu" style={{ whiteSpace: 'pre-wrap' }}>{lotd.body.slice(0, 240)}</div></div>}
    <DayPlanCard base={base} plan={plan} todays={trades.filter(t => t.date === today())} />
    <div className="c"><div className="row"><span className="chip"><Trophy size={14} /> Lv {g.level}</span><span className="chip"><Flame size={14} color="#FFB020" /> {g.streak}d streak</span><span className="chip">⚡ {g.winStreak} win streak</span></div>
      <div className="bar" style={{ margin: '10px 0' }}><i style={{ width: g.progress * 100 + '%' }} /></div><span className="mu">{g.xp} XP</span></div>
    <div className="c"><div className="grid"><div><span className="mu">Equity</span><div className="big">{money(E)}</div></div><div><span className="mu">Next batch</span><div className="big">{nextBatch(E)}</div></div><div><span className="mu">Cycle</span><div className="big">#{a.cycle}</div></div></div><br />
      <div className="bar"><i style={{ width: Math.min(100, Math.max(0, (E - m.from) / (m.to - m.from) * 100)) + '%' }} /></div><span className="mu">{money(m.from)} → {money(m.to)}{proj > 0 && ` · about ${proj} trades to go at your average`}</span>
      {E >= 640 && <><br /><br /><button onClick={withdraw}>💰 Cycle complete · withdraw {money(E - 40)}</button></>}</div>
    {losses >= 1 && <Cooldown />}
    {losses >= 2 && <div className="c" style={{ borderColor: 'var(--ls)' }}>🛑 {losses} losses in a row today. Step away 15 minutes. Tilt costs more than the last loss.</div>}
    <div className={'c' + (shake ? ' shake' : '')}><div className="row"><h3>Log a closed trade</h3><span>{['Live', 'Demo'].map(k => <button key={k} className={acc === k ? '' : 'alt'} style={{ width: 'auto', padding: '3px 12px', marginLeft: 4 }} onClick={() => { setAcc(k); localStorage.setItem('acct', k) }}>{k}</button>)}</span></div>
      {acc === 'Demo' && <p className="mu">Demo trades are kept in your stats but never change your live cycle equity.</p>}
      {tpls.length > 0 && <><select value={tpl} onChange={e => setTpl(e.target.value)}><option value="">No template</option>{tpls.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}</select><br /><br /></>}
      {TP?.checks.map(k => <label key={k} style={{ display: 'block' }}><input type="checkbox" style={{ width: 'auto' }} checked={!!ck[k]} onChange={e => setCk({ ...ck, [k]: e.target.checked })} /> {k}</label>)}
      {recent.length > 0 && <div className="row" style={{ justifyContent: 'flex-start', gap: 6, marginBottom: 8 }}>{recent.map(p => <button key={p} className="alt" style={{ padding: '3px 10px' }} onClick={() => setF({ ...f, pair: p })}>{p}</button>)}</div>}
      <div className="grid"><input placeholder="Pair" maxLength={20} value={f.pair} onChange={e => setF({ ...f, pair: e.target.value })} />
        <select value={f.side} onChange={e => setF({ ...f, side: e.target.value })}><option>BUY</option><option>SELL</option></select>
        <select value={f.model} onChange={e => setF({ ...f, model: e.target.value })}><option>CRT</option><option>Unicorn</option><option>CRT+Unicorn</option><option>Other</option></select>
        <input placeholder="TF" maxLength={10} value={f.tf} onChange={e => setF({ ...f, tf: e.target.value })} />
        <select value={slot} onChange={e => setSlot(e.target.value as any)}>{SLOTS.map(s => <option key={s.k} value={s.k}>{s.l}</option>)}</select>
        <input type="number" placeholder="P/L USD" value={f.pl} onChange={e => setF({ ...f, pl: e.target.value })} />
        {TP?.fields.map(k => <input key={k} placeholder={k} maxLength={60} value={x[k] || ''} onChange={e => setX({ ...x, [k]: e.target.value })} />)}</div><br />
      {setups.length > 0 && <><select value={setup} onChange={e => setSetup(e.target.value)}><option value="">Setup (optional)</option>{setups.map(s => <option key={s} value={s}>{s}</option>)}</select><br /><br /></>}
      <div className="row" style={{ justifyContent: 'flex-start', marginBottom: 8 }}><span className="mu">Mood:</span>{MOODS.map(m => <button key={m.k} className="alt" style={{ opacity: mood === m.k ? 1 : .4 }} onClick={() => setMood(m.k)} title={m.k}>{m.e}</button>)}</div>
      <textarea placeholder="What did this trade teach you?" maxLength={2000} value={f.lesson} onChange={e => setF({ ...f, lesson: e.target.value })} />{tip && <p className="neg">{tip}</p>}<br /><br />
      <button disabled={!f.pair || f.pl === ''} onClick={save}>Save trade</button></div>
    <BatchCard base={base} a={a} slot={slot} />
    <div className="c">{SLOTS.slice(1).map(s => { const t = c.filter(y => y.slot === s.k), p = t.reduce((q, y) => q + y.pl, 0)
      return <div key={s.k}><div className="row"><b>{s.l} · {s.n} × ${s.tp}</b><span className="mu">{t.length}/{s.n} · <span className={p >= 0 ? 'pos' : 'neg'}>{money(p)}</span></span></div><div className="bar"><i style={{ width: Math.min(100, t.length / s.n * 100) + '%' }} /></div><br /></div> })}</div></>
}
function Journal({ base, trades, lessons }: { base: string; trades: Trade[]; lessons: Lesson[] }) {
  const [v, setV] = useState('t'), [q, setQ] = useState(''), [res, setRes] = useState('all')
  if (v === 'l') return <><button className="alt" onClick={() => setV('t')}>← Trades</button><br /><br /><Lessons list={lessons} /></>
  const L = [...trades].reverse().filter(t => (res === 'all' || (res === 'win' ? t.pl > 0 : t.pl <= 0)) && (!q || JSON.stringify([t.pair, t.model, t.tf, t.slot, t.lesson, t.x]).toLowerCase().includes(q.toLowerCase())))
  const tag = (t: Trade, m: string) => {
    const cur = (t.x?.Mistake || '').split(', ').filter(Boolean), nx = cur.includes(m) ? cur.filter(c => c !== m) : [...cur, m], x = { ...(t.x || {}) } as Record<string, string>
    if (nx.length) x.Mistake = nx.join(', '); else delete x.Mistake
    return updateDoc(doc(db, `${base}/trades/${t.id}`), { x })
  }
  return <><button className="alt" onClick={() => setV('l')}>📚 Lessons ({lessons.length})</button><br /><br />
    <div className="c"><div className="grid"><input placeholder="Search pair, model, mood, note…" value={q} onChange={e => setQ(e.target.value)} /><select value={res} onChange={e => setRes(e.target.value)}><option value="all">All trades</option><option value="win">Wins</option><option value="loss">Losses</option></select></div><span className="mu">{L.length} shown</span></div>
    <div className="c">{L.map(t => <div key={t.id} style={{ borderTop: '1px solid var(--bd)', padding: '8px 0' }}>
      <div className="row"><span>{t.date} · <b>{t.pair}</b> {t.side} <span className="chip">{t.model}</span> <span className="chip">{t.slot}</span>{t.x?.Mood && <span className="chip">{MOODS.find(m => m.k === t.x!.Mood)?.e}</span>}</span><b className={t.pl >= 0 ? 'pos' : 'neg'}>{money(t.pl)}</b></div>
      <div className="row" style={{ justifyContent: 'flex-start', gap: 8, margin: '6px 0' }}><span className="mu">P/L</span><input type="number" step="0.01" defaultValue={t.pl} style={{ width: 100 }} onBlur={e => { const v = parseFloat(e.target.value); if (isFinite(v) && v !== t.pl) updateDoc(doc(db, `${base}/trades/${t.id}`), { pl: v }) }} /><select value={t.slot} style={{ width: 'auto' }} onChange={e => updateDoc(doc(db, `${base}/trades/${t.id}`), { slot: e.target.value })}>{SLOTS.map(s => <option key={s.k} value={s.k}>{s.l}</option>)}</select>{t.x?.Account === 'Demo' && <span className="chip">Demo</span>}</div>
      <div className="row" style={{ justifyContent: 'flex-start', gap: 4, margin: '6px 0' }}>{MISTAKES.map(m => <button key={m} className="alt" style={{ fontSize: 11, padding: '3px 8px', opacity: (t.x?.Mistake || '').includes(m) ? 1 : .4 }} onClick={() => tag(t, m)}>{m}</button>)}</div>
      <textarea defaultValue={t.lesson || ''} maxLength={2000} placeholder="Lesson / notes" onBlur={e => e.target.value !== (t.lesson || '') && updateDoc(doc(db, `${base}/trades/${t.id}`), { lesson: e.target.value })} />
      <button className="alt" onClick={() => confirm('Delete this trade?') && deleteDoc(doc(db, `${base}/trades/${t.id}`))}><Trash2 size={14} /></button></div>)}{!L.length && 'No trades match.'}</div></>
}
function Lessons({ list }: { list: Lesson[] }) {
  const [stars, setStars] = useState<string[]>(() => { try { return JSON.parse(localStorage.getItem('stars') || '[]') } catch { return [] } })
  const toggle = (id: string) => { const n = stars.includes(id) ? stars.filter(x => x !== id) : [...stars, id]; setStars(n); localStorage.setItem('stars', JSON.stringify(n)) }
  const L = [...list].sort((a, b) => Number(stars.includes(b.id)) - Number(stars.includes(a.id)))
  return <div className="c">{L.map(l => <div key={l.id} style={{ borderTop: '1px solid var(--bd)', padding: '8px 0' }}><div className="row"><span><b>{l.title}</b> <span className="chip">{l.cat}</span></span><button className="alt" onClick={() => toggle(l.id)}>{stars.includes(l.id) ? '★' : '☆'}</button></div><div style={{ whiteSpace: 'pre-wrap' }}>{l.body}</div></div>)}{!L.length && 'No lessons yet. Ask the Coach to write one from your trades.'}</div>
}
function Coach({ u, base, trades, lessons, pro }: { u: User; base: string; trades: Trade[]; lessons: Lesson[]; pro: boolean }) {
  const rules = useRules(base)
  const [m, setM] = useState<{ role: string; content: string }[]>([]), [q, setQ] = useState(''), [busy, setBusy] = useState(false), end = useRef<HTMLDivElement>(null)
  useEffect(() => end.current?.scrollIntoView(), [m])
  const ctx = () => ['model', 'pair', 'tf', 'slot', 'side'].map(k => `BY ${k}: ` + JSON.stringify(groupStats(trades, k as any))).join('\n') + '\nTRADES id|date|pair|side|model|tf|slot|pl|mood/mistake/setup|lesson\n' + trades.slice(-60).map(t => [t.id, t.date, t.pair, t.side, t.model, t.tf, t.slot, t.pl, (t.x?.Mood || '') + '/' + (t.x?.Mistake || '') + '/' + (t.x?.Setup || ''), (t.lesson || '').slice(0, 200)].join('|')).join('\n') + '\nRULES\n' + rules.join('; ') + '\nLESSONS\n' + lessons.map(l => l.title + ': ' + l.body.slice(0, 300)).join('\n')
  const act = async (line: string) => {
    try {
      const a = JSON.parse(line.slice(7))
      if (a.type === 'add_lesson' && a.title && a.body) await setDoc(doc(db, `${base}/lessons/l${Date.now()}`), { title: String(a.title).slice(0, 120), body: String(a.body).slice(0, 4000), cat: 'AI', ts: Date.now() })
      if (a.type === 'set_trade_lesson') { const t = trades.find(x => x.id === a.id); if (t) await updateDoc(doc(db, `${base}/trades/${t.id}`), { lesson: ((t.lesson ? t.lesson + ' | ' : '') + String(a.lesson)).slice(0, 2000) }) }
      return '✅ Saved'
    } catch { return '' }
  }
  const ask = async (o?: string) => {
    const text = (o ?? q).trim(); if (!text || busy) return
    const qk = 'cq' + today(), used = +(localStorage.getItem(qk) || 0)
    if (!pro && used >= FREE_COACH) { setM([...m, { role: 'assistant', content: `Free plan: ${FREE_COACH} coach questions a day. Upgrade to Pro (Me tab) for unlimited.` }]); return }
    localStorage.setItem(qk, String(used + 1)); const next = [...m, { role: 'user', content: text }]; setM(next); setQ(''); setBusy(true)
    try {
      const r = await fetch(API + '/api/coach', { method: 'POST', headers: { 'content-type': 'application/json', authorization: 'Bearer ' + await u.getIdToken() }, body: JSON.stringify({ messages: next, context: ctx() }) })
      const j = await r.json(); if (!r.ok) throw new Error(j.error || 'Error')
      const lines: string[] = j.text.split('\n'), keep = lines.filter(l => !l.startsWith('ACTION {')), notes: string[] = []
      for (const l of lines.filter(l => l.startsWith('ACTION {'))) notes.push(await act(l))
      setM([...next, { role: 'assistant', content: keep.join('\n').trim() + (notes.filter(Boolean).length ? '\n' + notes.join(' ') : '') }])
    } catch (e: any) { setM([...next, { role: 'assistant', content: e.message }]) }
    setBusy(false)
  }
  return <div className="c"><p className="mu">Your free AI coach. It reads your journal and can save lessons when you ask.</p>
    <div className="row" style={{ justifyContent: 'flex-start', marginBottom: 8 }}>{['Review my last 10 losses', 'Which model and TF is my edge?', 'Debrief my day: trades, mood, limits, one fix for tomorrow', 'Which of my rules do I break most?', 'What are my mistakes costing me?', 'Weekly review', 'Write a lesson from my worst loss'].map(p => <button key={p} className="alt" onClick={() => ask(p)}>{p}</button>)}</div>
    {m.map((x, i) => <div key={i} className={'msg' + (x.role === 'user' ? ' me' : '')}>{x.content}</div>)}<div ref={end} />
    <input placeholder="Review my last 10 losses…" value={q} onChange={e => setQ(e.target.value)} onKeyDown={e => e.key === 'Enter' && ask()} /><br /><br /><button disabled={busy} onClick={() => ask()}>{busy ? 'Thinking…' : 'Ask'}</button></div>
}
function Me({ u, base, a, trades, pro }: { u: User; base: string; a: Account; trades: Trade[]; pro: Pro }) {
  const g = gameStats(trades, a.hist.length, a.hist.length ? 640 : equity(a, trades)), [msg, setMsg] = useState('')
  const exp = () => {
    const rows = ['date,pair,side,model,tf,slot,pl,lesson', ...trades.map(t => [t.date, t.pair, t.side, t.model, t.tf, t.slot, t.pl, '"' + (t.lesson || '').replace(/"/g, '""').replace(/^[=+@-]/, "'$&") + '"'].join(','))]
    const el = document.createElement('a'); el.href = URL.createObjectURL(new Blob([rows.join('\n')], { type: 'text/csv' })); el.download = 'piptrail-trades.csv'; el.click()
  }
  const del = async () => {
    if (prompt('Type DELETE to erase your account and all data') !== 'DELETE') return
    try { await leaveAll(u.uid, base); const pf = (await getDoc(doc(db, `${base}/meta/prefs`))).data(); if (pf?.shareCode) await deleteDoc(doc(db, 'shares', pf.shareCode)); for (const c of ['trades', 'lessons', 'days', 'partners', 'groups', 'meta']) for (const d of (await getDocs(collection(db, `${base}/${c}`))).docs) await deleteDoc(d.ref); await deleteUser(u) }
    catch { setMsg('For security, sign out, sign in again, then retry.') }
  }
  return <><Upgrade u={u} pro={pro} /><RulesCard base={base} /><SetupsCard base={base} /><LockCard /><ThemeCard /><ComfortCard /><Reminders u={u} loggedToday={trades.some(t => t.date === today())} /><div className="c"><h3>Trophies · {g.badges.filter(b => b.got).length}/{g.badges.length}</h3><div className="grid">{g.badges.map(b => <div key={b.id} className={'badge' + (b.got ? '' : ' off')}><span>{b.icon}</span><b>{b.name}</b><small className="mu">{b.desc}</small></div>)}</div></div>
    <ImportCard base={base} /><BackupCard base={base} /><FeedbackCard u={u} /><Diagnostics u={u} /><div className="c"><h3>Account</h3><p className="mu">{u.email} · Level {g.level}</p><div className="row"><button className="alt" onClick={exp}><Download size={16} /> Export CSV</button><button className="alt" onClick={() => signOut(auth)}><LogOut size={16} /> Sign out</button><button className="danger" onClick={del}><Trash2 size={16} /> Delete account</button></div><p className="neg">{msg}</p>
      <p className="mu"><ShieldCheck size={14} /> Verified email · private by rule · auto sign-out after 20 min idle.</p></div></>
}
