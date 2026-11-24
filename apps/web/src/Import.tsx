import { useState } from 'react'
import { collection, doc, getDocs, writeBatch } from 'firebase/firestore'
import { Upload, Download } from 'lucide-react'
import { db } from './firebase'
const split = (l: string) => l.split(/[,;\t](?=(?:[^"]*"[^"]*")*[^"]*$)/).map(x => x.trim().replace(/^"|"$/g, '').replace(/""/g, '"'))
const find = (h: string[], names: string[]) => h.findIndex(x => names.includes(x))
// Imports closed trades from a CSV (PipTrail export or an MT5/MT4 history export). Stored outside your live cycle (cycle -1): stats include them, equity does not.
export default function ImportCard({ base }: { base: string }) {
  const [msg, setMsg] = useState('')
  const run = async (f: File) => {
    try {
      const rows = (await f.text()).split(/\r?\n/).filter(Boolean).map(split), h = rows[0].map(x => x.toLowerCase())
      const iP = find(h, ['symbol', 'pair', 'instrument']), iS = find(h, ['type', 'side', 'direction']), iL = find(h, ['profit', 'pl', 'p/l', 'net']), iT = find(h, ['close time', 'time', 'date', 'open time']), iN = find(h, ['lesson', 'comment', 'notes'])
      if (iP < 0 || iL < 0) return setMsg('Need a Symbol/Pair column and a Profit/PL column.')
      const out = rows.slice(1).map((r, i) => {
        const pl = parseFloat(String(r[iL]).replace(/[\s$]/g, '')); if (!isFinite(pl) || /balance|deposit|withdraw/i.test(r[iS] || '')) return null
        const d = new Date(String(r[iT] || '').replace(/^(\d{4})\.(\d{2})\.(\d{2})/, '$1-$2-$3')), ok = !isNaN(+d), dt = ok ? d : new Date()
        return { ts: dt.getTime() + i, date: dt.toLocaleDateString('en-CA'), cycle: -1, pair: String(r[iP]).toUpperCase().slice(0, 20), side: /sell/i.test(r[iS] || '') ? 'SELL' : 'BUY', model: 'Other', tf: '', slot: 'B', pl: Math.round(pl * 100) / 100, lesson: String(r[iN] || '').slice(0, 2000) }
      }).filter(Boolean).slice(0, 450) as any[]
      if (!out.length) return setMsg('No trade rows found.')
      const b = writeBatch(db); out.forEach((t, i) => b.set(doc(db, `${base}/trades/imp${Date.now()}_${i}`), t)); await b.commit()
      setMsg(`Imported ${out.length} trades ✅`)
    } catch { setMsg('Could not read that file.') }
  }
  return <div className="c"><h3><Upload size={16} /> Import trades (CSV)</h3><p className="mu">MT5/MT4 history export or PipTrail CSV. Max 450 rows per file. Imported trades feed Stats and the Coach but don't change your cycle equity.</p>
    <input type="file" accept=".csv,text/csv" onChange={e => e.target.files?.[0] && run(e.target.files[0])} /><p className="mu">{msg}</p></div>
}

export function BackupCard({ base }: { base: string }) {
  const [busy, setBusy] = useState(false)
  const run = async () => {
    setBusy(true); const out: Record<string, unknown[]> = {}
    for (const c of ['trades', 'lessons', 'days']) out[c] = (await getDocs(collection(db, `${base}/${c}`))).docs.map(d => ({ id: d.id, ...d.data() }))
    const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([JSON.stringify({ app: 'PipTrail', exportedAt: new Date().toISOString(), ...out }, null, 1)], { type: 'application/json' })); a.download = 'piptrail-backup.json'; a.click(); setBusy(false)
  }
  return <div className="c"><h3><Download size={16} /> Full backup</h3><p className="mu">Download all your trades, lessons and daily plans as one JSON file.</p><button className="alt" disabled={busy} onClick={run}>{busy ? 'Preparing…' : 'Download backup (JSON)'}</button></div>
}
