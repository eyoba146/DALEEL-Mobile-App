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

export const Layout: React.FC = () => {
  const [currentTab, setCurrentTab] = useState<AppModule>('dashboard');

  const renderModule = () => {
    switch (currentTab) {
      case 'dashboard':
        return <DashboardView onNavigate={setCurrentTab} />;
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
        return <DashboardView onNavigate={setCurrentTab} />;
    }
  };

  return (
    <div style={styles.layoutRoot}>
      <Sidebar currentTab={currentTab} onSelectTab={setCurrentTab} />

      <div style={styles.mainWrapper}>
        <Header currentTab={currentTab} />
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
