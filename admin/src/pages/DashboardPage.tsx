import { useQuery } from '@tanstack/react-query'
import { Boxes, CircleDollarSign, ClipboardList, Users } from 'lucide-react'
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'

import { api } from '../api/client'
import { ErrorPanel, Loading, PageHeader, StatusBadge } from '../components/ui'
import type { Order, Product } from '../types'

type Dashboard = {
  total_orders: number
  revenue: string
  customers: number
  products: number
  orders_by_status: Record<string, number>
  recent_orders: Order[]
  low_stock_products: Product[]
}

export function DashboardPage() {
  const query = useQuery({ queryKey: ['dashboard'], queryFn: () => api<Dashboard>('/admin/dashboard') })
  if (query.isLoading) return <Loading label="Loading store overview" />
  if (query.isError) return <ErrorPanel error={query.error} retry={() => void query.refetch()} />
  const data = query.data!
  const chart = Object.entries(data.orders_by_status).map(([status, count]) => ({ status: status.replaceAll('_', ' '), count }))
  const cards = [
    ['Orders', data.total_orders, ClipboardList],
    ['Revenue', `${data.revenue} ₪`, CircleDollarSign],
    ['Customers', data.customers, Users],
    ['Products', data.products, Boxes],
  ] as const
  return <>
    <PageHeader title="Store overview" description="Live operational snapshot for Lomi Market." />
    <section className="metric-grid">{cards.map(([label, value, Icon]) => <article className="metric-card" key={label}><div className="metric-icon"><Icon /></div><span>{label}</span><strong>{value}</strong></article>)}</section>
    <section className="dashboard-grid">
      <article className="panel chart-panel"><header><div><h2>Orders by status</h2><p>Current fulfillment workload</p></div></header><div className="chart"><ResponsiveContainer width="100%" height="100%"><BarChart data={chart}><CartesianGrid strokeDasharray="3 3" stroke="#303030" vertical={false} /><XAxis dataKey="status" tick={{ fill: '#aaa', fontSize: 11 }} axisLine={false} /><YAxis allowDecimals={false} tick={{ fill: '#aaa', fontSize: 11 }} axisLine={false} /><Tooltip contentStyle={{ background: '#1e1e1e', border: '1px solid #343434', borderRadius: 12 }} /><Bar dataKey="count" fill="#fdca00" radius={[8, 8, 0, 0]} /></BarChart></ResponsiveContainer></div></article>
      <article className="panel"><header><div><h2>Low stock</h2><p>Products requiring attention</p></div></header><div className="compact-list">{data.low_stock_products.length ? data.low_stock_products.map((product) => <div key={product.id}><img src={product.image_url} alt="" /><div><strong>{product.name_en}</strong><span>{product.sku}</span></div><b className="stock-low">{product.stock}</b></div>) : <p className="muted">No low-stock products.</p>}</div></article>
    </section>
    <section className="panel"><header><div><h2>Recent orders</h2><p>Latest customer activity</p></div></header><div className="table-scroll"><table><thead><tr><th>Order</th><th>Status</th><th>Payment</th><th>Total</th><th>Created</th></tr></thead><tbody>{data.recent_orders.map((order) => <tr key={order.id}><td><strong>{order.order_number}</strong></td><td><StatusBadge value={order.status} /></td><td>{order.payment_method.replaceAll('_', ' ')}</td><td>{order.total} ₪</td><td>{new Date(order.created_at).toLocaleString()}</td></tr>)}</tbody></table></div></section>
  </>
}
