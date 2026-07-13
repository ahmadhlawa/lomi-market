import {
  BadgePercent, Boxes, ChevronLeft, ClipboardList, Gauge, LogOut, MapPinned,
  Menu, PackageSearch, Settings, ShieldCheck, Users, X,
} from 'lucide-react'
import { useState } from 'react'
import { NavLink, Outlet } from 'react-router'

import { useAuth } from '../auth/AuthProvider'

const links = [
  ['/', 'Dashboard', Gauge],
  ['/products', 'Products', Boxes],
  ['/categories', 'Categories', PackageSearch],
  ['/orders', 'Orders', ClipboardList],
  ['/customers', 'Customers', Users],
  ['/promotions', 'Promotions', BadgePercent],
  ['/delivery', 'Delivery', MapPinned],
  ['/settings', 'Settings', Settings],
  ['/security', 'Security', ShieldCheck],
] as const

export function Shell() {
  const auth = useAuth()
  const [open, setOpen] = useState(false)
  const [collapsed, setCollapsed] = useState(false)
  return <div className={`app-shell ${collapsed ? 'sidebar-collapsed' : ''}`}>
    <button className="mobile-menu" onClick={() => setOpen(true)} aria-label="Open navigation"><Menu /></button>
    {open && <button className="mobile-scrim" onClick={() => setOpen(false)} aria-label="Close navigation overlay" />}
    <aside className={`sidebar ${open ? 'open' : ''}`}>
      <div className="sidebar-brand"><div className="brand-symbol">L</div><div><strong>LOMI</strong><span>MARKET ADMIN</span></div><button className="mobile-close" onClick={() => setOpen(false)} aria-label="Close navigation"><X /></button></div>
      <nav>{links.map(([to, label, Icon]) => <NavLink key={to} to={to} end={to === '/'} onClick={() => setOpen(false)}><Icon /><span>{label}</span></NavLink>)}</nav>
      <div className="sidebar-user"><div className="avatar">{auth.user?.email?.[0]?.toUpperCase() ?? 'A'}</div><div><strong>{auth.user?.email}</strong><span>{auth.user?.role}</span></div><button className="icon-button" onClick={() => void auth.logout()} aria-label="Sign out"><LogOut /></button></div>
      <button className="collapse-button" onClick={() => setCollapsed((value) => !value)} aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}><ChevronLeft /></button>
    </aside>
    <main className="content"><Outlet /></main>
  </div>
}
