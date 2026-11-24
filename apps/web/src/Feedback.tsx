import { useState } from 'react'
import { doc, setDoc } from 'firebase/firestore'
import { User } from 'firebase/auth'
import { db } from './firebase'
import { native } from './notify'
export default function FeedbackCard({ u }: { u: User }) {
  const [t, setT] = useState(''), [m, setM] = useState('')
  const send = async () => { await setDoc(doc(db, 'feedback', 'f' + Date.now() + u.uid.slice(0, 6)), { uid: u.uid, text: t.slice(0, 1000), ts: Date.now(), app: native ? 'android' : 'web' }); setT(''); setM('Thanks! Sent ✅') }
  return <div className="c"><h3>💬 Feedback</h3><textarea maxLength={1000} placeholder="Bug, idea, or something you want added…" value={t} onChange={e => setT(e.target.value)} /><br /><br /><button disabled={!t.trim()} onClick={send}>Send feedback</button><p className="mu">{m}</p></div>
}
