import React from 'react';
import { useAdminAuth } from '../context/AuthContext';
import type { AppModule } from '../context/AuthContext';
import { CalendarDays, ShieldCheck } from 'lucide-react';

interface HeaderProps {
  currentTab: AppModule;
  onOpenProfile?: () => void;
}

const TAB_TITLES: Record<AppModule, { title: string; subtitle: string }> = {
  dashboard: {
    title: 'Overview & Activity',
    subtitle: 'Summary of heritage destinations, service partners, and marketplace orders',
  },
  destinations: {
    title: 'Heritage & Tourism',
    subtitle: 'Manage regional attractions, UNESCO cultural sites, and map coordinates',
  },
  services: {
    title: 'Verified Partner Directory',
    subtitle: 'Manage certified professional service providers and review customer inquiries',
  },
  events: {
    title: 'Events & Gatherings',
    subtitle: 'Publish summits, community gatherings, venue locations, and manage RSVPs',
  },
  marketplace: {
    title: 'Artisan Marketplace',
    subtitle: 'Curate authentic Ethiopian crafts, apparel, and track customer order requests',
  },
  investments: {
    title: 'Diaspora Investments',
    subtitle: 'Manage high-growth opportunities, syndicates, and investor inquiries',
  },
  team: {
    title: 'Administrative Team',
    subtitle: 'Manage coordinator permissions and delegate module responsibilities',
  },
};

export const Header: React.FC<HeaderProps> = ({ currentTab, onOpenProfile }) => {
  const { adminUser } = useAdminAuth();

  const formattedDate = new Intl.DateTimeFormat('en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date());

  const meta = TAB_TITLES[currentTab] || { title: 'DALEEL Management', subtitle: 'Platform Administration' };

  return (
    <header style={styles.header}>
      {/* Title & Subtitle */}
      <div>
        <h2 style={styles.title}>{meta.title}</h2>
        <div style={styles.subtitle}>{meta.subtitle}</div>
      </div>

      {/* Right User & Date Group */}
      <div style={styles.rightGroup}>
        {/* Date Display */}
        <div style={styles.dateChip}>
          <CalendarDays size={14} color="#8C6A21" />
          <span style={styles.dateText}>{formattedDate}</span>
        </div>

        {/* User Profile & Security Pill */}
        <div
          style={styles.userPill}
          onClick={onOpenProfile}
          role="button"
          tabIndex={0}
          title="Click to manage profile, credentials, and permissions"
        >
          <div style={styles.userAvatar}>
            {adminUser?.name?.charAt(0).toUpperCase() || 'A'}
          </div>
          <div style={styles.userMeta}>
            <span style={styles.userName}>{adminUser?.name}</span>
            <span style={styles.userRole}>
              {adminUser?.adminRole === 'SUPER_ADMIN' ? 'Full Administrator' : 'Coordinator'}
            </span>
          </div>
          <div style={styles.securityIcon}>
            <ShieldCheck size={16} color="#8C6A21" />
          </div>
        </div>
      </div>
    </header>
  );
};

const styles: { [key: string]: React.CSSProperties } = {
  header: {
    height: 'var(--header-height)',
    backgroundColor: '#FFFFFF',
    borderBottom: '1px solid #E4E9F0',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '0 32px',
    position: 'sticky',
    top: 0,
    zIndex: 90,
    boxShadow: '0 1px 3px rgba(7, 21, 43, 0.03)',
  },
  title: {
    fontSize: '20px',
    fontWeight: 700,
    color: '#07152B',
    margin: 0,
  },
  subtitle: {
    fontSize: '13px',
    color: '#5A687A',
    marginTop: '2px',
  },
  rightGroup: {
    display: 'flex',
    alignItems: 'center',
    gap: '14px',
  },
  dateChip: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    padding: '7px 14px',
    backgroundColor: '#F8F4EC',
    border: '1px solid #E0C582',
    borderRadius: '9999px',
  },
  dateText: {
    fontSize: '12.5px',
    fontWeight: 600,
    color: '#07152B',
  },
  userPill: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    padding: '5px 14px 5px 6px',
    backgroundColor: '#F8FAFC',
    border: '1px solid #E4E9F0',
    borderRadius: '9999px',
    cursor: 'pointer',
    transition: 'all 0.18s ease',
  },
  userAvatar: {
    width: '32px',
    height: '32px',
    borderRadius: '50%',
    backgroundColor: '#07152B',
    color: '#DFB76C',
    fontWeight: 700,
    fontSize: '13px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    border: '1px solid #DFB76C',
  },
  userMeta: {
    display: 'flex',
    flexDirection: 'column',
    lineHeight: 1.2,
  },
  userName: {
    fontSize: '12.5px',
    fontWeight: 700,
    color: '#07152B',
  },
  userRole: {
    fontSize: '10.5px',
    fontWeight: 600,
    color: '#8C6A21',
  },
  securityIcon: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    paddingLeft: '4px',
  },
};
