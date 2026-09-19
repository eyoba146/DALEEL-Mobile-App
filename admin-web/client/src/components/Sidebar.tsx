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
} from 'lucide-react';

interface SidebarProps {
  currentTab: AppModule;
  onSelectTab: (tab: AppModule) => void;
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
}) => {
  const { adminUser, logout, canAccess } = useAdminAuth();
  const { t } = useLanguage();
  const [counts, setCounts] = useState<SidebarCounts | null>(null);

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
    <aside style={styles.sidebar}>
      {/* Brand & Crest Header */}
      <div style={styles.brandBox}>
        <div style={styles.brandLogo}>
          <Shield size={22} color="#DFB76C" />
        </div>
        <div>
          <div style={styles.brandName}>{t('brand.title', 'DALEEL')}</div>
          <div style={styles.brandSub}>{t('brand.sub', 'MANAGEMENT PORTAL')}</div>
        </div>
      </div>

      {/* Interactive Profile & Security Card (Navigates directly to in-page workspace, NO POPUP) */}
      <div
        style={{
          ...styles.profileCard,
          ...(isProfileActive ? styles.profileCardActive : {}),
        }}
        onClick={() => onSelectTab('profile')}
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
              {adminUser?.name}
            </div>
            <div style={styles.roleBadge}>{getRoleDisplayName(adminUser?.adminRole)}</div>
          </div>
        </div>

        <div style={styles.profileActionRow}>
          <span style={styles.profileSecLink}>
            <ShieldCheck size={13} color="#8C6A21" />
            <span>{t('sidebar.securityProfile', 'Security & Profile')}</span>
          </span>
          <span style={styles.profileEditBadge}>{t('sidebar.manage', 'Manage')}</span>
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
                  const badgeCount = getBadgeCount(item.id);
                  const label = t(`nav.${item.id}`, item.label);
                  return (
                    <button
                      key={item.id}
                      style={{
                        ...styles.navBtn,
                        ...(isActive ? styles.navBtnActive : styles.navBtnInactive),
                      }}
                      onClick={() => onSelectTab(item.id)}
                    >
                      <Icon size={17} color={isActive ? '#DFB76C' : '#64748B'} />
                      <span
                        style={{
                          ...styles.navLabel,
                          color: isActive ? '#FFFFFF' : '#1E293B',
                          fontWeight: isActive ? 700 : 600,
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

        {/* Professional Institutional System Status Widget (NO DEVELOPER JARGON) */}
        <div style={styles.telemetryCard}>
          <div style={styles.telemetryHeader}>
            <div style={styles.telemetryTitleGroup}>
              <Activity size={13} color="#10B981" />
              <span style={styles.telemetryTitle}>{t('status.platformStatus', 'Platform Status')}</span>
            </div>
            <div style={styles.telemetryPill}>
              <span style={styles.pulseDot} />
              <span>{t('status.operational', 'Operational')}</span>
            </div>
          </div>
          <div style={styles.telemetryMeta}>
            <span>{t('status.allOnline', 'All Services Online')}</span>
            <span>{t('status.encrypted', 'Encrypted Session Active')}</span>
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
          onClick={() => onSelectTab('profile')}
        >
          <User size={15} color={isProfileActive ? '#DFB76C' : '#07152B'} />
          <span>{t('sidebar.securityProfile', 'Security & Profile')}</span>
        </button>
        <button style={styles.logoutBtn} onClick={logout}>
          <LogOut size={15} color="#C53030" />
          <span>{t('sidebar.signOut', 'Sign Out')}</span>
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
    boxShadow: '2px 0 10px rgba(7, 21, 43, 0.04)',
  },
  brandBox: {
    padding: '20px 20px',
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    borderBottom: '1px solid #F1F4F9',
  },
  brandLogo: {
    width: '40px',
    height: '40px',
    borderRadius: '10px',
    backgroundColor: '#07152B',
    border: '1px solid #DFB76C',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 2px 8px rgba(7, 21, 43, 0.18)',
    flexShrink: 0,
  },
  brandName: {
    fontFamily: "'DM Serif Display', Georgia, serif",
    fontSize: '21px',
    fontWeight: 400,
    color: '#07152B',
    letterSpacing: '0.04em',
    lineHeight: 1.1,
  },
  brandSub: {
    fontSize: '9.5px',
    fontWeight: 800,
    color: '#8C6A21',
    letterSpacing: '0.08em',
    marginTop: '2px',
  },
  profileCard: {
    margin: '14px 14px 6px 14px',
    padding: '12px 14px',
    backgroundColor: '#FBF9F4',
    border: '1px solid #EADBB6',
    borderRadius: '12px',
    cursor: 'pointer',
    transition: 'all 0.18s ease',
    boxShadow: '0 1px 3px rgba(7, 21, 43, 0.03)',
  },
  profileCardActive: {
    backgroundColor: '#F4ECE0',
    borderColor: '#DFB76C',
    boxShadow: '0 2px 8px rgba(223, 183, 108, 0.25)',
  },
  profileCardHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
  },
  avatarCircle: {
    width: '38px',
    height: '38px',
    borderRadius: '50%',
    backgroundColor: '#07152B',
    color: '#DFB76C',
    fontWeight: 800,
    fontSize: '15px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    border: '1px solid #DFB76C',
    flexShrink: 0,
    boxShadow: '0 2px 6px rgba(7, 21, 43, 0.15)',
  },
  profileMeta: {
    overflow: 'hidden',
    flex: 1,
  },
  profileName: {
    fontSize: '13px',
    fontWeight: 750,
    color: '#07152B',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  roleBadge: {
    fontSize: '11px',
    fontWeight: 700,
    color: '#8C6A21',
    marginTop: '2px',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  profileActionRow: {
    marginTop: '8px',
    paddingTop: '8px',
    borderTop: '1px solid #EFE4CD',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  profileSecLink: {
    display: 'flex',
    alignItems: 'center',
    gap: '5px',
    fontSize: '11px',
    fontWeight: 650,
    color: '#5A4310',
  },
  profileEditBadge: {
    fontSize: '10px',
    fontWeight: 750,
    color: '#8C6A21',
    backgroundColor: '#FFFFFF',
    border: '1px solid #E0C582',
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
    letterSpacing: '0.08em',
    color: '#718096',
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
    padding: '10px 12px',
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
    fontSize: '11px',
    fontWeight: 800,
    letterSpacing: '-0.02em',
    transition: 'all 0.15s ease',
  },
  floatingBadgeActive: {
    backgroundColor: '#DFB76C',
    color: '#07152B',
  },
  floatingBadgeInactive: {
    backgroundColor: '#FEF9EE',
    color: '#8C6A21',
    border: '1px solid rgba(223, 183, 108, 0.4)',
  },
  telemetryCard: {
    marginTop: 'auto',
    backgroundColor: '#F8FAFC',
    border: '1px solid #E2E8F0',
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
    color: '#07152B',
  },
  telemetryPill: {
    display: 'flex',
    alignItems: 'center',
    gap: '5px',
    fontSize: '10.5px',
    fontWeight: 750,
    color: '#059669',
    backgroundColor: '#ECFDF5',
    border: '1px solid #A7F3D0',
    padding: '1px 7px',
    borderRadius: '9999px',
  },
  pulseDot: {
    width: '6px',
    height: '6px',
    borderRadius: '50%',
    backgroundColor: '#10B981',
    boxShadow: '0 0 0 2px rgba(16, 185, 129, 0.2)',
  },
  telemetryMeta: {
    display: 'flex',
    flexDirection: 'column',
    gap: '2px',
    fontSize: '10.5px',
    color: '#64748B',
  },
  footer: {
    padding: '12px 14px',
    borderTop: '1px solid #E4E9F0',
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
    backgroundColor: '#FFFFFF',
  },
  profileBtn: {
    width: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    padding: '9px 12px',
    borderRadius: '8px',
    backgroundColor: '#F8FAFC',
    border: '1px solid #CBD5E1',
    color: '#07152B',
    fontSize: '12.5px',
    fontWeight: 700,
    cursor: 'pointer',
    transition: 'all 0.15s ease',
  },
  profileBtnActive: {
    backgroundColor: '#07152B',
    borderColor: '#07152B',
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
    backgroundColor: '#FFF5F5',
    border: '1px solid #FED7D7',
    color: '#C53030',
    fontSize: '12.5px',
    fontWeight: 700,
    cursor: 'pointer',
    transition: 'all 0.15s ease',
  },
};
