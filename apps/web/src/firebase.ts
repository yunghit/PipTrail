import { initializeApp } from 'firebase/app'
import { getAuth } from 'firebase/auth'
import { initializeFirestore, persistentLocalCache, persistentMultipleTabManager } from 'firebase/firestore'
const app = initializeApp({ apiKey: import.meta.env.VITE_FB_API_KEY, authDomain: import.meta.env.VITE_FB_AUTH_DOMAIN, projectId: import.meta.env.VITE_FB_PROJECT_ID, appId: import.meta.env.VITE_FB_APP_ID })
export const auth = getAuth(app)
// Offline-first: trades logged without signal are queued and synced automatically.
export const db = initializeFirestore(app, { localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() }) })
