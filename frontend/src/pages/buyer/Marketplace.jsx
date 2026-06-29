import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import client from '../../api/client';
import MarketplaceHeader from '../../components/MarketplaceHeader';
import TabBar from '../../components/TabBar';
import { CATEGORIES } from '../../constants/categories';

function ProductGrid({ products }) {
  const navigate = useNavigate();
  if (products.length === 0) return <div className="empty-state">No products found.</div>;
  return (
    <div className="product-grid">
      {products.map((p) => (
        <div className="product-card" key={p.id} onClick={() => navigate(`/product/${p.id}`)} style={{ cursor: 'pointer' }}>
          <div className="product-card-image">{p.images?.[0] ? <img src={p.images[0]} alt={p.title} /> : 'No image'}</div>
          <div className="product-card-body">
            {p.is_trending && <span className="product-card-badge">Trending</span>}
            <div className="product-card-title">{p.title}</div>
            <div className="product-card-price">{p.currency} {Number(p.price).toLocaleString()}</div>
            <div className="product-card-meta">{p.shop_name}</div>
          </div>
        </div>
      ))}
    </div>
  );
}

function AllProductsTab() {
  const [category, setCategory] = useState('');
  const [sort, setSort] = useState('newest');
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    client.get('/products', { params: { category: category || undefined, sort } })
      .then(({ data }) => setProducts(data.products || []))
      .finally(() => setLoading(false));
  }, [category, sort]);

  return (
    <div>
      <div className="field-row" style={{ marginBottom: 20 }}>
        <div className="field-group">
          <label>Category</label>
          <select value={category} onChange={(e) => setCategory(e.target.value)}>
            <option value="">All categories</option>
            {CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
          </select>
        </div>
        <div className="field-group">
          <label>Sort by</label>
          <select value={sort} onChange={(e) => setSort(e.target.value)}>
            <option value="newest">Newest</option>
            <option value="trending">Trending</option>
            <option value="popular">Most popular</option>
            <option value="high_demand">High demand</option>
            <option value="price_low">Price: low to high</option>
            <option value="price_high">Price: high to low</option>
          </select>
        </div>
      </div>
      {loading ? <div className="empty-state">Loading products…</div> : <ProductGrid products={products} />}
    </div>
  );
}

function ShopsTab() {
  const [shops, setShops] = useState([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => { client.get('/shops').then(({ data }) => setShops(data.shops || [])).finally(() => setLoading(false)); }, []);
  if (loading) return <div className="empty-state">Loading shops…</div>;
  if (shops.length === 0) return <div className="empty-state">No shops yet.</div>;
  return (
    <div className="product-grid">
      {shops.map((s) => (
        <Link to={`/s/${s.slug}`} key={s.id} className="product-card" style={{ padding: 16, textAlign: 'center', alignItems: 'center', display: 'flex', flexDirection: 'column' }}>
          {s.logo_url ? <img src={s.logo_url} alt={s.name} style={{ width: 56, height: 56, borderRadius: 12, marginBottom: 8 }} /> : null}
          <strong>{s.name}</strong>
          <span className="product-card-meta">{s.primary_category?.replace('_', ' ')}</span>
        </Link>
      ))}
    </div>
  );
}

function AgricultureTab() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => { client.get('/products/agriculture').then(({ data }) => setProducts(data.products || [])).finally(() => setLoading(false)); }, []);
  if (loading) return <div className="empty-state">Loading agricultural products…</div>;
  return (
    <div>
      <p style={{ color: '#5B6760', marginBottom: 16 }}>
        Agriculture is the backbone of our economy — fresh produce and farm goods straight from sellers.
      </p>
      <ProductGrid products={products} />
    </div>
  );
}

const TABS = [
  { key: 'all', label: 'All Products' },
  { key: 'shops', label: 'Shops' },
  { key: 'agriculture', label: 'Agriculture' }
];

export default function Marketplace() {
  return (
    <div>
      <MarketplaceHeader />
      <div className="dash-body">
        <h2>Main Marketplace</h2>
        <TabBar tabs={TABS} initial="all">
          {(active) => (
            <>
              {active === 'all' && <AllProductsTab />}
              {active === 'shops' && <ShopsTab />}
              {active === 'agriculture' && <AgricultureTab />}
            </>
          )}
        </TabBar>
      </div>
    </div>
  );
}
