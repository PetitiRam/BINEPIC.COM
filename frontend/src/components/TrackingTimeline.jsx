const STATUS_LABELS = {
  pending: 'Pending',
  confirmed: 'Confirmed',
  processing: 'Processing',
  packed: 'Packed',
  assigned_to_driver: 'Assigned to Driver',
  out_for_delivery: 'Out for Delivery',
  delivered: 'Delivered',
  failed_delivery: 'Failed Delivery',
  returned: 'Returned'
};

export default function TrackingTimeline({ events = [], currentStatus }) {
  if (events.length === 0) {
    return <div className="empty-state">No tracking events yet.</div>;
  }

  return (
    <div style={{ position: 'relative', paddingLeft: 24 }}>
      <div style={{ position: 'absolute', left: 6, top: 6, bottom: 6, width: 2, background: 'var(--line)' }} />
      {events.map((e, i) => {
        const isLast = i === events.length - 1;
        const isFailed = e.status === 'failed_delivery';
        return (
          <div key={e.id} style={{ position: 'relative', paddingBottom: 22 }}>
            <div style={{
              position: 'absolute', left: -24, top: 2, width: 14, height: 14, borderRadius: '50%',
              background: isFailed ? 'var(--terracotta)' : isLast ? 'var(--forest)' : 'var(--amber)',
              border: '2px solid #fff', boxShadow: '0 0 0 2px var(--line)'
            }} />
            <strong>{STATUS_LABELS[e.status] || e.status}</strong>
            {e.location && <span className="product-card-meta"> · {e.location}</span>}
            {e.note && <p style={{ margin: '4px 0 0', color: '#5B6760', fontSize: '0.88rem' }}>{e.note}</p>}
            <span style={{ fontSize: '0.75rem', color: '#8A9189' }}>{new Date(e.created_at).toLocaleString()}</span>
          </div>
        );
      })}
      {currentStatus && (
        <div className="status-chip status-active" style={{ display: 'inline-block' }}>
          Current: {STATUS_LABELS[currentStatus] || currentStatus}
        </div>
      )}
    </div>
  );
}

export { STATUS_LABELS };
