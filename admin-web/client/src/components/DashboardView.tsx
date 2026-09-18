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

  const metricCards = [
    {
      id: 'destinations' as AppModule,
      label: 'Heritage Destinations',
      value: stats?.destinationsCount ?? 0,
      icon: Compass,
      desc: 'UNESCO sites & regional guides with GPS pins',
    },
    {
      id: 'services' as AppModule,
      label: 'Verified Service Partners',
      value: stats?.servicesCount ?? 0,
      icon: Briefcase,
      desc: 'Legal, health, logistics & concierge partners',
    },
    {
      id: 'events' as AppModule,
      label: 'Diaspora Events',
      value: stats?.eventsCount ?? 0,
      icon: Calendar,
      desc: 'Summits, cultural gatherings & festivals',
    },
    {
      id: 'marketplace' as AppModule,
      label: 'Artisan Marketplace Goods',
      value: stats?.productsCount ?? 0,
      icon: ShoppingBag,
      desc: 'Authentic crafts, textiles, coffee & jewelry',
    },
    {
      id: 'investments' as AppModule,
      label: 'Investment Opportunities',
      value: stats?.investmentsCount ?? 0,
      icon: TrendingUp,
      desc: 'Real estate, agriculture & renewable projects',
    },
    {
      id: 'team' as AppModule,
      label: 'Active Coordinators',
      value: stats?.adminTeamCount ?? 0,
      icon: Users,
      desc: 'Role-based administrative team members',
    },
  ];

  return (
    <div style={styles.container}>
      {/* Role Notice Banner */}
      <div style={styles.welcomeBanner}>
        <div style={styles.welcomeLeft}>
          <div style={styles.badgeRow}>
            <ShieldCheck size={16} color="#DFB76C" />
            <span style={styles.welcomeRole}>ACTIVE SESSION: {adminUser?.adminRole || 'SUPER_ADMIN'}</span>
          </div>
          <h1 style={styles.welcomeTitle}>Welcome back, {adminUser?.name}</h1>
          <p style={styles.welcomeDesc}>
            You are operating with{' '}
            <strong style={{ color: '#DFB76C' }}>{adminUser?.adminRole}</strong> authorization.
            {adminUser?.adminRole === 'SUPER_ADMIN'
              ? ' You have full platform control across all domains and team members.'
              : ' Your interface and management tools are specialized for your delegated area of responsibility.'}
          </p>
        </div>
      </div>

      {/* Primary Metrics Grid */}
      <div style={styles.sectionTitleRow}>
        <h3 style={styles.sectionHeading}>Platform Telemetry & Catalog Totals</h3>
        <span style={styles.sectionSub}>Live database records from PostgreSQL</span>
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
                  <Icon size={18} color="#DFB76C" />
                </div>
              </div>
              <div style={styles.cardValue}>{loading ? '...' : card.value}</div>
              <div style={styles.cardFooter}>
                <span style={styles.cardDesc}>{card.desc}</span>
                {accessible && (
                  <span style={styles.cardActionLink}>
                    <span>Manage</span>
                    <ArrowRight size={13} color="#DFB76C" />
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Inquiry & Activity Telemetry Bar */}
      <div style={styles.sectionTitleRow}>
        <h3 style={styles.sectionHeading}>Incoming Diaspora Inquiries & Orders</h3>
        <span style={styles.sectionSub}>Requests submitted via the DALEEL Mobile App</span>
      </div>

      <div style={styles.inquiriesGrid}>
        <div style={styles.inquiryCard}>
          <div style={styles.inquiryIcon}>
            <Briefcase size={16} color="#DFB76C" />
          </div>
          <div>
            <div style={styles.inquiryNumber}>{loading ? '...' : stats?.serviceInquiriesCount ?? 0}</div>
            <div style={styles.inquiryLabel}>Client Service Inquiries</div>
          </div>
        </div>

        <div style={styles.inquiryCard}>
          <div style={styles.inquiryIcon}>
            <ShoppingBag size={16} color="#DFB76C" />
          </div>
          <div>
            <div style={styles.inquiryNumber}>{loading ? '...' : stats?.productOrdersCount ?? 0}</div>
            <div style={styles.inquiryLabel}>Marketplace Order Inquiries</div>
          </div>
        </div>

        <div style={styles.inquiryCard}>
          <div style={styles.inquiryIcon}>
            <Calendar size={16} color="#DFB76C" />
          </div>
          <div>
            <div style={styles.inquiryNumber}>{loading ? '...' : stats?.eventRsvpsCount ?? 0}</div>
            <div style={styles.inquiryLabel}>Event Attendee RSVPs</div>
          </div>
        </div>

        <div style={styles.inquiryCard}>
          <div style={styles.inquiryIcon}>
            <TrendingUp size={16} color="#DFB76C" />
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
    backgroundColor: '#07152B',
    border: '1px solid rgba(223, 183, 108, 0.25)',
    borderRadius: '16px',
    padding: '24px 28px',
    backgroundImage: 'radial-gradient(ellipse 60% 80% at 90% 20%, rgba(223, 183, 108, 0.12), transparent)',
    boxShadow: '0 8px 30px rgba(0, 0, 0, 0.4)',
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
    backgroundColor: 'rgba(223, 183, 108, 0.1)',
    border: '1px solid rgba(223, 183, 108, 0.25)',
    padding: '4px 10px',
    borderRadius: '9999px',
    alignSelf: 'flex-start',
  },
  welcomeRole: {
    fontSize: '10.5px',
    fontWeight: 700,
    color: '#DFB76C',
    letterSpacing: '0.06em',
  },
  welcomeTitle: {
    fontSize: '22px',
    color: '#FFFFFF',
    margin: '4px 0',
  },
  welcomeDesc: {
    fontSize: '13px',
    color: '#9BB0D2',
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
    boxShadow: '0 2px 12px rgba(7, 21, 43, 0.05)',
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
    border: '1px solid rgba(223, 183, 108, 0.3)',
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
    boxShadow: '0 2px 10px rgba(7, 21, 43, 0.05)',
  },
  inquiryIcon: {
    width: '40px',
    height: '40px',
    borderRadius: '10px',
    backgroundColor: '#F8F4EC',
    border: '1px solid rgba(223, 183, 108, 0.25)',
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
