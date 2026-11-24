import { useState } from 'react'
import { doc, setDoc, updateDoc } from 'firebase/firestore'
import { db } from './firebase'
import { Trade } from '@piptrail/shared'
const money = (n: number) => (n < 0 ? '-' : '') + '$' + Math.abs(n).toFixed(2)
// Guided 3-step weekly review: worst loss, best win, one focus. Saved as lessons.
export default function ReviewCard({ base, trades }: { base: string; trades: Trade[] }) {
  const wk = trades.filter(t => t.ts > Date.now() - 7 * 864e5), worst = wk.filter(t => t.pl < 0).sort((a, b) => a.pl - b.pl)[0], best = wk.filter(t => t.pl > 0).sort((a, b) => b.pl - a.pl)[0]
  const [step, setStep] = useState(0), [a, setA] = useState(['', '', '']), set = (i: number, v: string) => setA(a.map((x, j) => (j === i ? v : x)))
  const save = async () => {
    const now = Date.now(), items: [string, string][] = [[worst ? `Review: worst loss ${worst.date} ${worst.pair}` : '', a[0]], [best ? `Review: best win ${best.date} ${best.pair}` : '', a[1]], ['Review: focus for next week', a[2]]]
    for (let i = 0; i < 3; i++) if (items[i][0] && items[i][1].trim()) await setDoc(doc(db, `${base}/lessons/rv${now}${i}`), { title: items[i][0].slice(0, 120), body: items[i][1].slice(0, 4000), cat: 'Review', ts: now })
    if (worst && a[0].trim() && !(worst.lesson || '').trim()) await updateDoc(doc(db, `${base}/trades/${worst.id}`), { lesson: a[0].slice(0, 2000) })
    setStep(4)
  }
  const Q = [worst ? `Your worst loss: ${worst.pair} ${worst.side} ${money(worst.pl)} on ${worst.date}. What happened, and what will you do differently?` : 'No losses this week. Skip ahead.', best ? `Your best win: ${best.pair} ${best.side} ${money(best.pl)} on ${best.date}. What did you do right that you can repeat?` : 'No wins logged this week.', 'One thing to focus on next week (one rule, one habit):']
  return <div className="c"><h3>🧭 Weekly review</h3>
    {step === 0 && <><p className="mu">Three questions, two minutes. Saved to your Lessons.</p><button disabled={!wk.length} onClick={() => setStep(1)}>{wk.length ? 'Start review' : 'Log trades this week first'}</button></>}
    {step >= 1 && step <= 3 && <><p>{Q[step - 1]}</p><textarea maxLength={1000} value={a[step - 1]} onChange={e => set(step - 1, e.target.value)} /><br /><br /><div className="row"><span className="mu">{step}/3</span><button style={{ width: 'auto' }} onClick={() => (step < 3 ? setStep(step + 1) : save())}>{step < 3 ? 'Next' : 'Save review'}</button></div></>}
    {step === 4 && <p className="pos">Review saved to Lessons ✅ <button className="alt" onClick={() => { setA(['', '', '']); setStep(0) }}>Again</button></p>}</div>
}
