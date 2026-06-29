import { useEffect, useState } from 'react';
import { Text, View } from 'react-native';
import { ScreenContainer, EmptyState } from '../../components/UI';
import TrackingTimeline from '../../components/TrackingTimeline';
import StatusChip from '../../components/StatusChip';
import client from '../../api/client';

export default function OrderTrackingScreen({ route }) {
  const { orderId } = route.params;
  const [delivery, setDelivery] = useState(null);
  const [timeline, setTimeline] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    client.get(`/deliveries/by-order/${orderId}`)
      .then(({ data }) => { setDelivery(data.delivery); setTimeline(data.timeline); })
      .catch((err) => setError(err.response?.data?.error || 'No tracking information available yet.'));
  }, [orderId]);

  if (error) return <ScreenContainer withHeader={false}><EmptyState text={error} /></ScreenContainer>;
  if (!delivery) return <ScreenContainer withHeader={false}><EmptyState text="Loading…" /></ScreenContainer>;

  return (
    <ScreenContainer withHeader={false}>
      <Text style={{ fontSize: 20, fontWeight: '800', marginBottom: 12 }}>Track your order</Text>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16 }}>
        <Text style={{ color: '#5B6760', fontSize: 13 }}>{delivery.dropoff_address}</Text>
        <StatusChip status={delivery.status} />
      </View>
      <TrackingTimeline events={timeline} />
    </ScreenContainer>
  );
}
