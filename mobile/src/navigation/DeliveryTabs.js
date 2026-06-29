import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import DriverDashboardScreen from '../screens/delivery/DriverDashboardScreen';
import DeliveryChatScreen from '../screens/delivery/DeliveryChatScreen';
import AccountScreen from '../screens/AccountScreen';
import { colors } from '../theme';

const Tab = createBottomTabNavigator();

const ICONS = { Deliveries: 'bicycle', Chat: 'chatbubbles', Account: 'person-circle' };

export default function DeliveryTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: colors.forest,
        tabBarIcon: ({ color, size }) => <Ionicons name={ICONS[route.name]} size={size} color={color} />
      })}
    >
      <Tab.Screen name="Deliveries" component={DriverDashboardScreen} />
      <Tab.Screen name="Chat" component={DeliveryChatScreen} />
      <Tab.Screen name="Account" component={AccountScreen} />
    </Tab.Navigator>
  );
}
