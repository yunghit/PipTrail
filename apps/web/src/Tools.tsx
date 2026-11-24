import { useMemo, useState } from 'react'
import { Trade, discipline, dayPnl, expectancy, nextBatch } from '@piptrail/shared'
const money = (n: number) => (n < 0 ? '-' : '') + '$' + Math.abs(n).toFixed(2)
const SEQ: [number, number][] = [[10, 8], [10, 4], [40, 4], [40, 8]]
function sim(p: number, loss: number, runs = 3000) {
  let bust = 0, full = 0; const fin: number[] = []
  for (let r = 0; r < runs; r++) {
    let e = 40, dead = false, all = true
    for (const [n, tp] of SEQ) { for (let i = 0; i < n; i++) { if (e < 4) { dead = true; break } if (Math.random() < p) e += tp; else { e -= loss; all = false } } if (dead) break }
    if (e < 4) dead = true; if (dead) bust++; else if (all) full++; fin.push(Math.max(e, 0))
  }
  fin.sort((a, b) => a - b); return { bust: bust / runs, full: full / runs, med: fin[runs >> 1], low: fin[runs >> 2] }
}
export function Tools({ equity }: { equity: number }) {
  const [p, setP] = useState(95), [loss, setLoss] = useState(4), r = useMemo(() => sim(p / 100, loss), [p, loss])
  return <div className="c"><h3>🧪 Plan simulator</h3><p className="mu">Simulates 3,000 cycles from $40 (100 positions). Rough model, fixed batch sizes.</p>
    <div className="row"><span>Win rate per position: <b>{p}%</b></span><input type="range" min="60" max="100" value={p} onChange={e => setP(+e.target.value)} style={{ width: '55%' }} /></div>
    <div className="row" style={{ marginTop: 8 }}><span>Average loss per losing position ($)</span><input type="number" min="1" step="0.5" value={loss} onChange={e => setLoss(Math.max(1, +e.target.value))} style={{ width: 90 }} /></div>
    <div className="grid" style={{ marginTop: 10 }}><div><span className="mu">Perfect cycle ($640)</span><div className="big pos">{(r.full * 100).toFixed(1)}%</div></div><div><span className="mu">Account blown</span><div className="big neg">{(r.bust * 100).toFixed(1)}%</div></div><div><span className="mu">Median finish</span><div className="big">{money(r.med)}</div></div></div>
    <p className="mu">A perfect cycle needs all 100 positions to win. For even odds you need about <b>{(Math.pow(.5, .01) * 100).toFixed(1)}%</b> per position. Use this to size expectations, not as a prediction.</p>
    <p className="mu">Your next batch at {money(equity)}: <b>{nextBatch(equity)}</b> positions (${nextBatch(equity) * 4} margin).</p></div>
}
export function Weekly({ trades }: { trades: Trade[] }) {
  const w = trades.filter(t => t.ts > Date.now() - 7 * 864e5), e = expectancy(w), ds = discipline(w), dp = Object.entries(dayPnl(w)).sort((a, b) => b[1] - a[1]), pnl = w.reduce((s, t) => s + t.pl, 0)
  const score = (ds ?? 50) + (pnl > 0 ? 15 : 0) + (e.wr > .5 ? 10 : 0), g = score >= 90 ? 'A' : score >= 75 ? 'B' : score >= 55 ? 'C' : 'D'
  const text = `PipTrail week: ${w.length} trades, ${Math.round(e.wr * 100)}% wins, ${money(pnl)}, discipline ${ds ?? '–'}. Grade ${g}.`
  if (!w.length) return null
  return <div className="c"><div className="row"><h3>🗓 Weekly report card</h3><span className="big" style={{ color: 'var(--am)' }}>{g}</span></div>
    <p>{w.length} trades · {Math.round(e.wr * 100)}% wins · <b className={pnl >= 0 ? 'pos' : 'neg'}>{money(pnl)}</b> · discipline {ds ?? '–'}</p>
    {dp.length > 0 && <p className="mu">Best day {dp[0][0]} ({money(dp[0][1])}) · Worst {dp[dp.length - 1][0]} ({money(dp[dp.length - 1][1])})</p>}
    <button className="alt" onClick={() => navigator.clipboard?.writeText(text)}>Copy summary</button></div>
}

export function MarginCheck({ equity }: { equity: number }) {
  const [n, setN] = useState('10'), [fl, setFl] = useState('0'), used = Math.max(0, Math.round(+n) || 0) * 4, eq = equity + (+fl || 0), level = used ? eq / used * 100 : 0, free = eq - used
  return <div className="c"><h3>🛡 Margin check</h3><p className="mu">Open positions × $4 margin. Enter your open count and the current floating P/L.</p>
    <div className="grid"><div><span className="mu">Open positions</span><input type="number" min="0" value={n} onChange={e => setN(e.target.value)} /></div><div><span className="mu">Floating P/L $</span><input type="number" step="0.01" value={fl} onChange={e => setFl(e.target.value)} /></div></div>
    <div className="grid" style={{ marginTop: 10 }}><div><span className="mu">Margin used</span><div className="big">{money(used)}</div></div><div><span className="mu">Free margin</span><div className={'big ' + (free >= 0 ? 'pos' : 'neg')}>{money(free)}</div></div><div><span className="mu">Margin level</span><div className={'big ' + (level >= 150 || !used ? 'pos' : 'neg')}>{used ? level.toFixed(0) + '%' : '–'}</div></div></div>
    <p className="mu">Your plan runs at 100% of equity as margin, so the margin level starts near 100% and any floating loss pushes it down. Check Weltrade's margin-call and stop-out levels for your account type.</p></div>
}
