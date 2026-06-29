import { useEffect, useState } from 'react';
import * as petitiApi from './petitiApi';

export default function PetitiDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => { petitiApi.getDashboard().then(({ data }) => setData(data)).finally(() => setLoading(false)); }, []);

  if (loading) return <div className="empty-state">PETITI is gathering platform status…</div>;
  if (!data) return <div className="empty-state">Could not load PETITI's dashboard.</div>;

  const { health, snapshot, openAlerts } = data;

  return (
    <div>
      <p style={{ color: '#5B6760', marginBottom: 20 }}>
        🤖 <strong>PETITI</strong> — AI Engineer, Security Officer, Platform Administrator, Marketplace
        Manager and Operations Manager for JEDIDA Marketplace.
      </p>

      <div className="product-grid" style={{ marginBottom: 24 }}>
        <HealthCard title="Database" status={health.db.status} detail={`${health.db.latencyMs ?? '—'} ms`} />
        <HealthCard title="Escrow integrity" status={health.escrow.status} detail={`Actual ${health.escrow.actual} / Expected ${health.escrow.expectedAmount}`} />
        <HealthCard title="Moderation queue" status={health.backlog.status} detail={`${health.backlog.pendingCount} pending`} />
      </div>

      <h4>Open alerts ({openAlerts.length})</h4>
      {openAlerts.length === 0 ? <div className="empty-state">No open alerts. All clear.</div> : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 24 }}>
          {openAlerts.slice(0, 6).map((a) => (
            <div key={a.id} className="card-surface" style={{ padding: 12 }}>
              <span className={`status-chip status-${a.severity === 'critical' ? 'rejected' : 'pending_review'}`}>{a.severity}</span>
              <strong style={{ marginLeft: 8 }}>{a.title}</strong>
            </div>
          ))}
        </div>
      )}

      <h4>Marketplace snapshot</h4>
      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
        <Stat label="Completed GMV" value={snapshot.completedGmv.toLocaleString()} />
        {snapshot.usersByRole.map((r) => <Stat key={r.primary_role} label={`${r.primary_role}s`} value={r.count} />)}
      </div>
    </div>
  );
}

function HealthCard({ title, status, detail }) {
  const color = status === 'ok' ? 'status-active' : status === 'degraded' ? 'status-pending_review' : 'status-rejected';
  return (
    <div className="card-surface">
      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        <strong>{title}</strong>
        <span className={`status-chip ${color}`}>{status}</span>
      </div>
      <p className="product-card-meta" style={{ marginTop: 8 }}>{detail}</p>
    </div>
  );
}

function Stat({ label, value }) {
  return (
    <div className="card-surface" style={{ padding: '14px 20px', textAlign: 'center' }}>
      <div style={{ fontSize: '1.4rem', fontWeight: 800, fontFamily: 'var(--font-display)', color: 'var(--forest)' }}>{value}</div>
      <div className="product-card-meta">{label}</div>
    </div>
  );
}
