import { ReactNode, useEffect, useState } from 'react'
import { signOut } from 'firebase/auth'
import { Lock } from 'lucide-react'
import { auth } from './firebase'
const H = async (p: string, s: string) => Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(s + p)))).map(b => b.toString(16).padStart(2, '0')).join('')
// App lock: PIN stored only as a salted hash on this device. Locks on open and after 30s in the background. 5 wrong tries signs you out.
export function LockGate({ children }: { children: ReactNode }) {
  const [locked, setLocked] = useState(!!localStorage.getItem('pinh')), [v, setV] = useState(''), [err, setErr] = useState('')
  useEffect(() => { let t = 0; const f = () => { if (document.hidden) t = Date.now(); else if (localStorage.getItem('pinh') && Date.now() - t > 30000 && t) setLocked(true) }; document.addEventListener('visibilitychange', f); return () => document.removeEventListener('visibilitychange', f) }, [])
  if (!locked) return <>{children}</>
  const go = async () => {
    if (await H(v, localStorage.getItem('pins') || '') === localStorage.getItem('pinh')) { localStorage.setItem('tries', '0'); setV(''); setErr(''); return setLocked(false) }
    const n = +(localStorage.getItem('tries') || 0) + 1; localStorage.setItem('tries', String(n)); setV('')
    if (n >= 5) { localStorage.removeItem('pinh'); localStorage.removeItem('pins'); localStorage.setItem('tries', '0'); await signOut(auth); setLocked(false) } else setErr(`Wrong PIN. ${5 - n} tries left.`)
  }
  return <div className="w"><div className="c" style={{ textAlign: 'center', marginTop: 60 }}><Lock size={36} /><h3>PipTrail is locked</h3><input type="password" inputMode="numeric" autoFocus placeholder="PIN" value={v} onChange={e => setV(e.target.value.replace(/\D/g, '').slice(0, 8))} onKeyDown={e => e.key === 'Enter' && go()} style={{ textAlign: 'center', fontSize: 22 }} /><br /><br /><button onClick={go}>Unlock</button><p className="neg">{err}</p><button className="alt" onClick={() => signOut(auth)}>Forgot PIN? Sign out</button></div></div>
}
export function LockCard() {
  const [on, setOn] = useState(!!localStorage.getItem('pinh')), [p, setP] = useState(''), [msg, setMsg] = useState('')
  const set = async () => { if (p.length < 4) return setMsg('Use 4 to 8 digits.'); const s = crypto.randomUUID(); localStorage.setItem('pins', s); localStorage.setItem('pinh', await H(p, s)); setOn(true); setP(''); setMsg('PIN set ✅') }
  return <div className="c"><h3><Lock size={16} /> App lock</h3>{on ? <><p className="mu">PIN lock is on (this device only).</p><button className="alt" onClick={() => { localStorage.removeItem('pinh'); localStorage.removeItem('pins'); setOn(false) }}>Remove PIN</button></> : <div className="row" style={{ flexWrap: 'nowrap' }}><input type="password" inputMode="numeric" placeholder="New PIN (4-8 digits)" value={p} onChange={e => setP(e.target.value.replace(/\D/g, '').slice(0, 8))} /><button style={{ width: 'auto' }} onClick={set}>Set</button></div>}<p className="mu">{msg}</p></div>
}
