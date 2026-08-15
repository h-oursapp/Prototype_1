# h_OURs Prototype — Handoff

Written 2026-08-14, on branch `scaffolding_prototype`; updated same day on branch
`todo-5-6-7-profile-skills-skill` after building TODO #5–#7 (Profile, Skills, Skill); updated
again on branch `todo-9-13-inventory-trading` after building TODO #9–#13 (Inventory, Item,
Trading, Trades, the trading-process status pipeline) and then reworking Inventory and Trading
again across several rounds of direct feedback once they were actually clicked through. Updated
three more times on 2026-08-15, each its own small branch/PR per Márk's "one TODO point at a time,
check in after each" call this session: `todo-3-4-home-navbar` (TODO #3–#4: Home's grids and swipe
gestures, the nav bar's rework into a floating bar), `todo-1-login` (TODO #1: Login's email/password
fields), and `todo-2-1-onboarding-skills` (TODO #2.1: onboarding's real "Add your skills" step).

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
npm run test        42 files, 303 tests, all passing
npx tsc --noEmit    clean
npm run lint        clean
npm run build       succeeds
```

This calendar session (2026-08-15) shipped three small, independently-branched-and-PR'd TODO
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
    StarRating.tsx         ★★★☆☆ display
    OptionGroup.tsx        segmented control (used by Settings)
    TransferBox.tsx/.css   the "build an offer" box shared by Inventory and Skills — see §8

  pages/                   one folder-less file per screen, plus its .css
    onboarding/            multi-step onboarding, split into step components — StepSkills.tsx is
                           the real "Add your skills" step (TODO #2.1), the other placeholder
                           steps stay in OnboardingPage.tsx itself, one `if` per step index
    skillDraft.ts          SkillDraft type + its pure helpers (catalogDraft, findProblem,
                           matchingCatalogEntries, toSkill, ...) — pulled out of SkillPage.tsx so
                           StepSkills can reuse the exact same validation/search/proof-gate logic
                           rather than a second copy (TODO #2.1)
    ItemPage.tsx/.css      one inventory item's own page (view/edit/create) — TODO #10
    PartnerInventoryPage.tsx/.css   a trading partner's public inventory, read-only — see §8

  data/                    all mock data — mockOffers, mockUser, mockTrades,
                           mockInventory, mockCommunity

  settings/                theme + grid-size context, persisted to localStorage

  trading/                 TradeDraftContext + useTradeDraft — see §8. The *only* piece of
                           cross-page state in this prototype; everything else is page-local

  utils/swipe.ts           swipe-gesture maths, pure — isSwipeUp/isSwipeLeft/isSwipeRight (TODO #3)
  utils/formatHours.ts     formatHoursBalance() — the nav bar's "10h15m" formatter (TODO #4), pure

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
`inventoryForTrade(tradeId)` → `/inventory?trade=X`, explained in §8 below.

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
| `/login` | LoginPage | §2 | Email/password fields, no functionality behind them yet (TODO #1). Method is `[OFFEN]` |
| `/onboarding` | OnboardingPage | §2 | Multi-step; most steps skippable. Skills step is real (TODO #2.1); friends/verify/photo are still placeholders |
| `/` | MainPage | §3 | Two fixed grids, no scroll. Not in PageShell |
| `/offers` | OffersPage | §4 | **Your** offers |
| `/search` | SearchPage | §4 | Filters + a placeholder map |
| `/ads/new` | AdDetailPage `mode="create"` | §5 | Same component as below |
| `/ads/:adId` | AdDetailPage | §5 | Detail doubles as create/modify |
| `/trading/:tradeId` | TradingPage | §6 | Non-scrollable; reworked twice this session — see §8 |
| `/inventory` | InventoryPage | §6 | Non-scrollable paged grid (TODO #9); `?trade=<id>` adds a transfer box |
| `/inventory/:itemId` | ItemPage | — | View/edit an item (TODO #10) |
| `/inventory/new` | ItemPage `mode="create"` | — | Same component as above |
| `/inventory/partner?trade=<id>` | PartnerInventoryPage | §6 | A trading partner's public items, read-only — see §8 |
| `/wallet` | WalletPage | §7 | Charity/Foundation are `[OFFEN]` |
| `/profile` | ProfilePage | §7 | Best skills show both ratings and open the Skill page; a button opens Trades pre-filtered to already-reviewed |
| `/skills` | SkillsPage | §7 | Grid columns follow the Settings grid-size setting, rows uncapped; tiles open the Skill page; last tile is "+ Add skill"; transfer box at `?trade=<id>` |
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

---

## 9. Mock data

All of it lives in `src/data/`. No component invents its own.

| File | Holds |
| --- | --- |
| `mockOffers.ts` | `Offer` (`kind: 'skill' \| 'item'`, `hours`, `distanceKm`), `MOCK_ADS`, `MOCK_YOUR_OFFERS`, `findOffer`, `isYourOffer` |
| `mockUser.ts` | `MOCK_HOURS_BALANCE`, `MOCK_WALLET`, `Skill` (now incl. `description`, `reviewRating`), `MOCK_SKILLS`, `MOCK_PARTNER_SKILLS`, `findSkill`, `SKILL_CATALOG`, `CUSTOM_SKILL_CAP`, `MOCK_PROFILE`, `Review`, `MOCK_REVIEWS`, `reviewsForSkill()` |
| `mockTrades.ts` | `TradeStatus`, `Trade` (incl. `partnerHours`, `skillId?`, now `lastInteractionAt` — a real ISO date, `lastInteraction` stays as display prose — and `hasUnreadMessage?`), `ChatMessage`, `MOCK_TRADES` (6), `findTrade`, `canRespondToOffer()`, `statusAfterAccept()` — the TODO #13 status-pipeline helpers |
| `mockInventory.ts` | `InventoryItem` (`isPublic`, `description?` — **`shelf` is gone, see §8**), yours (8) + partner's (5, one private), `publicItems()`, `findItem()` |
| `mockCommunity.ts` | `Friend` (7), `BlockedPerson` (2), `BoardPost` (4) |

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
- Before committing: run `/compact` and save the result into `HANDOFF.md` — **this file**. Update it
  rather than starting a new one, and correct anything in it that the session made untrue.
- **`TODO.md` is Márk's list, written between sessions.** He specifies which points to tackle.
- **Ask at the start of each session which TODO point you're working on.**
- **Once committed, open a pull request.**

---

## 12. `TODO.md` collides with what's built — read this before touching anything

`TODO.md` is a **rework list**. Several entries change or reverse decisions already implemented. That
is fine and expected — this scaffold exists to be reacted to. But a new session that treats the
current code as settled will fight it.

**`TODO.md` wins. Where it contradicts this document, this document is out of date.**

Known collisions, by TODO section:

| TODO | Wants | Currently |
| --- | --- | --- |
| 8 Offers | Other people's ads are renamed **"offers"** | `/offers` currently means *your* offers, and `/ads/:adId` is theirs — this rename collides head-on with existing route names. **Agree the naming before starting.** |
| 8 Offers | Items get a **condition rating** (1 = scrap, 5 = as-new), including during creation | `Offer` has no condition field |

**TODO #1 is done** (branch `todo-1-login`): `LoginPage` has Email and Password fields, uncontrolled
on purpose (see §2) since there's no account system yet to check them against; the button still
logs in unconditionally. The logo TODO #1 also asks for was already built.

**TODO #2.1 is done** (branch `todo-2-1-onboarding-skills`): onboarding's "Add your skills" step
reuses `SkillPage`'s own catalogue/custom-skill/proof-gate flow (see §8) instead of a placeholder;
Continue is disabled until at least one skill has been added, Skip still always works. TODO #2's
other four sub-steps (friends, verify, how-it-works video, profile picture) are still placeholders
or (how-it-works) a static illustration — none of those were in this round's scope.

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
pipeline (Accept/Decline on Trading, Quick Buy's pre-filled hours and expanded chat from the Ad
page). See §8 for the judgement calls — there are a lot of them this time, several from direct
feedback after the first cut of Inventory/Trading was already built and clicked through.

Both new concepts flagged as "half-built" in the previous version of this document are now fully
built and wired:

- **Transfer box** is a real shared component (`TransferBox.tsx`, see §8), used by both Inventory
  and Skills, with Accept behaviour that now differs between them on purpose (see §8).
- **Item as a first-class page** exists (`ItemPage.tsx`, TODO #10), reached from Inventory's tiles
  and its own "New item" button.

**Still not wired: TODO #8's "choose a skill/item" step from ad creation.** Both transfer boxes
work fully against their own `?trade=<id>` query parameter directly; nothing on `AdDetailPage` yet
navigates a user through "pick a skill or item" into one of them. That's still TODO #8, out of
every session so far.

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
