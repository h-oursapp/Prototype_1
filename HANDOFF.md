# h_OURs Prototype — Handoff

Written 2026-08-14, on branch `scaffolding_prototype`; updated same day on branch
`todo-5-6-7-profile-skills-skill` after building TODO #5–#7 (Profile, Skills, Skill).

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
npm run test        31 files, 195 tests, all passing
npx tsc --noEmit    clean
npm run lint        clean
npm run build       succeeds
```

This session (branch `todo-5-6-7-profile-skills-skill`) built **TODO #5 (Profile), #6 (Skills)
and #7 (Skill)** end to end — a new Skill page, both ratings everywhere a skill appears, the
Skills grid rework, and the transfer box. §7 (below) has the details, §8 the judgement calls, §12
the TODO items this closes out.

Working tree on this branch is otherwise the same as `scaffolding_prototype`'s (`CLAUDE.md`
modified, `TODO.md` untracked) plus this session's changes, ready to commit.

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
    PageShell.tsx/.css     the frame every page uses except Home
    NavBar.tsx/.css        bottom nav, self-navigating
    navItems.ts            nav list + activeNavKey() — pure, unit-tested
    useAutoCollapse.ts     the §3 nav auto-collapse timer
    GridSection.tsx        a titled grid of tiles (used by Home)
    SquareTile.tsx         one tile — optional `overlay` prop pins content over the icon
    StarRating.tsx         ★★★☆☆ display
    OptionGroup.tsx        segmented control (used by Settings)

  pages/                   one folder-less file per screen, plus its .css
    onboarding/            multi-step onboarding, split into step components

  data/                    all mock data — mockOffers, mockUser, mockTrades,
                           mockInventory, mockCommunity

  settings/                theme + grid-size context, persisted to localStorage

  utils/swipe.ts           swipe-gesture maths, pure

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

### `PageShell` — the frame

Every page except Home renders inside it:

```tsx
<PageShell title="Wallet" headerAction={...}>
  ...content...
</PageShell>
```

It provides the header with a back button, the single scrolling content area, and the nav bar.
The header and the nav bar stay fixed; only `.page-shell__content` scrolls.

**Home is the deliberate exception.** `MainPage` renders `<NavBar>` directly instead. Two reasons:
its square grids need a definite page height, which `PageShell`'s padded scrolling content removes;
and Appkarte §3 makes Home the one screen where the nav bar doesn't auto-collapse.

---

## 7. The screens

All eighteen exist and are routed (SkillPage adds two: `/skills/:skillId` and `/skills/new`).
"Depth" is the level agreed with Márk: **structural scaffold** —
real layout, real navigation, real filtering and local state; genuinely complex interactions
(drag-and-drop, live maps) are visible, labelled placeholders rather than fake-working.

| Route | Page | Appkarte | Notes |
| --- | --- | --- | --- |
| `/login` | LoginPage | §2 | Method is `[OFFEN]` |
| `/onboarding` | OnboardingPage | §2 | Multi-step; most steps skippable |
| `/` | MainPage | §3 | Two fixed grids, no scroll. Not in PageShell |
| `/offers` | OffersPage | §4 | **Your** offers |
| `/search` | SearchPage | §4 | Filters + a placeholder map |
| `/ads/new` | AdDetailPage `mode="create"` | §5 | Same component as below |
| `/ads/:adId` | AdDetailPage | §5 | Detail doubles as create/modify |
| `/trading/:tradeId` | TradingPage | §6 | Three zones — see §8 |
| `/inventory` | InventoryPage | §6 | Out of prototype scope; mockup requested |
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

**Inventory shelves are one level deep, and that's enforced by the type.** `ShelfName` is a `string`,
not a recursive structure — nesting isn't something the file declines to do, it's something it
*cannot express*.

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

---

## 9. Mock data

All of it lives in `src/data/`. No component invents its own.

| File | Holds |
| --- | --- |
| `mockOffers.ts` | `Offer` (`kind: 'skill' \| 'item'`, `hours`, `distanceKm`), `MOCK_ADS`, `MOCK_YOUR_OFFERS`, `findOffer`, `isYourOffer` |
| `mockUser.ts` | `MOCK_HOURS_BALANCE`, `MOCK_WALLET`, `Skill` (now incl. `description`, `reviewRating`), `MOCK_SKILLS`, `MOCK_PARTNER_SKILLS`, `findSkill`, `SKILL_CATALOG`, `CUSTOM_SKILL_CAP`, `MOCK_PROFILE`, `Review`, `MOCK_REVIEWS` |
| `mockTrades.ts` | `TradeStatus`, `Trade` (incl. `partnerHours`, now `skillId?`), `ChatMessage`, `MOCK_TRADES` (6 — `trade-6` links to `skill-1`), `findTrade` |
| `mockInventory.ts` | `InventoryItem` (`isPublic`, `shelf`), yours (8) + partner's (5), `MOCK_SHELVES`, `publicItems()` |
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
| 3 Home | Ads/your-offers centred; arrows repositioned and flipped; swipe left/right → offers/search; "create offer" button in the last grid cell | Corner arrows → search/offers; swipe **up** → wallet |
| 4 Nav bar | Home in the middle; **Settings removed** (lives in Profile); hours as plain `10h15m`; nav bar **floating** so content gets the space; gridlines between items | Settings is on the bar (`navItems.ts` has a comment defending it — that comment is now overruled); home is 6th of 7; nav bar occupies layout space |
| 4 Nav bar | Back button goes **home** from top-level pages, default behaviour elsewhere | `PageShell` always calls `navigate(-1)` |
| 8 Offers | Other people's ads are renamed **"offers"** | `/offers` currently means *your* offers, and `/ads/:adId` is theirs — this rename collides head-on with existing route names. **Agree the naming before starting.** |
| 8 Offers | Items get a **condition rating** (1 = scrap, 5 = as-new), including during creation | `Offer` has no condition field |
| 9 Inventory | "Start from almost the beginning": grid layout like Home, **non-scrollable but pageable**, name overlaid on the picture, **shelves out of prototype scope** | Scrolling layout, shelves implemented |
| 10 Item | A **new page** per inventory item, with a public/private switch | Doesn't exist |
| 11 Trading | Non-scrollable; items in grids, skills in a single row; time as an inherent skill in the trading row; chat shows only the last message and expands on scroll-up | Three scrolling zones; chat has an expand button |

**TODO #5, #6, #7 are done** (this session): both ratings everywhere a skill appears, the Skills
grid rework (grid-size columns, uncapped rows, data overlaid on the tile), the add-a-skill flow
moved to the new Skill page, and the Skill page itself (view/edit/create, per-skill reviews, a link
to that skill's reviewed trades). See §8 for the judgement calls and §13 for what's still minimal.

One of the two recurring new concepts below is now half-built:

- **Transfer box** — a drag-and-drop target on Skills and Inventory, shown only when the page was
  opened from offer creation. Inventory already had one; **Skills now has one too**
  (`/skills?trade=<id>`, mirroring Inventory's shape exactly). Neither is wired to anything yet —
  that's TODO #8's "choose a skill/item" step from ad creation.
- **Item as a first-class page** — inventory items become navigable objects like skills, not rows.
  Still doesn't exist (TODO #10).

Both are structural. They're worth designing deliberately rather than growing by accident.

---

## 13. Open questions — Márk's call, not yours

**From the Appkarte §10**, still unresolved: login/registration method; whether verification is
skippable; bio field HTML vs plain text; trading-table icons; wallet history/review-others location
and the payment flow; charity and foundation mechanics; exact grid tuning; the trades status label
(suspected typo); home grid values and whether others' ads are view-only.

**Found while building, not recorded anywhere:**

1. ~~`Trade` has no link to a skill.~~ **Partially fixed this session:** `Trade.skillId?` now exists,
   just enough for "all reviewed trades for this skill" (TODO #7) to work. Final Review still rates
   a free-text `subject` rather than an actual skill, and most trades still carry no `skillId` — a
   full fix would mean Final Review writing that link when a trade closes, which nothing does yet.
2. **`lastInteraction` is prose, not a timestamp** (`"Yesterday"`). Appkarte §8 specifies a secondary
   sort by recency, which cannot be implemented against a string. Needs a real date.

Both are small changes now and painful ones later.

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
