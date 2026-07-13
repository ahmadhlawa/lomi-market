import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Plus } from 'lucide-react'
import { useState, type FormEvent } from 'react'

import { api, jsonBody } from '../api/client'
import { ErrorPanel, Field, Loading, Modal, PageHeader, StatusBadge } from '../components/ui'
import type { Page, User } from '../types'

type Audit = { id: string; actor_user_id: string; action: string; entity_type: string; entity_id?: string; created_at: string }

export function SecurityPage() {
  const qc = useQueryClient()
  const [open, setOpen] = useState(false)
  const users = useQuery({ queryKey: ['admin-users'], queryFn: () => api<User[]>('/admin/users') })
  const audits = useQuery({ queryKey: ['audits'], queryFn: () => api<Page<Audit>>('/admin/audit-logs?page_size=50') })
  const create = useMutation({ mutationFn: (value: Record<string, unknown>) => api('/admin/users', { method: 'POST', ...jsonBody(value) }), onSuccess: () => { setOpen(false); void qc.invalidateQueries({ queryKey: ['admin-users'] }) } })
  if (users.isLoading || audits.isLoading) return <Loading label="Loading security controls" />
  if (users.isError || audits.isError) return <ErrorPanel error={users.error ?? audits.error} />
  return <><PageHeader title="Security" description="Administrative accounts, roles and immutable activity records." action={<button className="primary" onClick={() => setOpen(true)}><Plus />Add admin user</button>} /><section className="split-panels"><article className="panel"><header><div><h2>Admin accounts</h2><p>Role-based operational access</p></div></header><div className="compact-list detailed">{users.data!.map((user) => <div key={user.id}><div><strong>{user.email}</strong><span>{user.role} · {(user.permissions ?? []).join(', ') || 'role defaults'}</span></div><StatusBadge value={user.is_active} /></div>)}</div></article><article className="panel"><header><div><h2>Audit log</h2><p>Latest protected changes</p></div></header><div className="audit-list">{audits.data!.items.map((entry) => <div key={entry.id}><span className="audit-dot" /><div><strong>{entry.action}</strong><p>{entry.entity_type} · {entry.entity_id ?? 'system'}</p><time>{new Date(entry.created_at).toLocaleString()}</time></div></div>)}</div></article></section>{open && <AdminDialog close={() => setOpen(false)} busy={create.isPending} error={create.error} submit={(value) => create.mutate(value)} />}</>
}

function AdminDialog({ close, busy, error, submit }: { close: () => void; busy: boolean; error: unknown; submit: (value: Record<string, unknown>) => void }) {
  const [value, setValue] = useState({ email: '', password: '', role: 'operator', permissions: 'orders.write,catalog.write' })
  return <Modal title="Create admin user" close={close}><form className="form-grid" onSubmit={(event: FormEvent) => { event.preventDefault(); submit({ ...value, permissions: value.permissions.split(',').map((item) => item.trim()).filter(Boolean) }) }}><Field label="Email"><input type="email" required value={value.email} onChange={(e) => setValue({ ...value, email: e.target.value })} /></Field><Field label="Role"><select value={value.role} onChange={(e) => setValue({ ...value, role: e.target.value })}><option value="operator">Operator</option><option value="manager">Manager</option><option value="admin">Administrator</option></select></Field><Field label="Temporary password" hint="At least 12 characters"><input type="password" minLength={12} required value={value.password} onChange={(e) => setValue({ ...value, password: e.target.value })} /></Field><Field label="Permissions" hint="Comma separated"><input value={value.permissions} onChange={(e) => setValue({ ...value, permissions: e.target.value })} /></Field>{Boolean(error) && <div className="form-wide"><ErrorPanel error={error} /></div>}<div className="modal-actions form-wide"><button type="button" className="secondary" onClick={close}>Cancel</button><button className="primary" disabled={busy}>Create account</button></div></form></Modal>
}
