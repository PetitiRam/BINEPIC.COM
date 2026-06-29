import { useEffect, useState } from 'react';
import { View, Text, Image, ScrollView } from 'react-native';
import { ScreenContainer, EmptyState, PrimaryButton, FormField } from '../../components/UI';
import client from '../../api/client';
import { colors } from '../../theme';

export default function ProductDetailScreen({ route, navigation }) {
  const { id } = route.params;
  const [product, setProduct] = useState(null);
  const [qty, setQty] = useState('1');

  useEffect(() => {
    client.get(`/products/${id}`).then(({ data }) => setProduct(data.product));
  }, [id]);

  if (!product) return <ScreenContainer withHeader={false}><EmptyState text="Loading…" /></ScreenContainer>;

  return (
    <ScreenContainer withHeader={false}>
      <View style={{ width: '100%', aspectRatio: 1, backgroundColor: colors.creamDim, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
        {product.images?.[0] ? (
          <Image source={{ uri: product.images[0] }} style={{ width: '100%', height: '100%', borderRadius: 12 }} />
        ) : <Text style={{ color: '#B8AE93' }}>No image</Text>}
      </View>

      <Text style={{ fontSize: 20, fontWeight: '800' }}>{product.title}</Text>
      <Text style={{ color: '#5B6760', marginTop: 6 }}>{product.description}</Text>
      <Text style={{ fontSize: 22, fontWeight: '800', color: colors.forest, marginTop: 12 }}>
        {product.currency} {Number(product.price).toLocaleString()}
      </Text>
      <Text style={{ color: '#8A9189', marginTop: 4 }}>Sold by {product.shop_name} · {product.quantity_available} available</Text>

      <View style={{ marginTop: 16, maxWidth: 140 }}>
        <FormField label="Quantity" keyboardType="number-pad" value={qty} onChangeText={setQty} />
      </View>

      <PrimaryButton title="Buy now" onPress={() => navigation.navigate('Checkout', { productId: product.id, qty: Number(qty) || 1 })} />
    </ScreenContainer>
  );
}
