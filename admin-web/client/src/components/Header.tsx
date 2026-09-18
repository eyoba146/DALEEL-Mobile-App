import React, { useState, useEffect } from 'react';
import { useAdminAuth } from '../context/AuthContext';
import type { AppModule } from '../context/AuthContext';
import { Activity, Clock } from 'lucide-react';

interface HeaderProps {
  currentTab: AppModule;
}

const TAB_TITLES: Record<AppModule, { title: string; subtitle: string }> = {
  dashboard: {
    title: 'Command Center & Platform Metrics',
    subtitle: 'High-level real-time telemetry across all Ethiopian services & commerce hubs',
  },
  destinations: {
    title: 'Heritage & Tourism Management',
    subtitle: 'Coordinate regional attractions, UNESCO sites, and interactive GIS map coordinates',
  },
  services: {
    title: 'Verified Services & Business Directory',
    subtitle: 'Manage partner providers, verify credentials, and review incoming client inquiries',
  },
  events: {
    title: 'Events & Diaspora Gatherings Hub',
    subtitle: 'Publish summits, cultural celebrations, venue coordinates, and manage attendee RSVPs',
  },
  marketplace: {
    title: 'Artisan Marketplace & Order Fulfillment',
    subtitle: 'Curate authentic Ethiopian crafts, manage inventory, and track delivery requests',
  },
  investments: {
    title: 'Diaspora Investment & Business Opportunities',
    subtitle: 'Manage high-yield projects, syndicates, and investor prospectus requests',
  },
  team: {
    title: 'Administrative Team & Role Delegation',
    subtitle: 'Manage coordinator permissions and assign module responsibilities across the platform',
  },
};

export const Header: React.FC<HeaderProps> = ({ currentTab }) => {
  const { adminUser } = useAdminAuth();
  const [timeString, setTimeString] = useState('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTimeString(
        now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const meta = TAB_TITLES[currentTab] || { title: 'Admin Command', subtitle: 'Platform Management' };

  return (
    <header style={styles.header}>
      {/* Title & Subtitle */}
      <div>
        <h2 style={styles.title}>{meta.title}</h2>
        <div style={styles.subtitle}>{meta.subtitle}</div>
      </div>

      {/* Right Telemetry & Status Badges */}
      <div style={styles.rightGroup}>
        {/* Backend Connected Indicator */}
        <div style={styles.statusPill}>
          <div style={styles.pulseDot} />
          <Activity size={13} color="#10B981" />
          <span style={styles.statusText}>API Connected</span>
        </div>

        {/* Live Clock */}
        <div style={styles.timePill}>
          <Clock size={13} color="#DFB76C" />
          <span style={styles.timeText}>{timeString}</span>
        </div>

        {/* User initials chip */}
        <div style={styles.userChip}>
          <div style={styles.userAvatar}>
            {adminUser?.name?.charAt(0).toUpperCase() || 'A'}
          </div>
          <span style={styles.userName}>{adminUser?.name}</span>
        </div>
      </div>
    </header>
  );
};

const styles: { [key: string]: React.CSSProperties } = {
  header: {
    height: 'var(--header-height)',
    backgroundColor: 'rgba(7, 21, 43, 0.9)',
    backdropFilter: 'blur(12px)',
    borderBottom: '1px solid rgba(223, 183, 108, 0.18)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '0 32px',
    position: 'sticky',
    top: 0,
    zIndex: 90,
  },
  title: {
    fontSize: '18px',
    fontWeight: 700,
    color: '#FFFFFF',
    margin: 0,
  },
  subtitle: {
    fontSize: '12px',
    color: '#8E9FB8',
    marginTop: '2px',
  },
  rightGroup: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  statusPill: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    padding: '6px 12px',
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    border: '1px solid rgba(16, 185, 129, 0.3)',
    borderRadius: '9999px',
  },
  pulseDot: {
    width: '6px',
    height: '6px',
    borderRadius: '50%',
    backgroundColor: '#10B981',
    boxShadow: '0 0 8px #10B981',
  },
  statusText: {
    fontSize: '11px',
    fontWeight: 700,
    color: '#10B981',
    letterSpacing: '0.04em',
    textTransform: 'uppercase',
  },
  timePill: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    padding: '6px 12px',
    backgroundColor: '#0C1E38',
    border: '1px solid rgba(223, 183, 108, 0.2)',
    borderRadius: '9999px',
  },
  timeText: {
    fontSize: '11.5px',
    fontWeight: 600,
    color: '#EAEFF8',
    fontVariantNumeric: 'tabular-nums',
  },
  userChip: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '4px 12px 4px 4px',
    backgroundColor: '#0C1E38',
    border: '1px solid rgba(223, 183, 108, 0.25)',
    borderRadius: '9999px',
  },
  userAvatar: {
    width: '26px',
    height: '26px',
    borderRadius: '50%',
    backgroundColor: '#DFB76C',
    color: '#07152B',
    fontWeight: 800,
    fontSize: '12px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  userName: {
    fontSize: '12px',
    fontWeight: 600,
    color: '#EAEFF8',
  },
};
