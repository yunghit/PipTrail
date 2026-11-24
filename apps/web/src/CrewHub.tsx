import { useState } from 'react'
import { User } from 'firebase/auth'
import Crew from './Crew'
import Groups from './Groups'
import { Trade, Account } from '@piptrail/shared'
export default function CrewHub(p: { u: User; base: string; trades: Trade[]; a: Account; pro: boolean; hasPlan: boolean }) {
  const [v, setV] = useState('g')
  return <><div className="row" style={{ justifyContent: 'flex-start', marginBottom: 10 }}><button className={v === 'g' ? '' : 'alt'} style={{ width: 'auto' }} onClick={() => setV('g')}>🎓 Groups</button><button className={v === 'p' ? '' : 'alt'} style={{ width: 'auto' }} onClick={() => setV('p')}>🤝 Partners</button></div>
    {v === 'g' ? <Groups u={p.u} base={p.base} trades={p.trades} pro={p.pro} hasPlan={p.hasPlan} /> : <Crew u={p.u} base={p.base} trades={p.trades} a={p.a} pro={p.pro} />}</>
}
