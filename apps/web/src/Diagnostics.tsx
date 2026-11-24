import { useState } from 'react'
import { doc, getDoc } from 'firebase/firestore'
import { User } from 'firebase/auth'
import { Stethoscope } from 'lucide-react'
import { db } from './firebase'
import { native } from './notify'
export const APP_VERSION = 'v9'
const API = import.meta.env.VITE_API_BASE || ''
// Self-check to find setup problems fast: shows what works and what does not, and copies a report you can send for help.
export default function Diagnostics({ u }: { u: User }) {
  const [rows, setRows] = useState<[boolean, string, string][]>([]), [busy, setBusy] = useState(false)
  const run = async () => {
    setBusy(true); const r: [boolean, string, string][] = []
    r.push([!!import.meta.env.VITE_FB_PROJECT_ID && !!import.meta.env.VITE_FB_API_KEY, 'Firebase config in build', import.meta.env.VITE_FB_PROJECT_ID || 'MISSING (check GitHub secrets)'])
    r.push([u.emailVerified, 'Email verified', u.email || ''])
    try { await getDoc(doc(db, `users/${u.uid}/meta/acct`)); r.push([true, 'Database: read my data', 'ok']) } catch (e: any) { r.push([false, 'Database: read my data', e.code || String(e)]) }
    try { await getDoc(doc(db, 'config', 'billing')); r.push([true, 'Database: shared config', 'ok']) } catch (e: any) { r.push([false, 'Database: shared config', (e.code || String(e)) + ' (deploy the Firestore rules)']) }
    try {
      const x = await fetch(API + '/api/coach', { method: 'POST', headers: { 'content-type': 'application/json', authorization: 'Bearer ' + await u.getIdToken() }, body: '{}' })
      const j = await x.json().catch(() => ({}))
      r.push([x.status === 400, 'AI coach endpoint', x.status === 400 ? 'reachable, login accepted' : x.status === 401 ? '401: FIREBASE_PROJECT_ID mismatch or email unverified' : x.status === 403 ? '403: origin not allowed' : `status ${x.status} ${j.error || ''}`])
    } catch { r.push([false, 'AI coach endpoint', 'unreachable (check VITE_API_BASE and the web deploy)']) }
    r.push([true, 'Platform', (native ? 'Android app' : 'Web') + ' · ' + APP_VERSION + ' · ' + (navigator.onLine ? 'online' : 'offline')])
    setRows(r); setBusy(false)
  }
  const report = rows.map(x => `${x[0] ? 'OK  ' : 'FAIL'} ${x[1]}: ${x[2]}`).join('\n')
  return <div className="c"><h3><Stethoscope size={16} /> Diagnostics</h3><p className="mu">Checks your setup. If something fails, copy the report and send it for help.</p>
    <button className="alt" disabled={busy} onClick={run}>{busy ? 'Checking…' : 'Run checks'}</button>
    {rows.map(x => <div key={x[1]} className="row" style={{ padding: '4px 0' }}><span>{x[0] ? '✅' : '❌'} {x[1]}</span><span className="mu">{x[2]}</span></div>)}
    {rows.length > 0 && <><br /><button className="alt" onClick={() => navigator.clipboard?.writeText(report)}>Copy report</button></>}</div>
}
