import { useState } from 'react'
import { PageShell } from '../components/PageShell'
import './LegalPage.css'

interface LegalDocument {
  id: string
  title: string
}

/** A working list, not a specification. §9 records a Legal page as "needed eventually" and names
 *  no documents at all, so these four are the ones an app of this kind usually carries — they are
 *  here to give the section a shape, and the page says out loud that the real list isn't settled. */
const PLANNED_DOCUMENTS: LegalDocument[] = [
  { id: 'terms', title: 'Terms of service' },
  { id: 'privacy', title: 'Privacy policy' },
  { id: 'imprint', title: 'Imprint' },
  { id: 'cookies', title: 'Cookie and data handling' },
]

/** Every document is at the same status, because none of them exist. The field is rendered
 *  because a real legal index carries one, not because there is progress to report. */
const DOCUMENT_STATUS = 'Not drafted'

/** Structure only. Real values would need a real build pipeline and a real document with a real
 *  date behind it, and neither exists — so both are marked as placeholders rather than filled in
 *  with numbers that would look authoritative. */
const APP_VERSION = '[placeholder — not wired to the build]'
const LAST_UPDATED = '[placeholder — no document has been written, so nothing has a date]'

interface DocumentEntryProps {
  /** Named `entry`, not `document` — a prop called `document` would shadow the global one inside
   *  this component, which is a trap waiting for the first person who needs the real DOM here. */
  entry: LegalDocument
  isOpen: boolean
  onToggle: () => void
}

/** One row of the document index: the title, its status, and — when opened — the state it is
 *  actually in. The panel is deliberately identical for every document. There is no draft text to
 *  differentiate them with, and writing four different plausible-sounding summaries would produce
 *  exactly the thing this page must not contain. */
function DocumentEntry({ entry, isOpen, onToggle }: DocumentEntryProps) {
  const panelId = `legal-page-${entry.id}`

  return (
    <li className="page-card legal-page__document">
      <button
        type="button"
        className={`legal-page__document-toggle ${isOpen ? 'is-active' : ''}`}
        aria-expanded={isOpen}
        aria-controls={panelId}
        onClick={onToggle}
      >
        <span className="legal-page__document-title">{entry.title}</span>
        <span className="legal-page__document-status">{DOCUMENT_STATUS}</span>
        <span className="legal-page__document-chevron" aria-hidden="true">
          {isOpen ? '▾' : '▸'}
        </span>
      </button>

      {isOpen && (
        <div className="legal-page__document-panel" id={panelId}>
          <p className="legal-page__stamp">Not drafted yet</p>
          <p className="legal-page__document-body">
            There is no text for {entry.title}. Nothing has been written, nothing has been
            reviewed, and nothing here is a draft — this entry exists so the section has its shape.
          </p>
          <dl className="legal-page__facts">
            <div className="legal-page__fact">
              <dt>Status</dt>
              <dd>{DOCUMENT_STATUS}</dd>
            </div>
            <div className="legal-page__fact">
              <dt>Last updated</dt>
              <dd>{LAST_UPDATED}</dd>
            </div>
            <div className="legal-page__fact">
              <dt>Needs legal review</dt>
              <dd>Yes, before launch</dd>
            </div>
          </dl>
        </div>
      )}
    </li>
  )
}

/** Legal (Appkarte §9). The card's entire entry is: "needed eventually, but out of scope for the
 *  prototype". It names no documents, no wording, no structure.
 *
 *  So this page is the *shape* of a legal section and nothing else: an index of the documents it
 *  will hold, each opening onto an unmissable "not drafted yet" state, plus the version and
 *  last-updated fields such a section carries — with both values marked as placeholders.
 *
 *  No terms, no policy text, not a sentence of it. A page that reads like real terms is dangerous
 *  in a way a placeholder ad or a mocked trade is not: screenshotted or copied out of the
 *  prototype, invented legal wording can be taken for a commitment the project never made. The
 *  four documents listed are the page's own working guess and are labelled as such — §9 does not
 *  fix that list either.
 *
 *  Reached from the Settings page (§9), which is the only route to it. */
export function LegalPage() {
  const [openDocumentIds, setOpenDocumentIds] = useState<string[]>([])

  const toggleDocument = (documentId: string) => {
    setOpenDocumentIds((open) =>
      open.includes(documentId) ? open.filter((id) => id !== documentId) : [...open, documentId],
    )
  }

  return (
    <PageShell title="Legal">
      <div className="legal-page">
        <p className="legal-page__stamp legal-page__stamp--page">No legal text has been written</p>
        <p className="legal-page__intro">
          This section is empty on purpose. Every entry below is a title with nothing behind it yet
          — there is no wording anywhere in this build to agree to, rely on, or quote.
        </p>

        <section className="page-section">
          <h2 className="page-section__heading">Documents</h2>
          <ul className="legal-page__documents" aria-label="Legal documents">
            {PLANNED_DOCUMENTS.map((entry) => (
              <DocumentEntry
                key={entry.id}
                entry={entry}
                isOpen={openDocumentIds.includes(entry.id)}
                onToggle={() => toggleDocument(entry.id)}
              />
            ))}
          </ul>
          <p className="page-note">
            That list is this page&apos;s own working guess, not a requirement: §9 names no
            documents whatsoever. Which ones h_OURs actually needs is a question for whoever advises
            the project on it.
          </p>
        </section>

        <section className="page-section">
          <h2 className="page-section__heading">Before launch</h2>
          <div className="page-card legal-page__review">
            <p className="legal-page__review-line">
              All of these documents need to be written and reviewed by a qualified lawyer before
              the app goes anywhere near a real user. Nobody on the project should draft them from
              a template, and nothing in this prototype counts as a start on them.
            </p>
          </div>
        </section>

        <section className="page-section">
          <h2 className="page-section__heading">About this build</h2>
          <dl className="page-card legal-page__facts">
            <div className="legal-page__fact">
              <dt>App version</dt>
              <dd>{APP_VERSION}</dd>
            </div>
            <div className="legal-page__fact">
              <dt>Legal texts last updated</dt>
              <dd>{LAST_UPDATED}</dd>
            </div>
          </dl>
          <p className="page-note">
            Both rows are structure only. A version number and a date belong in a legal section, so
            the rows are here — but filling them in with real-looking values would make an empty
            section look maintained.
          </p>
        </section>

        <p className="page-note">
          Appkarte §9 leaves this page&apos;s content entirely unspecified. Its whole entry reads
          &quot;needed eventually, but out of scope for the prototype&quot; — no documents, no
          wording, no structure. Everything above is layout; none of it is legal text.
        </p>
      </div>
    </PageShell>
  )
}
