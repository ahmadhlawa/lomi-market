import { useQuery } from '@tanstack/react-query'
import { Eye, Search } from 'lucide-react'
import { useState } from 'react'

import { api } from '../api/client'
import { Empty, ErrorPanel, Loading, Modal, PageHeader, Pagination, StatusBadge } from '../components/ui'
import type { Order, Page, User } from '../types'

type Customer = User & { order_count: number }
type Detail = Customer & { addresses: Array<{ id: string; label: string; line1: string; city: string }>; orders: Order[] }

export function CustomersPage() {
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [id, setId] = useState<string | null>(null)
  const query = useQuery({ queryKey: ['customers', page, search], queryFn: () => api<Page<Customer>>(`/admin/customers?page=${page}&page_size=20&search=${encodeURIComponent(search)}`) })
  const detail = useQuery({ queryKey: ['customer', id], queryFn: () => api<Detail>(`/admin/customers/${id}`), enabled: Boolean(id) })
  if (query.isLoading) return <Loading label="Loading customers" />
  if (query.isError) return <ErrorPanel error={query.error} retry={() => void query.refetch()} />
  return <><PageHeader title="Customers" description={`${query.data!.total} customer accounts and their order history.`} /><div className="toolbar"><div className="search"><Search /><input aria-label="Search customers" placeholder="Search phone" value={search} onChange={(e) => setSearch(e.target.value)} /></div></div><section className="panel table-panel">{query.data!.items.length ? <><div className="table-scroll"><table><thead><tr><th>Customer</th><th>Phone</th><th>Orders</th><th>Language</th><th>Status</th><th /></tr></thead><tbody>{query.data!.items.map((customer) => <tr key={customer.id}><td><strong>{customer.full_name ?? 'Lomi Customer'}</strong></td><td>{customer.phone}</td><td>{customer.order_count}</td><td>{(customer as User & { language?: string }).language?.toUpperCase() ?? 'EN'}</td><td><StatusBadge value={customer.is_active} /></td><td><button className="icon-button" onClick={() => setId(customer.id)} aria-label="View customer"><Eye /></button></td></tr>)}</tbody></table></div><Pagination page={page} pages={query.data!.pages} setPage={setPage} /></> : <Empty title="No customers" message="Customer accounts appear after OTP verification." />}</section>{id && <Modal title="Customer details" close={() => setId(null)}>{detail.isLoading ? <Loading /> : detail.isError ? <ErrorPanel error={detail.error} /> : <div className="order-detail"><section><h3>{detail.data!.full_name}</h3><p>{detail.data!.phone}</p></section><section><h3>Addresses</h3>{detail.data!.addresses.length ? detail.data!.addresses.map((address) => <div className="line-item" key={address.id}><span><strong>{address.label}</strong><br />{address.line1}, {address.city}</span></div>) : <p className="muted">No saved addresses.</p>}</section><section><h3>Order history</h3>{detail.data!.orders.length ? detail.data!.orders.map((order) => <div className="line-item" key={order.id}><span>{order.order_number}<br /><StatusBadge value={order.status} /></span><strong>{order.total} ₪</strong></div>) : <p className="muted">No orders yet.</p>}</section></div>}</Modal>}</>
}
