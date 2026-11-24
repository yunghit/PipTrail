import { useState } from 'react'
const S = [['👋 Welcome to PipTrail', 'Your trading journal, discipline coach and plan tracker in one place.'], ['📋 The Desk', 'Set a daily plan, log trades one by one or a whole batch at once, and watch your cycle progress.'], ['📊 Journal & Stats', 'Tag moods and mistakes, write lessons, and see what your habits really cost you.'], ['🤝 Coach & Crew', 'Ask your AI coach about your own data, follow partners, or join a mentor group.']]
export default function Tour() {
  const [i, setI] = useState(0), [open, setOpen] = useState(!localStorage.getItem('toured'))
  if (!open) return null
  const done = () => { localStorage.setItem('toured', '1'); setOpen(false) }
  return <div style={{ position: 'fixed', inset: 0, background: '#000a', zIndex: 20, display: 'grid', placeItems: 'center', padding: 16 }}><div className="c" style={{ maxWidth: 360 }}><h3>{S[i][0]}</h3><p>{S[i][1]}</p><div className="row"><button className="alt" onClick={done}>Skip</button><button style={{ width: 'auto' }} onClick={() => (i < S.length - 1 ? setI(i + 1) : done())}>{i < S.length - 1 ? 'Next' : "Let's go"}</button></div><p className="mu">{i + 1}/{S.length}</p></div></div>
}
