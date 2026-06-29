import { useEffect, useState } from 'react';
import * as petitiApi from './petitiApi';

export default function SecurityCenter() {
  const [reports, setReports] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [scanning, setScanning] = useState(false);
  const [scanResult, setScanResult] = useState(null);

  const load = () => {
    petitiApi.getSecurity().then(({ data }) => setReports(data.reports || []));
    petitiApi.getAlerts({ status: 'open' }).then(({ data }) => setAlerts(data.alerts || []));
  };
  useEffect(() => { load(); }, []);

  const runScan = async () => {
    setScanning(true);
    try {
      const { data } = await petitiApi.runSecurityScan();
      setScanResult(data.summary);
      load();
    } finally { setScanning(false); }
  };

  const resolve = async (id) => { await petitiApi.resolveAlert(id); load(); };

  return (
    <div>
      <button className="btn-primary" style={{ width: 'auto', padding: '12px 24px', marginBottom: 20 }} onClick={runScan} disabled={scanning}>
        {scanning ? 'PETITI is scanning…' : '🔍 Run full fraud scan'}
      </button>

      {scanResult && (
        <div className="alert alert-success">
          Scan complete: {Object.entries(scanResult).map(([k, v]) => `${k}: ${v}`).join(' · ')}
        </div>
      )}

      <h4>Open security alerts</h4>
      {alerts.length === 0 ? <div className="empty-state">No open alerts.</div> : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 24 }}>
          {alerts.map((a) => (
            <div key={a.id} className="card-surface" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
              <div>
                <span className={`status-chip ${a.severity === 'critical' || a.severity === 'high' ? 'status-rejected' : 'status-pending_review'}`}>{a.severity}</span>
                <strong style={{ marginLeft: 8 }}>{a.title}</strong>
                <p className="product-card-meta">{a.description}</p>
              </div>
              <button className="btn-secondary" onClick={() => resolve(a.id)}>Resolve</button>
            </div>
          ))}
        </div>
      )}

      <h4>Fraud reports</h4>
      {reports.length === 0 ? <div className="empty-state">No fraud reports on file.</div> : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {reports.map((r) => (
            <div key={r.id} className="card-surface">
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <strong>{r.category.replace(/_/g, ' ')}</strong>
                <span className="product-card-badge">Risk {r.risk_score}</span>
              </div>
              <p className="product-card-meta">{r.details}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
