import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { ActivityIndicator, View } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { colors } from '../theme';

import AuthNavigator from './AuthNavigator';
import BuyerTabs from './BuyerTabs';
import SellerTabs from './SellerTabs';
import DeliveryTabs from './DeliveryTabs';

import ProductDetailScreen from '../screens/buyer/ProductDetailScreen';
import CheckoutScreen from '../screens/buyer/CheckoutScreen';
import ShopScreen from '../screens/buyer/ShopScreen';
import OrderTrackingScreen from '../screens/buyer/OrderTrackingScreen';
import SellerUpgradeScreen from '../screens/seller/SellerUpgradeScreen';
import DeliveryUpgradeScreen from '../screens/delivery/DeliveryUpgradeScreen';

const Stack = createNativeStackNavigator();

function RoleTabs() {
  const { user } = useAuth();
  if (user?.primary_role === 'seller') return <SellerTabs />;
  if (user?.primary_role === 'delivery') return <DeliveryTabs />;
  return <BuyerTabs />;
}

function MainStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen name="Tabs" component={RoleTabs} options={{ headerShown: false }} />
      <Stack.Screen name="ProductDetail" component={ProductDetailScreen} options={{ title: 'Product' }} />
      <Stack.Screen name="Checkout" component={CheckoutScreen} options={{ title: 'Checkout' }} />
      <Stack.Screen name="Shop" component={ShopScreen} options={{ title: 'Shop', headerShown: false }} />
      <Stack.Screen name="OrderTracking" component={OrderTrackingScreen} options={{ title: 'Track Order' }} />
      <Stack.Screen name="SellerUpgrade" component={SellerUpgradeScreen} options={{ title: 'Become a Seller' }} />
      <Stack.Screen name="DeliveryUpgrade" component={DeliveryUpgradeScreen} options={{ title: 'Become a Delivery Partner' }} />
    </Stack.Navigator>
  );
}

export default function RootNavigator() {
  const { user, booting } = useAuth();

  if (booting) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.cream }}>
        <ActivityIndicator size="large" color={colors.forest} />
      </View>
    );
  }

  return (
    <NavigationContainer linking={{ prefixes: ['jedida://', 'https://jedidamarketplace.com'] }}>
      {user && user.phone_verified ? <MainStack /> : <AuthNavigator />}
    </NavigationContainer>
  );
}
