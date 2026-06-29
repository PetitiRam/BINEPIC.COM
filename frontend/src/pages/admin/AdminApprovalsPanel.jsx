import { useEffect, useState } from 'react';
import client from '../../api/client';

function Section({ title, items, renderItem, emptyText }) {
  if (items === null) return <div className="empty-state">Loading…</div>;
  return (
    <div style={{ marginBottom: 28 }}>
      <h4>{title}</h4>
      {items.length === 0 ? <div className="empty-state">{emptyText}</div> : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>{items.map(renderItem)}</div>
      )}
    </div>
  );
}

export default function AdminApprovalsPanel() {
  const [kyc, setKyc] = useState(null);
  const [shops, setShops] = useState(null);
  const [products, setProducts] = useState(null);
  const [upgrades, setUpgrades] = useState(null);

  const load = async () => {
    client.get('/admin/kyc').then(({ data }) => setKyc(data.submissions));
    client.get('/admin/shops/pending').then(({ data }) => setShops(data.shops));
    client.get('/admin/products/pending').then(({ data }) => setProducts(data.products));
    client.get('/upgrade/pending').then(({ data }) => setUpgrades(data.upgrades));
  };
  useEffect(() => { load(); }, []);

  const reviewKyc = async (id, decision) => { await client.post(`/admin/kyc/${id}/review`, { decision }); load(); };
  const reviewShop = async (id, decision) => { await client.post(`/admin/shops/${id}/review`, { decision }); load(); };
  const reviewProduct = async (id, decision) => { await client.post(`/admin/products/${id}/review`, { decision }); load(); };
  const reviewUpgrade = async (id, decision) => { await client.post(`/upgrade/${id}/review`, { decision }); load(); };

  return (
    <div>
      <Section title="Pending role upgrade requests" items={upgrades} emptyText="No role upgrades awaiting approval."
        renderItem={(u) => (
          <div className="card-surface" key={u.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
            <div><strong>{u.full_name}</strong><div className="product-card-meta">{u.email} → wants to become {u.requested_role}</div></div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button className="btn-primary" style={{ width: 'auto', padding: '8px 16px' }} onClick={() => reviewUpgrade(u.id, 'approve')}>Approve</button>
              <button className="btn-secondary" onClick={() => reviewUpgrade(u.id, 'reject')}>Reject</button>
            </div>
          </div>
        )} />
      <Section title="Pending shops" items={shops} emptyText="No shops awaiting approval."
        renderItem={(s) => (
          <div className="card-surface" key={s.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
            <div><strong>{s.name}</strong><div className="product-card-meta">{s.primary_category}</div></div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button className="btn-primary" style={{ width: 'auto', padding: '8px 16px' }} onClick={() => reviewShop(s.id, 'approve')}>Approve</button>
              <button className="btn-secondary" onClick={() => reviewShop(s.id, 'reject')}>Reject</button>
            </div>
          </div>
        )} />

      <Section title="Pending product listings" items={products} emptyText="No listings awaiting approval."
        renderItem={(p) => (
          <div className="card-surface" key={p.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
            <div><strong>{p.title}</strong><div className="product-card-meta">{p.shop_name} · {p.currency} {p.price}</div></div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button className="btn-primary" style={{ width: 'auto', padding: '8px 16px' }} onClick={() => reviewProduct(p.id, 'approve')}>Approve</button>
              <button className="btn-secondary" onClick={() => reviewProduct(p.id, 'reject')}>Reject</button>
            </div>
          </div>
        )} />

      <Section title="Pending KYC submissions" items={kyc} emptyText="No KYC submissions awaiting review."
        renderItem={(k) => (
          <div className="card-surface" key={k.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
            <div><strong>{k.full_name}</strong><div className="product-card-meta">{k.email}</div></div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button className="btn-primary" style={{ width: 'auto', padding: '8px 16px' }} onClick={() => reviewKyc(k.id, 'approve')}>Approve</button>
              <button className="btn-secondary" onClick={() => reviewKyc(k.id, 'reject')}>Reject</button>
            </div>
          </div>
        )} />
    </div>
  );
}
