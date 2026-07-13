function mapApiProduct(item) {
  return {
    ...item,
    name: item.name_en,
    nameEn: item.name_en,
    nameAr: item.name_ar,
    description: item.description_en,
    descriptionAr: item.description_ar,
    descEn: item.description_en,
    descAr: item.description_ar,
    categoryId: item.category_id,
    categoryName: item.category_name,
    price: Number(item.price),
    oldPrice: item.compare_at_price ? Number(item.compare_at_price) : null,
    originalPrice: item.compare_at_price ? Number(item.compare_at_price) : Number(item.price),
    image: item.image_url,
    reviews: item.review_count || 0,
    inStock: item.in_stock,
    isFeatured: item.is_featured,
    isBestSeller: item.is_best_seller,
    isFlashDeal: item.is_offer,
    discountPercentage: item.discount_percentage || 0,
    freshnessTag: item.freshness_tag,
    deliveryTag: 'Today delivery',
  }
}

function mapApiCategory(item) {
  return { ...item, en: item.name_en, ar: item.name_ar, icon: item.icon || 'grid-outline' }
}

module.exports = { mapApiProduct, mapApiCategory }
