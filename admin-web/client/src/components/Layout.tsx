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
import { ProfileSecurityView } from './ProfileSecurityView';
import { TriageInboxManager } from './TriageInboxManager';
import { UsersManager } from './UsersManager';
import { ReviewsManager } from './ReviewsManager';

const VALID_MODULES: AppModule[] = [
  'dashboard',
  'inquiries',
  'reviews',
  'destinations',
  'services',
  'events',
  'marketplace',
  'investments',
  'users',
  'team',
  'profile',
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
  const [sidebarOpen, setSidebarOpen] = useState(false);

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
    setSidebarOpen(false);
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
      case 'inquiries':
        return <TriageInboxManager />;
      case 'reviews':
        return <ReviewsManager />;
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
      case 'users':
        return <UsersManager />;
      case 'team':
        return <TeamManager />;
      case 'profile':
        return <ProfileSecurityView />;
      default:
        return <DashboardView onNavigate={handleSelectTab} />;
    }
  };

  return (
    <div style={styles.layoutRoot}>
      {/* Mobile Drawer Backdrop */}
      {sidebarOpen && (
        <div
          className="sidebar-backdrop"
          onClick={() => setSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Deep Navy Navigation Sidebar */}
      <Sidebar
        currentTab={currentTab}
        onSelectTab={handleSelectTab}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      {/* Responsive Main Viewport Surface */}
      <div className="main-wrapper-responsive" style={styles.mainWrapper}>
        <Header
          currentTab={currentTab}
          onSelectTab={handleSelectTab}
          onToggleSidebar={() => setSidebarOpen((prev) => !prev)}
        />
        <main style={styles.contentArea}>
          {renderModule()}
        </main>
      </div>
    </div>
  );
};

const styles: { [key: string]: React.CSSProperties } = {
  layoutRoot: {
    display: 'flex',
    minHeight: '100vh',
    backgroundColor: '#F7F8FA',
    width: '100%',
    overflowX: 'hidden',
  },
  mainWrapper: {
    flex: 1,
    marginLeft: 'var(--sidebar-width)',
    display: 'flex',
    flexDirection: 'column',
    minHeight: '100vh',
    backgroundColor: '#F7F8FA',
    minWidth: 0,
    width: 'calc(100% - var(--sidebar-width))',
  },
  contentArea: {
    flex: 1,
    backgroundColor: '#F7F8FA',
    minWidth: 0,
  },
};
