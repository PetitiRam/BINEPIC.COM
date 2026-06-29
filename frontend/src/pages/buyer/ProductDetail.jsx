import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import client from '../../api/client';
import MarketplaceHeader from '../../components/MarketplaceHeader';

export default function ProductDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const [qty, setQty] = useState(1);

  useEffect(() => {
    client.get(`/products/${id}`).then(({ data }) => setProduct(data.product));
  }, [id]);

  if (!product) return <div className="empty-state">Loading…</div>;

  return (
    <div>
      <MarketplaceHeader />
      <div className="dash-body" style={{ maxWidth: 760 }}>
        <div className="card-surface" style={{ display: 'flex', gap: 24, flexWrap: 'wrap' }}>
          <div className="product-card-image" style={{ width: 280, borderRadius: 12 }}>
            {product.images?.[0] ? <img src={product.images[0]} alt={product.title} /> : 'No image'}
          </div>
          <div style={{ flex: 1, minWidth: 240 }}>
            <h2>{product.title}</h2>
            <p style={{ color: '#5B6760' }}>{product.description}</p>
            <div className="product-card-price" style={{ fontSize: '1.4rem', margin: '12px 0' }}>
              {product.currency} {Number(product.price).toLocaleString()}
            </div>
            <p className="product-card-meta">Sold by {product.shop_name} · {product.quantity_available} available</p>

            <div className="field-group" style={{ marginTop: 16, maxWidth: 140 }}>
              <label>Quantity</label>
              <input type="number" min="1" max={product.quantity_available} value={qty} onChange={(e) => setQty(Number(e.target.value))} />
            </div>

            <button className="btn-primary" style={{ width: 'auto', padding: '12px 28px' }}
              onClick={() => navigate(`/checkout/${product.id}?qty=${qty}`)}>
              Buy now
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
