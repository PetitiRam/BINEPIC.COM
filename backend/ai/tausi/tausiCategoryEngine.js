// Deterministic keyword categorizer today; swap CATEGORY_KEYWORDS lookup
// for a real LLM classification call later without changing the call shape.

const CATEGORY_KEYWORDS = {
  agriculture: ['matooke', 'maize', 'coffee', 'cassava', 'farm', 'organic', 'produce', 'harvest', 'crop', 'beans', 'avocado', 'banana'],
  electronics: ['phone', 'laptop', 'tv', 'charger', 'speaker', 'camera', 'electronic', 'cable', 'headphone'],
  fashion: ['shirt', 'dress', 'shoe', 'bag', 'fashion', 'wear', 'jeans', 'jacket'],
  vehicles: ['car', 'motorcycle', 'bike', 'truck', 'vehicle', 'boda', 'tyre'],
  food_and_beverages: ['drink', 'juice', 'snack', 'beverage', 'food', 'soda', 'water'],
  health_and_beauty: ['cream', 'lotion', 'skincare', 'cosmetic', 'beauty', 'soap'],
  home_and_garden: ['furniture', 'sofa', 'garden', 'kitchen', 'home', 'decor'],
  sports_and_outdoors: ['ball', 'sports', 'gym', 'outdoor', 'bicycle', 'fitness'],
  books_and_media: ['book', 'novel', 'magazine', 'cd', 'dvd'],
  toys_and_kids: ['toy', 'kids', 'baby', 'children'],
  art_and_crafts: ['craft', 'art', 'painting', 'handmade']
};

export function categorize({ title = '', description = '' }) {
  const text = `${title} ${description}`.toLowerCase();
  let best = { category: 'other', score: 0 };

  for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    const matches = keywords.filter((k) => text.includes(k)).length;
    if (matches > best.score) best = { category, score: matches };
  }

  const confidence = best.score === 0 ? 0 : Math.min(100, best.score * 35);
  return { category: best.category, confidence };
}

export function batchCategorize(products) {
  return products.map((p) => ({ id: p.id, ...categorize(p) }));
}
