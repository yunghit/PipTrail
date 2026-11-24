import { useEffect, useState } from 'react'
import { collection, onSnapshot } from 'firebase/firestore'
import { db } from './firebase'
import { Trade } from '@piptrail/shared'
export default function Challenges({ base, trades }: { base: string; trades: Trade[] }) {
  const [days, setDays] = useState<string[]>([])
  useEffect(() => onSnapshot(collection(db, `${base}/days`), s => setDays(s.docs.map(d => d.id)), () => {}), [base])
  const lim = new Date(Date.now() - 7 * 864e5).toLocaleDateString('en-CA'), wk = trades.filter(t => t.date >= lim), losses = wk.filter(t => t.pl < 0)
  const planDays = days.filter(d => d >= lim).length, moods = wk.filter(t => t.x?.Mood).length, rev = wk.filter(t => t.x?.Mood === 'revenge' || (t.x?.Mistake || '').includes('Revenge')).length, ln = losses.filter(t => (t.lesson || '').trim()).length
  const C = [
    { e: '📋', n: 'Plan 5 of 7 days', v: planDays, t: 5 },
    { e: '🪞', n: 'Tag your mood on every trade', v: moods, t: Math.max(5, wk.length) },
    { e: '🧠', n: 'Write a lesson on every loss', v: ln, t: Math.max(1, losses.length) },
    { e: '🧊', n: 'Zero revenge trades (5+ trades)', v: rev === 0 ? Math.min(5, wk.length) : 0, t: 5 }]
  return <div className="c"><h3>🏆 This week's challenges</h3>{C.map(c => <div key={c.n}><div className="row"><span>{c.e} {c.n}</span><span className="mu">{Math.min(c.v, c.t)}/{c.t} {c.v >= c.t ? '✅' : ''}</span></div><div className="bar"><i style={{ width: Math.min(100, c.v / c.t * 100) + '%' }} /></div><br /></div>)}</div>
}
