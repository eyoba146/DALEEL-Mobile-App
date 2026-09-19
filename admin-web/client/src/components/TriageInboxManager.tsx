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
  X,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  Clock,
  Filter,
  Check,
} from 'lucide-react';

export const TriageInboxManager: React.FC = () => {
  const { adminUser } = useAdminAuth();
  const { success, error: toastError } = useToast();

  const [inquiries, setInquiries] = useState<UnifiedInquiryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDepartment, setSelectedDepartment] = useState<string>('all');
  const [selectedQueue, setSelectedQueue] = useState<'active' | 'confirmed' | 'cancelled' | 'all'>('active');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [queueCounts, setQueueCounts] = useState<{ active: number; confirmed: number; cancelled: number; all: number }>({
    active: 0,
    confirmed: 0,
    cancelled: 0,
    all: 0,
  });

  // In-Page Inspection Panel (STRICTLY NO POPUPS)
  const [inspectingItem, setInspectingItem] = useState<UnifiedInquiryItem | null>(null);

  const isSuperAdmin = adminUser?.adminRole === 'SUPER_ADMIN';

  const loadInquiries = async () => {
    setLoading(true);
    try {
      const data = await adminApi.getUnifiedInquiries({
        department: isSuperAdmin ? (selectedDepartment !== 'all' ? selectedDepartment : undefined) : undefined,
        status: selectedStatus !== 'all' ? selectedStatus : undefined,
        queue: selectedQueue,
        search: searchTerm.trim() || undefined,
      });
      setInquiries(data.inquiries);
      if (data.counts) {
        setQueueCounts(data.counts);
      }
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
  }, [searchTerm, selectedDepartment, selectedStatus, selectedQueue]);

  const handleUpdateStatus = async (item: UnifiedInquiryItem, newStatus: string) => {
    setUpdatingId(item.id);
    try {
      await adminApi.updateUnifiedInquiryStatus(item.module, item.id, newStatus);

      const isConfirmed = ['CONFIRMED', 'confirmed', 'COMPLETED', 'completed', 'CHECKED_IN', 'checked_in'].includes(newStatus);
      const isCancelled = ['CANCELLED', 'cancelled', 'REJECTED', 'rejected', 'DECLINED', 'declined'].includes(newStatus);

      if (selectedQueue === 'active' && (isConfirmed || isCancelled)) {
        // Disappear from active inbox into the archive category
        setInquiries((prev) => prev.filter((inq) => inq.id !== item.id));
        setInspectingItem(null);
        success(
          `Request marked as "${newStatus.replace(/_/g, ' ')}" and moved to ${
            isConfirmed ? 'Confirmed & Completed' : 'Cancelled & Declined'
          } category.`
        );
      } else if (selectedQueue === 'confirmed' && !isConfirmed) {
        // Re-opened or changed out of confirmed
        setInquiries((prev) => prev.filter((inq) => inq.id !== item.id));
        setInspectingItem(null);
        success(`Request status changed to "${newStatus.replace(/_/g, ' ')}". Moved out of Confirmed category.`);
      } else if (selectedQueue === 'cancelled' && !isCancelled) {
        // Re-opened or changed out of cancelled
        setInquiries((prev) => prev.filter((inq) => inq.id !== item.id));
        setInspectingItem(null);
        success(`Request status changed to "${newStatus.replace(/_/g, ' ')}". Moved out of Cancelled category.`);
      } else {
        setInquiries((prev) =>
          prev.map((inq) => (inq.id === item.id ? { ...inq, status: newStatus } : inq))
        );
        if (inspectingItem?.id === item.id) {
          setInspectingItem((prev) => (prev ? { ...prev, status: newStatus } : null));
        }
        success(`Request status updated to "${newStatus.replace(/_/g, ' ')}". Customer notified via email and in-app.`);
      }

      // Refresh queue counts
      loadInquiries();
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
        return 'Executive queue overseeing live client requests, attendee RSVPs, artisan orders, and diaspora investments.';
      case 'SERVICE_MANAGER':
        return 'Live client inquiries submitted for certified legal, healthcare, banking, relocation, and tourism concierge partners.';
      case 'EVENT_MANAGER':
        return 'Guest RSVPs and ticket requests submitted for diaspora summits, heritage festivals, and cultural gatherings.';
      case 'MARKETPLACE_MANAGER':
        return 'Customer purchase inquiries and delivery coordination requests submitted for authentic Ethiopian artisan crafts.';
      case 'INVESTMENT_OFFICER':
        return 'Investor inquiries and prospectus requests submitted for high-yield Ethiopian commercial and developmental ventures.';
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
          bg: '#FEF9EE',
          color: '#8C6A21',
          border: '1px solid rgba(223, 183, 108, 0.4)',
        };
      case 'EVENTS':
        return {
          icon: Calendar,
          label: 'Event Gathering',
          bg: '#EFF6FF',
          color: '#1D4ED8',
          border: '1px solid #BFDBFE',
        };
      case 'MARKETPLACE':
        return {
          icon: ShoppingBag,
          label: 'Artisan Marketplace',
          bg: '#ECFDF5',
          color: '#065F46',
          border: '1px solid #A7F3D0',
        };
      case 'INVESTMENTS':
        return {
          icon: TrendingUp,
          label: 'Diaspora Investment',
          bg: '#F5F3FF',
          color: '#6D28D9',
          border: '1px solid #DDD6FE',
        };
      default:
        return {
          icon: Inbox,
          label: 'Inquiry',
          bg: '#F8FAFC',
          color: '#475569',
          border: '1px solid #E2E8F0',
        };
    }
  };

  const getStatusBadge = (status: string) => {
    const s = status.toLowerCase();
    if (s.includes('pend')) {
      return {
        bg: '#FFFBEB',
        color: '#92400E',
        border: '1px solid #FDE68A',
        label: 'PENDING TRIAGE',
      };
    }
    if (s.includes('review') || s.includes('contact') || s.includes('progress')) {
      return {
        bg: '#EFF6FF',
        color: '#1E40AF',
        border: '1px solid #BFDBFE',
        label: 'IN REVIEW',
      };
    }
    if (s.includes('confirm') || s.includes('complet') || s.includes('checked')) {
      return {
        bg: '#ECFDF5',
        color: '#065F46',
        border: '1px solid #A7F3D0',
        label: 'RESOLVED / CONFIRMED',
      };
    }
    if (s.includes('cancel') || s.includes('reject') || s.includes('declin')) {
      return {
        bg: '#FEF2F2',
        color: '#991B1B',
        border: '1px solid #FECACA',
        label: 'DECLINED / CANCELLED',
      };
    }
    return {
      bg: '#F8FAFC',
      color: '#475569',
      border: '1px solid #E2E8F0',
      label: status.toUpperCase(),
    };
  };

  return (
    <div style={styles.container}>
      {/* Light Luxury Header Banner */}
      <div style={styles.headerBanner}>
        <div>
          <div style={styles.badgeRow}>
            <ShieldCheck size={14} color="#8C6A21" />
            <span style={styles.headerBadge}>EXECUTIVE TRIAGE QUEUE</span>
          </div>
          <h1 style={styles.title}>{getRoleTitle(adminUser?.adminRole)}</h1>
          <p style={styles.subtitle}>{getRoleSubtitle(adminUser?.adminRole)}</p>
        </div>

        <button style={styles.refreshBtn} onClick={loadInquiries} title="Refresh triage queue">
          <RefreshCw size={15} color="#8C6A21" />
          <span>Refresh Queue</span>
        </button>
      </div>

      {/* Lifecycle Archive Category Tabs (Default: Active Inbox) */}
      <div style={styles.queueTabsBar}>
        <button
          style={{
            ...styles.queueTab,
            ...(selectedQueue === 'active' ? styles.queueTabActive : {}),
          }}
          onClick={() => {
            setSelectedQueue('active');
            setSelectedStatus('all');
          }}
        >
          <Inbox size={15} />
          <span>Active Inbox</span>
          <span
            style={{
              ...styles.queueBadge,
              ...(selectedQueue === 'active' ? styles.queueBadgeActive : {}),
            }}
          >
            {queueCounts.active}
          </span>
        </button>

        <button
          style={{
            ...styles.queueTab,
            ...(selectedQueue === 'confirmed' ? styles.queueTabActive : {}),
          }}
          onClick={() => {
            setSelectedQueue('confirmed');
            setSelectedStatus('all');
          }}
        >
          <CheckCircle2 size={15} />
          <span>Confirmed & Completed</span>
          <span
            style={{
              ...styles.queueBadge,
              ...(selectedQueue === 'confirmed' ? styles.queueBadgeActive : {}),
            }}
          >
            {queueCounts.confirmed}
          </span>
        </button>

        <button
          style={{
            ...styles.queueTab,
            ...(selectedQueue === 'cancelled' ? styles.queueTabActive : {}),
          }}
          onClick={() => {
            setSelectedQueue('cancelled');
            setSelectedStatus('all');
          }}
        >
          <XCircle size={15} />
          <span>Cancelled & Declined</span>
          <span
            style={{
              ...styles.queueBadge,
              ...(selectedQueue === 'cancelled' ? styles.queueBadgeActive : {}),
            }}
          >
            {queueCounts.cancelled}
          </span>
        </button>

        <button
          style={{
            ...styles.queueTab,
            ...(selectedQueue === 'all' ? styles.queueTabActive : {}),
          }}
          onClick={() => {
            setSelectedQueue('all');
            setSelectedStatus('all');
          }}
        >
          <Filter size={15} />
          <span>All History</span>
          <span
            style={{
              ...styles.queueBadge,
              ...(selectedQueue === 'all' ? styles.queueBadgeActive : {}),
            }}
          >
            {queueCounts.all}
          </span>
        </button>
      </div>

      {/* Filter & Search Toolbar */}
      <div style={styles.toolbar}>
        <div style={styles.searchBox}>
          <Search size={16} color="#8A9AA8" />
          <input
            style={styles.searchInput}
            placeholder="Search by customer name, email, or listing title..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          {searchTerm && (
            <button style={styles.clearBtn} onClick={() => setSearchTerm('')}>
              <X size={14} color="#8A9AA8" />
            </button>
          )}
        </div>

        {/* Super Admin Cross-Department Filter */}
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
      </div>

      {/* Workspace Row (Table + In-Page Inspector) */}
      <div style={styles.workspaceRow}>
        <div style={{ ...styles.tableWrapper, ...(inspectingItem ? styles.tableWrapperShrunk : {}) }}>
          {loading ? (
            <div style={styles.loadingBox}>
              <RefreshCw size={22} color="#8C6A21" style={{ animation: 'spin 1.2s linear infinite' }} />
              <span style={styles.loadingText}>Retrieving customer requests...</span>
            </div>
          ) : inquiries.length === 0 ? (
            <div style={styles.emptyBox}>
              <Inbox size={38} color="#8A9AA8" />
              <div style={styles.emptyTitle}>
                {selectedQueue === 'active'
                  ? 'All Caught Up! Active Inbox is Clear.'
                  : selectedQueue === 'confirmed'
                  ? 'No Confirmed or Completed Requests in Archive.'
                  : selectedQueue === 'cancelled'
                  ? 'No Cancelled or Declined Requests in Archive.'
                  : 'No Requests Found.'}
              </div>
              <div style={styles.emptySub}>
                {selectedQueue === 'active'
                  ? 'New customer submissions will appear here for immediate review and triage.'
                  : 'Requests processed by coordinators will be stored in this archive category for reference and re-editing.'}
              </div>
            </div>
          ) : (
            <div style={styles.tableCard}>
              <table style={styles.table}>
                <thead>
                  <tr style={styles.thRow}>
                    <th style={styles.th}>Department / Source</th>
                    <th style={styles.th}>Target Listing</th>
                    <th style={styles.th}>Customer Details</th>
                    <th style={styles.th}>Current Status</th>
                    <th style={styles.th}>Submission Time</th>
                    <th style={{ ...styles.th, textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {inquiries.map((inq) => {
                    const isSelected = inspectingItem?.id === inq.id;
                    const modBadge = getModuleBadge(inq.module);
                    const statusBadge = getStatusBadge(inq.status);
                    const ModIcon = modBadge.icon;

                    return (
                      <tr
                        key={`${inq.module}-${inq.id}`}
                        style={{
                          ...styles.tr,
                          ...(isSelected ? styles.trSelected : {}),
                        }}
                      >
                        {/* Module Badge */}
                        <td style={styles.td}>
                          <span
                            style={{
                              ...styles.modulePill,
                              backgroundColor: modBadge.bg,
                              color: modBadge.color,
                              border: modBadge.border,
                            }}
                          >
                            <ModIcon size={12} />
                            <span>{modBadge.label}</span>
                          </span>
                        </td>

                        {/* Target Listing */}
                        <td style={styles.td}>
                          <div style={styles.listingTitle}>{inq.title}</div>
                        </td>

                        {/* Customer */}
                        <td style={styles.td}>
                          <div style={styles.customerName}>{inq.customerName}</div>
                          <div style={styles.customerMeta}>
                            <a href={`mailto:${inq.customerEmail}`} style={styles.linkText}>
                              {inq.customerEmail}
                            </a>
                            {inq.customerPhone && (
                              <>
                                <span>•</span>
                                <span>{inq.customerPhone}</span>
                              </>
                            )}
                          </div>
                        </td>

                        {/* Status */}
                        <td style={styles.td}>
                          <span
                            style={{
                              ...styles.statusPill,
                              backgroundColor: statusBadge.bg,
                              color: statusBadge.color,
                              border: statusBadge.border,
                            }}
                          >
                            {statusBadge.label}
                          </span>
                        </td>

                        {/* Timestamp */}
                        <td style={styles.td}>
                          <div style={styles.dateText}>
                            {new Date(inq.createdAt).toLocaleDateString(undefined, {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric',
                            })}
                          </div>
                          <div style={styles.timeText}>
                            {new Date(inq.createdAt).toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </div>
                        </td>

                        {/* Actions */}
                        <td style={{ ...styles.td, textAlign: 'right' }}>
                          <button
                            style={{
                              ...styles.inspectBtn,
                              ...(isSelected ? styles.inspectBtnActive : {}),
                            }}
                            onClick={() => setInspectingItem(isSelected ? null : inq)}
                          >
                            {isSelected ? 'Close' : 'Review & Edit'}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Dedicated In-Page Inspection Panel (STRICTLY NO POPUPS) */}
        {inspectingItem && (
          <aside style={styles.inspectorPanel}>
            <div style={styles.inspectorHeader}>
              <div style={styles.inspectorTitleRow}>
                <ShieldCheck size={16} color="#8C6A21" />
                <span style={styles.inspectorTitle}>Request Details & Triage</span>
              </div>
              <button style={styles.inspectorCloseBtn} onClick={() => setInspectingItem(null)} title="Close Panel">
                <X size={16} color="#5A687A" />
              </button>
            </div>

            <div style={styles.inspectorBody}>
              {/* Header Details */}
              <div style={styles.inspectorHero}>
                <span
                  style={{
                    ...styles.modulePill,
                    ...getModuleBadge(inspectingItem.module),
                  }}
                >
                  {getModuleBadge(inspectingItem.module).label}
                </span>
                <div style={styles.inspectorTargetTitle}>{inspectingItem.title}</div>
                <div style={styles.inspectorStatusPill}>
                  Current Status: <strong>{inspectingItem.status.toUpperCase()}</strong>
                </div>
              </div>

              {/* Modernized Interactive Status Switcher (Re-editable at any time!) */}
              <div style={styles.inspectorSection}>
                <div style={styles.sectionHeading}>Update Request Status</div>
                <div style={styles.statusActionGrid}>
                  <button
                    style={{
                      ...styles.statusActionBtn,
                      ...(inspectingItem.status.toLowerCase() === 'in_review' ? styles.statusActionBtnActive : {}),
                    }}
                    disabled={updatingId === inspectingItem.id}
                    onClick={() => handleUpdateStatus(inspectingItem, 'IN_REVIEW')}
                  >
                    <Clock size={13} color="#1E40AF" />
                    <span>In Review</span>
                  </button>

                  <button
                    style={{
                      ...styles.statusActionBtn,
                      ...styles.statusActionConfirm,
                      ...(inspectingItem.status.toLowerCase() === 'confirmed' || inspectingItem.status.toLowerCase() === 'completed'
                        ? styles.statusActionConfirmActive
                        : {}),
                    }}
                    disabled={updatingId === inspectingItem.id}
                    onClick={() =>
                      handleUpdateStatus(
                        inspectingItem,
                        inspectingItem.module === 'EVENTS' ? 'confirmed' : 'COMPLETED'
                      )
                    }
                  >
                    <Check size={13} />
                    <span>Confirm / Complete</span>
                  </button>

                  <button
                    style={{
                      ...styles.statusActionBtn,
                      ...styles.statusActionCancel,
                      ...(inspectingItem.status.toLowerCase() === 'cancelled' || inspectingItem.status.toLowerCase() === 'rejected'
                        ? styles.statusActionCancelActive
                        : {}),
                    }}
                    disabled={updatingId === inspectingItem.id}
                    onClick={() =>
                      handleUpdateStatus(
                        inspectingItem,
                        inspectingItem.module === 'EVENTS' ? 'cancelled' : 'CANCELLED'
                      )
                    }
                  >
                    <X size={13} />
                    <span>Decline / Cancel</span>
                  </button>
                </div>
                <div style={styles.statusExplainer}>
                  Updating status dispatches a branded email update to the customer and triggers an in-app mobile notification.
                  {selectedQueue === 'active' && (
                    <span style={{ display: 'block', marginTop: '4px', color: '#8C6A21', fontWeight: 600 }}>
                      • Once Confirmed or Cancelled, this item will move to its respective archive category.
                    </span>
                  )}
                </div>
              </div>

              {/* Customer Contact Particulars */}
              <div style={styles.inspectorSection}>
                <div style={styles.sectionHeading}>Customer Contact Details</div>
                <div style={styles.detailList}>
                  <div style={styles.detailRow}>
                    <span style={styles.detailLabel}>Full Name:</span>
                    <span style={styles.detailValue}>{inspectingItem.customerName}</span>
                  </div>

                  <div style={styles.detailRow}>
                    <span style={styles.detailLabel}>Email Address:</span>
                    <span style={styles.detailValue}>
                      <a href={`mailto:${inspectingItem.customerEmail}`} style={styles.linkAction}>
                        <Mail size={12} />
                        <span>{inspectingItem.customerEmail}</span>
                      </a>
                    </span>
                  </div>

                  {inspectingItem.customerPhone && (
                    <div style={styles.detailRow}>
                      <span style={styles.detailLabel}>Direct Phone:</span>
                      <span style={styles.detailValue}>
                        <a href={`tel:${inspectingItem.customerPhone}`} style={styles.linkAction}>
                          <Phone size={12} />
                          <span>{inspectingItem.customerPhone}</span>
                        </a>
                      </span>
                    </div>
                  )}

                  <div style={styles.detailRow}>
                    <span style={styles.detailLabel}>Date Submitted:</span>
                    <span style={styles.detailValue}>
                      {new Date(inspectingItem.createdAt).toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>

              {/* Request Details Breakdown */}
              <div style={styles.inspectorSection}>
                <div style={styles.sectionHeading}>Submission Specifics</div>
                <div style={styles.detailList}>
                  {Object.entries(inspectingItem.details || {}).map(([key, value]) => {
                    if (!value) return null;
                    const formatKey = key
                      .replace(/([A-Z])/g, ' $1')
                      .replace(/^./, (str) => str.toUpperCase());
                    return (
                      <div key={key} style={styles.detailRow}>
                        <span style={styles.detailLabel}>{formatKey}:</span>
                        <span style={styles.detailValue}>{String(value)}</span>
                      </div>
                    );
                  })}
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
    maxWidth: '1600px',
    margin: '0 auto',
    backgroundColor: '#F8FAFC',
    minHeight: '100vh',
    color: '#07152B',
  },
  headerBanner: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: '20px',
    backgroundColor: '#FFFFFF',
    padding: '24px 28px',
    borderRadius: '16px',
    border: '1px solid #E4E9F0',
    boxShadow: '0 2px 10px rgba(7, 21, 43, 0.03)',
  },
  badgeRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    marginBottom: '8px',
  },
  headerBadge: {
    fontSize: '11px',
    fontWeight: 700,
    letterSpacing: '0.08em',
    color: '#8C6A21',
    textTransform: 'uppercase',
  },
  title: {
    fontSize: '26px',
    fontWeight: 800,
    color: '#07152B',
    margin: '0 0 6px 0',
  },
  subtitle: {
    fontSize: '14px',
    color: '#5A687A',
    margin: 0,
    maxWidth: '700px',
    lineHeight: 1.5,
  },
  refreshBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '10px 18px',
    backgroundColor: '#FFFFFF',
    border: '1px solid #E4E9F0',
    borderRadius: '10px',
    color: '#07152B',
    fontSize: '13px',
    fontWeight: 600,
    cursor: 'pointer',
    boxShadow: '0 1px 3px rgba(7, 21, 43, 0.03)',
    transition: 'all 0.18s ease',
  },
  queueTabsBar: {
    display: 'flex',
    gap: '10px',
    marginBottom: '20px',
    backgroundColor: '#FFFFFF',
    padding: '8px 12px',
    borderRadius: '12px',
    border: '1px solid #E4E9F0',
    boxShadow: '0 2px 8px rgba(7, 21, 43, 0.02)',
    flexWrap: 'wrap',
  },
  queueTab: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '8px',
    padding: '9px 16px',
    borderRadius: '8px',
    fontSize: '13px',
    fontWeight: 600,
    border: '1px solid transparent',
    backgroundColor: '#F8FAFC',
    color: '#5A687A',
    cursor: 'pointer',
    transition: 'all 0.15s ease',
  },
  queueTabActive: {
    backgroundColor: '#07152B',
    color: '#FFFFFF',
    borderColor: '#07152B',
    fontWeight: 700,
  },
  queueBadge: {
    fontSize: '11px',
    fontWeight: 700,
    padding: '2px 7px',
    borderRadius: '999px',
    backgroundColor: '#E2E8F0',
    color: '#07152B',
  },
  queueBadgeActive: {
    backgroundColor: '#DFB76C',
    color: '#07152B',
  },
  toolbar: {
    display: 'flex',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: '14px',
    marginBottom: '20px',
    backgroundColor: '#FFFFFF',
    padding: '16px 20px',
    borderRadius: '12px',
    border: '1px solid #E4E9F0',
    boxShadow: '0 2px 8px rgba(7, 21, 43, 0.02)',
  },
  searchBox: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    backgroundColor: '#F8FAFC',
    border: '1px solid #E4E9F0',
    borderRadius: '8px',
    padding: '8px 14px',
    flex: '1 1 300px',
    minWidth: '260px',
  },
  searchInput: {
    background: 'none',
    border: 'none',
    outline: 'none',
    color: '#07152B',
    fontSize: '13.5px',
    width: '100%',
  },
  clearBtn: {
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    padding: 0,
  },
  filterPills: {
    display: 'flex',
    gap: '6px',
    backgroundColor: '#F8FAFC',
    padding: '4px',
    borderRadius: '8px',
    border: '1px solid #E4E9F0',
  },
  filterPill: {
    padding: '6px 12px',
    fontSize: '12.5px',
    fontWeight: 600,
    borderRadius: '6px',
    border: 'none',
    backgroundColor: 'transparent',
    color: '#5A687A',
    cursor: 'pointer',
    transition: 'all 0.15s ease',
  },
  filterPillActive: {
    backgroundColor: '#07152B',
    color: '#FFFFFF',
    fontWeight: 700,
  },
  workspaceRow: {
    display: 'flex',
    gap: '24px',
    alignItems: 'flex-start',
  },
  tableWrapper: {
    flex: '1 1 auto',
    width: '100%',
    transition: 'all 0.25s ease',
  },
  tableWrapperShrunk: {
    maxWidth: 'calc(100% - 440px)',
  },
  tableCard: {
    backgroundColor: '#FFFFFF',
    border: '1px solid #E4E9F0',
    borderRadius: '14px',
    overflow: 'hidden',
    boxShadow: '0 2px 10px rgba(7, 21, 43, 0.03)',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    textAlign: 'left',
  },
  thRow: {
    backgroundColor: '#F8FAFC',
    borderBottom: '1px solid #E4E9F0',
  },
  th: {
    padding: '14px 18px',
    fontSize: '11.5px',
    fontWeight: 700,
    textTransform: 'uppercase',
    letterSpacing: '0.06em',
    color: '#5A687A',
  },
  tr: {
    borderBottom: '1px solid #F1F5F9',
    transition: 'background-color 0.15s ease',
  },
  trSelected: {
    backgroundColor: 'rgba(223, 183, 108, 0.06)',
  },
  td: {
    padding: '14px 18px',
    fontSize: '13px',
    color: '#07152B',
    verticalAlign: 'middle',
  },
  modulePill: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '5px',
    padding: '4px 10px',
    borderRadius: '20px',
    fontSize: '11px',
    fontWeight: 700,
    textTransform: 'uppercase',
  },
  listingTitle: {
    fontWeight: 700,
    color: '#07152B',
    maxWidth: '260px',
  },
  customerName: {
    fontWeight: 700,
    color: '#07152B',
  },
  customerMeta: {
    fontSize: '12px',
    color: '#5A687A',
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    marginTop: '2px',
  },
  statusPill: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '4px',
    padding: '3px 8px',
    borderRadius: '12px',
    fontSize: '11px',
    fontWeight: 700,
  },
  dateText: {
    fontSize: '12px',
    fontWeight: 600,
    color: '#07152B',
  },
  timeText: {
    fontSize: '11px',
    color: '#8A9AA8',
    marginTop: '1px',
  },
  inspectBtn: {
    padding: '6px 14px',
    backgroundColor: '#F8FAFC',
    border: '1px solid #E4E9F0',
    borderRadius: '8px',
    fontSize: '12px',
    fontWeight: 600,
    color: '#07152B',
    cursor: 'pointer',
    transition: 'all 0.15s ease',
  },
  inspectBtnActive: {
    backgroundColor: '#07152B',
    color: '#FFFFFF',
    borderColor: '#07152B',
  },
  loadingBox: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '12px',
    padding: '60px',
    backgroundColor: '#FFFFFF',
    borderRadius: '14px',
    border: '1px solid #E4E9F0',
  },
  loadingText: {
    fontSize: '13.5px',
    color: '#5A687A',
    fontWeight: 500,
  },
  emptyBox: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '60px',
    backgroundColor: '#FFFFFF',
    borderRadius: '14px',
    border: '1px solid #E4E9F0',
    textAlign: 'center',
  },
  emptyTitle: {
    fontSize: '16px',
    fontWeight: 700,
    color: '#07152B',
    marginTop: '12px',
  },
  emptySub: {
    fontSize: '13px',
    color: '#5A687A',
    marginTop: '4px',
    maxWidth: '460px',
    lineHeight: 1.4,
  },

  // Inspector Panel Styles (Light Luxury)
  inspectorPanel: {
    width: '420px',
    backgroundColor: '#FFFFFF',
    borderRadius: '14px',
    border: '1px solid #E4E9F0',
    boxShadow: '0 4px 20px rgba(7, 21, 43, 0.08)',
    flexShrink: 0,
    position: 'sticky',
    top: '24px',
    overflow: 'hidden',
  },
  inspectorHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '16px 20px',
    backgroundColor: '#F8FAFC',
    borderBottom: '1px solid #E4E9F0',
  },
  inspectorTitleRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  inspectorTitle: {
    fontSize: '13.5px',
    fontWeight: 700,
    color: '#07152B',
  },
  inspectorCloseBtn: {
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    padding: '4px',
  },
  inspectorBody: {
    padding: '20px',
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
    maxHeight: 'calc(100vh - 160px)',
    overflowY: 'auto',
  },
  inspectorHero: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    textAlign: 'center',
    paddingBottom: '16px',
    borderBottom: '1px solid #F1F5F9',
  },
  inspectorTargetTitle: {
    fontSize: '16px',
    fontWeight: 800,
    color: '#07152B',
    marginTop: '10px',
  },
  inspectorStatusPill: {
    fontSize: '12px',
    color: '#5A687A',
    marginTop: '4px',
  },
  inspectorSection: {
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
  },
  sectionHeading: {
    fontSize: '11px',
    fontWeight: 700,
    textTransform: 'uppercase',
    letterSpacing: '0.06em',
    color: '#8C6A21',
  },
  statusActionGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: '8px',
  },
  statusActionBtn: {
    display: 'inline-flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '4px',
    padding: '10px 6px',
    borderRadius: '8px',
    fontSize: '11.5px',
    fontWeight: 600,
    backgroundColor: '#F8FAFC',
    border: '1px solid #E4E9F0',
    color: '#07152B',
    cursor: 'pointer',
    transition: 'all 0.15s ease',
  },
  statusActionBtnActive: {
    backgroundColor: '#EFF6FF',
    borderColor: '#3B82F6',
    color: '#1E40AF',
    fontWeight: 700,
  },
  statusActionConfirm: {
    color: '#065F46',
  },
  statusActionConfirmActive: {
    backgroundColor: '#ECFDF5',
    borderColor: '#10B981',
    color: '#065F46',
    fontWeight: 700,
  },
  statusActionCancel: {
    color: '#991B1B',
  },
  statusActionCancelActive: {
    backgroundColor: '#FEF2F2',
    borderColor: '#EF4444',
    color: '#991B1B',
    fontWeight: 700,
  },
  statusExplainer: {
    fontSize: '11.5px',
    color: '#5A687A',
    lineHeight: 1.4,
  },
  detailList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  detailRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: '8px 12px',
    backgroundColor: '#F8FAFC',
    borderRadius: '8px',
    border: '1px solid #E4E9F0',
    fontSize: '12.5px',
  },
  detailLabel: {
    color: '#5A687A',
    fontWeight: 500,
  },
  detailValue: {
    color: '#07152B',
    fontWeight: 600,
    textAlign: 'right',
    maxWidth: '220px',
  },
  linkAction: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '4px',
    color: '#07152B',
    textDecoration: 'underline',
  },
  linkText: {
    color: '#07152B',
    textDecoration: 'underline',
  },
};
