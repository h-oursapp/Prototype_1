import { PageShell } from '../components/PageShell'
import { MOCK_WALLET } from '../data/mockUser'
import './WalletPage.css'

interface OpenFigureProps {
  label: string
  hours: number
  /** Short stamp shown on the card, e.g. "Not specified yet". */
  status: string
  /** Why this figure is inert — kept on the page so the gap is visible to the team. */
  explanation: string
}

/** A figure the Appkarte lists on the Wallet but hasn't specified the mechanics for. It shows the
 *  number and nothing else: no donate, transfer or top-up control, because inventing one would
 *  bake a decision nobody has made into the prototype. */
function OpenFigure({ label, hours, status, explanation }: OpenFigureProps) {
  return (
    <div className="page-card wallet-page__figure">
      <span className="wallet-page__figure-label">{label}</span>
      <span className="wallet-page__figure-value">{hours} h</span>
      <span className="wallet-page__badge">{status}</span>
      <p className="page-note">{explanation}</p>
    </div>
  )
}

/** Wallet (Appkarte §7): available hours, charity hours, foundation, payment information.
 *
 *  Reached from the nav bar's Hours button and from the swipe-up on Home (§3), so it is a page
 *  rather than a sheet — both entry points land on the same screen.
 *
 *  Only the available-hours figure is a real headline number. Charity mechanics are [OFFEN] and
 *  out of scope, the foundation is [OFFEN] and not in scope yet, and payment information is a
 *  storage location rather than a payment flow — so all three are read-only here. §7 also records
 *  that the history / review-others feature and the payment flow were moved off the Wallet
 *  without saying where to; that gap is printed on the page instead of being guessed at. */
export function WalletPage() {
  return (
    <PageShell title="Wallet">
      <div className="wallet-page">
        <section className="page-section">
          <h2 className="page-section__heading">Available hours</h2>
          <p className="wallet-page__balance">{MOCK_WALLET.availableHours} h</p>
          <p className="page-note">What you can put on the trading table right now.</p>
        </section>

        <section className="page-section">
          <h2 className="page-section__heading">Set aside</h2>
          <div className="wallet-page__figures">
            <OpenFigure
              label="Charity hours"
              hours={MOCK_WALLET.charityHours}
              status="Not specified yet"
              explanation="§7 leaves the charity mechanics open — who receives donated hours, and how they are moved, has not been decided. The figure is shown; there is deliberately no control to move hours."
            />
            <OpenFigure
              label="Foundation"
              hours={MOCK_WALLET.foundationHours}
              status="Not in scope yet"
              explanation="§7 lists the foundation but marks it as not yet in scope. It has a slot on the Wallet so the layout is right when the mechanics arrive."
            />
          </div>
        </section>

        <section className="page-section">
          <h2 className="page-section__heading">Payment information</h2>
          <div className="page-card wallet-page__payment">
            <span className="wallet-page__figure-label">Stored payment method</span>
            <span className="wallet-page__payment-value">{MOCK_WALLET.paymentMethod}</span>
          </div>
          <p className="page-note">
            Storage location only. §7 moved the payment flow itself off the Wallet, so nothing here
            starts a payment.
          </p>
        </section>

        <p className="page-note wallet-page__open-point">
          Open point (§7): where the history / review-others feature and the payment flow went was
          never specified. Until that is settled, the Wallet has nothing to link to — flagged here
          rather than invented.
        </p>
      </div>
    </PageShell>
  )
}
