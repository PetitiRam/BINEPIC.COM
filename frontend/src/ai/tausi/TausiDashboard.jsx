import { useEffect, useState } from 'react';
import * as tausiApi from './tausiApi';

export default function TausiDashboard() {
  const [data, setData] = useState(null);
  const [busy, setBusy] = useState(false);

  const load = () => tausiApi.getDashboard().then(({ data }) => setData(data));
  useEffect(() => { load(); }, []);

  const recompute = async () => {
    setBusy(true);
    try { await tausiApi.recomputeScores(); await tausiApi.recomputeAdScores(); load(); }
    finally { setBusy(false); }
  };

  if (!data) return <div className="empty-state">TAUSI is gathering product data…</div>;

  return (
    <div>
      <p style={{ color: '#5B6760', marginBottom: 16 }}>
        🤖 <strong>TAUSI</strong> — AI Product Manager: categorization, ranking, recommendations, ads, and seller performance.
      </p>
      <button className="btn-primary" style={{ width: 'auto', padding: '12px 24px', marginBottom: 24 }} onClick={recompute} disabled={busy}>
        {busy ? 'Recomputing…' : '🔄 Recompute scores & campaign performance'}
      </button>

      <h4>Active ad campaigns</h4>
      {data.activeCampaigns.length === 0 ? <div className="empty-state">No active campaigns.</div> : (
        <div className="product-grid" style={{ marginBottom: 24 }}>
          {data.activeCampaigns.map((c) => (
            <div key={c.id} className="card-surface">
              <strong>{c.title}</strong>
              <p className="product-card-meta">Budget {c.budget} · Spent {c.spent} · Score {c.performance_score}</p>
            </div>
          ))}
        </div>
      )}

      <h4>Top performing sellers</h4>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {data.sellerPerformance.map((s) => (
          <div key={s.shopId} className="card-surface" style={{ display: 'flex', justifyContent: 'space-between' }}>
            <strong>{s.shopName}</strong>
            <span className="product-card-meta">{s.conversionRate}% conversion · {s.totalOrders} orders</span>
          </div>
        ))}
      </div>
    </div>
  );
}
