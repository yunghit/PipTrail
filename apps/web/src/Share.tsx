import { useState } from 'react'
import { Trade, expectancy, discipline } from '@piptrail/shared'
// Shareable weekly stats image (1080x1080). Money is hidden unless you switch it on.
export default function ShareCard({ trades, level, streak }: { trades: Trade[]; level: number; streak: number }) {
  const [pl, setPl] = useState(false), [msg, setMsg] = useState('')
  const wk = trades.filter(t => t.ts > Date.now() - 7 * 864e5), e = expectancy(wk), d = discipline(wk), net = wk.reduce((s, t) => s + t.pl, 0)
  const draw = () => {
    const c = document.createElement('canvas'); c.width = c.height = 1080; const x = c.getContext('2d')!
    x.fillStyle = '#0A0F1E'; x.fillRect(0, 0, 1080, 1080)
    x.strokeStyle = '#14D69A'; x.lineWidth = 30; x.lineCap = 'round'; x.lineJoin = 'round'; x.beginPath(); [[96, 356], [190, 270], [252, 320], [410, 150]].forEach(([a, b], i) => (i ? x.lineTo(a * .55 + 80, b * .55 - 40) : x.moveTo(a * .55 + 80, b * .55 - 40))); x.stroke()
    x.fillStyle = '#FFB020'; x.beginPath(); x.arc(410 * .55 + 80, 150 * .55 - 40, 19, 0, 7); x.fill()
    x.fillStyle = '#E8ECF1'; x.font = 'bold 72px system-ui, sans-serif'; x.fillText('PipTrail', 380, 150); x.font = '34px system-ui, sans-serif'; x.fillStyle = '#8B97AD'; x.fillText('My trading week', 380, 200)
    const rows: [string, string][] = [['Trades', String(wk.length)], ['Win rate', Math.round(e.wr * 100) + '%'], ['Discipline', d === null ? '–' : d + '/100'], ['Streak', streak + ' days'], ['Level', String(level)]]
    if (pl) rows.splice(1, 0, ['Result', (net >= 0 ? '+' : '-') + '$' + Math.abs(net).toFixed(2)])
    rows.forEach(([k, v], i) => { const y = 420 + i * 100; x.fillStyle = '#8B97AD'; x.font = '40px system-ui, sans-serif'; x.fillText(k, 90, y); x.fillStyle = k === 'Result' ? (net >= 0 ? '#14D69A' : '#FF5D6C') : '#E8ECF1'; x.font = 'bold 56px system-ui, sans-serif'; x.textAlign = 'right'; x.fillText(v, 990, y); x.textAlign = 'left' })
    x.fillStyle = '#14D69A'; x.font = '34px system-ui, sans-serif'; x.fillText('Every pip, on the record.', 90, 1010)
    return c
  }
  const share = () => draw().toBlob(async b => {
    if (!b) return; const f = new File([b], 'piptrail-week.png', { type: 'image/png' }), nav: any = navigator
    try { if (nav.canShare?.({ files: [f] })) await nav.share({ files: [f], text: 'My week on PipTrail' }); else { const a = document.createElement('a'); a.href = URL.createObjectURL(b); a.download = f.name; a.click(); setMsg('Image downloaded') } } catch { /* cancelled */ }
  })
  return <div className="c"><h3>📤 Share my week</h3><label className="row"><span>Include profit/loss amount</span><input type="checkbox" style={{ width: 'auto' }} checked={pl} onChange={e => setPl(e.target.checked)} /></label><br /><button disabled={!wk.length} onClick={share}>{wk.length ? 'Create share image' : 'Log trades this week first'}</button><p className="mu">{msg}</p></div>
}
