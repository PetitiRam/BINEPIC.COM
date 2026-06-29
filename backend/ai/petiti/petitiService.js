// PETITI — AI Engineer, Security Officer, Platform Administrator, Marketplace
// Manager, Operations Manager. This file is PETITI's "hands": every other
// engine calls into here to write logs/alerts/actions, and this is also
// where PETITI's site-editing powers (logo, theme CSS, pages, components) live.
//
// IMPORTANT BOUNDARY: PETITI can change *data-driven* presentation —
// platform_settings (logo/theme colors/card orientation), theme_overrides
// (custom CSS), platform_pages (simple content pages), and component_registry
// (small reusable UI widgets) — because the frontend already renders all of
// these dynamically (see frontend/src/ai/petiti/SiteEditor.jsx and the
// /p/:slug route in App.jsx). PETITI does NOT write to the server filesystem
// or regenerate/redeploy source code: an autonomous agent with write access
// to its own backend's source is a severe security risk (it could disable
// its own safety checks). "Adding pages", "adding components" and "changing
// CSS/logo" are implemented as data PETITI can create that the running app
// already knows how to render — delivering the requested capability without
// that risk. Anything beyond this boundary (e.g. editing actual .jsx/.js
// files) is logged as a *proposed* ai_action for a human engineer to review
// and apply — see proposeCodeChange() below.

import { query } from '../../src/config/db.js';

export async function log(actor, level, category, message, metadata = {}) {
  await query(
    `INSERT INTO ai_logs (actor, level, category, message, metadata) VALUES ($1,$2,$3,$4,$5)`,
    [actor, level, category, message, metadata]
  );
}

export async function createAlert({ actor = 'petiti', severity = 'medium', title, description, relatedUserId, metadata = {} }) {
  const result = await query(
    `INSERT INTO ai_alerts (actor, severity, title, description, related_user_id, metadata)
     VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
    [actor, severity, title, description, relatedUserId || null, metadata]
  );
  return result.rows[0];
}

// payload.reasoning (if any) is folded into the payload JSON itself, since
// ai_actions has no dedicated `reasoning` column — keeps this self-contained.
export async function recordAction({ actor, actionType, payload = {}, reasoning, status = 'proposed' }) {
  const fullPayload = reasoning ? { ...payload, reasoning } : payload;
  const result = await query(
    `INSERT INTO ai_actions (actor, action_type, payload, status, executed_at)
     VALUES ($1,$2,$3,$4, CASE WHEN $4 = 'executed' THEN now() ELSE NULL END) RETURNING *`,
    [actor, actionType, fullPayload, status]
  );
  return result.rows[0];
}

export async function executeApprovedAction(actionId, adminUserId) {
  const result = await query(
    `UPDATE ai_actions SET status = 'executed', result = jsonb_build_object('approvedBy', $1::text), executed_at = now()
     WHERE id = $2 AND status IN ('proposed','approved') RETURNING *`,
    [adminUserId, actionId]
  );
  return result.rows[0] || null;
}

export async function listLogs({ actor, level, limit = 100 } = {}) {
  const conditions = [];
  const values = [];
  let i = 1;
  if (actor) { conditions.push(`actor = $${i}`); values.push(actor); i += 1; }
  if (level) { conditions.push(`level = $${i}`); values.push(level); i += 1; }
  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
  values.push(Number(limit));
  const result = await query(`SELECT * FROM ai_logs ${where} ORDER BY created_at DESC LIMIT $${i}`, values);
  return result.rows;
}

export async function listAlerts({ status, severity } = {}) {
  const conditions = [];
  const values = [];
  let i = 1;
  if (status) { conditions.push(`status = $${i}`); values.push(status); i += 1; }
  if (severity) { conditions.push(`severity = $${i}`); values.push(severity); i += 1; }
  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
  const result = await query(`SELECT * FROM ai_alerts ${where} ORDER BY created_at DESC LIMIT 200`, values);
  return result.rows;
}

export async function resolveAlert(alertId) {
  const result = await query(
    `UPDATE ai_alerts SET status = 'resolved', resolved_at = now() WHERE id = $1 RETURNING *`,
    [alertId]
  );
  return result.rows[0];
}

export async function listActions({ status } = {}) {
  const where = status ? `WHERE status = $1` : '';
  const values = status ? [status] : [];
  const result = await query(`SELECT * FROM ai_actions ${where} ORDER BY created_at DESC LIMIT 200`, values);
  return result.rows;
}

// ===== Site-editing surface =====

export async function updateLogo(logoUrl) {
  await query('UPDATE platform_settings SET logo_url = $1 WHERE id = 1', [logoUrl]);
  await query('UPDATE theme_overrides SET logo_url = $1, updated_by = $2, updated_at = now() WHERE id = 1', [logoUrl, 'petiti']);
  await recordAction({ actor: 'petiti', actionType: 'update_logo', payload: { logoUrl }, status: 'executed' });
  await log('petiti', 'info', 'platform', `Logo updated to ${logoUrl}`);
}

export async function updateTheme({ primaryColor, accentColor, cardOrientation }) {
  const result = await query(
    `UPDATE platform_settings SET
       theme_primary_color = COALESCE($1, theme_primary_color),
       theme_accent_color = COALESCE($2, theme_accent_color),
       product_card_orientation = COALESCE($3, product_card_orientation)
     WHERE id = 1 RETURNING *`,
    [primaryColor || null, accentColor || null, cardOrientation || null]
  );
  await recordAction({ actor: 'petiti', actionType: 'update_theme', payload: { primaryColor, accentColor, cardOrientation }, status: 'executed' });
  await log('petiti', 'info', 'platform', 'Theme updated.');
  return result.rows[0];
}

export async function updateCustomCss(css) {
  await query('UPDATE theme_overrides SET custom_css = $1, updated_by = $2, updated_at = now() WHERE id = 1', [css, 'petiti']);
  await recordAction({ actor: 'petiti', actionType: 'update_custom_css', payload: { length: css.length }, status: 'executed' });
  await log('petiti', 'info', 'platform', 'Custom CSS updated.');
}

export async function getThemeOverrides() {
  const result = await query('SELECT * FROM theme_overrides WHERE id = 1');
  return result.rows[0];
}

// ===== Dynamic pages (PETITI's "add a page" capability) =====
export async function createOrUpdatePage({ slug, title, contentMd, isActive, isPublished }) {
  const active = isActive ?? isPublished ?? true;
  const result = await query(
    `INSERT INTO platform_pages (slug, title, content_md, is_active, created_by)
     VALUES ($1,$2,$3,$4,'petiti')
     ON CONFLICT (slug) DO UPDATE SET title = $2, content_md = $3, is_active = $4, updated_at = now()
     RETURNING *`,
    [slug, title, contentMd, active]
  );
  await recordAction({ actor: 'petiti', actionType: 'create_page', payload: { slug, title }, status: 'executed' });
  await log('petiti', 'info', 'platform', `Page "${slug}" published.`);
  return result.rows[0];
}

export async function listPages() {
  const result = await query('SELECT * FROM platform_pages ORDER BY updated_at DESC');
  return result.rows;
}

export async function getPageBySlug(slug) {
  const result = await query('SELECT * FROM platform_pages WHERE slug = $1 AND is_active = TRUE', [slug]);
  return result.rows[0] || null;
}

export async function deletePage(id) {
  await query('DELETE FROM platform_pages WHERE id = $1', [id]);
  await recordAction({ actor: 'petiti', actionType: 'delete_page', payload: { id }, status: 'executed' });
}

// ===== Component registry (PETITI's "add a component" capability) =====
export async function createComponent({ name, type, config, placement, isActive }) {
  const result = await query(
    `INSERT INTO component_registry (name, type, config, placement, is_active, created_by)
     VALUES ($1,$2,$3,$4,$5,'petiti') RETURNING *`,
    [name, type, config || {}, placement || 'marketplace_header', isActive ?? true]
  );
  await recordAction({ actor: 'petiti', actionType: 'create_component', payload: { name, type, placement }, status: 'executed' });
  await log('petiti', 'info', 'platform', `Component "${name}" (${type}) added at ${placement}.`);
  return result.rows[0];
}

export async function listComponents(placement) {
  const where = placement ? 'WHERE placement = $1 AND is_active = TRUE' : 'WHERE is_active = TRUE';
  const values = placement ? [placement] : [];
  const result = await query(`SELECT * FROM component_registry ${where} ORDER BY created_at DESC`, values);
  return result.rows;
}

export async function deleteComponent(id) {
  await query('UPDATE component_registry SET is_active = FALSE WHERE id = $1', [id]);
}

// For requests that go beyond the safe surface (e.g. "rewrite the checkout
// component") PETITI logs a proposal for a human engineer instead of
// touching source files directly.
export async function proposeCodeChange({ targetFile, description }) {
  const action = await recordAction({
    actor: 'petiti', actionType: 'propose_code_change',
    payload: { targetFile, description, reasoning: 'Source-code changes require human engineer review.' },
    status: 'proposed'
  });
  await createAlert({
    actor: 'petiti', severity: 'low', title: `Code change proposed: ${targetFile}`,
    description, metadata: { actionId: action.id }
  });
  return action;
}
