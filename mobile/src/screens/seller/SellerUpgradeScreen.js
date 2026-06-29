import { useEffect, useState } from 'react';
import { Text } from 'react-native';
import { ScreenContainer, PrimaryButton, Alert, EmptyState } from '../../components/UI';
import client from '../../api/client';
import { useAuth } from '../../context/AuthContext';

export default function SellerUpgradeScreen() {
  const { refreshUser } = useAuth();
  const [upgrades, setUpgrades] = useState(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const load = async () => {
    try {
      const { data } = await client.get('/upgrade/status');
      setUpgrades(data.upgrades || []);
    } catch (err) {
      setError(err.response?.data?.error || 'Could not load upgrade status.');
    }
  };
  useEffect(() => { load(); }, []);

  const latest = (upgrades || []).find((u) => u.requested_role === 'seller');

  const requestUpgrade = async () => {
    setBusy(true); setError('');
    try { await client.post('/upgrade/request', { requestedRole: 'seller' }); await load(); }
    catch (err) { setError(err.response?.data?.error || 'Could not start request.'); }
    finally { setBusy(false); }
  };

  const payFee = async () => {
    setBusy(true); setError('');
    try {
      await client.post('/upgrade/pay-fee', { upgradeId: latest.id, paymentReference: `MOBILE-MOCK-${Date.now()}` });
      await load(); await refreshUser();
    } catch (err) { setError(err.response?.data?.error || 'Could not record payment.'); }
    finally { setBusy(false); }
  };

  if (upgrades === null) return <ScreenContainer withHeader={false}><EmptyState text="Loading…" /></ScreenContainer>;

  return (
    <ScreenContainer withHeader={false}>
      <Text style={{ fontSize: 22, fontWeight: '800', marginBottom: 8 }}>Become a seller</Text>
      <Text style={{ color: '#5B6760', marginBottom: 16 }}>
        A one-time 1,000 mobile money verification fee applies, then your request goes to the admin for approval.
      </Text>

      <Alert message={error} />

      {!latest && <PrimaryButton title="Request to become a seller" onPress={requestUpgrade} loading={busy} />}
      {latest?.status === 'pending_payment' && (
        <PrimaryButton title={`Pay ${latest.verification_fee_amount} verification fee`} onPress={payFee} loading={busy} />
      )}
      {latest?.status === 'pending_approval' && <Alert type="success" message="Payment received. Awaiting admin approval." />}
      {latest?.status === 'approved' && <Alert type="success" message="You're approved! Open the Seller tab to set up your shop." />}
      {latest?.status === 'rejected' && <Alert message="Your request was declined. Contact support for details." />}
    </ScreenContainer>
  );
}
