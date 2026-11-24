import { useState } from 'react'
import { Bell } from 'lucide-react'
import { User } from 'firebase/auth'
import { native, loadPrefs, savePrefs, askPermission, reschedule, registerPush, RemPrefs } from './notify'
export default function Reminders({ u, loggedToday }: { u: User; loggedToday: boolean }) {
  const [p, setP] = useState<RemPrefs>(loadPrefs()), [msg, setMsg] = useState('')
  if (!native) return <div className="c"><h3><Bell size={16} /> Reminders & push</h3><p className="mu">Phone reminders and push alerts work in the Android app. Install the APK to turn them on.</p></div>
  const set = async (n: RemPrefs) => {
    setP(n); savePrefs(n)
    if (n.on && !(await askPermission())) { setMsg('Notifications are blocked in Android settings.'); return }
    await reschedule(loggedToday); setMsg('Saved ✅')
  }
  const T = ({ k, l }: { k: 'plan' | 'debrief' | 'saver'; l: string }) => <div className="row" style={{ padding: '4px 0' }}><span>{l}</span><input type="time" style={{ width: 120 }} value={p[k]} onChange={e => set({ ...p, [k]: e.target.value })} /></div>
  return <div className="c"><h3><Bell size={16} /> Reminders & push</h3>
    <label className="row"><span>Daily reminders</span><input type="checkbox" style={{ width: 'auto' }} checked={p.on} onChange={e => set({ ...p, on: e.target.checked })} /></label>
    {p.on && <><T k="plan" l="📋 Plan the day" /><T k="debrief" l="🧠 Debrief" /><T k="saver" l="🔥 Streak saver (skips if you logged)" />
      <div className="row" style={{ padding: '4px 0' }}><input placeholder="Custom label" maxLength={40} value={p.customLabel} onChange={e => setP({ ...p, customLabel: e.target.value })} onBlur={() => set(p)} /><input type="time" style={{ width: 120 }} value={p.custom} onChange={e => set({ ...p, custom: e.target.value })} /></div>
      <label className="row"><span>Weekdays only</span><input type="checkbox" style={{ width: 'auto' }} checked={p.weekdaysOnly} onChange={e => set({ ...p, weekdaysOnly: e.target.checked })} /></label>
      <button className="alt" onClick={() => reschedule(loggedToday, true).then(() => setMsg('Test arrives in 5 seconds'))}>Send test reminder</button><br /><br /></>}
    <label className="row"><span>Push alerts from PipTrail</span><input type="checkbox" style={{ width: 'auto' }} checked={p.push} onChange={async e => { const on = e.target.checked, ok = on ? await registerPush(u.uid) : false; const n = { ...p, push: ok }; setP(n); savePrefs(n); setMsg(on && !ok ? 'Permission denied.' : 'Saved ✅') }} /></label>
    <p className="mu">{msg}</p></div>
}
