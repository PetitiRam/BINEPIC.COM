import { useEffect, useState } from 'react';
import { View, Text, Share, TouchableOpacity } from 'react-native';
import { ScreenContainer, FormField, PrimaryButton, Alert, EmptyState } from '../../components/UI';
import StatusChip from '../../components/StatusChip';
import client from '../../api/client';

export default function ShopSetupScreen() {
  const [shop, setShop] = useState(null);
  const [form, setForm] = useState({ name: '', description: '' });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const { data } = await client.get('/shops/me');
      setShop(data.shop);
      setForm({ name: data.shop.name, description: data.shop.description || '' });
    } catch {
      setShop(null);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => { load(); }, []);

  const createShop = async () => {
    setBusy(true); setError(''); setMessage('');
    try {
      const { data } = await client.post('/shops', { name: form.name, description: form.description, primaryCategory: 'other', currency: 'USD' });
      setShop(data.shop);
      setMessage(data.message);
    } catch (err) {
      setError(err.response?.data?.error || 'Could not create your shop.');
    } finally {
      setBusy(false);
    }
  };

  const shareLink = () => Share.share({ message: `Check out my shop on JEDIDA Marketplace: ${shop.share_link}` });

  if (loading) return <ScreenContainer><EmptyState text="Loading your shop…" /></ScreenContainer>;

  return (
    <ScreenContainer>
      {!shop ? (
        <>
          <Text style={{ fontSize: 20, fontWeight: '800', marginBottom: 8 }}>Open your shop</Text>
          <Alert message={error} />
          <FormField label="Shop name" value={form.name} onChangeText={(v) => setForm({ ...form, name: v })} placeholder="e.g. Kampala Fresh Produce" />
          <FormField label="Description" multiline value={form.description} onChangeText={(v) => setForm({ ...form, description: v })} placeholder="What does your shop sell?" />
          <PrimaryButton title="Create shop" onPress={createShop} loading={busy} />
        </>
      ) : (
        <>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <Text style={{ fontSize: 20, fontWeight: '800' }}>{shop.name}</Text>
            <StatusChip status={shop.status} />
          </View>
          <Alert type="success" message={message} />
          <Text style={{ fontSize: 12, color: '#8A9189' }}>Shop ID: {shop.id}</Text>
          <TouchableOpacity onPress={shareLink} style={{ marginTop: 10 }}>
            <Text style={{ color: '#C1622D', fontWeight: '700' }}>Share my shop link →</Text>
          </TouchableOpacity>
          <Text style={{ fontSize: 12, color: '#8A9189', marginTop: 6 }}>
            Sharing this link shows your shop name, logo and product previews automatically.
          </Text>
        </>
      )}
    </ScreenContainer>
  );
}
