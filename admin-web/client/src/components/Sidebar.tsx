import React, { useEffect, useState } from 'react';
import { useAdminAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import type { AppModule } from '../context/AuthContext';
import { adminApi, type SidebarCounts } from '../api';
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
  ShieldCheck,
  Activity,
  User,
  Inbox,
  UserCheck,
  Star,
  X,
} from 'lucide-react';

interface SidebarProps {
  currentTab: AppModule;
  onSelectTab: (tab: AppModule) => void;
  isOpen?: boolean;
  onClose?: () => void;
}

interface NavItem {
  id: AppModule;
  label: string;
  badge?: string;
  icon: React.ComponentType<{ size?: number; color?: string }>;
}

interface NavSection {
  titleKey: string;
  defaultTitle: string;
  items: NavItem[];
}

const NAV_SECTIONS: NavSection[] = [
  {
    titleKey: 'nav.section.core',
    defaultTitle: 'EXECUTIVE CORE',
    items: [
      { id: 'dashboard', label: 'Overview & Ops', icon: LayoutDashboard },
      { id: 'inquiries', label: 'Master Triage Desk', icon: Inbox },
    ],
  },
  {
    titleKey: 'nav.section.heritage',
    defaultTitle: 'HERITAGE & TOURISM',
    items: [
      { id: 'destinations', label: 'Destinations & Sites', icon: Compass },
      { id: 'events', label: 'Events & Gatherings', icon: Calendar },
    ],
  },
  {
    titleKey: 'nav.section.commerce',
    defaultTitle: 'COMMERCE & DIRECTORY',
    items: [
      { id: 'services', label: 'Verified Services', icon: Briefcase },
      { id: 'marketplace', label: 'Artisan Marketplace', icon: ShoppingBag },
      { id: 'investments', label: 'Diaspora Investments', icon: TrendingUp },
      { id: 'reviews', label: 'Reviews Moderation', icon: Star },
    ],
  },
  {
    titleKey: 'nav.section.governance',
    defaultTitle: 'GOVERNANCE & ACCOUNT',
    items: [
      { id: 'users', label: 'Registered Members', icon: UserCheck },
      { id: 'team', label: 'Administrative Team', icon: Users },
      { id: 'profile', label: 'Security & Profile', icon: ShieldCheck },
    ],
  },
];

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  onSelectTab,
  isOpen,
  onClose,
}) => {
  const { adminUser, logout, canAccess } = useAdminAuth();
  const { t } = useLanguage();
  const [counts, setCounts] = useState<SidebarCounts | null>(null);
  const [hoveredNav, setHoveredNav] = useState<AppModule | null>(null);

  const handleTabSelect = (tab: AppModule) => {
    onSelectTab(tab);
    if (onClose) onClose();
  };

  useEffect(() => {
    let mounted = true;
    const fetchCounts = () => {
      adminApi
        .getSidebarCounts()
        .then((data) => {
          if (mounted) setCounts(data);
        })
        .catch((err) => console.warn('Sidebar count fetch error:', err));
    };

    fetchCounts();
    const interval = setInterval(fetchCounts, 12000);
    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, [currentTab]);

  const getBadgeCount = (id: AppModule): number => {
    if (!counts) return 0;
    switch (id) {
      case 'inquiries':
        return counts.totalPending;
      case 'services':
        return counts.services;
      case 'events':
        return counts.events;
      case 'marketplace':
        return counts.marketplace;
      case 'investments':
        return counts.investments;
      case 'users':
        return counts.unverifiedUsers;
      case 'reviews':
        return counts.reviews || 0;
      default:
        return 0;
    }
  };

  const getRoleDisplayName = (role?: string) => {
    switch (role) {
      case 'SUPER_ADMIN':
        return t('role.super_admin', 'Full Administrator');
      case 'DESTINATION_MANAGER':
        return t('role.destination_manager', 'Tourism & Heritage Lead');
      case 'SERVICE_MANAGER':
        return t('role.service_manager', 'Services Directory Lead');
      case 'EVENT_MANAGER':
        return t('role.event_manager', 'Events Coordinator');
      case 'MARKETPLACE_MANAGER':
        return t('role.marketplace_manager', 'Marketplace Lead');
      case 'INVESTMENT_OFFICER':
        return t('role.investment_officer', 'Investment Officer');
      default:
        return t('role.admin', 'Administrator');
    }
  };

  const isProfileActive = currentTab === 'profile';

  return (
    <aside className={`sidebar-container ${isOpen ? 'sidebar-open' : ''}`} style={styles.sidebar}>
      {/* Brand & Crest Header - Deep Navy Foundation */}
      <div style={styles.brandBox}>
        <div style={styles.brandLogo}>
          <Shield size={20} color="#DFB76C" />
        </div>
        <div>
          <div style={styles.brandName}>{t('brand.title', 'DALEEL')}</div>
          <div style={styles.brandSub}>{t('brand.sub', 'EXECUTIVE CONSOLE')}</div>
        </div>
        {onClose && (
          <button
            type="button"
            className="mobile-close-btn"
            onClick={onClose}
            aria-label="Close sidebar"
          >
            <X size={17} color="#FFFFFF" />
          </button>
        )}
      </div>

      {/* Operator Identity Capsule (Deep Navy Theme) */}
      <div
        style={{
          ...styles.profileCard,
          ...(isProfileActive ? styles.profileCardActive : {}),
        }}
        onClick={() => handleTabSelect('profile')}
        role="button"
        tabIndex={0}
        title={t('sidebar.securityProfile', 'Security & Profile Settings')}
      >
        <div style={styles.profileCardHeader}>
          <div style={styles.avatarCircle}>
            {adminUser?.name ? adminUser.name.charAt(0).toUpperCase() : 'A'}
          </div>
          <div style={styles.profileMeta}>
            <div style={styles.profileName} title={adminUser?.name}>
              {adminUser?.name || 'Administrator'}
            </div>
            <div style={styles.roleBadge}>{getRoleDisplayName(adminUser?.adminRole)}</div>
          </div>
        </div>

        <div style={styles.profileActionRow}>
          <span style={styles.profileSecLink}>
            <ShieldCheck size={12} color="#DFB76C" />
            <span>{t('sidebar.securityProfile', 'Security & Profile')}</span>
          </span>
          <span style={styles.profileEditBadge}>{t('sidebar.manage', 'Active')}</span>
        </div>
      </div>

      {/* Structured Categorized Navigation */}
      <nav style={styles.nav}>
        {NAV_SECTIONS.map((section) => {
          const visibleItems = section.items.filter((item) => canAccess(item.id));
          if (visibleItems.length === 0) return null;

          return (
            <div key={section.titleKey} style={styles.sectionBlock}>
              <div style={styles.sectionHeader}>{t(section.titleKey, section.defaultTitle)}</div>
              <div style={styles.sectionList}>
                {visibleItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = currentTab === item.id;
                  const isHovered = hoveredNav === item.id;
                  const badgeCount = getBadgeCount(item.id);
                  const label = t(`nav.${item.id}`, item.label);

                  return (
                    <button
                      key={item.id}
                      style={{
                        ...styles.navBtn,
                        ...(isActive
                          ? styles.navBtnActive
                          : isHovered
                          ? styles.navBtnHovered
                          : styles.navBtnInactive),
                      }}
                      onMouseEnter={() => setHoveredNav(item.id)}
                      onMouseLeave={() => setHoveredNav(null)}
                      onClick={() => handleTabSelect(item.id)}
                    >
                      <Icon
                        size={17}
                        color={isActive ? '#DFB76C' : isHovered ? '#FFFFFF' : 'rgba(255, 255, 255, 0.65)'}
                      />
                      <span
                        style={{
                          ...styles.navLabel,
                          color: isActive ? '#FFFFFF' : isHovered ? '#FFFFFF' : 'rgba(255, 255, 255, 0.78)',
                          fontWeight: isActive ? 700 : 550,
                        }}
                      >
                        {label}
                      </span>
                      {badgeCount > 0 && (
                        <span
                          style={{
                            ...styles.floatingBadge,
                            ...(isActive ? styles.floatingBadgeActive : styles.floatingBadgeInactive),
                          }}
                        >
                          {badgeCount}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}

        {/* Platform Status Widget - Institutional Deep Navy */}
        <div style={styles.telemetryCard}>
          <div style={styles.telemetryHeader}>
            <div style={styles.telemetryTitleGroup}>
              <Activity size={13} color="#10B981" />
              <span style={styles.telemetryTitle}>{t('status.platformStatus', 'Platform Health')}</span>
            </div>
            <div style={styles.telemetryPill}>
              <span style={styles.pulseDot} />
              <span>{t('status.operational', 'Live')}</span>
            </div>
          </div>
          <div style={styles.telemetryMeta}>
            <span>{t('status.allOnline', 'Core REST APIs Nominal')}</span>
            <span>{t('status.encrypted', 'Encrypted TLS Session')}</span>
          </div>
        </div>
      </nav>

      {/* Action Controls Footer */}
      <div style={styles.footer}>
        <button
          style={{
            ...styles.profileBtn,
            ...(isProfileActive ? styles.profileBtnActive : {}),
          }}
          onClick={() => handleTabSelect('profile')}
        >
          <User size={15} color={isProfileActive ? '#DFB76C' : 'rgba(255, 255, 255, 0.8)'} />
          <span>{t('sidebar.securityProfile', 'Security Credentials')}</span>
        </button>
        <button style={styles.logoutBtn} onClick={logout}>
          <LogOut size={15} color="#EF4444" />
          <span>{t('sidebar.signOut', 'End Session')}</span>
        </button>
      </div>
    </aside>
  );
};

const styles: { [key: string]: React.CSSProperties } = {
  sidebar: {
    width: 'var(--sidebar-width)',
    height: '100vh',
    backgroundColor: '#07152B', // MANDATORY DEEP NAVY FOUNDATION
    borderRight: '1px solid #0F2242',
    display: 'flex',
    flexDirection: 'column',
    position: 'fixed',
    left: 0,
    top: 0,
    zIndex: 100,
    boxShadow: '4px 0 24px rgba(0, 0, 0, 0.22)',
  },
  brandBox: {
    padding: '20px 20px',
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
  },
  brandLogo: {
    width: '38px',
    height: '38px',
    borderRadius: '10px',
    backgroundColor: '#050D1A',
    border: '1.5px solid #DFB76C',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 0 12px rgba(223, 183, 108, 0.25)',
    flexShrink: 0,
  },
  brandName: {
    fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif",
    fontSize: '18px',
    fontWeight: 800,
    color: '#FFFFFF',
    letterSpacing: '0.06em',
    lineHeight: 1.1,
  },
  brandSub: {
    fontSize: '9.5px',
    fontWeight: 800,
    color: '#DFB76C',
    letterSpacing: '0.12em',
    marginTop: '3px',
  },
  profileCard: {
    margin: '14px 14px 6px 14px',
    padding: '12px 14px',
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    border: '1px solid rgba(255, 255, 255, 0.08)',
    borderRadius: '12px',
    cursor: 'pointer',
    transition: 'all 0.18s ease',
  },
  profileCardActive: {
    backgroundColor: 'rgba(223, 183, 108, 0.12)',
    borderColor: 'rgba(223, 183, 108, 0.5)',
    boxShadow: '0 0 14px rgba(223, 183, 108, 0.15)',
  },
  profileCardHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
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
    border: '1.5px solid #FFFFFF',
    flexShrink: 0,
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.3)',
  },
  profileMeta: {
    overflow: 'hidden',
    flex: 1,
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
    fontSize: '11px',
    fontWeight: 650,
    color: '#DFB76C',
    marginTop: '2px',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  profileActionRow: {
    marginTop: '8px',
    paddingTop: '8px',
    borderTop: '1px solid rgba(255, 255, 255, 0.08)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  profileSecLink: {
    display: 'flex',
    alignItems: 'center',
    gap: '5px',
    fontSize: '11px',
    fontWeight: 600,
    color: 'rgba(255, 255, 255, 0.7)',
  },
  profileEditBadge: {
    fontSize: '10px',
    fontWeight: 750,
    color: '#DFB76C',
    backgroundColor: 'rgba(223, 183, 108, 0.15)',
    border: '1px solid rgba(223, 183, 108, 0.35)',
    padding: '1px 7px',
    borderRadius: '9999px',
  },
  nav: {
    flex: 1,
    padding: '10px 14px',
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
    overflowY: 'auto',
  },
  sectionBlock: {
    display: 'flex',
    flexDirection: 'column',
    gap: '3px',
  },
  sectionHeader: {
    fontSize: '10px',
    fontWeight: 800,
    letterSpacing: '0.09em',
    color: 'rgba(255, 255, 255, 0.42)',
    padding: '4px 10px',
    textTransform: 'uppercase',
  },
  sectionList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '3px',
  },
  navBtn: {
    width: '100%',
    display: 'flex',
    alignItems: 'center',
    gap: '11px',
    padding: '9.5px 12px',
    borderRadius: '9px',
    cursor: 'pointer',
    transition: 'all 0.16s ease',
    textAlign: 'left',
    border: '1px solid transparent',
  },
  navBtnActive: {
    backgroundColor: 'rgba(223, 183, 108, 0.14)',
    borderColor: 'rgba(223, 183, 108, 0.35)',
    borderLeft: '3.5px solid #DFB76C',
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.25)',
  },
  navBtnHovered: {
    backgroundColor: 'rgba(255, 255, 255, 0.07)',
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  navBtnInactive: {
    backgroundColor: 'transparent',
  },
  navLabel: {
    fontSize: '13px',
    letterSpacing: '-0.01em',
  },
  floatingBadge: {
    marginLeft: 'auto',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: '20px',
    height: '20px',
    padding: '0 6px',
    borderRadius: '999px',
    fontSize: '10.5px',
    fontWeight: 800,
    letterSpacing: '-0.02em',
    transition: 'all 0.15s ease',
  },
  floatingBadgeActive: {
    backgroundColor: '#DFB76C',
    color: '#07152B',
  },
  floatingBadgeInactive: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    color: '#DFB76C',
    border: '1px solid rgba(223, 183, 108, 0.25)',
  },
  telemetryCard: {
    marginTop: 'auto',
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    border: '1px solid rgba(255, 255, 255, 0.08)',
    borderRadius: '10px',
    padding: '11px 12px',
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
  },
  telemetryHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  telemetryTitleGroup: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
  },
  telemetryTitle: {
    fontSize: '11px',
    fontWeight: 700,
    color: '#FFFFFF',
  },
  telemetryPill: {
    display: 'flex',
    alignItems: 'center',
    gap: '5px',
    fontSize: '10px',
    fontWeight: 750,
    color: '#34D399',
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    border: '1px solid rgba(16, 185, 129, 0.3)',
    padding: '1px 7px',
    borderRadius: '9999px',
  },
  pulseDot: {
    width: '6px',
    height: '6px',
    borderRadius: '50%',
    backgroundColor: '#10B981',
    boxShadow: '0 0 0 2px rgba(16, 185, 129, 0.35)',
  },
  telemetryMeta: {
    display: 'flex',
    flexDirection: 'column',
    gap: '2px',
    fontSize: '10.5px',
    color: 'rgba(255, 255, 255, 0.48)',
  },
  footer: {
    padding: '12px 14px',
    borderTop: '1px solid rgba(255, 255, 255, 0.08)',
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
    backgroundColor: '#07152B',
  },
  profileBtn: {
    width: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    padding: '9px 12px',
    borderRadius: '8px',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    color: '#FFFFFF',
    fontSize: '12px',
    fontWeight: 650,
    cursor: 'pointer',
    transition: 'all 0.15s ease',
  },
  profileBtnActive: {
    backgroundColor: 'rgba(223, 183, 108, 0.18)',
    borderColor: '#DFB76C',
    color: '#DFB76C',
  },
  logoutBtn: {
    width: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    padding: '9px 12px',
    borderRadius: '8px',
    backgroundColor: 'rgba(239, 68, 68, 0.12)',
    border: '1px solid rgba(239, 68, 68, 0.25)',
    color: '#F87171',
    fontSize: '12px',
    fontWeight: 650,
    cursor: 'pointer',
    transition: 'all 0.15s ease',
  },
};
