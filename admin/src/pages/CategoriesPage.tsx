import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Pencil, Plus, Trash2 } from 'lucide-react'
import { useState, type FormEvent } from 'react'

import { api, jsonBody } from '../api/client'
import { Empty, ErrorPanel, Field, Loading, Modal, PageHeader, StatusBadge } from '../components/ui'
import type { Category } from '../types'

const blank: Omit<Category, 'id'> = { slug: '', name_en: '', name_ar: '', icon: 'grid-outline', image_url: '', sort_order: 0, is_active: true }

export function CategoriesPage() {
  const qc = useQueryClient()
  const [editing, setEditing] = useState<Category | 'new' | null>(null)
  const query = useQuery({ queryKey: ['admin-categories'], queryFn: () => api<Category[]>('/admin/categories') })
  const save = useMutation({ mutationFn: ({ id, value }: { id?: string; value: Omit<Category, 'id'> }) => api<Category>(id ? `/admin/categories/${id}` : '/admin/categories', { method: id ? 'PUT' : 'POST', ...jsonBody(value) }), onSuccess: () => { setEditing(null); void qc.invalidateQueries({ queryKey: ['admin-categories'] }) } })
  const remove = useMutation({ mutationFn: (id: string) => api(`/admin/categories/${id}`, { method: 'DELETE' }), onSuccess: () => void qc.invalidateQueries({ queryKey: ['admin-categories'] }) })
  if (query.isLoading) return <Loading label="Loading categories" />
  if (query.isError) return <ErrorPanel error={query.error} retry={() => void query.refetch()} />
  return <>
    <PageHeader title="Categories" description="Organize the customer catalog in Arabic and English." action={<button className="primary" onClick={() => setEditing('new')}><Plus />Add category</button>} />
    <section className="category-grid">{query.data!.length ? query.data!.map((category) => <article className="category-card" key={category.id}><div className="category-image">{category.image_url ? <img src={category.image_url} alt="" /> : <span>{category.name_en[0]}</span>}</div><div><h2>{category.name_en}</h2><p dir="rtl">{category.name_ar}</p><small>/{category.slug} · sort {category.sort_order}</small></div><StatusBadge value={category.is_active} /><footer><button className="secondary" onClick={() => setEditing(category)}><Pencil />Edit</button><button className="danger-button" onClick={() => { if (confirm(`Archive ${category.name_en}?`)) remove.mutate(category.id) }}><Trash2 />Archive</button></footer></article>) : <Empty title="No categories" message="Create a category before adding products." />}</section>
    {editing && <CategoryDialog category={editing === 'new' ? undefined : editing} error={save.error} busy={save.isPending} close={() => setEditing(null)} submit={(value) => save.mutate({ id: editing === 'new' ? undefined : editing.id, value })} />}
  </>
}

function CategoryDialog({ category, error, busy, close, submit }: { category?: Category; error: unknown; busy: boolean; close: () => void; submit: (value: Omit<Category, 'id'>) => void }) {
  const [value, setValue] = useState(() => category ? { ...category } : { ...blank })
  const field = (key: keyof typeof value, next: unknown) => setValue((current) => ({ ...current, [key]: next }))
  const send = (event: FormEvent) => { event.preventDefault(); const payload = { ...value } as Partial<Category>; delete payload.id; submit(payload as Omit<Category, 'id'>) }
  return <Modal title={category ? 'Edit category' : 'Create category'} close={close}><form className="form-grid" onSubmit={send}>
    <Field label="URL slug"><input required pattern="[a-z0-9]+(?:-[a-z0-9]+)*" value={value.slug} onChange={(e) => field('slug', e.target.value.toLowerCase())} /></Field>
    <Field label="Sort order"><input type="number" min="0" value={value.sort_order} onChange={(e) => field('sort_order', Number(e.target.value))} /></Field>
    <Field label="English name"><input required value={value.name_en} onChange={(e) => field('name_en', e.target.value)} /></Field>
    <Field label="Arabic name"><input dir="rtl" required value={value.name_ar} onChange={(e) => field('name_ar', e.target.value)} /></Field>
    <Field label="Ionicons key"><input value={value.icon ?? ''} onChange={(e) => field('icon', e.target.value)} /></Field>
    <Field label="Image URL"><input type="url" value={value.image_url ?? ''} onChange={(e) => field('image_url', e.target.value)} /></Field>
    <label className="check form-wide"><input type="checkbox" checked={value.is_active} onChange={(e) => field('is_active', e.target.checked)} />Visible to customers</label>
    {Boolean(error) && <div className="form-wide"><ErrorPanel error={error} /></div>}<div className="modal-actions form-wide"><button type="button" className="secondary" onClick={close}>Cancel</button><button className="primary" disabled={busy}>{busy ? 'Saving…' : 'Save category'}</button></div>
  </form></Modal>
}
