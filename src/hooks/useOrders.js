import { useQuery } from '@tanstack/react-query';
import { api } from '../api/client';

const statusKeys = ['placed', 'confirmed', 'preparing', 'picked_up', 'out_for_delivery', 'delivered'];

export function mapApiOrder(order) {
  const activeIndex = statusKeys.indexOf(order.status);
  const items = (order.items || []).map((line) => ({
    quantity: line.quantity,
    product: {
      id: line.product_id || line.id,
      name: line.name_en,
      nameAr: line.name_ar,
      image: line.image_url,
      price: Number(line.unit_price),
      unit: line.unit,
    },
  }));
  return {
    ...order,
    id: order.id,
    orderId: order.order_number,
    date: new Date(order.created_at).toLocaleString(),
    createdAt: order.created_at,
    name: items[0]?.product.name || 'Grocery order',
    nameAr: items[0]?.product.nameAr || 'طلب بقالة',
    items,
    itemCount: items.reduce((sum, item) => sum + item.quantity, 0),
    extraCount: Math.max(0, items.length - 1),
    subtotal: Number(order.subtotal),
    deliveryFee: Number(order.delivery_fee),
    serviceFee: Number(order.service_fee),
    discount: Number(order.discount),
    total: Number(order.total),
    status: order.status,
    eta: order.status === 'delivered' ? 'Delivered' : order.estimated_delivery_at ? new Date(order.estimated_delivery_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '30–45 mins',
    address: { ...order.address, title: order.address?.label || 'Delivery address', line: order.address?.line1, summary: `${order.address?.line1 || ''}, ${order.address?.city || ''}` },
    paymentMethod: order.payment_method.replaceAll('_', ' '),
    deliveryTime: order.estimated_delivery_at ? new Date(order.estimated_delivery_at).toLocaleString() : 'ASAP',
    trackingSteps: statusKeys.map((key, index) => ({ key, en: key.replaceAll('_', ' '), ar: ({ placed: 'تم إرسال الطلب', confirmed: 'تم التأكيد', preparing: 'جاري التجهيز', picked_up: 'تم الاستلام', out_for_delivery: 'في الطريق', delivered: 'تم التوصيل' })[key], state: order.status === 'cancelled' ? 'pending' : index < activeIndex ? 'done' : index === activeIndex ? 'active' : 'pending' })),
    image: items[0]?.product.image,
  };
}

export function useOrders() {
  return useQuery({ queryKey: ['orders'], queryFn: async () => (await api('/orders')).map(mapApiOrder) });
}
