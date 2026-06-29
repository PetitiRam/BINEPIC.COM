import { useEffect, useState } from 'react';
import * as petitiApi from './petitiApi';

const PRIORITY_CLASS = { high: 'status-rejected', medium: 'status-pending_review', low: 'status-active' };

export default function AIRecommendations() {
  const [recommendations, setRecommendations] = useState(null);

  useEffect(() => { petitiApi.getRecommendations().then(({ data }) => setRecommendations(data.recommendations || [])); }, []);

  if (!recommendations) return <div className="empty-state">PETITI is analyzing the marketplace…</div>;
  if (recommendations.length === 0) return <div className="empty-state">No recommendations right now — everything looks healthy.</div>;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {recommendations.map((r, i) => (
        <div key={i} className="card-surface">
          <span className={`status-chip ${PRIORITY_CLASS[r.priority] || 'status-active'}`}>{r.priority} priority</span>
          <p style={{ marginTop: 8 }}>{r.message}</p>
          <span className="product-card-meta">{r.type.replace(/_/g, ' ')}</span>
        </div>
      ))}
    </div>
  );
}
