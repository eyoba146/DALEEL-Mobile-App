import React, { useState } from 'react';
import type { AppModule } from '../context/AuthContext';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { DashboardView } from './DashboardView';
import { ModulePlaceholder } from './ModulePlaceholder';

export const Layout: React.FC = () => {
  const [currentTab, setCurrentTab] = useState<AppModule>('dashboard');

  return (
    <div style={styles.layoutRoot}>
      <Sidebar currentTab={currentTab} onSelectTab={setCurrentTab} />

      <div style={styles.mainWrapper}>
        <Header currentTab={currentTab} />
        <main style={styles.contentArea}>
          {currentTab === 'dashboard' ? (
            <DashboardView onNavigate={setCurrentTab} />
          ) : (
            <ModulePlaceholder module={currentTab} />
          )}
        </main>
      </div>
    </div>
  );
};

const styles: { [key: string]: React.CSSProperties } = {
  layoutRoot: {
    display: 'flex',
    minHeight: '100vh',
    backgroundColor: '#040D1B',
  },
  mainWrapper: {
    flex: 1,
    marginLeft: 'var(--sidebar-width)',
    display: 'flex',
    flexDirection: 'column',
    minHeight: '100vh',
  },
  contentArea: {
    flex: 1,
    backgroundColor: '#040D1B',
  },
};
