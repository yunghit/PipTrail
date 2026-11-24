# PipTrail: complete setup guide (all free tiers)

Time needed: about 60–90 minutes the first time. You need an email address, a phone or PC, and the `piptrail.zip` file. No credit card is required for any step below.

Words used: **repo** = your project folder on GitHub. **Secret** = a hidden setting on GitHub. **Pages** = Cloudflare's free website hosting.

---
## PART 0. What you will end up with
- User web app: `https://piptrail-web.pages.dev`
- Admin portal: `https://piptrail-admin.pages.dev`
- Android app (APK) built automatically by GitHub
- Database and login on Firebase, free AI coach and push sender on Cloudflare

Write down every value you collect in a note. A checklist is at the end (Part 12).

---
## PART 1. Create the three accounts
1. **GitHub**: https://github.com → Sign up. Verify your email.
2. **Google/Firebase**: use any Google account. Go to https://console.firebase.google.com.
3. **Cloudflare**: https://dash.cloudflare.com/sign-up → Sign up. Verify your email.

## PART 2. Put the code on GitHub
Pick ONE option.

**Option A: from a computer (easiest)**
1. Unzip `piptrail.zip`. You get a folder `piptrail`.
2. On GitHub click **+ → New repository**. Name: `piptrail`. Set **Private**. Do NOT tick "Add a README". Click **Create repository**.
3. On the empty repo page click **uploading an existing file**. Open the unzipped `piptrail` folder, select EVERYTHING inside it (including the hidden `.github` folder and `.gitignore`; turn on "show hidden files" in your file manager) and drag it all into the browser. Wait for the upload.
4. Scroll down, click **Commit changes**.
5. Check that the repo shows folders `.github`, `apps`, `packages`, `workers`, `docs`, `brand` and files `firestore.rules`, `package.json`. If `.github` is missing, workflows will not run: upload it again (Add file → Upload files).

**Option B: Git on a computer**
```
cd piptrail
git init
git add -A
git commit -m "PipTrail"
git branch -M main
git remote add origin https://github.com/YOUR_NAME/piptrail.git
git push -u origin main
```

**Option C: phone only** Use a free GitHub Codespace: repo page → Code → Codespaces → Create. Upload the zip into the file explorer, open the terminal, run `unzip piptrail.zip && cp -r piptrail/. . && rm -rf piptrail piptrail.zip`, then `git add -A && git commit -m init && git push`.

## PART 3. Firebase (login + database)
1. Firebase console → **Create a project** → name `piptrail` → turn Google Analytics OFF → Create.
2. **Spark plan only.** Do NOT upgrade. Everything here works on Spark.
3. Left menu **Build → Authentication → Get started → Sign-in method → Email/Password → Enable → Save**.
4. **Build → Firestore Database → Create database** → choose **production mode** → pick the nearest location (for Botswana choose `europe-west` or `eu` if offered; you cannot change it later) → Enable.
5. **Project settings** (gear icon) → **General** → scroll to "Your apps" → click the **Web** icon `</>`:
   - App nickname `piptrail-web` → Register app.
   - You will see `firebaseConfig`. Copy these four values into your note:
     `apiKey`, `authDomain`, `projectId`, `appId`.
   - Click Continue to console.
6. Same page → **Add app → Android icon**:
   - Package name exactly: `com.piptrail.app` → Register.
   - Click **Download google-services.json**. Open it in a text editor and copy ALL the text. Keep it in your note. Skip the remaining wizard steps.
7. **Project settings → Service accounts → Generate new private key → Generate key.** A `.json` file downloads. This is powerful: never share it or put it in the repo. Open it in a text editor, copy ALL the text.
8. **Authentication → Settings → Authorized domains → Add domain**: add `piptrail-web.pages.dev` and `piptrail-admin.pages.dev` (change if you pick different names in Part 4).
9. **Authentication → Templates → Email address verification**: optionally edit the sender name to "PipTrail".
10. Enable the push API: https://console.cloud.google.com → select project `piptrail` → search "Firebase Cloud Messaging API" → make sure it says Enabled (it usually is).

## PART 4. Cloudflare (hosting, free AI, push)
1. **Account ID**: dash.cloudflare.com → Workers & Pages (left menu). The right side shows **Account ID**. Copy it.
2. **API token**: top right profile icon → **My Profile → API Tokens → Create Token → Create Custom Token**:
   - Name: `piptrail-ci`
   - Permissions: add three rows → `Account` · `Cloudflare Pages` · `Edit`; `Account` · `Workers Scripts` · `Edit`; `Account` · `Workers AI` · `Read` (add if offered).
   - Account Resources: Include → your account.
   - Continue → Create Token → **copy the token now** (shown once).
3. **The two Pages projects are created automatically** by the Deploy workflow (it runs `wrangler pages project create` for you). You do not need to create anything in the Cloudflare dashboard.
   - **If you already created a Worker called `piptrail` and connected GitHub to it** (you will see "Latest build failed"): open it → **Settings → Danger zone → Delete**. It is not used, and its failing builds are harmless but confusing. Cloudflare's dashboard now shows Pages and Workers together under "Workers & Pages"; the Pages projects will appear there after the first deploy.
4. **Workers.dev subdomain**: it is shown in the Worker's Domains tab, for example `piptrail.YOURNAME.workers.dev`. Your subdomain is the `YOURNAME` part. The push worker will be at `https://piptrail-push.YOURNAME.workers.dev`. (Example: if you see `piptrail.yunghit.workers.dev`, your push URL is `https://piptrail-push.yunghit.workers.dev`.)
5. **After the first successful deploy (Part 6)** open Workers & Pages → `piptrail-web` → Settings → Bindings. You should see a **Workers AI** binding named `AI` (the deploy sets it from `apps/web/wrangler.toml`). If it is missing, add it by hand: Add binding → Workers AI → variable name `AI`. Also confirm Variables has `FIREBASE_PROJECT_ID` and `ALLOWED_ORIGINS`; if not, add them (`ALLOWED_ORIGINS` = `https://localhost,capacitor://localhost`).
6. **Your real site addresses**: after the first deploy, the project page shows each address. If it is not exactly `piptrail-web.pages.dev` or `piptrail-admin.pages.dev` (Cloudflare adds letters when a name is taken), use the real address in Part 3 step 8 (Firebase authorized domains) and in the secrets `VITE_API_BASE` and `ADMIN_ORIGIN`, then re-run Deploy.

## PART 5. GitHub secrets
Repo → **Settings → Secrets and variables → Actions → New repository secret**. Add each name exactly:

| Secret name | Value |
|---|---|
| `VITE_FB_API_KEY` | Firebase `apiKey` |
| `VITE_FB_AUTH_DOMAIN` | Firebase `authDomain` |
| `VITE_FB_PROJECT_ID` | Firebase `projectId` |
| `VITE_FB_APP_ID` | Firebase `appId` |
| `VITE_API_BASE` | `https://piptrail-web.pages.dev` (your web URL, no trailing slash) |
| `VITE_PUSH_URL` | `https://piptrail-push.YOUR_SUBDOMAIN.workers.dev` |
| `ADMIN_ORIGIN` | `https://piptrail-admin.pages.dev` |
| `CLOUDFLARE_API_TOKEN` | the token from Part 4 |
| `CLOUDFLARE_ACCOUNT_ID` | Account ID from Part 4 |
| `FIREBASE_SERVICE_ACCOUNT` | whole contents of the service-account JSON (Part 3 step 7) |
| `GOOGLE_SERVICES_JSON` | whole contents of `google-services.json` (Part 3 step 6) |

Optional later: `ADMOB_APP_ID`, `ADMOB_BANNER_ID`.

## PART 6. First deploy
1. Repo → **Actions** tab → if asked, click "I understand my workflows, enable them".
2. Left side → **Deploy** → **Run workflow** → Run.
3. Wait 3–6 minutes. Green tick = success.
4. If it fails, click the failed run → click the red step → read the last 20 lines. See Part 11.
5. Open `https://piptrail-web.pages.dev` and `https://piptrail-admin.pages.dev`. You should see the PipTrail login.
6. If the push worker URL differs from what you put in `VITE_PUSH_URL`, fix the secret and run Deploy again.

## PART 7. Make yourself the admin
1. Open the web app → **Create account** → email + password (10+ characters).
2. Open your email → click the verification link. In the app tap **I verified**.
3. Firebase console → **Authentication → Users** → copy your **User UID**.
4. **Firestore Database → Start collection** → Collection ID `admins` → Document ID = your UID (paste) → add any field, for example `ok` (boolean) = `true` → Save.
5. Open the admin portal → sign in with the same email. You should see the admin panels.

## PART 8. Configure the business side (admin portal)
1. **Billing page**: price label (for example `P60 / month`) and instructions (for example "Send P60 to Orange Money 7X XXX XXX. Use your payment reference. We upgrade you within 24 hours."). Save.
2. **Announcement**: post a welcome message. It shows on every user's Desk.
3. **Lessons**: add 3–5 lessons (CRT checklist, risk rules).
4. **Templates**: create "CRT Unicorn" with fields (Sweep TF, FVG size, Session) and checks (HTF bias, C2 closed inside, SL beyond wick).
5. When a user taps "I've paid": confirm the money arrived, then admin → **Payment requests → Approve → Pro**.
6. To test Pro on yourself: admin → **Grant Pro manually** → paste your UID → Grant 30 days.

## PART 9. Install the Android app
1. Repo → **Actions → Android APK → Run workflow**. Wait 8–15 minutes.
2. Open the finished run → **Artifacts → piptrail-apk** → download and unzip → `app-debug.apk`.
3. Send it to your phone (WhatsApp to yourself, Drive, USB).
4. Tap it. If asked, allow "Install unknown apps" for that app. Install and open PipTrail.
5. Allow notifications when asked. Me tab → **Reminders** → switch on → set times → "Send test reminder".
6. Me tab → "Push alerts from PipTrail" → on. Admin portal → "Push notification" → send a test.
7. Updating: run the workflow again and install the new APK over the old one (same signing key not required for debug builds on the same machine type; if Android refuses, uninstall first: your data stays in the cloud).

## PART 10. Test everything (15-minute checklist)
- [ ] Sign up → verify → log in on web and on the phone with the same account
- [ ] Setup equity $40 → set today's plan → log 3 trades (one loss: write a lesson)
- [ ] Tag a mistake and a mood → open Stats: curve, calendar, mistake cost
- [ ] Me → My trading rules → add 3 rules → see them on the Desk
- [ ] Coach: tap "Review my last 10 losses"
- [ ] Skip a day: Desk → Skip today → streak still counts
- [ ] Mentor groups (needs Pro): Crew → Groups → Start a mentor group → copy invite
- [ ] Second account (another email): Crew → Groups → Join with the code → mentor dashboard shows the student
- [ ] Student: switch on "detailed view" → mentor sees weekly P/L
- [ ] Mentor posts an assignment and sends a note → student sees both
- [ ] Me → Export CSV works; Import CSV works with the export
- [ ] Delete test accounts afterwards (Me → Delete account)

## PART 11. Troubleshooting
| Problem | Fix |
|---|---|
| Actions run fails at "npm install" | Open the log. Usually a typo in a file; send me the last 20 lines. |
| Build fails with TypeScript errors | Send me the log. Expected on first run since the code was never compiled by me. |
| "Permission denied" in the app | Rules not deployed. Re-run Deploy and check the "Deploy Firestore rules" step passed; confirm `FIREBASE_SERVICE_ACCOUNT` is the Admin SDK key. |
| Login works but nothing saves | Email not verified. Tap "I verified". |
| Coach says "unauthorized" | Cloudflare `FIREBASE_PROJECT_ID` is wrong or still `__FB_PROJECT__`. Check Pages → Settings → Variables, or the sed step in deploy.yml. |
| Coach says "busy or free daily limit" | Workers AI daily free quota used. Try tomorrow. |
| Admin portal says "not an admin" | The `admins` document ID must be exactly your UID, and your email must be verified. |
| Push "Failed" in admin | `VITE_PUSH_URL` wrong, `ADMIN_ORIGIN` wrong, or no devices registered yet. Turn on push in the phone app first. |
| APK builds but crashes at open | Check `GOOGLE_SERVICES_JSON` is the full JSON for package `com.piptrail.app`. |
| Reminders do not fire | Android Settings → Apps → PipTrail → Notifications allowed; Battery → unrestricted; allow "Alarms & reminders". |
| Join group says "Group not found" | Code must be the 12 characters exactly, lowercase. |
| Creating group says "needs Pro" | Grant yourself Pro (Part 8 step 6). |

## PART 12. Final checklist
- [ ] GitHub repo with all files including `.github`
- [ ] Firebase: Auth (email) on, Firestore created, web + Android apps registered
- [ ] Cloudflare: 2 Pages projects, API token, account ID
- [ ] 11 GitHub secrets added
- [ ] Deploy workflow green, both sites open
- [ ] Admin document created in Firestore
- [ ] APK installed and tested
- [ ] Privacy policy (docs/PRIVACY_POLICY_TEMPLATE.md) reviewed by a lawyer before public launch

## Free-tier limits to watch
Firestore: 50,000 reads and 20,000 writes per day. Workers AI: about 10,000 "neurons" per day. Workers and Pages: 100,000 requests per day. If you outgrow these, costs begin only after you add a card.

## Security reminders
- Never commit or share the service-account JSON.
- Keep the repo private.
- Only people with a document in the `admins` collection can use the admin portal.
- Do not market guaranteed returns. Get legal advice for Botswana before charging users.

---
## Updating later
Replace changed files in the repo (GitHub → file → pencil/upload), commit to `main`. The Deploy workflow runs by itself. Re-run "Android APK" for a new phone build. Always redeploy after rule changes (the Deploy workflow does this).
