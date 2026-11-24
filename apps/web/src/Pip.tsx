import { Trade, DayPlan, limits, pipSays, Face } from '@piptrail/shared'
const MOUTH: Record<Face, string> = { happy: 'M18 36 Q28 46 38 36', chill: 'M20 38 H36', worried: 'M18 43 Q28 33 38 43', hype: 'M16 33 Q28 54 40 33 Z' }
export function Pip({ face, size = 58 }: { face: Face; size?: number }) {
  return <svg width={size} height={size} viewBox="0 0 56 56" aria-label={'Pip looks ' + face}><rect x="3" y="6" width="50" height="46" rx="18" fill="#14D69A" /><circle cx="20" cy="24" r="4.2" fill="#0A0F1E" /><circle cx="36" cy="24" r="4.2" fill="#0A0F1E" />
    <path d={MOUTH[face]} fill={face === 'hype' ? '#0A0F1E' : 'none'} stroke="#0A0F1E" strokeWidth="3" strokeLinecap="round" /><circle cx="28" cy="4" r="3.5" fill="#FFB020" /><line x1="28" y1="7" x2="28" y2="10" stroke="#0A0F1E" strokeWidth="2" />{face === 'hype' && <text x="42" y="16" fontSize="12">✨</text>}</svg>
}
export function PartnerCard({ trades, plan, g }: { trades: Trade[]; plan: DayPlan | null; g: { streak: number; winStreak: number } }) {
  const todays = trades.filter(t => t.date === new Date().toLocaleDateString('en-CA'))
  let losses = 0; for (let i = todays.length - 1; i >= 0 && todays[i].pl < 0; i--) losses++
  const lim = limits(plan, todays), s = pipSays({ hasPlan: !!plan, losses, pnl: todays.reduce((a, t) => a + t.pl, 0), n: todays.length, streak: g.streak, winStreak: g.winStreak, hit: lim.hit })
  return <div className="c row" style={{ flexWrap: 'nowrap', justifyContent: 'flex-start' }}><Pip face={s.face} /><div><b>Pip</b> <span className="mu">your trade partner</span><div>{s.text}</div></div></div>
}
