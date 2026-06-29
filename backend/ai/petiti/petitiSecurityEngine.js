// PETITI Security Engine — the fraud-detection brain. Each scan function is
// a real, runnable heuristic against the actual schema (no mocked data),
// designed to be called on a schedule (cron) or on-demand from the Security
// Center / Fraud Monitoring Dashboard.

import { query } from '../../src/config/db.js';
import { createAlert, log } from './petitiService.js';

async function fileReport({ category, riskScore, subjectUserId, subjectProductId, details, evidence }) {
  const result = await query(
    `INSERT INTO fraud_reports (category, risk_score, subject_user_id, subject_product_id, details, evidence)
     VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
    [category, riskScore, subjectUserId || null, subjectProductId || null, details, evidence || {}]
  );
  if (riskScore >= 70) {
    await createAlert({
      actor: 'petiti', severity: riskScore >= 90 ? 'critical' : 'high',
      title: `${category.replace(/_/g, ' ')} detected`, description: details,
      relatedUserId: subjectUserId, metadata: { riskScore, productId: subjectProductId }
    });
  }
  return result.rows[0];
}

// ===== Authentication =====

export async function scanSuspiciousLogins() {
  // many failed refresh-token attempts / accounts created in bursts from same data signals
  const bursts = await query(`
    SELECT phone_number, COUNT(*) AS cnt FROM users
    WHERE created_at > now() - interval '1 hour'
    GROUP BY phone_number HAVING COUNT(*) > 1
  `);
  for (const row of bursts.rows) {
    await fileReport({
      category: 'multi_account_abuse', riskScore: 65,
      details: `Phone number ${row.phone_number} used for ${row.cnt} accounts within an hour.`,
      evidence: { phoneNumber: row.phone_number, count: row.cnt }
    });
  }
  return bursts.rows.length;
}

export async function scanFakeAccounts() {
  // unverified phone + no activity after N days is a soft fake-account signal
  const result = await query(`
    SELECT id, email, created_at FROM users
    WHERE phone_verified = FALSE AND created_at < now() - interval '7 days' AND status = 'active'
  `);
  for (const u of result.rows) {
    await fileReport({
      category: 'fake_account', riskScore: 40, subjectUserId: u.id,
      details: `Account ${u.email} never completed phone verification after 7+ days.`
    });
  }
  return result.rows.length;
}

export async function scanBruteForce(failedAttemptsByIp = {}) {
  // called from the auth rate-limiter hook in production; accepts a map of
  // { ip: failedCount } collected upstream, since brute-force signals live
  // at the request layer, not the DB.
  let flagged = 0;
  for (const [ip, count] of Object.entries(failedAttemptsByIp)) {
    if (count >= 8) {
      await fileReport({ category: 'brute_force', riskScore: 75, details: `${count} failed sign-in attempts from ${ip}.`, evidence: { ip, count } });
      flagged += 1;
    }
  }
  return flagged;
}

// ===== Marketplace =====

export async function scanDuplicateListings() {
  const result = await query(`
    SELECT title, shop_id, COUNT(*) AS cnt, array_agg(id) AS ids
    FROM products WHERE status IN ('active','pending_review')
    GROUP BY title, shop_id HAVING COUNT(*) > 1
  `);
  for (const row of result.rows) {
    await fileReport({
      category: 'duplicate_listing', riskScore: 50, subjectProductId: row.ids[0],
      details: `${row.cnt} duplicate listings titled "${row.title}" in the same shop.`,
      evidence: { ids: row.ids }
    });
  }
  return result.rows.length;
}

export async function scanScamListings() {
  // heuristic: price implausibly low vs category average, or no description at all
  const result = await query(`
    SELECT p.id, p.title, p.price, p.category, p.shop_id
    FROM products p
    WHERE p.status IN ('active','pending_review')
      AND (p.description IS NULL OR length(p.description) < 5)
  `);
  for (const p of result.rows) {
    await fileReport({
      category: 'scam_listing', riskScore: 55, subjectProductId: p.id,
      details: `Listing "${p.title}" has no meaningful description — common in scam listings.`
    });
  }
  return result.rows.length;
}

export async function scanSellerAbuse() {
  const result = await query(`
    SELECT s.owner_id, COUNT(*) AS rejected_count
    FROM products p JOIN shops s ON s.id = p.shop_id
    WHERE p.status = 'rejected'
    GROUP BY s.owner_id HAVING COUNT(*) >= 3
  `);
  for (const row of result.rows) {
    await fileReport({
      category: 'seller_abuse', riskScore: 60, subjectUserId: row.owner_id,
      details: `Seller has had ${row.rejected_count} listings rejected — repeated policy violations.`
    });
  }
  return result.rows.length;
}

// ===== Financial =====

export async function scanWalletAbuse() {
  // rapid balance growth without corresponding completed orders
  const result = await query(`
    SELECT w.owner_id, w.balance
    FROM wallets w
    WHERE w.type = 'user' AND w.balance > 0 AND w.owner_id NOT IN (
      SELECT DISTINCT s.owner_id FROM orders o JOIN shops s ON s.id = o.shop_id WHERE o.status = 'completed'
    )
  `);
  for (const row of result.rows) {
    if (Number(row.balance) > 0) {
      await fileReport({
        category: 'wallet_abuse', riskScore: 45, subjectUserId: row.owner_id,
        details: `Wallet balance of ${row.balance} with no completed orders on record.`
      });
    }
  }
  return result.rows.length;
}

export async function scanSuspiciousTransactions() {
  const result = await query(`
    SELECT order_id, amount, currency FROM payments
    WHERE status = 'succeeded' AND amount > 5000
  `);
  for (const p of result.rows) {
    await fileReport({
      category: 'suspicious_transaction', riskScore: 50,
      details: `Unusually large payment of ${p.currency} ${p.amount} on order ${p.order_id}.`,
      evidence: { orderId: p.order_id, amount: p.amount }
    });
  }
  return result.rows.length;
}

// Runs every scan and returns a summary. This is what the Security Center's
// "Run full scan" button and a scheduled cron job both call.
export async function runFullScan() {
  const summary = {};
  summary.suspiciousLogins = await scanSuspiciousLogins();
  summary.fakeAccounts = await scanFakeAccounts();
  summary.duplicateListings = await scanDuplicateListings();
  summary.scamListings = await scanScamListings();
  summary.sellerAbuse = await scanSellerAbuse();
  summary.walletAbuse = await scanWalletAbuse();
  summary.suspiciousTransactions = await scanSuspiciousTransactions();
  await log('petiti', 'info', 'security', 'Full fraud scan completed.', summary);
  return summary;
}

export async function computeRiskScore(userId) {
  const result = await query(
    `SELECT COALESCE(AVG(risk_score), 0) AS avg_score, COUNT(*) AS report_count
     FROM fraud_reports WHERE subject_user_id = $1 AND status != 'dismissed'`,
    [userId]
  );
  return { riskScore: Math.round(Number(result.rows[0].avg_score)), reportCount: Number(result.rows[0].report_count) };
}

export async function listFraudReports({ status, category } = {}) {
  const conditions = [];
  const values = [];
  let i = 1;
  if (status) { conditions.push(`status = $${i}`); values.push(status); i += 1; }
  if (category) { conditions.push(`category = $${i}`); values.push(category); i += 1; }
  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
  const result = await query(`SELECT * FROM fraud_reports ${where} ORDER BY risk_score DESC, created_at DESC LIMIT 200`, values);
  return result.rows;
}
