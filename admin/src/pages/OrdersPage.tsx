import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Eye, Search } from 'lucide-react'
import { useState } from 'react'

import { api, jsonBody } from '../api/client'
import { Empty, ErrorPanel, Field, Loading, Modal, PageHeader, Pagination, StatusBadge } from '../components/ui'
import type { Driver, Order, Page } from '../types'

const statuses = ['placed', 'confirmed', 'preparing', 'picked_up', 'out_for_delivery', 'delivered', 'cancelled']

export function OrdersPage() {
  const qc = useQueryClient()
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('')
  const [selected, setSelected] = useState<Order | null>(null)
  const query = useQuery({ queryKey: ['orders', page, search, status], queryFn: () => api<Page<Order>>(`/admin/orders?page=${page}&page_size=20&search=${encodeURIComponent(search)}&status_filter=${status}`) })
  const drivers = useQuery({ queryKey: ['drivers'], queryFn: () => api<Driver[]>('/admin/delivery/drivers') })
  const update = useMutation({ mutationFn: ({ id, next, note, driverId }: { id: string; next: string; note: string; driverId: string }) => api<Order>(`/admin/orders/${id}/status`, { method: 'PATCH', ...jsonBody({ status: next, note, driver_id: driverId || null }) }), onSuccess: (order) => { setSelected(order); void qc.invalidateQueries({ queryKey: ['orders'] }); void qc.invalidateQueries({ queryKey: ['dashboard'] }) } })
  if (query.isLoading) return <Loading label="Loading orders" />
  if (query.isError) return <ErrorPanel error={query.error} retry={() => void query.refetch()} />
  return <>
    <PageHeader title="Orders" description={`${query.data!.total} customer orders across the fulfillment workflow.`} />
    <div className="toolbar"><div className="search"><Search /><input aria-label="Search orders" placeholder="Order number" value={search} onChange={(e) => setSearch(e.target.value)} /></div><select aria-label="Filter order status" value={status} onChange={(e) => setStatus(e.target.value)}><option value="">All statuses</option>{statuses.map((value) => <option key={value}>{value}</option>)}</select></div>
    <section className="panel table-panel">{query.data!.items.length ? <><div className="table-scroll"><table><thead><tr><th>Order</th><th>Status</th><th>Delivery</th><th>Payment</th><th>Total</th><th>Created</th><th /></tr></thead><tbody>{query.data!.items.map((order) => <tr key={order.id}><td><strong>{order.order_number}</strong><span>{order.items.length} lines</span></td><td><StatusBadge value={order.status} /></td><td>{order.address.city}<span>{order.address.line1}</span></td><td>{order.payment_method.replaceAll('_', ' ')}<span>{order.payment_status}</span></td><td><strong>{order.total} ₪</strong></td><td>{new Date(order.created_at).toLocaleString()}</td><td><button className="icon-button" aria-label={`View ${order.order_number}`} onClick={() => setSelected(order)}><Eye /></button></td></tr>)}</tbody></table></div><Pagination page={page} pages={query.data!.pages} setPage={setPage} /></> : <Empty title="No orders found" message="No orders match the current filters." />}</section>
    {selected && <OrderDialog order={selected} drivers={drivers.data ?? []} busy={update.isPending} error={update.error} close={() => setSelected(null)} update={(next, note, driverId) => update.mutate({ id: selected.id, next, note, driverId })} />}
  </>
}

function OrderDialog({ order, drivers, busy, error, close, update }: { order: Order; drivers: Driver[]; busy: boolean; error: unknown; close: () => void; update: (status: string, note: string, driverId: string) => void }) {
  const [next, setNext] = useState('')
  const [note, setNote] = useState('')
  const [driverId, setDriverId] = useState(order.driver?.id ?? '')
  return <Modal title={order.order_number} close={close}><div className="order-detail"><div className="order-summary"><StatusBadge value={order.status} /><strong>{order.total} ₪</strong></div><section><h3>Delivery</h3><p>{order.address.recipient_name} · {order.address.phone}</p><p>{order.address.line1}, {order.address.city}</p>{order.driver && <p>Driver: {order.driver.name} · {order.driver.phone}</p>}</section><section><h3>Items</h3>{order.items.map((item) => <div className="line-item" key={item.id}><span>{item.name_en} × {item.quantity}</span><strong>{item.line_total} ₪</strong></div>)}</section><section><h3>Timeline</h3><ol className="timeline">{order.status_history.map((item) => <li key={item.id}><StatusBadge value={item.status} /><span>{item.note}</span><time>{new Date(item.created_at).toLocaleString()}</time></li>)}</ol></section><section><h3>Update status</h3><div className="inline-form"><Field label="Next status"><select value={next} onChange={(e) => setNext(e.target.value)}><option value="">Choose status</option>{statuses.filter((item) => item !== order.status).map((item) => <option key={item}>{item}</option>)}</select></Field><Field label="Assign driver"><select value={driverId} onChange={(e) => setDriverId(e.target.value)}><option value="">Unassigned</option>{drivers.filter((driver) => driver.is_active).map((driver) => <option key={driver.id} value={driver.id}>{driver.name}</option>)}</select></Field><Field label="Internal note"><input value={note} onChange={(e) => setNote(e.target.value)} /></Field><button className="primary" disabled={!next || busy} onClick={() => update(next, note, driverId)}>{busy ? 'Updating…' : 'Update order'}</button></div>{Boolean(error) && <ErrorPanel error={error} />}</section></div></Modal>
}
