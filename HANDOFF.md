# h_OURs Prototype — Handoff

Written 2026-08-14, on branch `scaffolding_prototype`; updated same day on branch
`todo-5-6-7-profile-skills-skill` after building TODO #5–#7 (Profile, Skills, Skill); updated
again on branch `todo-9-13-inventory-trading` after building TODO #9–#13 (Inventory, Item,
Trading, Trades, the trading-process status pipeline) and then reworking Inventory and Trading
again across several rounds of direct feedback once they were actually clicked through. Updated
six more times on 2026-08-15, each its own small branch/PR per Márk's "one TODO point at a time,
check in after each" call this session: `todo-3-4-home-navbar` (TODO #3–#4: Home's grids and swipe
gestures, the nav bar's rework into a floating bar), `todo-1-login` (TODO #1: Login's email/password
fields), `todo-2-1-onboarding-skills` (TODO #2.1: onboarding's real "Add your skills" step),
`todo-2-2-onboarding-friends` (TODO #2.2: onboarding's real "Add friends" step),
`todo-2-3-onboarding-verify` (TODO #2.3: onboarding's real "Verify your identity" step),
`todo-2-5-onboarding-photo` (TODO #2.5: onboarding's real "Add a profile picture" step), and
`todo-8-ad-offer` (TODO #8: Ad → Offer — ratings split by kind, the skill/item picker, wiring
Skills/Inventory's transfer boxes to it, Quick Buy's hours prefill). Updated again on 2026-08-17 on
branch `first-phone` — not a `TODO.md` point, but Márk's own request to get the app running on a
phone; see the new subsection at the end of §2 for what that added and what's still open. Updated
again same day on branch `todo-13-search` after building **TODO #13** (Search — see §2 for the
full rundown), plus a larger mock-data expansion across `mockOffers.ts`/`mockInventory.ts`
requested mid-session. Updated again on the same branch, same day, after a **TODO #9 rework**
(Inventory's search bar + filter, and its grid actually filling the page instead of a fixed N×N)
and **TODO #14** (swapping the h_OURs logo into the favicon/PWA icons and the login screen) —
Márk asked to keep working on this one branch rather than opening a new one per TODO point, which
is why this update doesn't have its own branch name.

This document exists so a new session (human or Claude) can pick the project up cold without
re-reading every file. It records **what is built, why it was built that way, and what is
deliberately not built** — the reasoning that doesn't survive in the code.

Read this alongside three other files, which outrank it wherever they disagree:

| File | What it is | Authority |
| --- | --- | --- |
| `CLAUDE.md` | Working agreements | Highest — these are rules, not suggestions |
| `TODO.md` | Márk's rework list, written between sessions | Highest for *what to build next* |
| `h_OURs_Appkarte_Aug26_EN.md` | The product spec | The source of truth for *intent* |
| `HANDOFF.md` (this) | State of the code | Descriptive only — it goes stale |

---

## 1. What this is

**h_OURs** is a *Tauschmodul* — a bartering app. People trade **skills** and **items** with each
other, and the currency is **hours**. You do three hours of web design for someone, you gain three
hours, you spend them on someone else's drill.

This repo is the **prototype**: the whole app is walkable, none of it is real. There is no backend,
no auth, no persistence beyond one settings key in `localStorage`. Every screen renders from mock
data files.

The Appkarte tags each decision, and those tags are used throughout the code comments:

- **`[ENTSCHIEDEN]`** — decided, build it this way
- **`[VORSCHLAG]`** — proposed, not settled
- **`[OFFEN]`** — open, nobody has decided yet

When code makes a choice the Appkarte left `[OFFEN]`, the comment says so. Those are the spots most
likely to need changing once a real decision lands.

---

## 2. Current state

Verified immediately before writing this:

```
npm run test        51 files, 378 tests, all passing
npx tsc --noEmit    clean
npm run lint        clean
npm run build       succeeds
```

**2026-08-17, branch `todo-13-search` (same branch, later the same day)** reworked **TODO #9**
(Inventory) and built **TODO #14** (the real logo):

- **Inventory gained a search bar and one filter** — TODO #9's "no skills are here" means Search's
  skill/item split doesn't apply, so the one filter is visibility (All/Public/Private), the concept
  the page already tracked. Both narrow only what the *grid* shows: an item already added to a
  trade offer stays in the transfer box even if a search typed afterwards would hide its tile.
- **The search bar and filter-chip shell are now shared components**, not copied from `SearchPage`:
  `components/SearchBar.tsx` and `components/FilterChip.tsx`, pulled out once Inventory became the
  second real page wanting the exact same "field + small submit button" and "button that opens a
  floating panel underneath it" patterns TODO #13 built first. `SearchPage` was refactored to use
  both — its own 14 tests kept passing unchanged, which is the actual proof the refactor didn't
  change behaviour, not just a claim.
- **The grid now measures how many rows fit, instead of reusing the grid-size setting for both
  dimensions.** TODO #9: "columns by the setting and rows as many as fits" — `hooks/
  useFittingRows.ts` watches the grid's container with a `ResizeObserver` and computes how many
  square, `columns`-wide cells fit the height actually available under the new search/filter row.
  Falls back to the old fixed `gridSize × gridSize` behaviour whenever it can't measure anything
  real (jsdom, or the one frame before layout exists) — see §8 for why that fallback choice meant
  none of Inventory's existing tests needed touching.
- **TODO #14**: the default Vite/React scaffold icons were already long gone (removed in this
  repo's second-ever commit) — what TODO #14 actually needed was swapping last session's
  placeholder h_OURs mark for the real logo Márk's design work produced. See §8 for the full story,
  including a near-miss (the source files were handed over sitting inside the gitignored `dist/`
  build folder, one `npm run build` away from being silently deleted).

**2026-08-17, branch `todo-13-search`** built **TODO #13** (Search) end to end, plus a mock-data
expansion Márk asked for mid-session:

- **Search bar**: the visible "Search" label above the field is gone — the input's accessible name
  now comes from `aria-label` alone — and a small submit button (🔍) sits to its right, both wrapped
  in a `role="search"` `<form>` so Enter and the button do the same (currently no-op beyond the
  live-as-you-type filtering that was already there) thing without a page reload.
- **Filters became a one-row bar of three buttons** (kind / distance / minimum rating), each naming
  its own current value ("All", "Any distance", "Min 4★"), rather than always-visible controls.
  Tapping one opens a floating panel underneath the row with the real control; opening a different
  one closes whichever was open (`FilterBar`'s single `openFilter` state, not three independent
  booleans). The kind panel closes itself the moment you pick an option; distance and rating — both
  adjusted rather than picked in one tap — wait for an explicit "Done" button instead. This was a
  direct rework of the first pass, which had these same three filters permanently on-screen as a
  slider row; see §8 for a CSS trap hit along the way that's worth reading before touching this
  again.
- **Minimum rating is a star picker, not a slider** — literally the same control Final Review uses
  to *set* a rating, not a lookalike. Pulled out into a new shared component,
  `components/StarRatingInput.tsx` (radio-group stars, 0 is a real "no minimum" choice same as
  Final Review's "no rating yet"), once there were two real callers; `FinalReviewPage.tsx` was
  refactored to use it too, so the two pickers can no longer drift apart from each other. The
  read-only `components/StarRating.tsx` (the ★★★★☆ glyph-row display, used on Profile/Skills/Trades/
  offer detail pages) is unrelated and unchanged — display and input stay two components on
  purpose, per that file's own doc comment.
- **Map view restructured** (TODO #13.1): the map placeholder now sits *above* the same results
  grid the text view uses (columns from the grid-size setting), instead of a separate side-by-side
  "nearby hits" list — that list component is gone. Both views sort/display through one
  `ResultsGrid`; only the map view sorts it by distance first.
- **Rating badge**: a compact `"N★"` pill pinned to a tile's top-right corner (`position: absolute`
  on `.square-tile`'s existing positioned box), replacing a five-glyph star row that has no room to
  spare at grid size. Same idea TODO #3 wants for Home's grid tiles — not done there yet, but this
  is the pattern to reuse rather than reinvent when that's picked up.
- **Scrolling**: no new code needed — `PageShell`'s content area already had `overflow-y: auto`, so
  the page just grows with the result count.
- **Mock data expansion** (Márk's mid-session ask, same branch): `MOCK_ADS` 16→26 entries,
  `MOCK_YOUR_OFFERS` 16→24, `MOCK_YOUR_INVENTORY` 8→20, `MOCK_PARTNER_INVENTORY` 5→12 — wider
  spread of distance/rating/public-private values so Search's new filters and Inventory's paging
  have real variety to exercise. This shifted pagination math on two other pages that read the same
  arrays (`OffersPage`'s section now runs 3–4 pages instead of 2–3 at the same grid densities;
  `InventoryPage`'s first page is now a full 9 tiles instead of 8 + one empty) — both pages'
  existing tests were updated to match, not the pages themselves.

This calendar session (2026-08-15) shipped seven small, independently-branched-and-PR'd TODO
points in sequence, per Márk's "one at a time, check in after each" call — each is its own PR
rather than one large diff:

- **TODO #3–#4** (branch `todo-3-4-home-navbar`): Home's two grids centred with side-matched
  corner arrows and left/right swipe gestures, a "create new offer" tile, name+rating overlays on
  every tile; and the nav bar reworked into a floating, edge-to-edge bar with gridlines, Home
  recentred, Settings removed (already reachable from Profile), Hours rendered as a plain
  `10h15m`-style number, and the back button's new "top-level pages always go Home" rule. New small
  pure-logic modules: `formatHours.ts` (the `10h15m` formatter), `topLevelRoutes.ts` (the
  back-button rule's page list), and `isSwipeLeft`/`isSwipeRight` added alongside the existing
  `isSwipeUp` in `swipe.ts`.
- **TODO #1** (branch `todo-1-login`): `LoginPage` gained Email and Password fields above the Log
  in button. Plain, *uncontrolled* inputs — no `useState` — because nothing reads their values yet
  (there's no account system to check them against); adding state that does nothing would be the
  exact "premature abstraction" CLAUDE.md warns against. The Log in button's behaviour didn't
  change: it still calls `onLogin()` unconditionally.
- **TODO #2.1** (branch `todo-2-1-onboarding-skills`): onboarding's "Add your skills" step is now
  real, not a placeholder — it reuses `SkillPage`'s own catalogue-search/custom-skill-creation flow
  (`SkillChooser`/`SkillForm`, now exported from there) rather than a second picker. Continue is
  disabled until at least one skill has been added; Skip stays available regardless. See §8 for why
  this needed the app's first-ever generated id (`crypto.randomUUID()`, in the new `skillDraft.ts`).
- **TODO #2.2** (branch `todo-2-2-onboarding-friends`): onboarding's "Add friends" step is now real
  too — a read-only field holding a stand-in invite link (`MOCK_INVITE_LINK` in `mockCommunity.ts`)
  plus a Copy button, since "an input box for copying a friend/community link" is the entire TODO
  sentence and nothing more was asked for. The copy action is injected as an optional `copyLink`
  prop defaulting to the real Clipboard API, so tests supply a plain mock instead of fighting
  jsdom's partial, getter-only `navigator.clipboard`.
- **TODO #2.3** (branch `todo-2-3-onboarding-verify`): onboarding's "Verify your identity" step is
  now real: a big randomly-generated 5-digit code (`generateVerificationCode()` in
  `verificationCode.ts`) and a "Take a picture" button that's a plain `<input type="file"
  accept="image/*" capture="user">` — on a phone this already opens the OS's own camera app, so
  there's no hand-rolled `getUserMedia` stream to build or clean up. The chosen photo is held as a
  local object URL only ("verification pic"), revoked whenever it's replaced or the step unmounts.
  Continue is never gated on taking the photo — only §2.1's skills step gates Continue — and
  nothing here is actually verified, per the TODO's own words. With this step done, all three of
  `SkippablePlaceholderStep`'s callers are gone, so it (and its now-orphaned
  `.onboarding-step__placeholder` CSS) were deleted rather than left unused.
- **TODO #2.5** (branch `todo-2-5-onboarding-photo`): a new sixth onboarding step, "Add a profile
  picture" — two buttons, "Take a picture" (camera capture) and "Choose from your phone" (the
  system's normal file/photo picker), both previewing locally. This was the *second* real call
  site for #2.3's photo-capture pattern, so the shared parts were pulled out on the strength of
  that repetition (same bar `StarRating`/`TransferBox` were extracted at, see §8): `usePhotoCapture`
  (the object-URL state + revoke-on-replace/unmount logic) and `PhotoPickerButton` (the hidden-file-
  input-styled-as-a-button markup, `capture` prop toggling camera vs. picker). `StepVerify` now
  uses both too, with no change to its own tests or rendered output.
- **TODO #8** (branch `todo-8-ad-offer`): "Ad → Offer" — `Offer` gained `reviewRating?` (skill
  offers) and `conditionRating?` (item offers), so a skill's detail view shows both ratings and an
  item's shows only its condition. Creating a brand-new offer now shows two big Skill/Item buttons
  in the picture area instead of a blank frame; picking one navigates to Skills/Inventory, each now
  showing a "picking for a new ad" banner and transfer box at `?forAd=new` (alongside their existing
  `?trade=<id>` context), capped at one pick since an offer has exactly one subject; confirming
  sends you back to `/ads/new?skillId=<id>`/`?itemId=<id>`, which seeds the draft (title, icon,
  kind, ratings) from the chosen record. `TransferBox` was generalized (`backTo`/`primaryLabel`/
  `onPrimary`/`confirmedMessage` replacing hardcoded `tradeId`/`partnerName`/"Back to
  trading"/"Accept") so it could serve both contexts. Quick Buy now also passes the ad's listed
  hours through to Trading, which preloads them as your offer instead of always defaulting to your
  balance. User-facing wording shifted toward "offer" (New offer/Create offer/Offer not found,
  etc.) per Márk's call, without touching any route. See §8 below for all of it in detail.

**Previous session** (branch `todo-9-13-inventory-trading`) built **TODO #9–#13** end to end —
Inventory reworked into a non-scrollable paged grid, a new Item page, Trading reworked (twice — see
below), Trades gaining search/filter/sort, and a real session-local trade-status pipeline
(Accept/Decline, Quick Buy). New shared pieces: `PagedGrid` (the paged, always-square grid both
Inventory and Trading's rows now use), `TransferBox` (the "build an offer" box Inventory and Skills
share), and `TradeDraftContext` (see §8 — the one piece of cross-page state this prototype now has).

**The first cut of Inventory and Trading was built from the TODO wording alone, then reworked
substantially after actually clicking through it** — this is the normal, expected shape of working
from a rework list rather than a bug. Four rounds of direct feedback followed the initial build:
the Inventory grid not filling its space and not staying square, Trading's whole layout not
matching what was pictured (live item grids replaced by two buttons plus a real partner-inventory
page), a genuine CSS bug that crushed the trading table's tiles to a few pixels wide, and a
decluttering pass (smaller header, fewer standing explanations, final review moved next to
Decline, a background panel instead of a heading). §8 records the reasoning for all of it; reading
the current code alone won't tell you the shape it used to be or why it changed.

```bash
npm install
npm run dev        # http://localhost:5173
npm run test:watch # tests, re-running on save
```

Everything is designed at **phone width**. Check it in a narrow window or device emulation.

### Running on a phone (branch `first-phone`, 2026-08-17)

Not a `TODO.md` point — Márk asked directly for the easiest way to get the app onto an Android
phone. Neither Java, Android Studio, nor the Android SDK is installed on this Mac, which ruled out
Capacitor (a real installable `.apk`) as "easiest": that path needs the full SDK/Xcode-equivalent
toolchain installed first. Chose **PWA** instead — no native tooling at all, works from the existing
Vite build.

What changed: `vite-plugin-pwa` (build-time manifest + service-worker generation) and
`@vite-pwa/assets-generator` (rasterizes `public/favicon.svg` into every icon size Android/iOS
need — `npm run generate-pwa-assets` regenerates them if the logo changes) are new dev
dependencies, configured in `vite.config.ts` and `pwa-assets.config.ts`. `index.html` gained the
icon links, `theme-color`, and the two Apple-specific meta tags Safari needs for its own "Add to
Home Screen" to open standalone. None of this touches app code — `npm run build` output just gains
`manifest.webmanifest` + `sw.js` alongside the usual bundle.

**Still open, and worth knowing before the next session touches this:**

- **The install button doesn't appear yet.** Chrome (and Safari) only offer the real
  install/"Add to Home Screen" prompt over a secure context — `https://` or `localhost`. Tested
  over plain `http://<lan-ip>:4173` (via `npm run preview -- --host`), which loads and works fine,
  but Chrome silently refuses to register the service worker under those conditions, so it doesn't
  count as installable. This isn't a bug in the config — confirmed the manifest, `sw.js`, and every
  icon are served with correct content-types and up-to-date content.
- **Testing so far has been Mac-tethered**, and that took several attempts to get working at all:
  home wifi worked; a guest wifi network didn't (client isolation blocks phone↔laptop traffic even
  though both have internet); a spare router did work for LAN reachability, but its lack of its own
  internet uplink meant the Mac lost its connection to Claude Code the moment it joined — there's no
  way around needing a network with internet for that half, independent of the phone/Mac pairing.
- **The actual fix for both is deploying the build to a free static host** (Vercel/Netlify/etc.) —
  gives a permanent `https://` link, the install button starts working, and the Mac stops being
  required at all afterward (the service worker then genuinely caches the app onto the phone, so it
  keeps working offline too). Offered twice; Márk held off both times ("not yet") — don't deploy
  anywhere without asking again first.
- If a future session revisits this: Capacitor (real `.apk`/`.ipa`) remains fully compatible with
  everything built here — it wraps the same `dist/` output, manifest/icons/service-worker carry
  over unchanged. It would need Android Studio + the SDK (Android) and/or full Xcode + CocoaPods
  (iOS, Command Line Tools alone isn't enough) installed first, plus a paid Apple Developer account
  ($99/yr) for anything beyond a 7-day sideload on iOS.

---

## 3. Stack

| | | Why it's here |
| --- | --- | --- |
| React | 19.2 | — |
| Vite | 8.2 | Dev server + build |
| TypeScript | 6, strict | Also `noUnusedLocals`, `noUnusedParameters` |
| react-router-dom | 7.18 | Chosen over hand-rolled navigation — see §6 |
| Vitest | 4.1 | Test runner |
| Testing Library | + `user-event` | Component tests |
| ESLint | 10, flat config | — |
| vite-plugin-pwa | 1.3 | Manifest + service-worker generation, see §2's phone subsection |

**No CSS framework, no component library, no state library.** Plain CSS files and React's own
`useState`/`useContext`. For a prototype this size, a framework would be more to learn and more to
fight than to write it directly.

> **Trap that cost real time:** `npm run build` passing does **not** mean the types are fine. Vite
> strips TypeScript types without checking them, so a missing import or a wrong type builds
> perfectly and then explodes at runtime. **`npx tsc --noEmit` is the only thing that catches it.**
> Run it before you believe anything works.

---

## 4. Directory layout

```
src/
  App.tsx                  router + the signed-in gate
  routes.ts                every URL in the app, in one place
  main.tsx                 entry point
  index.css                design tokens (colours, chamfer shapes) + resets

  components/              reusable across pages
    PageShell.tsx/.css     the frame every page uses except Home. `compactTitle` shrinks the
                           header's <h1> for a page that's already tight on room (Trading).
                           Its back button uses topLevelRoutes.ts (below) — TODO #4
    topLevelRoutes.ts      isTopLevelRoute() — pure, unit-tested; the "back always goes Home
                           from here" page list (TODO #4), pulled out of PageShell.tsx so that
                           file can keep exporting only its component (Fast Refresh lint rule)
    NavBar.tsx/.css        bottom nav, self-navigating, floating (TODO #4)
    navItems.ts            nav list + activeNavKey() — pure, unit-tested
    useAutoCollapse.ts     the §3 nav auto-collapse timer
    GridSection.tsx        a titled grid of tiles (used by Home) — square-only, capped, links away
                           to a scrolling page on overflow, name+rating tile overlay, optional
                           "create new" tile. See PagedGrid below for the sibling this is
                           deliberately *not* merged with
    PagedGrid.tsx/.css     a non-scrollable, *paged* grid: Inventory's item grid and every row on
                           Trading (skills, the trading table) — see §8
    SquareTile.tsx         one tile — optional `overlay` prop pins content over the icon
    StarRating.tsx         ★★★☆☆ *display* — unrelated to StarRatingInput below, see §8
    StarRatingInput.tsx/.css   the star-picker *input* (radio-group fieldset) — Final Review's own
                           rating control, moved here once Search's minimum-rating filter (TODO
                           #13) needed the identical thing, not a lookalike — see §8
    OptionGroup.tsx        segmented control (used by Settings)
    TransferBox.tsx/.css   the "build an offer" box shared by Inventory and Skills, in both a
                           trade context and (TODO #8) picking a new ad's one subject — see §8
    SearchBar.tsx/.css     a text field + small submit button — Search's own search bar (TODO #13),
                           moved here once Inventory (TODO #9) needed the identical thing — see §8
    FilterChip.tsx/.css    a button that opens a floating panel underneath it — the shell Search's
                           filter row (TODO #13) and Inventory's one filter (TODO #9) both use; only
                           the shell is shared, panel content is always the caller's own — see §8

  hooks/
    useFittingRows.ts      how many square, N-wide cells fit a measured container — Inventory's
                           grid rows now come from this instead of reusing the grid-size setting
                           for both dimensions (TODO #9) — see §8

  pages/                   one folder-less file per screen, plus its .css
    onboarding/            multi-step onboarding, split into step components — StepSkills.tsx
                           (#2.1), StepFriends.tsx (#2.2), StepVerify.tsx (#2.3), and StepPhoto.tsx
                           (#2.5) are real steps now, six total with StepIntro (#2.4, still a
                           static illustration standing in for its eventual video) and
                           StepCustomize (pre-existing, outside TODO's numbered list, kept last).
                           Step order follows TODO.md's own 2.1–2.5 numbering.
                           SkippablePlaceholderStep.tsx is gone — no callers left once verify
                           became real
    usePhotoCapture.ts     the object-URL "picked photo" state + revoke-on-replace/unmount logic,
                           shared by StepVerify and StepPhoto (TODO #2.3/#2.5) — see §8
    PhotoPickerButton.tsx  a styled button wrapping a hidden `<input type="file">`; its `capture`
                           prop is the entire difference between "take a picture" and "choose from
                           your phone" (TODO #2.5) — see §8
    skillDraft.ts          SkillDraft type + its pure helpers (catalogDraft, findProblem,
                           matchingCatalogEntries, toSkill, ...) — pulled out of SkillPage.tsx so
                           StepSkills can reuse the exact same validation/search/proof-gate logic
                           rather than a second copy (TODO #2.1)
    ItemPage.tsx/.css      one inventory item's own page (view/edit/create) — TODO #10
    PartnerInventoryPage.tsx/.css   a trading partner's public inventory, read-only — see §8

  assets/                  images imported as modules (fingerprinted/bundled by Vite), not served
                           from public/ — currently just hours-wordmark.png, the login page's logo
                           image (TODO #14). The favicon/PWA icon *source*
                           (hours-logo-source.png) lives in public/ instead, and has to — see §8

  data/                    all mock data — mockOffers, mockUser, mockTrades,
                           mockInventory, mockCommunity

  settings/                theme + grid-size context, persisted to localStorage

  trading/                 TradeDraftContext + useTradeDraft — see §8. The *only* piece of
                           cross-page state in this prototype; everything else is page-local

  utils/swipe.ts           swipe-gesture maths, pure — isSwipeUp/isSwipeLeft/isSwipeRight (TODO #3)
  utils/formatHours.ts     formatHoursBalance() — the nav bar's "10h15m" formatter (TODO #4), pure
  utils/verificationCode.ts   generateVerificationCode() — onboarding's 5-digit code (TODO #2.3).
                           Not pure (uses Math.random()), tested across many samples instead of
                           by exact value

  __tests__/               mirrors src/ exactly
    helpers/renderWithRouter.tsx
```

**Tests mirror `src/`.** A component at `src/pages/WalletPage.tsx` is tested at
`src/__tests__/pages/WalletPage.test.tsx`. Keep that mapping — it's how you find things.

---

## 5. The conventions that are load-bearing

Break these and the app looks wrong or breaks quietly.

### Colours come only from tokens

`src/index.css` defines the palette twice — once on `:root` for light, once on
`:root[data-theme='dark']` for dark. Every colour in every other file is `var(--something)`.

```css
/* yes */  background: var(--surface);
/* no  */  background: #ffffff;      /* invisible in dark mode */
```

Tokens: `--brand-primary`, `--brand-primary-deep`, `--brand-accent`, `--brand-tint`, `--bg`,
`--surface`, `--surface-alt`, `--text`, `--text-muted`, `--border`, `--gridline`, `--shadow`.

### Corners are chamfered, never rounded

The brand shape is a **straight diagonal cut**, not a curve.

```css
/* yes */  clip-path: var(--chamfer);      /* or var(--chamfer-top) */
/* no  */  border-radius: 8px;
```

`--chamfer` cuts all four corners; `--chamfer-top` cuts only the top two, for things that sit on
top of something else. `--corner-cut: 8px` controls the size.

### Class names are BEM-ish, one CSS file per component

`.block__element`, with `.is-active` / `.is-open` as state modifiers. Each component imports its own
CSS file. Shared page furniture lives in `PageShell.css`: `.page-section`,
`.page-section__heading`, `.page-card`, `.page-note`, `.page-shell__action`.

`.page-note` has a specific job: **it marks something as deliberately unfinished**, so a stub reads
as "not built yet" rather than "broken".

### Accessibility is how the tests find things

Tests query by **role, label, and text** — never by CSS class. This is deliberate: it means the tests
break when the app becomes unusable, and survive when you restyle. It also means **an element the
tests can find is an element a screen reader can find**.

Practical consequences:

- Buttons need real accessible names (`aria-label` when the visible text is just an icon).
- Accessible names must be **unique on the page** — two buttons both called "Settings" makes
  `getByRole('button', { name: 'Settings' })` throw. This bit twice; both times the fix was a more
  specific name ("Open settings").
- `aria-label` on a bare `<div>` does nothing. It needs a role to attach to — see the
  `role="img"` in `SquareTile.tsx`, which is load-bearing, not decoration.

---

## 6. Navigation

### Why react-router

Márk chose it over hand-rolled navigation when asked. It buys real URLs (so `/trading/trade-1` is
shareable and the browser back button works), nested routes, and URL parameters.

### `routes.ts` — one file holds every URL

No component ever writes a path string. It imports from `routes.ts`:

```ts
ROUTES.home        // '/'
ROUTES.adDetail    // '/ads/:adId'  ← the pattern
adDetail('ad-7')   // '/ads/ad-7'   ← the actual URL
```

Routes with an id get a **builder function** so nothing string-concatenates a URL. There's also
`inventoryForTrade(tradeId)` → `/inventory?trade=X`, and (TODO #8) `skillsForNewAd()`/
`inventoryForNewAd()` → `/skills?forAd=new`/`/inventory?forAd=new` and `adCreateWithSkill(id)`/
`adCreateWithItem(id)` → `/ads/new?skillId=X`/`?itemId=X` — all explained in §8 below.

### The route table (`App.tsx`)

`/login` is public. Everything else sits behind `<RequireSession>`, which renders `<Outlet />` (the
matched child route) when signed in and redirects to login otherwise — so the check is written once
instead of in all fifteen pages. Unknown URLs redirect home.

"Signed in" is currently just `useState(false)` that flips on login and dies with the tab. Real auth
is `[OFFEN]` in the Appkarte.

**Ordering matters:** `/ads/new` is registered *before* `/ads/:adId`, or "new" would be read as an id.

### The nav bar navigates itself

`NavBar` reads the current URL via `useLocation()` and highlights itself using `activeNavKey()`.
It does **not** take `currentPage` / `onNavigate` props.

That was a deliberate call: the alternative threads two props through all thirteen pages, and every
new page has to remember to pass them. This way a new page gets working navigation for free.

`activeNavKey()` is a pure function in `navItems.ts` with its own unit test — it's the kind of small
logic that's easy to get subtly wrong (`/trades/7/review` must still light up "Trades", and `/`
must match only exactly, or its prefix matches every URL in the app).

**The bar floats now, instead of taking its own row (TODO #4).** `.nav-bar` is `position: fixed;
left: 0; right: 0; bottom: 0`, so it no longer reserves layout space — every page adds
`padding-bottom: var(--nav-bar-height)` (a token in `index.css`) to get that space back for
content instead. Picked over a "floating pill" (inset on all sides) because Márk asked for
edge-to-edge specifically when given the choice between the two.

### `PageShell` — the frame

Every page except Home renders inside it:

```tsx
<PageShell title="Wallet" headerAction={...}>
  ...content...
</PageShell>
```

It provides the header with a back button, the single scrolling content area, and the nav bar.
The header and the nav bar stay fixed; only `.page-shell__content` scrolls.

**The back button isn't always ordinary browser-back (TODO #4).** From a page one tap from Home —
Wallet, Profile, Trades, Inventory, Home, Your offers, Search — Back always goes Home regardless of
history; everywhere else (an ad, a skill, an item, Trading, Settings, ...) it's the ordinary
one-step `navigate(-1)`. The page list lives in `topLevelRoutes.ts` as `isTopLevelRoute()`, a pure
function `PageShell` calls, kept in its own file rather than inline so it stays unit-testable and
so `PageShell.tsx` keeps exporting only the component (a file mixing component and non-component
exports breaks React Fast Refresh — that's an ESLint rule, not a style opinion).

**Home is the deliberate exception.** `MainPage` renders `<NavBar>` directly instead. Two reasons:
its square grids need a definite page height, which `PageShell`'s padded scrolling content removes;
and Appkarte §3 makes Home the one screen where the nav bar doesn't auto-collapse.

---

## 7. The screens

All twenty exist and are routed (`AdDetailPage`, `SkillPage`, and `ItemPage` each double up as
their own creation route — `/skills/new`, `/inventory/new`, etc.).
"Depth" is the level agreed with Márk: **structural scaffold** —
real layout, real navigation, real filtering and local state; genuinely complex interactions
(drag-and-drop, live maps) are visible, labelled placeholders rather than fake-working.

| Route | Page | Appkarte | Notes |
| --- | --- | --- | --- |
| `/login` | LoginPage | §2 | Email/password fields, no functionality behind them yet (TODO #1). The h_OURs wordmark image is the page's `<h1>` (TODO #14). Method is `[OFFEN]` |
| `/onboarding` | OnboardingPage | §2 | Six steps, most skippable. Skills (#2.1), friends (#2.2), verify (#2.3), and profile picture (#2.5) are all real; only #2.4's video is still a static illustration |
| `/` | MainPage | §3 | Two fixed grids, no scroll. Not in PageShell |
| `/offers` | OffersPage | §4 | **Your** offers |
| `/search` | SearchPage | §4 | One-row filter bar opening floating panels (TODO #13); map view shows the placeholder map above the same results grid the text view uses |
| `/ads/new` | AdDetailPage `mode="create"` | §5 | Same component as below. Blank picture area shows Skill/Item picker buttons until `?skillId=`/`?itemId=` seeds the draft (TODO #8) |
| `/ads/:adId` | AdDetailPage | §5 | Detail doubles as create/modify. Both ratings for a skill offer, condition only for an item offer (TODO #8) |
| `/trading/:tradeId` | TradingPage | §6 | Non-scrollable; reworked twice this session — see §8. `?quick=1&hours=N` preloads the offered hours (TODO #8) |
| `/inventory` | InventoryPage | §6 | Non-scrollable paged grid, now with a search bar + visibility filter and rows sized to fill the page (TODO #9); `?trade=<id>` adds a transfer box, `?forAd=new` picks one item for a new ad (TODO #8) |
| `/inventory/:itemId` | ItemPage | — | View/edit an item (TODO #10) |
| `/inventory/new` | ItemPage `mode="create"` | — | Same component as above |
| `/inventory/partner?trade=<id>` | PartnerInventoryPage | §6 | A trading partner's public items, read-only — see §8 |
| `/wallet` | WalletPage | §7 | Charity/Foundation are `[OFFEN]` |
| `/profile` | ProfilePage | §7 | Best skills show both ratings and open the Skill page; a button opens Trades pre-filtered to already-reviewed |
| `/skills` | SkillsPage | §7 | Grid columns follow the Settings grid-size setting, rows uncapped; tiles open the Skill page; last tile is "+ Add skill"; transfer box at `?trade=<id>` or (TODO #8) `?forAd=new` |
| `/skills/:skillId` | SkillPage | §7 | View/edit/create in one component (AdDetailPage's pattern). Holds the proof-gated add-a-skill flow moved off SkillsPage |
| `/skills/new` | SkillPage `mode="create"` | §7 | Same component as above |
| `/trades` | TradesPage | §8 | Status: open / agreed / closed. `?status=closed` (optionally `&skill=<id>`) filters to already-reviewed trades |
| `/trades/:tradeId/review` | FinalReviewPage | §8 | Star **input**, not display |
| `/community` | CommunityPage | §9 | Out of prototype scope |
| `/settings` | SettingsPage | §9 | Theme + grid size, actually works |
| `/legal` | LegalPage | §9 | Out of scope — **see the warning below** |

### The Legal page contains no legal text, on purpose

`LegalPage.tsx` lists document *titles* and an unmissable "not drafted yet" state, and nothing else.
No terms, no policy wording, not a sentence of it.

This is not laziness. Invented legal prose is dangerous in a way a fake ad or a mock trade is not:
screenshotted or copied out of a prototype, it can be taken for a commitment the project never made.
Appkarte §9 specifies no content anyway. **Do not fill this page in with plausible-sounding text.**

---

## 8. Decisions worth knowing before you change something

**Ad detail and ad creation are one component.** `AdDetailPage` takes `mode?: 'create'`. Appkarte §5
describes one screen that changes mode, so it's one component with a flag, not two files that drift.

**Inventory's trading mode is a query parameter, not a second route.** `/inventory?trade=trade-1`.
Appkarte §6 describes the *same* page gaining a drop area and Accept / Back-to-trading buttons when
it knows which trade you're building an offer for. A second route would have meant duplicating the
page. `inventoryForTrade()` in `routes.ts` builds the URL; `TradingPage` links to it.

**Inventory shelves are gone from the type, not just capped.** TODO #9 puts shelves out of
prototype scope entirely (not "one level deep" — that was the previous session's compromise before
this one). `InventoryItem.shelf` and `MOCK_SHELVES` no longer exist; the header's shelf button
stays (TODO #9 anchors "New item" to it) but is now fully inert — no click handler at all, not
even a toggle. Its old "why isn't this built" explanation lives in the page's consolidated info
panel instead (see the Inventory decluttering entry below).

**The partner's hours are split in two.** In a trade, their *balance* is hidden (rendered as `???`)
but the hours they're *offering* are visible. Those are different fields — `MOCK_HOURS_BALANCE` vs.
`trade.partnerHours` — because they have different privacy rules.

**The partner's private inventory items never enter the DOM.** Not hidden with CSS — absent. There's
a test asserting exactly this, including after opening their full inventory. Keep it that way.

**`StarRating` is shared; the Final Review stars are not.** They look identical and are deliberately
separate: `StarRating` *displays* a value, Final Review's is an *input* (a radio-group `fieldset`).
Merging them would mean one component doing two jobs badly.

**Where "no premature abstraction" applied and where it didn't.** `StarRating` was extracted only
after two call sites had character-identical code — the duplication proved the need. `OfferTile`
(Offers and Search share tile markup) was noticed and **deliberately left duplicated**, because the
two are likely to diverge and the abstraction hasn't earned itself yet.

**The Skill page never persists anything — matched to AdDetailPage on purpose.** Editing a skill or
creating one behaves exactly like AdDetailPage's create mode: real validation (the proof gate, the
duplicate-name check), but "Save"/"Create skill" only shows a note that nothing is wired up. This
was a deliberate choice, confirmed with Márk, over lifting skills into a shared store — the
alternative would make one page in the app "more real" than every other detail page for no reason
tied to this TODO.

**SkillsPage's old inline add-a-skill form is gone, not duplicated.** TODO #6 asked for a button
that opens the Skill page instead; per Márk's call, the search/custom-skill flow (and its proof-gate
and duplicate-name logic) *moved* into `SkillPage`'s create mode rather than existing in both
places. `SkillPage.test.tsx` carries the tests that used to live on `SkillsPage.test.tsx`.

**A trade's "reviewed" state is just its `closed` status, reused.** TODO #5/#7 both want a
"reviewed trades" filter. Closing a trade already only happens via Final Review, so `?status=closed`
on `/trades` *is* "already reviewed" — no new field was invented for it.

**`Trade.skillId` is the minimum version of the §13 gap below, not the full fix.** It links a trade
to one of *your* skills so "all reviewed trades for this skill" can be answered. It does not make
Final Review skill-aware, and it is optional — most trades still carry no skill link.

**SkillsPage's transfer box exists but nothing points at it yet.** `/skills?trade=<id>` mirrors
`InventoryPage`'s `?trade=` convention exactly (same banner pattern, same "Add to offer" +
drop-zone-summary shape) — wiring an ad's "choose a skill" step to it is TODO #8, out of this
session's scope. It is fully built and tested against the query parameter directly.

### TODO #2.1 (this session)

**`SkillChooser` and `SkillForm` are exported from `SkillPage.tsx`, not duplicated for onboarding.**
The onboarding "Add your skills" step needed the exact same catalogue-search/custom-skill/proof-gate
flow `SkillPage`'s create mode already has — exporting the two components it's built from (both are
components, so this doesn't trip the `react-refresh/only-export-components` lint rule the way mixing
a component with a plain function export would) cost far less than a second, drifting picker. Their
shared *non-component* logic (`SkillDraft`, `catalogDraft`, `findProblem`, `matchingCatalogEntries`,
the proof-gate constants) moved out into a new `skillDraft.ts` for the same reason `topLevelRoutes.ts`
exists — a component file can only export components once another file needs its plain functions too.

**`toSkill()` needed the app's first-ever generated id.** Every other "create" flow in this prototype
(Ad, Item, Skill itself) validates a draft and then dead-ends at a "not saved" note — nothing ever
actually becomes a list item, so nothing has ever needed an id before. The onboarding skills step is
different: Continue's "at least one skill" gate means there has to be a real, growing local list to
count, so each added skill needs a stable id for its `key` and its remove button. `toSkill(draft, id)`
takes that id as a parameter rather than generating it itself, so the function stays pure and
testable — `crypto.randomUUID()` is called once, at the one call site in `StepSkills.tsx`, not
buried inside a "pure" helper.

**Nothing added during onboarding reaches `MOCK_SKILLS`.** The step's list is local `useState`,
gone the moment onboarding is left — same "nothing persists" honesty every other create flow in
this prototype already keeps, just with one more visible consequence (skills you "add" here won't
show up on Profile/Skills afterwards). That gap is real, not hidden: it's the same kind of thing
§13 already tracks for other pages.

### TODO #2.2 (this session)

**The Copy action is injected as a prop (`copyLink`), not called on `navigator.clipboard` directly
inside the component.** `StepFriends`'s default is the real Clipboard API
(`(link) => navigator.clipboard.writeText(link)`), but jsdom's own `navigator.clipboard` turned out
to be a getter with no setter — `Object.assign`/`Object.defineProperty` onto it either threw or
silently didn't take effect, the kind of test-environment fight that isn't worth winning. Accepting
the copy function as an optional prop sidesteps it entirely: tests pass a plain `vi.fn()`, the real
app gets the real API for free from the default parameter. The same shape would be worth reaching
for again anywhere else a browser API resists mocking.

**"An input box for copying a friend/community link" is taken literally — one field, one button.**
No QR code, no share sheet, no per-friend links, no way to regenerate the link: none of that is in
the TODO's one sentence, so none of it is built. `MOCK_INVITE_LINK` is a single fixed string in
`mockCommunity.ts`, not tied to `MOCK_PROFILE` or generated per session.

### TODO #2.3 (this session)

**The camera button is a plain file input, not a `getUserMedia` live feed.** Given the choice
directly, Márk picked `<input type="file" accept="image/*" capture="user">` over a hand-rolled
camera stream: on a real phone the file-input version already opens the OS's own camera app, and
skips having to handle `getUserMedia` permission prompts/denials and stream cleanup for a prototype
that never checks the result against anything. The input itself is visually hidden (clipped, not
`display: none`) so it stays reachable by keyboard/screen reader, wrapped in a `<label>` styled as
the button — the same "wrapper label" pattern `LoginPage`'s fields and `StepFriends`'s invite-link
input already use.

**The verification pic is an object URL, revoked on replacement or unmount.** `URL.createObjectURL`
never touches disk or a server — it's an in-memory handle the browser tab holds for as long as the
component needs it. Since retaking the photo is expected (identical UX to any camera app's "retake"
button), the previous URL is explicitly revoked each time a new one is created, and again on
unmount, so a chain of retakes across a long onboarding session doesn't quietly leak memory.

**Continue is never gated here, unlike the skills step.** TODO #2.1 explicitly asks for a
count-gated Continue; TODO #2.3 doesn't say anything of the kind, and its own last line ("we don't
actually verify anything") argues against inventing a requirement the card never made.

**`SkippablePlaceholderStep.tsx` is deleted, not left around unused.** It was skills/friends/verify's
shared placeholder shape; once verify became this step, none of its three call sites remained.
Its `.onboarding-step__placeholder` CSS went with it for the same reason.

### TODO #2.5 (this session)

**`usePhotoCapture` and `PhotoPickerButton` were extracted from `StepVerify`, not built fresh for
`StepPhoto`.** TODO #2.3's photo-capture pattern (object-URL state, revoke-on-replace/unmount, a
hidden file input styled as a button) was written once, for one call site, and left inline — the
right call at the time, per this document's own "no premature abstraction" bar (`StarRating`,
`TransferBox`). TODO #2.5 needing the *exact* same mechanics is what makes this the second real
call site, so pulling the shared parts into `usePhotoCapture.ts` (the state/effect half) and
`PhotoPickerButton.tsx` (the markup half) now clears that bar. `StepVerify` was refactored to use
both; its own tests needed no changes, since its rendered output is identical.

**`PhotoPickerButton`'s only real variable is the `capture` prop.** "Take a picture" vs. "choose
from your phone" (TODO #2.5's two buttons) turned out to be the same `<input type="file">` with
one HTML attribute present or absent — `capture="user"` jumps straight to the front camera, no
`capture` at all opens the OS's normal photo/file picker. Not two mechanisms, one component.

**The new step's position in the sequence follows TODO.md's own numbering, not insertion order.**
`OnboardingPage` now has six steps: skills (#2.1) → friends (#2.2) → verify (#2.3) → how-it-works
(#2.4) → profile picture (#2.5) → customize. `customize` ("Make it yours") predates TODO #2's
numbered list entirely (an earlier session's own addition per the Appkarte), so it stays last
rather than being reordered around #2.5.

**Nothing chosen here reaches `MOCK_PROFILE`.** Same "nothing persists" honesty as #2.3's
verification pic and every create/edit flow before it — `ProfilePage`'s avatar is still the fixed
🙂 in `mockUser.ts` regardless of what's previewed during onboarding.

### TODO #9–#13 (this session)

**`PagedGrid` is a new, separate component from `GridSection`, not a rewrite of it.** Both lock a
grid to a square-cell frame via container-query units, but they answer "what happens when there
are more items than fit?" differently: `GridSection` caps the grid and links away to a page that
scrolls (Home → Offers/Search). Inventory and Trading (TODO #9/#11) *are* that non-scrolling page,
so overflow is paged through in place instead — a fundamentally different behaviour, not a config
flag on the same component. `GridSection` is untouched; Home still uses it.

**`PagedGrid`'s square-cell math had a real, shipped bug — read this before touching the CSS
again.** Two compounding causes: (1) `.paged-grid__grid` is a `<ul>`, and never reset the browser's
default `padding-inline-start` (~40px, for a bullet marker `list-style: none` doesn't remove on its
own) — combined with this app's global `box-sizing: border-box`, that padding silently ate into the
width available for cells. On a large grid (Inventory) the loss was a small enough fraction to go
unnoticed by eye; on a small one (Trading's single-row strips) it was catastrophic — cells were
measured at **7.5px wide** at one point. (2) The original sizing formula picked an aspect-ratio'd
*box* and trusted `columns`/`rows` to divide it evenly, which is only exactly true when the gap
between cells is zero — real gaps distorted cells into visibly non-square rectangles at small
sizes. The fix (current code): solve for cell size directly — `--pg-cell` is the largest square
where `columns` of them *plus the gaps between them* fit the frame's width, and `rows` of them plus
their gaps fit its height — and reset the `<ul>`'s margin/padding. Both bugs were only caught by
actually screenshotting the rendered page and measuring `getBoundingClientRect()`, not by reading
the code or running the test suite — jsdom has no real layout, so PagedGrid.test.tsx can only
assert structure (cell counts, ARIA), never geometry. **If a future grid looks subtly
wrong, take a real screenshot and measure it — don't trust that green tests mean the pixels are
right.**

**`TransferBox` is genuinely shared, not a copy.** Extracted once `InventoryPage`'s `OfferZone` and
`SkillsPage`'s inline version were character-identical but for wording — the bar this document
already sets (`StarRating`'s history, above) before pulling anything out. `isAccepted` is optional
(default `false`): Inventory's own Accept now navigates away immediately (see below) and has
nothing left to confirm in place, so it simply doesn't pass it; Skills' Accept still shows the
confirmation, unchanged.

**`TradeDraftContext` (`src/trading/`) is the one cross-page store in this prototype, added
deliberately and late.** Every earlier session (including this one's first cut of Trading)
avoided a cross-page store on purpose — state lived on whichever single page needed it. That
stopped being sufficient the moment direct feedback asked for item-picking to move *off* Trading
entirely and onto Inventory's own `?trade=` page, reached via an "Add items" button: the offered
item ids now have to survive a real navigation there and back. `TradeDraftContext` is the smallest
thing that does that — one `Record<tradeId, itemIds>` in memory, gone on reload, modelled on
`SettingsContext`'s own provider/instance/hook split (just without the `localStorage` persistence
Settings needs and this doesn't). It holds **only** item ids — skills and hours still live in
`TradingPage`'s own local state, because nothing else ever changes them. Don't reach for this
pattern again without the same justification (a value that must survive a real route change); it's
already one exception to a rule that exists for a reason.

**`PartnerInventoryPage` is a new, separate, read-only page — not a mode of `InventoryPage`.**
Trading's "open her inventory" used to be an inline expandable `<dl>` on the Trading page itself
(no route existed for someone else's inventory). Direct feedback asked for that to become a real
inventory-shaped page. It reuses `PagedGrid`/`SquareTile` but is its own component rather than a
third branch on `InventoryPage` (which already juggles "browsing," "picking for a trade," and
"item detail" concerns) — tiles have no `onClick` at all, because nothing in this prototype models
requesting an item from someone else's side. Always needs `?trade=<id>`: the partner's display name
and the "back to trading" link both come from the trade, and this prototype only ever has one
partner inventory (`MOCK_PARTNER_INVENTORY`) regardless of which trade you came from — same
simplification `TradingPage` already made before this page existed.

**Trading's layout changed shape twice this session — the current code is the *second* rework, not
the first.** Worth knowing what came before, since none of it survives in the code itself:
1. First cut (built from TODO #11's wording): three equal-height zones (item grids for both sides,
   a skills zone, the trading table), items toggled directly on live grids on this page.
2. Direct feedback said that didn't match what was pictured at all. Reworked to: items picked
   entirely off-page (Inventory's `?trade=` flow via an "Add items" button; the partner's items via
   `PartnerInventoryPage`), skills kept as on-page rows (few enough to browse in place; items
   weren't, and Inventory already exists to manage them), the trading table stacked You-above-her
   with Accept/Decline centred between (not side-by-side, per feedback), and — after a further
   decluttering round — no page-level summary line, no visible "You"/partner-name labels on the
   skills rows (the aria-label still names them for assistive tech), no "Trading table" heading (a
   `--surface-alt` panel background marks its extent instead — genuinely darker in light mode and
   lighter in dark mode from the existing token, not a new one), a `compactTitle` header, and the
   final-review link moved to sit beside the Decline button instead of its own row below the table.
3. **Skills rows are a ranked, capped preview, not a paginated browse.** "A row of your/her best
   skills" is taken literally: `bestSkills()` in `TradingPage.tsx` sorts by rating and slices to
   exactly one page's worth (no pager). A page this height-constrained can't spare the room a pager
   needs *and* keep tiles legible — this was measured and confirmed, not assumed.
4. **A toggled explanation must never share flex space with the interactive table.** The
   final-review info toggle's two notes render as an absolutely-positioned overlay
   (`.trading-page__info-popover`), not a normal-flow sibling — a normal-flow version reintroduced
   the exact "text competing with `flex: 1` space" failure mode as the PagedGrid bug above, visibly
   crushing the table the moment the notes opened. If you add another toggled explanation anywhere
   this height-constrained, make it an overlay from the start.
5. **"You" sits between your table row and the respond row, not above your tiles.** A later, smaller
   piece of feedback — the label moved out of `.trading-page__side` entirely rather than staying
   nested in it; the group's own `aria-label="Your side of the trading table"` still names the
   region for assistive tech regardless of where the visible text sits.

**Inventory's Accept now leaves the page — it doesn't confirm in place.** Direct feedback: clicking
Accept in a trade context should close Inventory and return to Trading, the same destination
"Back to trading" already goes to. `onAccept` calls `navigate(trading(tradeId))` directly; there's
no `isAccepted` state left to manage on this page (see the `TransferBox` entry above).

**Every explanatory note on Inventory is consolidated behind one "ⓘ" header button, closed by
default.** Direct feedback: these used to be scattered — the shelf button's own toggle, a standing
paragraph under the grid that always rendered, and a sentence inside the trade-context banner. All
three now live in one panel at the top of the page (`isInfoOpen` in `InventoryScreen`), with the
trade-specific one appended only when `?trade=` is present. The panel renders in normal flow (not
an overlay, unlike Trading's) — safe here because `.inventory-page__grid-area` already has a
`min-height: 160px` floor rather than `min-height: 0`, so it can't be squeezed to nothing the way
Trading's table could.

### TODO #8 (this session)

**Three architectural forks were agreed with Márk before writing any code (`AskUserQuestion`), and
everything below follows from those three answers:**

1. **Keep every route/URL exactly as it is; only user-facing *wording* shifts toward "offer".**
   `ROUTES.adDetail`/`adCreate`/`offers` etc. are untouched — renaming them would have collided
   head-on with `/offers` already meaning *your* offers (the exact collision §12 used to flag).
   Only visible strings on `AdDetailPage` changed: "New ad"/"Untitled ad" → "New offer"/"Untitled
   offer", "Create ad" → "Create offer", "Ad not found" → "Offer not found", and the page-note
   copy that said "ad" now says "offer". Nothing else (Home's "Ads" section heading, component/file
   names like `AdDetailPage`/`AdGallery`/`AdForm`, code comments) was renamed — the decision was
   scoped to routes-and-wording, not a full find-and-replace, and Home's "Ads"/"Your offers" pairing
   is structural (mirrors `MOCK_ADS`/`MOCK_YOUR_OFFERS`), not incidental copy.
2. **The gallery shows "buttons first, then the normal photo gallery."** A brand-new, nothing-
   picked-yet draft shows two big Skill/Item buttons in `AdGallery`'s picture area (`picker` prop);
   the rest of the form (Title/Price/Description) renders normally underneath the whole time — only
   the picture area itself changes. Once a subject is picked, the picture area reverts to the
   ordinary icon+thumbnails frame plus a small "Change skill or item" link.
3. **Wiring is a generalized query parameter, not a new picker flow.** `?forAd=new` on
   `/skills`/`/inventory` (alongside the existing `?trade=<id>`) makes those pages show a "picking
   for a new ad" banner and transfer box instead of building a brand-new selection UI. Confirming
   navigates back to `/ads/new?skillId=<id>` or `?itemId=<id>`, which `AdDetailPage` reads to seed
   the draft.

**Ratings split by kind, but `Offer.rating` itself didn't move.** `reviewRating?` (skill offers) and
`conditionRating?` (item offers) were added alongside the existing `rating` — `rating` still drives
Home's tile overlay (TODO #3) unchanged, regardless of kind. At the offer's own detail view
(`AdDetails`), a skill shows `rating` *and* `reviewRating` ("both ratings" per the TODO); an item
shows only `conditionRating` in their place. `AdDraft` carries all four fields (`icon` included) as
plain required numbers with sensible defaults (0 for ratings, 3 — "average" — for a fresh
`conditionRating`) rather than optional/undefined, specifically so the JSX never needs `??`
scattered through it.

**A picked skill/item seeds the draft; nothing about it is stored anywhere else.** `AdDetailPage`
reads `?skillId=`/`?itemId=` directly (not via a new context) and looks the record up itself
(`findSkill`/`findItem`) each render — `toDraftFromSkill`/`toDraftFromItem` build an `AdDraft` from
it, mirroring the existing `toDraft(offer)` for an already-existing ad. The existing "state changed
during render" trick (already used to reseed the draft when `:adId` itself changes) was extended: a
*defined* `skillId`/`itemId` change reseeds the whole draft, but the param going back to `undefined`
(pressing "Change skill or item", which returns to a bare `/ads/new`) deliberately does **not**
wipe anything already typed — only a genuinely new pick overwrites the draft. Without that
asymmetry, "Change" would silently discard a title/price/description the user had already edited.

**The "Offer type" toggle and the picker buttons can't both be on screen — they're the same
decision twice.** The first cut of this had `AdForm`'s pre-existing Skill/Item `OptionGroup` render
underneath the picker at the same time, which put two buttons named "Skill" and two named "Item" on
one screen — genuinely ambiguous to a screen reader and to `getByRole` alike (caught by the test
suite, not by eye). Fixed with `AdForm`'s new `showKindToggle` prop: false exactly while the picker
is showing (`needsSubjectPick`), true everywhere else (editing an existing ad, or a create that
already has a pick) — the two controls are mutually exclusive in time, never both mounted.

**`TransferBox` is now fully generic — trade-specific language is gone from the component itself.**
`tradeId`/`partnerName`/the hardcoded "Back to trading" `Link`/"Accept" label became `backTo:
{label, path}`, `primaryLabel`, `onPrimary`, and an optional `confirmedMessage` string the *caller*
builds (SkillsPage/InventoryPage now compose the "Offer accepted: N skills for the trade with X."
sentence themselves, since an ad-picking caller has a different sentence — or none, since its
"confirm" always navigates away immediately, the same as InventoryPage's trade-mode Accept already
did). A new `primaryDisabled` prop (default `false`) covers the ad-picker's "nothing chosen yet"
case, which a trade never needed (an empty offer could always be "Accept"ed). `noun`/`pluralNoun`
shrank to just `noun` plus a new `pickActionLabel`, since the pluralized "N skills" sentence moved
to the caller and the drag-and-drop note only ever needed the singular form.

**Picking for a new ad caps at one item/skill — "add" becomes "replace."** `SkillsPage.chooseForAd`
and `InventoryPage`'s ad-mode `toggleOffered` both call `setOfferedIds([id])`/an equivalent single-
element array rather than appending, since an ad has exactly one subject where a trade's offer is
open-ended. Both pages keep this pick in ordinary page-local `useState` (not `TradeDraftContext`):
that context exists specifically so item ids survive the Inventory↔Trading round trip, which the ad
picker doesn't need — it hands its pick back through the URL instead, the same mechanism
`?trade=<id>` itself already uses.

**Quick Buy's hours prefill was a real, separate bug — not just "add a query param."** `trading()`
gained an `hours` option (alongside the existing `quick`), and `AdDetailPage`'s `handleQuickBuy` now
passes `offer.hours` through. The actual fix is on `TradingPage`: `offeredHours`'s initial state used
to always be `trade.yourHours`, full stop — `isQuickOffer` only ever affected the chat. The new pure
`initialOfferedHours(trade, isQuickOffer, searchParams)` helper reads `?hours=` **only** when
`isQuickOffer` is true (a plain "Open trading window" still ignores it, matching the TODO's own
wording that only Quick Buy pre-fills), falls back to `trade.yourHours` on anything missing or
unparseable, and clamps the result to `MOCK_HOURS_BALANCE` so a stale or tampered URL can never
smuggle in more hours than you actually have.

**A Playwright QA pass caught a test-*script* bug worth remembering, not an app bug.**
`page.waitForURL()` resolves the instant `history.pushState` fires, which happens synchronously
inside `navigate()` — but React's actual re-render (unmounting the old route, mounting the new one)
happens on React's own next tick, and a screenshot taken immediately after `waitForURL` can still
capture the *previous* page's fully-rendered DOM. Confirmed by checking `page.url()` (already
correct) against actual DOM text (still the old page) at the same instant. Fixed by waiting on a
locator from the destination page (`page.getByRole(...).waitFor()`) instead of the URL — the general
lesson: **when driving client-side routing with Playwright, wait for rendered content, not for the
URL to match.**

**A floating panel that was genuinely invisible, not a browser quirk — `overflow-x` alone clips
both axes.** Search's filter panels (TODO #13) render as an absolutely-positioned child of
`.search-page__filters`, which had `overflow-x: auto` on it as a speculative narrow-viewport safety
net. That single declaration was enough to hide every panel completely: per CSS Overflow §3, setting
`overflow` on one axis computes the *other* axis to `auto` too if it isn't already `visible` — so
`overflow-y` silently became `auto` as well, and `overflow: auto` clips *any* descendant that paints
outside the box, including an absolutely-positioned one whose whole point is to paint past its
parent's own short height. The DOM was correct the whole time (`aria-expanded` flipped, the panel
had a real bounding box, `elementFromPoint` even returned its button as topmost) — it was being
clipped to invisible, not failing to render. Diagnosed by forcing a loud `background: red; z-index:
99999` inline style, which *still* didn't show, ruling out z-index/paint-order before checking every
ancestor's computed `overflow`. Fixed by deleting the `overflow-x: auto` outright — the row's three
buttons already fit at any width this app targets — documented in `SearchPage.css`'s own comment.
**General lesson: never add `overflow-x`/`overflow-y` to an element that also hosts an
absolutely-positioned overlay meant to extend past it — put the overflow guard on a sibling wrapper
around just the part that needs it instead.**

**`StarRatingInput` (`components/`) is Final Review's own rating picker, moved out once Search
needed the identical thing.** It used to be a small component defined locally inside
`FinalReviewPage.tsx` (radio-group stars, §8's "0 is a real choice" rule). TODO #13's
minimum-rating filter asked for "a star chooser like when creating a rating" — not a lookalike, the
same control — so rather than duplicate the radio-group/CSS a second time, it moved to
`components/StarRatingInput.tsx` once there were two real callers (the "wait for a second use before
abstracting" bar this codebase already applies elsewhere, e.g. `TransferBox`, `usePhotoCapture`).
`FinalReviewPage.tsx` now imports it instead of defining it; its own tests were untouched by the
move since they query by role/label, not by the old `final-review-page__star*` class names (those
moved to `StarRatingInput.css` and got their own `star-rating-input__*` names — nothing outside the
component referenced the old ones). Don't confuse it with the pre-existing, unrelated
`components/StarRating.tsx` — that one is the read-only ★★★★☆ *display* used on Profile/Skills/
Trades/offer-detail pages; the two stay separate components on purpose, per that file's own doc
comment, because a display and an input have different accessibility needs (a label read aloud vs.
a real radio group).

### TODO #9 rework — search, filter, and fitting rows (this session, same branch as TODO #13)

**`SearchBar` and `FilterChip` (`components/`) are TODO #13's search bar and filter-chip shell,
pulled out once Inventory became the second real page that wanted them.** Same bar this document
already sets elsewhere (`StarRatingInput`, `TransferBox`, `usePhotoCapture`): the first page to need
a pattern gets it written inline; the second gets it extracted. `SearchPage.tsx` was refactored to
import both instead of keeping its own copies — its 14 existing tests passed unchanged after the
refactor, which is what actually confirms nothing about its behaviour moved, not just the diff
looking equivalent. `FilterChip` owns only the "small button that reveals a floating panel
underneath it" shell (trigger + panel, single-open-at-a-time state stays with whichever page uses
it — Search juggles three, Inventory just one); what's inside the panel is always the caller's own
choice of control (`OptionGroup`, a range input, `StarRatingInput`).

**`useFittingRows` (`hooks/`) measures the grid's own container instead of trusting the grid-size
setting for both dimensions.** TODO #9 asked for "columns by the setting and rows as many as fits"
— previously `InventoryPage` passed `gridSize` into *both* of `PagedGrid`'s `columns`/`rows` props,
so a 3-setting always meant a fixed 3×3 page regardless of how much vertical space was actually
free. The new hook watches `.inventory-page__grid-area` with a `ResizeObserver`, and
`fittingRows(width, height, columns, minRows)` (exported separately, tested with plain numbers) works
out how many square, `columns`-wide cells fit the measured height. `minRows` defaults to `columns`
itself, which matters more than it looks: jsdom never lays anything out (`getBoundingClientRect`
always reads `{0,0,0,0}` there), so every existing Inventory test keeps seeing the old fixed 3×3
page for free, with no geometry stubbing needed — only a *new* test (mocking
`getBoundingClientRect` to a taller box) exercises the "more rows than columns" path at all. jsdom
also has no `ResizeObserver` — `setupTests.ts` now installs a harmless no-op stand-in globally, the
same "polyfill once for the whole run" idea as the `@testing-library/jest-dom` import already there,
since nothing needs it to actually *fire* in a test environment with no real layout to observe.

**Inventory's search and filter only narrow what the grid shows — they never touch the underlying
item list.** An item already sitting in a trade's transfer box (added before you typed a search)
stays there even once a search or the visibility filter would hide its tile; `offeredItems` is
still computed from the full `MOCK_YOUR_INVENTORY`, only the grid's own `matches` list is filtered.
The one filter is visibility (All/Public/Private) rather than Search's skill/item split — TODO #9's
own "no skills are here" — since that's the axis this page already cared about (the "N of M visible
to a trading partner" line predates this rework).

### TODO #14 — the real h_OURs logo (this session, same branch)

**The default Vite/React scaffold icons were long gone before this TODO was even written** —
`src/assets/{react,vite}.svg` were deleted in this repo's second-ever commit. What TODO #14 actually
needed, once that was checked, was replacing last session's placeholder favicon/PWA icon set (a
hand-drawn abstract mark, purple-branded but not the real logo) with the actual h_OURs logo, which
only reached this repo as raster PNG exports from wherever Márk's design work happens — a claude.ai
design-system project was checked first (`DesignSync`'s `list_projects`/`list_files`) and came back
empty, so the files were shared directly instead.

**Near-miss: the exports were handed over sitting inside `dist/`, which is gitignored and gets wiped
by every `npm run build`.** First move on receiving the path was copying the two needed files out —
`public/hours-logo-source.png` (the circular badge) and `src/assets/hours-wordmark.png` (the
"h_OURs" wordmark) — into permanent, tracked locations *before* touching any config. Confirmed
after the fact: a build run later in the same session did wipe `dist/assets/design/`, exactly as
expected.

**The PWA icon generator writes output *next to* its source image — there's no separate "output
directory" option.** `pwa-assets.config.ts`'s `images: [...]` array has always worked this way (the
previous `public/favicon.svg` source coincidentally already lived where the output needed to go); a
first attempt at keeping the source in a tidier separate `design/` folder produced icons in
`design/` instead of `public/`. The source has to live inside `public/` itself for that reason,
however much a separate design-assets folder sounds like better hygiene.

**There is no vector favicon anymore, on purpose, not as an oversight.** The old `public/favicon.svg`
was a hand-drawn vector; the real logo only exists as a raster export with no vector equivalent.
Rather than fake one (embedding the PNG inside an `<svg><image>` wrapper — technically valid, not
actually scalable, just a lie about the file format), `public/favicon.svg` and its
`<link type="image/svg+xml">` in `index.html` were removed outright. Browsers fall back to
`favicon.ico` (48×48, still generated) or the manifest's own PNG icon list — the same as any site
that never had an SVG favicon. `sharp`, which the generator uses internally, reads PNG input exactly
as well as SVG; the only real constraint is that it can't rasterize *up* past the source's own
519×518 resolution, comfortably above every size this preset asks for (512px, the largest).

**The login page's wordmark image *is* the page's `<h1>` now, not a caption next to one.** It used
to be a small badge `<img alt="" aria-hidden>` beside a plain text `<h1>h_OURs</h1>` — TODO #14
replaced both with one `<img>` carrying the real wordmark, imported as a module
(`import wordmark from '../assets/hours-wordmark.png'`) rather than referenced by a `public/` URL
string, so Vite fingerprints and bundles it like any other code dependency. The image sits inside
the `<h1>` (`<h1><img alt="h_OURs" /></h1>`) so the page keeps a real heading for document structure
and assistive tech, even though there's no separate line of visible text left to give it one.

**Left alone on purpose, worth a decision later: the manifest's `theme_color` and every
`--brand-primary` button/highlight in the app are still the old solid purple (`#863bff`), while the
new logo is a green→purple gradient.** Recolouring the app's whole palette to match felt like a
separate call from "swap the icon" — flag this if a future TODO wants the brand colours to follow
the new logo.

---

## 9. Mock data

All of it lives in `src/data/`. No component invents its own.

| File | Holds |
| --- | --- |
| `mockOffers.ts` | `Offer` (`kind: 'skill' \| 'item'`, `hours`, `distanceKm`, `rating`, now `reviewRating?` for skills and `conditionRating?` for items — TODO #8), `MOCK_ADS` (26), `MOCK_YOUR_OFFERS` (24), `findOffer`, `isYourOffer` |
| `mockUser.ts` | `MOCK_HOURS_BALANCE`, `MOCK_WALLET`, `Skill` (now incl. `description`, `reviewRating`), `MOCK_SKILLS`, `MOCK_PARTNER_SKILLS`, `findSkill`, `SKILL_CATALOG`, `CUSTOM_SKILL_CAP`, `MOCK_PROFILE`, `Review`, `MOCK_REVIEWS`, `reviewsForSkill()` |
| `mockTrades.ts` | `TradeStatus`, `Trade` (incl. `partnerHours`, `skillId?`, now `lastInteractionAt` — a real ISO date, `lastInteraction` stays as display prose — and `hasUnreadMessage?`), `ChatMessage`, `MOCK_TRADES` (6), `findTrade`, `canRespondToOffer()`, `statusAfterAccept()` — the TODO #13 status-pipeline helpers |
| `mockInventory.ts` | `InventoryItem` (`isPublic`, `description?` — **`shelf` is gone, see §8**), yours (20) + partner's (12, two private), `publicItems()`, `findItem()` |
| `mockCommunity.ts` | `Friend` (7), `BlockedPerson` (2), `BoardPost` (4), `MOCK_INVITE_LINK` (TODO #2.2) |

**Adding a required field to `Offer`, `Skill`, or `Trade` breaks test factories.** They build objects
by hand. `tsc --noEmit` will tell you exactly where.

---

## 10. Testing

```bash
npm run test        # once
npm run test:watch  # on save
```

Use the shared helper rather than rendering bare:

```tsx
import { renderWithRouter } from '../helpers/renderWithRouter'

renderWithRouter(<TradingPage />, {
  route: '/trading/trade-1',   // the URL to start at
  path: '/trading/:tradeId',   // the pattern, so useParams() resolves
})
```

Pass `path` whenever the page reads a URL parameter, or `useParams()` comes back empty. The helper
also exports `LocationProbe` (asserts the current URL after navigation) and `stubMatchMedia()`
(jsdom has no `matchMedia`; anything touching the theme needs it).

Two traps already hit and fixed:

- **`userEvent` deadlocks against Vitest fake timers**, even with `advanceTimers` configured. The
  nav-collapse test uses `fireEvent.click` instead, with a comment saying why.
- **`navigate(-1)` fires `popstate` asynchronously.** Assert with `await screen.findByText(...)`, not
  `getByText`, or you race the navigation. This is why `App.test.tsx` passed alone and failed in the
  full suite.

---

## 11. Working agreements (from `CLAUDE.md`)

These are Márk's rules. They override default behaviour.

- Clean code: small functions, descriptive names, **no premature abstraction**
- **A test for every new function or component** before it counts as done
- TypeScript strict
- Composition over inheritance
- This is a prototype, but a good one becomes the real app — build accordingly
- **Márk is new to app development and React — explain the reasoning, don't just make the change.**
  This has been asked for explicitly. When a change is non-obvious, say why it's right, what the
  alternative was, and what rule it follows.
- New git branch every session where anything is modified
- **Don't commit until Márk says so**
- Remove commented-out code before committing
- Before committing: update `HANDOFF.md` — **this file**. Update it rather than starting a new
  one, and correct anything in it that the session made untrue.
- **`TODO.md` is Márk's list, written between sessions.** He specifies which points to tackle.
- **Ask at the start of each session which TODO point you're working on.**
- **Once committed, open a pull request.**

---

## 12. `TODO.md` collides with what's built — read this before touching anything

`TODO.md` is a **rework list**. Several entries change or reverse decisions already implemented. That
is fine and expected — this scaffold exists to be reacted to. But a new session that treats the
current code as settled will fight it.

**`TODO.md` wins. Where it contradicts this document, this document is out of date.**

No open collisions remain — the one TODO #8 used to list here (other people's ads renamed
"offers", which would have collided head-on with `/offers` already meaning *your* offers) was
resolved by Márk's own call: keep every route as-is, shift only user-facing wording (see the
TODO #8 entry below and §8's own subsection for the reasoning).

**TODO #1 is done** (branch `todo-1-login`): `LoginPage` has Email and Password fields, uncontrolled
on purpose (see §2) since there's no account system yet to check them against; the button still
logs in unconditionally. The logo TODO #1 also asks for was already built.

**TODO #2.1 is done** (branch `todo-2-1-onboarding-skills`): onboarding's "Add your skills" step
reuses `SkillPage`'s own catalogue/custom-skill/proof-gate flow (see §8) instead of a placeholder;
Continue is disabled until at least one skill has been added, Skip still always works.

**TODO #2.2 is done** (branch `todo-2-2-onboarding-friends`): onboarding's "Add friends" step shows
a read-only invite-link field and a Copy button (see §8) instead of a placeholder.

**TODO #2.3 is done** (branch `todo-2-3-onboarding-verify`): onboarding's "Verify your identity"
step generates a big 5-digit code and a "Take a picture" button (a native file-input camera
capture, see §8) instead of a placeholder; Continue is never gated on it.

**TODO #2.5 is done** (branch `todo-2-5-onboarding-photo`): a new sixth onboarding step, "Add a
profile picture", with both buttons the TODO asks for (see §8 for `usePhotoCapture`/
`PhotoPickerButton`, shared with #2.3 now that this is a second real call site). TODO #2's only
remaining gap is #2.4's video, which is still a static illustration — that one alone was flagged
earlier this session as needing a real recorded asset, not code, and stays out of scope here too.

**TODO #3, #4 are done** (branch `todo-3-4-home-navbar`): Home's Ads/Your-offers headings centred
with matching corner-arrow side and swipe direction (right arrow + swipe-left-to-right → Your
offers; left arrow + swipe-right-to-left → Search — see `MainPage.tsx`'s doc comment for the
reasoning if this reads backwards from what you pictured), a "create new offer" tile that lands in
Your offers' last grid cell, and name+rating tile overlays. The nav bar now floats (`position:
fixed`, no longer reserving layout space — every page compensates with the new `--nav-bar-height`
padding token), Home sits in the middle of the remaining six items, Settings is off the bar, Hours
renders as a plain `formatHoursBalance()`-formatted number (`"12h"` / `"10h15m"`) in a double-width
slot with no icon, gridlines sit between items, and `PageShell`'s back button now calls the new
`isTopLevelRoute()` check (`topLevelRoutes.ts`) to decide Home-vs-ordinary-back.

**TODO #5, #6, #7 are done** (previous session): both ratings everywhere a skill appears, the
Skills grid rework (grid-size columns, uncapped rows, data overlaid on the tile), the add-a-skill
flow moved to the new Skill page, and the Skill page itself (view/edit/create, per-skill reviews, a
link to that skill's reviewed trades).

**TODO #9, #10, #11, #12, #13 are done** (previous session): Inventory reworked into a non-scrollable
paged grid with shelves fully out of scope; a new Item page (view/edit/create, public/private
switch); Trading reworked to non-scrollable (twice — see §8 for why the current shape isn't the
first one built); Trades gaining search, a status filter (defaulting to open), sort by real date,
closed-trade skill ratings, and an unread-message icon; and a real session-local trade-status
pipeline (Accept/Decline on Trading, Quick Buy's expanded chat from the Ad page — the hours
themselves didn't actually preload yet at that point; that part of TODO #13's own last line stayed
open until TODO #8 below). See §8 for the judgement calls — there are a lot of them this time,
several from direct feedback after the first cut of Inventory/Trading was already built and
clicked through.

Both new concepts flagged as "half-built" in the previous version of this document are now fully
built and wired:

- **Transfer box** is a real shared component (`TransferBox.tsx`, see §8), used by both Inventory
  and Skills, with Accept behaviour that now differs between them on purpose (see §8).
- **Item as a first-class page** exists (`ItemPage.tsx`, TODO #10), reached from Inventory's tiles
  and its own "New item" button.

**TODO #8 is done** (branch `todo-8-ad-offer`): both ratings for a skill offer / condition-only for
an item offer at `AdDetailPage`; a brand-new offer's picture area shows Skill/Item picker buttons
that hand off to Skills'/Inventory's own transfer box at `?forAd=new`, wiring the "choose a
skill/item" step this document used to flag as the last gap; and Quick Buy's hours actually preload
onto the trading table now (the piece of TODO #13 that stayed open above). See §8's own subsection
for the three architectural forks this needed and every judgement call underneath them.

**TODO #13 is done** (branch `todo-13-search`) — note this is `TODO.md`'s *current* #13
("Sreach"), a different item from the trading-status-pipeline #13 the entry above refers to;
`TODO.md`'s numbering was reused between sessions. Search's header search-label is gone in favour
of `aria-label` alone, a small submit button sits beside the field, the always-visible
skill/item/distance/rating controls became a one-row bar of buttons opening floating panels
(minimum rating is the exact same star picker Final Review uses to *set* one, not a lookalike —
see §8), the view toggle moved into the page header, the map view now shows the same results grid
underneath it instead of a separate side-by-side list, and each tile carries a compact `"N★"`
corner badge instead of a five-glyph star row. See §8 for a real CSS clipping bug hit along the way.

**TODO #9's rework is done, and TODO #14 is done** (same branch, later): Inventory gained the
search bar + visibility filter TODO #9 asked for, and its grid now measures how many rows actually
fit under them instead of reusing the grid-size setting for both dimensions. The favicon, every PWA
icon, and the login page's wordmark all show the real h_OURs logo now, not the placeholder abstract
mark from the PWA session before this one. See §8 for both — the icon swap in particular has a
near-miss worth reading (design files handed over inside the gitignored `dist/` folder) before it
happens again.

---

## 13. Open questions — Márk's call, not yours

**From the Appkarte §10**, still unresolved: login/registration method; whether verification is
skippable; bio field HTML vs plain text; trading-table icons; wallet history/review-others location
and the payment flow; charity and foundation mechanics; exact grid tuning; the trades status label
(suspected typo); home grid values and whether others' ads are view-only.

**Found while building, not recorded anywhere:**

1. ~~`Trade` has no link to a skill.~~ **Partially fixed:** `Trade.skillId?` now exists, just
   enough for "all reviewed trades for this skill" (TODO #7) to work. Final Review still rates a
   free-text `subject` rather than an actual skill, and most trades still carry no `skillId` — a
   full fix would mean Final Review writing that link when a trade closes, which nothing does yet.
2. ~~`lastInteraction` is prose, not a timestamp.~~ **Fixed this session:** `Trade.lastInteractionAt`
   is a real ISO date now, used for TradesPage's actual sort; `lastInteraction` stays as separate
   display prose (the same pattern `Skill.rating`/`reviewRating` already uses) rather than
   formatting the timestamp back into words.
3. **The trade-status pipeline (TODO #13) is entirely session-local, same as everything else in
   this prototype — worth restating because it's the first time status actually *changes* at
   runtime.** Accept/Decline on `TradingPage` and Quick Buy's pre-fill both work against local
   `useState`, not `MOCK_TRADES` — reloading resets a trade to its original mock status. Building
   real trade *creation* (the Appkarte's "not existing" pre-trade state) is a bigger step than any
   TODO so far has asked for; `TradingPage` still always needs a resolvable trade id.

---

## 14. If you are a fresh session starting here

1. Read `CLAUDE.md`. Those rules override defaults.
2. **Ask which `TODO.md` point you're working on.** Don't guess, and don't do all of them.
3. Check §12 above for whether that point contradicts existing code. If it does, say so before
   starting — it usually means deleting something that currently works, and Márk should know that's
   what's about to happen.
4. New branch before modifying anything.
5. Write tests alongside, not after.
6. Run `npm run test`, `npx tsc --noEmit`, and `npm run lint` before claiming done. All three.
7. Don't commit until asked.
