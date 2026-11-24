import { useState } from 'react'
import { Tools, Weekly, MarginCheck } from './Tools'
import Goals from './Goals'
import ShareCard from './Share'
import Challenges from './Challenges'
import ReviewCard from './Review'
import { Account, Trade, SLOTS, cycleTrades, equitySeries, maxDrawdown, expectancy, groupStats, dayPnl, discipline, gameStats } from '@piptrail/shared'
const money = (n: number) => (n < 0 ? '-' : '') + '$' + Math.abs(n).toFixed(2)
function Curve({ s }: { s: number[] }) {
  if (s.length < 2) return <p className="mu">Log trades to draw your equity curve.</p>
  const W = 300, H = 110, lo = Math.min(...s), hi = Math.max(...s), r = hi - lo || 1
  const pts = s.map((v, i) => [(i / (s.length - 1)) * W, H - 8 - ((v - lo) / r) * (H - 16)])
  const line = pts.map(p => p.join(',')).join(' ')
  return <svg viewBox={`0 0 ${W} ${H}`} width="100%" role="img" aria-label="Equity curve"><defs><linearGradient id="g" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stopColor="#14D69A" stopOpacity=".35" /><stop offset="1" stopColor="#14D69A" stopOpacity="0" /></linearGradient></defs>
    <polygon points={`0,${H} ${line} ${W},${H}`} fill="url(#g)" /><polyline points={line} fill="none" stroke="#14D69A" strokeWidth="2.5" strokeLinejoin="round" /><circle cx={pts[pts.length - 1][0]} cy={pts[pts.length - 1][1]} r="4" fill="#FFB020" /></svg>
}
function Table({ title, g }: { title: string; g: Record<string, { n: number; w: number; pl: number }> }) {
  const rows = Object.entries(g).sort((a, b) => b[1].pl - a[1].pl)
  return <div className="c"><h3>{title}</h3>{rows.map(([k, v]) => <div className="row" key={k} style={{ padding: '4px 0' }}><b>{k}</b><span className="mu">{v.n} trades · {Math.round(v.w / v.n * 100)}% · <span className={v.pl >= 0 ? 'pos' : 'neg'}>{money(v.pl)}</span></span></div>)}{!rows.length && <p className="mu">No data yet.</p>}</div>
}
function Heat({ t, onPick }: { t: Trade[]; onPick: (d: string) => void }) {
  const m = dayPnl(t), cells: { d: string; v: number | undefined }[] = [], now = new Date()
  for (let i = 83; i >= 0; i--) { const x = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i); const d = x.toLocaleDateString('en-CA'); cells.push({ d, v: m[d] }) }
  const mx = Math.max(1, ...Object.values(m).map(Math.abs))
  return <svg viewBox="0 0 252 84" width="100%" role="img" aria-label="Daily P/L calendar">{cells.map((c, i) => <rect key={c.d} onClick={() => onPick(c.d)} style={{ cursor: 'pointer' }} x={Math.floor(i / 7) * 21} y={(i % 7) * 12} width="18" height="10" rx="3" fill={c.v === undefined ? 'var(--bd)' : c.v >= 0 ? '#14D69A' : '#FF5D6C'} opacity={c.v === undefined ? .5 : .3 + .7 * Math.min(1, Math.abs(c.v) / mx)}><title>{c.d}: {c.v ?? 'no trades'}</title></rect>)}</svg>
}
function Mistakes({ t }: { t: Trade[] }) {
  const g: Record<string, { n: number; pl: number }> = {}
  t.forEach(x => (x.x?.Mistake || '').split(', ').filter(Boolean).forEach(m => { g[m] ??= { n: 0, pl: 0 }; g[m].n++; g[m].pl += x.pl }))
  const rows = Object.entries(g).sort((a, b) => a[1].pl - b[1].pl)
  return <div className="c"><h3>💸 What your mistakes cost</h3>{rows.map(([k, v]) => <div className="row" key={k} style={{ padding: '4px 0' }}><b>{k}</b><span className="mu">{v.n}× · <span className={v.pl >= 0 ? 'pos' : 'neg'}>{money(v.pl)}</span></span></div>)}{!rows.length && <p className="mu">Tag mistakes on trades in the Journal and this fills in.</p>}</div>
}
function CycleHistory({ a }: { a: Account }) {
  if (!a.hist.length) return null
  const tot = a.hist.reduce((s, h) => s + h.w, 0)
  return <div className="c"><div className="row"><h3>💰 Completed cycles</h3><span className="mu">Total withdrawn <b className="pos">{money(tot)}</b></span></div>{[...a.hist].reverse().map(h => <div className="row" key={h.cycle} style={{ padding: '4px 0' }}><span>#{h.cycle} · {h.date}</span><span className="mu">{h.n} trades · withdrew {money(h.w)}</span></div>)}<p className="mu">{a.hist.length} cycle{a.hist.length > 1 ? 's' : ''} · avg {Math.round(a.hist.reduce((s, h) => s + h.n, 0) / a.hist.length)} trades each</p></div>
}
export default function Stats({ a, trades: allTrades, base }: { a: Account; trades: Trade[]; base: string }) {
  const [pick, setPick] = useState(''), [acc, setAcc] = useState('all')
  const trades = acc === 'all' ? allTrades : allTrades.filter(t => (t.x?.Account || 'Live') === acc)
  const s = equitySeries(a, trades), all = expectancy(trades), c = cycleTrades(a, trades), ds = discipline(trades)
  const byHour: Record<string, { n: number; w: number; pl: number }> = {}
  trades.forEach(t => { const h = String(new Date(t.ts).getHours()).padStart(2, '0') + ':00'; byHour[h] ??= { n: 0, w: 0, pl: 0 }; byHour[h].n++; byHour[h].w += t.pl > 0 ? 1 : 0; byHour[h].pl += t.pl })
  const hrs = Object.entries(byHour).filter(([, v]) => v.n >= 3).sort((x, y) => y[1].pl - x[1].pl)
  const slotG = groupStats(c.map(t => ({ ...t, slot: (SLOTS.find(x => x.k === t.slot)?.l || t.slot) as any })), 'slot')
  return <>
    <div className="row" style={{ justifyContent: 'flex-start', marginBottom: 10 }}>{[['all', 'All'], ['Live', 'Live'], ['Demo', 'Demo']].map(([k, l]) => <button key={k} className={acc === k ? '' : 'alt'} style={{ width: 'auto' }} onClick={() => setAcc(k)}>{l}</button>)}</div>
    <Weekly trades={trades} />
    <ShareCard trades={trades} level={gameStats(trades, a.hist.length, 0).level} streak={gameStats(trades, a.hist.length, 0).streak} />
    <Goals base={base} trades={trades} /><Challenges base={base} trades={trades} /><ReviewCard base={base} trades={trades} />
    <div className="c"><h3>Equity curve · this cycle</h3><Curve s={s} /><div className="row"><span className="mu">Max drawdown <b className="neg">{money(-maxDrawdown(s))}</b></span><span className="mu">Now <b>{money(s[s.length - 1])}</b></span></div></div>
    <div className="c"><div className="grid">
      <div><span className="mu">Win rate</span><div className="big">{Math.round(all.wr * 100)}%</div></div>
      <div><span className="mu">Avg win</span><div className="big pos">{money(all.aw)}</div></div>
      <div><span className="mu">Avg loss</span><div className="big neg">{money(all.al)}</div></div>
      <div><span className="mu">Per trade</span><div className={'big ' + (all.exp >= 0 ? 'pos' : 'neg')}>{money(all.exp)}</div></div></div>
      <p className="mu">Reality check: with your average win and loss, you need a win rate of at least <b>{Math.round(all.breakeven * 100)}%</b> just to break even. The plan assumes close to 100%.</p></div>
    <div className="c"><div className="row"><h3>Last 12 weeks</h3><span className="mu">Discipline <b>{ds === null ? '–' : ds + '/100'}</b></span></div><Heat t={trades} onPick={setPick} /><p className="mu">Green = profit day, red = loss day. Discipline = lessons on losses + completed checklists.</p></div>
    {pick && <div className="c"><div className="row"><h3>{pick}</h3><button className="alt" onClick={() => setPick('')}>Close</button></div>{trades.filter(t => t.date === pick).map(t => <div className="row" key={t.id} style={{ padding: '3px 0' }}><span>{t.pair} {t.side} <span className="chip">{t.model}</span></span><b className={t.pl >= 0 ? 'pos' : 'neg'}>{money(t.pl)}</b></div>)}{!trades.some(t => t.date === pick) && <p className="mu">No trades that day.</p>}</div>}
    {hrs.length >= 2 && <div className="c"><h3>Your clock</h3><p>Best hour: <b className="pos">{hrs[0][0]}</b> ({money(hrs[0][1].pl)}) · Worst hour: <b className="neg">{hrs[hrs.length - 1][0]}</b> ({money(hrs[hrs.length - 1][1].pl)})</p><p className="mu">Local time, hours with 3+ trades.</p></div>}
    <CycleHistory a={a} /><Mistakes t={trades} /><Table title="By setup (your playbook)" g={groupStats(trades.map(t => ({ ...t, pair: t.x?.Setup || '—' })) as Trade[], 'pair')} /><Table title="By mood" g={groupStats(trades.map(t => ({ ...t, pair: t.x?.Mood || '—' })) as Trade[], 'pair')} /><Table title="By weekday" g={groupStats(trades.map(t => ({ ...t, pair: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][new Date(t.ts).getDay()] })) as Trade[], 'pair')} /><Table title="By model" g={groupStats(trades, 'model')} /><Table title="By pair" g={groupStats(trades, 'pair')} /><Table title="By timeframe" g={groupStats(trades, 'tf')} /><Table title="By entry (this cycle)" g={slotG} />
    <MarginCheck equity={s[s.length - 1]} /><Tools equity={s[s.length - 1]} />
  </>
}
