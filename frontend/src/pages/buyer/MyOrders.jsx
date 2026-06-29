import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import client from '../../api/client';
import MarketplaceHeader from '../../components/MarketplaceHeader';

export default function MyOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    const { data } = await client.get('/orders/mine/buyer');
    setOrders(data.orders || []);
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const confirmDelivery = async (id) => {
    await client.post(`/orders/${id}/confirm-delivery`);
    load();
  };

  if (loading) return <div className="empty-state">Loading orders…</div>;

  return (
    <div>
      <MarketplaceHeader />
      <div className="dash-body">
        <h2>My Orders</h2>
        {orders.length === 0 ? <div className="empty-state">You haven't placed any orders yet.</div> : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {orders.map((o) => (
              <div className="card-surface" key={o.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
                <div>
                  <strong>Order {o.id.slice(0, 8)}</strong>
                  <div className="product-card-meta">{o.currency} {Number(o.total_amount).toLocaleString()} · {new Date(o.created_at).toLocaleDateString()}</div>
                </div>
                <span className={`status-chip status-${o.status}`}>{o.status.replace('_', ' ')}</span>
                <Link to={`/orders/${o.id}/track`} className="btn-link">Track order</Link>
                {['paid_escrow', 'shipped'].includes(o.status) && !o.buyer_confirmed_delivery && (
                  <button className="btn-secondary" onClick={() => confirmDelivery(o.id)}>Confirm delivery received</button>
                )}
                {o.buyer_confirmed_delivery && <span className="product-card-meta">✔ You confirmed delivery</span>}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
