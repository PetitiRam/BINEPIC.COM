import { useEffect, useState } from 'react';
import client from '../../api/client';
import TabBar from '../../components/TabBar';
import PetitiApp from '../../ai/petiti/PetitiApp';
import TausiApp from '../../ai/tausi/TausiApp';

function OverviewTab() {
  const [petiti, setPetiti] = useState(null);
  const [tausi, setTausi] = useState(null);
  const [deliveries, setDeliveries] = useState(null);

  useEffect(() => {
    client.get('/ai/petiti/dashboard').then(({ data }) => setPetiti(data)).catch(() => setPetiti(false));
    client.get('/ai/tausi/dashboard').then(({ data }) => setTausi(data)).catch(() => setTausi(false));
    client.get('/deliveries/all').then(({ data }) => setDeliveries(data.deliveries || [])).catch(() => setDeliveries([]));
  }, []);

  const deliveryCounts = (deliveries || []).reduce((acc, d) => {
    acc[d.status] = (acc[d.status] || 0) + 1;
    return acc;
  }, {});

  return (
    <div>
      <div className="product-grid" style={{ marginBottom: 24 }}>
        <StatusCard
          name="PETITI"
          role="AI Engineer · Security · Platform Admin · Ops"
          ok={petiti && petiti.health?.db?.status === 'ok'}
          loaded={petiti !== null}
          detail={petiti ? `${petiti.openAlerts?.length || 0} open alerts` : ''}
        />
        <StatusCard
          name="TAUSI"
          role="AI Product Manager"
          ok={tausi !== false}
          loaded={tausi !== null}
          detail={tausi ? `${tausi.activeCampaigns?.length || 0} active campaigns` : ''}
        />
        <div className="card-surface">
          <strong>Delivery monitoring</strong>
          <p className="product-card-meta" style={{ marginTop: 8 }}>
            {deliveries === null ? 'Loading…' : Object.entries(deliveryCounts).map(([k, v]) => `${k.replace(/_/g, ' ')}: ${v}`).join(' · ') || 'No deliveries yet.'}
          </p>
        </div>
      </div>

      {petiti && (
        <>
          <h4>Marketplace health</h4>
          <div className="product-grid" style={{ marginBottom: 24 }}>
            <MiniHealth title="Database" status={petiti.health.db.status} />
            <MiniHealth title="Escrow integrity" status={petiti.health.escrow.status} />
            <MiniHealth title="Moderation queue" status={petiti.health.backlog.status} />
          </div>
        </>
      )}
    </div>
  );
}

function StatusCard({ name, role, ok, loaded, detail }) {
  return (
    <div className="card-surface">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <strong>🤖 {name}</strong>
        <span className={`status-chip ${!loaded ? 'status-pending_review' : ok ? 'status-active' : 'status-rejected'}`}>
          {!loaded ? 'checking…' : ok ? 'online' : 'attention needed'}
        </span>
      </div>
      <p className="product-card-meta" style={{ marginTop: 6 }}>{role}</p>
      {detail && <p className="product-card-meta">{detail}</p>}
    </div>
  );
}

function MiniHealth({ title, status }) {
  const cls = status === 'ok' ? 'status-active' : status === 'degraded' ? 'status-pending_review' : 'status-rejected';
  return (
    <div className="card-surface">
      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        <span>{title}</span>
        <span className={`status-chip ${cls}`}>{status}</span>
      </div>
    </div>
  );
}

const TABS = [
  { key: 'overview', label: 'Overview' },
  { key: 'petiti', label: 'PETITI' },
  { key: 'tausi', label: 'TAUSI' }
];

export default function AICommandCenter() {
  return (
    <div>
      <p style={{ color: '#5B6760', marginBottom: 8 }}>
        PETITI runs engineering, security and platform operations. TAUSI runs product, ads and marketplace growth.
      </p>
      <TabBar tabs={TABS} initial="overview">
        {(active) => (
          <>
            {active === 'overview' && <OverviewTab />}
            {active === 'petiti' && <PetitiApp />}
            {active === 'tausi' && <TausiApp />}
          </>
        )}
      </TabBar>
    </div>
  );
}
