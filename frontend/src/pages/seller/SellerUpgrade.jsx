import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import client from '../../api/client';
import Logo from '../../components/Logo';

export default function SellerUpgrade() {
  const navigate = useNavigate();
  const [upgrades, setUpgrades] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const { data } = await client.get('/upgrade/status');
      setUpgrades(data.upgrades || []);
    } catch (err) {
      setError(err.response?.data?.error || 'Could not load your upgrade status.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const latest = upgrades.find((u) => u.requested_role === 'seller');

  const requestUpgrade = async () => {
    setBusy(true);
    setError('');
    try {
      await client.post('/upgrade/request', { requestedRole: 'seller' });
      await load();
    } catch (err) {
      setError(err.response?.data?.error || 'Could not start your seller request.');
    } finally {
      setBusy(false);
    }
  };

  const payFee = async () => {
    setBusy(true);
    setError('');
    try {
      // Phase 4 connects this to a real mobile money charge.
      await client.post('/upgrade/pay-fee', { upgradeId: latest.id, paymentReference: `MOCK-${Date.now()}` });
      await load();
    } catch (err) {
      setError(err.response?.data?.error || 'Could not record your payment.');
    } finally {
      setBusy(false);
    }
  };

  if (loading) return <div style={{ padding: 48 }}>Loading…</div>;

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div className="card-surface" style={{ maxWidth: 480, width: '100%' }}>
        <Logo size={32} />
        <h2 style={{ marginTop: 24 }}>Become a seller</h2>
        <p style={{ color: '#5B6760' }}>
          Open your own shop on JEDIDA Marketplace. A one-time 1,000 mobile money
          verification fee applies, then your request goes to the admin for approval.
        </p>

        {error && <div className="alert alert-error">{error}</div>}

        {!latest && (
          <button className="btn-primary" onClick={requestUpgrade} disabled={busy}>
            {busy ? 'Starting…' : 'Request to become a seller'}
          </button>
        )}

        {latest?.status === 'pending_payment' && (
          <>
            <div className="alert alert-success">Request started. Pay the verification fee to continue.</div>
            <button className="btn-primary" onClick={payFee} disabled={busy}>
              {busy ? 'Processing…' : `Pay ${latest.verification_fee_amount} verification fee`}
            </button>
          </>
        )}

        {latest?.status === 'pending_approval' && (
          <div className="alert alert-success">
            Payment received. Your request is awaiting admin approval — you'll get a notification once it's reviewed.
          </div>
        )}

        {latest?.status === 'approved' && (
          <>
            <div className="alert alert-success">You're approved! Set up your shop now.</div>
            <button className="btn-primary" onClick={() => navigate('/seller')}>Go to seller dashboard</button>
          </>
        )}

        {latest?.status === 'rejected' && (
          <div className="alert alert-error">Your request was declined. Contact support for details.</div>
        )}
      </div>
    </div>
  );
}
