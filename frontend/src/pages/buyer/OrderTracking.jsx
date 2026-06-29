import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import client from '../../api/client';
import MarketplaceHeader from '../../components/MarketplaceHeader';
import TrackingTimeline from '../../components/TrackingTimeline';

export default function OrderTracking() {
  const { orderId } = useParams();
  const [delivery, setDelivery] = useState(null);
  const [timeline, setTimeline] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    client.get(`/deliveries/by-order/${orderId}`)
      .then(({ data }) => { setDelivery(data.delivery); setTimeline(data.timeline); })
      .catch((err) => setError(err.response?.data?.error || 'No tracking information available yet.'));
  }, [orderId]);

  return (
    <div>
      <MarketplaceHeader />
      <div className="dash-body" style={{ maxWidth: 600 }}>
        <h2>Track your order</h2>
        {error ? <div className="empty-state">{error}</div> : !delivery ? (
          <div className="empty-state">Loading…</div>
        ) : (
          <div className="card-surface">
            <p className="product-card-meta">
              {delivery.pickup_address && <>From {delivery.pickup_address} </>}
              {delivery.dropoff_address && <>→ {delivery.dropoff_address}</>}
            </p>
            {delivery.estimated_at && (
              <p className="product-card-meta">Estimated delivery: {new Date(delivery.estimated_at).toLocaleString()}</p>
            )}
            <div style={{ marginTop: 16 }}>
              <TrackingTimeline events={timeline} currentStatus={delivery.status} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
