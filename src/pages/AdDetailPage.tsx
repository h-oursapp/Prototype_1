import { useState } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { OptionGroup } from '../components/OptionGroup'
import { PageShell } from '../components/PageShell'
import { StarRating } from '../components/StarRating'
import type { InventoryItem } from '../data/mockInventory'
import { findItem } from '../data/mockInventory'
import type { Offer, OfferKind } from '../data/mockOffers'
import { findOffer, isYourOffer } from '../data/mockOffers'
import { MOCK_TRADES } from '../data/mockTrades'
import type { Skill } from '../data/mockUser'
import { findSkill } from '../data/mockUser'
import { ROUTES, inventoryForNewAd, skillsForNewAd, trading } from '../routes'
import './AdDetailPage.css'

/** Stands in for a real picture until photos exist (§5 wants pictures on top). Also EMPTY_DRAFT's
 *  default icon, before a subject has been picked or an existing ad loaded. */
const PICTURE_PLACEHOLDER_ICON = '🖼️'

/** 1–5, item offers only — "1 is only for parts/scrap, 5 is essentially new" (§8). A default, not
 *  a decision: it only shows once `kind` is 'item', the same way `kind` itself defaults to
 *  'skill' below without that being an Appkarte-stated choice either. */
const DEFAULT_CONDITION_RATING = 3

/** The editable half of an ad. `hours` is kept as a string so the price field can be empty while
 *  it is being typed — nothing here is validated, and nothing is saved anywhere.
 *
 *  `icon`/`rating`/`reviewRating`/`conditionRating` live on the draft rather than being read
 *  straight off `offer`, because create mode (TODO #8) can seed a draft from a picked skill or
 *  item that has no backing `Offer` at all — the draft is the one place both an existing ad and a
 *  fresh pick can put these fields for AdGallery/AdDetails/AdForm to read uniformly. */
interface AdDraft {
  title: string
  kind: OfferKind
  hours: string
  description: string
  icon: string
  /** Skill offers only — the seller's own rating (mirrors Skill.rating). */
  rating: number
  /** Skill offers only — the average review score (mirrors Skill.reviewRating). §8: "both
   *  ratings" for a skill. */
  reviewRating: number
  /** Item offers only — set as part of creating the ad (§8), not inherited from anywhere. */
  conditionRating: number
}

/** Create mode starts blank. `kind` still needs one of the two §4 sections selected, so it
 *  defaults to 'skill' — a default, not a decision the Appkarte makes. */
const EMPTY_DRAFT: AdDraft = {
  title: '',
  kind: 'skill',
  hours: '',
  description: '',
  icon: PICTURE_PLACEHOLDER_ICON,
  rating: 0,
  reviewRating: 0,
  conditionRating: DEFAULT_CONDITION_RATING,
}

const KIND_OPTIONS: { value: OfferKind; label: string }[] = [
  { value: 'skill', label: 'Skill' },
  { value: 'item', label: 'Item' },
]

const CONDITION_OPTIONS: { value: number; label: string }[] = [1, 2, 3, 4, 5].map((value) => ({
  value,
  label: String(value),
}))

function toDraft(offer: Offer): AdDraft {
  return {
    title: offer.title,
    kind: offer.kind,
    hours: String(offer.hours),
    description: offer.description ?? '',
    icon: offer.icon,
    rating: offer.rating,
    reviewRating: offer.reviewRating ?? 0,
    conditionRating: offer.conditionRating ?? DEFAULT_CONDITION_RATING,
  }
}

/** TODO #8: navigating to Skills and picking one comes back here as `?skillId=<id>` — this seeds
 *  the draft from that skill's own rating/review rating, the same way toDraft seeds it from an
 *  existing ad. `hours`/`description` are left for the user to fill in: a skill carries no price,
 *  and its own description isn't necessarily what this particular ad wants to say. */
function toDraftFromSkill(skill: Skill): AdDraft {
  return {
    title: skill.name,
    kind: 'skill',
    hours: '',
    description: skill.description ?? '',
    icon: skill.icon,
    rating: skill.rating,
    reviewRating: skill.reviewRating,
    conditionRating: DEFAULT_CONDITION_RATING,
  }
}

/** TODO #8's Inventory equivalent of toDraftFromSkill. An item carries no rating of its own —
 *  condition is set as part of creating the ad (§8), not inherited — so it starts at the same
 *  default a from-scratch item ad would. */
function toDraftFromItem(item: InventoryItem): AdDraft {
  return {
    title: item.name,
    kind: 'item',
    hours: '',
    description: item.description ?? '',
    icon: item.icon,
    rating: 0,
    reviewRating: 0,
    conditionRating: DEFAULT_CONDITION_RATING,
  }
}

function kindLabel(kind: OfferKind): string {
  return KIND_OPTIONS.find((option) => option.value === kind)?.label ?? kind
}

/** No trade is actually created in the prototype. The trading window (§6) is opened with the
 *  mock trade about this subject if there is one, so it isn't empty on arrival, and with the
 *  first mock trade otherwise. */
function mockTradeIdFor(offer: Offer): string {
  const aboutThisOffer = MOCK_TRADES.find((trade) => trade.subject === offer.title)
  return (aboutThisOffer ?? MOCK_TRADES[0]).id
}

interface AdGalleryProps {
  icon: string
  /** Create and edit show the upload affordance; viewing an ad just shows the picture. */
  isEditable: boolean
  onAddPhoto: () => void
  /** TODO #8: a brand-new ad starts with no subject chosen yet — the picture area shows two big
   *  buttons (navigate to Skills/Inventory to pick one) in place of the normal frame until then.
   *  Absent once a subject has been picked, or outside create mode entirely. */
  picker?: { onPickSkill: () => void; onPickItem: () => void }
  /** Present once a subject has been picked (create mode only) — lets the user redo the pick for
   *  a different skill/item. */
  onChangePick?: () => void
}

/** §5: pictures on top. There are no real images in the prototype, so the offer's emoji is
 *  shown large inside a gallery-shaped frame (one 4:3 picture plus a thumbnail strip) — real
 *  photos drop into the same boxes later without the layout changing. */
function AdGallery({ icon, isEditable, onAddPhoto, picker, onChangePick }: AdGalleryProps) {
  if (picker) {
    return (
      <section className="page-section ad-detail__gallery">
        <div className="ad-detail__frame ad-detail__frame--picker">
          <p className="ad-detail__picker-prompt">What are you offering?</p>
          <div className="ad-detail__picker-buttons">
            <button type="button" className="ad-detail__picker-button" onClick={picker.onPickSkill}>
              <span aria-hidden="true">🧠</span>
              Skill
            </button>
            <button type="button" className="ad-detail__picker-button" onClick={picker.onPickItem}>
              <span aria-hidden="true">📦</span>
              Item
            </button>
          </div>
        </div>
        <p className="page-note">
          Choosing takes you to your skills or your inventory to pick which one this offer is for.
        </p>
      </section>
    )
  }

  return (
    <section className="page-section ad-detail__gallery">
      <div className="ad-detail__frame">
        <span className="ad-detail__icon" aria-hidden="true">
          {icon}
        </span>
      </div>

      <div className="ad-detail__thumbs">
        {isEditable && (
          <button type="button" className="ad-detail__thumb ad-detail__thumb--add" onClick={onAddPhoto}>
            + Photo
          </button>
        )}
        <span className="ad-detail__thumb" aria-hidden="true" />
        <span className="ad-detail__thumb" aria-hidden="true" />
      </div>

      {onChangePick && (
        <button type="button" className="ad-detail__change-pick" onClick={onChangePick}>
          Change skill or item
        </button>
      )}

      <p className="page-note">
        Placeholder gallery: the offer's icon stands in for the picture, and photo upload is not
        wired up.
      </p>
    </section>
  )
}

interface AdDetailsProps {
  draft: AdDraft
  isYours: boolean
  /** Only other members' mock ads carry a distance (§4's nearby list). */
  distanceKm?: number
}

/** The text half of §5 — what the ad says when it is not being edited. */
function AdDetails({ draft, isYours, distanceKm }: AdDetailsProps) {
  const ratingSubject = draft.title.trim() === '' ? 'This offer' : draft.title

  return (
    <section className="page-section">
      <h2 className="page-section__heading">Details</h2>
      <div className="page-card">
        <dl className="ad-detail__facts">
          <div className="ad-detail__fact">
            <dt className="ad-detail__fact-label">Price</dt>
            <dd className="ad-detail__fact-value">{draft.hours === '' ? '—' : `${draft.hours} hours`}</dd>
          </div>
          <div className="ad-detail__fact">
            <dt className="ad-detail__fact-label">Type</dt>
            <dd className="ad-detail__fact-value">{kindLabel(draft.kind)}</dd>
          </div>
          <div className="ad-detail__fact">
            <dt className="ad-detail__fact-label">Listed by</dt>
            <dd className="ad-detail__fact-value">{isYours ? 'You' : 'Another member'}</dd>
          </div>
          {distanceKm !== undefined && (
            <div className="ad-detail__fact">
              <dt className="ad-detail__fact-label">Distance</dt>
              <dd className="ad-detail__fact-value">{distanceKm} km away</dd>
            </div>
          )}
        </dl>

        {/* §8: a skill offer shows both ratings (self-rating and review rating); a material
         *  offer shows only its condition rating instead — see Offer.reviewRating/conditionRating
         *  in mockOffers.ts for why they're two separate optional fields rather than one. */}
        <div className="ad-detail__ratings">
          {draft.kind === 'skill' ? (
            <>
              <StarRating value={draft.rating} subject={`${ratingSubject}'s rating`} />
              <StarRating value={draft.reviewRating} subject={`${ratingSubject}'s review rating`} />
            </>
          ) : (
            <StarRating value={draft.conditionRating} subject={`${ratingSubject}'s condition`} />
          )}
        </div>

        <p className="ad-detail__description">
          {draft.description === '' ? 'No description yet.' : draft.description}
        </p>
      </div>
    </section>
  )
}

interface AdFormProps {
  draft: AdDraft
  onChange: (draft: AdDraft) => void
  /** TODO #8: a brand-new ad with nothing picked yet chooses its kind via the gallery's Skill/Item
   *  buttons instead — showing this toggle at the same time would be two controls for the same
   *  decision (and, worse, two buttons both named "Skill"/"Item" on the same screen). Defaults to
   *  true: every other caller (editing, or a create that already has a pick) still gets it. */
  showKindToggle?: boolean
}

/** §5 gives create and modify the same layout as the detail view, with the text turned into
 *  fields. Create mode renders this with an empty draft. */
function AdForm({ draft, onChange, showKindToggle = true }: AdFormProps) {
  const update = (patch: Partial<AdDraft>) => onChange({ ...draft, ...patch })

  return (
    <section className="page-section">
      <h2 className="page-section__heading">Details</h2>
      <div className="page-card">
        <label className="ad-detail__field">
          <span className="ad-detail__label">Title</span>
          <input
            className="ad-detail__input"
            value={draft.title}
            onChange={(event) => update({ title: event.target.value })}
          />
        </label>

        <label className="ad-detail__field">
          <span className="ad-detail__label">Price in hours</span>
          <input
            className="ad-detail__input"
            type="number"
            min={0}
            value={draft.hours}
            onChange={(event) => update({ hours: event.target.value })}
          />
        </label>

        {showKindToggle && (
          <OptionGroup
            legend="Offer type"
            options={KIND_OPTIONS}
            selected={draft.kind}
            onSelect={(kind: OfferKind) => update({ kind })}
          />
        )}

        {/* §8: "this rating should be part of the offer creation process too" — only an item
         *  offer needs one typed in; a skill offer's ratings come from the skill it was picked
         *  from (or stay at 0 until it is). */}
        {draft.kind === 'item' && (
          <>
            <OptionGroup
              legend="Condition"
              options={CONDITION_OPTIONS}
              selected={draft.conditionRating}
              onSelect={(conditionRating: number) => update({ conditionRating })}
            />
            <p className="page-note">1 = parts/scrap only, 5 = essentially new.</p>
          </>
        )}

        <label className="ad-detail__field">
          <span className="ad-detail__label">Description</span>
          <textarea
            className="ad-detail__input ad-detail__input--multiline"
            rows={4}
            value={draft.description}
            onChange={(event) => update({ description: event.target.value })}
          />
        </label>
      </div>
    </section>
  )
}

interface OwnAdActionsProps {
  primaryLabel: string
  /** There is nothing to share until the ad exists, so create mode leaves Share out. */
  showShare: boolean
  onPrimary: () => void
  onShare: () => void
}

/** §5, your own ad: Edit/Save plus Share. */
function OwnAdActions({ primaryLabel, showShare, onPrimary, onShare }: OwnAdActionsProps) {
  return (
    <>
      <button type="button" className="ad-detail__action ad-detail__action--primary" onClick={onPrimary}>
        {primaryLabel}
      </button>
      {showShare && (
        <button type="button" className="ad-detail__action" onClick={onShare}>
          Share
        </button>
      )}
    </>
  )
}

interface OtherAdActionsProps {
  hours: string
  onQuickBuy: () => void
  onOpenTrading: () => void
}

/** §5, someone else's ad: Quick Buy at the listed price, or open the trading window (§6) to
 *  make a counter-offer. */
function OtherAdActions({ hours, onQuickBuy, onOpenTrading }: OtherAdActionsProps) {
  return (
    <>
      <button type="button" className="ad-detail__action ad-detail__action--primary" onClick={onQuickBuy}>
        Quick Buy · {hours === '' ? '—' : hours} h
      </button>
      <button type="button" className="ad-detail__action" onClick={onOpenTrading}>
        Open trading window
      </button>
    </>
  )
}

/** An id that matches no mock offer — a stale link, or a typed URL. Better a stated dead end
 *  than a blank screen, and PageShell's back button alone is easy to miss. */
function AdNotFound({ adId }: { adId: string | undefined }) {
  const navigate = useNavigate()

  return (
    <PageShell title="Offer not found">
      <div className="ad-detail">
        <section className="page-section">
          <div className="page-card">
            <p className="ad-detail__description">
              There is no offer with the id <strong>{adId ?? 'unknown'}</strong>. It may have been
              taken down, or the link may be wrong.
            </p>
          </div>
        </section>
        <div className="ad-detail__actions">
          <div className="ad-detail__buttons">
            <button
              type="button"
              className="ad-detail__action ad-detail__action--primary"
              onClick={() => navigate(ROUTES.home)}
            >
              Back to home
            </button>
          </div>
        </div>
      </div>
    </PageShell>
  )
}

/** Ad detail / create / modify (Appkarte §5). One page in three modes: viewing someone else's
 *  ad, viewing and editing your own, and creating a new one — the Appkarte describes them as
 *  one screen, so they share one layout here.
 *
 *  Judgement calls:
 *  - The action row is `position: sticky` at the bottom of the content. §5 puts the buttons
 *    above the nav bar; since the details scroll, sticky is what keeps that true rather than
 *    only true at the end of a long ad.
 *  - Nothing persists. The draft is local state and is thrown away on navigation — Save and
 *    Create change the screen, not any store. The prototype has no backend, so a fake "saved"
 *    that survived would be a lie about how far this is built.
 *  - Quick Buy, Share and photo upload are placeholders: they are laid out and labelled like
 *    the real controls, and pressing one says plainly that it is not wired up, rather than
 *    doing nothing or silently missing.
 *  - View-only is a local toggle in the header so the mode can actually be demonstrated. §10
 *    records that viewing rights on other members' ads were never explicitly confirmed, so it
 *    only does what §5 states — hide the interaction buttons. It deliberately does not invent
 *    a rule about who may see which ad, or hide any part of the ad's content.
 *  - TODO #8's picker: a brand-new ad shows two buttons in place of the picture (AdGallery's
 *    `picker` prop) until a skill or item has been chosen on Skills/Inventory and the URL comes
 *    back as `/ads/new?skillId=<id>` or `?itemId=<id>`. That param is read here (not stored in
 *    the draft) so re-picking a *different* subject re-seeds the draft, the same
 *    "state changed during render" trick already used for `adId` below to reload a fresh draft
 *    without flashing the previous one first. */
export function AdDetailPage({ mode }: { mode?: 'create' }) {
  const { adId } = useParams()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()

  const isCreate = mode === 'create'
  const offer = isCreate ? undefined : findOffer(adId)

  const pickedSkillId = isCreate ? (searchParams.get('skillId') ?? undefined) : undefined
  const pickedItemId = isCreate ? (searchParams.get('itemId') ?? undefined) : undefined
  const pickedSkill = pickedSkillId ? findSkill(pickedSkillId) : undefined
  const pickedItem = pickedItemId ? findItem(pickedItemId) : undefined
  // Whichever of the two is present (they never both are, in practice) identifies this particular
  // pick — used only to notice *when the pick changes*, not to look anything up a second time.
  const pickedKey = pickedSkillId ?? pickedItemId

  function initialDraft(): AdDraft {
    if (offer) return toDraft(offer)
    if (pickedSkill) return toDraftFromSkill(pickedSkill)
    if (pickedItem) return toDraftFromItem(pickedItem)
    return EMPTY_DRAFT
  }

  const [draft, setDraft] = useState<AdDraft>(initialDraft)
  const [isEditing, setIsEditing] = useState(isCreate)
  const [isViewOnly, setIsViewOnly] = useState(false)
  const [actionNote, setActionNote] = useState<string | null>(null)
  const [loadedAdId, setLoadedAdId] = useState(adId)
  const [loadedPickedKey, setLoadedPickedKey] = useState(pickedKey)

  // React-router keeps this same component mounted when the URL moves from one ad to another, or
  // from a fresh /ads/new to /ads/new?skillId=<id> once a skill/item has been picked (TODO #8) —
  // so the draft has to be reloaded by hand in either case, otherwise the previous state would
  // stay on screen. Adjusting state during render (rather than in an effect) is React's documented
  // way to do this: it re-renders immediately instead of flashing the stale draft first.
  //
  // Only a *defined* pickedKey change triggers a reseed — going back to a bare /ads/new (e.g. via
  // "Change skill or item") clears pickedKey but must not wipe out a draft the user may have
  // already started editing; it only takes effect once a new pick actually comes back.
  if (adId !== loadedAdId || (pickedKey !== undefined && pickedKey !== loadedPickedKey)) {
    setLoadedAdId(adId)
    setLoadedPickedKey(pickedKey)
    setDraft(initialDraft())
    setIsEditing(isCreate)
    setActionNote(null)
  }

  if (!isCreate && offer === undefined) {
    return <AdNotFound adId={adId} />
  }

  const isYours = isCreate || (offer !== undefined && isYourOffer(offer))
  // View-only previews the ad as a viewer sees it, so the form collapses back to plain text.
  const isFormVisible = isEditing && !isViewOnly
  // TODO #8: nothing has been picked yet for this brand-new ad — show the picker buttons instead
  // of the normal gallery. Once picked (or when editing an existing ad, which always has one),
  // this is false and the ordinary gallery + "Change" affordance show instead.
  const needsSubjectPick = isCreate && pickedSkill === undefined && pickedItem === undefined

  const primaryLabel = () => {
    if (isCreate) return 'Create offer'
    return isEditing ? 'Save' : 'Edit'
  }

  const handlePrimary = () => {
    if (isCreate) {
      setActionNote('The offer exists in this session only — creating one is not wired up.')
      return
    }
    if (isEditing) {
      setIsEditing(false)
      setActionNote('Changes are kept for this session only — nothing is saved.')
      return
    }
    setIsEditing(true)
    setActionNote(null)
  }

  /** TODO #13: Quick Buy now actually opens the trading window, the same as "Open trading
   *  window" below, but flagged `quick` — TradingPage reads that to jump straight to an expanded
   *  chat rather than landing on the browsing zones first. TODO #8 adds the ad's listed hours
   *  alongside `quick`, so the trading table starts already showing that price as your offer
   *  instead of your usual default. */
  const handleQuickBuy = () => {
    if (offer) navigate(trading(mockTradeIdFor(offer), { quick: true, hours: offer.hours }))
  }

  const handleOpenTrading = () => {
    if (offer) navigate(trading(mockTradeIdFor(offer)))
  }

  return (
    <PageShell
      title={draft.title.trim() === '' ? (isCreate ? 'New offer' : 'Untitled offer') : draft.title}
      headerAction={
        <button
          type="button"
          className={`page-shell__action page-shell__action--text ${isViewOnly ? 'is-active' : ''}`}
          aria-pressed={isViewOnly}
          onClick={() => setIsViewOnly(!isViewOnly)}
        >
          View only
        </button>
      }
    >
      <div className="ad-detail">
        <AdGallery
          icon={draft.icon}
          isEditable={isFormVisible}
          onAddPhoto={() => setActionNote('Photo upload is not wired up.')}
          picker={
            needsSubjectPick && isFormVisible
              ? {
                  onPickSkill: () => navigate(skillsForNewAd()),
                  onPickItem: () => navigate(inventoryForNewAd()),
                }
              : undefined
          }
          onChangePick={
            isCreate && !needsSubjectPick && isFormVisible ? () => navigate(ROUTES.adCreate) : undefined
          }
        />

        {isFormVisible ? (
          <AdForm draft={draft} onChange={setDraft} showKindToggle={!needsSubjectPick} />
        ) : (
          <AdDetails draft={draft} isYours={isYours} distanceKm={offer?.distanceKm} />
        )}

        <section className="page-section">
          <p className="page-note">
            Nothing on this page is saved: edits, Quick Buy and Share all live in this session
            only.
          </p>
          <p className="page-note">
            View-only hides the action buttons, as §5 states. Who may view which offer is still open
            (§10), so nothing else is hidden here.
          </p>
        </section>

        <div className="ad-detail__actions">
          {actionNote !== null && (
            <p className="ad-detail__feedback" role="status">
              {actionNote}
            </p>
          )}

          <div className="ad-detail__buttons">
            {isViewOnly ? (
              <p className="page-note">View only — the action buttons are hidden.</p>
            ) : isYours ? (
              <OwnAdActions
                primaryLabel={primaryLabel()}
                showShare={!isCreate}
                onPrimary={handlePrimary}
                onShare={() => setActionNote('Sharing is not wired up.')}
              />
            ) : (
              <OtherAdActions
                hours={draft.hours}
                onQuickBuy={handleQuickBuy}
                onOpenTrading={handleOpenTrading}
              />
            )}
          </div>
        </div>
      </div>
    </PageShell>
  )
}
