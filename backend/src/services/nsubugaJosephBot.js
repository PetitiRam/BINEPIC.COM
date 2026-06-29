// Nsubuga Joseph — the product-management AI bot.
// Job: clean up seller-submitted listings before they reach pending_review —
// fixing casing/formatting, tightening titles, filling a short description
// when the seller left one blank, and flagging anything that looks incomplete.
//
// This is a deterministic placeholder implementation so the listing flow
// works end-to-end today. Swap the body of `polishListing` for a real LLM
// call (e.g. POST to the Anthropic Messages API) when an API key is wired
// up — the function signature and return shape stay the same.

function titleCase(str = '') {
  return str
    .toLowerCase()
    .split(' ')
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

export async function polishListing({ title, description, category, specs }) {
  const notes = [];

  let polishedTitle = (title || '').trim();
  if (polishedTitle.length > 80) {
    notes.push('Title shortened to fit marketplace display.');
    polishedTitle = polishedTitle.slice(0, 80).trim();
  }
  polishedTitle = titleCase(polishedTitle);

  let polishedDescription = (description || '').trim();
  if (!polishedDescription) {
    const specEntries = specs ? Object.entries(specs).filter(([, v]) => v) : [];
    const specLine = specEntries.length
      ? ` Key details: ${specEntries.map(([k, v]) => `${k}: ${v}`).join(', ')}.`
      : '';
    polishedDescription = `${polishedTitle} — listed in the ${(category || 'general').replace('_', ' ')} category on JEDIDA Marketplace.${specLine}`;
    notes.push('Generated a starter description from the listing details — the seller can edit it any time.');
  }

  if (!specs || Object.keys(specs).length === 0) {
    notes.push('No specs provided — consider adding details like size, material or origin to help buyers compare.');
  }

  return {
    title: polishedTitle,
    description: polishedDescription,
    notes: notes.join(' ')
  };
}
