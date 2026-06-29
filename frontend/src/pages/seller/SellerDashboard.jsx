import { useEffect, useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import client from '../../api/client';
import Logo from '../../components/Logo';
import TabBar from '../../components/TabBar';
import ChatPanel from '../../components/ChatPanel';
import ShopSetupPanel from './ShopSetupPanel';
import MyProductsPanel from './MyProductsPanel';
import AddProductPanel from './AddProductPanel';
import TemplatesPanel from './TemplatesPanel';
import NotificationsPanel from './NotificationsPanel';
import OrdersPanel from './OrdersPanel';
import WalletPanel from './WalletPanel';

const TABS = [
  { key: 'shop', label: 'My Shop' },
  { key: 'products', label: 'My Products' },
  { key: 'add', label: 'Add Product' },
  { key: 'templates', label: 'Templates' },
  { key: 'orders', label: 'Orders' },
  { key: 'wallet', label: 'Wallet' },
  { key: 'notifications', label: 'Notifications' },
  { key: 'chat', label: 'Chat with Admin' }
];

export default function SellerDashboard() {
  const [user, setUser] = useState(null);
  const [unread, setUnread] = useState(0);
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    client.get('/auth/me').then(({ data }) => setUser(data.user)).finally(() => setChecked(true));
    client.get('/notifications/mine').then(({ data }) => {
      setUnread((data.notifications || []).filter((n) => !n.is_read).length);
    });
  }, []);

  if (checked && user && user.primary_role !== 'seller') {
    return <Navigate to="/seller/upgrade" replace />;
  }

  return (
    <div>
      <header className="dash-header">
        <Logo size={32} />
        <div className="dash-header-right">
          <Link to="/marketplace" className="btn-link">Main Marketplace →</Link>
          <span className="icon-btn">
            🔔{unread > 0 && <span className="badge-dot" />}
          </span>
        </div>
      </header>

      <div className="dash-body">
        <h2 style={{ marginBottom: 4 }}>Seller Dashboard</h2>
        <p style={{ color: '#5B6760', marginBottom: 8 }}>Manage your shop, listings and orders.</p>

        <TabBar tabs={TABS} initial="shop">
          {(active) => (
            <>
              {active === 'shop' && <ShopSetupPanel />}
              {active === 'products' && <MyProductsPanel />}
              {active === 'add' && <AddProductPanel />}
              {active === 'templates' && <TemplatesPanel />}
              {active === 'orders' && <OrdersPanel />}
              {active === 'wallet' && <WalletPanel />}
              {active === 'notifications' && <NotificationsPanel />}
              {active === 'chat' && <ChatPanel />}
            </>
          )}
        </TabBar>
      </div>
    </div>
  );
}
