import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import client from '../api/client';
import Logo from './Logo';

export default function MarketplaceHeader() {
  const [ads, setAds] = useState([]);
  const [adIndex, setAdIndex] = useState(0);
  const [user, setUser] = useState(null);
  const [logoOverride, setLogoOverride] = useState(null);

  useEffect(() => {
    client.get('/ads').then(({ data }) => setAds(data.ads || [])).catch(() => {});
    client.get('/auth/me').then(({ data }) => setUser(data.user)).catch(() => {});
    client.get('/site/theme').then(({ data }) => setLogoOverride(data?.theme?.logo_url || null)).catch(() => {});
  }, []);

  useEffect(() => {
    if (ads.length < 2) return;
    const t = setInterval(() => setAdIndex((i) => (i + 1) % ads.length), 5000);
    return () => clearInterval(t);
  }, [ads]);

  const ad = ads[adIndex];

  const roleLink = () => {
    if (!user) return null;
    if (user.is_admin) return <Link to="/admin" className="btn-link">Admin Panel</Link>;
    if (user.primary_role === 'seller') return <Link to="/seller" className="btn-link">Seller Dashboard</Link>;
    if (user.primary_role === 'delivery') return (
      <>
        <Link to="/driver" className="btn-link">Driver Dashboard</Link>
        <Link to="/delivery" className="btn-link">Chat</Link>
      </>
    );
    return <Link to="/seller/upgrade" className="btn-link">Become a seller</Link>;
  };

  return (
    <>
      {ad && (
        <a href={ad.link_url || '#'} target="_blank" rel="noreferrer" style={{
          display: 'block', background: 'var(--amber)', color: '#16201B', textAlign: 'center',
          padding: '8px 16px', fontSize: '0.85rem', fontWeight: 600
        }}>
          {ad.title}
        </a>
      )}
      <header className="dash-header">
        <Logo size={32} overrideUrl={logoOverride} />
        <div className="dash-header-right">
          <Link to="/marketplace" className="btn-link">Marketplace</Link>
          <Link to="/orders" className="btn-link">My Orders</Link>
          {roleLink()}
          <span className="icon-btn">🔔</span>
        </div>
      </header>
    </>
  );
}
