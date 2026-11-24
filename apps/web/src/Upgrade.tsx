import { useEffect, useState } from 'react'
import { doc, onSnapshot, setDoc } from 'firebase/firestore'
import { User } from 'firebase/auth'
import { Crown } from 'lucide-react'
import { db } from './firebase'
export interface Pro { active: boolean; until: number }
export function usePro(uid: string): Pro {
  const [until, setUntil] = useState(0)
  useEffect(() => onSnapshot(doc(db, 'pro', uid), s => setUntil(s.exists() ? Number(s.data()!.until) || 0 : 0), () => {}), [uid])
  return { active: until > Date.now(), until }
}
export const FREE_COACH = 5, FREE_PARTNERS = 2
export default function Upgrade({ u, pro }: { u: User; pro: Pro }) {
  const [cfg, setCfg] = useState<{ price?: string; text?: string }>({}), [plan, setPlan] = useState('1 month'), [note, setNote] = useState(''), [sent, setSent] = useState(!!localStorage.getItem('paySent'))
  useEffect(() => onSnapshot(doc(db, 'config', 'billing'), s => setCfg((s.data() as any) || {}), () => {}), [])
  const ref = u.uid.slice(0, 8).toUpperCase()
  const pay = async () => { await setDoc(doc(db, 'payments', 'p' + Date.now() + ref), { uid: u.uid, ref, note: note.slice(0, 60), plan, status: 'pending', ts: Date.now() }); localStorage.setItem('paySent', '1'); setSent(true) }
  if (pro.active) return <div className="c"><h3><Crown size={16} color="#FFB020" /> PipTrail Pro</h3><p>Active until <b>{new Date(pro.until).toLocaleDateString()}</b>. No ads, unlimited coach, unlimited partners.</p></div>
  return <div className="c"><h3><Crown size={16} color="#FFB020" /> Go Pro {cfg.price && <span className="chip">{cfg.price}</span>}</h3>
    <p className="mu">Free: {FREE_COACH} coach questions/day, {FREE_PARTNERS} partners, small ads on the Android app. Pro removes all limits and ads.</p>
    <p style={{ whiteSpace: 'pre-wrap' }}>{cfg.text || 'Payment details coming soon.'}</p><p>Your payment reference: <b style={{ letterSpacing: 1 }}>{ref}</b></p>
    {sent ? <p className="pos">Payment request sent. You'll be upgraded once it's confirmed.</p> : cfg.text && <><div className="grid"><select value={plan} onChange={e => setPlan(e.target.value)}><option>1 month</option><option>3 months</option><option>12 months</option></select><input placeholder="Name/number you paid from" maxLength={60} value={note} onChange={e => setNote(e.target.value)} /></div><br /><button onClick={pay}>I've paid</button></>}</div>
}
