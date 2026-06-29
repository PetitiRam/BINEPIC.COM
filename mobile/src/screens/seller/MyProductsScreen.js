import { useCallback, useState } from 'react';
import { View, Text, FlatList, Image, TouchableOpacity, Alert as RNAlert } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { ScreenContainer, EmptyState } from '../../components/UI';
import StatusChip from '../../components/StatusChip';
import client from '../../api/client';
import { colors } from '../../theme';

export default function MyProductsScreen() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const { data } = await client.get('/products/mine');
    setProducts(data.products || []);
    setLoading(false);
  }, []);
  useFocusEffect(useCallback(() => { load(); }, [load]));

  const remove = (id) => RNAlert.alert('Remove listing?', 'This cannot be undone.', [
    { text: 'Cancel', style: 'cancel' },
    { text: 'Remove', style: 'destructive', onPress: async () => { await client.delete(`/products/${id}`); load(); } }
  ]);

  return (
    <ScreenContainer scroll={false}>
      <Text style={{ fontSize: 20, fontWeight: '800', padding: 16, paddingBottom: 0 }}>My Products</Text>
      <FlatList
        data={products}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: 16 }}
        refreshing={loading}
        onRefresh={load}
        ListEmptyComponent={!loading && <EmptyState text="You haven't listed any products yet." />}
        renderItem={({ item }) => (
          <View style={{ flexDirection: 'row', backgroundColor: '#fff', borderWidth: 1, borderColor: colors.line, borderRadius: 12, padding: 12, marginBottom: 10, gap: 12 }}>
            <View style={{ width: 64, height: 64, borderRadius: 8, backgroundColor: colors.creamDim, alignItems: 'center', justifyContent: 'center' }}>
              {item.images?.[0] ? <Image source={{ uri: item.images[0] }} style={{ width: 64, height: 64, borderRadius: 8 }} /> : <Text style={{ fontSize: 10, color: '#B8AE93' }}>No image</Text>}
            </View>
            <View style={{ flex: 1 }}>
              <StatusChip status={item.status} />
              <Text style={{ fontWeight: '700', marginTop: 4 }} numberOfLines={1}>{item.title}</Text>
              <Text style={{ color: colors.forest, fontWeight: '800' }}>{item.currency} {Number(item.price).toLocaleString()}</Text>
              <Text style={{ fontSize: 11, color: '#8A9189' }}>{item.views_count} views · {item.orders_count} orders</Text>
            </View>
            <TouchableOpacity onPress={() => remove(item.id)}><Text style={{ color: '#C1622D' }}>Remove</Text></TouchableOpacity>
          </View>
        )}
      />
    </ScreenContainer>
  );
}
