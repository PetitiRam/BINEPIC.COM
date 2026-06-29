import { useState } from 'react';
import { View, Text } from 'react-native';
import { ScreenContainer, FormField, PrimaryButton, Alert } from '../../components/UI';
import client from '../../api/client';

const emptyForm = {
  title: '', description: '', price: '', quantityAvailable: '1', images: '', locationCity: '', locationCountry: ''
};

export default function AddProductScreen() {
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState('');
  const [result, setResult] = useState(null);
  const [busy, setBusy] = useState(false);

  const update = (key) => (val) => setForm({ ...form, [key]: val });

  const handleSubmit = async () => {
    setError(''); setResult(null); setBusy(true);
    try {
      const payload = {
        ...form,
        price: Number(form.price),
        quantityAvailable: Number(form.quantityAvailable),
        images: form.images.split(',').map((s) => s.trim()).filter(Boolean),
        category: 'other', condition: 'new', currency: 'USD'
      };
      const { data } = await client.post('/products', payload);
      setResult(data);
      setForm(emptyForm);
    } catch (err) {
      setError(err.response?.data?.error || 'Could not create your listing.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <ScreenContainer>
      <Text style={{ fontSize: 20, fontWeight: '800', marginBottom: 4 }}>List a new product</Text>
      <Text style={{ color: '#5B6760', marginBottom: 16 }}>
        Nsubuga Joseph polishes every listing before it goes live. For category/condition/template options, use the web Seller Dashboard's Add Product page.
      </Text>

      <Alert message={error} />
      {result && (
        <Alert type="success" message={`${result.message}${result.product?.ai_polish_notes ? ` — ${result.product.ai_polish_notes}` : ''}`} />
      )}

      <FormField label="Title" value={form.title} onChangeText={update('title')} placeholder="e.g. Fresh Organic Matooke — 1 Bunch" />
      <FormField label="Description" multiline value={form.description} onChangeText={update('description')} placeholder="Leave blank and Nsubuga Joseph will draft one" />

      <View style={{ flexDirection: 'row', gap: 10 }}>
        <View style={{ flex: 1 }}><FormField label="Price (USD)" keyboardType="decimal-pad" value={form.price} onChangeText={update('price')} /></View>
        <View style={{ flex: 1 }}><FormField label="Quantity" keyboardType="number-pad" value={form.quantityAvailable} onChangeText={update('quantityAvailable')} /></View>
      </View>

      <FormField label="Image URLs (comma-separated)" value={form.images} onChangeText={update('images')} placeholder="https://...jpg, https://...jpg" />

      <View style={{ flexDirection: 'row', gap: 10 }}>
        <View style={{ flex: 1 }}><FormField label="City" value={form.locationCity} onChangeText={update('locationCity')} /></View>
        <View style={{ flex: 1 }}><FormField label="Country" value={form.locationCountry} onChangeText={update('locationCountry')} /></View>
      </View>

      <PrimaryButton title="List product" onPress={handleSubmit} loading={busy} />
    </ScreenContainer>
  );
}
