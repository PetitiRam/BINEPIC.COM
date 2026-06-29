import { useEffect, useState } from 'react';
import client from '../../api/client';

export default function AdminSettingsPanel() {
  const [form, setForm] = useState(null);
  const [message, setMessage] = useState('');

  useEffect(() => { client.get('/admin/settings').then(({ data }) => setForm(data.settings)); }, []);

  const update = (key) => (e) => setForm({ ...form, [key]: e.target.value });

  const save = async (e) => {
    e.preventDefault();
    const { data } = await client.patch('/admin/settings', {
      logoUrl: form.logo_url, themePrimaryColor: form.theme_primary_color, themeAccentColor: form.theme_accent_color,
      productCardOrientation: form.product_card_orientation, platformFeePercent: form.platform_fee_percent,
      upgradeFeeAmount: form.upgrade_fee_amount
    });
    setForm(data.settings);
    setMessage('Settings saved.');
  };

  if (!form) return <div className="empty-state">Loading settings…</div>;

  return (
    <div className="card-surface" style={{ maxWidth: 480 }}>
      {message && <div className="alert alert-success">{message}</div>}
      <form onSubmit={save}>
        <div className="field-group"><label>Logo URL</label><input value={form.logo_url || ''} onChange={update('logo_url')} /></div>
        <div className="field-row">
          <div className="field-group"><label>Primary color</label><input type="color" value={form.theme_primary_color} onChange={update('theme_primary_color')} /></div>
          <div className="field-group"><label>Accent color</label><input type="color" value={form.theme_accent_color} onChange={update('theme_accent_color')} /></div>
        </div>
        <div className="field-group">
          <label>Product card orientation</label>
          <select value={form.product_card_orientation} onChange={update('product_card_orientation')}>
            <option value="grid">Grid</option>
            <option value="list">List</option>
          </select>
        </div>
        <div className="field-row">
          <div className="field-group"><label>Platform fee (%)</label><input type="number" step="0.1" value={form.platform_fee_percent} onChange={update('platform_fee_percent')} /></div>
          <div className="field-group"><label>Upgrade verification fee</label><input type="number" value={form.upgrade_fee_amount} onChange={update('upgrade_fee_amount')} /></div>
        </div>
        <button className="btn-primary">Save settings</button>
      </form>
    </div>
  );
}
