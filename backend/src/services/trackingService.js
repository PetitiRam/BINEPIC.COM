import { query } from '../config/db.js';

export const STATUS_FLOW = [
  'pending', 'confirmed', 'processing', 'packed', 'assigned_to_driver',
  'out_for_delivery', 'delivered', 'failed_delivery', 'returned'
];

export async function createDeliveryForOrder(orderId, { pickupAddress, dropoffAddress } = {}) {
  const result = await query(
    `INSERT INTO deliveries (order_id, pickup_address, dropoff_address) VALUES ($1,$2,$3) RETURNING *`,
    [orderId, pickupAddress || null, dropoffAddress || null]
  );
  await addEvent(result.rows[0].id, 'pending', 'Delivery record created.');
  return result.rows[0];
}

export async function addEvent(deliveryId, status, note, createdBy = null) {
  const result = await query(
    `INSERT INTO tracking_events (delivery_id, status, note, created_by) VALUES ($1,$2,$3,$4) RETURNING *`,
    [deliveryId, status, note || null, createdBy]
  );
  return result.rows[0];
}

export async function updateStatus(deliveryId, status, note, createdBy = null) {
  if (!STATUS_FLOW.includes(status)) throw new Error('Invalid delivery status.');
  const result = await query(
    `UPDATE deliveries SET status = $1, delivered_at = CASE WHEN $1 = 'delivered' THEN now() ELSE delivered_at END
     WHERE id = $2 RETURNING *`,
    [status, deliveryId]
  );
  if (result.rows.length === 0) throw new Error('Delivery not found.');
  await addEvent(deliveryId, status, note, createdBy);
  return result.rows[0];
}

export async function getTimeline(deliveryId) {
  const result = await query('SELECT * FROM tracking_events WHERE delivery_id = $1 ORDER BY created_at ASC', [deliveryId]);
  return result.rows;
}

export async function getByOrderId(orderId) {
  const result = await query('SELECT * FROM deliveries WHERE order_id = $1', [orderId]);
  return result.rows[0] || null;
}
