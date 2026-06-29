import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import client from '../../api/client';
import Logo from '../../components/Logo';
import TabBar from '../../components/TabBar';
import AdminUsersPanel from './AdminUsersPanel';
import AdminApprovalsPanel from './AdminApprovalsPanel';
import AdminOrdersPanel from './AdminOrdersPanel';
import AdminAdsPanel from './AdminAdsPanel';
import AdminSettingsPanel from './AdminSettingsPanel';
import AdminChatPanel from './AdminChatPanel';
import AICommandCenter from './AICommandCenter';

const TABS = [
  { key: 'approvals', label: 'Approvals' },
  { key: 'users', label: 'Users' },
  { key: 'orders', label: 'Orders & Payouts' },
  { key: 'ads', label: 'Ads' },
  { key: 'settings', label: 'Settings' },
  { key: 'chat', label: 'Chat' },
  { key: 'ai', label: '🤖 AI Command Center' }
];

export default function AdminPanel() {
  const [user, setUser] = useState(null);
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    client.get('/auth/me').then(({ data }) => setUser(data.user)).finally(() => setChecked(true));
  }, []);

  if (checked && user && !user.is_admin) return <Navigate to="/marketplace" replace />;

  return (
    <div>
      <header className="dash-header"><Logo size={32} /></header>
      <div className="dash-body">
        <h2>Admin Panel</h2>
        <TabBar tabs={TABS} initial="approvals">
          {(active) => (
            <>
              {active === 'approvals' && <AdminApprovalsPanel />}
              {active === 'users' && <AdminUsersPanel />}
              {active === 'orders' && <AdminOrdersPanel />}
              {active === 'ads' && <AdminAdsPanel />}
              {active === 'settings' && <AdminSettingsPanel />}
              {active === 'chat' && <AdminChatPanel />}
              {active === 'ai' && <AICommandCenter />}
            </>
          )}
        </TabBar>
      </div>
    </div>
  );
}
