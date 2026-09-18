import React, { useEffect, useState } from 'react';
import { adminApi } from '../api';
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
} from 'lucide-react';

interface DashboardViewProps {
  onNavigate: (tab: AppModule) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({ onNavigate }) => {
  const { adminUser, canAccess } = useAdminAuth();
  const [stats, setStats] = useState<PlatformStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    adminApi
      .getStats()
      .then(setStats)
      .catch((err) => console.error('Failed to load stats:', err))
      .finally(() => setLoading(false));
  }, []);

  const getRoleTitle = (role?: string) => {
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

  const metricCards = [
    {
      id: 'destinations' as AppModule,
      label: 'Heritage Destinations',
      value: stats?.destinationsCount ?? 0,
      icon: Compass,
      desc: 'UNESCO cultural sites, regional guides & coordinates',
    },
    {
      id: 'services' as AppModule,
      label: 'Verified Partners',
      value: stats?.servicesCount ?? 0,
      icon: Briefcase,
      desc: 'Certified legal, health, banking & relocation partners',
    },
    {
      id: 'events' as AppModule,
      label: 'Events & Gatherings',
      value: stats?.eventsCount ?? 0,
      icon: Calendar,
      desc: 'Diaspora summits, cultural celebrations & festivals',
    },
    {
      id: 'marketplace' as AppModule,
      label: 'Artisan Goods',
      value: stats?.productsCount ?? 0,
      icon: ShoppingBag,
      desc: 'Authentic crafts, apparel, coffee & jewelry',
    },
    {
      id: 'investments' as AppModule,
      label: 'Investment Deals',
      value: stats?.investmentsCount ?? 0,
      icon: TrendingUp,
      desc: 'High-yield agro, real estate & energy projects',
    },
    {
      id: 'team' as AppModule,
      label: 'Active Coordinators',
      value: stats?.adminTeamCount ?? 0,
      icon: Users,
      desc: 'Authorized management staff and coordinators',
    },
  ];

  return (
    <div style={styles.container}>
      {/* Welcome Banner */}
      <div style={styles.welcomeBanner}>
        <div style={styles.welcomeLeft}>
          <div style={styles.badgeRow}>
            <ShieldCheck size={15} color="#8C6A21" />
            <span style={styles.welcomeRole}>AUTHORIZED SESSION: {getRoleTitle(adminUser?.adminRole)}</span>
          </div>
          <h1 style={styles.welcomeTitle}>Welcome back, {adminUser?.name}</h1>
          <p style={styles.welcomeDesc}>
            Manage and oversee Ethiopian heritage destinations, verified service partners, cultural gatherings, and artisan marketplace inquiries.
          </p>
        </div>
      </div>

      {/* Primary Metrics Section */}
      <div style={styles.sectionTitleRow}>
        <h3 style={styles.sectionHeading}>Platform Catalog & Services</h3>
        <span style={styles.sectionSub}>Active listings across all regional categories</span>
      </div>

      <div style={styles.grid}>
        {metricCards.map((card) => {
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
              <div style={styles.cardHeader}>
                <span style={styles.cardLabel}>{card.label}</span>
                <div style={styles.cardIconWrap}>
                  <Icon size={18} color="#8C6A21" />
                </div>
              </div>
              <div style={styles.cardValue}>{loading ? '...' : card.value}</div>
              <div style={styles.cardFooter}>
                <span style={styles.cardDesc}>{card.desc}</span>
                {accessible && (
                  <span style={styles.cardActionLink}>
                    <span>Open</span>
                    <ArrowRight size={13} color="#8C6A21" />
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Inquiries & Requests Section */}
      <div style={styles.sectionTitleRow}>
        <h3 style={styles.sectionHeading}>Customer Requests & Inquiries</h3>
        <span style={styles.sectionSub}>Live requests submitted from the mobile app</span>
      </div>

      <div style={styles.inquiriesGrid}>
        <div style={styles.inquiryCard}>
          <div style={styles.inquiryIcon}>
            <Briefcase size={17} color="#8C6A21" />
          </div>
          <div>
            <div style={styles.inquiryNumber}>{loading ? '...' : stats?.serviceInquiriesCount ?? 0}</div>
            <div style={styles.inquiryLabel}>Client Service Inquiries</div>
          </div>
        </div>

        <div style={styles.inquiryCard}>
          <div style={styles.inquiryIcon}>
            <ShoppingBag size={17} color="#8C6A21" />
          </div>
          <div>
            <div style={styles.inquiryNumber}>{loading ? '...' : stats?.productOrdersCount ?? 0}</div>
            <div style={styles.inquiryLabel}>Marketplace Order Inquiries</div>
          </div>
        </div>

        <div style={styles.inquiryCard}>
          <div style={styles.inquiryIcon}>
            <Calendar size={17} color="#8C6A21" />
          </div>
          <div>
            <div style={styles.inquiryNumber}>{loading ? '...' : stats?.eventRsvpsCount ?? 0}</div>
            <div style={styles.inquiryLabel}>Event Attendee RSVPs</div>
          </div>
        </div>

        <div style={styles.inquiryCard}>
          <div style={styles.inquiryIcon}>
            <TrendingUp size={17} color="#8C6A21" />
          </div>
          <div>
            <div style={styles.inquiryNumber}>{loading ? '...' : stats?.investmentInquiriesCount ?? 0}</div>
            <div style={styles.inquiryLabel}>Prospectus Inquiries</div>
          </div>
        </div>
      </div>
    </div>
  );
};

const styles: { [key: string]: React.CSSProperties } = {
  container: {
    padding: '32px',
    maxWidth: '1300px',
    margin: '0 auto',
    display: 'flex',
    flexDirection: 'column',
    gap: '28px',
  },
  welcomeBanner: {
    backgroundColor: '#FFFFFF',
    border: '1px solid #E4E9F0',
    borderLeft: '5px solid #DFB76C',
    borderRadius: '16px',
    padding: '24px 28px',
    boxShadow: '0 2px 10px rgba(7, 21, 43, 0.04)',
  },
  welcomeLeft: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  badgeRow: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    backgroundColor: '#F8F4EC',
    border: '1px solid #E0C582',
    padding: '4px 12px',
    borderRadius: '9999px',
    alignSelf: 'flex-start',
  },
  welcomeRole: {
    fontSize: '11px',
    fontWeight: 700,
    color: '#8C6A21',
    letterSpacing: '0.04em',
  },
  welcomeTitle: {
    fontFamily: "'DM Serif Display', Georgia, serif",
    fontSize: '26px',
    color: '#07152B',
    fontWeight: 400,
    margin: '4px 0',
  },
  welcomeDesc: {
    fontSize: '13.5px',
    color: '#475569',
    maxWidth: '780px',
    lineHeight: 1.6,
  },
  sectionTitleRow: {
    display: 'flex',
    alignItems: 'baseline',
    gap: '12px',
    marginTop: '4px',
  },
  sectionHeading: {
    fontSize: '18px',
    fontWeight: 700,
    color: '#07152B',
    margin: 0,
  },
  sectionSub: {
    fontSize: '12.5px',
    color: '#5A687A',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: '18px',
  },
  card: {
    backgroundColor: '#FFFFFF',
    border: '1px solid #E4E9F0',
    borderRadius: '14px',
    padding: '22px',
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
    boxShadow: '0 2px 10px rgba(7, 21, 43, 0.04)',
    transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
  },
  cardAccessible: {
    cursor: 'pointer',
    borderLeft: '4px solid #DFB76C',
  },
  cardRestricted: {
    opacity: 0.65,
    filter: 'grayscale(30%)',
    cursor: 'not-allowed',
  },
  cardHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  cardLabel: {
    fontSize: '13.5px',
    fontWeight: 700,
    color: '#07152B',
  },
  cardIconWrap: {
    width: '36px',
    height: '36px',
    borderRadius: '10px',
    backgroundColor: '#F8F4EC',
    border: '1px solid #E0C582',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardValue: {
    fontSize: '32px',
    fontWeight: 800,
    color: '#07152B',
    letterSpacing: '-0.02em',
    fontVariantNumeric: 'tabular-nums',
  },
  cardFooter: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: '10px',
    borderTop: '1px solid #EAEFF6',
  },
  cardDesc: {
    fontSize: '11.5px',
    color: '#5A687A',
  },
  cardActionLink: {
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
    fontSize: '12px',
    fontWeight: 700,
    color: '#8C6A21',
  },
  inquiriesGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(4, 1fr)',
    gap: '16px',
  },
  inquiryCard: {
    backgroundColor: '#FFFFFF',
    border: '1px solid #E4E9F0',
    borderRadius: '14px',
    padding: '18px',
    display: 'flex',
    alignItems: 'center',
    gap: '14px',
    boxShadow: '0 2px 10px rgba(7, 21, 43, 0.04)',
  },
  inquiryIcon: {
    width: '40px',
    height: '40px',
    borderRadius: '10px',
    backgroundColor: '#F8F4EC',
    border: '1px solid #E0C582',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  inquiryNumber: {
    fontSize: '22px',
    fontWeight: 800,
    color: '#07152B',
  },
  inquiryLabel: {
    fontSize: '12px',
    color: '#5A687A',
    marginTop: '2px',
    fontWeight: 500,
  },
};
