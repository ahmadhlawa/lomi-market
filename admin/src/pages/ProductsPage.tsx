import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ImagePlus, Pencil, Plus, Search } from 'lucide-react'
import { useState, type FormEvent } from 'react'

import { api, jsonBody } from '../api/client'
import { ConfirmButton, Empty, ErrorPanel, Field, Loading, Modal, PageHeader, Pagination, StatusBadge } from '../components/ui'
import type { Category, Page, Product } from '../types'

type ProductForm = Omit<Product, 'id' | 'category_name' | 'low_stock_threshold'> & { low_stock_threshold?: number }
const empty: ProductForm = { sku: '', category_id: '', name_en: '', name_ar: '', description_en: '', description_ar: '', price: '', compare_at_price: '', unit: 'piece', stock: 0, low_stock_threshold: 5, image_url: '', is_featured: false, is_best_seller: false, is_offer: false, is_active: true }

export function ProductsPage() {
  const qc = useQueryClient()
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [editing, setEditing] = useState<Product | 'new' | null>(null)
  const products = useQuery({ queryKey: ['products', page, search], queryFn: () => api<Page<Product>>(`/admin/products?page=${page}&page_size=20&search=${encodeURIComponent(search)}`) })
  const categories = useQuery({ queryKey: ['admin-categories'], queryFn: () => api<Category[]>('/admin/categories') })
  const save = useMutation({ mutationFn: ({ id, values }: { id?: string; values: ProductForm }) => api<Product>(id ? `/admin/products/${id}` : '/admin/products', { method: id ? 'PATCH' : 'POST', ...jsonBody(values) }), onSuccess: () => { setEditing(null); void qc.invalidateQueries({ queryKey: ['products'] }); void qc.invalidateQueries({ queryKey: ['dashboard'] }) } })
  const archive = useMutation({ mutationFn: (id: string) => api(`/admin/products/${id}`, { method: 'DELETE' }), onSuccess: () => void qc.invalidateQueries({ queryKey: ['products'] }) })
  if (products.isLoading || categories.isLoading) return <Loading label="Loading products" />
  if (products.isError) return <ErrorPanel error={products.error} retry={() => void products.refetch()} />
  return <>
    <PageHeader title="Products" description={`${products.data!.total} products in the Lomi Market catalog.`} action={<button className="primary" onClick={() => setEditing('new')}><Plus />Add product</button>} />
    <div className="toolbar"><div className="search"><Search /><input aria-label="Search products" placeholder="Search name or SKU" value={search} onChange={(event) => { setSearch(event.target.value); setPage(1) }} /></div></div>
    <section className="panel table-panel">{products.data!.items.length ? <><div className="table-scroll"><table><thead><tr><th>Product</th><th>Category</th><th>Price</th><th>Stock</th><th>Flags</th><th>Status</th><th className="actions">Actions</th></tr></thead><tbody>{products.data!.items.map((product) => <tr key={product.id}><td><div className="product-cell"><img src={product.image_url} alt="" /><div><strong>{product.name_en}</strong><span>{product.name_ar} · {product.sku}</span></div></div></td><td>{product.category_name}</td><td><strong>{product.price} ₪</strong>{product.compare_at_price && <span className="old-price">{product.compare_at_price} ₪</span>}</td><td><span className={product.stock <= product.low_stock_threshold ? 'stock-low' : ''}>{product.stock} {product.unit}</span></td><td><div className="flag-list">{product.is_featured && <span>Featured</span>}{product.is_best_seller && <span>Best seller</span>}{product.is_offer && <span>Offer</span>}</div></td><td><StatusBadge value={product.is_active} /></td><td className="actions"><button className="icon-button" aria-label={`Edit ${product.name_en}`} onClick={() => setEditing(product)}><Pencil /></button><ConfirmButton className="icon-button danger" label="" confirm={`Archive ${product.name_en}?`} onConfirm={() => archive.mutate(product.id)} /></td></tr>)}</tbody></table></div><Pagination page={page} pages={products.data!.pages} setPage={setPage} /></> : <Empty title="No products found" message="Change the search or create a product." />}</section>
    {editing && <ProductDialog product={editing === 'new' ? undefined : editing} categories={categories.data ?? []} busy={save.isPending} error={save.error} close={() => setEditing(null)} submit={(values) => save.mutate({ id: editing === 'new' ? undefined : editing.id, values })} />}
  </>
}

function ProductDialog({ product, categories, busy, error, close, submit }: { product?: Product; categories: Category[]; busy: boolean; error: unknown; close: () => void; submit: (value: ProductForm) => void }) {
  const qc = useQueryClient()
  const [value, setValue] = useState<ProductForm>(() => product ? { ...product } : { ...empty, category_id: categories[0]?.id ?? '' })
  const [gallery, setGallery] = useState(product?.images ?? [])
  const [uploading, setUploading] = useState(false)
  const field = (key: keyof ProductForm, next: unknown) => setValue((current) => ({ ...current, [key]: next }))
  const upload = async (file?: File) => { if (!file) return; setUploading(true); try { const body = new FormData(); body.append('file', file); const result = await api<{ url: string; thumbnail_url: string }>('/admin/media', { method: 'POST', body }); if (!value.image_url) field('image_url', result.url); if (product) { const attached = await api<{ id: string; url: string; thumbnail_url?: string }>(`/admin/products/${product.id}/images`, { method: 'POST', ...jsonBody({ url: result.url, thumbnail_url: result.thumbnail_url }) }); setGallery((items) => [...items, attached]); void qc.invalidateQueries({ queryKey: ['products'] }) } else { field('image_url', result.url) } } finally { setUploading(false) } }
  const removeImage = async (id: string) => { if (!product) return; await api(`/admin/products/${product.id}/images/${id}`, { method: 'DELETE' }); setGallery((items) => items.filter((item) => item.id !== id)); void qc.invalidateQueries({ queryKey: ['products'] }) }
  const send = (event: FormEvent) => { event.preventDefault(); submit({ ...value, price: value.price, compare_at_price: value.compare_at_price || undefined } as ProductForm) }
  return <Modal title={product ? 'Edit product' : 'Create product'} close={close}><form className="form-grid" onSubmit={send}>
    <Field label="SKU"><input required value={value.sku} disabled={Boolean(product)} onChange={(e) => field('sku', e.target.value)} /></Field>
    <Field label="Category"><select required value={value.category_id} onChange={(e) => field('category_id', e.target.value)}>{categories.map((item) => <option key={item.id} value={item.id}>{item.name_en}</option>)}</select></Field>
    <Field label="English name"><input required value={value.name_en} onChange={(e) => field('name_en', e.target.value)} /></Field>
    <Field label="Arabic name"><input dir="rtl" required value={value.name_ar} onChange={(e) => field('name_ar', e.target.value)} /></Field>
    <Field label="Price (₪)"><input required type="number" min="0.01" step="0.01" value={value.price} onChange={(e) => field('price', e.target.value)} /></Field>
    <Field label="Compare-at price"><input type="number" min="0.01" step="0.01" value={value.compare_at_price ?? ''} onChange={(e) => field('compare_at_price', e.target.value)} /></Field>
    <Field label="Stock"><input required type="number" min="0" value={value.stock} onChange={(e) => field('stock', Number(e.target.value))} /></Field>
    <Field label="Unit"><input required value={value.unit} onChange={(e) => field('unit', e.target.value)} /></Field>
    <Field label="English description"><textarea value={value.description_en} onChange={(e) => field('description_en', e.target.value)} /></Field>
    <Field label="Arabic description"><textarea dir="rtl" value={value.description_ar} onChange={(e) => field('description_ar', e.target.value)} /></Field>
    <Field label="Product images" hint="JPEG, PNG or WebP; max 5 MB each"><label className="upload-button"><ImagePlus />{uploading ? 'Optimizing…' : product ? 'Add gallery image' : 'Upload primary image'}<input hidden type="file" accept="image/jpeg,image/png,image/webp" onChange={(e) => void upload(e.target.files?.[0])} /></label>{value.image_url && <img className="upload-preview" src={value.image_url} alt="Product preview" />}{gallery.length > 0 && <div className="image-gallery">{gallery.map((image) => <div key={image.id}><img src={image.thumbnail_url ?? image.url} alt="Product gallery" /><button type="button" aria-label="Remove image" onClick={() => void removeImage(image.id)}>×</button></div>)}</div>}</Field>
    <fieldset><legend>Merchandising</legend>{(['is_featured', 'is_best_seller', 'is_offer', 'is_active'] as const).map((key) => <label className="check" key={key}><input type="checkbox" checked={value[key]} onChange={(e) => field(key, e.target.checked)} />{key.replace('is_', '').replace('_', ' ')}</label>)}</fieldset>
    {Boolean(error) && <div className="form-wide"><ErrorPanel error={error} /></div>}<div className="modal-actions form-wide"><button type="button" className="secondary" onClick={close}>Cancel</button><button className="primary" disabled={busy || uploading}>{busy ? 'Saving…' : 'Save product'}</button></div>
  </form></Modal>
}
