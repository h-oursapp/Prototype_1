import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { OptionGroup } from '../components/OptionGroup'
import { PageShell } from '../components/PageShell'
import type { Offer, OfferKind } from '../data/mockOffers'
import { findOffer, isYourOffer } from '../data/mockOffers'
import { MOCK_TRADES } from '../data/mockTrades'
import { ROUTES, trading } from '../routes'
import './AdDetailPage.css'

/** The editable half of an ad. `hours` is kept as a string so the price field can be empty
 *  while it is being typed — nothing here is validated, and nothing is saved anywhere. */
interface AdDraft {
  title: string
  kind: OfferKind
  hours: string
  description: string
}

/** Create mode starts blank. `kind` still needs one of the two §4 sections selected, so it
 *  defaults to 'skill' — a default, not a decision the Appkarte makes. */
const EMPTY_DRAFT: AdDraft = { title: '', kind: 'skill', hours: '', description: '' }

const KIND_OPTIONS: { value: OfferKind; label: string }[] = [
  { value: 'skill', label: 'Skill' },
  { value: 'item', label: 'Item' },
]

/** Stands in for a real picture until photos exist (§5 wants pictures on top). */
const PICTURE_PLACEHOLDER_ICON = '🖼️'

function toDraft(offer: Offer): AdDraft {
  return {
    title: offer.title,
    kind: offer.kind,
    hours: String(offer.hours),
    description: offer.description ?? '',
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
}

/** §5: pictures on top. There are no real images in the prototype, so the offer's emoji is
 *  shown large inside a gallery-shaped frame (one 4:3 picture plus a thumbnail strip) — real
 *  photos drop into the same boxes later without the layout changing. */
function AdGallery({ icon, isEditable, onAddPhoto }: AdGalleryProps) {
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

      <p className="page-note">
        Placeholder gallery: the ad's icon stands in for the picture, and photo upload is not
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
}

/** §5 gives create and modify the same layout as the detail view, with the text turned into
 *  fields. Create mode renders this with an empty draft. */
function AdForm({ draft, onChange }: AdFormProps) {
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

        <OptionGroup
          legend="Offer type"
          options={KIND_OPTIONS}
          selected={draft.kind}
          onSelect={(kind: OfferKind) => update({ kind })}
        />

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
    <PageShell title="Ad not found">
      <div className="ad-detail">
        <section className="page-section">
          <div className="page-card">
            <p className="ad-detail__description">
              There is no ad with the id <strong>{adId ?? 'unknown'}</strong>. It may have been
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
 *    a rule about who may see which ad, or hide any part of the ad's content. */
export function AdDetailPage({ mode }: { mode?: 'create' }) {
  const { adId } = useParams()
  const navigate = useNavigate()

  const isCreate = mode === 'create'
  const offer = isCreate ? undefined : findOffer(adId)

  const [draft, setDraft] = useState<AdDraft>(() => (offer ? toDraft(offer) : EMPTY_DRAFT))
  const [isEditing, setIsEditing] = useState(isCreate)
  const [isViewOnly, setIsViewOnly] = useState(false)
  const [actionNote, setActionNote] = useState<string | null>(null)
  const [loadedAdId, setLoadedAdId] = useState(adId)

  // React-router keeps this same component mounted when the URL moves from one ad to another,
  // so the draft has to be reloaded by hand — otherwise the previous ad's text would stay on
  // screen. Adjusting state during render (rather than in an effect) is React's documented way
  // to do this: it re-renders immediately instead of flashing the stale ad first.
  if (adId !== loadedAdId) {
    setLoadedAdId(adId)
    setDraft(offer ? toDraft(offer) : EMPTY_DRAFT)
    setIsEditing(isCreate)
    setActionNote(null)
  }

  if (!isCreate && offer === undefined) {
    return <AdNotFound adId={adId} />
  }

  const isYours = isCreate || (offer !== undefined && isYourOffer(offer))
  // View-only previews the ad as a viewer sees it, so the form collapses back to plain text.
  const isFormVisible = isEditing && !isViewOnly

  const primaryLabel = () => {
    if (isCreate) return 'Create ad'
    return isEditing ? 'Save' : 'Edit'
  }

  const handlePrimary = () => {
    if (isCreate) {
      setActionNote('The ad exists in this session only — creating an ad is not wired up.')
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

  const handleQuickBuy = () => {
    setActionNote(
      `Quick Buy would charge ${draft.hours === '' ? '0' : draft.hours} hours immediately. Purchases are not wired up.`,
    )
  }

  const handleOpenTrading = () => {
    if (offer) navigate(trading(mockTradeIdFor(offer)))
  }

  return (
    <PageShell
      title={draft.title.trim() === '' ? (isCreate ? 'New ad' : 'Untitled ad') : draft.title}
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
          icon={offer?.icon ?? PICTURE_PLACEHOLDER_ICON}
          isEditable={isFormVisible}
          onAddPhoto={() => setActionNote('Photo upload is not wired up.')}
        />

        {isFormVisible ? (
          <AdForm draft={draft} onChange={setDraft} />
        ) : (
          <AdDetails draft={draft} isYours={isYours} distanceKm={offer?.distanceKm} />
        )}

        <section className="page-section">
          <p className="page-note">
            Nothing on this page is saved: edits, Quick Buy and Share all live in this session
            only.
          </p>
          <p className="page-note">
            View-only hides the action buttons, as §5 states. Who may view which ad is still open
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
