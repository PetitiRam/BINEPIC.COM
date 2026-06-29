import { useEffect, useState } from 'react';
import client from '../../api/client';
import { CATEGORIES, CONDITIONS } from '../../constants/categories';

const emptyForm = {
  title: '', description: '', category: 'other', condition: 'new', price: '', currency: 'USD',
  quantityAvailable: 1, sku: '', images: '', locationCity: '', locationCountry: ''
};

export default function AddProductPanel() {
  const [form, setForm] = useState(emptyForm);
  const [templates, setTemplates] = useState([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState('');
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState(null);
  const [busy, setBusy] = useState(false);

  const loadTemplates = async () => {
    const { data } = await client.get('/templates/mine');
    setTemplates(data.templates || []);
  };

  useEffect(() => { loadTemplates(); }, []);

  const update = (key) => (e) => setForm({ ...form, [key]: e.target.value });

  const applyTemplate = (templateId) => {
    setSelectedTemplateId(templateId);
    const t = templates.find((tpl) => tpl.id === templateId);
    if (!t) return;
    setForm((f) => ({
      ...f,
      category: t.category,
      description: t.description_template?.replace('{product_name}', f.title || '').replace('{short_pitch}', '') || f.description,
      images: (t.suggested_image_urls || []).join(', ')
    }));
  };

  const generateTemplate = async () => {
    setGenerating(true);
    setError('');
    try {
      await client.post('/templates/generate', { category: form.category, productHint: form.title });
      await loadTemplates();
    } catch (err) {
      setError(err.response?.data?.error || 'Could not generate a template right now.');
    } finally {
      setGenerating(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(''); setResult(null); setBusy(true);
    try {
      const payload = {
        ...form,
        price: Number(form.price),
        quantityAvailable: Number(form.quantityAvailable),
        images: form.images.split(',').map((s) => s.trim()).filter(Boolean),
        templateId: selectedTemplateId || null
      };
      const { data } = await client.post('/products', payload);
      setResult(data);
      setForm(emptyForm);
      setSelectedTemplateId('');
    } catch (err) {
      setError(err.response?.data?.error || 'Could not create your listing.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="card-surface">
      <h3>List a new product</h3>
      <p style={{ color: '#5B6760' }}>
        Reuse a template, or let <strong>Colline</strong> generate one for this category. Every listing
        is polished by <strong>Nsubuga Joseph</strong> before it goes live.
      </p>

      {templates.length > 0 && (
        <div className="field-group">
          <label>Reuse a template</label>
          <select value={selectedTemplateId} onChange={(e) => applyTemplate(e.target.value)}>
            <option value="">— Start from scratch —</option>
            {templates.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
          </select>
        </div>
      )}
      <button type="button" className="btn-secondary" onClick={generateTemplate} disabled={generating} style={{ marginBottom: 20 }}>
        {generating ? 'Colline is generating…' : '✨ Generate a template with Colline'}
      </button>

      {error && <div className="alert alert-error">{error}</div>}
      {result && (
        <div className="alert alert-success">
          {result.message}
          {result.product?.ai_polish_notes && <div style={{ marginTop: 6 }}><em>Nsubuga Joseph's note:</em> {result.product.ai_polish_notes}</div>}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="field-group">
          <label>Title</label>
          <input value={form.title} onChange={update('title')} placeholder="e.g. Fresh Organic Matooke — 1 Bunch" required />
        </div>

        <div className="field-group">
          <label>Description</label>
          <textarea rows={4} value={form.description} onChange={update('description')} placeholder="Leave blank and Nsubuga Joseph will draft one for you" />
        </div>

        <div className="field-row">
          <div className="field-group">
            <label>Category</label>
            <select value={form.category} onChange={update('category')}>
              {CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
            </select>
          </div>
          <div className="field-group">
            <label>Condition</label>
            <select value={form.condition} onChange={update('condition')}>
              {CONDITIONS.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
            </select>
          </div>
        </div>

        <div className="field-row">
          <div className="field-group">
            <label>Price</label>
            <input type="number" min="0" step="0.01" value={form.price} onChange={update('price')} required />
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
          <div className="field-group">
            <label>Quantity available</label>
            <input type="number" min="1" value={form.quantityAvailable} onChange={update('quantityAvailable')} required />
          </div>
        </div>

        <div className="field-group">
          <label>Image URLs (comma-separated)</label>
          <input value={form.images} onChange={update('images')} placeholder="https://...jpg, https://...jpg" />
        </div>

        <div className="field-row">
          <div className="field-group">
            <label>City</label>
            <input value={form.locationCity} onChange={update('locationCity')} />
          </div>
          <div className="field-group">
            <label>Country</label>
            <input value={form.locationCountry} onChange={update('locationCountry')} />
          </div>
        </div>

        <button className="btn-primary" disabled={busy}>{busy ? 'Submitting…' : 'List product'}</button>
      </form>
    </div>
  );
}
