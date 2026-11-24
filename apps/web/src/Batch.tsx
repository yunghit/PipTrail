import { useEffect, useState } from 'react'
import { doc, writeBatch } from 'firebase/firestore'
import { Zap } from 'lucide-react'
import { db } from './firebase'
import { SLOTS, SlotKey, Account, localDate } from '@piptrail/shared'
// Your plan has up to 100 positions per cycle: log a whole batch in one tap instead of one by one.
export default function BatchCard({ base, a, slot }: { base: string; a: Account; slot: SlotKey }) {
  const s = SLOTS.find(x => x.k === slot)!
  const [pair, setPair] = useState(''), [side, setSide] = useState('BUY'), [model, setModel] = useState('CRT'), [w, setW] = useState('10'), [l, setL] = useState('0'), [win, setWin] = useState(String(s.tp || 4)), [loss, setLoss] = useState('4'), [msg, setMsg] = useState('')
  useEffect(() => setWin(String(s.tp || 4)), [slot])
  const nW = Math.max(0, Math.round(+w) || 0), nL = Math.max(0, Math.round(+l) || 0), net = nW * (+win || 0) - nL * (+loss || 0)
  const save = async () => {
    if (!pair.trim()) return setMsg('Enter the pair.'); if (nW + nL < 1 || nW + nL > 100) return setMsg('Between 1 and 100 positions.')
    const b = writeBatch(db), now = Date.now(), base0 = { date: localDate(), cycle: a.cycle, pair: pair.toUpperCase().slice(0, 20), side, model, tf: '', slot, x: { Batch: '1', Account: localStorage.getItem('acct') || 'Live' } }
    for (let i = 0; i < nW + nL; i++) b.set(doc(db, `${base}/trades/b${now}_${i}`), { ...base0, ts: now + i, pl: Math.round((i < nW ? +win : -Math.abs(+loss)) * 100) / 100 })
    await b.commit(); setMsg(`Logged ${nW + nL} positions (${net >= 0 ? '+' : '-'}$${Math.abs(net).toFixed(2)}) ✅`); setW('10'); setL('0')
  }
  return <div className="c"><h3><Zap size={16} color="#FFB020" /> Batch log · {s.l}</h3><p className="mu">Log many positions at once: N winners at the same profit, M losers at the same loss. Wins are saved first, then losses.</p>
    <div className="grid"><input placeholder="Pair" maxLength={20} value={pair} onChange={e => setPair(e.target.value)} /><select value={side} onChange={e => setSide(e.target.value)}><option>BUY</option><option>SELL</option></select><select value={model} onChange={e => setModel(e.target.value)}><option>CRT</option><option>Unicorn</option><option>CRT+Unicorn</option><option>Other</option></select></div><br />
    <div className="grid"><div><span className="mu">Winners</span><input type="number" min="0" value={w} onChange={e => setW(e.target.value)} /></div><div><span className="mu">Each +$</span><input type="number" step="0.01" value={win} onChange={e => setWin(e.target.value)} /></div><div><span className="mu">Losers</span><input type="number" min="0" value={l} onChange={e => setL(e.target.value)} /></div><div><span className="mu">Each -$</span><input type="number" step="0.01" value={loss} onChange={e => setLoss(e.target.value)} /></div></div>
    <p>Net: <b className={net >= 0 ? 'pos' : 'neg'}>{net >= 0 ? '+' : '-'}${Math.abs(net).toFixed(2)}</b> across {nW + nL} positions</p><button onClick={save}>Save batch</button><p className="mu">{msg}</p></div>
}
