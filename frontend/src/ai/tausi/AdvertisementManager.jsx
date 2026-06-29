import { useEffect, useState } from 'react';
import * as tausiApi from './tausiApi';

export default function AdvertisementManager() {
  const [campaigns, setCampaigns] = useState(null);
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({ title: '', budget: '', imageUrl: '' });

  const load = () => tausiApi.getCampaigns().then(({ data }) => setCampaigns(data.campaigns));
  useEffect(() => { load(); }, []);

  const review = async (id, decision) => { await tausiApi.reviewCampaign(id, decision); load(); };
  const recompute = async () => {
    setBusy(true);
    try { await tausiApi.recomputeAdScores(); await load(); } finally { setBusy(false); }
  };

  const create = async (e) => {
    e.preventDefault();
    await tausiApi.createCampaign({ title: form.title, budget: Number(form.budget) || 0, imageUrl: form.imageUrl });
    setForm({ title: '', budget: '', imageUrl: '' });
    load();
  };

  if (!campaigns) return <div className="empty-state">Loading campaigns…</div>;

  return (
    <div>
      <div className="card-surface" style={{ marginBottom: 20 }}>
        <h4>Launch a new campaign</h4>
        <form onSubmit={create}>
          <div className="field-row">
            <div className="field-group"><label>Title</label><input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required /></div>
            <div className="field-group"><label>Budget</label><input type="number" value={form.budget} onChange={(e) => setForm({ ...form, budget: e.target.value })} /></div>
          </div>
          <div className="field-group"><label>Image URL</label><input value={form.imageUrl} onChange={(e) => setForm({ ...form, imageUrl: e.target.value })} /></div>
          <button className="btn-primary">Create campaign</button>
        </form>
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <p style={{ color: '#5B6760' }}>TAUSI reviews seller ad campaigns and scores their performance.</p>
        <button className="btn-secondary" onClick={recompute} disabled={busy}>{busy ? 'Recomputing…' : 'Recompute performance scores'}</button>
      </div>

      {campaigns.length === 0 ? <div className="empty-state">No ad campaigns yet.</div> : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {campaigns.map((c) => (
            <div key={c.id} className="card-surface" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
              <div>
                <strong>{c.title}</strong>
                <div className="product-card-meta">Budget {c.budget} · Spent {c.spent} · Score {c.performance_score}</div>
              </div>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <span className={`status-chip status-${c.status === 'active' ? 'active' : c.status === 'rejected' ? 'rejected' : 'pending_review'}`}>{c.status}</span>
                {c.status === 'pending_review' && (
                  <>
                    <button className="btn-primary" style={{ width: 'auto', padding: '8px 16px' }} onClick={() => review(c.id, 'approve')}>Approve</button>
                    <button className="btn-secondary" onClick={() => review(c.id, 'reject')}>Reject</button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
