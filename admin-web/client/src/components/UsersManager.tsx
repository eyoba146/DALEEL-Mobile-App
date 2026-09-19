import React, { useEffect, useState } from 'react';
import { adminApi, type RegisteredUser } from '../api';
import { useToast } from '../context/ToastContext';
import {
  Users,
  Search,
  CheckCircle,
  Clock,
  Globe,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Heart,
  Briefcase,
  ShoppingBag,
  TrendingUp,
  X,
  RefreshCw,
  ShieldCheck,
  Award,
} from 'lucide-react';

export const UsersManager: React.FC = () => {
  const { success, error: toastError } = useToast();

  const [users, setUsers] = useState<RegisteredUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPersona, setSelectedPersona] = useState<'all' | 'diaspora' | 'foreign_resident'>('all');
  const [selectedVerification, setSelectedVerification] = useState<'all' | 'verified' | 'unverified'>('all');
  const [totalCount, setTotalCount] = useState(0);

  // In-Page Inspector Panel (STRICTLY NO POPUPS)
  const [inspectingUser, setInspectingUser] = useState<RegisteredUser | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const loadUsers = async () => {
    setLoading(true);
    try {
      const data = await adminApi.getRegisteredUsers({
        search: searchTerm.trim() || undefined,
        userType: selectedPersona !== 'all' ? selectedPersona : undefined,
        isVerified: selectedVerification === 'verified' ? 'true' : selectedVerification === 'unverified' ? 'false' : undefined,
        limit: 100,
      });
      setUsers(data.users);
      setTotalCount(data.total);
    } catch (err: any) {
      toastError(err.message || 'Unable to load member roster.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timeout = setTimeout(() => {
      loadUsers();
    }, 250);
    return () => clearTimeout(timeout);
  }, [searchTerm, selectedPersona, selectedVerification]);

  const handleToggleVerification = async (user: RegisteredUser) => {
    setUpdatingId(user.id);
    const newStatus = !user.isVerified;
    try {
      const updated = await adminApi.updateRegisteredUser(user.id, { isVerified: newStatus });
      setUsers((prev) => prev.map((u) => (u.id === user.id ? { ...u, isVerified: newStatus } : u)));
      if (inspectingUser?.id === user.id) {
        setInspectingUser((prev) => (prev ? { ...prev, isVerified: newStatus } : null));
      }
      success(`Member account "${updated.name}" is now marked as ${newStatus ? 'Verified' : 'Pending Verification'}.`);
    } catch (err: any) {
      toastError(err.message || 'Failed to update member status.');
    } finally {
      setUpdatingId(null);
    }
  };

  // Metric Computations
  const diasporaCount = users.filter((u) => u.userType === 'diaspora').length;
  const residentCount = users.filter((u) => u.userType === 'foreign_resident').length;
  const verifiedCount = users.filter((u) => u.isVerified).length;

  const getLanguageName = (code: string) => {
    switch (code) {
      case 'am':
        return 'Amharic (አማርኛ)';
      case 'om':
        return 'Afaan Oromoo';
      case 'ar':
        return 'Arabic (العربية)';
      default:
        return 'English';
    }
  };

  return (
    <div style={styles.container}>
      {/* Header Banner */}
      <div style={styles.headerBanner}>
        <div>
          <div style={styles.badgeRow}>
            <ShieldCheck size={14} color="#8C6A21" />
            <span style={styles.headerBadge}>GOVERNANCE: REGISTERED MOBILE COMMUNITY</span>
          </div>
          <h1 style={styles.title}>Registered Members Directory</h1>
          <p style={styles.subtitle}>
            Executive roster of Ethiopian diaspora travelers and foreign residents registered on the DALEEL platform.
          </p>
        </div>

        <button style={styles.refreshBtn} onClick={loadUsers} title="Refresh directory">
          <RefreshCw size={15} color="#DFB76C" />
          <span>Refresh Roster</span>
        </button>
      </div>

      {/* Metrics Bar */}
      <div style={styles.metricsGrid}>
        <div style={styles.metricCard}>
          <div style={styles.metricIconBox}>
            <Users size={18} color="#DFB76C" />
          </div>
          <div>
            <div style={styles.metricValue}>{totalCount}</div>
            <div style={styles.metricLabel}>Total Members</div>
          </div>
        </div>

        <div style={styles.metricCard}>
          <div style={styles.metricIconBox}>
            <Globe size={18} color="#60A5FA" />
          </div>
          <div>
            <div style={styles.metricValue}>{diasporaCount}</div>
            <div style={styles.metricLabel}>Diaspora Members</div>
          </div>
        </div>

        <div style={styles.metricCard}>
          <div style={styles.metricIconBox}>
            <Award size={18} color="#34D399" />
          </div>
          <div>
            <div style={styles.metricValue}>{residentCount}</div>
            <div style={styles.metricLabel}>Foreign Residents</div>
          </div>
        </div>

        <div style={styles.metricCard}>
          <div style={styles.metricIconBox}>
            <CheckCircle size={18} color="#10B981" />
          </div>
          <div>
            <div style={styles.metricValue}>{verifiedCount}</div>
            <div style={styles.metricLabel}>Verified Accounts</div>
          </div>
        </div>
      </div>

      {/* Filter & Search Toolbar */}
      <div style={styles.toolbar}>
        <div style={styles.searchBox}>
          <Search size={16} color="#64748B" />
          <input
            style={styles.searchInput}
            placeholder="Search by name, email, country or phone..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          {searchTerm && (
            <button style={styles.clearBtn} onClick={() => setSearchTerm('')}>
              <X size={14} color="#94A3B8" />
            </button>
          )}
        </div>

        {/* Persona Filters */}
        <div style={styles.filterPills}>
          <button
            style={{
              ...styles.filterPill,
              ...(selectedPersona === 'all' ? styles.filterPillActive : {}),
            }}
            onClick={() => setSelectedPersona('all')}
          >
            All Personas
          </button>
          <button
            style={{
              ...styles.filterPill,
              ...(selectedPersona === 'diaspora' ? styles.filterPillActive : {}),
            }}
            onClick={() => setSelectedPersona('diaspora')}
          >
            Diaspora
          </button>
          <button
            style={{
              ...styles.filterPill,
              ...(selectedPersona === 'foreign_resident' ? styles.filterPillActive : {}),
            }}
            onClick={() => setSelectedPersona('foreign_resident')}
          >
            Foreign Residents
          </button>
        </div>

        {/* Verification Filters */}
        <div style={styles.filterPills}>
          <button
            style={{
              ...styles.filterPill,
              ...(selectedVerification === 'all' ? styles.filterPillActive : {}),
            }}
            onClick={() => setSelectedVerification('all')}
          >
            All Statuses
          </button>
          <button
            style={{
              ...styles.filterPill,
              ...(selectedVerification === 'verified' ? styles.filterPillActive : {}),
            }}
            onClick={() => setSelectedVerification('verified')}
          >
            Verified Only
          </button>
          <button
            style={{
              ...styles.filterPill,
              ...(selectedVerification === 'unverified' ? styles.filterPillActive : {}),
            }}
            onClick={() => setSelectedVerification('unverified')}
          >
            Pending Verification
          </button>
        </div>
      </div>

      {/* Main Workspace Layout (Side-by-side with In-Page Inspector) */}
      <div style={styles.workspaceRow}>
        {/* Member Table */}
        <div style={{ ...styles.tableWrapper, ...(inspectingUser ? styles.tableWrapperShrunk : {}) }}>
          {loading ? (
            <div style={styles.loadingBox}>
              <RefreshCw size={22} color="#DFB76C" style={{ animation: 'spin 1.2s linear infinite' }} />
              <span style={styles.loadingText}>Retrieving registered member roster...</span>
            </div>
          ) : users.length === 0 ? (
            <div style={styles.emptyBox}>
              <Users size={36} color="#64748B" />
              <div style={styles.emptyTitle}>No registered members match your criteria</div>
              <div style={styles.emptySub}>Try adjusting your search query or persona filters.</div>
            </div>
          ) : (
            <div style={styles.tableCard}>
              <table style={styles.table}>
                <thead>
                  <tr style={styles.thRow}>
                    <th style={styles.th}>Member</th>
                    <th style={styles.th}>Persona</th>
                    <th style={styles.th}>Country & Language</th>
                    <th style={styles.th}>Verification</th>
                    <th style={styles.th}>Activity</th>
                    <th style={styles.th}>Joined</th>
                    <th style={{ ...styles.th, textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user) => {
                    const isSelected = inspectingUser?.id === user.id;
                    const isDiaspora = user.userType === 'diaspora';
                    return (
                      <tr
                        key={user.id}
                        style={{
                          ...styles.tr,
                          ...(isSelected ? styles.trSelected : {}),
                        }}
                      >
                        {/* Member Identity */}
                        <td style={styles.td}>
                          <div style={styles.memberCell}>
                            <div style={styles.avatar}>
                              {user.avatarUrl ? (
                                <img src={user.avatarUrl} alt={user.name} style={styles.avatarImg} />
                              ) : (
                                <span>{user.name.charAt(0).toUpperCase()}</span>
                              )}
                            </div>
                            <div>
                              <div style={styles.memberName}>{user.name}</div>
                              <div style={styles.memberEmail}>{user.email}</div>
                              {user.phone && <div style={styles.memberPhone}>{user.phone}</div>}
                            </div>
                          </div>
                        </td>

                        {/* Persona Badge */}
                        <td style={styles.td}>
                          <span
                            style={{
                              ...styles.personaBadge,
                              ...(isDiaspora ? styles.personaDiaspora : styles.personaResident),
                            }}
                          >
                            {isDiaspora ? '🇪🇹 Diaspora Member' : '🌍 Foreign Resident'}
                          </span>
                        </td>

                        {/* Country & Language */}
                        <td style={styles.td}>
                          <div style={styles.countryRow}>
                            <Globe size={13} color="#DFB76C" />
                            <span style={styles.countryText}>{user.country || 'Not specified'}</span>
                          </div>
                          <div style={styles.langText}>{getLanguageName(user.language)}</div>
                        </td>

                        {/* Verification Status */}
                        <td style={styles.td}>
                          {user.isVerified ? (
                            <span style={styles.badgeVerified}>
                              <CheckCircle size={12} color="#10B981" />
                              <span>Verified</span>
                            </span>
                          ) : (
                            <span style={styles.badgePending}>
                              <Clock size={12} color="#F59E0B" />
                              <span>Pending</span>
                            </span>
                          )}
                        </td>

                        {/* Activity Counts */}
                        <td style={styles.td}>
                          <div style={styles.activityCounts}>
                            <span title="Service Inquiries" style={styles.activityPill}>
                              <Briefcase size={11} color="#DFB76C" />
                              <span>{user._count?.serviceInquiries ?? 0}</span>
                            </span>
                            <span title="Event RSVPs" style={styles.activityPill}>
                              <Calendar size={11} color="#60A5FA" />
                              <span>{user._count?.eventRsvps ?? 0}</span>
                            </span>
                            <span title="Orders" style={styles.activityPill}>
                              <ShoppingBag size={11} color="#34D399" />
                              <span>{user._count?.productOrderInquiries ?? 0}</span>
                            </span>
                            <span title="Saved Favorites" style={styles.activityPill}>
                              <Heart size={11} color="#F43F5E" />
                              <span>{user._count?.favorites ?? 0}</span>
                            </span>
                          </div>
                        </td>

                        {/* Joined Date */}
                        <td style={styles.td}>
                          <div style={styles.dateText}>
                            {new Date(user.createdAt).toLocaleDateString(undefined, {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric',
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
                            onClick={() => setInspectingUser(isSelected ? null : user)}
                          >
                            {isSelected ? 'Close View' : 'Inspect'}
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

        {/* Dedicated In-Page Member Inspector Panel (STRICTLY NO POPUPS) */}
        {inspectingUser && (
          <aside style={styles.inspectorPanel}>
            <div style={styles.inspectorHeader}>
              <div style={styles.inspectorTitleRow}>
                <ShieldCheck size={16} color="#DFB76C" />
                <span style={styles.inspectorTitle}>Member Profile Details</span>
              </div>
              <button style={styles.inspectorCloseBtn} onClick={() => setInspectingUser(null)}>
                <X size={16} color="#94A3B8" />
              </button>
            </div>

            <div style={styles.inspectorBody}>
              {/* Member Card */}
              <div style={styles.inspectorHero}>
                <div style={styles.inspectorAvatar}>
                  {inspectingUser.avatarUrl ? (
                    <img src={inspectingUser.avatarUrl} alt={inspectingUser.name} style={styles.avatarImg} />
                  ) : (
                    <span>{inspectingUser.name.charAt(0).toUpperCase()}</span>
                  )}
                </div>
                <div style={styles.inspectorName}>{inspectingUser.name}</div>
                <div style={styles.inspectorEmail}>{inspectingUser.email}</div>

                <div style={styles.inspectorPillRow}>
                  <span
                    style={{
                      ...styles.personaBadge,
                      ...(inspectingUser.userType === 'diaspora'
                        ? styles.personaDiaspora
                        : styles.personaResident),
                    }}
                  >
                    {inspectingUser.userType === 'diaspora' ? '🇪🇹 Diaspora Member' : '🌍 Foreign Resident'}
                  </span>

                  {inspectingUser.isVerified ? (
                    <span style={styles.badgeVerified}>
                      <CheckCircle size={12} color="#10B981" />
                      <span>Verified Email</span>
                    </span>
                  ) : (
                    <span style={styles.badgePending}>
                      <Clock size={12} color="#F59E0B" />
                      <span>Pending Verification</span>
                    </span>
                  )}
                </div>
              </div>

              {/* Status Action Button */}
              <div style={styles.inspectorActionSection}>
                <button
                  style={{
                    ...styles.statusToggleBtn,
                    ...(inspectingUser.isVerified ? styles.statusToggleRevoke : styles.statusToggleVerify),
                  }}
                  disabled={updatingId === inspectingUser.id}
                  onClick={() => handleToggleVerification(inspectingUser)}
                >
                  {inspectingUser.isVerified ? 'Revoke Verified Status' : 'Confirm Verified Status'}
                </button>
              </div>

              {/* Contact Information */}
              <div style={styles.inspectorSection}>
                <div style={styles.sectionHeading}>Contact Details</div>
                <div style={styles.detailRow}>
                  <Mail size={14} color="#8C6A21" />
                  <a href={`mailto:${inspectingUser.email}`} style={styles.detailLink}>
                    {inspectingUser.email}
                  </a>
                </div>
                <div style={styles.detailRow}>
                  <Phone size={14} color="#8C6A21" />
                  {inspectingUser.phone ? (
                    <a href={`tel:${inspectingUser.phone}`} style={styles.detailLink}>
                      {inspectingUser.phone}
                    </a>
                  ) : (
                    <span style={styles.detailMuted}>No phone number registered</span>
                  )}
                </div>
                <div style={styles.detailRow}>
                  <Globe size={14} color="#8C6A21" />
                  <span style={styles.detailValue}>
                    {inspectingUser.country || 'Country of residence not set'}
                  </span>
                </div>
                <div style={styles.detailRow}>
                  <Calendar size={14} color="#8C6A21" />
                  <span style={styles.detailValue}>
                    Joined on{' '}
                    {new Date(inspectingUser.createdAt).toLocaleDateString(undefined, {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </span>
                </div>
              </div>

              {/* Saved Delivery Address */}
              <div style={styles.inspectorSection}>
                <div style={styles.sectionHeading}>Saved Address & Location</div>
                <div style={styles.detailRow}>
                  <MapPin size={14} color="#8C6A21" />
                  <span style={styles.detailValue}>
                    {inspectingUser.savedAddress || 'No saved delivery address on record'}
                  </span>
                </div>
              </div>

              {/* Platform Engagement Breakdown */}
              <div style={styles.inspectorSection}>
                <div style={styles.sectionHeading}>Platform Activity Breakdown</div>
                <div style={styles.activityGrid}>
                  <div style={styles.activityBox}>
                    <Briefcase size={16} color="#DFB76C" />
                    <div style={styles.activityBoxCount}>{inspectingUser._count?.serviceInquiries ?? 0}</div>
                    <div style={styles.activityBoxLabel}>Service Inquiries</div>
                  </div>

                  <div style={styles.activityBox}>
                    <Calendar size={16} color="#60A5FA" />
                    <div style={styles.activityBoxCount}>{inspectingUser._count?.eventRsvps ?? 0}</div>
                    <div style={styles.activityBoxLabel}>Event RSVPs</div>
                  </div>

                  <div style={styles.activityBox}>
                    <ShoppingBag size={16} color="#34D399" />
                    <div style={styles.activityBoxCount}>
                      {inspectingUser._count?.productOrderInquiries ?? 0}
                    </div>
                    <div style={styles.activityBoxLabel}>Artisan Orders</div>
                  </div>

                  <div style={styles.activityBox}>
                    <TrendingUp size={16} color="#A78BFA" />
                    <div style={styles.activityBoxCount}>
                      {inspectingUser._count?.investmentInquiries ?? 0}
                    </div>
                    <div style={styles.activityBoxLabel}>Investment Inquiries</div>
                  </div>
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
  headerBanner: {
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
  headerBadge: {
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
    maxWidth: '700px',
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
  metricsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(4, 1fr)',
    gap: '16px',
    marginBottom: '24px',
  },
  metricCard: {
    backgroundColor: '#0B1729',
    border: '1px solid #1E293B',
    borderRadius: '14px',
    padding: '18px 20px',
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
  },
  metricIconBox: {
    width: '44px',
    height: '44px',
    borderRadius: '10px',
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    border: '1px solid rgba(255, 255, 255, 0.08)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  metricValue: {
    fontSize: '22px',
    fontWeight: 800,
    color: '#FFFFFF',
  },
  metricLabel: {
    fontSize: '12px',
    fontWeight: 600,
    color: '#64748B',
    marginTop: '2px',
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
  tableWrapper: {
    flex: 1,
    transition: 'all 0.3s ease',
    minWidth: 0,
  },
  tableWrapperShrunk: {
    flex: '1 1 65%',
  },
  tableCard: {
    backgroundColor: '#0B1729',
    border: '1px solid #1E293B',
    borderRadius: '14px',
    overflow: 'hidden',
    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.25)',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    textAlign: 'left',
  },
  thRow: {
    borderBottom: '1px solid #1E293B',
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
  },
  th: {
    padding: '14px 18px',
    fontSize: '11px',
    fontWeight: 700,
    color: '#94A3B8',
    letterSpacing: '0.05em',
    textTransform: 'uppercase',
  },
  tr: {
    borderBottom: '1px solid rgba(30, 41, 59, 0.6)',
    transition: 'background-color 0.15s ease',
  },
  trSelected: {
    backgroundColor: 'rgba(223, 183, 108, 0.08)',
  },
  td: {
    padding: '14px 18px',
    fontSize: '13px',
    verticalAlign: 'middle',
  },
  memberCell: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  avatar: {
    width: '38px',
    height: '38px',
    borderRadius: '50%',
    backgroundColor: 'rgba(223, 183, 108, 0.15)',
    border: '1px solid rgba(223, 183, 108, 0.3)',
    color: '#DFB76C',
    fontWeight: 700,
    fontSize: '15px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    flexShrink: 0,
  },
  avatarImg: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
  },
  memberName: {
    fontWeight: 700,
    color: '#FFFFFF',
    fontSize: '14px',
  },
  memberEmail: {
    fontSize: '12px',
    color: '#94A3B8',
  },
  memberPhone: {
    fontSize: '11px',
    color: '#64748B',
    marginTop: '2px',
  },
  personaBadge: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    padding: '4px 10px',
    borderRadius: '8px',
    fontSize: '11px',
    fontWeight: 700,
  },
  personaDiaspora: {
    backgroundColor: 'rgba(96, 165, 250, 0.12)',
    color: '#93C5FD',
    border: '1px solid rgba(96, 165, 250, 0.3)',
  },
  personaResident: {
    backgroundColor: 'rgba(52, 211, 153, 0.12)',
    color: '#6EE7B7',
    border: '1px solid rgba(52, 211, 153, 0.3)',
  },
  countryRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    fontWeight: 600,
    color: '#FFFFFF',
  },
  countryText: {
    fontSize: '13px',
  },
  langText: {
    fontSize: '11px',
    color: '#64748B',
    marginTop: '2px',
  },
  badgeVerified: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    padding: '4px 10px',
    borderRadius: '20px',
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
    color: '#34D399',
    fontSize: '11px',
    fontWeight: 700,
    border: '1px solid rgba(16, 185, 129, 0.25)',
  },
  badgePending: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    padding: '4px 10px',
    borderRadius: '20px',
    backgroundColor: 'rgba(245, 158, 11, 0.12)',
    color: '#FBBF24',
    fontSize: '11px',
    fontWeight: 700,
    border: '1px solid rgba(245, 158, 11, 0.25)',
  },
  activityCounts: {
    display: 'flex',
    gap: '6px',
  },
  activityPill: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '4px',
    padding: '3px 8px',
    borderRadius: '6px',
    backgroundColor: '#162744',
    fontSize: '11px',
    fontWeight: 600,
    color: '#E2E8F0',
  },
  dateText: {
    color: '#94A3B8',
    fontSize: '12px',
  },
  inspectBtn: {
    padding: '6px 14px',
    borderRadius: '8px',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    border: '1px solid #334155',
    color: '#E2E8F0',
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
  inspectorHero: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    textAlign: 'center',
    paddingBottom: '20px',
    borderBottom: '1px solid #1E293B',
  },
  inspectorAvatar: {
    width: '68px',
    height: '68px',
    borderRadius: '50%',
    backgroundColor: 'rgba(223, 183, 108, 0.15)',
    border: '2px solid rgba(223, 183, 108, 0.4)',
    color: '#DFB76C',
    fontWeight: 800,
    fontSize: '24px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: '12px',
    overflow: 'hidden',
  },
  inspectorName: {
    fontSize: '18px',
    fontWeight: 800,
    color: '#FFFFFF',
    marginBottom: '4px',
  },
  inspectorEmail: {
    fontSize: '13px',
    color: '#94A3B8',
    marginBottom: '12px',
  },
  inspectorPillRow: {
    display: 'flex',
    gap: '8px',
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  inspectorActionSection: {
    padding: '16px 0',
    borderBottom: '1px solid #1E293B',
  },
  statusToggleBtn: {
    width: '100%',
    padding: '10px 16px',
    borderRadius: '10px',
    fontSize: '13px',
    fontWeight: 700,
    cursor: 'pointer',
    transition: 'all 0.2s ease',
  },
  statusToggleVerify: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    border: '1px solid rgba(16, 185, 129, 0.4)',
    color: '#34D399',
  },
  statusToggleRevoke: {
    backgroundColor: 'rgba(239, 68, 68, 0.12)',
    border: '1px solid rgba(239, 68, 68, 0.35)',
    color: '#F87171',
  },
  inspectorSection: {
    padding: '16px 0',
    borderBottom: '1px solid #1E293B',
  },
  sectionHeading: {
    fontSize: '12px',
    fontWeight: 700,
    color: '#94A3B8',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    marginBottom: '12px',
  },
  detailRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    marginBottom: '10px',
    fontSize: '13px',
  },
  detailLink: {
    color: '#60A5FA',
    textDecoration: 'none',
  },
  detailValue: {
    color: '#E2E8F0',
  },
  detailMuted: {
    color: '#64748B',
    fontStyle: 'italic',
  },
  activityGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: '10px',
  },
  activityBox: {
    backgroundColor: '#162744',
    border: '1px solid rgba(255, 255, 255, 0.06)',
    borderRadius: '10px',
    padding: '12px',
    textAlign: 'center',
  },
  activityBoxCount: {
    fontSize: '18px',
    fontWeight: 800,
    color: '#FFFFFF',
    marginTop: '4px',
  },
  activityBoxLabel: {
    fontSize: '11px',
    color: '#94A3B8',
    marginTop: '2px',
  },
};
