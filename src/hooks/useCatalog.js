import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../api/client';
const { mapApiCategory, mapApiProduct } = require('../domain/catalog.cjs');

export function useDebouncedValue(value, delay = 350) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => { const timer = setTimeout(() => setDebounced(value), delay); return () => clearTimeout(timer); }, [delay, value]);
  return debounced;
}

export function useCategories() {
  return useQuery({
    queryKey: ['categories'],
    queryFn: async () => [{ id: 'all', name_en: 'All', name_ar: 'الكل', icon: 'grid-outline' }, ...(await api('/catalog/categories'))].map(mapApiCategory),
  });
}

export function useProducts({ search = '', categoryId = 'all', page = 1, pageSize = 20, flags = {} } = {}) {
  const params = new URLSearchParams({ page: String(page), page_size: String(pageSize) });
  if (search) params.set('search', search);
  if (categoryId && categoryId !== 'all') params.set('category_id', categoryId);
  Object.entries(flags).forEach(([key, value]) => { if (value !== undefined) params.set(key, String(value)); });
  return useQuery({
    queryKey: ['products', search, categoryId, page, pageSize, flags],
    queryFn: async () => { const data = await api(`/catalog/products?${params}`); return { ...data, items: data.items.map(mapApiProduct) }; },
  });
}
