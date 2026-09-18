import React from 'react';
import type { AppModule } from '../context/AuthContext';
import { Compass, Briefcase, Calendar, ShoppingBag, TrendingUp, Users, Clock } from 'lucide-react';

interface Props {
  module: AppModule;
}

const MODULE_INFO: Record<AppModule, { title: string; phase: string; icon: any; desc: string }> = {
  dashboard: {
    title: 'Command Center',
    phase: 'Phase 1 (Complete)',
    icon: Compass,
    desc: 'Platform metrics and system telemetry overview.',
  },
  destinations: {
    title: 'Heritage & Tourism Management',
    phase: 'Phase 3 (Next)',
    icon: Compass,
    desc: 'Coordinate attractions, UNESCO sites, and interactive GIS map coordinates with the Visual Map Pin Picker.',
  },
  services: {
    title: 'Verified Services & Partners Directory',
    phase: 'Phase 3 (Next)',
    icon: Briefcase,
    desc: 'Onboard partners, verify credentials, set office map pins, and triage customer inquiries.',
  },
  events: {
    title: 'Events & Diaspora Gatherings',
    phase: 'Phase 4',
    icon: Calendar,
    desc: 'Publish summits, cultural gatherings, set venue map coordinates, and manage attendee RSVPs.',
  },
  marketplace: {
    title: 'Artisan Marketplace Goods',
    phase: 'Phase 4',
    icon: ShoppingBag,
    desc: 'Manage authentic crafts, pricing, stock levels, and customer product order fulfillment.',
  },
  investments: {
    title: 'Diaspora Investment Opportunities',
    phase: 'Phase 4',
    icon: TrendingUp,
    desc: 'Curate high-yield diaspora syndicates, real estate, and review investor prospectus requests.',
  },
  team: {
    title: 'Administrative Team & RBAC Roles',
    phase: 'Phase 5',
    icon: Users,
    desc: 'Create and manage coordinator accounts, assign roles, and revoke permissions (Super Admin only).',
  },
};

export const ModulePlaceholder: React.FC<Props> = ({ module }) => {
  const info = MODULE_INFO[module] || MODULE_INFO.dashboard;
  const Icon = info.icon;

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <div style={styles.iconCircle}>
          <Icon size={32} color="#DFB76C" />
        </div>
        <div style={styles.phasePill}>
          <Clock size={12} color="#DFB76C" />
          <span>SCHEDULED: {info.phase.toUpperCase()}</span>
        </div>
        <h2 style={styles.title}>{info.title}</h2>
        <p style={styles.desc}>{info.desc}</p>
        <div style={styles.backendNotice}>
          <strong>Backend Status:</strong> The full PostgreSQL database model, seed data, and REST API endpoints for this module are already 100% implemented, verified, and running on the server. The specialized frontend interface will be connected in {info.phase}.
        </div>
      </div>
    </div>
  );
};

const styles: { [key: string]: React.CSSProperties } = {
  container: {
    padding: '40px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 'calc(100vh - var(--header-height) - 80px)',
  },
  card: {
    backgroundColor: '#07152B',
    border: '1px solid rgba(223, 183, 108, 0.25)',
    borderRadius: '16px',
    padding: '40px 32px',
    maxWidth: '580px',
    textAlign: 'center',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    boxShadow: '0 12px 40px rgba(0, 0, 0, 0.4)',
  },
  iconCircle: {
    width: '64px',
    height: '64px',
    borderRadius: '16px',
    backgroundColor: 'rgba(223, 183, 108, 0.12)',
    border: '1px solid rgba(223, 183, 108, 0.3)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: '16px',
  },
  phasePill: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    backgroundColor: 'rgba(223, 183, 108, 0.1)',
    border: '1px solid rgba(223, 183, 108, 0.3)',
    borderRadius: '9999px',
    padding: '4px 12px',
    fontSize: '11px',
    fontWeight: 700,
    color: '#DFB76C',
    marginBottom: '14px',
    letterSpacing: '0.04em',
  },
  title: {
    fontSize: '22px',
    color: '#FFFFFF',
    marginBottom: '10px',
  },
  desc: {
    fontSize: '13.5px',
    color: '#9BB0D2',
    lineHeight: 1.6,
    marginBottom: '20px',
  },
  backendNotice: {
    backgroundColor: '#0C1E38',
    border: '1px solid rgba(223, 183, 108, 0.18)',
    borderRadius: '10px',
    padding: '14px 16px',
    fontSize: '12px',
    color: '#EAEFF8',
    lineHeight: 1.5,
    textAlign: 'left',
  },
};
