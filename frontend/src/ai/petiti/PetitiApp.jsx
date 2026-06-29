import TabBar from '../../components/TabBar';
import PetitiDashboard from './PetitiDashboard';
import AIActivityLogs from './AIActivityLogs';
import SecurityCenter from './SecurityCenter';
import MarketplaceIntelligence from './MarketplaceIntelligence';
import AIRecommendations from './AIRecommendations';
import SiteEditor from './SiteEditor';

const TABS = [
  { key: 'dashboard', label: 'Dashboard' },
  { key: 'logs', label: 'AI Activity Logs' },
  { key: 'security', label: 'Security Center' },
  { key: 'intelligence', label: 'Marketplace Intelligence' },
  { key: 'recommendations', label: 'AI Recommendations' },
  { key: 'site', label: 'Site Editor' }
];

export default function PetitiApp() {
  return (
    <TabBar tabs={TABS} initial="dashboard">
      {(active) => (
        <>
          {active === 'dashboard' && <PetitiDashboard />}
          {active === 'logs' && <AIActivityLogs />}
          {active === 'security' && <SecurityCenter />}
          {active === 'intelligence' && <MarketplaceIntelligence />}
          {active === 'recommendations' && <AIRecommendations />}
          {active === 'site' && <SiteEditor />}
        </>
      )}
    </TabBar>
  );
}
