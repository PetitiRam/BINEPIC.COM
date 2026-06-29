import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import client from '../api/client';
import Logo from '../components/Logo';

export default function PublicShop() {
  const { slug } = useParams();
  const [shop, setShop] = useState(null);
  const [products, setProducts] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    client.get(`/shops/public/${slug}`)
      .then(({ data }) => { setShop(data.shop); setProducts(data.products); })
      .catch((err) => setError(err.response?.data?.error || 'Shop not found.'))
      .finally(() => setLoading(false));
  }, [slug]);

  if (loading) return <div className="empty-state">Loading shop…</div>;
  if (error) return <div className="empty-state">{error}</div>;

  return (
    <div>
      <header className="dash-header">
        <Logo size={32} />
        <Link to="/marketplace" className="btn-link">Main Marketplace →</Link>
      </header>

      <div style={{
        background: 'linear-gradient(160deg, var(--forest), var(--forest-dark))',
        color: 'var(--cream)', padding: '48px 32px', textAlign: 'center'
      }}>
        {shop.logo_url && <img src={shop.logo_url} alt={shop.name} style={{ width: 72, height: 72, borderRadius: 16, marginBottom: 12 }} />}
        <h1 style={{ fontSize: '2rem' }}>{shop.name}</h1>
        <p style={{ maxWidth: 540, margin: '8px auto 0', color: 'var(--cream-dim)' }}>{shop.description}</p>
      </div>

      <div className="dash-body">
        <h3>Products from this shop</h3>
        {products.length === 0 ? (
          <div className="empty-state">This shop hasn't listed any products yet.</div>
        ) : (
          <div className="product-grid">
            {products.map((p) => (
              <div className="product-card" key={p.id}>
                <div className="product-card-image">
                  {p.images?.[0] ? <img src={p.images[0]} alt={p.title} /> : 'No image'}
                </div>
                <div className="product-card-body">
                  {p.is_featured && <span className="product-card-badge">Featured</span>}
                  <div className="product-card-title">{p.title}</div>
                  <div className="product-card-price">{p.currency} {Number(p.price).toLocaleString()}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
