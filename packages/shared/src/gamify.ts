import { Trade } from './index'
export interface Badge { id: string; icon: string; name: string; desc: string }
export const BADGES: Badge[] = [
  { id: 'first', icon: '🎯', name: 'First Pip', desc: 'Log your first trade' },
  { id: 'streak3', icon: '🔥', name: 'Heating Up', desc: '3 wins in a row' },
  { id: 'streak10', icon: '⚡', name: 'Unstoppable', desc: '10 wins in a row' },
  { id: 'lesson', icon: '🧠', name: 'Student of the Game', desc: 'Write a lesson on a loss' },
  { id: 'j10', icon: '📓', name: 'Journaler', desc: '10 trades with notes' },
  { id: 'days7', icon: '📅', name: 'Week Warrior', desc: '7-day logging streak' },
  { id: 'c1', icon: '🏁', name: 'Catch 1', desc: 'Reach $160 equity' },
  { id: 'mood', icon: '🪞', name: 'Self-Aware', desc: 'Tag your mood on 10 trades' },
  { id: 'cycle', icon: '💰', name: 'Cycle Complete', desc: 'Finish a full cycle' }]
export const extra = { days: [] as string[] } // skip-days (a day you chose not to trade) count toward streak + XP
const day = (s: string) => Math.floor(new Date(s + 'T00:00:00Z').getTime() / 864e5)
export function gameStats(trades: Trade[], cyclesDone: number, peakEquity: number) {
  const t = [...trades].sort((a, b) => a.ts - b.ts)
  let ws = 0, best = 0; for (const x of t) { ws = x.pl > 0 ? ws + 1 : 0; best = Math.max(best, ws) }
  const days = [...new Set([...t.map(x => x.date), ...extra.days])].map(day).sort((a, b) => a - b)
  let streak = 0; const n0 = new Date(), today = day(`${n0.getFullYear()}-${String(n0.getMonth() + 1).padStart(2, '0')}-${String(n0.getDate()).padStart(2, '0')}`)
  if (days.length && today - days[days.length - 1] <= 1) { streak = 1; for (let i = days.length - 1; i > 0 && days[i] - days[i - 1] === 1; i--) streak++ }
  let bestDays = 0, run = 0; days.forEach((d, i) => { run = i && d - days[i - 1] === 1 ? run + 1 : 1; bestDays = Math.max(bestDays, run) })
  const noted = t.filter(x => (x.lesson || '').trim()).length
  const lossNote = t.some(x => x.pl < 0 && (x.lesson || '').trim())
  const xp = extra.days.length * 10 + t.length * 10 + t.filter(x => x.pl > 0).length * 5 + noted * 15 + cyclesDone * 200
  const level = Math.floor(Math.sqrt(xp / 50)) + 1, floor = (level - 1) ** 2 * 50, ceil = level ** 2 * 50
  const got = new Set<string>(); if (t.length) got.add('first'); if (best >= 3) got.add('streak3'); if (best >= 10) got.add('streak10')
  if (lossNote) got.add('lesson'); if (noted >= 10) got.add('j10'); if (bestDays >= 7) got.add('days7'); if (peakEquity >= 160) got.add('c1'); if (cyclesDone >= 1) got.add('cycle'); if (t.filter(x => x.x?.Mood).length >= 10) got.add('mood')
  return { xp, level, progress: (xp - floor) / (ceil - floor), winStreak: ws, streak, badges: BADGES.map(b => ({ ...b, got: got.has(b.id) })) }
}
