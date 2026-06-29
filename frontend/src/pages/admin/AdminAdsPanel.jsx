import { useEffect, useState } from 'react';
import client from '../../api/client';

export default function AdminAdsPanel() {
  const [ads, setAds] = useState([]);
  const [form, setForm] = useState({ title: '', imageUrl: '', linkUrl: '' });

  const load = async () => { const { data } = await client.get('/ads'); setAds(data.ads || []); };
  useEffect(() => { load(); }, []);

  const create = async (e) => {
    e.preventDefault();
    await client.post('/admin/ads', form);
    setForm({ title: '', imageUrl: '', linkUrl: '' });
    load();
  };
  const remove = async (id) => { await client.delete(`/admin/ads/${id}`); load(); };

  return (
    <div>
      <div className="card-surface" style={{ marginBottom: 20 }}>
        <h4>Upload a new ad</h4>
        <form onSubmit={create}>
          <div className="field-group"><label>Title</label><input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required /></div>
          <div className="field-group"><label>Image URL</label><input value={form.imageUrl} onChange={(e) => setForm({ ...form, imageUrl: e.target.value })} required /></div>
          <div className="field-group"><label>Link URL (optional)</label><input value={form.linkUrl} onChange={(e) => setForm({ ...form, linkUrl: e.target.value })} /></div>
          <button className="btn-primary">Publish ad</button>
        </form>
      </div>
      {ads.map((a) => (
        <div key={a.id} className="card-surface" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
          <span>{a.title}</span>
          <button className="btn-link" onClick={() => remove(a.id)}>Remove</button>
        </div>
      ))}
    </div>
  );
}
