import { useEffect, useState } from 'react';
import * as petitiApi from './petitiApi';

export default function AIActivityLogs() {
  const [logs, setLogs] = useState([]);
  const [level, setLevel] = useState('');
  const [loading, setLoading] = useState(true);

  const load = () => {
    setLoading(true);
    petitiApi.getLogs({ level: level || undefined }).then(({ data }) => setLogs(data.logs || [])).finally(() => setLoading(false));
  };
  useEffect(() => { load(); }, [level]);

  return (
    <div>
      <div className="field-group" style={{ maxWidth: 200, marginBottom: 16 }}>
        <label>Filter by level</label>
        <select value={level} onChange={(e) => setLevel(e.target.value)}>
          <option value="">All</option>
          <option value="info">Info</option>
          <option value="warning">Warning</option>
          <option value="error">Error</option>
          <option value="critical">Critical</option>
        </select>
      </div>

      {loading ? <div className="empty-state">Loading logs…</div> : logs.length === 0 ? (
        <div className="empty-state">No activity logged yet.</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {logs.map((l) => (
            <div key={l.id} className="card-surface" style={{ padding: 12 }}>
              <span className={`status-chip ${l.level === 'critical' || l.level === 'error' ? 'status-rejected' : 'status-active'}`}>{l.level}</span>
              <span style={{ marginLeft: 8, fontSize: '0.78rem', color: '#8A9189' }}>{l.category}</span>
              <p style={{ margin: '6px 0 0' }}>{l.message}</p>
              <span style={{ fontSize: '0.75rem', color: '#8A9189' }}>{new Date(l.created_at).toLocaleString()}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
