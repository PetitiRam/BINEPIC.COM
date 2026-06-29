import { useEffect, useState } from 'react';
import client from '../../api/client';
import { CATEGORIES } from '../../constants/categories';

export default function TemplatesPanel() {
  const [templates, setTemplates] = useState([]);
  const [category, setCategory] = useState('other');
  const [hint, setHint] = useState('');
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const { data } = await client.get('/templates/mine');
      setTemplates(data.templates || []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const generate = async () => {
    setBusy(true);
    try {
      await client.post('/templates/generate', { category, productHint: hint });
      setHint('');
      await load();
    } finally {
      setBusy(false);
    }
  };

  const remove = async (id) => {
    await client.delete(`/templates/${id}`);
    load();
  };

  return (
    <div>
      <div className="card-surface" style={{ marginBottom: 20 }}>
        <h3>Generate a template with Colline</h3>
        <div className="field-row">
          <div className="field-group">
            <label>Category</label>
            <select value={category} onChange={(e) => setCategory(e.target.value)}>
              {CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
            </select>
          </div>
          <div className="field-group">
            <label>Product hint (optional)</label>
            <input value={hint} onChange={(e) => setHint(e.target.value)} placeholder="e.g. Avocados" />
          </div>
        </div>
        <button className="btn-primary" onClick={generate} disabled={busy}>
          {busy ? 'Generating…' : '✨ Generate template'}
        </button>
      </div>

      {loading ? (
        <div className="empty-state">Loading templates…</div>
      ) : templates.length === 0 ? (
        <div className="empty-state">No templates yet — generate one above, or save one while creating a listing.</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {templates.map((t) => (
            <div key={t.id} className="card-surface" style={{ padding: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <strong>{t.name}</strong>
                <button className="btn-link" onClick={() => remove(t.id)}>Remove</button>
              </div>
              <div style={{ fontSize: '0.85rem', color: '#5B6760', marginTop: 6 }}>{t.title_template}</div>
              <div style={{ fontSize: '0.8rem', color: '#8A9189', marginTop: 4 }}>{t.description_template}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
