import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import client from '../api/client';
import Logo from '../components/Logo';

export default function GetStarted() {
  const [demoProducts, setDemoProducts] = useState([]);

  useEffect(() => {
    client.get('/products', { params: { sort: 'newest', limit: 8 } }).then(({ data }) => setDemoProducts(data.products || [])).catch(() => {});
  }, []);

  return (
    <div style={{ minHeight: '100vh', background: 'var(--cream)' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '24px 48px' }}>
        <Logo size={36} />
        <div style={{ display: 'flex', gap: 16 }}>
          <Link to="/signin" className="btn-link">Sign in</Link>
          <Link to="/signup">
            <button className="btn-primary" style={{ padding: '10px 22px', width: 'auto' }}>Get started</button>
          </Link>
        </div>
      </header>

      <section style={{ textAlign: 'center', padding: '80px 24px 40px' }}>
        <div className="eyebrow" style={{ display: 'flex', justifyContent: 'center' }}>From farm to feed</div>
        <h1 className="display" style={{ fontSize: '3rem', fontWeight: 800, maxWidth: 760, margin: '0 auto' }}>
          One marketplace for everyone who sells.
        </h1>
        <p style={{ maxWidth: 560, margin: '20px auto 32px', color: '#5B6760', fontSize: '1.1rem' }}>
          Open a shop, list your products, and get paid safely — with escrow protection
          on every order. Built around agriculture, the backbone of our economy.
        </p>
        <Link to="/signup">
          <button className="btn-primary" style={{ width: 'auto', padding: '14px 32px' }}>Start selling or buying today</button>
        </Link>
        <div className="weave-divider" style={{ maxWidth: 240, margin: '48px auto 0' }} />
      </section>

      {/* "3D character" hero ad — animated CSS-driven mascot, no external assets required */}
      <section style={{
        margin: '0 32px 56px', borderRadius: 20, overflow: 'hidden',
        background: 'linear-gradient(135deg, var(--forest), var(--forest-dark))',
        color: 'var(--cream)', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '40px 48px', flexWrap: 'wrap', gap: 24
      }}>
        <div style={{ maxWidth: 420 }}>
          <h2 style={{ fontSize: '1.6rem' }}>Meet Joseph & Colline — your AI shop assistants</h2>
          <p style={{ color: 'var(--cream-dim)', marginTop: 8 }}>
            Nsubuga Joseph polishes every listing. Colline builds templates and finds product images.
            Sign up free and let them help you launch your shop in minutes.
          </p>
        </div>
        <div style={{ display: 'flex', gap: 18 }}>
          <MascotBlob emoji="🧑🏾‍🌾" label="Nsubuga Joseph" delay="0s" />
          <MascotBlob emoji="🎨" label="Colline" delay="0.6s" />
        </div>
      </section>

      <section style={{ padding: '0 48px 80px' }}>
        <h3 style={{ textAlign: 'center', marginBottom: 24 }}>Featured on JEDIDA Marketplace</h3>
        {demoProducts.length === 0 ? (
          <p style={{ textAlign: 'center', color: '#8A9189' }}>Featured products will appear here as sellers list them.</p>
        ) : (
          <div className="product-grid">
            {demoProducts.map((p) => (
              <div className="product-card" key={p.id}>
                <div className="product-card-image">{p.images?.[0] ? <img src={p.images[0]} alt={p.title} /> : 'No image'}</div>
                <div className="product-card-body">
                  <div className="product-card-title">{p.title}</div>
                  <div className="product-card-price">{p.currency} {Number(p.price).toLocaleString()}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <style>{`
        @keyframes float { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-14px); } }
      `}</style>
    </div>
  );
}

function MascotBlob({ emoji, label, delay }) {
  return (
    <div style={{ textAlign: 'center' }}>
      <div style={{
        width: 88, height: 88, borderRadius: '50%', background: 'var(--amber)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2.4rem',
        animation: `float 3s ease-in-out infinite`, animationDelay: delay,
        boxShadow: '0 12px 24px rgba(0,0,0,0.25)'
      }}>
        {emoji}
      </div>
      <div style={{ marginTop: 8, fontSize: '0.85rem', color: 'var(--cream-dim)' }}>{label}</div>
    </div>
  );
}
