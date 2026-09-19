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
  AlertTriangle,
  UserX,
  UserCheck,
  ShieldAlert,
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

  // Account Status Governance (Activate / Deactivate)
  const handleToggleAccountActive = async (user: RegisteredUser) => {
    setUpdatingId(user.id);
    const newStatus = user.isActive === false ? true : false;
    try {
      const updated = await adminApi.updateRegisteredUser(user.id, { isActive: newStatus });
      setUsers((prev) => prev.map((u) => (u.id === user.id ? { ...u, isActive: newStatus } : u)));
      if (inspectingUser?.id === user.id) {
        setInspectingUser((prev) => (prev ? { ...prev, isActive: newStatus } : null));
      }
      success(`Member account "${updated.name}" is now ${newStatus ? 'Activated' : 'Deactivated / Suspended'}.`);
    } catch (err: any) {
      toastError(err.message || 'Failed to update account status.');
    } finally {
      setUpdatingId(null);
    }
  };

  // Revoke Email Verification (Admin cannot artificially verify; can only revoke if flagged)
  const handleRevokeVerification = async (user: RegisteredUser) => {
    if (!window.confirm(`Revoke verified email status for ${user.name}? The member will be required to re-verify their email address via OTP code.`)) {
      return;
    }
    setUpdatingId(user.id);
    try {
      const updated = await adminApi.updateRegisteredUser(user.id, { revokeVerification: true });
      setUsers((prev) => prev.map((u) => (u.id === user.id ? { ...u, isVerified: false } : u)));
      if (inspectingUser?.id === user.id) {
        setInspectingUser((prev) => (prev ? { ...prev, isVerified: false } : null));
      }
      success(`Email verification revoked for "${updated.name}".`);
    } catch (err: any) {
      toastError(err.message || 'Failed to revoke verification.');
    } finally {
      setUpdatingId(null);
    }
  };

  // Metric Computations
  const diasporaCount = users.filter((u) => u.userType === 'diaspora').length;
  const residentCount = users.filter((u) => u.userType === 'foreign_resident').length;
  const verifiedCount = users.filter((u) => u.isVerified).length;
  const activeCount = users.filter((u) => u.isActive !== false).length;

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
      {/* Light Luxury Header Banner */}
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
          <RefreshCw size={15} color="#8C6A21" />
          <span>Refresh Roster</span>
        </button>
      </div>

      {/* Light Luxury Metrics Bar */}
      <div style={styles.metricsGrid}>
        <div style={styles.metricCard}>
          <div style={styles.metricIconBox}>
            <Users size={18} color="#8C6A21" />
          </div>
          <div>
            <div style={styles.metricValue}>{totalCount}</div>
            <div style={styles.metricLabel}>Total Members</div>
          </div>
        </div>

        <div style={styles.metricCard}>
          <div style={styles.metricIconBox}>
            <Globe size={18} color="#3B82F6" />
          </div>
          <div>
            <div style={styles.metricValue}>{diasporaCount}</div>
            <div style={styles.metricLabel}>Diaspora Members</div>
          </div>
        </div>

        <div style={styles.metricCard}>
          <div style={styles.metricIconBox}>
            <Award size={18} color="#10B981" />
          </div>
          <div>
            <div style={styles.metricValue}>{residentCount}</div>
            <div style={styles.metricLabel}>Foreign Residents</div>
          </div>
        </div>

        <div style={styles.metricCard}>
          <div style={styles.metricIconBox}>
            <CheckCircle size={18} color="#059669" />
          </div>
          <div>
            <div style={styles.metricValue}>{verifiedCount}</div>
            <div style={styles.metricLabel}>Verified Accounts</div>
          </div>
        </div>

        <div style={styles.metricCard}>
          <div style={styles.metricIconBox}>
            <UserCheck size={18} color="#8C6A21" />
          </div>
          <div>
            <div style={styles.metricValue}>{activeCount}</div>
            <div style={styles.metricLabel}>Active Accounts</div>
          </div>
        </div>
      </div>

      {/* Filter & Search Toolbar */}
      <div style={styles.toolbar}>
        <div style={styles.searchBox}>
          <Search size={16} color="#8A9AA8" />
          <input
            style={styles.searchInput}
            placeholder="Search by member name, email, country, or phone..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          {searchTerm && (
            <button style={styles.clearBtn} onClick={() => setSearchTerm('')}>
              <X size={14} color="#8A9AA8" />
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
              <RefreshCw size={22} color="#8C6A21" style={{ animation: 'spin 1.2s linear infinite' }} />
              <span style={styles.loadingText}>Retrieving registered member roster...</span>
            </div>
          ) : users.length === 0 ? (
            <div style={styles.emptyBox}>
              <Users size={36} color="#8A9AA8" />
              <div style={styles.emptyTitle}>No registered members match your criteria</div>
              <div style={styles.emptySub}>Try adjusting your search query or filter selections.</div>
            </div>
          ) : (
            <div style={styles.tableCard}>
              <table style={styles.table}>
                <thead>
                  <tr style={styles.thRow}>
                    <th style={styles.th}>Member</th>
                    <th style={styles.th}>Persona</th>
                    <th style={styles.th}>Account Status</th>
                    <th style={styles.th}>Email Verification</th>
                    <th style={styles.th}>Country & Language</th>
                    <th style={styles.th}>Platform Activity</th>
                    <th style={styles.th}>Joined</th>
                    <th style={{ ...styles.th, textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user) => {
                    const isSelected = inspectingUser?.id === user.id;
                    const isDiaspora = user.userType === 'diaspora';
                    const isActive = user.isActive !== false;
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
                            {isDiaspora ? '🇪🇹 Diaspora' : '🌍 Resident'}
                          </span>
                        </td>

                        {/* Account Status Badge */}
                        <td style={styles.td}>
                          {isActive ? (
                            <span style={styles.statusActiveBadge}>
                              <CheckCircle size={11} color="#065F46" />
                              <span>Active</span>
                            </span>
                          ) : (
                            <span style={styles.statusSuspendedBadge}>
                              <UserX size={11} color="#991B1B" />
                              <span>Deactivated</span>
                            </span>
                          )}
                        </td>

                        {/* Email Verification Status */}
                        <td style={styles.td}>
                          {user.isVerified ? (
                            <span style={styles.badgeVerified}>
                              <CheckCircle size={11} color="#065F46" />
                              <span>Verified OTP</span>
                            </span>
                          ) : (
                            <span style={styles.badgePending}>
                              <Clock size={11} color="#92400E" />
                              <span>Pending User Code</span>
                            </span>
                          )}
                        </td>

                        {/* Country & Language */}
                        <td style={styles.td}>
                          <div style={styles.countryRow}>
                            <Globe size={12} color="#8C6A21" />
                            <span style={styles.countryText}>{user.country || 'Not specified'}</span>
                          </div>
                          <div style={styles.langText}>{getLanguageName(user.language)}</div>
                        </td>

                        {/* Activity Counts */}
                        <td style={styles.td}>
                          <div style={styles.activityCounts}>
                            <span title="Service Inquiries" style={styles.activityPill}>
                              <Briefcase size={11} color="#8C6A21" />
                              <span>{user._count?.serviceInquiries ?? 0}</span>
                            </span>
                            <span title="Event RSVPs" style={styles.activityPill}>
                              <Calendar size={11} color="#2563EB" />
                              <span>{user._count?.eventRsvps ?? 0}</span>
                            </span>
                            <span title="Orders" style={styles.activityPill}>
                              <ShoppingBag size={11} color="#059669" />
                              <span>{user._count?.productOrderInquiries ?? 0}</span>
                            </span>
                            <span title="Saved Favorites" style={styles.activityPill}>
                              <Heart size={11} color="#DC2626" />
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
                            {isSelected ? 'Close' : 'Inspect'}
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
                <ShieldCheck size={16} color="#8C6A21" />
                <span style={styles.inspectorTitle}>Member Profile & Governance</span>
              </div>
              <button style={styles.inspectorCloseBtn} onClick={() => setInspectingUser(null)} title="Close Inspector">
                <X size={16} color="#5A687A" />
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

                  {inspectingUser.isActive !== false ? (
                    <span style={styles.statusActiveBadge}>
                      <CheckCircle size={11} color="#065F46" />
                      <span>Account Active</span>
                    </span>
                  ) : (
                    <span style={styles.statusSuspendedBadge}>
                      <UserX size={11} color="#991B1B" />
                      <span>Account Deactivated</span>
                    </span>
                  )}
                </div>
              </div>

              {/* Account Security & Governance Controls */}
              <div style={styles.inspectorSection}>
                <div style={styles.sectionHeading}>Account Access Control</div>
                <div style={styles.governanceBox}>
                  <div style={styles.governanceRow}>
                    <div>
                      <div style={styles.govTitle}>
                        {inspectingUser.isActive !== false ? 'Account Status: Active' : 'Account Status: Deactivated'}
                      </div>
                      <div style={styles.govDesc}>
                        {inspectingUser.isActive !== false
                          ? 'This member has full authorization to access the mobile application.'
                          : 'This account is currently suspended. The user cannot log in or submit inquiries.'}
                      </div>
                    </div>
                    <button
                      style={{
                        ...styles.govBtn,
                        ...(inspectingUser.isActive !== false ? styles.govBtnDeactivate : styles.govBtnActivate),
                      }}
                      disabled={updatingId === inspectingUser.id}
                      onClick={() => handleToggleAccountActive(inspectingUser)}
                    >
                      {inspectingUser.isActive !== false ? (
                        <>
                          <UserX size={13} />
                          <span>Deactivate</span>
                        </>
                      ) : (
                        <>
                          <UserCheck size={13} />
                          <span>Activate</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>

              {/* Email Verification Governance */}
              <div style={styles.inspectorSection}>
                <div style={styles.sectionHeading}>Email Verification Status</div>
                <div style={styles.governanceBox}>
                  {inspectingUser.isVerified ? (
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                        <span style={styles.badgeVerified}>
                          <CheckCircle size={12} color="#065F46" />
                          <span>Verified via Mobile OTP Code</span>
                        </span>
                        <button
                          style={styles.revokeBtn}
                          disabled={updatingId === inspectingUser.id}
                          onClick={() => handleRevokeVerification(inspectingUser)}
                          title="Revoke verification if suspicious or email changed"
                        >
                          <ShieldAlert size={13} />
                          <span>Revoke Verification</span>
                        </button>
                      </div>
                      <p style={styles.govDesc}>
                        Email address has been confirmed by the user. If this email becomes invalid or suspicious, you can revoke verification to require re-confirmation.
                      </p>
                    </div>
                  ) : (
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
                        <span style={styles.badgePending}>
                          <Clock size={12} color="#92400E" />
                          <span>Pending User Security Code</span>
                        </span>
                      </div>
                      <div style={styles.securityNotice}>
                        <AlertTriangle size={14} color="#8C6A21" style={{ flexShrink: 0, marginTop: '2px' }} />
                        <span style={styles.securityNoticeText}>
                          For security and compliance, administrators cannot bypass email verification. The member must verify their email directly using the 6-digit code sent to their inbox.
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Member Profile Particulars */}
              <div style={styles.inspectorSection}>
                <div style={styles.sectionHeading}>Contact & Location Particulars</div>
                <div style={styles.detailList}>
                  <div style={styles.detailRow}>
                    <span style={styles.detailLabel}>
                      <Globe size={13} color="#8C6A21" />
                      <span>Country of Origin/Residence:</span>
                    </span>
                    <span style={styles.detailValue}>{inspectingUser.country || 'Not provided'}</span>
                  </div>

                  <div style={styles.detailRow}>
                    <span style={styles.detailLabel}>
                      <Phone size={13} color="#8C6A21" />
                      <span>Contact Phone:</span>
                    </span>
                    <span style={styles.detailValue}>
                      {inspectingUser.phone ? (
                        <a href={`tel:${inspectingUser.phone}`} style={styles.linkText}>
                          {inspectingUser.phone}
                        </a>
                      ) : (
                        'No phone provided'
                      )}
                    </span>
                  </div>

                  <div style={styles.detailRow}>
                    <span style={styles.detailLabel}>
                      <Mail size={13} color="#8C6A21" />
                      <span>Preferred Language:</span>
                    </span>
                    <span style={styles.detailValue}>{getLanguageName(inspectingUser.language)}</span>
                  </div>

                  <div style={styles.detailRow}>
                    <span style={styles.detailLabel}>
                      <Calendar size={13} color="#8C6A21" />
                      <span>Registration Date:</span>
                    </span>
                    <span style={styles.detailValue}>
                      {new Date(inspectingUser.createdAt).toLocaleDateString(undefined, {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })}
                    </span>
                  </div>

                  <div style={styles.detailRow}>
                    <span style={styles.detailLabel}>
                      <MapPin size={13} color="#8C6A21" />
                      <span>Delivery Address:</span>
                    </span>
                    <span style={styles.detailValue}>
                      {inspectingUser.savedAddress || 'No saved address on record'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Platform Engagement Breakdown */}
              <div style={styles.inspectorSection}>
                <div style={styles.sectionHeading}>Platform Activity Breakdown</div>
                <div style={styles.activityGrid}>
                  <div style={styles.activityBox}>
                    <Briefcase size={16} color="#8C6A21" />
                    <div style={styles.activityBoxCount}>{inspectingUser._count?.serviceInquiries ?? 0}</div>
                    <div style={styles.activityBoxLabel}>Service Inquiries</div>
                  </div>

                  <div style={styles.activityBox}>
                    <Calendar size={16} color="#2563EB" />
                    <div style={styles.activityBoxCount}>{inspectingUser._count?.eventRsvps ?? 0}</div>
                    <div style={styles.activityBoxLabel}>Event RSVPs</div>
                  </div>

                  <div style={styles.activityBox}>
                    <ShoppingBag size={16} color="#059669" />
                    <div style={styles.activityBoxCount}>
                      {inspectingUser._count?.productOrderInquiries ?? 0}
                    </div>
                    <div style={styles.activityBoxLabel}>Artisan Orders</div>
                  </div>

                  <div style={styles.activityBox}>
                    <TrendingUp size={16} color="#7C3AED" />
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
    marginBottom: '24px',
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
  metricsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
    gap: '16px',
    marginBottom: '24px',
  },
  metricCard: {
    backgroundColor: '#FFFFFF',
    border: '1px solid #E4E9F0',
    borderRadius: '12px',
    padding: '18px 20px',
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
    boxShadow: '0 2px 8px rgba(7, 21, 43, 0.02)',
  },
  metricIconBox: {
    width: '44px',
    height: '44px',
    borderRadius: '10px',
    backgroundColor: '#F8FAFC',
    border: '1px solid #E4E9F0',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  metricValue: {
    fontSize: '24px',
    fontWeight: 800,
    color: '#07152B',
    lineHeight: 1.1,
  },
  metricLabel: {
    fontSize: '12px',
    fontWeight: 600,
    color: '#5A687A',
    marginTop: '4px',
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
  memberCell: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  avatar: {
    width: '38px',
    height: '38px',
    borderRadius: '50%',
    backgroundColor: '#07152B',
    color: '#DFB76C',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '14px',
    fontWeight: 700,
    flexShrink: 0,
    overflow: 'hidden',
  },
  avatarImg: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
  },
  memberName: {
    fontWeight: 700,
    color: '#07152B',
  },
  memberEmail: {
    fontSize: '12px',
    color: '#5A687A',
    marginTop: '1px',
  },
  memberPhone: {
    fontSize: '11px',
    color: '#8A9AA8',
    marginTop: '1px',
  },
  personaBadge: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '5px',
    padding: '3px 9px',
    borderRadius: '12px',
    fontSize: '11px',
    fontWeight: 700,
  },
  personaDiaspora: {
    backgroundColor: '#EEF2FF',
    color: '#4338CA',
    border: '1px solid #C7D2FE',
  },
  personaResident: {
    backgroundColor: '#ECFDF5',
    color: '#065F46',
    border: '1px solid #A7F3D0',
  },
  statusActiveBadge: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '4px',
    padding: '3px 8px',
    borderRadius: '12px',
    fontSize: '11px',
    fontWeight: 700,
    backgroundColor: '#ECFDF5',
    color: '#065F46',
    border: '1px solid #A7F3D0',
  },
  statusSuspendedBadge: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '4px',
    padding: '3px 8px',
    borderRadius: '12px',
    fontSize: '11px',
    fontWeight: 700,
    backgroundColor: '#FEF2F2',
    color: '#991B1B',
    border: '1px solid #FECACA',
  },
  badgeVerified: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '4px',
    padding: '3px 8px',
    borderRadius: '12px',
    fontSize: '11px',
    fontWeight: 700,
    backgroundColor: '#ECFDF5',
    color: '#065F46',
    border: '1px solid #A7F3D0',
  },
  badgePending: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '4px',
    padding: '3px 8px',
    borderRadius: '12px',
    fontSize: '11px',
    fontWeight: 700,
    backgroundColor: '#FFFBEB',
    color: '#92400E',
    border: '1px solid #FDE68A',
  },
  countryRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
  },
  countryText: {
    fontWeight: 600,
    color: '#07152B',
  },
  langText: {
    fontSize: '11.5px',
    color: '#5A687A',
    marginTop: '2px',
  },
  activityCounts: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  activityPill: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '4px',
    padding: '3px 7px',
    backgroundColor: '#F8FAFC',
    border: '1px solid #E4E9F0',
    borderRadius: '6px',
    fontSize: '11.5px',
    fontWeight: 600,
    color: '#07152B',
  },
  dateText: {
    fontSize: '12px',
    color: '#5A687A',
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
  },

  // In-Page Inspector Panel Styles (Light Luxury)
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
    borderRadius: '6px',
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
    paddingBottom: '18px',
    borderBottom: '1px solid #F1F5F9',
  },
  inspectorAvatar: {
    width: '64px',
    height: '64px',
    borderRadius: '50%',
    backgroundColor: '#07152B',
    color: '#DFB76C',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '22px',
    fontWeight: 800,
    marginBottom: '10px',
    overflow: 'hidden',
    border: '2px solid #DFB76C',
  },
  inspectorName: {
    fontSize: '18px',
    fontWeight: 800,
    color: '#07152B',
  },
  inspectorEmail: {
    fontSize: '13px',
    color: '#5A687A',
    marginTop: '2px',
  },
  inspectorPillRow: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '8px',
    justifyContent: 'center',
    marginTop: '12px',
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
  governanceBox: {
    backgroundColor: '#F8FAFC',
    border: '1px solid #E4E9F0',
    borderRadius: '10px',
    padding: '14px',
  },
  governanceRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '12px',
  },
  govTitle: {
    fontSize: '13px',
    fontWeight: 700,
    color: '#07152B',
  },
  govDesc: {
    fontSize: '12px',
    color: '#5A687A',
    lineHeight: 1.4,
    marginTop: '3px',
  },
  govBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    padding: '7px 12px',
    borderRadius: '8px',
    fontSize: '12px',
    fontWeight: 700,
    cursor: 'pointer',
    flexShrink: 0,
    transition: 'all 0.15s ease',
  },
  govBtnDeactivate: {
    backgroundColor: '#FEF2F2',
    color: '#991B1B',
    border: '1px solid #FECACA',
  },
  govBtnActivate: {
    backgroundColor: '#ECFDF5',
    color: '#065F46',
    border: '1px solid #A7F3D0',
  },
  revokeBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '5px',
    padding: '4px 8px',
    backgroundColor: '#FFFFFF',
    border: '1px solid #FECACA',
    color: '#991B1B',
    borderRadius: '6px',
    fontSize: '11px',
    fontWeight: 600,
    cursor: 'pointer',
  },
  securityNotice: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '8px',
    backgroundColor: '#FEF9EE',
    border: '1px solid rgba(223, 183, 108, 0.3)',
    borderRadius: '8px',
    padding: '10px 12px',
    marginTop: '6px',
  },
  securityNoticeText: {
    fontSize: '11.5px',
    color: '#8C6A21',
    lineHeight: 1.4,
  },
  detailList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
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
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    color: '#5A687A',
    fontWeight: 500,
  },
  detailValue: {
    color: '#07152B',
    fontWeight: 600,
    textAlign: 'right',
    maxWidth: '200px',
  },
  linkText: {
    color: '#07152B',
    textDecoration: 'underline',
  },
  activityGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: '10px',
  },
  activityBox: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '12px',
    backgroundColor: '#F8FAFC',
    borderRadius: '8px',
    border: '1px solid #E4E9F0',
    textAlign: 'center',
  },
  activityBoxCount: {
    fontSize: '18px',
    fontWeight: 800,
    color: '#07152B',
    marginTop: '4px',
  },
  activityBoxLabel: {
    fontSize: '11px',
    color: '#5A687A',
    marginTop: '2px',
    fontWeight: 500,
  },
};
