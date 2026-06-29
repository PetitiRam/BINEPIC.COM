import { query } from '../config/db.js';
import * as tracking from '../services/trackingService.js';

export async function registerDriver(req, res) {
  const { vehicleType, licensePlate } = req.body;
  const result = await query(
    `INSERT INTO drivers (user_id, vehicle_type, license_plate) VALUES ($1,$2,$3) RETURNING *`,
    [req.user.id, vehicleType || null, licensePlate || null]
  );
  res.status(201).json({ driver: result.rows[0] });
}

export async function myDriverProfile(req, res) {
  const result = await query('SELECT * FROM drivers WHERE user_id = $1', [req.user.id]);
  res.json({ driver: result.rows[0] || null });
}

export async function listDrivers(req, res) {
  const result = await query(`
    SELECT d.*, u.full_name, u.phone_number FROM drivers d JOIN users u ON u.id = d.user_id WHERE d.is_active = TRUE
  `);
  res.json({ drivers: result.rows });
}

export async function createDelivery(req, res) {
  const { orderId, pickupAddress, dropoffAddress } = req.body;
  const delivery = await tracking.createDeliveryForOrder(orderId, { pickupAddress, dropoffAddress });
  res.status(201).json({ delivery });
}

export async function assignDriver(req, res) {
  const { id } = req.params;
  const { driverId } = req.body;
  const result = await query('UPDATE deliveries SET driver_id = $1 WHERE id = $2 RETURNING *', [driverId, id]);
  if (result.rows.length === 0) return res.status(404).json({ error: 'Delivery not found.' });
  await tracking.updateStatus(id, 'assigned_to_driver', 'Driver assigned by admin.', req.user.id);
  res.json({ message: 'Driver assigned.', delivery: result.rows[0] });
}

export async function updateStatus(req, res) {
  const { id } = req.params;
  const { status, note } = req.body;
  try {
    const delivery = await tracking.updateStatus(id, status, note, req.user.id);
    res.json({ message: 'Status updated.', delivery });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
}

export async function getTimeline(req, res) {
  const timeline = await tracking.getTimeline(req.params.id);
  res.json({ timeline });
}

export async function getByOrder(req, res) {
  const delivery = await tracking.getByOrderId(req.params.orderId);
  if (!delivery) return res.status(404).json({ error: 'No delivery record for this order yet.' });
  const timeline = await tracking.getTimeline(delivery.id);
  res.json({ delivery, timeline });
}

export async function myDriverDeliveries(req, res) {
  const driverResult = await query('SELECT id FROM drivers WHERE user_id = $1', [req.user.id]);
  if (driverResult.rows.length === 0) return res.json({ deliveries: [] });
  const result = await query('SELECT * FROM deliveries WHERE driver_id = $1 ORDER BY created_at DESC', [driverResult.rows[0].id]);
  res.json({ deliveries: result.rows });
}

export async function allDeliveries(req, res) {
  const result = await query('SELECT * FROM deliveries ORDER BY created_at DESC LIMIT 200');
  res.json({ deliveries: result.rows });
}
