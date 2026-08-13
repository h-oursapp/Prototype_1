# h_OURs APPKARTE — Tauschmodul App/Prototype
### (English version)

*Memory of all chats on the topic of App/Prototype (UI/UX & technical specification).*
*As of: 12.08.2026 (Version 1).*
*Tags kept in the original German per project convention: [ENTSCHIEDEN] = decided,
[VORSCHLAG] = proposed by Claude, not yet confirmed, [OFFEN] = open/unresolved.*

> **Relationship to the Bereichskarte Technik & Entwicklung:** This Appkarte is a
> standalone working document for app/prototype development — analogous to the earlier
> *Standkarte Homepage-Aufbau in WordPress*, which also ran separately before being merged
> in (see Bereichskarte Technik, Section 0, note on Version 2). As long as app planning is
> actively in motion, it stays **here**, not in the Bereichskarte. Only once something is
> mature and stable — or directly affects the Bereichskarte (e.g. hosting, servers, payment
> integration) — does that item move over there. This card is continuously updated.

---

## 0. PURPOSE & SCOPE

This card collects everything around the **Tauschmodul app/prototype**: UI/UX screens,
interaction logic, technical setup decisions (Claude Code, tooling), history,
reasoning, alternatives considered, and open points. Covers the **Tauschmodul** exclusively
— not the Organisationsmodul or the marketing homepage (those remain in the Bereichskarte
Technik & Entwicklung).

**Ownership:** Márk György Németh (CTO).

**Test question for every entry:** Does it concern the app/prototype specifically? **Yes**
→ goes here. Does it concern hosting/servers/payment integration/infrastructure that also
applies outside the app? → goes to the Bereichskarte Technik. Does it affect the whole
company? → offer an entry for the Gesamtkarte.

---

## 1. TECHNICAL SETUP (Tooling)

**[VORSCHLAG, not final]** Initial spike basis: **React + Vite**, scaffolded via
`npm create vite@latest`. Explicitly **not a final stack decision** — meant to test whether
the workflow with Claude Code holds up.

**[ENTSCHIEDEN for the spike]** Linter: **ESLint** (default choice for the first pass;
create-vite itself now defaults to **oxlint**, ESLint remains selectable via `--eslint` —
both are technically available).

**Claude Code:** local session (not web/cloud) — has direct access to the project folder
and the local git environment, can run `git init`/`commit`/`push` directly.
**Customization:** `CLAUDE.md` in the project root for coding guidelines (clean code,
mandatory tests for new code); optionally `.claude/commands/` for reusable prompts, hooks
for enforced behavior (e.g. automatic test run after every change).

**Known setup snags [RESOLVED]:**
- `EALLOWSCRIPTS` error on npm installs — a newer npm security feature that blocks
  lifecycle scripts from packages without explicit approval. Fix:
  `npm install-scripts approve`, or an entry in `allowScripts` (package.json) or `.npmrc`.
- VS Code Restricted Mode after `code .` in a new folder — normal behavior (Workspace
  Trust); fix: mark the folder as trusted in the banner.

---

## 2. LOGIN / REGISTRATION & ONBOARDING

**[ENTSCHIEDEN]** The app opens on a login/register screen. Locally stored personal data is
encrypted with the user's password. Registration continues into onboarding.
**[OFFEN]** Exact login/registration method (email? phone? SSO?).

**Onboarding steps [ENTSCHIEDEN]:**
1. Add skills (reuses the Skills page as a template) — **skippable**
2. Add friends — via an invite/friend link (from outside the app) **or** in-app search
   (shows only public profiles) — **skippable**
3. Verification — **[OFFEN]** whether skippable
4. Short animations/illustrations explaining how to use the app
5. Customization settings: grid size, color theme, profile private/public (searchable)

**[OFFEN]** The original whiteboard note (min. 3 skills, self-rating 1–5★ during
onboarding) was not reconfirmed here — presumably covered via the Skills-page template in
step 1, but not explicitly restated.

---

## 3. HOME & NAV BAR

**Home [ENTSCHIEDEN]:**
- Two fixed, **non-scrollable** sections: **Ads** (top, other users' offers) and **Your
  offers** (bottom) — each a 3×2 grid (6 boxes, exact fit still to be tuned)
- Corner arrow per section: tap or drag opens the full page — Ads → **Search**,
  Your offers → **Offers page**
- Tapping an ad opens the ad detail page (editable for your own listings)
- **Swipe up** opens the **Wallet** by default — reassignable later in Settings

**Nav Bar [ENTSCHIEDEN]** (present on (almost) all pages):
- Hours display (balance) → tap opens Wallet
- Profile button
- Social/Community button
- Active trades button (trades without a completed final review)
- Inventory button
- Home button
- **Behavior:** Fully visible, non-collapsing on Home. On all other pages,
  **collapsible** into a floating corner button, auto-collapses after a timer, tapping it
  reopens the full bar.

---

## 4. OFFERS PAGE & SEARCH

**Offers page [ENTSCHIEDEN]:**
- Two sections: **skill offers** / **item offers**
- Both **scrollable via page-flipping** (not classic continuous scroll)
- With fewer than 6 entries, one grid box becomes a prompt to add more
  skills/skill-offers or items
- Tapping an offer opens the ad detail page

**Search page [ENTSCHIEDEN]** — one page, two toggleable views, both sharing a search bar +
filter row at the top:
- **Map view:** ~half the screen is a map, the other half a list of nearby hits
  (based on location or the user's address)
- **Text search:** the rest of the screen is a results grid
- Nav bar at the bottom in both views

---

## 5. AD DETAIL / CREATE / MODIFY

**[ENTSCHIEDEN]**
- Pictures on top, text/details below
- Action buttons sit **above** the nav bar (nav bar at the very bottom):
  - Someone else's ad: **Quick Buy** (instant purchase at the listed price) / **Open
    trading window** (counter-offer)
  - Your own ad: **Edit/Save** + **Share**
- Additional **view-only mode** with all interaction buttons hidden

---

## 6. TRADING & INVENTORY

**Trading [ENTSCHIEDEN]** — three zones:
1. Top: your inventory (only items marked "public" are visible to your partner) + your
   skills as a sidebar — mirrored for the partner
2. Middle: the trading table — your offered hours (your available hours shown above it);
   partner's side mirrored, but **the partner's available hours stay hidden** from you
3. Bottom: chat window, expandable to full screen
- Also needed: a way to open either your own full inventory or the partner's (for the
  partner, public items/skills only, but with full detail inspection of those public
  entries)
- Nav bar at the bottom (standard behavior)

**[OFFEN]** Icons on the trading table — not yet defined.

**Inventory [ENTSCHIEDEN]** — **out of scope for the prototype**, mockup desired:
- Grid of uploaded items
- **Shelves** — exactly **one level**, no shelves within shelves
- "Create shelf" button
- Nav bar at the bottom
- **In trading context:** an added drag-and-drop area for building your offer, plus
  **Accept** and **Back-to-trading** buttons

---

## 7. WALLET, PROFILE & SKILLS

**Wallet [ENTSCHIEDEN]:**
- Available hours
- Charity hours (mechanics **[OFFEN]**, out of scope for the prototype)
- Foundation (**[OFFEN]**, not yet in scope)
- Payment information (storage location — the actual payment flow and the
  history/review-others feature have been relocated elsewhere)
- **[OFFEN]** Exactly where history/review-others and the payment flow moved to was not
  specified.

**Profile [ENTSCHIEDEN]:**
- Profile picture + personal info beside it
- Intro-text field — **[OFFEN]**: Nessi wants an HTML field, Márk prefers plain text.
  Unresolved.
- Ratings for your best skills
- Button → Skills page
- History of ratings/reviews from recent trades
- Settings button

**Skills page [ENTSCHIEDEN]:**
- Add skills via a searchable, predefined list
- When adding: self-rating; **4★+** requires proof (reference work or an official
  qualification)
- Skills are displayed as icons
- Users can also create custom skills (icon chosen from a predefined set), with a
  **cap** on the number of custom skills per user

---

## 8. TRADES & FINAL REVIEW

**Trades page [ENTSCHIEDEN]:**
- Shows all trades, open and closed
- Chat log stored **locally**; user can delete it manually
- Sort order: primarily by status — **[OFFEN]** exact status label unclear (note reads
  like "unridden," likely a typo or a different term was meant), then **agreed**, then
  **closed**; secondarily by last interaction
- Agreed trades: a button jumps directly to Final Review
- Grid-based layout
- Nav bar at the bottom

**Final Review [ENTSCHIEDEN]:**
- Purpose: officially close a trade
- Rating 0–5★ for the skill(s) used in the trade
- Plus a general personal rating (communication, punctuality, etc.), separate from the
  skill rating
- Button to send the other party a friend request or community invite

---

## 9. COMMUNITY & SETTINGS (Outlook — not in prototype/MVP scope)

**Community/Social page [ENTSCHIEDEN, out of scope]:**
In-app friends list, blocked-persons button, message board for community communication.

**Settings [ENTSCHIEDEN]:**
Classic settings menu. User-adjustable items identified so far: grid density (1–4/5 per
row), swipe-up mapping (default Wallet, reassignable), notifications — more to come.

**Legal page [ENTSCHIEDEN]:** needed eventually, but **out of scope for the prototype**.

---

## 10. OPEN POINTS (Collected)

- Login/registration method
- Whether verification is skippable
- Bio field: HTML (Nessi) vs. plain text (Márk)
- Trading-table icons
- Wallet: exact new location of history/review-others and the payment flow
- Charity and Foundation mechanics
- Exact grid tuning (6 boxes is an estimate)
- Trades status label (suspected typo)
- Home grid exact values, viewing rights on others' ads (view-only assumption not
  explicitly confirmed)

---

## 11. CHAT CHRONICLE

| When | Chat/Topic | Result lives in |
| --- | --- | --- |
| 11.–12.08.2026 | React/Claude Code setup walkthrough (Vite, ESLint/oxlint, EALLOWSCRIPTS, Workspace Trust, CLAUDE.md); whiteboard photo reviewed; screens Home through Settings/Legal specified step by step | This card, Sections 1–10 |

---

*End of Appkarte. Continuously updated.*
