import { useEffect, useState } from 'react'
import { doc, onSnapshot, setDoc } from 'firebase/firestore'
import { db } from './firebase'
export const MISTAKES = ['FOMO entry', 'Early exit', 'Moved stop', 'Oversized', 'Broke plan', 'Skipped checklist', 'Revenge', 'Late entry']
export function useRules(base: string) {
  const [r, setR] = useState<string[]>([])
  useEffect(() => onSnapshot(doc(db, `${base}/meta/rules`), s => setR(s.exists() ? ((s.data()!.items as string[]) || []) : []), () => {}), [base])
  return r
}
export function ThemeCard() {
  const [t, setT] = useState(localStorage.getItem('theme') || '')
  const set = (v: string) => { setT(v); localStorage.setItem('theme', v); document.documentElement.dataset.theme = v }
  return <div className="c"><h3>🎨 Theme</h3><div className="row" style={{ justifyContent: 'flex-start' }}>{[['', 'Auto'], ['light', 'Light'], ['dark', 'Dark']].map(([k, l]) => <button key={k} className={t === k ? '' : 'alt'} style={{ width: 'auto' }} onClick={() => set(k)}>{l}</button>)}</div></div>
}
export function RulesBar({ base }: { base: string }) {
  const r = useRules(base), [open, setOpen] = useState(false)
  if (!r.length) return null
  return <div className="c"><div className="row"><b>📜 My rules ({r.length})</b><button className="alt" onClick={() => setOpen(!open)}>{open ? 'Hide' : 'Review before trading'}</button></div>{open && <ol style={{ margin: '8px 0 0', paddingLeft: 20 }}>{r.map((x, i) => <li key={i}>{x}</li>)}</ol>}</div>
}
export function RulesCard({ base }: { base: string }) {
  const r = useRules(base), [t, setT] = useState(''), [ok, setOk] = useState(false)
  useEffect(() => { if (!ok) setT(r.join('\n')) }, [r.join('|')])
  const save = async () => { await setDoc(doc(db, `${base}/meta/rules`), { items: t.split('\n').map(x => x.trim().slice(0, 120)).filter(Boolean).slice(0, 10) }); setOk(true); setTimeout(() => setOk(false), 1500) }
  return <div className="c"><h3>📜 My trading rules</h3><p className="mu">Up to 10, one per line. Shown on your Desk and used by the Coach to call out which ones you break.</p><textarea style={{ minHeight: 120 }} value={t} onChange={e => setT(e.target.value)} placeholder={'Only trade after a C2 sweep closes back inside\nNever more than 2 losses a day'} /><br /><br /><button onClick={save}>{ok ? 'Saved ✅' : 'Save rules'}</button></div>
}
export function useSetups(base: string) {
  const [r, setR] = useState<string[]>([])
  useEffect(() => onSnapshot(doc(db, `${base}/meta/setups`), s => setR(s.exists() ? ((s.data()!.items as string[]) || []) : []), () => {}), [base])
  return r
}
// Playbook: your named setups (e.g. "CRT H1 sweep", "Unicorn M5"). Tag trades with one; Stats shows which setup actually pays.
export function SetupsCard({ base }: { base: string }) {
  const r = useSetups(base), [t, setT] = useState(''), [ok, setOk] = useState(false)
  useEffect(() => { if (!ok) setT(r.join('\n')) }, [r.join('|')])
  const save = async () => { await setDoc(doc(db, `${base}/meta/setups`), { items: [...new Set(t.split('\n').map(x => x.trim().slice(0, 40)).filter(Boolean))].slice(0, 20) }); setOk(true); setTimeout(() => setOk(false), 1500) }
  return <div className="c"><h3>📘 My playbook</h3><p className="mu">Your named setups, one per line (max 20). Pick one on each trade, then Stats shows which setup earns.</p><textarea style={{ minHeight: 100 }} value={t} onChange={e => setT(e.target.value)} placeholder={'CRT H1 sweep\nUnicorn M5\nCRT + FVG retest'} /><br /><br /><button onClick={save}>{ok ? 'Saved ✅' : 'Save playbook'}</button></div>
}

export function OfflineBanner() {
  const [on, setOn] = useState(navigator.onLine)
  useEffect(() => { const f = () => setOn(navigator.onLine); addEventListener('online', f); addEventListener('offline', f); return () => { removeEventListener('online', f); removeEventListener('offline', f) } }, [])
  return on ? null : <div className="c" style={{ borderColor: 'var(--am)' }}>📴 Offline. Trades are saved on this phone and sync when you reconnect.</div>
}

export function ComfortCard() {
  const [fs, setFs] = useState(localStorage.getItem('fs') || '1'), [hap, setHap] = useState(!localStorage.getItem('nohaptic'))
  const setScale = (v: string) => { setFs(v); localStorage.setItem('fs', v); document.documentElement.style.setProperty('--fs', v) }
  return <div className="c"><h3>🔤 Comfort</h3><div className="row" style={{ justifyContent: 'flex-start' }}><span className="mu">Text size:</span>{[['0.9', 'S'], ['1', 'M'], ['1.15', 'L'], ['1.3', 'XL']].map(([k, l]) => <button key={k} className={fs === k ? '' : 'alt'} style={{ width: 'auto' }} onClick={() => setScale(k)}>{l}</button>)}</div><br />
    <label className="row"><span>Vibration feedback</span><input type="checkbox" style={{ width: 'auto' }} checked={hap} onChange={e => { setHap(e.target.checked); if (e.target.checked) localStorage.removeItem('nohaptic'); else localStorage.setItem('nohaptic', '1') }} /></label></div>
}
