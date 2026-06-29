import { useEffect, useState } from 'react';
import * as tausiApi from './tausiApi';
import { CATEGORIES } from '../../constants/categories';

export default function MarketplaceAnalytics() {
  const [sellers, setSellers] = useState(null);
  const [category, setCategory] = useState('agriculture');
  const [ranked, setRanked] = useState(null);

  useEffect(() => { tausiApi.getSellerPerformance().then(({ data }) => setSellers(data.sellers)); }, []);
  useEffect(() => { tausiApi.getRanked(category, 10).then(({ data }) => setRanked(data.products)); }, [category]);

  return (
    <div>
      <h4>Seller performance leaderboard</h4>
      {!sellers ? <div className="empty-state">Loading…</div> : sellers.length === 0 ? <div className="empty-state">No active shops yet.</div> : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 28 }}>
          {sellers.map((s, idx) => (
            <div key={s.shopId} className="card-surface" style={{ display: 'flex', justifyContent: 'space-between', padding: 14 }}>
              <span>#{idx + 1} <strong>{s.shopName}</strong></span>
              <span className="product-card-meta">{s.activeListings} listings · {s.totalOrders} orders · {s.conversionRate}% conversion</span>
            </div>
          ))}
        </div>
      )}

      <h4>Top ranked products by category</h4>
      <div className="field-group" style={{ maxWidth: 240, marginBottom: 12 }}>
        <select value={category} onChange={(e) => setCategory(e.target.value)}>
          {CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
        </select>
      </div>
      {!ranked ? <div className="empty-state">Loading…</div> : ranked.length === 0 ? <div className="empty-state">No ranked products in this category yet.</div> : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {ranked.map((p) => (
            <div key={p.id} className="card-surface" style={{ display: 'flex', justifyContent: 'space-between', padding: 12 }}>
              <span>#{p.rank} {p.title}</span>
              <span className="product-card-meta">Score {p.overall_score}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
