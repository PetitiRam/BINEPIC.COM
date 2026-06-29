import { View, Text } from 'react-native';
import { colors } from '../theme';

const STATUS_LABELS = {
  pending: 'Pending', confirmed: 'Confirmed', processing: 'Processing', packed: 'Packed',
  assigned_to_driver: 'Assigned to Driver', out_for_delivery: 'Out for Delivery',
  delivered: 'Delivered', failed_delivery: 'Failed Delivery', returned: 'Returned'
};

export default function TrackingTimeline({ events = [] }) {
  if (events.length === 0) {
    return <Text style={{ textAlign: 'center', color: '#8A9189', padding: 24 }}>No tracking events yet.</Text>;
  }

  return (
    <View>
      {events.map((e, i) => {
        const isLast = i === events.length - 1;
        const isFailed = e.status === 'failed_delivery';
        return (
          <View key={e.id} style={{ flexDirection: 'row', marginBottom: 18 }}>
            <View style={{ width: 14, height: 14, borderRadius: 7, marginTop: 3, marginRight: 12,
              backgroundColor: isFailed ? colors.terracotta : isLast ? colors.forest : colors.amber }} />
            <View style={{ flex: 1 }}>
              <Text style={{ fontWeight: '700' }}>{STATUS_LABELS[e.status] || e.status}{e.location ? ` · ${e.location}` : ''}</Text>
              {e.note && <Text style={{ color: '#5B6760', fontSize: 13, marginTop: 2 }}>{e.note}</Text>}
              <Text style={{ color: '#8A9189', fontSize: 11, marginTop: 2 }}>{new Date(e.created_at).toLocaleString()}</Text>
            </View>
          </View>
        );
      })}
    </View>
  );
}

export { STATUS_LABELS };
