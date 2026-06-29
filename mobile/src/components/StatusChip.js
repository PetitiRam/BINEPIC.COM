import { View, Text } from 'react-native';
import { statusColors, colors } from '../theme';

const MAP = {
  active: 'active', completed: 'active', delivered: 'active', approved: 'active',
  pending: 'pending', pending_review: 'pending', pending_payment: 'pending', pending_approval: 'pending',
  rejected: 'rejected', suspended: 'rejected', failed_delivery: 'rejected'
};

export default function StatusChip({ status }) {
  const key = MAP[status] || 'pending';
  const { bg, text } = statusColors[key];
  return (
    <View style={{ backgroundColor: bg, paddingHorizontal: 10, paddingVertical: 3, borderRadius: 999 }}>
      <Text style={{ color: text, fontSize: 12, fontWeight: '700', textTransform: 'capitalize' }}>
        {String(status).replace(/_/g, ' ')}
      </Text>
    </View>
  );
}
