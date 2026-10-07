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
  Inbox,
  FileCheck2,
  PieChart,
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
        setRecentInquiries(inqData.inquiries.slice(0, 4));
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

  // Aggregate Metrics
  const totalCatalogListings =
    (stats?.destinationsCount ?? 0) +
    (stats?.servicesCount ?? 0) +
    (stats?.eventsCount ?? 0) +
    (stats?.productsCount ?? 0) +
    (stats?.investmentsCount ?? 0);

  const totalCustomerEngagement =
    (stats?.serviceInquiriesCount ?? 0) +
    (stats?.productOrdersCount ?? 0) +
    (stats?.eventRsvpsCount ?? 0) +
    (stats?.investmentInquiriesCount ?? 0);

  const catalogDistribution = [
    { label: 'Destinations', count: stats?.destinationsCount ?? 0, color: '#B45309', tab: 'destinations' as AppModule },
    { label: 'Verified Services', count: stats?.servicesCount ?? 0, color: '#DFB76C', tab: 'services' as AppModule },
    { label: 'Events & RSVPs', count: stats?.eventsCount ?? 0, color: '#3B82F6', tab: 'events' as AppModule },
    { label: 'Artisan Marketplace', count: stats?.productsCount ?? 0, color: '#10B981', tab: 'marketplace' as AppModule },
    { label: 'Investment Opportunities', count: stats?.investmentsCount ?? 0, color: '#8B5CF6', tab: 'investments' as AppModule },
  ];

  const catalogCards = [
    {
      id: 'destinations' as AppModule,
      label: 'Heritage Destinations',
      value: stats?.destinationsCount ?? 0,
      icon: Compass,
      desc: 'UNESCO cultural landmarks & regional tourism destinations',
      color: '#B45309',
      bg: '#FFFBEB',
      pending: 0,
    },
    {
      id: 'services' as AppModule,
      label: 'Verified Partners',
      value: stats?.servicesCount ?? 0,
      icon: Briefcase,
      desc: 'Certified legal, healthcare, banking & concierge partners',
      color: '#8C6A21',
      bg: '#FEF9EE',
      pending: counts?.services ?? 0,
    },
    {
      id: 'events' as AppModule,
      label: 'Events & Summits',
      value: stats?.eventsCount ?? 0,
      icon: Calendar,
      desc: 'Diaspora summits, cultural celebrations & gate RSVPs',
      color: '#1D4ED8',
      bg: '#EFF6FF',
      pending: counts?.events ?? 0,
    },
    {
      id: 'marketplace' as AppModule,
      label: 'Artisan Marketplace',
      value: stats?.productsCount ?? 0,
      icon: ShoppingBag,
      desc: 'Authentic crafts, apparel, specialty coffee & orders',
      color: '#059669',
      bg: '#ECFDF5',
      pending: counts?.marketplace ?? 0,
    },
    {
      id: 'investments' as AppModule,
      label: 'Investment Ventures',
      value: stats?.investmentsCount ?? 0,
      icon: TrendingUp,
      desc: 'High-yield agro, commercial real estate & diaspora syndicates',
      color: '#6D28D9',
      bg: '#F5F3FF',
      pending: counts?.investments ?? 0,
    },
    {
      id: 'team' as AppModule,
      label: 'Administrative Team',
      value: stats?.adminTeamCount ?? 0,
      icon: Users,
      desc: 'Authorized operational management staff and role permissions',
      color: '#0F766E',
      bg: '#F0FDFA',
      pending: 0,
    },
    ...(canAccess('users')
      ? [
          {
            id: 'users' as AppModule,
            label: 'Registered Members',
            value: stats?.registeredUsersCount ?? 0,
            icon: UserCheck,
            desc: 'Diaspora travelers and verified resident member accounts',
            color: '#4338CA',
            bg: '#EEF2FF',
            pending: counts?.unverifiedUsers ?? 0,
          },
        ]
      : []),
  ];

  return (
    <div className="dashboard-container" style={styles.container}>
      {/* 1. Executive Operations Command Hero (Deep Navy Elevation) */}
      <div className="hero-banner-responsive" style={styles.heroBanner}>
        <div style={styles.heroLeft}>
          <div style={styles.telemetryTag}>
            <span style={styles.livePulseDot} />
            <span style={styles.telemetryText}>SYSTEM ONLINE • PRODUCTION TELEMETRY</span>
            <span style={styles.telemetryDivider}>|</span>
            <span style={styles.dateText}>{currentDate}</span>
          </div>

          <h1 style={styles.welcomeTitle}>
            Executive Console <span style={{ color: '#DFB76C' }}>/</span> {adminUser?.name || 'Administrator'}
          </h1>
          <p style={styles.welcomeSubtitle}>
            Comprehensive operational governance for DALEEL Ethiopian Diaspora & Foreign Resident platform.
          </p>

          <div style={styles.sessionPill}>
            <ShieldCheck size={13} color="#DFB76C" />
            <span>AUTHORITY LEVEL: {getRoleTitle(adminUser?.adminRole).toUpperCase()}</span>
          </div>
        </div>

        <div style={styles.heroRight}>
          {totalPendingTriage > 0 ? (
            <div style={styles.triageActionCard} onClick={() => onNavigate('inquiries')}>
              <div style={styles.triageActionTop}>
                <div style={styles.triageIconBadge}>
                  <ShieldAlert size={18} color="#DFB76C" />
                </div>
                <div>
                  <div style={styles.triageCountText}>{totalPendingTriage} Action Items</div>
                  <div style={styles.triageSubText}>Customer inquiries awaiting administrative confirmation</div>
                </div>
              </div>
              <div style={styles.triageButton}>
                <span>Open Master Triage Desk</span>
                <ChevronRight size={14} color="#07152B" />
              </div>
            </div>
          ) : (
            <div style={styles.triageClearCard} onClick={() => onNavigate('inquiries')}>
              <div style={styles.triageActionTop}>
                <div style={styles.triageClearBadge}>
                  <Sparkles size={18} color="#10B981" />
                </div>
                <div>
                  <div style={styles.triageClearTitle}>Triage Queue Nominal</div>
                  <div style={styles.triageClearSub}>All customer requests have been processed and confirmed.</div>
                </div>
              </div>
              <div style={styles.triageClearLink}>
                <span>Inspect Audit Log</span>
                <ChevronRight size={13} color="#DFB76C" />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 2. Master Strategic KPI Telemetry Strip (4 Quadrant Cards) */}
      <div className="kpi-strip-grid" style={styles.kpiStrip}>
        <div
          style={{
            ...styles.kpiCard,
            borderLeft: totalPendingTriage > 0 ? '4px solid #DFB76C' : '4px solid #10B981',
            cursor: 'pointer',
          }}
          onClick={() => onNavigate('inquiries')}
        >
          <div style={styles.kpiCardTop}>
            <span style={styles.kpiLabel}>PENDING TRIAGE QUEUE</span>
            <Inbox size={18} color={totalPendingTriage > 0 ? '#DFB76C' : '#10B981'} />
          </div>
          <div style={styles.kpiValueRow}>
            <span style={styles.kpiValue}>{loading ? '...' : totalPendingTriage}</span>
            <span
              style={{
                ...styles.kpiBadge,
                backgroundColor: totalPendingTriage > 0 ? 'rgba(223, 183, 108, 0.15)' : 'rgba(16, 185, 129, 0.12)',
                color: totalPendingTriage > 0 ? '#8C6A21' : '#059669',
              }}
            >
              {totalPendingTriage > 0 ? 'Requires Review' : 'Clear'}
            </span>
          </div>
          <div style={styles.kpiFooter}>Across inquiries, reservations & orders</div>
        </div>

        <div style={styles.kpiCard}>
          <div style={styles.kpiCardTop}>
            <span style={styles.kpiLabel}>ACTIVE PLATFORM LISTINGS</span>
            <FileCheck2 size={18} color="#07152B" />
          </div>
          <div style={styles.kpiValueRow}>
            <span style={styles.kpiValue}>{loading ? '...' : totalCatalogListings}</span>
            <span style={{ ...styles.kpiBadge, backgroundColor: 'rgba(7, 21, 43, 0.08)', color: '#07152B' }}>
              Catalog Total
            </span>
          </div>
          <div style={styles.kpiFooter}>Destinations, partners, events & products</div>
        </div>

        <div style={styles.kpiCard}>
          <div style={styles.kpiCardTop}>
            <span style={styles.kpiLabel}>CUMULATIVE ENGAGEMENT</span>
            <TrendingUp size={18} color="#3B82F6" />
          </div>
          <div style={styles.kpiValueRow}>
            <span style={styles.kpiValue}>{loading ? '...' : totalCustomerEngagement}</span>
            <span style={{ ...styles.kpiBadge, backgroundColor: 'rgba(59, 130, 246, 0.12)', color: '#1D4ED8' }}>
              Total Volume
            </span>
          </div>
          <div style={styles.kpiFooter}>Customer inquiries, RSVPs & orders to date</div>
        </div>

        <div
          style={{ ...styles.kpiCard, cursor: canAccess('users') ? 'pointer' : 'default' }}
          onClick={() => {
            if (canAccess('users')) onNavigate('users');
          }}
        >
          <div style={styles.kpiCardTop}>
            <span style={styles.kpiLabel}>REGISTERED MEMBERS</span>
            <UserCheck size={18} color="#059669" />
          </div>
          <div style={styles.kpiValueRow}>
            <span style={styles.kpiValue}>{loading ? '...' : (stats?.registeredUsersCount ?? 0)}</span>
            <span style={{ ...styles.kpiBadge, backgroundColor: 'rgba(16, 185, 129, 0.12)', color: '#059669' }}>
              Members
            </span>
          </div>
          <div style={styles.kpiFooter}>Verified diaspora & resident accounts</div>
        </div>
      </div>

      {/* 3. Dual Command Quadrants: Priority Feed & Strategic Distribution */}
      <div className="command-grid-responsive" style={styles.commandGrid}>
        {/* Left Quadrant: Priority Live Triage Feed */}
        <div style={styles.feedCard}>
          <div style={styles.panelHeader}>
            <div>
              <div style={styles.panelTitle}>Priority Operational Inquiries</div>
              <div style={styles.panelSub}>Latest incoming customer requests requiring administrative response</div>
            </div>
            <button style={styles.panelActionBtn} onClick={() => onNavigate('inquiries')}>
              <span>View Desk ({totalPendingTriage})</span>
              <ArrowRight size={13} />
            </button>
          </div>

          <div style={styles.feedList}>
            {recentInquiries.length > 0 ? (
              recentInquiries.map((inq) => (
                <div key={inq.id} style={styles.feedItem} onClick={() => onNavigate('inquiries')}>
                  <div style={styles.feedItemTop}>
                    <span style={styles.moduleTag}>{inq.moduleLabel}</span>
                    <span style={styles.feedTime}>
                      <Clock size={11} />
                      <span>{new Date(inq.createdAt).toLocaleDateString()}</span>
                    </span>
                  </div>
                  <div style={styles.feedTitle}>{inq.title}</div>
                  <div style={styles.feedMeta}>
                    <span style={{ fontWeight: 650, color: '#07152B' }}>{inq.customerName}</span>
                    <span>&bull;</span>
                    <span>{inq.customerEmail}</span>
                  </div>
                  <div style={styles.feedFooter}>
                    <span style={styles.feedStatusPill}>{inq.status}</span>
                    <span style={styles.feedCta}>
                      Review in Master Desk <ChevronRight size={12} />
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div style={styles.feedEmpty}>
                <Sparkles size={24} color="#DFB76C" />
                <div style={styles.feedEmptyTitle}>No active pending inquiries</div>
                <div style={styles.feedEmptySub}>All customer requests across all sectors have been reviewed.</div>
              </div>
            )}
          </div>
        </div>

        {/* Right Quadrant: Platform Distribution Matrix */}
        <div style={styles.distributionCard}>
          <div style={styles.panelHeader}>
            <div>
              <div style={styles.panelTitle}>Platform Distribution Breakdown</div>
              <div style={styles.panelSub}>Live inventory proportion across all core administrative sectors</div>
            </div>
            <PieChart size={18} color="#DFB76C" />
          </div>

          <div style={styles.distribList}>
            {catalogDistribution.map((item) => {
              const percentage =
                totalCatalogListings > 0 ? Math.round((item.count / totalCatalogListings) * 100) : 0;
              return (
                <div
                  key={item.label}
                  style={styles.distribRow}
                  onClick={() => onNavigate(item.tab)}
                  title={`Open ${item.label} workspace`}
                >
                  <div style={styles.distribRowHeader}>
                    <div style={styles.distribLabelGroup}>
                      <span style={{ ...styles.distribColorDot, backgroundColor: item.color }} />
                      <span style={styles.distribLabel}>{item.label}</span>
                    </div>
                    <div style={styles.distribValueGroup}>
                      <span style={styles.distribCount}>{item.count} items</span>
                      <span style={styles.distribPct}>({percentage}%)</span>
                    </div>
                  </div>
                  <div style={styles.distribTrack}>
                    <div
                      style={{
                        ...styles.distribFill,
                        width: `${Math.max(percentage, 3)}%`,
                        backgroundColor: item.color,
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          <div style={styles.distribFooter}>
            <div style={styles.distribFooterText}>
              Total Curated Records: <strong>{totalCatalogListings}</strong>
            </div>
            <div style={styles.distribSecurityNote}>
              <ShieldCheck size={13} color="#059669" />
              <span>Catalog synchronized with REST backend</span>
            </div>
          </div>
        </div>
      </div>

      {/* 4. Primary Operational Sectors (Catalog Launchpad) */}
      <div style={styles.sectionWrap}>
        <div style={styles.sectionHeader}>
          <div>
            <h2 style={styles.sectionTitleHeading}>Operational Sectors & Directory</h2>
            <p style={styles.sectionSubHeading}>
              Direct administrative access to verified directory listings, heritage sites, and event desks.
            </p>
          </div>
        </div>

        <div className="catalog-grid-responsive" style={styles.catalogGrid}>
          {catalogCards.map((card) => {
            const Icon = card.icon;
            const accessible = canAccess(card.id);
            return (
              <div
                key={card.label}
                style={{
                  ...styles.sectorCard,
                  ...(accessible ? styles.sectorCardAccessible : styles.sectorCardRestricted),
                }}
                onClick={() => {
                  if (accessible) onNavigate(card.id);
                }}
              >
                <div style={styles.sectorCardTop}>
                  <div style={{ ...styles.sectorIconBox, backgroundColor: card.bg }}>
                    <Icon size={19} color={card.color} />
                  </div>
                  {card.pending > 0 ? (
                    <span style={styles.sectorPendingBadge}>
                      {card.pending} Pending
                    </span>
                  ) : (
                    <span style={styles.sectorActiveBadge}>Nominal</span>
                  )}
                </div>

                <div style={styles.sectorCardName}>{card.label}</div>
                <div style={styles.sectorCardValue}>{loading ? '...' : card.value}</div>
                <p style={styles.sectorCardDesc}>{card.desc}</p>

                <div style={styles.sectorCardFooter}>
                  {accessible ? (
                    <span style={styles.sectorCardLink}>
                      <span>Open Workspace</span>
                      <ArrowRight size={13} />
                    </span>
                  ) : (
                    <span style={styles.sectorCardRestrictedLabel}>Role Restricted</span>
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
    padding: '28px 36px 48px 36px',
    maxWidth: '1680px',
    margin: '0 auto',
    backgroundColor: '#F7F8FA', // Pristine Off White Canvas
    minHeight: '100vh',
    color: '#07152B',
    width: '100%',
    boxSizing: 'border-box',
  },
  heroBanner: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: '24px',
    marginBottom: '24px',
    backgroundColor: '#07152B', // Deep Navy Hero
    backgroundImage: 'linear-gradient(135deg, #07152B 0%, #0D2244 100%)',
    padding: '28px 34px',
    borderRadius: '16px',
    border: '1px solid #13284F',
    boxShadow: '0 8px 30px rgba(7, 21, 43, 0.16)',
    flexWrap: 'wrap',
    position: 'relative',
    overflow: 'hidden',
  },
  heroLeft: {
    flex: '1 1 540px',
    zIndex: 1,
  },
  telemetryTag: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    marginBottom: '10px',
  },
  livePulseDot: {
    width: '7px',
    height: '7px',
    borderRadius: '50%',
    backgroundColor: '#10B981',
    boxShadow: '0 0 0 3px rgba(16, 185, 129, 0.25)',
  },
  telemetryText: {
    fontSize: '11px',
    fontWeight: 750,
    letterSpacing: '0.08em',
    color: '#10B981',
  },
  telemetryDivider: {
    color: 'rgba(255, 255, 255, 0.25)',
    fontSize: '11px',
  },
  dateText: {
    fontSize: '11.5px',
    color: 'rgba(255, 255, 255, 0.65)',
    fontWeight: 500,
  },
  welcomeTitle: {
    fontSize: '26px',
    fontWeight: 800,
    color: '#FFFFFF',
    margin: '0 0 6px 0',
    letterSpacing: '-0.025em',
  },
  welcomeSubtitle: {
    fontSize: '13.5px',
    color: 'rgba(255, 255, 255, 0.72)',
    margin: '0 0 14px 0',
    maxWidth: '680px',
    lineHeight: 1.5,
  },
  sessionPill: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    padding: '4px 12px',
    backgroundColor: 'rgba(223, 183, 108, 0.12)',
    border: '1px solid rgba(223, 183, 108, 0.35)',
    borderRadius: '8px',
    fontSize: '10.5px',
    fontWeight: 750,
    color: '#DFB76C',
    letterSpacing: '0.04em',
  },
  heroRight: {
    flex: '1 1 300px',
    zIndex: 1,
  },
  triageActionCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    border: '1px solid rgba(223, 183, 108, 0.45)',
    borderRadius: '14px',
    padding: '18px 20px',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    boxShadow: '0 4px 16px rgba(0, 0, 0, 0.2)',
  },
  triageActionTop: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    marginBottom: '12px',
  },
  triageIconBadge: {
    width: '38px',
    height: '38px',
    borderRadius: '10px',
    backgroundColor: 'rgba(223, 183, 108, 0.18)',
    border: '1px solid #DFB76C',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  triageCountText: {
    fontSize: '15px',
    fontWeight: 800,
    color: '#DFB76C',
  },
  triageSubText: {
    fontSize: '11.5px',
    color: 'rgba(255, 255, 255, 0.7)',
    marginTop: '2px',
    lineHeight: 1.35,
  },
  triageButton: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    fontSize: '12px',
    fontWeight: 750,
    color: '#07152B',
    backgroundColor: '#DFB76C',
    padding: '8px 14px',
    borderRadius: '8px',
    transition: 'all 0.15s ease',
  },
  triageClearCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    border: '1px solid rgba(16, 185, 129, 0.35)',
    borderRadius: '14px',
    padding: '18px 20px',
    cursor: 'pointer',
  },
  triageClearBadge: {
    width: '38px',
    height: '38px',
    borderRadius: '10px',
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    border: '1px solid rgba(16, 185, 129, 0.3)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  triageClearTitle: {
    fontSize: '14px',
    fontWeight: 800,
    color: '#10B981',
  },
  triageClearSub: {
    fontSize: '11.5px',
    color: 'rgba(255, 255, 255, 0.65)',
    marginTop: '2px',
    lineHeight: 1.35,
  },
  triageClearLink: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    fontSize: '11.5px',
    fontWeight: 700,
    color: '#DFB76C',
    paddingTop: '8px',
    borderTop: '1px solid rgba(255, 255, 255, 0.08)',
  },
  kpiStrip: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
    gap: '18px',
    marginBottom: '26px',
  },
  kpiCard: {
    backgroundColor: '#FFFFFF',
    border: '1px solid #E2E8F0',
    borderRadius: '14px',
    padding: '20px 22px',
    boxShadow: '0 2px 8px rgba(7, 21, 43, 0.03)',
    transition: 'all 0.2s ease',
    display: 'flex',
    flexDirection: 'column',
  },
  kpiCardTop: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: '12px',
  },
  kpiLabel: {
    fontSize: '11px',
    fontWeight: 800,
    letterSpacing: '0.06em',
    color: '#64748B',
    textTransform: 'uppercase',
  },
  kpiValueRow: {
    display: 'flex',
    alignItems: 'baseline',
    gap: '10px',
    marginBottom: '6px',
  },
  kpiValue: {
    fontSize: '32px',
    fontWeight: 850,
    color: '#07152B',
    letterSpacing: '-0.03em',
    lineHeight: 1.1,
  },
  kpiBadge: {
    fontSize: '11px',
    fontWeight: 700,
    padding: '2px 8px',
    borderRadius: '999px',
  },
  kpiFooter: {
    fontSize: '12px',
    color: '#64748B',
    marginTop: 'auto',
  },
  commandGrid: {
    display: 'grid',
    gridTemplateColumns: '1.2fr 0.8fr',
    gap: '24px',
    marginBottom: '32px',
  },
  feedCard: {
    backgroundColor: '#FFFFFF',
    border: '1px solid #E2E8F0',
    borderRadius: '16px',
    padding: '24px',
    boxShadow: '0 2px 10px rgba(7, 21, 43, 0.03)',
    display: 'flex',
    flexDirection: 'column',
  },
  distributionCard: {
    backgroundColor: '#FFFFFF',
    border: '1px solid #E2E8F0',
    borderRadius: '16px',
    padding: '24px',
    boxShadow: '0 2px 10px rgba(7, 21, 43, 0.03)',
    display: 'flex',
    flexDirection: 'column',
  },
  panelHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: '20px',
    paddingBottom: '14px',
    borderBottom: '1px solid #F1F5F9',
  },
  panelTitle: {
    fontSize: '16px',
    fontWeight: 800,
    color: '#07152B',
    letterSpacing: '-0.015em',
  },
  panelSub: {
    fontSize: '12.5px',
    color: '#64748B',
    marginTop: '2px',
  },
  panelActionBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    backgroundColor: '#F8FAFC',
    border: '1px solid #E2E8F0',
    borderRadius: '8px',
    padding: '6px 12px',
    fontSize: '12px',
    fontWeight: 700,
    color: '#07152B',
    cursor: 'pointer',
    transition: 'all 0.15s ease',
  },
  feedList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  feedItem: {
    backgroundColor: '#F8FAFC',
    border: '1px solid #E2E8F0',
    borderRadius: '12px',
    padding: '14px 16px',
    cursor: 'pointer',
    transition: 'all 0.18s ease',
  },
  feedItemTop: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: '6px',
  },
  moduleTag: {
    fontSize: '10.5px',
    fontWeight: 750,
    textTransform: 'uppercase',
    padding: '2px 8px',
    borderRadius: '6px',
    backgroundColor: 'rgba(223, 183, 108, 0.16)',
    color: '#8C6A21',
    border: '1px solid rgba(223, 183, 108, 0.35)',
  },
  feedTime: {
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
    fontSize: '11px',
    color: '#94A3B8',
  },
  feedTitle: {
    fontSize: '14px',
    fontWeight: 750,
    color: '#07152B',
    marginBottom: '4px',
  },
  feedMeta: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    fontSize: '12px',
    color: '#64748B',
    marginBottom: '10px',
  },
  feedFooter: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: '8px',
    borderTop: '1px solid #EDF2F7',
  },
  feedStatusPill: {
    fontSize: '10.5px',
    fontWeight: 700,
    textTransform: 'uppercase',
    color: '#B45309',
    backgroundColor: '#FEF3C7',
    padding: '1px 7px',
    borderRadius: '999px',
  },
  feedCta: {
    display: 'flex',
    alignItems: 'center',
    gap: '3px',
    fontSize: '11.5px',
    fontWeight: 700,
    color: '#07152B',
  },
  feedEmpty: {
    padding: '36px 20px',
    textAlign: 'center',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '6px',
  },
  feedEmptyTitle: {
    fontSize: '14px',
    fontWeight: 750,
    color: '#07152B',
    marginTop: '6px',
  },
  feedEmptySub: {
    fontSize: '12px',
    color: '#64748B',
    maxWidth: '320px',
  },
  distribList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
    flex: 1,
  },
  distribRow: {
    cursor: 'pointer',
    padding: '8px 10px',
    borderRadius: '8px',
    transition: 'background-color 0.15s ease',
  },
  distribRowHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: '6px',
  },
  distribLabelGroup: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  distribColorDot: {
    width: '9px',
    height: '9px',
    borderRadius: '50%',
  },
  distribLabel: {
    fontSize: '13px',
    fontWeight: 650,
    color: '#07152B',
  },
  distribValueGroup: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
  },
  distribCount: {
    fontSize: '12.5px',
    fontWeight: 700,
    color: '#07152B',
  },
  distribPct: {
    fontSize: '11.5px',
    color: '#64748B',
  },
  distribTrack: {
    height: '7px',
    backgroundColor: '#F1F5F9',
    borderRadius: '999px',
    overflow: 'hidden',
  },
  distribFill: {
    height: '100%',
    borderRadius: '999px',
    transition: 'width 0.4s ease',
  },
  distribFooter: {
    paddingTop: '16px',
    marginTop: '16px',
    borderTop: '1px solid #F1F5F9',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  distribFooterText: {
    fontSize: '12px',
    color: '#64748B',
  },
  distribSecurityNote: {
    display: 'flex',
    alignItems: 'center',
    gap: '5px',
    fontSize: '11px',
    fontWeight: 600,
    color: '#059669',
  },
  sectionWrap: {
    marginTop: '8px',
  },
  sectionHeader: {
    marginBottom: '18px',
  },
  sectionTitleHeading: {
    fontSize: '18px',
    fontWeight: 800,
    color: '#07152B',
    margin: '0 0 4px 0',
    letterSpacing: '-0.02em',
  },
  sectionSubHeading: {
    fontSize: '13px',
    color: '#64748B',
    margin: 0,
  },
  catalogGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
    gap: '20px',
  },
  sectorCard: {
    backgroundColor: '#FFFFFF',
    border: '1px solid #E2E8F0',
    borderRadius: '14px',
    padding: '22px',
    display: 'flex',
    flexDirection: 'column',
    boxShadow: '0 2px 8px rgba(7, 21, 43, 0.03)',
    transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
  },
  sectorCardAccessible: {
    cursor: 'pointer',
  },
  sectorCardRestricted: {
    opacity: 0.65,
    cursor: 'not-allowed',
  },
  sectorCardTop: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: '14px',
  },
  sectorIconBox: {
    width: '40px',
    height: '40px',
    borderRadius: '10px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectorPendingBadge: {
    fontSize: '11px',
    fontWeight: 750,
    color: '#92400E',
    backgroundColor: '#FEF3C7',
    border: '1px solid #FDE68A',
    padding: '3px 8px',
    borderRadius: '999px',
  },
  sectorActiveBadge: {
    fontSize: '11px',
    fontWeight: 700,
    color: '#059669',
    backgroundColor: '#ECFDF5',
    border: '1px solid #A7F3D0',
    padding: '2px 8px',
    borderRadius: '999px',
  },
  sectorCardName: {
    fontSize: '14px',
    fontWeight: 750,
    color: '#07152B',
    marginBottom: '4px',
  },
  sectorCardValue: {
    fontSize: '30px',
    fontWeight: 850,
    color: '#07152B',
    letterSpacing: '-0.025em',
    lineHeight: 1.1,
    marginBottom: '8px',
  },
  sectorCardDesc: {
    fontSize: '12.5px',
    color: '#64748B',
    lineHeight: 1.45,
    margin: '0 0 16px 0',
    flex: 1,
  },
  sectorCardFooter: {
    borderTop: '1px solid #F1F5F9',
    paddingTop: '12px',
  },
  sectorCardLink: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    fontSize: '12px',
    fontWeight: 750,
    color: '#07152B',
  },
  sectorCardRestrictedLabel: {
    fontSize: '11.5px',
    fontWeight: 600,
    color: '#94A3B8',
  },
};
