# PipTrail · Every pip, on the record.
React + TypeScript monorepo, **100% free tier, no card needed**: Firebase Spark (Auth + Firestore), Cloudflare Pages (two portals + AI function on Workers AI free tier), GitHub Actions (builds + Android APK).
Apps: `apps/web` (user portal + APK via Capacitor), `apps/admin` (admin portal), `packages/shared` (plan logic, gamification). Brand: `brand/`, Figma screens: `docs/FIGMA_SPEC.md`.
Status: written without running installs. Expect small fixes on the first CI run.

## Security built in
Email verification required · Firestore rules: deny-by-default, per-user isolation, field validation and size caps, admins only via an `admins/{uid}` doc you create in the console · strict CSP/HSTS/no-framing headers · AI endpoint verifies the Firebase token, pins your project, rate-limits, caps input · 20-min idle sign-out · CSV export (formula-safe) and full account deletion · `npm audit` in CI.
Not included (add later if you want): App Check, MFA, Play-Store-signed release.

## Setup (all free)
1. GitHub: create repo, push to `main`.
2. Firebase (Spark plan): create project → Authentication → Email/Password on → Firestore (production mode). Add a Web app, copy config.
3. Cloudflare: `npx wrangler pages project create piptrail-web` and `piptrail-admin`. Note your account ID and make an API token (Pages: Edit).
4. GitHub secrets: `VITE_FB_API_KEY`, `VITE_FB_AUTH_DOMAIN`, `VITE_FB_PROJECT_ID`, `VITE_FB_APP_ID`, `VITE_API_BASE` (= your web Pages URL, e.g. https://piptrail-web.pages.dev), `CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID`, `FIREBASE_SERVICE_ACCOUNT` (service-account JSON, role Firebase Rules Admin).
5. Firebase Auth → Settings → Authorized domains: add both `*.pages.dev` hosts.
6. Push to `main` → deploys both portals, the AI function and Firestore rules.
7. Sign up in the web app and verify your email. In Firebase console → Firestore → create collection `admins`, document ID = your user UID (Authentication tab), any field. Now you can sign in to the admin portal.
8. APK: Actions → "Android APK" → Run workflow. Download artifact `piptrail-apk`, install on your phone (debug build, for personal use).

## Free-tier limits to know
Firestore: 50k reads / 20k writes per day. Workers AI: ~10k neurons/day (hundreds of coach questions), model is Llama 3.1 8B: good, not Claude-level. Pages: 500 builds/month.

## v2 features
Pip (trade-partner mascot with live nudges) · daily plan with trade/loss limits · mood tags + stats by mood · 12-week P/L calendar · discipline score · Crew board (share stats with a partner via private 12-char code, revocable) · admin announcements · offline mode · equity curve and breakeven check.
After pulling: **redeploy Firestore rules** (new collections: days, prefs, partners, shares, announcements).

## v3: reminders + push (still free)
- **Local reminders** (plan, debrief, streak saver, custom): scheduled on the phone, work offline. Me tab → Reminders (Android app only).
- **Push alerts**: Firebase Cloud Messaging (free). Admin portal → "Push notification" sends to every install via `workers/push` (Cloudflare Worker).
- Extra secrets: `GOOGLE_SERVICES_JSON` (Firebase console → Project settings → your Android app `com.piptrail.app` → download google-services.json, paste contents), `VITE_PUSH_URL` (the deployed worker URL, e.g. https://piptrail-push.<you>.workers.dev), `ADMIN_ORIGIN` (admin Pages URL).
- `FIREBASE_SERVICE_ACCOUNT` must now be the **Firebase Admin SDK** key (Project settings → Service accounts → Generate new private key). Cloudflare API token needs "Workers Scripts: Edit".
- Add an Android app in Firebase console with package `com.piptrail.app` first. Redeploy Firestore rules.
- Also new: plan simulator (honest odds of a perfect cycle), weekly report card.

## v4: Pro, ads, import
- **Pro/free:** admin portal → Billing page (price + payment instructions), Payment requests (Approve → Pro), Grant Pro. Users see Upgrade in Me tab with a payment reference. Redeploy rules (new: pro, config, payments).
- **Ads:** Android free users see a banner on Journal/Stats/Crew. Defaults to Google TEST ads. For real ads: create AdMob app + banner unit, then add secrets `ADMOB_APP_ID` and `ADMOB_BANNER_ID`. Update the privacy policy (`docs/PRIVACY_POLICY_TEMPLATE.md`) before publishing.
- **Import CSV:** Me tab. MT5/MT4 history or PipTrail export.
- Revenue notes: `docs/MONETIZATION.md`.

## v5: mentor groups + trader tools
Mentor groups (Crew → Groups; creating needs Pro, joining is free): dashboard with attention flags, assignments, announcements, private notes, optional detailed P/L view. Plus mistake tags + cost, journal search/filter, personal rules, skip-days. **Full step-by-step: `docs/SETUP_GUIDE.md`.** Redeploy Firestore rules.

## v6
Batch logger (log up to 100 positions in one tap) · PIN app lock · goals · weekly challenges · guided weekly review · lesson of the day · light/dark theme · first-run tour. Redeploy Firestore rules (new: meta/goals).

## v7
Playbook (named setups + stats by setup) · shareable weekly image · cycle projection · evening notes · full JSON backup · admin Pro manager. Redeploy Firestore rules (new: meta/setups; admin can read pro).

## v8
Cool-down timer after a loss · tap a calendar day to see its trades · completed-cycle history and total withdrawn · weekday stats · margin check · built-in starter lessons.

## v9
Diagnostics (Me tab: checks Firebase, rules, AI endpoint; copies a report) · error screen with Copy button instead of a blank page · offline banner · in-app feedback (admin portal lists it) · recent-pair chips. Redeploy Firestore rules (new: feedback).

## v10
Live/Demo tagging (demo trades never change live equity; Stats filter) · edit a trade's P/L and entry slot in the Journal · star lessons · text-size and vibration settings.
