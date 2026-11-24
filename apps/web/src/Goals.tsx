import { useEffect, useState } from 'react'
import { doc, onSnapshot, setDoc } from 'firebase/firestore'
import { db } from './firebase'
import { Trade, discipline } from '@piptrail/shared'
const money = (n: number) => (n < 0 ? '-' : '') + '$' + Math.abs(n).toFixed(2)
export default function Goals({ base, trades }: { base: string; trades: Trade[] }) {
  const [g, setG] = useState({ weekProfit: 0, monthProfit: 0, minDiscipline: 0 }), [edit, setEdit] = useState(false), [f, setF] = useState({ w: '', m: '', d: '' })
  useEffect(() => onSnapshot(doc(db, `${base}/meta/goals`), s => { if (s.exists()) { const d = s.data() as any; setG(d); setF({ w: String(d.weekProfit), m: String(d.monthProfit), d: String(d.minDiscipline) }) } }, () => {}), [base])
  const now = Date.now(), n = new Date(), wk = trades.filter(t => t.ts > now - 7 * 864e5).reduce((s, t) => s + t.pl, 0), mo = trades.filter(t => { const d = new Date(t.ts); return d.getMonth() === n.getMonth() && d.getFullYear() === n.getFullYear() }).reduce((s, t) => s + t.pl, 0), ds = discipline(trades.filter(t => t.ts > now - 30 * 864e5))
  const save = async () => { await setDoc(doc(db, `${base}/meta/goals`), { weekProfit: +f.w || 0, monthProfit: +f.m || 0, minDiscipline: Math.min(100, Math.max(0, Math.round(+f.d) || 0)) }); setEdit(false) }
  const row = (l: string, v: number, t: number, fmt: (x: number) => string) => t > 0 && <div key={l}><div className="row"><span>{l}</span><span className="mu">{fmt(v)} / {fmt(t)} {v >= t ? '🎯' : ''}</span></div><div className="bar"><i style={{ width: Math.max(0, Math.min(100, v / t * 100)) + '%' }} /></div><br /></div>
  const none = !g.weekProfit && !g.monthProfit && !g.minDiscipline
  return <div className="c"><div className="row"><h3>🎯 Goals</h3><button className="alt" onClick={() => setEdit(!edit)}>{edit ? 'Close' : none ? 'Set goals' : 'Edit'}</button></div>
    {edit ? <><div className="grid"><input type="number" placeholder="Week profit $" value={f.w} onChange={e => setF({ ...f, w: e.target.value })} /><input type="number" placeholder="Month profit $" value={f.m} onChange={e => setF({ ...f, m: e.target.value })} /><input type="number" placeholder="Discipline (0-100)" value={f.d} onChange={e => setF({ ...f, d: e.target.value })} /></div><br /><button onClick={save}>Save goals</button></> : none ? <p className="mu">Set a weekly and monthly target plus a discipline floor.</p> : <>{row('This week (7d)', wk, g.weekProfit, money)}{row('This month', mo, g.monthProfit, money)}{row('Discipline (30d)', ds ?? 0, g.minDiscipline, x => String(x))}</>}</div>
}
