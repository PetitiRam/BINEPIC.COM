import { useEffect, useState } from 'react';
import client from '../../api/client';

export default function WalletPanel() {
  const [wallet, setWallet] = useState(null);
  useEffect(() => { client.get('/wallets/mine').then(({ data }) => setWallet(data.wallet)); }, []);
  if (!wallet) return <div className="empty-state">Loading wallet…</div>;
  return (
    <div className="card-surface" style={{ textAlign: 'center', padding: 40 }}>
      <p style={{ color: '#5B6760' }}>Available balance</p>
      <div style={{ fontSize: '2.4rem', fontWeight: 800, color: 'var(--forest)', fontFamily: 'var(--font-display)' }}>
        {wallet.currency} {Number(wallet.balance).toLocaleString()}
      </div>
      <p className="product-card-meta" style={{ marginTop: 8 }}>
        Funds appear here once the admin releases escrow after delivery is confirmed by all parties.
      </p>
    </div>
  );
}
