import { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, Linking } from 'react-native';
import { ScreenContainer, FormField, PrimaryButton, SecondaryButton, Alert, EmptyState } from '../../components/UI';
import client from '../../api/client';
import { colors } from '../../theme';

const METHODS = [
  { value: 'stripe', label: 'Card (Stripe)', icon: '💳' },
  { value: 'flutterwave', label: 'Mobile Money (Flutterwave)', icon: '📱' },
  { value: 'dpo', label: 'DPO Pay', icon: '🏦' },
  { value: 'coinbase', label: 'Crypto (Coinbase)', icon: '🪙' }
];

export default function CheckoutScreen({ route, navigation }) {
  const { productId, qty } = route.params;
  const [product, setProduct] = useState(null);
  const [method, setMethod] = useState('stripe');
  const [address, setAddress] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState(null);

  useEffect(() => {
    client.get(`/products/${productId}`).then(({ data }) => setProduct(data.product));
  }, [productId]);

  const placeOrder = async () => {
    setBusy(true); setError('');
    try {
      const { data } = await client.post('/orders', { productId, quantity: qty, shippingAddress: address, method });
      setResult(data);
    } catch (err) {
      setError(err.response?.data?.error || 'Could not place order.');
    } finally {
      setBusy(false);
    }
  };

  const confirmPaid = async () => {
    setBusy(true);
    try {
      await client.post(`/orders/${result.order.id}/confirm-payment`);
      navigation.navigate('MyOrders');
    } finally {
      setBusy(false);
    }
  };

  if (!product) return <ScreenContainer withHeader={false}><EmptyState text="Loading…" /></ScreenContainer>;

  return (
    <ScreenContainer withHeader={false}>
      <Text style={{ fontSize: 20, fontWeight: '800', marginBottom: 12 }}>Checkout</Text>

      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16 }}>
        <Text>{product.title} × {qty}</Text>
        <Text style={{ fontWeight: '800' }}>{product.currency} {(product.price * qty).toLocaleString()}</Text>
      </View>

      <Alert message={error} />

      {!result ? (
        <>
          <FormField label="Shipping address" multiline value={address} onChangeText={setAddress} placeholder="Where should this be delivered?" />

          <Text style={{ fontWeight: '700', fontSize: 13, marginBottom: 8 }}>Payment method</Text>
          {METHODS.map((m) => (
            <TouchableOpacity key={m.value} onPress={() => setMethod(m.value)} style={{
              flexDirection: 'row', alignItems: 'center', gap: 10, padding: 12, borderRadius: 10, marginBottom: 8,
              borderWidth: method === m.value ? 2 : 1, borderColor: method === m.value ? colors.forest : colors.line, backgroundColor: '#fff'
            }}>
              <Text>{m.icon}</Text>
              <Text>{m.label}</Text>
            </TouchableOpacity>
          ))}

          <PrimaryButton title="Place order" onPress={placeOrder} loading={busy} />
          <Text style={{ fontSize: 12, color: '#8A9189', marginTop: 10, textAlign: 'center' }}>
            Your payment is held in escrow until delivery is confirmed by you, the seller, and delivery partner.
          </Text>
        </>
      ) : (
        <>
          <Alert type="success" message={result.message} />
          {result.checkoutUrl ? (
            <PrimaryButton title={`Continue to ${method} →`} onPress={() => Linking.openURL(result.checkoutUrl)} />
          ) : (
            <Text style={{ color: '#5B6760', fontSize: 13 }}>
              Sandbox mode: no live {method} key configured yet. Reference: {result.providerReference}
            </Text>
          )}
          <View style={{ marginTop: 12 }}>
            <SecondaryButton title="I've completed payment — move funds to escrow" onPress={confirmPaid} disabled={busy} />
          </View>
        </>
      )}
    </ScreenContainer>
  );
}
