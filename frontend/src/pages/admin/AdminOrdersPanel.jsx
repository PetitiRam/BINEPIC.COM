import { useEffect, useState } from 'react';
import client from '../../api/client';

export default function AdminOrdersPanel() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deliveryId, setDeliveryId] = useState({});

  const load = async () => {
    setLoading(true);
    const { data } = await client.get('/orders/all');
    setOrders(data.orders || []);
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const release = async (id) => { await client.post(`/orders/${id}/release-funds`); load(); };
  const assign = async (id) => {
    const personnelId = deliveryId[id];
    if (!personnelId) return alert('Enter a delivery user ID first.');
    await client.post(`/orders/${id}/assign-delivery`, { deliveryPersonnelId: personnelId });
    load();
  };

  if (loading) return <div className="empty-state">Loading orders…</div>;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {orders.map((o) => (
        <div className="card-surface" key={o.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
          <div>
            <strong>Order {o.id.slice(0, 8)}</strong>
            <div className="product-card-meta">{o.currency} {Number(o.total_amount).toLocaleString()} · fee {o.platform_fee_amount}</div>
          </div>
          <span className={`status-chip status-${o.status}`}>{o.status.replace('_', ' ')}</span>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <input placeholder="Delivery user UUID" style={{ width: 160 }}
              value={deliveryId[o.id] || ''} onChange={(e) => setDeliveryId({ ...deliveryId, [o.id]: e.target.value })} />
            <button className="btn-secondary" onClick={() => assign(o.id)}>Assign</button>
            {o.status === 'completed' && (
              <button className="btn-primary" style={{ width: 'auto', padding: '8px 16px' }} onClick={() => release(o.id)}>Release funds</button>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
