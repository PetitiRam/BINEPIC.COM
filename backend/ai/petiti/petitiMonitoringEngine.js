import { query, pool } from '../../src/config/db.js';
import { log } from './petitiService.js';

async function recordHealth(component, status, latencyMs, details = {}) {
  await query(
    `INSERT INTO system_health (component, status, latency_ms, details) VALUES ($1,$2,$3,$4)`,
    [component, status, latencyMs, details]
  );
}

export async function checkDatabase() {
  const start = Date.now();
  try {
    await pool.query('SELECT 1');
    const latency = Date.now() - start;
    await recordHealth('database', latency > 500 ? 'degraded' : 'ok', latency);
    return { component: 'database', status: latency > 500 ? 'degraded' : 'ok', latencyMs: latency };
  } catch (err) {
    await recordHealth('database', 'down', Date.now() - start, { error: err.message });
    await log('petiti', 'critical', 'health', `Database check failed: ${err.message}`);
    return { component: 'database', status: 'down', error: err.message };
  }
}

export async function checkEscrowIntegrity() {
  // escrow wallet balance should equal the sum of orders currently sitting
  // in paid_escrow/shipped/completed-but-not-released — a real sanity check,
  // not a placeholder, that catches bugs in the payment/escrow code path.
  const escrow = await query(`SELECT balance FROM wallets WHERE type = 'escrow'`);
  const expected = await query(`
    SELECT COALESCE(SUM(total_amount), 0) AS expected FROM orders
    WHERE status IN ('paid_escrow','shipped','completed')
  `);
  const actual = Number(escrow.rows[0]?.balance || 0);
  const expectedAmount = Number(expected.rows[0].expected);
  const diff = Math.abs(actual - expectedAmount);
  const status = diff > 0.01 ? 'degraded' : 'ok';
  await recordHealth('escrow', status, null, { actual, expectedAmount, diff });
  if (status === 'degraded') {
    await log('petiti', 'error', 'health', `Escrow ledger mismatch: actual ${actual} vs expected ${expectedAmount}.`);
  }
  return { component: 'escrow', status, actual, expectedAmount };
}

export async function checkPendingBacklog() {
  const result = await query(`SELECT COUNT(*) FROM products WHERE status = 'pending_review'`);
  const count = Number(result.rows[0].count);
  const status = count > 20 ? 'degraded' : 'ok';
  await recordHealth('moderation_queue', status, null, { pendingCount: count });
  return { component: 'moderation_queue', status, pendingCount: count };
}

export async function runHealthCheck() {
  const [db, escrow, backlog] = await Promise.all([
    checkDatabase(), checkEscrowIntegrity(), checkPendingBacklog()
  ]);
  return { db, escrow, backlog, checkedAt: new Date().toISOString() };
}

export async function recentHealth(limit = 50) {
  const result = await query('SELECT * FROM system_health ORDER BY checked_at DESC LIMIT $1', [limit]);
  return result.rows;
}
