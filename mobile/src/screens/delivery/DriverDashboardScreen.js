import { useCallback, useState } from 'react';
import { View, Text, FlatList } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { ScreenContainer, FormField, PrimaryButton, SecondaryButton, EmptyState } from '../../components/UI';
import TrackingTimeline, { STATUS_LABELS } from '../../components/TrackingTimeline';
import StatusChip from '../../components/StatusChip';
import client from '../../api/client';
import { colors } from '../../theme';

const NEXT_STATUS = { assigned_to_driver: 'out_for_delivery', out_for_delivery: 'delivered' };

function DeliveryCard({ delivery, onUpdated }) {
  const [timeline, setTimeline] = useState(null);

  const loadTimeline = () => client.get(`/deliveries/${delivery.id}/timeline`).then(({ data }) => setTimeline(data.timeline));

  const advance = async (status) => {
    await client.post(`/deliveries/${delivery.id}/status`, { status, note: `Driver marked as ${STATUS_LABELS[status]}.` });
    onUpdated();
  };

  const fail = async () => {
    await client.post(`/deliveries/${delivery.id}/status`, { status: 'failed_delivery', note: 'Driver reported a failed delivery attempt.' });
    onUpdated();
  };

  const next = NEXT_STATUS[delivery.status];

  return (
    <View style={{ backgroundColor: '#fff', borderWidth: 1, borderColor: colors.line, borderRadius: 12, padding: 14, marginBottom: 12 }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
        <Text style={{ fontWeight: '700' }}>Delivery {delivery.id.slice(0, 8)}</Text>
        <StatusChip status={delivery.status} />
      </View>
      <Text style={{ color: '#8A9189', fontSize: 12, marginTop: 4 }}>{delivery.dropoff_address || 'No dropoff address on file'}</Text>

      <View style={{ flexDirection: 'row', gap: 8, marginTop: 10, flexWrap: 'wrap' }}>
        {next && <SecondaryButton title={`Mark as ${STATUS_LABELS[next]}`} onPress={() => advance(next)} />}
        {delivery.status === 'out_for_delivery' && <SecondaryButton title="Report failed delivery" onPress={fail} />}
      </View>
      <Text onPress={() => (timeline ? setTimeline(null) : loadTimeline())} style={{ color: '#C1622D', marginTop: 10, fontWeight: '600' }}>
        {timeline ? 'Hide timeline' : 'View timeline'}
      </Text>
      {timeline && <View style={{ marginTop: 10 }}><TrackingTimeline events={timeline} /></View>}
    </View>
  );
}

export default function DriverDashboardScreen() {
  const [driver, setDriver] = useState(null);
  const [deliveries, setDeliveries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ vehicleType: '', licensePlate: '' });

  const load = useCallback(async () => {
    setLoading(true);
    const profile = await client.get('/deliveries/drivers/me');
    setDriver(profile.data.driver);
    if (profile.data.driver) {
      const { data } = await client.get('/deliveries/mine/driver');
      setDeliveries(data.deliveries || []);
    }
    setLoading(false);
  }, []);
  useFocusEffect(useCallback(() => { load(); }, [load]));

  const register = async () => {
    await client.post('/deliveries/drivers/register', form);
    load();
  };

  if (loading) return <ScreenContainer><EmptyState text="Loading…" /></ScreenContainer>;

  if (!driver) {
    return (
      <ScreenContainer>
        <Text style={{ fontSize: 20, fontWeight: '800', marginBottom: 12 }}>Register as a driver</Text>
        <FormField label="Vehicle type" value={form.vehicleType} onChangeText={(v) => setForm({ ...form, vehicleType: v })} placeholder="Motorcycle, van, bicycle…" />
        <FormField label="License plate" value={form.licensePlate} onChangeText={(v) => setForm({ ...form, licensePlate: v })} />
        <PrimaryButton title="Register" onPress={register} />
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer scroll={false}>
      <View style={{ padding: 16, paddingBottom: 0 }}>
        <Text style={{ fontSize: 20, fontWeight: '800' }}>Driver Dashboard</Text>
        <Text style={{ color: '#5B6760', marginTop: 4 }}>Vehicle: {driver.vehicle_type || '—'} · Rating: {driver.rating}⭐</Text>
      </View>
      <FlatList
        data={deliveries}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: 16 }}
        refreshing={loading}
        onRefresh={load}
        ListEmptyComponent={<EmptyState text="No deliveries assigned to you yet." />}
        renderItem={({ item }) => <DeliveryCard delivery={item} onUpdated={load} />}
      />
    </ScreenContainer>
  );
}
