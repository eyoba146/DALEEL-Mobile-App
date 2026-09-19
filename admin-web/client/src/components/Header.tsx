import React from 'react';
import { useAdminAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import type { Language } from '../utils/translations';
import type { AppModule } from '../context/AuthContext';
import { CalendarDays, ShieldCheck, Globe } from 'lucide-react';

interface HeaderProps {
  currentTab: AppModule;
  onSelectTab: (tab: AppModule) => void;
}

const TAB_TITLES: Record<AppModule, { title: string; subtitle: string }> = {
  dashboard: {
    title: 'Overview & Activity',
    subtitle: 'Summary of heritage destinations, service partners, and marketplace orders',
  },
  inquiries: {
    title: 'Master Triage Desk',
    subtitle: 'Role-based triage desk monitoring customer inquiries, reservations, and orders',
  },
  reviews: {
    title: 'Community Reviews & Ratings Desk',
    subtitle: 'Moderate feedback, verify diaspora buyers, and maintain authentic Ethiopian community trust',
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
  users: {
    title: 'Registered Members Directory',
    subtitle: 'Roster of registered Ethiopian diaspora and foreign resident accounts',
  },
  team: {
    title: 'Administrative Team',
    subtitle: 'Manage coordinator permissions and delegate module responsibilities',
  },
  profile: {
    title: 'Security & Profile',
    subtitle: 'Manage your administrator details, security credentials, and access permissions',
  },
};

const LOCALE_MAP: Record<Language, string> = {
  en: 'en-US',
  am: 'am-ET',
  om: 'om-ET',
  ar: 'ar-SA',
};

export const Header: React.FC<HeaderProps> = ({ currentTab, onSelectTab }) => {
  const { adminUser } = useAdminAuth();
  const { language, setLanguage, languages, t } = useLanguage();

  const formattedDate = new Intl.DateTimeFormat(LOCALE_MAP[language] || 'en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date());

  const title = t(`tab.${currentTab}.title`, TAB_TITLES[currentTab]?.title || 'DALEEL Management');
  const subtitle = t(`tab.${currentTab}.sub`, TAB_TITLES[currentTab]?.subtitle || 'Platform Administration');
  const isProfileActive = currentTab === 'profile';

  return (
    <header style={styles.header}>
      {/* Title & Subtitle */}
      <div>
        <h2 style={styles.title}>{title}</h2>
        <div style={styles.subtitle}>{subtitle}</div>
      </div>

      {/* Right User & Date Group */}
      <div style={styles.rightGroup}>
        {/* Multilingual Selector Segmented Pills */}
        <div style={styles.langContainer} role="group" aria-label="Language selection">
          <Globe size={13} color="#8C6A21" style={{ marginLeft: '4px', marginRight: '2px' }} />
          {languages.map((lang) => {
            const isActive = language === lang.code;
            return (
              <button
                key={lang.code}
                type="button"
                style={{
                  ...styles.langPill,
                  ...(isActive ? styles.langPillActive : styles.langPillInactive),
                }}
                onClick={() => setLanguage(lang.code)}
                title={`${lang.name} (${lang.nativeName})`}
                aria-label={`Change language to ${lang.name}`}
              >
                {lang.badge}
              </button>
            );
          })}
        </div>

        {/* Date Display */}
        <div style={styles.dateChip}>
          <CalendarDays size={14} color="#8C6A21" />
          <span style={styles.dateText}>{formattedDate}</span>
        </div>

        {/* User Profile & Security Pill (Navigates directly in-page, NO POPUP) */}
        <div
          style={{
            ...styles.userPill,
            ...(isProfileActive ? styles.userPillActive : {}),
          }}
          onClick={() => onSelectTab('profile')}
          role="button"
          tabIndex={0}
          title={t('sidebar.securityProfile', 'Security & Profile')}
        >
          <div style={styles.userAvatar}>
            {adminUser?.name?.charAt(0).toUpperCase() || 'A'}
          </div>
          <div style={styles.userMeta}>
            <span style={styles.userName}>{adminUser?.name}</span>
            <span style={styles.userRole}>
              {adminUser?.adminRole === 'SUPER_ADMIN'
                ? t('role.super_admin', 'Full Administrator')
                : t('role.coordinator', 'Coordinator')}
            </span>
          </div>
          <div style={styles.securityIcon}>
            <ShieldCheck size={16} color={isProfileActive ? '#07152B' : '#8C6A21'} />
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
  langContainer: {
    display: 'flex',
    alignItems: 'center',
    padding: '3px 4px',
    backgroundColor: '#F8FAFC',
    border: '1px solid #E2E8F0',
    borderRadius: '9999px',
    gap: '3px',
    boxShadow: '0 1px 2px rgba(7, 21, 43, 0.03)',
  },
  langPill: {
    padding: '4px 10px',
    borderRadius: '9999px',
    fontSize: '11.5px',
    fontWeight: 700,
    cursor: 'pointer',
    border: '1px solid transparent',
    transition: 'all 0.18s cubic-bezier(0.4, 0, 0.2, 1)',
    outline: 'none',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    userSelect: 'none',
  },
  langPillActive: {
    backgroundColor: '#07152B',
    color: '#DFB76C',
    borderColor: '#DFB76C',
    boxShadow: '0 2px 6px rgba(7, 21, 43, 0.25)',
  },
  langPillInactive: {
    backgroundColor: 'transparent',
    color: '#475569',
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
  userPillActive: {
    backgroundColor: '#F8F4EC',
    borderColor: '#DFB76C',
    boxShadow: '0 2px 8px rgba(223, 183, 108, 0.25)',
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
