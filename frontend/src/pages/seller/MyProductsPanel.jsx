import { useEffect, useState } from 'react';
import client from '../../api/client';

export default function MyProductsPanel() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const { data } = await client.get('/products/mine');
      setProducts(data.products || []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const removeProduct = async (id) => {
    if (!confirm('Remove this listing?')) return;
    await client.delete(`/products/${id}`);
    load();
  };

  if (loading) return <div className="empty-state">Loading your products…</div>;
  if (products.length === 0) {
    return <div className="empty-state">You haven't listed any products yet. Use "Add Product" to create your first listing.</div>;
  }

  return (
    <div className="product-grid">
      {products.map((p) => (
        <div className="product-card" key={p.id}>
          <div className="product-card-image">
            {p.images?.[0] ? <img src={p.images[0]} alt={p.title} /> : 'No image yet'}
          </div>
          <div className="product-card-body">
            <span className={`status-chip status-${p.status}`} style={{ width: 'fit-content' }}>{p.status.replace('_', ' ')}</span>
            <div className="product-card-title">{p.title}</div>
            <div className="product-card-price">{p.currency} {Number(p.price).toLocaleString()}</div>
            <div className="product-card-meta">{p.views_count} views · {p.orders_count} orders</div>
            {p.ai_polished && <div className="product-card-meta">✨ Polished by Nsubuga Joseph</div>}
            <button className="btn-secondary" style={{ marginTop: 6 }} onClick={() => removeProduct(p.id)}>Remove</button>
          </div>
        </div>
      ))}
    </div>
  );
}
