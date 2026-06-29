import { useCallback, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { ScreenContainer, EmptyState, SecondaryButton } from '../../components/UI';
import StatusChip from '../../components/StatusChip';
import client from '../../api/client';
import { colors } from '../../theme';

export default function MyOrdersScreen({ navigation }) {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const { data } = await client.get('/orders/mine/buyer');
    setOrders(data.orders || []);
    setLoading(false);
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const confirmDelivery = async (id) => {
    await client.post(`/orders/${id}/confirm-delivery`);
    load();
  };

  return (
    <ScreenContainer scroll={false}>
      <Text style={{ fontSize: 20, fontWeight: '800', padding: 16, paddingBottom: 0 }}>My Orders</Text>
      <FlatList
        data={orders}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: 16 }}
        refreshing={loading}
        onRefresh={load}
        ListEmptyComponent={!loading && <EmptyState text="You haven't placed any orders yet." />}
        renderItem={({ item }) => (
          <View style={{ backgroundColor: '#fff', borderWidth: 1, borderColor: colors.line, borderRadius: 12, padding: 14, marginBottom: 10 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <Text style={{ fontWeight: '700' }}>Order {item.id.slice(0, 8)}</Text>
              <StatusChip status={item.status} />
            </View>
            <Text style={{ color: '#8A9189', fontSize: 12, marginTop: 4 }}>
              {item.currency} {Number(item.total_amount).toLocaleString()} · {new Date(item.created_at).toLocaleDateString()}
            </Text>
            <View style={{ flexDirection: 'row', gap: 10, marginTop: 10 }}>
              <TouchableOpacity onPress={() => navigation.navigate('OrderTracking', { orderId: item.id })}>
                <Text style={{ color: '#C1622D', fontWeight: '700', fontSize: 13 }}>Track order</Text>
              </TouchableOpacity>
            </View>
            {['paid_escrow', 'shipped'].includes(item.status) && !item.buyer_confirmed_delivery && (
              <View style={{ marginTop: 8 }}>
                <SecondaryButton title="Confirm delivery received" onPress={() => confirmDelivery(item.id)} />
              </View>
            )}
            {item.buyer_confirmed_delivery && <Text style={{ fontSize: 12, color: '#8A9189', marginTop: 6 }}>✔ You confirmed delivery</Text>}
          </View>
        )}
      />
    </ScreenContainer>
  );
}
