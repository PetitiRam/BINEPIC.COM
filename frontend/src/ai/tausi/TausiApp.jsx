import TabBar from '../../components/TabBar';
import TausiDashboard from './TausiDashboard';
import ProductIntelligence from './ProductIntelligence';
import AdvertisementManager from './AdvertisementManager';
import MarketplaceAnalytics from './MarketplaceAnalytics';

const TABS = [
  { key: 'dashboard', label: 'Dashboard' },
  { key: 'products', label: 'Product Intelligence' },
  { key: 'ads', label: 'Advertisement Manager' },
  { key: 'analytics', label: 'Marketplace Analytics' }
];

export default function TausiApp() {
  return (
    <TabBar tabs={TABS} initial="dashboard">
      {(active) => (
        <>
          {active === 'dashboard' && <TausiDashboard />}
          {active === 'products' && <ProductIntelligence />}
          {active === 'ads' && <AdvertisementManager />}
          {active === 'analytics' && <MarketplaceAnalytics />}
        </>
      )}
    </TabBar>
  );
}
