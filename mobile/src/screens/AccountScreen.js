import { Text } from 'react-native';
import { ScreenContainer, SecondaryButton } from '../components/UI';
import { useAuth } from '../context/AuthContext';

export default function AccountScreen({ navigation }) {
  const { user, signOut } = useAuth();

  return (
    <ScreenContainer>
      <Text style={{ fontSize: 20, fontWeight: '800' }}>{user?.full_name}</Text>
      <Text style={{ color: '#5B6760', marginBottom: 20 }}>{user?.email} · {user?.primary_role}</Text>

      {user?.primary_role === 'buyer' && (
        <>
          <SecondaryButton title="Become a seller" onPress={() => navigation.navigate('SellerUpgrade')} />
          <Text style={{ height: 10 }} />
          <SecondaryButton title="Become a delivery partner" onPress={() => navigation.navigate('DeliveryUpgrade')} />
          <Text style={{ height: 20 }} />
        </>
      )}

      <SecondaryButton title="Sign out" onPress={signOut} />
    </ScreenContainer>
  );
}
