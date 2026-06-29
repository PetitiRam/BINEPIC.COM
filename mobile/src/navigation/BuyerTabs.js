import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import MarketplaceScreen from '../screens/buyer/MarketplaceScreen';
import MyOrdersScreen from '../screens/buyer/MyOrdersScreen';
import AccountScreen from '../screens/AccountScreen';
import { colors } from '../theme';

const Tab = createBottomTabNavigator();

const ICONS = { Marketplace: 'storefront', Orders: 'receipt', Account: 'person-circle' };

export default function BuyerTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: colors.forest,
        tabBarIcon: ({ color, size }) => <Ionicons name={ICONS[route.name]} size={size} color={color} />
      })}
    >
      <Tab.Screen name="Marketplace" component={MarketplaceScreen} />
      <Tab.Screen name="Orders" component={MyOrdersScreen} />
      <Tab.Screen name="Account" component={AccountScreen} />
    </Tab.Navigator>
  );
}
