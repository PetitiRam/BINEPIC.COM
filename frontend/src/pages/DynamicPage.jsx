import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import client from '../api/client';
import Logo from '../components/Logo';

export default function DynamicPage() {
  const { slug } = useParams();
  const [page, setPage] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    client.get(`/site/pages/${slug}`)
      .then(({ data }) => setPage(data.page))
      .catch((err) => setError(err.response?.data?.error || 'Page not found.'));
  }, [slug]);

  if (error) return <div className="empty-state">{error}</div>;
  if (!page) return <div className="empty-state">Loading…</div>;

  return (
    <div>
      <header className="dash-header"><Logo size={32} /></header>
      <div className="dash-body" style={{ maxWidth: 760 }}>
        <h1>{page.title}</h1>
        {page.created_by === 'petiti' && (
          <p className="product-card-meta">🤖 This page was published by PETITI, JEDIDA's AI platform administrator.</p>
        )}
        <div style={{ marginTop: 16, lineHeight: 1.7 }}>
          {(page.content_md || '').split('\n').map((line, i) => <p key={i}>{line}</p>)}
        </div>
      </div>
    </div>
  );
}
