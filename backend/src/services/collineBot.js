// Colline — the template & imagery AI bot.
// Job: given a category (and optionally a product name), generate a reusable
// listing template — a title pattern, a description skeleton, and a specs
// schema sellers can fill in fast — plus suggested product image URLs.
//
// Deterministic placeholder for now (no external image/LLM calls wired up
// yet). Swap `generateTemplate`'s body for a real call to an LLM + an image
// search/generation API later; the shape of what it returns won't change,
// so `templatesController.js` and the frontend don't need to change either.

const CATEGORY_SPEC_SCHEMAS = {
  agriculture: { produce_type: '', unit: 'kg', harvest_date: '', origin_farm: '', organic: 'no' },
  electronics: { brand: '', model: '', warranty: '', condition_notes: '' },
  fashion: { size: '', material: '', color: '', brand: '' },
  vehicles: { make: '', model: '', year: '', mileage_km: '', fuel_type: '' },
  food_and_beverages: { weight: '', expiry_date: '', ingredients: '' },
  other: { details: '' }
};

export async function generateTemplate({ shopName, category, productHint }) {
  const schema = CATEGORY_SPEC_SCHEMAS[category] || CATEGORY_SPEC_SCHEMAS.other;
  const niceCategory = (category || 'product').replace(/_/g, ' ');

  const titleTemplate = productHint
    ? `${productHint} — {condition} {category}`
    : `{product_name} — {condition} ${niceCategory}`;

  const descriptionTemplate =
    `{product_name} available from ${shopName || 'our shop'} on JEDIDA Marketplace. ` +
    `Category: ${niceCategory}. {short_pitch} Reach out with any questions before ordering.`;

  // Placeholder image suggestions — wire to a real image search/generation
  // API later (this keeps the seller flow usable in the meantime).
  const suggestedImageUrls = [
    `https://source.unsplash.com/600x600/?${encodeURIComponent(niceCategory)}`,
    `https://source.unsplash.com/600x600/?${encodeURIComponent(productHint || niceCategory)}`
  ];

  return {
    name: `${niceCategory} template`,
    category: category || 'other',
    titleTemplate,
    descriptionTemplate,
    specsTemplate: schema,
    suggestedImageUrls,
    generatedByAi: true
  };
}
