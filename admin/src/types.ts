export type User = {
  id: string
  email?: string
  phone?: string
  full_name?: string
  role: string
  permissions: string[]
  is_active: boolean
}

export type Tokens = {
  access_token: string
  refresh_token: string
  expires_in: number
  user: User
}

export type Page<T> = {
  items: T[]
  total: number
  page: number
  page_size: number
  pages: number
}

export type Category = {
  id: string
  slug: string
  name_en: string
  name_ar: string
  icon?: string
  image_url?: string
  sort_order: number
  is_active: boolean
}

export type Product = {
  id: string
  sku: string
  category_id: string
  category_name: string
  name_en: string
  name_ar: string
  description_en: string
  description_ar: string
  price: string
  compare_at_price?: string
  unit: string
  stock: number
  low_stock_threshold: number
  image_url?: string
  images?: Array<{ id: string; url: string; thumbnail_url?: string }>
  is_featured: boolean
  is_best_seller: boolean
  is_offer: boolean
  is_active: boolean
}

export type Order = {
  id: string
  order_number: string
  status: string
  payment_method: string
  payment_status: string
  total: string
  created_at: string
  address: Record<string, string>
  driver?: { id: string; name: string; phone: string; vehicle?: string } | null
  items: Array<{ id: string; name_en: string; quantity: number; line_total: string }>
  status_history: Array<{ id: string; status: string; note?: string; created_at: string }>
}

export type Driver = {
  id: string
  name: string
  phone: string
  vehicle?: string
  is_active: boolean
}

export type ApiErrorBody = {
  detail: string
  code: string
  field_errors?: Record<string, string[]>
}
