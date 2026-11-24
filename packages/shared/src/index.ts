export type Model = 'CRT' | 'Unicorn' | 'CRT+Unicorn' | 'Other'
export type SlotKey = 'B' | '1A' | '1B' | '2A' | '2B'
export interface Trade { id: string; ts: number; date: string; cycle: number; pair: string; side: 'BUY' | 'SELL'; model: Model; tf: string; slot: SlotKey; pl: number; lesson?: string; x?: Record<string, string> }
export interface Lesson { id: string; title: string; cat?: string; body: string; ts: number }
export interface Template { id: string; name: string; fields: string[]; checks: string[]; ts: number }
export interface Account { base: number; cycle: number; hist: { cycle: number; date: string; n: number; w: number }[] }
export const MARGIN = 4
// Plan: C1 10x$8 then 10x$4 (40->160); C2 40x$4 then 40x$8 (160->640); withdraw 600.
export const SLOTS: { k: SlotKey; l: string; n: number; tp: number }[] = [
  { k: 'B', l: 'Build to $40', n: 0, tp: 0 },
  { k: '1A', l: 'C1 · Entry 1', n: 10, tp: 8 },
  { k: '1B', l: 'C1 · Entry 2', n: 10, tp: 4 },
  { k: '2A', l: 'C2 · Entry 1', n: 40, tp: 4 },
  { k: '2B', l: 'C2 · Entry 2', n: 40, tp: 8 }]
// Demo-account trades are journaled and counted in stats, but never change live cycle equity or progress.
export const cycleTrades = (a: Account, t: Trade[]) => t.filter(x => (x.cycle || 1) === a.cycle && x.x?.Account !== 'Demo')
export const equity = (a: Account, t: Trade[]) => a.base + cycleTrades(a, t).reduce((s, x) => s + x.pl, 0)
export const nextBatch = (e: number) => Math.floor(Math.max(e, 0) / MARGIN)
export const milestone = (e: number) => e >= 160 ? { from: 160, to: 640 } : e >= 40 ? { from: 40, to: 160 } : { from: 0, to: 40 }
export function suggestSlot(a: Account, t: Trade[]): SlotKey {
  const c = cycleTrades(a, t); if (equity(a, t) < 40) return 'B'
  for (const s of SLOTS.slice(1)) if (c.filter(x => x.slot === s.k).length < s.n) return s.k
  return '2B'
}
export function groupStats(t: Trade[], k: keyof Trade) {
  const o: Record<string, { n: number; w: number; pl: number }> = {}
  t.forEach(x => { const g = String(x[k] ?? '?'); o[g] ??= { n: 0, w: 0, pl: 0 }; o[g].n++; o[g].w += x.pl > 0 ? 1 : 0; o[g].pl += x.pl })
  return o
}
export * from './gamify'
export const localDate = (d = new Date()) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
export function equitySeries(a: Account, t: Trade[]) { let e = a.base; return [a.base, ...cycleTrades(a, t).sort((x, y) => x.ts - y.ts).map(x => (e += x.pl))] }
export function maxDrawdown(s: number[]) { let p = s[0] ?? 0, d = 0; for (const v of s) { p = Math.max(p, v); d = Math.max(d, p - v) } return d }
export function tilt(t: Trade[]) { const s = [...t].sort((a, b) => a.ts - b.ts); let n = 0; for (let i = s.length - 1; i >= 0 && s[i].pl < 0; i--) n++; return n }
export function expectancy(t: Trade[]) {
  const w = t.filter(x => x.pl > 0), l = t.filter(x => x.pl <= 0), n = t.length || 1
  const aw = w.length ? w.reduce((s, x) => s + x.pl, 0) / w.length : 0, al = l.length ? l.reduce((s, x) => s + x.pl, 0) / l.length : 0
  return { n: t.length, wr: w.length / n, aw, al, exp: (w.length / n) * aw + (l.length / n) * al, breakeven: aw - al > 0 ? -al / (aw - al) : 0 }
}
export const MOODS = [{ k: 'calm', e: '😌' }, { k: 'confident', e: '😎' }, { k: 'fomo', e: '😬' }, { k: 'revenge', e: '😤' }, { k: 'bored', e: '🥱' }, { k: 'tired', e: '😴' }]
export interface DayPlan { bias: string; maxTrades: number; maxLoss: number; mood: string; note: string; ts: number; skip?: boolean }
export function discipline(t: Trade[]) {
  const l = t.filter(x => x.pl < 0), ln = l.filter(x => (x.lesson || '').trim()).length
  const c = t.filter(x => x.x?.['✔ Checklist']), full = c.filter(x => { const [a, b] = String(x.x!['✔ Checklist']).split('/').map(Number); return a === b }).length
  const p: number[] = []; if (l.length) p.push(ln / l.length); if (c.length) p.push(full / c.length)
  return p.length ? Math.round(100 * p.reduce((a, b) => a + b, 0) / p.length) : null
}
export function dayPnl(t: Trade[]) { const o: Record<string, number> = {}; t.forEach(x => { o[x.date] = (o[x.date] || 0) + x.pl }); return o }
export function limits(plan: DayPlan | null, todays: Trade[]) {
  const pnl = todays.reduce((s, x) => s + x.pl, 0), used = Math.max(0, -pnl)
  return { n: todays.length, used, hit: !!plan && (plan.skip ? todays.length >= 1 : todays.length >= plan.maxTrades || used >= plan.maxLoss) }
}
export type Face = 'happy' | 'chill' | 'worried' | 'hype'
export function pipSays(o: { hasPlan: boolean; losses: number; pnl: number; n: number; streak: number; winStreak: number; hit: boolean }): { face: Face; text: string } {
  if (o.hit) return { face: 'worried', text: "Daily limit reached. Close the charts. Protecting the account IS the win today." }
  if (o.losses >= 2) return { face: 'worried', text: `${o.losses} losses in a row. Breathe, walk away 15 minutes. Revenge trades are expensive.` }
  if (!o.hasPlan && o.n === 0) return { face: 'chill', text: "Morning, partner. 60 seconds: set today's plan before the first trade." }
  if (o.winStreak >= 3) return { face: 'hype', text: `${o.winStreak} wins in a row! Stay boring. Same size, same rules.` }
  if (o.pnl > 0) return { face: 'happy', text: "Green day so far. Log what worked while it's fresh." }
  if (o.streak >= 3) return { face: 'happy', text: `${o.streak}-day logging streak. Consistency beats cleverness.` }
  return { face: 'chill', text: o.n ? 'Steady. Wait for the next clean setup.' : 'Ready when you are. Quality over quantity.' }
}
