const test = require('node:test')
const assert = require('node:assert/strict')

const { mapApiProduct } = require('./catalog.cjs')

test('maps API product fields to the established screen contract', () => {
  const product = mapApiProduct({
    id: 'p1', name_en: 'Tomato', name_ar: 'بندورة', description_en: 'Fresh',
    description_ar: 'طازجة', category_id: 'c1', category_name: 'Vegetables', price: '6.90',
    compare_at_price: '8.50', unit: 'kg', stock: 4, in_stock: true, image_url: 'image',
    rating: 4.7, review_count: 10, discount_percentage: 19, is_featured: true,
    is_best_seller: false, is_offer: true, freshness_tag: 'Today', images: [],
  })
  assert.equal(product.name, 'Tomato')
  assert.equal(product.oldPrice, 8.5)
  assert.equal(product.stock, 4)
  assert.equal(product.image, 'image')
})
