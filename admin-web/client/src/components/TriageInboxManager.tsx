import React, { useEffect, useState } from 'react';
import { adminApi, type UnifiedInquiryItem } from '../api';
import { useAdminAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import {
  Inbox,
  Search,
  Briefcase,
  Calendar,
  ShoppingBag,
  TrendingUp,
  RefreshCw,
  Mail,
  Phone,
  MessageSquare,
  X,
  ShieldCheck,
  MapPin,
} from 'lucide-react';

export const TriageInboxManager: React.FC = () => {
  const { adminUser } = useAdminAuth();
  const { success, error: toastError } = useToast();

  const [inquiries, setInquiries] = useState<UnifiedInquiryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDepartment, setSelectedDepartment] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  // In-Page Inspection Panel (STRICTLY NO POPUPS)
  const [inspectingItem, setInspectingItem] = useState<UnifiedInquiryItem | null>(null);

  const isSuperAdmin = adminUser?.adminRole === 'SUPER_ADMIN';

  const loadInquiries = async () => {
    setLoading(true);
    try {
      const data = await adminApi.getUnifiedInquiries({
        department: isSuperAdmin ? (selectedDepartment !== 'all' ? selectedDepartment : undefined) : undefined,
        status: selectedStatus !== 'all' ? selectedStatus : undefined,
        search: searchTerm.trim() || undefined,
      });
      setInquiries(data.inquiries);
    } catch (err: any) {
      toastError(err.message || 'Unable to retrieve incoming customer requests.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timeout = setTimeout(() => {
      loadInquiries();
    }, 200);
    return () => clearTimeout(timeout);
  }, [searchTerm, selectedDepartment, selectedStatus]);

  const handleUpdateStatus = async (item: UnifiedInquiryItem, newStatus: string) => {
    setUpdatingId(item.id);
    try {
      await adminApi.updateUnifiedInquiryStatus(item.module, item.id, newStatus);
      setInquiries((prev) =>
        prev.map((inq) => (inq.id === item.id ? { ...inq, status: newStatus } : inq))
      );
      if (inspectingItem?.id === item.id) {
        setInspectingItem((prev) => (prev ? { ...prev, status: newStatus } : null));
      }
      success(`Request status updated to "${newStatus.replace(/_/g, ' ')}". Customer notified via email and in-app.`);
    } catch (err: any) {
      toastError(err.message || 'Failed to update request status.');
    } finally {
      setUpdatingId(null);
    }
  };

  const getRoleTitle = (role?: string) => {
    switch (role) {
      case 'SUPER_ADMIN':
        return 'Executive Master Triage Desk';
      case 'SERVICE_MANAGER':
        return 'Services Partner Triage Desk';
      case 'EVENT_MANAGER':
        return 'Events & Gatherings Triage Desk';
      case 'MARKETPLACE_MANAGER':
        return 'Artisan Marketplace Triage Desk';
      case 'INVESTMENT_OFFICER':
        return 'Diaspora Investments Triage Desk';
      default:
        return 'Department Triage Desk';
    }
  };

  const getRoleSubtitle = (role?: string) => {
    switch (role) {
      case 'SUPER_ADMIN':
        return 'Cross-departmental command overseeing incoming service inquiries, event RSVPs, artisan marketplace orders, and diaspora investment requests.';
      case 'SERVICE_MANAGER':
        return 'Live client inquiries submitted for certified legal, healthcare, banking, relocation, and tourism concierge partners.';
      case 'EVENT_MANAGER':
        return 'Guest RSVPs and ticket requests submitted for diaspora summits, heritage festivals, and cultural gatherings.';
      case 'MARKETPLACE_MANAGER':
        return 'Patron purchase inquiries and delivery coordination requests submitted for authentic Ethiopian artisan goods.';
      case 'INVESTMENT_OFFICER':
        return 'Investor inquiries and prospectus requests submitted for high-yield Ethiopian developmental and commercial ventures.';
      default:
        return 'Incoming customer requests assigned to your departmental jurisdiction.';
    }
  };

  const getModuleBadge = (module: string) => {
    switch (module) {
      case 'SERVICES':
        return {
          icon: Briefcase,
          label: 'Verified Service',
          bg: 'rgba(223, 183, 108, 0.12)',
          color: '#DFB76C',
          border: '1px solid rgba(223, 183, 108, 0.3)',
        };
      case 'EVENTS':
        return {
          icon: Calendar,
          label: 'Event Gathering',
          bg: 'rgba(96, 165, 250, 0.12)',
          color: '#93C5FD',
          border: '1px solid rgba(96, 165, 250, 0.3)',
        };
      case 'MARKETPLACE':
        return {
          icon: ShoppingBag,
          label: 'Artisan Marketplace',
          bg: 'rgba(52, 211, 153, 0.12)',
          color: '#6EE7B7',
          border: '1px solid rgba(52, 211, 153, 0.3)',
        };
      case 'INVESTMENTS':
        return {
          icon: TrendingUp,
          label: 'Diaspora Investment',
          bg: 'rgba(167, 139, 250, 0.12)',
          color: '#C4B5FD',
          border: '1px solid rgba(167, 139, 250, 0.3)',
        };
      default:
        return {
          icon: Inbox,
          label: 'Inquiry',
          bg: 'rgba(148, 163, 184, 0.12)',
          color: '#CBD5E1',
          border: '1px solid #334155',
        };
    }
  };

  const getStatusBadge = (status: string) => {
    const s = status.toLowerCase();
    if (s.includes('pend')) {
      return {
        label: 'Pending Review',
        bg: 'rgba(245, 158, 11, 0.12)',
        color: '#FBBF24',
        border: '1px solid rgba(245, 158, 11, 0.3)',
      };
    }
    if (s.includes('contact') || s.includes('review')) {
      return {
        label: s.replace(/_/g, ' ').toUpperCase(),
        bg: 'rgba(96, 165, 250, 0.12)',
        color: '#93C5FD',
        border: '1px solid rgba(96, 165, 250, 0.3)',
      };
    }
    if (s.includes('confirm') || s.includes('complet')) {
      return {
        label: s.replace(/_/g, ' ').toUpperCase(),
        bg: 'rgba(16, 185, 129, 0.12)',
        color: '#34D399',
        border: '1px solid rgba(16, 185, 129, 0.3)',
      };
    }
    if (s.includes('cancel')) {
      return {
        label: 'Cancelled',
        bg: 'rgba(239, 68, 68, 0.12)',
        color: '#F87171',
        border: '1px solid rgba(239, 68, 68, 0.3)',
      };
    }
    return {
      label: s.toUpperCase(),
      bg: 'rgba(148, 163, 184, 0.12)',
      color: '#CBD5E1',
      border: '1px solid #334155',
    };
  };

  return (
    <div style={styles.container}>
      {/* Banner */}
      <div style={styles.banner}>
        <div>
          <div style={styles.badgeRow}>
            <ShieldCheck size={14} color="#8C6A21" />
            <span style={styles.bannerBadge}>
              ROLE SCOPE: {adminUser?.adminRole ? adminUser.adminRole.replace(/_/g, ' ') : 'AUTHORIZED LEAD'}
            </span>
          </div>
          <h1 style={styles.title}>{getRoleTitle(adminUser?.adminRole)}</h1>
          <p style={styles.subtitle}>{getRoleSubtitle(adminUser?.adminRole)}</p>
        </div>

        <button style={styles.refreshBtn} onClick={loadInquiries} title="Check for new submissions">
          <RefreshCw size={15} color="#DFB76C" />
          <span>Refresh Live Submissions</span>
        </button>
      </div>

      {/* Toolbar */}
      <div style={styles.toolbar}>
        <div style={styles.searchBox}>
          <Search size={16} color="#64748B" />
          <input
            style={styles.searchInput}
            placeholder="Search by customer name, email, or item title..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          {searchTerm && (
            <button style={styles.clearBtn} onClick={() => setSearchTerm('')}>
              <X size={14} color="#94A3B8" />
            </button>
          )}
        </div>

        {/* Department Switcher (Super Admin only) */}
        {isSuperAdmin && (
          <div style={styles.filterPills}>
            <button
              style={{
                ...styles.filterPill,
                ...(selectedDepartment === 'all' ? styles.filterPillActive : {}),
              }}
              onClick={() => setSelectedDepartment('all')}
            >
              All Departments
            </button>
            <button
              style={{
                ...styles.filterPill,
                ...(selectedDepartment === 'services' ? styles.filterPillActive : {}),
              }}
              onClick={() => setSelectedDepartment('services')}
            >
              Services
            </button>
            <button
              style={{
                ...styles.filterPill,
                ...(selectedDepartment === 'events' ? styles.filterPillActive : {}),
              }}
              onClick={() => setSelectedDepartment('events')}
            >
              Events
            </button>
            <button
              style={{
                ...styles.filterPill,
                ...(selectedDepartment === 'marketplace' ? styles.filterPillActive : {}),
              }}
              onClick={() => setSelectedDepartment('marketplace')}
            >
              Marketplace
            </button>
            <button
              style={{
                ...styles.filterPill,
                ...(selectedDepartment === 'investments' ? styles.filterPillActive : {}),
              }}
              onClick={() => setSelectedDepartment('investments')}
            >
              Investments
            </button>
          </div>
        )}

        {/* Status Filters */}
        <div style={styles.filterPills}>
          <button
            style={{
              ...styles.filterPill,
              ...(selectedStatus === 'all' ? styles.filterPillActive : {}),
            }}
            onClick={() => setSelectedStatus('all')}
          >
            All Statuses
          </button>
          <button
            style={{
              ...styles.filterPill,
              ...(selectedStatus === 'pending' ? styles.filterPillActive : {}),
            }}
            onClick={() => setSelectedStatus('pending')}
          >
            Pending
          </button>
          <button
            style={{
              ...styles.filterPill,
              ...(selectedStatus === 'contacted' ? styles.filterPillActive : {}),
            }}
            onClick={() => setSelectedStatus('contacted')}
          >
            Contacted
          </button>
          <button
            style={{
              ...styles.filterPill,
              ...(selectedStatus === 'completed' ? styles.filterPillActive : {}),
            }}
            onClick={() => setSelectedStatus('completed')}
          >
            Completed
          </button>
        </div>
      </div>

      {/* Main Workspace (Side-by-side with In-Page Drawer) */}
      <div style={styles.workspaceRow}>
        {/* Triage Stream */}
        <div style={{ ...styles.streamWrapper, ...(inspectingItem ? styles.streamWrapperShrunk : {}) }}>
          {loading ? (
            <div style={styles.loadingBox}>
              <RefreshCw size={22} color="#DFB76C" style={{ animation: 'spin 1.2s linear infinite' }} />
              <span style={styles.loadingText}>Fetching department submissions...</span>
            </div>
          ) : inquiries.length === 0 ? (
            <div style={styles.emptyBox}>
              <Inbox size={40} color="#64748B" />
              <div style={styles.emptyTitle}>No pending customer submissions found</div>
              <div style={styles.emptySub}>
                New customer inquiries, reservations, and orders will appear here in real time.
              </div>
            </div>
          ) : (
            <div style={styles.cardList}>
              {inquiries.map((item) => {
                const badge = getModuleBadge(item.module);
                const statusBadge = getStatusBadge(item.status);
                const isSelected = inspectingItem?.id === item.id;
                const ModuleIcon = badge.icon;

                return (
                  <div
                    key={`${item.module}-${item.id}`}
                    style={{
                      ...styles.card,
                      ...(isSelected ? styles.cardSelected : {}),
                    }}
                  >
                    <div style={styles.cardTopRow}>
                      <div style={styles.badgeGroup}>
                        <span
                          style={{
                            ...styles.moduleBadge,
                            backgroundColor: badge.bg,
                            color: badge.color,
                            border: badge.border,
                          }}
                        >
                          <ModuleIcon size={12} color={badge.color} />
                          <span>{badge.label}</span>
                        </span>

                        <span
                          style={{
                            ...styles.statusBadge,
                            backgroundColor: statusBadge.bg,
                            color: statusBadge.color,
                            border: statusBadge.border,
                          }}
                        >
                          {statusBadge.label}
                        </span>
                      </div>

                      <div style={styles.timeText}>
                        {new Date(item.createdAt).toLocaleDateString(undefined, {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </div>
                    </div>

                    {/* Listing Title */}
                    <div style={styles.cardTitle}>{item.title}</div>

                    {/* Customer Info Bar */}
                    <div style={styles.customerRow}>
                      <div style={styles.customerName}>{item.customerName}</div>
                      <span style={styles.dot}>•</span>
                      <a href={`mailto:${item.customerEmail}`} style={styles.contactLink}>
                        <Mail size={12} color="#8C6A21" />
                        <span>{item.customerEmail}</span>
                      </a>
                      {item.customerPhone && (
                        <>
                          <span style={styles.dot}>•</span>
                          <a href={`tel:${item.customerPhone}`} style={styles.contactLink}>
                            <Phone size={12} color="#8C6A21" />
                            <span>{item.customerPhone}</span>
                          </a>
                        </>
                      )}
                    </div>

                    {/* Specific Details Preview */}
                    <div style={styles.detailsPreview}>
                      {item.details.message && (
                        <div style={styles.messageText}>"{item.details.message}"</div>
                      )}
                      {item.details.notes && (
                        <div style={styles.messageText}>Note: {item.details.notes}</div>
                      )}
                      {item.details.deliveryAddress && (
                        <div style={styles.deliveryText}>
                          <MapPin size={12} color="#DFB76C" />
                          <span>Delivery Address: {item.details.deliveryAddress}</span>
                        </div>
                      )}
                      {item.details.ticketsCount && (
                        <div style={styles.tagText}>Tickets Requested: {item.details.ticketsCount}</div>
                      )}
                      {item.details.investmentBudget && (
                        <div style={styles.tagText}>Target Allocation: {item.details.investmentBudget}</div>
                      )}
                    </div>

                    {/* Quick Action Status Triage Bar */}
                    <div style={styles.cardFooter}>
                      <div style={styles.actionButtonGroup}>
                        <span style={styles.actionPrompt}>Triage:</span>

                        {item.status.toLowerCase() !== 'contacted' && (
                          <button
                            style={styles.statusActionBtn}
                            disabled={updatingId === item.id}
                            onClick={() => handleUpdateStatus(item, 'CONTACTED')}
                          >
                            Mark Contacted
                          </button>
                        )}

                        {item.status.toLowerCase() !== 'completed' &&
                          item.status.toLowerCase() !== 'confirmed' && (
                            <button
                              style={{ ...styles.statusActionBtn, ...styles.statusActionBtnSuccess }}
                              disabled={updatingId === item.id}
                              onClick={() => handleUpdateStatus(item, 'COMPLETED')}
                            >
                              Mark Completed
                            </button>
                          )}

                        {item.status.toLowerCase() !== 'cancelled' && (
                          <button
                            style={{ ...styles.statusActionBtn, ...styles.statusActionBtnCancel }}
                            disabled={updatingId === item.id}
                            onClick={() => handleUpdateStatus(item, 'CANCELLED')}
                          >
                            Cancel
                          </button>
                        )}
                      </div>

                      <button
                        style={{
                          ...styles.inspectBtn,
                          ...(isSelected ? styles.inspectBtnActive : {}),
                        }}
                        onClick={() => setInspectingItem(isSelected ? null : item)}
                      >
                        {isSelected ? 'Hide Details' : 'Inspect Full File'}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Dedicated In-Page Inspection Panel (STRICTLY NO POPUPS) */}
        {inspectingItem && (
          <aside style={styles.inspectorPanel}>
            <div style={styles.inspectorHeader}>
              <div style={styles.inspectorTitleRow}>
                <Inbox size={16} color="#DFB76C" />
                <span style={styles.inspectorTitle}>Submission Dossier</span>
              </div>
              <button style={styles.inspectorCloseBtn} onClick={() => setInspectingItem(null)}>
                <X size={16} color="#94A3B8" />
              </button>
            </div>

            <div style={styles.inspectorBody}>
              <div style={styles.inspectorTop}>
                <div style={styles.inspectorModuleTitle}>{inspectingItem.title}</div>
                <div style={styles.badgeRow}>
                  <span
                    style={{
                      ...styles.moduleBadge,
                      ...getModuleBadge(inspectingItem.module),
                    }}
                  >
                    {inspectingItem.moduleLabel}
                  </span>
                  <span
                    style={{
                      ...styles.statusBadge,
                      ...getStatusBadge(inspectingItem.status),
                    }}
                  >
                    {getStatusBadge(inspectingItem.status).label}
                  </span>
                </div>
              </div>

              {/* Customer Contact Card */}
              <div style={styles.inspectorSection}>
                <div style={styles.sectionHeading}>Customer Contact Details</div>
                <div style={styles.contactCard}>
                  <div style={styles.contactName}>{inspectingItem.customerName}</div>
                  <div style={styles.contactActionRow}>
                    <a href={`mailto:${inspectingItem.customerEmail}`} style={styles.contactActionButton}>
                      <Mail size={13} color="#DFB76C" />
                      <span>Email Customer</span>
                    </a>
                    {inspectingItem.customerPhone && (
                      <a href={`tel:${inspectingItem.customerPhone}`} style={styles.contactActionButton}>
                        <Phone size={13} color="#DFB76C" />
                        <span>Call Customer</span>
                      </a>
                    )}
                    {inspectingItem.customerWhatsapp && (
                      <a
                        href={`https://wa.me/${inspectingItem.customerWhatsapp.replace(/[^0-9]/g, '')}`}
                        target="_blank"
                        rel="noreferrer"
                        style={styles.contactActionButton}
                      >
                        <MessageSquare size={13} color="#34D399" />
                        <span>WhatsApp</span>
                      </a>
                    )}
                  </div>
                </div>
              </div>

              {/* Request Metadata */}
              <div style={styles.inspectorSection}>
                <div style={styles.sectionHeading}>Request Specifications</div>
                <div style={styles.specGrid}>
                  {Object.entries(inspectingItem.details).map(([key, value]) => {
                    if (!value) return null;
                    return (
                      <div key={key} style={styles.specRow}>
                        <div style={styles.specKey}>
                          {key.replace(/([A-Z])/g, ' $1').toUpperCase()}:
                        </div>
                        <div style={styles.specValue}>{String(value)}</div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Instant Status Decision */}
              <div style={styles.inspectorSection}>
                <div style={styles.sectionHeading}>Update Triage Status</div>
                <div style={styles.statusDecisionGrid}>
                  {['PENDING', 'IN_REVIEW', 'CONTACTED', 'COMPLETED', 'CANCELLED'].map((st) => (
                    <button
                      key={st}
                      style={{
                        ...styles.decisionBtn,
                        ...(inspectingItem.status.toUpperCase() === st ? styles.decisionBtnActive : {}),
                      }}
                      disabled={updatingId === inspectingItem.id}
                      onClick={() => handleUpdateStatus(inspectingItem, st)}
                    >
                      {st.replace(/_/g, ' ')}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </aside>
        )}
      </div>
    </div>
  );
};

const styles: { [key: string]: React.CSSProperties } = {
  container: {
    padding: '32px',
    color: '#F8FAFC',
    maxWidth: '1600px',
    margin: '0 auto',
  },
  banner: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: '24px',
    backgroundColor: '#0B1729',
    padding: '24px 28px',
    borderRadius: '16px',
    border: '1px solid rgba(223, 183, 108, 0.25)',
    boxShadow: '0 8px 30px rgba(0, 0, 0, 0.35)',
  },
  badgeRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    marginBottom: '8px',
  },
  bannerBadge: {
    fontSize: '11px',
    fontWeight: 700,
    letterSpacing: '0.08em',
    color: '#DFB76C',
    textTransform: 'uppercase',
  },
  title: {
    fontSize: '26px',
    fontWeight: 800,
    color: '#FFFFFF',
    margin: '0 0 6px 0',
  },
  subtitle: {
    fontSize: '14px',
    color: '#94A3B8',
    margin: 0,
    maxWidth: '750px',
    lineHeight: 1.5,
  },
  refreshBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '10px 18px',
    backgroundColor: 'rgba(223, 183, 108, 0.1)',
    border: '1px solid rgba(223, 183, 108, 0.3)',
    borderRadius: '10px',
    color: '#DFB76C',
    fontSize: '13px',
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'all 0.2s ease',
  },
  toolbar: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '16px',
    marginBottom: '20px',
    flexWrap: 'wrap',
  },
  searchBox: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    backgroundColor: '#0B1729',
    border: '1px solid #1E293B',
    borderRadius: '10px',
    padding: '10px 16px',
    flex: '1 1 340px',
  },
  searchInput: {
    background: 'none',
    border: 'none',
    outline: 'none',
    color: '#FFFFFF',
    fontSize: '13px',
    width: '100%',
  },
  clearBtn: {
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    padding: '2px',
    display: 'flex',
    alignItems: 'center',
  },
  filterPills: {
    display: 'flex',
    gap: '6px',
    backgroundColor: '#0B1729',
    padding: '4px',
    borderRadius: '10px',
    border: '1px solid #1E293B',
  },
  filterPill: {
    background: 'none',
    border: 'none',
    padding: '7px 14px',
    borderRadius: '8px',
    color: '#94A3B8',
    fontSize: '12px',
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'all 0.2s ease',
  },
  filterPillActive: {
    backgroundColor: 'rgba(223, 183, 108, 0.15)',
    color: '#DFB76C',
    fontWeight: 700,
  },
  workspaceRow: {
    display: 'flex',
    gap: '20px',
    alignItems: 'flex-start',
  },
  streamWrapper: {
    flex: 1,
    transition: 'all 0.3s ease',
    minWidth: 0,
  },
  streamWrapperShrunk: {
    flex: '1 1 65%',
  },
  loadingBox: {
    padding: '80px 20px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '14px',
    backgroundColor: '#0B1729',
    borderRadius: '14px',
    border: '1px solid #1E293B',
  },
  loadingText: {
    fontSize: '14px',
    color: '#94A3B8',
    fontWeight: 500,
  },
  emptyBox: {
    padding: '80px 20px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '10px',
    backgroundColor: '#0B1729',
    borderRadius: '14px',
    border: '1px solid #1E293B',
  },
  emptyTitle: {
    fontSize: '16px',
    fontWeight: 700,
    color: '#E2E8F0',
  },
  emptySub: {
    fontSize: '13px',
    color: '#64748B',
  },
  cardList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '14px',
  },
  card: {
    backgroundColor: '#0B1729',
    border: '1px solid #1E293B',
    borderRadius: '14px',
    padding: '20px 24px',
    boxShadow: '0 4px 18px rgba(0, 0, 0, 0.2)',
    transition: 'all 0.2s ease',
  },
  cardSelected: {
    border: '1px solid #DFB76C',
    backgroundColor: 'rgba(223, 183, 108, 0.04)',
  },
  cardTopRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '10px',
  },
  badgeGroup: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  moduleBadge: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    padding: '4px 10px',
    borderRadius: '8px',
    fontSize: '11px',
    fontWeight: 700,
  },
  statusBadge: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '4px',
    padding: '4px 10px',
    borderRadius: '20px',
    fontSize: '11px',
    fontWeight: 700,
  },
  timeText: {
    fontSize: '12px',
    color: '#64748B',
  },
  cardTitle: {
    fontSize: '17px',
    fontWeight: 700,
    color: '#FFFFFF',
    marginBottom: '8px',
  },
  customerRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    flexWrap: 'wrap',
    marginBottom: '12px',
  },
  customerName: {
    fontSize: '13px',
    fontWeight: 700,
    color: '#DFB76C',
  },
  dot: {
    color: '#475569',
    fontSize: '12px',
  },
  contactLink: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '5px',
    color: '#94A3B8',
    textDecoration: 'none',
    fontSize: '12px',
  },
  detailsPreview: {
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    border: '1px solid rgba(255, 255, 255, 0.04)',
    borderRadius: '10px',
    padding: '12px 16px',
    marginBottom: '16px',
    fontSize: '13px',
    color: '#E2E8F0',
  },
  messageText: {
    fontStyle: 'italic',
    lineHeight: 1.5,
    color: '#CBD5E1',
  },
  deliveryText: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    marginTop: '6px',
    color: '#94A3B8',
  },
  tagText: {
    marginTop: '6px',
    color: '#94A3B8',
    fontWeight: 600,
  },
  cardFooter: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTop: '1px solid rgba(30, 41, 59, 0.8)',
    paddingTop: '14px',
    flexWrap: 'wrap',
    gap: '12px',
  },
  actionButtonGroup: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  actionPrompt: {
    fontSize: '12px',
    color: '#64748B',
    fontWeight: 600,
  },
  statusActionBtn: {
    padding: '5px 12px',
    borderRadius: '6px',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    border: '1px solid #334155',
    color: '#E2E8F0',
    fontSize: '11px',
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'all 0.2s ease',
  },
  statusActionBtnSuccess: {
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    borderColor: 'rgba(16, 185, 129, 0.3)',
    color: '#34D399',
  },
  statusActionBtnCancel: {
    backgroundColor: 'rgba(239, 68, 68, 0.08)',
    borderColor: 'rgba(239, 68, 68, 0.25)',
    color: '#F87171',
  },
  inspectBtn: {
    padding: '6px 14px',
    borderRadius: '8px',
    backgroundColor: 'rgba(223, 183, 108, 0.1)',
    border: '1px solid rgba(223, 183, 108, 0.3)',
    color: '#DFB76C',
    fontSize: '12px',
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'all 0.2s ease',
  },
  inspectBtnActive: {
    backgroundColor: '#DFB76C',
    borderColor: '#DFB76C',
    color: '#0B1729',
    fontWeight: 700,
  },
  inspectorPanel: {
    flex: '1 1 35%',
    backgroundColor: '#0B1729',
    border: '1px solid rgba(223, 183, 108, 0.3)',
    borderRadius: '16px',
    boxShadow: '0 8px 30px rgba(0, 0, 0, 0.4)',
    overflow: 'hidden',
    position: 'sticky',
    top: '24px',
  },
  inspectorHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '16px 20px',
    borderBottom: '1px solid #1E293B',
    backgroundColor: 'rgba(15, 23, 42, 0.7)',
  },
  inspectorTitleRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  inspectorTitle: {
    fontSize: '14px',
    fontWeight: 700,
    color: '#DFB76C',
  },
  inspectorCloseBtn: {
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    padding: '4px',
    display: 'flex',
    alignItems: 'center',
  },
  inspectorBody: {
    padding: '20px',
    maxHeight: 'calc(100vh - 180px)',
    overflowY: 'auto',
  },
  inspectorTop: {
    paddingBottom: '16px',
    borderBottom: '1px solid #1E293B',
  },
  inspectorModuleTitle: {
    fontSize: '17px',
    fontWeight: 800,
    color: '#FFFFFF',
    marginBottom: '8px',
  },
  inspectorSection: {
    padding: '16px 0',
    borderBottom: '1px solid #1E293B',
  },
  sectionHeading: {
    fontSize: '11px',
    fontWeight: 700,
    color: '#94A3B8',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    marginBottom: '10px',
  },
  contactCard: {
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    borderRadius: '10px',
    padding: '14px',
    border: '1px solid #1E293B',
  },
  contactName: {
    fontSize: '15px',
    fontWeight: 700,
    color: '#FFFFFF',
    marginBottom: '10px',
  },
  contactActionRow: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '8px',
  },
  contactActionButton: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    padding: '6px 12px',
    borderRadius: '8px',
    backgroundColor: '#162744',
    color: '#E2E8F0',
    fontSize: '12px',
    fontWeight: 600,
    textDecoration: 'none',
    border: '1px solid rgba(255, 255, 255, 0.08)',
  },
  specGrid: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  specRow: {
    display: 'flex',
    justifyContent: 'space-between',
    padding: '6px 0',
    fontSize: '12px',
    borderBottom: '1px solid rgba(255, 255, 255, 0.03)',
  },
  specKey: {
    color: '#64748B',
    fontWeight: 600,
  },
  specValue: {
    color: '#F8FAFC',
    fontWeight: 600,
    textAlign: 'right',
    maxWidth: '220px',
  },
  statusDecisionGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: '8px',
  },
  decisionBtn: {
    padding: '8px 12px',
    borderRadius: '8px',
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    border: '1px solid #334155',
    color: '#94A3B8',
    fontSize: '11px',
    fontWeight: 700,
    cursor: 'pointer',
    transition: 'all 0.2s ease',
  },
  decisionBtnActive: {
    backgroundColor: 'rgba(223, 183, 108, 0.15)',
    borderColor: '#DFB76C',
    color: '#DFB76C',
  },
};
