import { useEffect, useState } from 'react';
import client from '../../api/client';
import Logo from '../../components/Logo';
import TabBar from '../../components/TabBar';
import ChatPanel from '../../components/ChatPanel';

function DeliveryOrdersPanel() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    const { data } = await client.get('/orders/mine/delivery');
    setOrders(data.orders || []);
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const confirmDelivered = async (id) => {
    await client.post(`/orders/${id}/confirm-delivery`);
    load();
  };

  if (loading) return <div className="empty-state">Loading…</div>;
  if (orders.length === 0) return <div className="empty-state">No deliveries assigned to you yet. The admin assigns orders here.</div>;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {orders.map((o) => (
        <div className="card-surface" key={o.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
          <div>
            <strong>Order {o.id.slice(0, 8)}</strong>
            <div className="product-card-meta">{o.shipping_address}</div>
          </div>
          <span className={`status-chip status-${o.status}`}>{o.status.replace('_', ' ')}</span>
          {!o.delivery_confirmed && (
            <button className="btn-secondary" onClick={() => confirmDelivered(o.id)}>Mark as delivered</button>
          )}
          {o.delivery_confirmed && <span className="product-card-meta">✔ Delivery confirmed</span>}
        </div>
      ))}
    </div>
  );
}

const TABS = [
  { key: 'orders', label: 'Assigned Deliveries' },
  { key: 'chat', label: 'Chat with Admin' }
];

export default function DeliveryDashboard() {
  return (
    <div>
      <header className="dash-header"><Logo size={32} /></header>
      <div className="dash-body">
        <h2>Delivery Dashboard</h2>
        <TabBar tabs={TABS} initial="orders">
          {(active) => (active === 'orders' ? <DeliveryOrdersPanel /> : <ChatPanel />)}
        </TabBar>
      </div>
    </div>
  );
}
