import { useEffect, useState } from 'react';
import { View, Text } from 'react-native';
import { ScreenContainer, EmptyState } from '../../components/UI';
import client from '../../api/client';
import { colors } from '../../theme';

export default function WalletScreen() {
  const [wallet, setWallet] = useState(null);
  useEffect(() => { client.get('/wallets/mine').then(({ data }) => setWallet(data.wallet)); }, []);

  if (!wallet) return <ScreenContainer><EmptyState text="Loading wallet…" /></ScreenContainer>;

  return (
    <ScreenContainer>
      <View style={{ backgroundColor: '#fff', borderRadius: 14, borderWidth: 1, borderColor: colors.line, padding: 40, alignItems: 'center', marginTop: 20 }}>
        <Text style={{ color: '#5B6760' }}>Available balance</Text>
        <Text style={{ fontSize: 32, fontWeight: '800', color: colors.forest, marginTop: 6 }}>
          {wallet.currency} {Number(wallet.balance).toLocaleString()}
        </Text>
        <Text style={{ fontSize: 12, color: '#8A9189', marginTop: 10, textAlign: 'center' }}>
          Funds appear here once the admin releases escrow after delivery is confirmed by all parties.
        </Text>
      </View>
    </ScreenContainer>
  );
}
