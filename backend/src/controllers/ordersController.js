import { query } from '../config/db.js';
import { ADAPTERS } from '../services/paymentProviders.js';

async function getSettings() {
  const r = await query('SELECT * FROM platform_settings WHERE id = 1');
  return r.rows[0];
}

// Buyer initiates checkout for a product -> creates an order in pending_payment.
export async function createOrder(req, res) {
  const { productId, quantity = 1, shippingAddress, method } = req.body;
  if (!productId || !method) return res.status(400).json({ error: 'Product and payment method are required.' });

  try {
    const productResult = await query(
      `SELECT p.*, s.id AS shop_id FROM products p JOIN shops s ON s.id = p.shop_id WHERE p.id = $1 AND p.status = 'active'`,
      [productId]
    );
    const product = productResult.rows[0];
    if (!product) return res.status(404).json({ error: 'Product not available.' });
    if (product.quantity_available < quantity) return res.status(400).json({ error: 'Not enough stock available.' });

    const settings = await getSettings();
    const feePercent = Number(settings.platform_fee_percent);
    const unitPrice = Number(product.price);
    const subtotal = unitPrice * quantity;
    const feeAmount = Math.round(subtotal * feePercent) / 100;
    const total = subtotal + feeAmount;

    const orderResult = await query(
      `INSERT INTO orders (buyer_id, shop_id, product_id, quantity, unit_price, currency, platform_fee_percent, platform_fee_amount, total_amount, shipping_address)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING *`,
      [req.user.id, product.shop_id, product.id, quantity, unitPrice, product.currency, feePercent, feeAmount, total, shippingAddress || null]
    );
    const order = orderResult.rows[0];

    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    const adapter = ADAPTERS[method];
    if (!adapter) return res.status(400).json({ error: 'Unsupported payment method.' });

    const charge = await adapter({
      amount: total, currency: product.currency, orderId: order.id,
      returnUrl: `${frontendUrl}/orders/${order.id}`
    });

    await query(
      `INSERT INTO payments (order_id, method, amount, currency, status, provider_reference, raw_response)
       VALUES ($1,$2,$3,$4,'initiated',$5,$6)`,
      [order.id, method, total, product.currency, charge.providerReference, charge.raw]
    );

    return res.status(201).json({
      message: 'Order created. Complete payment to move funds into escrow.',
      order, checkoutUrl: charge.checkoutUrl, providerReference: charge.providerReference
    });
  } catch (err) {
    console.error('Create order error:', err);
    return res.status(500).json({ error: 'Could not create order.' });
  }
}

// Confirms payment succeeded (called by a webhook in production; exposed
// here as a directly-callable endpoint so the flow is testable without
// live provider webhooks configured). Moves funds into escrow.
export async function confirmPayment(req, res) {
  const { orderId } = req.params;
  try {
    const orderResult = await query('SELECT * FROM orders WHERE id = $1', [orderId]);
    const order = orderResult.rows[0];
    if (!order) return res.status(404).json({ error: 'Order not found.' });
    if (order.status !== 'pending_payment') return res.status(400).json({ error: 'Order is not awaiting payment.' });

    await query(`UPDATE payments SET status = 'succeeded' WHERE order_id = $1`, [orderId]);
    await query(`UPDATE orders SET status = 'paid_escrow' WHERE id = $1`, [orderId]);
    await query(`UPDATE wallets SET balance = balance + $1 WHERE type = 'escrow'`, [order.total_amount]);
    await query(
      `INSERT INTO escrow_ledger (order_id, direction, amount, note, created_by) VALUES ($1,'in',$2,'Buyer payment held in escrow',$3)`,
      [orderId, order.total_amount, req.user?.id || order.buyer_id]
    );
    await query(`UPDATE products SET quantity_available = quantity_available - $1, orders_count = orders_count + 1 WHERE id = $2`, [order.quantity, order.product_id]);

    const shopResult = await query('SELECT owner_id FROM shops WHERE id = $1', [order.shop_id]);
    await query(
      `INSERT INTO notifications (user_id, type, title, body) VALUES ($1,'new_order','New order received','You have a new paid order waiting to be fulfilled.')`,
      [shopResult.rows[0].owner_id]
    );

    return res.json({ message: 'Payment confirmed. Funds are held in escrow until delivery is confirmed.' });
  } catch (err) {
    console.error('Confirm payment error:', err);
    return res.status(500).json({ error: 'Could not confirm payment.' });
  }
}

// Buyer, seller, AND delivery personnel each click "delivered" — once all
// three relevant confirmations are in, the order is marked completed and
// queued for the admin to release escrow funds.
export async function confirmDelivery(req, res) {
  const { orderId } = req.params;
  const userId = req.user.id;

  try {
    const orderResult = await query('SELECT o.*, s.owner_id AS seller_id FROM orders o JOIN shops s ON s.id = o.shop_id WHERE o.id = $1', [orderId]);
    const order = orderResult.rows[0];
    if (!order) return res.status(404).json({ error: 'Order not found.' });

    let column = null;
    if (userId === order.buyer_id) column = 'buyer_confirmed_delivery';
    else if (userId === order.seller_id) column = 'seller_confirmed_delivery';
    else if (userId === order.delivery_personnel_id) column = 'delivery_confirmed';
    else return res.status(403).json({ error: 'You are not a party to this order.' });

    const updated = await query(`UPDATE orders SET ${column} = TRUE WHERE id = $1 RETURNING *`, [orderId]);
    const o = updated.rows[0];

    const allConfirmed = o.buyer_confirmed_delivery && o.seller_confirmed_delivery &&
      (o.delivery_personnel_id ? o.delivery_confirmed : true);

    if (allConfirmed && o.status !== 'completed') {
      await query(`UPDATE orders SET status = 'completed' WHERE id = $1`, [orderId]);
      await query(
        `INSERT INTO notifications (user_id, type, title, body) VALUES ($1,'system_announcement','Order ready for payout','All parties confirmed delivery — awaiting admin fund release.')`,
        [order.seller_id]
      );
    } else {
      await query(`UPDATE orders SET status = 'shipped' WHERE id = $1 AND status = 'paid_escrow'`, [orderId]);
    }

    return res.json({ message: 'Delivery confirmation recorded.', order: o, allConfirmed });
  } catch (err) {
    console.error('Confirm delivery error:', err);
    return res.status(500).json({ error: 'Could not record delivery confirmation.' });
  }
}

// Admin releases escrowed funds to the seller's wallet (platform fee stays
// in the platform wallet — it was already separated out at checkout).
export async function releaseFunds(req, res) {
  const { orderId } = req.params;
  try {
    const orderResult = await query('SELECT o.*, s.owner_id AS seller_id FROM orders o JOIN shops s ON s.id = o.shop_id WHERE o.id = $1', [orderId]);
    const order = orderResult.rows[0];
    if (!order) return res.status(404).json({ error: 'Order not found.' });
    if (order.status !== 'completed') return res.status(400).json({ error: 'Order must be completed (all deliveries confirmed) first.' });

    const sellerAmount = Number(order.total_amount) - Number(order.platform_fee_amount);

    await query(`UPDATE wallets SET balance = balance - $1 WHERE type = 'escrow'`, [order.total_amount]);
    await query(`UPDATE wallets SET balance = balance + $1 WHERE owner_id = $2 AND type = 'user'`, [sellerAmount, order.seller_id]);
    await query(`UPDATE wallets SET balance = balance + $1 WHERE type = 'platform'`, [order.platform_fee_amount]);

    await query(
      `INSERT INTO escrow_ledger (order_id, direction, amount, note, created_by) VALUES ($1,'out',$2,'Funds released to seller by admin',$3)`,
      [orderId, order.total_amount, req.user.id]
    );

    await query(
      `INSERT INTO notifications (user_id, type, title, body, sent_by) VALUES ($1,'payout_released','Funds released',$2,$3)`,
      [order.seller_id, `${sellerAmount} ${order.currency} has been released to your wallet for order ${orderId}.`, req.user.id]
    );

    return res.json({ message: 'Funds released to seller.', sellerAmount });
  } catch (err) {
    console.error('Release funds error:', err);
    return res.status(500).json({ error: 'Could not release funds.' });
  }
}

export async function myOrdersAsBuyer(req, res) {
  const result = await query('SELECT * FROM orders WHERE buyer_id = $1 ORDER BY created_at DESC', [req.user.id]);
  res.json({ orders: result.rows });
}

export async function myOrdersAsSeller(req, res) {
  const shopResult = await query('SELECT id FROM shops WHERE owner_id = $1', [req.user.id]);
  if (shopResult.rows.length === 0) return res.json({ orders: [] });
  const result = await query('SELECT * FROM orders WHERE shop_id = $1 ORDER BY created_at DESC', [shopResult.rows[0].id]);
  res.json({ orders: result.rows });
}

export async function myOrdersAsDelivery(req, res) {
  const result = await query('SELECT * FROM orders WHERE delivery_personnel_id = $1 ORDER BY created_at DESC', [req.user.id]);
  res.json({ orders: result.rows });
}

export async function allOrders(req, res) {
  const result = await query('SELECT * FROM orders ORDER BY created_at DESC LIMIT 200');
  res.json({ orders: result.rows });
}

// Admin assigns a delivery person to an order.
export async function assignDelivery(req, res) {
  const { orderId } = req.params;
  const { deliveryPersonnelId } = req.body;
  const result = await query('UPDATE orders SET delivery_personnel_id = $1 WHERE id = $2 RETURNING *', [deliveryPersonnelId, orderId]);
  if (result.rows.length === 0) return res.status(404).json({ error: 'Order not found.' });
  await query(
    `INSERT INTO notifications (user_id, type, title, body) VALUES ($1,'new_order','New delivery assigned','You have been assigned to deliver an order.')`,
    [deliveryPersonnelId]
  );
  res.json({ message: 'Delivery personnel assigned.', order: result.rows[0] });
}
