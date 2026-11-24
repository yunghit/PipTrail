# Figma spec (build these frames, mobile 390x844 + desktop 1280)
Tokens: bg #f6f7f9 / #0e1116 · card #fff / #171b22 · accent #0f9d6a / #2fd08f · loss #d6453d / #ff6b61 · radius 12 · font system-ui 15/22.
## User app
1. Login / Create account
2. Setup (starting equity)
3. Log: equity card + milestone bar, template picker + checklist, trade form, 4 entry-progress rows
4. Journal: trade rows with inline lesson field
5. Lessons: shared + personal list
6. AI Coach: chat bubbles, input, "thinking" state
## Admin portal
7. Admin login / not-admin state
8. Lessons: add form + list with delete
9. Templates: name, fields (one per line), checklist (one per line)
Build a component set for: Card, Button (primary/alt), Input, Progress bar, Tab, Chat bubble. Export tokens to apps/*/src/style.css.
## v2 screens
10. Desk additions: Pip card (4 faces: happy/chill/worried/hype), Day plan card + meters, mood picker
11. Stats: equity curve, 12-week calendar, tables
12. Crew: board, follow, share
13. Admin: announcements
14. Crew hub: Groups/Partners toggle; mentor dashboard (summary cards, student table with flags, post/note forms); student group view (feed, board, privacy toggle)
15. Journal: search/filter, mistake chips; Me: rules editor
16. Batch log card · Lock screen · Goals card · Challenges · Weekly review wizard · Onboarding tour (4 slides)
