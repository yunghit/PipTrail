import { useState } from 'react'
import { doc, setDoc, updateDoc } from 'firebase/firestore'
import { db } from './firebase'
import { DayPlan, Trade, MOODS, limits, localDate } from '@piptrail/shared'
export default function DayPlanCard({ base, plan, todays }: { base: string; plan: DayPlan | null; todays: Trade[] }) {
  const [edit, setEdit] = useState(false), [bias, setBias] = useState(plan?.bias || ''), [mt, setMt] = useState(String(plan?.maxTrades || 10)), [ml, setMl] = useState(String(plan?.maxLoss || 8)), [mood, setMood] = useState(plan?.mood || '')
  const save = async () => { await setDoc(doc(db, `${base}/days/${localDate()}`), { bias: bias.slice(0, 200), maxTrades: Math.max(1, Math.round(+mt) || 10), maxLoss: Math.max(0, +ml || 0), mood, note: '', ts: Date.now() }); setEdit(false) }
  const skip = async () => { await setDoc(doc(db, `${base}/days/${localDate()}`), { bias: 'Skipped: no clean setup', maxTrades: 1, maxLoss: 0, mood, note: '', ts: Date.now(), skip: true }); setEdit(false) }
  const L = limits(plan, todays)
  if (plan && !edit) return <div className="c"><div className="row"><b>📋 Today's plan</b><button className="alt" onClick={() => setEdit(true)}>Edit</button></div>
    <p className="mu">{plan.bias || 'No bias set'} {MOODS.find(m => m.k === plan.mood)?.e}</p>
    <div className="row"><span className="mu">Trades {L.n}/{plan.maxTrades}</span><span className="mu">Loss ${L.used.toFixed(2)}/${plan.maxLoss}</span></div>
    <div className="bar"><i style={{ width: Math.min(100, L.n / plan.maxTrades * 100) + '%' }} /></div><div className="bar" style={{ marginTop: 6 }}><i style={{ width: Math.min(100, plan.maxLoss ? L.used / plan.maxLoss * 100 : 100) + '%', background: 'var(--ls)' }} /></div>
    <textarea style={{ marginTop: 8 }} maxLength={500} placeholder="Evening note: how did today go?" defaultValue={plan.note} onBlur={e => e.target.value !== plan.note && updateDoc(doc(db, `${base}/days/${localDate()}`), { note: e.target.value })} />
    {plan.skip ? <p className="pos">🧘 Skip day logged. Not trading is a position.</p> : L.hit && <p className="neg">🛑 Limit reached. Done for the day.</p>}</div>
  return <div className="c"><b>📋 Set today's plan</b><br /><br /><input placeholder="Bias / pairs / what you're waiting for" maxLength={200} value={bias} onChange={e => setBias(e.target.value)} /><br /><br />
    <div className="grid"><input type="number" placeholder="Max trades" value={mt} onChange={e => setMt(e.target.value)} /><input type="number" placeholder="Max loss $" value={ml} onChange={e => setMl(e.target.value)} /></div><br />
    <div className="row" style={{ justifyContent: 'flex-start' }}><span className="mu">Mood:</span>{MOODS.map(m => <button key={m.k} className="alt" style={{ opacity: mood === m.k ? 1 : .45 }} onClick={() => setMood(m.k)} title={m.k}>{m.e}</button>)}</div><br /><div className="row"><button onClick={save}>Lock in plan</button><button className="alt" onClick={skip}>🧘 Skip today (no setup)</button></div></div>
}
