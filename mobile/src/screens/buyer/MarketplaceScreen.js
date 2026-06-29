import { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, ScrollView } from 'react-native';
import { ScreenContainer, EmptyState } from '../../components/UI';
import ProductCard from '../../components/ProductCard';
import client from '../../api/client';
import { colors } from '../../theme';

const SUB_TABS = ['all', 'shops', 'agriculture'];
const SORTS = ['newest', 'trending', 'popular', 'high_demand'];

function Pill({ active, label, onPress }) {
  return (
    <TouchableOpacity onPress={onPress} style={{
      paddingHorizontal: 16, paddingVertical: 8, borderRadius: 999, marginRight: 8,
      backgroundColor: active ? colors.forest : '#fff', borderWidth: 1.5, borderColor: active ? colors.forest : colors.line
    }}>
      <Text style={{ color: active ? colors.cream : colors.ink, fontWeight: '600', fontSize: 13, textTransform: 'capitalize' }}>{label}</Text>
    </TouchableOpacity>
  );
}

export default function MarketplaceScreen({ navigation }) {
  const [tab, setTab] = useState('all');
  const [sort, setSort] = useState('newest');
  const [products, setProducts] = useState([]);
  const [shops, setShops] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    if (tab === 'shops') {
      client.get('/shops').then(({ data }) => setShops(data.shops || [])).finally(() => setLoading(false));
    } else if (tab === 'agriculture') {
      client.get('/products/agriculture').then(({ data }) => setProducts(data.products || [])).finally(() => setLoading(false));
    } else {
      client.get('/products', { params: { sort } }).then(({ data }) => setProducts(data.products || [])).finally(() => setLoading(false));
    }
  }, [tab, sort]);

  return (
    <ScreenContainer scroll={false}>
      <View style={{ padding: 16, paddingBottom: 0 }}>
        <View style={{ flexDirection: 'row', marginBottom: 12 }}>
          {SUB_TABS.map((t) => <Pill key={t} active={tab === t} label={t} onPress={() => setTab(t)} />)}
        </View>
        {tab === 'all' && (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 12 }}>
            {SORTS.map((s) => <Pill key={s} active={sort === s} label={s.replace('_', ' ')} onPress={() => setSort(s)} />)}
          </ScrollView>
        )}
      </View>

      {loading ? <EmptyState text="Loading…" /> : tab === 'shops' ? (
        <FlatList
          data={shops}
          numColumns={2}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ padding: 10 }}
          ListEmptyComponent={<EmptyState text="No shops yet." />}
          renderItem={({ item }) => (
            <TouchableOpacity style={{ flex: 1, margin: 6, padding: 16, backgroundColor: '#fff', borderRadius: 12, borderWidth: 1, borderColor: colors.line, alignItems: 'center' }}
              onPress={() => navigation.navigate('Shop', { slug: item.slug })}>
              <Text style={{ fontWeight: '700', textAlign: 'center' }}>{item.name}</Text>
              <Text style={{ fontSize: 11, color: '#8A9189', marginTop: 4 }}>{item.primary_category?.replace('_', ' ')}</Text>
            </TouchableOpacity>
          )}
        />
      ) : (
        <FlatList
          data={products}
          numColumns={2}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ padding: 10, paddingBottom: 30 }}
          ListEmptyComponent={<EmptyState text="No products found." />}
          renderItem={({ item }) => (
            <ProductCard product={item} onPress={() => navigation.navigate('ProductDetail', { id: item.id })} />
          )}
        />
      )}
    </ScreenContainer>
  );
}
