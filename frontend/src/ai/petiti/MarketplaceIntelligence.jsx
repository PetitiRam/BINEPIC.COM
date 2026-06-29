import { useEffect, useState } from 'react';
import * as petitiApi from './petitiApi';

export default function MarketplaceIntelligence() {
  const [snapshot, setSnapshot] = useState(null);

  useEffect(() => { petitiApi.getMarketplaceIntel().then(({ data }) => setSnapshot(data.snapshot)); }, []);

  if (!snapshot) return <div className="empty-state">Loading marketplace intelligence…</div>;

  return (
    <div>
      <Section title="Users by role" rows={snapshot.usersByRole} keyField="primary_role" />
      <Section title="Shops by status" rows={snapshot.shopsByStatus} keyField="status" />
      <Section title="Products by status" rows={snapshot.productsByStatus} keyField="status" />
      <Section title="Orders by status" rows={snapshot.ordersByStatus} keyField="status" />
      <div className="card-surface" style={{ marginTop: 16, textAlign: 'center' }}>
        <p className="product-card-meta">Completed GMV</p>
        <div style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--forest)' }}>{snapshot.completedGmv.toLocaleString()}</div>
      </div>
    </div>
  );
}

function Section({ title, rows, keyField }) {
  return (
    <div style={{ marginBottom: 20 }}>
      <h4>{title}</h4>
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
        {rows.map((r) => (
          <div key={r[keyField]} className="card-surface" style={{ padding: '10px 16px' }}>
            <strong>{r.count}</strong> <span className="product-card-meta">{r[keyField]}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
