import { useEffect, useState } from 'react'
import { collection, deleteDoc, doc, getDoc, onSnapshot, setDoc } from 'firebase/firestore'
import { Share2, Copy, UserPlus, X } from 'lucide-react'
import { User } from 'firebase/auth'
import { db } from './firebase'
import { Trade, Account, gameStats, discipline, expectancy } from '@piptrail/shared'
const newCode = () => Array.from(crypto.getRandomValues(new Uint8Array(12)), b => 'abcdefghjkmnpqrstuvwxyz23456789'[b % 31]).join('')
type Card = { nick: string; level: number; xp: number; streak: number; winRate: number; discipline: number; trades: number; ts: number } | null
export default function Crew({ u, base, trades, a, pro }: { u: User; base: string; trades: Trade[]; a: Account; pro: boolean }) {
  const [pf, setPf] = useState<{ nick: string; shareCode: string; sharing: boolean }>({ nick: '', shareCode: '', sharing: false }), [nick, setNick] = useState('')
  const [partners, setPartners] = useState<{ id: string; nick: string }[]>([]), [cards, setCards] = useState<Record<string, Card>>({}), [add, setAdd] = useState(''), [msg, setMsg] = useState('')
  useEffect(() => onSnapshot(doc(db, `${base}/meta/prefs`), s => { if (s.exists()) { const d = s.data() as any; setPf(d); setNick(n => n || d.nick) } }), [base])
  useEffect(() => onSnapshot(collection(db, `${base}/partners`), s => setPartners(s.docs.map(d => ({ id: d.id, ...d.data() }) as any))), [base])
  const ids = partners.map(p => p.id).join()
  useEffect(() => { const un = partners.map(p => onSnapshot(doc(db, 'shares', p.id), s => setCards(c => ({ ...c, [p.id]: s.exists() ? (s.data() as any) : null })), () => {})); return () => un.forEach(f => f()) }, [ids])
  const g = gameStats(trades, a.hist.length, 0), d = discipline(trades), ex = expectancy(trades)
  const mine: Card = { nick: pf.nick || 'You', level: g.level, xp: g.xp, streak: g.streak, winRate: Math.round(ex.wr * 100), discipline: d ?? -1, trades: trades.length, ts: Date.now() }
  useEffect(() => { if (pf.sharing && pf.shareCode) setDoc(doc(db, 'shares', pf.shareCode), { owner: u.uid, nick: pf.nick, level: g.level, xp: g.xp, streak: g.streak, winStreak: g.winStreak, winRate: mine!.winRate, trades: trades.length, discipline: mine!.discipline, ts: Date.now() }).catch(() => {}) }, [pf.sharing, pf.shareCode, pf.nick, trades.length, g.xp])
  const start = async () => { if (!nick.trim()) return setMsg('Pick a nickname first.'); await setDoc(doc(db, `${base}/meta/prefs`), { nick: nick.trim().slice(0, 20), shareCode: pf.shareCode || newCode(), sharing: true }); setMsg('') }
  const stop = async () => { if (pf.shareCode) await deleteDoc(doc(db, 'shares', pf.shareCode)).catch(() => {}); await setDoc(doc(db, `${base}/meta/prefs`), { nick: pf.nick, shareCode: '', sharing: false }) }
  const follow = async () => {
    const c = add.trim().toLowerCase(); if (!/^[a-z0-9]{12}$/.test(c)) return setMsg('Codes are 12 letters/numbers.')
    const s = await getDoc(doc(db, 'shares', c)).catch(() => null); const v: any = s?.data()
    if (!v || v.owner === u.uid) return setMsg('Code not found.')
    if (!pro && partners.length >= 2) return setMsg('Free plan: 2 partners. Upgrade to Pro for more.')
    await setDoc(doc(db, `${base}/partners/${c}`), { nick: String(v.nick).slice(0, 20), ts: Date.now() }); setAdd(''); setMsg('Partner added 🤝')
  }
  const board = [{ id: 'me', ...mine! }, ...partners.map(p => ({ id: p.id, ...(cards[p.id] || { nick: p.nick, level: 0, xp: 0, streak: 0, winRate: 0, discipline: -1, trades: 0, ts: 0 }) }))].sort((x, y) => y.xp - x.xp)
  return <>
    <div className="c"><h3>🤝 Crew board</h3>{board.map((r, i) => <div key={r.id} className="row" style={{ padding: '6px 0', borderTop: '1px solid var(--bd)' }}><span>{['🥇', '🥈', '🥉'][i] || i + 1 + '.'} <b>{r.id === 'me' ? 'You' : r.nick}</b> <span className="chip">Lv {r.level}</span></span>
      <span className="mu">🔥{r.streak}d · {r.winRate}% · discipline {r.discipline < 0 ? '–' : r.discipline} {r.id !== 'me' && <button className="alt" onClick={() => deleteDoc(doc(db, `${base}/partners/${r.id}`))} aria-label="Remove"><X size={12} /></button>}</span></div>)}
      <p className="mu">Partners only see level, streak, win rate, discipline and trade count. Never equity, pairs or notes.</p></div>
    <div className="c"><h3>Follow a partner</h3><div className="row" style={{ flexWrap: 'nowrap' }}><input placeholder="Partner's 12-character code" value={add} onChange={e => setAdd(e.target.value)} /><button style={{ width: 'auto' }} onClick={follow}><UserPlus size={16} /></button></div></div>
    <div className="c"><h3>Share my stats</h3>{pf.sharing ? <><p>Your code: <b style={{ letterSpacing: 1 }}>{pf.shareCode}</b> <button className="alt" onClick={() => navigator.clipboard?.writeText(pf.shareCode).then(() => setMsg('Copied'))}><Copy size={14} /></button></p><button className="alt" onClick={stop}>Stop sharing (revokes code)</button></>
      : <><input placeholder="Nickname (shown to partners)" maxLength={20} value={nick} onChange={e => setNick(e.target.value)} /><br /><br /><button onClick={start}><Share2 size={16} /> Start sharing</button></>}<p className="mu">{msg}</p></div></>
}
