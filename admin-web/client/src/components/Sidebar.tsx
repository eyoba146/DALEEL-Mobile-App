import React from 'react';
import { useAdminAuth } from '../context/AuthContext';
import type { AppModule } from '../context/AuthContext';
import {
  LayoutDashboard,
  Compass,
  Briefcase,
  Calendar,
  ShoppingBag,
  TrendingUp,
  Users,
  LogOut,
  Shield,
} from 'lucide-react';

interface SidebarProps {
  currentTab: AppModule;
  onSelectTab: (tab: AppModule) => void;
}

interface NavItem {
  id: AppModule;
  label: string;
  icon: React.ComponentType<{ size?: number; color?: string }>;
}

const NAV_ITEMS: NavItem[] = [
  { id: 'dashboard', label: 'Overview', icon: LayoutDashboard },
  { id: 'destinations', label: 'Heritage Destinations', icon: Compass },
  { id: 'services', label: 'Verified Services', icon: Briefcase },
  { id: 'events', label: 'Events & Gatherings', icon: Calendar },
  { id: 'marketplace', label: 'Artisan Marketplace', icon: ShoppingBag },
  { id: 'investments', label: 'Diaspora Investments', icon: TrendingUp },
  { id: 'team', label: 'Administrative Team', icon: Users },
];

export const Sidebar: React.FC<SidebarProps> = ({ currentTab, onSelectTab }) => {
  const { adminUser, logout, canAccess } = useAdminAuth();

  const getRoleDisplayName = (role?: string) => {
    switch (role) {
      case 'SUPER_ADMIN':
        return 'Full Administrator';
      case 'DESTINATION_MANAGER':
        return 'Tourism & Heritage Lead';
      case 'SERVICE_MANAGER':
        return 'Services Directory Lead';
      case 'EVENT_MANAGER':
        return 'Events Coordinator';
      case 'MARKETPLACE_MANAGER':
        return 'Marketplace Lead';
      case 'INVESTMENT_OFFICER':
        return 'Investment Officer';
      default:
        return 'Administrator';
    }
  };

  const accessibleItems = NAV_ITEMS.filter((item) => canAccess(item.id));

  return (
    <aside style={styles.sidebar}>
      {/* Brand Header */}
      <div style={styles.brandBox}>
        <div style={styles.brandLogo}>
          <Shield size={20} color="#DFB76C" />
        </div>
        <div>
          <div style={styles.brandName}>DALEEL</div>
          <div style={styles.brandSub}>MANAGEMENT PORTAL</div>
        </div>
      </div>

      {/* Staff Profile Strip */}
      <div style={styles.profileStrip}>
        <div style={styles.avatarCircle}>
          {adminUser?.name ? adminUser.name.charAt(0).toUpperCase() : 'A'}
        </div>
        <div style={styles.profileMeta}>
          <div style={styles.profileName} title={adminUser?.name}>
            {adminUser?.name}
          </div>
          <div style={styles.roleBadge}>{getRoleDisplayName(adminUser?.adminRole)}</div>
        </div>
      </div>

      {/* Navigation Links */}
      <nav style={styles.nav}>
        <div style={styles.sectionHeader}>PLATFORM MODULES</div>
        {accessibleItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentTab === item.id;
          return (
            <button
              key={item.id}
              style={{
                ...styles.navBtn,
                ...(isActive ? styles.navBtnActive : styles.navBtnInactive),
              }}
              onClick={() => onSelectTab(item.id)}
            >
              <Icon size={18} color={isActive ? '#DFB76C' : '#5A687A'} />
              <span
                style={{
                  ...styles.navLabel,
                  color: isActive ? '#FFFFFF' : '#334155',
                  fontWeight: isActive ? 700 : 600,
                }}
              >
                {item.label}
              </span>
            </button>
          );
        })}
      </nav>

      {/* Sign Out Footer */}
      <div style={styles.footer}>
        <button style={styles.logoutBtn} onClick={logout}>
          <LogOut size={16} color="#C53030" />
          <span>Sign Out</span>
        </button>
      </div>
    </aside>
  );
};

const styles: { [key: string]: React.CSSProperties } = {
  sidebar: {
    width: 'var(--sidebar-width)',
    height: '100vh',
    backgroundColor: '#FFFFFF',
    borderRight: '1px solid #E4E9F0',
    display: 'flex',
    flexDirection: 'column',
    position: 'fixed',
    left: 0,
    top: 0,
    zIndex: 100,
    boxShadow: '1px 0 6px rgba(7, 21, 43, 0.03)',
  },
  brandBox: {
    padding: '22px 20px',
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    borderBottom: '1px solid #E4E9F0',
  },
  brandLogo: {
    width: '38px',
    height: '38px',
    borderRadius: '10px',
    backgroundColor: '#07152B',
    border: '1px solid #DFB76C',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 2px 8px rgba(7, 21, 43, 0.15)',
  },
  brandName: {
    fontFamily: "'DM Serif Display', Georgia, serif",
    fontSize: '20px',
    fontWeight: 400,
    color: '#07152B',
    letterSpacing: '0.04em',
  },
  brandSub: {
    fontSize: '9.5px',
    fontWeight: 800,
    color: '#8C6A21',
    letterSpacing: '0.08em',
  },
  profileStrip: {
    margin: '16px 14px 10px 14px',
    padding: '12px 14px',
    backgroundColor: '#F8F4EC',
    border: '1px solid #E0C582',
    borderRadius: '12px',
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  avatarCircle: {
    width: '36px',
    height: '36px',
    borderRadius: '50%',
    backgroundColor: '#07152B',
    color: '#DFB76C',
    fontWeight: 800,
    fontSize: '14px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    border: '1px solid #DFB76C',
    flexShrink: 0,
  },
  profileMeta: {
    overflow: 'hidden',
  },
  profileName: {
    fontSize: '13px',
    fontWeight: 700,
    color: '#07152B',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  roleBadge: {
    fontSize: '11px',
    fontWeight: 700,
    color: '#8C6A21',
    marginTop: '1px',
  },
  sectionHeader: {
    fontSize: '10.5px',
    fontWeight: 800,
    letterSpacing: '0.08em',
    color: '#5A687A',
    padding: '8px 12px',
    marginBottom: '2px',
  },
  nav: {
    flex: 1,
    padding: '8px 12px',
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
    overflowY: 'auto',
  },
  navBtn: {
    width: '100%',
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '11px 14px',
    borderRadius: '10px',
    cursor: 'pointer',
    transition: 'all 0.15s ease',
    border: '1px solid transparent',
    textAlign: 'left',
  },
  navBtnActive: {
    backgroundColor: '#07152B',
    color: '#FFFFFF',
    boxShadow: '0 4px 12px rgba(7, 21, 43, 0.18)',
  },
  navBtnInactive: {
    backgroundColor: 'transparent',
    color: '#334155',
  },
  navLabel: {
    fontSize: '13.5px',
  },
  footer: {
    padding: '14px 16px',
    borderTop: '1px solid #E4E9F0',
  },
  logoutBtn: {
    width: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    padding: '10px 14px',
    borderRadius: '8px',
    backgroundColor: '#FFF5F5',
    border: '1px solid #FED7D7',
    color: '#C53030',
    fontSize: '12.5px',
    fontWeight: 700,
    cursor: 'pointer',
    transition: 'all 0.15s ease',
  },
};
