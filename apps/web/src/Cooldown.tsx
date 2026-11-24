import { useEffect, useState } from 'react'
// After a loss: a short cool-down timer. Survives reloads (end time kept on the device).
export default function Cooldown() {
  const [end, setEnd] = useState(+(localStorage.getItem('cdEnd') || 0)), [now, setNow] = useState(Date.now())
  useEffect(() => {
    if (!end) return
    const t = setInterval(() => { setNow(Date.now()); if (Date.now() >= end) { clearInterval(t); navigator.vibrate?.([200, 100, 200]) } }, 1000)
    return () => clearInterval(t)
  }, [end])
  const start = (m: number) => { const e = Date.now() + m * 60000; localStorage.setItem('cdEnd', String(e)); setEnd(e); setNow(Date.now()) }
  const clear = () => { localStorage.removeItem('cdEnd'); setEnd(0) }
  const left = Math.max(0, end - now), mm = String(Math.floor(left / 60000)).padStart(2, '0'), ss = String(Math.floor(left / 1000) % 60).padStart(2, '0')
  if (end && left > 0) return <div className="c"><div className="row"><span>⏳ Cool-down <b className="big">{mm}:{ss}</b></span><button className="alt" onClick={clear}>Cancel</button></div><p className="mu">Walk away from the charts. Re-read your rules.</p></div>
  if (end) return <div className="c"><div className="row"><span>✅ Cool-down done. Re-check your rules before the next trade.</span><button className="alt" onClick={clear}>Dismiss</button></div></div>
  return <div className="c"><div className="row"><span>🧊 Just took a loss?</span><span><button className="alt" onClick={() => start(5)}>5 min</button> <button className="alt" onClick={() => start(10)}>10 min</button> <button className="alt" onClick={() => start(15)}>15 min</button></span></div></div>
}
