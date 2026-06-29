import { useEffect, useState } from 'react';
import client from '../../api/client';
import { CATEGORIES } from '../../constants/categories';

export default function ShopSetupPanel() {
  const [shop, setShop] = useState(null);
  const [form, setForm] = useState({ name: '', description: '', primaryCategory: 'other', currency: 'USD' });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [copied, setCopied] = useState(false);
  const [busy, setBusy] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const { data } = await client.get('/shops/me');
      setShop(data.shop);
      setForm({
        name: data.shop.name, description: data.shop.description || '',
        primaryCategory: data.shop.primary_category, currency: data.shop.currency
      });
    } catch {
      setShop(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const update = (key) => (e) => setForm({ ...form, [key]: e.target.value });

  const createShop = async (e) => {
    e.preventDefault();
    setBusy(true); setError(''); setMessage('');
    try {
      const { data } = await client.post('/shops', form);
      setShop(data.shop);
      setMessage(data.message);
    } catch (err) {
      setError(err.response?.data?.error || 'Could not create your shop.');
    } finally {
      setBusy(false);
    }
  };

  const saveShop = async (e) => {
    e.preventDefault();
    setBusy(true); setError(''); setMessage('');
    try {
      const { data } = await client.patch('/shops/me', form);
      setShop(data.shop);
      setMessage('Shop details saved.');
    } catch (err) {
      setError(err.response?.data?.error || 'Could not save changes.');
    } finally {
      setBusy(false);
    }
  };

  const copyLink = () => {
    navigator.clipboard.writeText(shop.share_link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) return <div className="empty-state">Loading your shop…</div>;

  return (
    <div className="card-surface">
      {!shop ? (
        <>
          <h3>Open your shop</h3>
          <p style={{ color: '#5B6760' }}>This creates your shop profile, UUID and shareable link.</p>
          {error && <div className="alert alert-error">{error}</div>}
          <form onSubmit={createShop}>
            <div className="field-group">
              <label>Shop name</label>
              <input value={form.name} onChange={update('name')} placeholder="e.g. Kampala Fresh Produce" required />
            </div>
            <div className="field-group">
              <label>Description</label>
              <textarea rows={3} value={form.description} onChange={update('description')} placeholder="What does your shop sell?" />
            </div>
            <div className="field-row">
              <div className="field-group">
                <label>Primary category</label>
                <select value={form.primaryCategory} onChange={update('primaryCategory')}>
                  {CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
                </select>
              </div>
              <div className="field-group">
                <label>Currency</label>
                <select value={form.currency} onChange={update('currency')}>
                  <option value="USD">USD</option>
                  <option value="UGX">UGX</option>
                  <option value="KES">KES</option>
                  <option value="NGN">NGN</option>
                </select>
              </div>
            </div>
            <button className="btn-primary" disabled={busy}>{busy ? 'Creating…' : 'Create shop'}</button>
          </form>
        </>
      ) : (
        <>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
            <div>
              <h3 style={{ marginBottom: 4 }}>{shop.name}</h3>
              <span className={`status-chip status-${shop.status}`}>{shop.status}</span>
            </div>
          </div>

          {message && <div className="alert alert-success" style={{ marginTop: 16 }}>{message}</div>}
          {error && <div className="alert alert-error" style={{ marginTop: 16 }}>{error}</div>}

          <div style={{ marginTop: 16, fontSize: '0.85rem', color: '#5B6760' }}>
            <div><strong>Shop ID (UUID):</strong> <code>{shop.id}</code></div>
            <div style={{ marginTop: 6, display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
              <strong>Shareable link:</strong>
              <a href={shop.share_link} target="_blank" rel="noreferrer">{shop.share_link}</a>
              <button className="btn-secondary" style={{ padding: '4px 12px' }} onClick={copyLink} type="button">
                {copied ? 'Copied!' : 'Copy'}
              </button>
            </div>
            <p style={{ marginTop: 6, color: '#8A9189' }}>
              Sharing this link on social media shows your shop name, logo and product previews automatically.
            </p>
          </div>

          <div className="weave-divider" style={{ margin: '20px 0' }} />

          <form onSubmit={saveShop}>
            <div className="field-group">
              <label>Shop name</label>
              <input value={form.name} onChange={update('name')} required />
            </div>
            <div className="field-group">
              <label>Description</label>
              <textarea rows={3} value={form.description} onChange={update('description')} />
            </div>
            <div className="field-row">
              <div className="field-group">
                <label>Primary category</label>
                <select value={form.primaryCategory} onChange={update('primaryCategory')}>
                  {CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
                </select>
              </div>
              <div className="field-group">
                <label>Currency</label>
                <select value={form.currency} onChange={update('currency')}>
                  <option value="USD">USD</option>
                  <option value="UGX">UGX</option>
                  <option value="KES">KES</option>
                  <option value="NGN">NGN</option>
                </select>
              </div>
            </div>
            <button className="btn-primary" disabled={busy}>{busy ? 'Saving…' : 'Save changes'}</button>
          </form>
        </>
      )}
    </div>
  );
}
