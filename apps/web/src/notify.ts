import { Capacitor } from '@capacitor/core'
import { LocalNotifications } from '@capacitor/local-notifications'
import { PushNotifications } from '@capacitor/push-notifications'
import { doc, setDoc } from 'firebase/firestore'
import { db } from './firebase'
export const native = Capacitor.isNativePlatform()
export interface RemPrefs { on: boolean; plan: string; debrief: string; saver: string; custom: string; customLabel: string; weekdaysOnly: boolean; push: boolean }
export const DEF: RemPrefs = { on: false, plan: '08:00', debrief: '20:00', saver: '21:00', custom: '', customLabel: '', weekdaysOnly: true, push: false }
export const loadPrefs = (): RemPrefs => { try { return { ...DEF, ...JSON.parse(localStorage.getItem('rem') || '{}') } } catch { return DEF } }
export const savePrefs = (p: RemPrefs) => localStorage.setItem('rem', JSON.stringify(p))
export const askPermission = async () => (await LocalNotifications.requestPermissions()).display === 'granted'
// Local reminders: scheduled on-device for the next 14 days (work offline, no server, free). Re-run on app open and after each trade.
export async function reschedule(loggedToday: boolean, test = false) {
  if (!native) return
  const p = loadPrefs(), pend = await LocalNotifications.getPending()
  if (pend.notifications.length) await LocalNotifications.cancel({ notifications: pend.notifications })
  if (test) return void (await LocalNotifications.schedule({ notifications: [{ id: 999, title: '✅ PipTrail reminders work', body: 'You will get your reminders at the times you set.', schedule: { at: new Date(Date.now() + 5000), allowWhileIdle: true } }] }))
  if (!p.on) return
  const list: any[] = [], now = new Date()
  const add = (base: number, t: string, title: string, body: string, d: number) => {
    if (!t) return; const [h, m] = t.split(':').map(Number), at = new Date(now.getFullYear(), now.getMonth(), now.getDate() + d, h, m, 0)
    if (at <= now || (p.weekdaysOnly && [0, 6].includes(at.getDay()))) return
    list.push({ id: base + d, title, body, schedule: { at, allowWhileIdle: true } })
  }
  for (let d = 0; d < 14; d++) {
    add(100, p.plan, "📋 Set today's plan", '60 seconds: bias, limits, mood. Then trade.', d)
    add(200, p.debrief, '🧠 Debrief time', 'Log your trades and write one lesson.', d)
    if (!(d === 0 && loggedToday)) add(300, p.saver, '🔥 Protect your streak', 'No trade logged today. Keep the streak alive.', d)
    add(400, p.custom, p.customLabel || '⏰ PipTrail reminder', 'Tap to open PipTrail', d)
  }
  if (list.length) await LocalNotifications.schedule({ notifications: list })
}
// Push (FCM): device token saved to Firestore so the admin portal can broadcast announcements/alerts.
export async function registerPush(uid: string) {
  if (!native) return false
  const r = await PushNotifications.requestPermissions(); if (r.receive !== 'granted') return false
  await PushNotifications.removeAllListeners()
  await PushNotifications.addListener('registration', t => { setDoc(doc(db, 'devices', t.value), { uid, ts: Date.now() }).catch(() => {}) })
  await PushNotifications.register(); return true
}
