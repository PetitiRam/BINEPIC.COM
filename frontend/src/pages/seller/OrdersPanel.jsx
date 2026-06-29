import { useEffect, useState } from 'react';
import client from '../../api/client';

export default function OrdersPanel() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    const { data } = await client.get('/orders/mine/seller');
    setOrders(data.orders || []);
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const confirmDelivery = async (id) => {
    await client.post(`/orders/${id}/confirm-delivery`);
    load();
  };

  if (loading) return <div className="empty-state">Loading orders…</div>;
  if (orders.length === 0) return <div className="empty-state">No orders yet. They'll show up here once a buyer purchases from your shop.</div>;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {orders.map((o) => (
        <div className="card-surface" key={o.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
          <div>
            <strong>Order {o.id.slice(0, 8)}</strong>
            <div className="product-card-meta">{o.currency} {Number(o.total_amount).toLocaleString()} · qty {o.quantity}</div>
          </div>
          <span className={`status-chip status-${o.status}`}>{o.status.replace('_', ' ')}</span>
          {['paid_escrow', 'shipped'].includes(o.status) && !o.seller_confirmed_delivery && (
            <button className="btn-secondary" onClick={() => confirmDelivery(o.id)}>Confirm order shipped/delivered</button>
          )}
          {o.seller_confirmed_delivery && <span className="product-card-meta">✔ You confirmed delivery</span>}
        </div>
      ))}
    </div>
  );
}
