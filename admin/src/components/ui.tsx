import { AlertTriangle, LoaderCircle, X } from 'lucide-react'
import type { ReactNode } from 'react'

import { ApiError } from '../api/client'

export function PageHeader({ title, description, action }: { title: string; description: string; action?: ReactNode }) {
  return <header className="page-header"><div><p className="eyebrow">LOMI MARKET</p><h1>{title}</h1><p>{description}</p></div>{action}</header>
}

export function Loading({ label = 'Loading' }: { label?: string }) {
  return <div className="state-panel" role="status"><LoaderCircle className="spin" /><strong>{label}</strong></div>
}

export function ErrorPanel({ error, retry }: { error: unknown; retry?: () => void }) {
  const message = error instanceof ApiError || error instanceof Error ? error.message : 'Something went wrong'
  return <div className="state-panel error" role="alert"><AlertTriangle /><strong>{message}</strong>{retry && <button className="secondary" onClick={retry}>Try again</button>}</div>
}

export function Empty({ title, message }: { title: string; message: string }) {
  return <div className="state-panel"><strong>{title}</strong><span>{message}</span></div>
}

export function StatusBadge({ value }: { value: string | boolean }) {
  const text = typeof value === 'boolean' ? (value ? 'Active' : 'Inactive') : value.replaceAll('_', ' ')
  return <span className={`badge status-${String(value).toLowerCase()}`}>{text}</span>
}

export function Modal({ title, children, close }: { title: string; children: ReactNode; close: () => void }) {
  return <div className="modal-backdrop" role="presentation" onMouseDown={close}>
    <section className="modal" role="dialog" aria-modal="true" aria-labelledby="modal-title" onMouseDown={(event) => event.stopPropagation()}>
      <header><h2 id="modal-title">{title}</h2><button className="icon-button" onClick={close} aria-label="Close dialog"><X /></button></header>
      {children}
    </section>
  </div>
}

export function Field({ label, children, hint, error }: { label: string; children: ReactNode; hint?: string; error?: string }) {
  return <label className="field"><span>{label}</span>{children}{hint && <small>{hint}</small>}{error && <small className="field-error">{error}</small>}</label>
}

export function Pagination({ page, pages, setPage }: { page: number; pages: number; setPage: (page: number) => void }) {
  return <nav className="pagination" aria-label="Pagination">
    <button className="secondary" disabled={page <= 1} onClick={() => setPage(page - 1)}>Previous</button>
    <span>Page {page} of {pages}</span>
    <button className="secondary" disabled={page >= pages} onClick={() => setPage(page + 1)}>Next</button>
  </nav>
}

export function ConfirmButton({ label, confirm, onConfirm, className = 'danger-button' }: { label: string; confirm: string; onConfirm: () => void; className?: string }) {
  return <button className={className} onClick={() => { if (window.confirm(confirm)) onConfirm() }}>{label}</button>
}
