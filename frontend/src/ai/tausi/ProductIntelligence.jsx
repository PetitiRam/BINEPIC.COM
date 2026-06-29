import { useEffect, useState } from 'react';
import * as tausiApi from './tausiApi';

export default function ProductIntelligence() {
  const [products, setProducts] = useState(null);
  const [busy, setBusy] = useState(false);

  const load = () => tausiApi.getProductIntelligence().then(({ data }) => setProducts(data.products));
  useEffect(() => { load(); }, []);

  const recompute = async () => {
    setBusy(true);
    try { await tausiApi.recomputeScores(); await load(); } finally { setBusy(false); }
  };

  if (!products) return <div className="empty-state">TAUSI is scoring products…</div>;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <p style={{ color: '#5B6760' }}>Quality, demand and trust scores TAUSI computes for every active listing.</p>
        <button className="btn-secondary" onClick={recompute} disabled={busy}>{busy ? 'Recomputing…' : 'Recompute scores'}</button>
      </div>

      {products.length === 0 ? <div className="empty-state">No scored products yet — click "Recompute scores".</div> : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {products.map((p) => (
            <div key={p.id} className="card-surface" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
              <div>
                <strong>{p.title}</strong>
                <div className="product-card-meta">{p.category?.replace('_', ' ')}</div>
              </div>
              <div style={{ display: 'flex', gap: 16, fontSize: '0.85rem' }}>
                <ScoreBadge label="Quality" value={p.quality_score} />
                <ScoreBadge label="Demand" value={p.demand_score} />
                <ScoreBadge label="Trust" value={p.trust_score} />
                <ScoreBadge label="Overall" value={p.overall_score} highlight />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function ScoreBadge({ label, value, highlight }) {
  return (
    <div style={{ textAlign: 'center' }}>
      <div style={{ fontWeight: 800, color: highlight ? 'var(--forest)' : 'var(--ink)', fontSize: highlight ? '1.1rem' : '1rem' }}>{value}</div>
      <div className="product-card-meta">{label}</div>
    </div>
  );
}
