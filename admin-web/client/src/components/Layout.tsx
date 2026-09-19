import React, { useState } from 'react';
import type { AppModule } from '../context/AuthContext';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { DashboardView } from './DashboardView';
import { DestinationsManager } from './DestinationsManager';
import { ServicesManager } from './ServicesManager';
import { EventsManager } from './EventsManager';
import { MarketplaceManager } from './MarketplaceManager';
import { InvestmentsManager } from './InvestmentsManager';
import { TeamManager } from './TeamManager';
import { ProfileSecurityModal } from './ProfileSecurityModal';

const VALID_MODULES: AppModule[] = [
  'dashboard',
  'destinations',
  'services',
  'events',
  'marketplace',
  'investments',
  'team',
];

const getInitialTab = (): AppModule => {
  if (typeof window !== 'undefined') {
    const hash = window.location.hash.replace('#', '') as AppModule;
    if (VALID_MODULES.includes(hash)) {
      return hash;
    }
    const saved = localStorage.getItem('daleel_admin_tab') as AppModule;
    if (VALID_MODULES.includes(saved)) {
      return saved;
    }
  }
  return 'dashboard';
};

export const Layout: React.FC = () => {
  const [currentTab, setCurrentTab] = useState<AppModule>(getInitialTab);
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  React.useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.replace('#', '') as AppModule;
      if (VALID_MODULES.includes(hash)) {
        setCurrentTab(hash);
      }
    };
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const handleSelectTab = (tab: AppModule) => {
    setCurrentTab(tab);
    window.location.hash = tab;
    try {
      localStorage.setItem('daleel_admin_tab', tab);
    } catch {
      // ignore local storage errors in sandboxed contexts
    }
  };

  const renderModule = () => {
    switch (currentTab) {
      case 'dashboard':
        return <DashboardView onNavigate={handleSelectTab} />;
      case 'destinations':
        return <DestinationsManager />;
      case 'services':
        return <ServicesManager />;
      case 'events':
        return <EventsManager />;
      case 'marketplace':
        return <MarketplaceManager />;
      case 'investments':
        return <InvestmentsManager />;
      case 'team':
        return <TeamManager />;
      default:
        return <DashboardView onNavigate={handleSelectTab} />;
    }
  };

  return (
    <div style={styles.layoutRoot}>
      <Sidebar
        currentTab={currentTab}
        onSelectTab={handleSelectTab}
        onOpenProfile={() => setIsProfileOpen(true)}
      />

      <div style={styles.mainWrapper}>
        <Header
          currentTab={currentTab}
          onOpenProfile={() => setIsProfileOpen(true)}
        />
        <main style={styles.contentArea}>
          {renderModule()}
        </main>
      </div>

      {/* Global Administrator Profile & Security Modal */}
      <ProfileSecurityModal
        isOpen={isProfileOpen}
        onClose={() => setIsProfileOpen(false)}
      />
    </div>
  );
};

const styles: { [key: string]: React.CSSProperties } = {
  layoutRoot: {
    display: 'flex',
    minHeight: '100vh',
    backgroundColor: '#F7F8FA',
  },
  mainWrapper: {
    flex: 1,
    marginLeft: 'var(--sidebar-width)',
    display: 'flex',
    flexDirection: 'column',
    minHeight: '100vh',
    backgroundColor: '#F7F8FA',
  },
  contentArea: {
    flex: 1,
    backgroundColor: '#F7F8FA',
  },
};
