import { useEffect, useState } from 'react';
import { View, Text, FlatList } from 'react-native';
import { ScreenContainer, EmptyState } from '../../components/UI';
import ProductCard from '../../components/ProductCard';
import client from '../../api/client';
import { colors } from '../../theme';

export default function ShopScreen({ route, navigation }) {
  const { slug } = route.params;
  const [shop, setShop] = useState(null);
  const [products, setProducts] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    client.get(`/shops/public/${slug}`)
      .then(({ data }) => { setShop(data.shop); setProducts(data.products); })
      .catch((err) => setError(err.response?.data?.error || 'Shop not found.'));
  }, [slug]);

  if (error) return <ScreenContainer><EmptyState text={error} /></ScreenContainer>;
  if (!shop) return <ScreenContainer><EmptyState text="Loading…" /></ScreenContainer>;

  return (
    <ScreenContainer scroll={false}>
      <View style={{ backgroundColor: colors.forest, padding: 24, alignItems: 'center' }}>
        <Text style={{ color: colors.cream, fontSize: 22, fontWeight: '800' }}>{shop.name}</Text>
        {shop.description && <Text style={{ color: colors.creamDim, marginTop: 6, textAlign: 'center' }}>{shop.description}</Text>}
      </View>
      <FlatList
        data={products}
        numColumns={2}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: 10 }}
        ListEmptyComponent={<EmptyState text="This shop hasn't listed any products yet." />}
        renderItem={({ item }) => (
          <ProductCard product={item} onPress={() => navigation.navigate('ProductDetail', { id: item.id })} />
        )}
      />
    </ScreenContainer>
  );
}
