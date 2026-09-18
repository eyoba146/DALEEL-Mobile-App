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
  { id: 'dashboard', label: 'Command Center', icon: LayoutDashboard },
  { id: 'destinations', label: 'Heritage & Tourism', icon: Compass },
  { id: 'services', label: 'Verified Services', icon: Briefcase },
  { id: 'events', label: 'Events & Gatherings', icon: Calendar },
  { id: 'marketplace', label: 'Artisan Marketplace', icon: ShoppingBag },
  { id: 'investments', label: 'Diaspora Investments', icon: TrendingUp },
  { id: 'team', label: 'Team & RBAC Roles', icon: Users },
];

export const Sidebar: React.FC<SidebarProps> = ({ currentTab, onSelectTab }) => {
  const { adminUser, logout, canAccess } = useAdminAuth();

  const getRoleDisplayName = (role?: string) => {
    switch (role) {
      case 'SUPER_ADMIN':
        return 'Super Administrator';
      case 'DESTINATION_MANAGER':
        return 'Tourism & Heritage Lead';
      case 'SERVICE_MANAGER':
        return 'Partner Directory Lead';
      case 'EVENT_MANAGER':
        return 'Events Coordinator';
      case 'MARKETPLACE_MANAGER':
        return 'Artisan Merchant Lead';
      case 'INVESTMENT_OFFICER':
        return 'Investment Officer';
      default:
        return 'Platform Coordinator';
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
          <div style={styles.brandSub}>ADMIN COMMAND</div>
        </div>
      </div>

      {/* Coordinator Info Profile Strip */}
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
        <div style={styles.sectionHeader}>AUTHORIZED MODULES</div>
        {accessibleItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentTab === item.id;
          return (
            <button
              key={item.id}
              style={{
                ...styles.navBtn,
                ...(isActive ? styles.navBtnActive : {}),
              }}
              onClick={() => onSelectTab(item.id)}
            >
              <Icon size={18} color={isActive ? '#07152B' : '#DFB76C'} />
              <span style={{ ...styles.navLabel, color: isActive ? '#07152B' : '#EAEFF8' }}>
                {item.label}
              </span>
            </button>
          );
        })}
      </nav>

      {/* Sign Out Footer */}
      <div style={styles.footer}>
        <button style={styles.logoutBtn} onClick={logout}>
          <LogOut size={16} color="#EF4444" />
          <span>Exit Administrative Session</span>
        </button>
      </div>
    </aside>
  );
};

const styles: { [key: string]: React.CSSProperties } = {
  sidebar: {
    width: 'var(--sidebar-width)',
    height: '100vh',
    backgroundColor: '#07152B',
    borderRight: '1px solid rgba(223, 183, 108, 0.18)',
    display: 'flex',
    flexDirection: 'column',
    position: 'fixed',
    left: 0,
    top: 0,
    zIndex: 100,
  },
  brandBox: {
    padding: '24px 20px',
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    borderBottom: '1px solid rgba(223, 183, 108, 0.12)',
  },
  brandLogo: {
    width: '38px',
    height: '38px',
    borderRadius: '10px',
    backgroundColor: 'rgba(223, 183, 108, 0.12)',
    border: '1px solid rgba(223, 183, 108, 0.3)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandName: {
    fontSize: '18px',
    fontWeight: 800,
    color: '#DFB76C',
    letterSpacing: '0.06em',
  },
  brandSub: {
    fontSize: '10px',
    fontWeight: 700,
    color: '#8E9FB8',
    letterSpacing: '0.05em',
  },
  profileStrip: {
    margin: '16px',
    padding: '12px',
    backgroundColor: '#0C1E38',
    border: '1px solid rgba(223, 183, 108, 0.15)',
    borderRadius: '12px',
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  avatarCircle: {
    width: '36px',
    height: '36px',
    borderRadius: '50%',
    backgroundColor: '#DFB76C',
    color: '#07152B',
    fontWeight: 800,
    fontSize: '15px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    boxShadow: '0 0 10px rgba(223, 183, 108, 0.3)',
  },
  profileMeta: {
    overflow: 'hidden',
  },
  profileName: {
    fontSize: '13px',
    fontWeight: 700,
    color: '#FFFFFF',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  roleBadge: {
    fontSize: '9.5px',
    fontWeight: 700,
    color: '#DFB76C',
    textTransform: 'uppercase',
    letterSpacing: '0.03em',
    marginTop: '2px',
  },
  sectionHeader: {
    fontSize: '10px',
    fontWeight: 700,
    letterSpacing: '0.08em',
    color: '#60728F',
    padding: '8px 14px',
    marginBottom: '4px',
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
    transition: 'all 0.18s ease',
    border: '1px solid transparent',
  },
  navBtnActive: {
    backgroundColor: '#DFB76C',
    boxShadow: '0 4px 14px rgba(223, 183, 108, 0.35)',
  },
  navLabel: {
    fontSize: '13.5px',
    fontWeight: 600,
  },
  footer: {
    padding: '16px',
    borderTop: '1px solid rgba(223, 183, 108, 0.12)',
  },
  logoutBtn: {
    width: '100%',
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    padding: '10px 14px',
    borderRadius: '8px',
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    border: '1px solid rgba(239, 68, 68, 0.25)',
    color: '#FCA5A5',
    fontSize: '12.5px',
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'all 0.18s ease',
  },
};
