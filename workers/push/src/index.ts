// Free Cloudflare Worker: admin-only push broadcast via FCM HTTP v1. Verifies the caller is an admin (admins/{uid} doc).
import { createRemoteJWKSet, jwtVerify, importPKCS8, SignJWT } from 'jose'
const JWKS = createRemoteJWKSet(new URL('https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com'))
async function saToken(env: any) {
  const sa = JSON.parse(env.FIREBASE_SERVICE_ACCOUNT), key = await importPKCS8(sa.private_key, 'RS256')
  const jwt = await new SignJWT({ scope: 'https://www.googleapis.com/auth/datastore https://www.googleapis.com/auth/firebase.messaging' }).setProtectedHeader({ alg: 'RS256' }).setIssuer(sa.client_email).setSubject(sa.client_email).setAudience('https://oauth2.googleapis.com/token').setIssuedAt().setExpirationTime('55m').sign(key)
  const r: any = await (await fetch('https://oauth2.googleapis.com/token', { method: 'POST', headers: { 'content-type': 'application/x-www-form-urlencoded' }, body: new URLSearchParams({ grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer', assertion: jwt }) })).json()
  return r.access_token as string
}
export default {
  async fetch(request: Request, env: any) {
    const origin = request.headers.get('Origin') || '', ok = String(env.ALLOWED_ORIGINS).split(',').includes(origin)
    const cors = { 'Access-Control-Allow-Origin': ok ? origin : 'null', 'Access-Control-Allow-Headers': 'authorization,content-type', Vary: 'Origin' }
    const out = (b: unknown, s = 200) => new Response(JSON.stringify(b), { status: s, headers: { ...cors, 'content-type': 'application/json' } })
    if (request.method === 'OPTIONS') return new Response(null, { headers: cors })
    if (request.method !== 'POST' || !ok || new URL(request.url).pathname !== '/broadcast') return out({ error: 'forbidden' }, 403)
    const P = env.FIREBASE_PROJECT_ID, db = `https://firestore.googleapis.com/v1/projects/${P}/databases/(default)/documents`
    let uid: string
    try {
      const { payload } = await jwtVerify((request.headers.get('authorization') || '').replace(/^Bearer /, ''), JWKS, { issuer: `https://securetoken.google.com/${P}`, audience: P })
      if (!payload.sub || payload.email_verified !== true) throw 0; uid = payload.sub
    } catch { return out({ error: 'unauthorized' }, 401) }
    const body: any = await request.json().catch(() => null)
    if (!body?.title || !body?.body) return out({ error: 'title and body required' }, 400)
    const tok = await saToken(env), H = { authorization: 'Bearer ' + tok }
    if ((await fetch(`${db}/admins/${uid}`, { headers: H })).status !== 200) return out({ error: 'not an admin' }, 403)
    const tokens: string[] = []; let page = ''
    for (let i = 0; i < 10; i++) {
      const j: any = await (await fetch(`${db}/devices?pageSize=300${page}`, { headers: H })).json()
      for (const d of j.documents || []) tokens.push(d.name.split('/').pop())
      if (!j.nextPageToken) break; page = '&pageToken=' + encodeURIComponent(j.nextPageToken)
    }
    let sent = 0, dead = 0
    for (let i = 0; i < tokens.length; i += 20) await Promise.all(tokens.slice(i, i + 20).map(async t => {
      const r = await fetch(`https://fcm.googleapis.com/v1/projects/${P}/messages:send`, { method: 'POST', headers: { ...H, 'content-type': 'application/json' }, body: JSON.stringify({ message: { token: t, notification: { title: String(body.title).slice(0, 80), body: String(body.body).slice(0, 200) } } }) })
      if (r.ok) sent++; else if (r.status === 404 || r.status === 400) { dead++; await fetch(`${db}/devices/${encodeURIComponent(t)}`, { method: 'DELETE', headers: H }) }
    }))
    return out({ sent, removed: dead })
  }
}
