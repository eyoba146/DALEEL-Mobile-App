import React, { useEffect, useState } from 'react';
import { adminApi, type UnifiedInquiryItem, type SidebarCounts } from '../api';
import type { PlatformStats } from '../api';
import { useAdminAuth } from '../context/AuthContext';
import type { AppModule } from '../context/AuthContext';
import {
  Compass,
  Briefcase,
  Calendar,
  ShoppingBag,
  TrendingUp,
  Users,
  ShieldCheck,
  ArrowRight,
  UserCheck,
  Clock,
  Sparkles,
  ChevronRight,
  ShieldAlert,
} from 'lucide-react';

interface DashboardViewProps {
  onNavigate: (tab: AppModule) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({ onNavigate }) => {
  const { adminUser, canAccess } = useAdminAuth();
  const [stats, setStats] = useState<PlatformStats | null>(null);
  const [counts, setCounts] = useState<SidebarCounts | null>(null);
  const [recentInquiries, setRecentInquiries] = useState<UnifiedInquiryItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      adminApi.getStats().catch(() => null),
      adminApi.getSidebarCounts().catch(() => null),
      adminApi.getUnifiedInquiries({ queue: 'active' }).catch(() => null),
    ]).then(([statsData, countsData, inqData]) => {
      if (statsData) setStats(statsData);
      if (countsData) setCounts(countsData);
      if (inqData && inqData.inquiries) {
        setRecentInquiries(inqData.inquiries.slice(0, 3));
      }
      setLoading(false);
    });
  }, []);

  const getRoleTitle = (role?: string) => {
    switch (role) {
      case 'SUPER_ADMIN':
        return 'Executive Administrator';
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

  const currentDate = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const totalPendingTriage = counts?.totalPending ?? 0;

  const catalogCards = [
    {
      id: 'destinations' as AppModule,
      label: 'Heritage Destinations',
      value: stats?.destinationsCount ?? 0,
      icon: Compass,
      desc: 'UNESCO cultural landmarks & regional travel destinations',
      color: '#B45309',
      bg: '#FFFBEB',
    },
    {
      id: 'services' as AppModule,
      label: 'Verified Partners',
      value: stats?.servicesCount ?? 0,
      icon: Briefcase,
      desc: 'Certified legal, health, banking & concierge partners',
      color: '#8C6A21',
      bg: '#FEF9EE',
    },
    {
      id: 'events' as AppModule,
      label: 'Events & Gatherings',
      value: stats?.eventsCount ?? 0,
      icon: Calendar,
      desc: 'Diaspora summits, cultural celebrations & festivals',
      color: '#1D4ED8',
      bg: '#EFF6FF',
    },
    {
      id: 'marketplace' as AppModule,
      label: 'Artisan Marketplace',
      value: stats?.productsCount ?? 0,
      icon: ShoppingBag,
      desc: 'Authentic crafts, apparel, specialty coffee & jewelry',
      color: '#059669',
      bg: '#ECFDF5',
    },
    {
      id: 'investments' as AppModule,
      label: 'Investment Ventures',
      value: stats?.investmentsCount ?? 0,
      icon: TrendingUp,
      desc: 'High-yield agro, commercial real estate & tech ventures',
      color: '#6D28D9',
      bg: '#F5F3FF',
    },
    {
      id: 'team' as AppModule,
      label: 'Staff Coordinators',
      value: stats?.adminTeamCount ?? 0,
      icon: Users,
      desc: 'Authorized operational management staff and leads',
      color: '#0F766E',
      bg: '#F0FDFA',
    },
    ...(canAccess('users')
      ? [
          {
            id: 'users' as AppModule,
            label: 'Registered Members',
            value: stats?.registeredUsersCount ?? 0,
            icon: UserCheck,
            desc: 'Diaspora travelers and verified resident members',
            color: '#4338CA',
            bg: '#EEF2FF',
          },
        ]
      : []),
  ];

  return (
    <div style={styles.container}>
      {/* Executive Header Banner */}
      <div style={styles.headerBanner}>
        <div style={styles.headerLeft}>
          <div style={styles.telemetryBar}>
            <span style={styles.livePulseDot} />
            <span style={styles.telemetryText}>SYSTEM ONLINE • OPERATIONAL</span>
            <span style={styles.telemetryDivider}>|</span>
            <span style={styles.dateText}>{currentDate}</span>
          </div>

          <h1 style={styles.welcomeTitle}>
            Welcome back, {adminUser?.name || 'Administrator'}
          </h1>
          <p style={styles.welcomeSubtitle}>
            Command and operational oversight for the DALEEL Diaspora & Foreign Resident platform.
          </p>

          <div style={styles.roleTag}>
            <ShieldCheck size={14} color="#8C6A21" />
            <span>SESSION: {getRoleTitle(adminUser?.adminRole).toUpperCase()}</span>
          </div>
        </div>

        <div style={styles.headerRight}>
          {totalPendingTriage > 0 ? (
            <div style={styles.triageActionCard} onClick={() => onNavigate('inquiries')}>
              <div style={styles.triageActionHeader}>
                <ShieldAlert size={18} color="#92400E" />
                <span style={styles.triageActionCount}>{totalPendingTriage} Action Items</span>
              </div>
              <p style={styles.triageActionSub}>
                Customer inquiries or RSVPs requiring review and confirmation.
              </p>
              <div style={styles.triageActionBtn}>
                <span>Open Master Triage Desk</span>
                <ChevronRight size={14} />
              </div>
            </div>
          ) : (
            <div style={styles.triageClearCard} onClick={() => onNavigate('inquiries')}>
              <div style={styles.triageClearHeader}>
                <Sparkles size={18} color="#059669" />
                <span style={styles.triageClearTitle}>Queue Clear</span>
              </div>
              <p style={styles.triageClearSub}>All customer requests have been processed and confirmed.</p>
              <div style={styles.triageClearLink}>
                <span>View Historical Inquiries</span>
                <ChevronRight size={13} />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Priority Live Triage Feed */}
      {recentInquiries.length > 0 && (
        <div style={styles.sectionContainer}>
          <div style={styles.sectionHeaderRow}>
            <div>
              <h3 style={styles.sectionTitle}>Priority Customer Submissions</h3>
              <p style={styles.sectionDesc}>Incoming requests requiring staff triage or confirmation</p>
            </div>
            <button style={styles.viewAllBtn} onClick={() => onNavigate('inquiries')}>
              <span>View All ({totalPendingTriage})</span>
              <ArrowRight size={13} />
            </button>
          </div>

          <div style={styles.triageGrid}>
            {recentInquiries.map((inq) => (
              <div key={inq.id} style={styles.inqCard} onClick={() => onNavigate('inquiries')}>
                <div style={styles.inqCardTop}>
                  <span style={styles.inqModuleBadge}>{inq.moduleLabel}</span>
                  <span style={styles.inqTime}>
                    <Clock size={11} />
                    <span>{new Date(inq.createdAt).toLocaleDateString()}</span>
                  </span>
                </div>
                <div style={styles.inqTitle}>{inq.title}</div>
                <div style={styles.inqCustomer}>
                  <strong>{inq.customerName}</strong> ({inq.customerEmail})
                </div>
                <div style={styles.inqActionRow}>
                  <span style={styles.inqActionText}>Triage in Master Desk &rarr;</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Primary Catalog & Operations Grid */}
      <div style={styles.sectionContainer}>
        <div style={styles.sectionHeaderRow}>
          <div>
            <h3 style={styles.sectionTitle}>Platform Catalog & Operational Sectors</h3>
            <p style={styles.sectionDesc}>
              Direct management access to certified directory listings, heritage sites, and events
            </p>
          </div>
        </div>

        <div style={styles.grid}>
          {catalogCards.map((card) => {
            const Icon = card.icon;
            const accessible = canAccess(card.id);
            return (
              <div
                key={card.label}
                style={{
                  ...styles.card,
                  ...(accessible ? styles.cardAccessible : styles.cardRestricted),
                }}
                onClick={() => {
                  if (accessible) onNavigate(card.id);
                }}
              >
                <div style={styles.cardTop}>
                  <span style={styles.cardLabel}>{card.label}</span>
                  <div style={{ ...styles.cardIconBox, backgroundColor: card.bg }}>
                    <Icon size={18} color={card.color} />
                  </div>
                </div>

                <div style={styles.cardValue}>{loading ? '...' : card.value}</div>
                <p style={styles.cardDesc}>{card.desc}</p>

                <div style={styles.cardFooter}>
                  {accessible ? (
                    <span style={styles.cardLinkActive}>
                      <span>Open Workspace</span>
                      <ArrowRight size={13} />
                    </span>
                  ) : (
                    <span style={styles.cardLinkRestricted}>Role Restricted</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

const styles: { [key: string]: React.CSSProperties } = {
  container: {
    padding: '32px',
    maxWidth: '1600px',
    margin: '0 auto',
    backgroundColor: '#F8FAFC',
    minHeight: '100vh',
    color: '#07152B',
  },
  headerBanner: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: '24px',
    marginBottom: '28px',
    backgroundColor: '#FFFFFF',
    padding: '28px 32px',
    borderRadius: '16px',
    border: '1px solid #E4E9F0',
    boxShadow: '0 2px 12px rgba(7, 21, 43, 0.03)',
    flexWrap: 'wrap',
  },
  headerLeft: {
    flex: '1 1 500px',
  },
  telemetryBar: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    marginBottom: '10px',
  },
  livePulseDot: {
    width: '8px',
    height: '8px',
    borderRadius: '50%',
    backgroundColor: '#10B981',
    boxShadow: '0 0 0 3px rgba(16, 185, 129, 0.2)',
  },
  telemetryText: {
    fontSize: '11px',
    fontWeight: 750,
    letterSpacing: '0.08em',
    color: '#059669',
  },
  telemetryDivider: {
    color: '#CBD5E1',
    fontSize: '11px',
  },
  dateText: {
    fontSize: '11.5px',
    color: '#5A687A',
    fontWeight: 500,
  },
  welcomeTitle: {
    fontSize: '28px',
    fontWeight: 800,
    color: '#07152B',
    margin: '0 0 6px 0',
    letterSpacing: '-0.02em',
  },
  welcomeSubtitle: {
    fontSize: '14px',
    color: '#5A687A',
    margin: '0 0 14px 0',
    maxWidth: '650px',
    lineHeight: 1.5,
  },
  roleTag: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    padding: '4px 10px',
    backgroundColor: '#FEF9EE',
    border: '1px solid rgba(223, 183, 108, 0.4)',
    borderRadius: '8px',
    fontSize: '11px',
    fontWeight: 700,
    color: '#8C6A21',
  },
  headerRight: {
    flex: '0 0 320px',
  },
  triageActionCard: {
    backgroundColor: '#FFFBEB',
    border: '1px solid #FDE68A',
    borderRadius: '12px',
    padding: '16px',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    boxShadow: '0 2px 8px rgba(146, 64, 14, 0.05)',
  },
  triageActionHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    marginBottom: '6px',
  },
  triageActionCount: {
    fontSize: '15px',
    fontWeight: 800,
    color: '#92400E',
  },
  triageActionSub: {
    fontSize: '12px',
    color: '#78350F',
    margin: '0 0 10px 0',
    lineHeight: 1.4,
  },
  triageActionBtn: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    fontSize: '12px',
    fontWeight: 700,
    color: '#92400E',
    borderTop: '1px solid #FDE68A',
    paddingTop: '8px',
  },
  triageClearCard: {
    backgroundColor: '#ECFDF5',
    border: '1px solid #A7F3D0',
    borderRadius: '12px',
    padding: '16px',
    cursor: 'pointer',
  },
  triageClearHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    marginBottom: '4px',
  },
  triageClearTitle: {
    fontSize: '14px',
    fontWeight: 800,
    color: '#065F46',
  },
  triageClearSub: {
    fontSize: '12px',
    color: '#047857',
    margin: '0 0 8px 0',
  },
  triageClearLink: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    fontSize: '11.5px',
    fontWeight: 700,
    color: '#065F46',
  },
  sectionContainer: {
    marginBottom: '32px',
  },
  sectionHeaderRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginBottom: '16px',
  },
  sectionTitle: {
    fontSize: '18px',
    fontWeight: 800,
    color: '#07152B',
    margin: '0 0 4px 0',
  },
  sectionDesc: {
    fontSize: '13px',
    color: '#5A687A',
    margin: 0,
  },
  viewAllBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    backgroundColor: '#FFFFFF',
    border: '1px solid #E4E9F0',
    borderRadius: '8px',
    padding: '6px 12px',
    fontSize: '12px',
    fontWeight: 600,
    color: '#07152B',
    cursor: 'pointer',
    transition: 'all 0.15s ease',
  },
  triageGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
    gap: '16px',
  },
  inqCard: {
    backgroundColor: '#FFFFFF',
    border: '1px solid #E4E9F0',
    borderRadius: '12px',
    padding: '18px 20px',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    boxShadow: '0 2px 8px rgba(7, 21, 43, 0.02)',
  },
  inqCardTop: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '10px',
  },
  inqModuleBadge: {
    fontSize: '11px',
    fontWeight: 700,
    textTransform: 'uppercase',
    padding: '3px 8px',
    borderRadius: '12px',
    backgroundColor: '#FEF9EE',
    color: '#8C6A21',
    border: '1px solid rgba(223, 183, 108, 0.3)',
  },
  inqTime: {
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
    fontSize: '11px',
    color: '#8A9AA8',
  },
  inqTitle: {
    fontSize: '15px',
    fontWeight: 750,
    color: '#07152B',
    marginBottom: '4px',
  },
  inqCustomer: {
    fontSize: '12.5px',
    color: '#5A687A',
    marginBottom: '12px',
  },
  inqActionRow: {
    borderTop: '1px solid #F1F5F9',
    paddingTop: '8px',
    textAlign: 'right',
  },
  inqActionText: {
    fontSize: '11.5px',
    fontWeight: 700,
    color: '#8C6A21',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
    gap: '18px',
  },
  card: {
    backgroundColor: '#FFFFFF',
    border: '1px solid #E4E9F0',
    borderRadius: '14px',
    padding: '22px',
    display: 'flex',
    flexDirection: 'column',
    boxShadow: '0 2px 10px rgba(7, 21, 43, 0.03)',
    transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
  },
  cardAccessible: {
    cursor: 'pointer',
  },
  cardRestricted: {
    opacity: 0.6,
    cursor: 'not-allowed',
  },
  cardTop: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '12px',
  },
  cardLabel: {
    fontSize: '13.5px',
    fontWeight: 700,
    color: '#5A687A',
  },
  cardIconBox: {
    width: '38px',
    height: '38px',
    borderRadius: '10px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardValue: {
    fontSize: '32px',
    fontWeight: 850,
    color: '#07152B',
    lineHeight: 1,
    letterSpacing: '-0.02em',
    marginBottom: '8px',
  },
  cardDesc: {
    fontSize: '12.5px',
    color: '#5A687A',
    lineHeight: 1.4,
    margin: '0 0 16px 0',
    flex: 1,
  },
  cardFooter: {
    borderTop: '1px solid #F1F5F9',
    paddingTop: '12px',
  },
  cardLinkActive: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    fontSize: '12px',
    fontWeight: 700,
    color: '#8C6A21',
  },
  cardLinkRestricted: {
    fontSize: '11.5px',
    fontWeight: 600,
    color: '#94A3B8',
  },
};
