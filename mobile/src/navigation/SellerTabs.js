import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import ShopSetupScreen from '../screens/seller/ShopSetupScreen';
import MyProductsScreen from '../screens/seller/MyProductsScreen';
import AddProductScreen from '../screens/seller/AddProductScreen';
import SellerOrdersScreen from '../screens/seller/SellerOrdersScreen';
import WalletScreen from '../screens/seller/WalletScreen';
import AccountScreen from '../screens/AccountScreen';
import { colors } from '../theme';

const Tab = createBottomTabNavigator();

const ICONS = { Shop: 'storefront', Products: 'pricetags', Add: 'add-circle', Orders: 'receipt', Wallet: 'wallet', Account: 'person-circle' };

export default function SellerTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: colors.forest,
        tabBarIcon: ({ color, size }) => <Ionicons name={ICONS[route.name]} size={size} color={color} />
      })}
    >
      <Tab.Screen name="Shop" component={ShopSetupScreen} />
      <Tab.Screen name="Products" component={MyProductsScreen} />
      <Tab.Screen name="Add" component={AddProductScreen} />
      <Tab.Screen name="Orders" component={SellerOrdersScreen} />
      <Tab.Screen name="Wallet" component={WalletScreen} />
      <Tab.Screen name="Account" component={AccountScreen} />
    </Tab.Navigator>
  );
}
