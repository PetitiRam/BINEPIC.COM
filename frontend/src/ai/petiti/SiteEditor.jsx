import { useEffect, useState } from 'react';
import * as petitiApi from './petitiApi';

export default function SiteEditor() {
  const [logoUrl, setLogoUrl] = useState('');
  const [primaryColor, setPrimaryColor] = useState('#1B4332');
  const [accentColor, setAccentColor] = useState('#E0A93C');
  const [css, setCss] = useState('');
  const [pages, setPages] = useState([]);
  const [pageForm, setPageForm] = useState({ slug: '', title: '', contentMd: '' });
  const [message, setMessage] = useState('');

  const loadPages = () => petitiApi.getPages().then(({ data }) => setPages(data.pages || []));
  useEffect(() => { loadPages(); }, []);

  const saveLogo = async () => { await petitiApi.updateLogo(logoUrl); setMessage('Logo updated by PETITI.'); };
  const saveTheme = async () => { await petitiApi.updateTheme({ primaryColor, accentColor }); setMessage('Theme updated by PETITI.'); };
  const saveCss = async () => { await petitiApi.updateCustomCss(css); setMessage('Custom CSS updated by PETITI.'); };

  const savePage = async (e) => {
    e.preventDefault();
    await petitiApi.savePage({ ...pageForm, isPublished: true });
    setPageForm({ slug: '', title: '', contentMd: '' });
    setMessage(`Page "/p/${pageForm.slug}" published by PETITI.`);
    loadPages();
  };
  const removePage = async (id) => { await petitiApi.deletePage(id); loadPages(); };

  return (
    <div>
      {message && <div className="alert alert-success">{message}</div>}

      <div className="card-surface" style={{ marginBottom: 16 }}>
        <h4>Logo</h4>
        <div className="field-group"><input placeholder="Logo URL" value={logoUrl} onChange={(e) => setLogoUrl(e.target.value)} /></div>
        <button className="btn-secondary" onClick={saveLogo}>Apply logo</button>
      </div>

      <div className="card-surface" style={{ marginBottom: 16 }}>
        <h4>Theme colors</h4>
        <div className="field-row">
          <div className="field-group"><label>Primary</label><input type="color" value={primaryColor} onChange={(e) => setPrimaryColor(e.target.value)} /></div>
          <div className="field-group"><label>Accent</label><input type="color" value={accentColor} onChange={(e) => setAccentColor(e.target.value)} /></div>
        </div>
        <button className="btn-secondary" onClick={saveTheme}>Apply theme</button>
      </div>

      <div className="card-surface" style={{ marginBottom: 16 }}>
        <h4>Custom CSS</h4>
        <textarea rows={5} value={css} onChange={(e) => setCss(e.target.value)} placeholder=".product-card { border-radius: 20px; }" />
        <button className="btn-secondary" style={{ marginTop: 8 }} onClick={saveCss}>Apply CSS</button>
      </div>

      <div className="card-surface">
        <h4>Add a page</h4>
        <p className="product-card-meta">Published at /p/&lt;slug&gt; — e.g. an FAQ, Terms, or seasonal landing page.</p>
        <form onSubmit={savePage}>
          <div className="field-row">
            <div className="field-group"><label>Slug</label><input value={pageForm.slug} onChange={(e) => setPageForm({ ...pageForm, slug: e.target.value })} required /></div>
            <div className="field-group"><label>Title</label><input value={pageForm.title} onChange={(e) => setPageForm({ ...pageForm, title: e.target.value })} required /></div>
          </div>
          <div className="field-group"><label>Content (Markdown)</label><textarea rows={5} value={pageForm.contentMd} onChange={(e) => setPageForm({ ...pageForm, contentMd: e.target.value })} /></div>
          <button className="btn-primary">Publish page</button>
        </form>

        {pages.length > 0 && (
          <div style={{ marginTop: 16 }}>
            {pages.map((p) => (
              <div key={p.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderTop: '1px solid var(--line)' }}>
                <a href={`/p/${p.slug}`} target="_blank" rel="noreferrer">/p/{p.slug} — {p.title}</a>
                <button className="btn-link" onClick={() => removePage(p.id)}>Remove</button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
