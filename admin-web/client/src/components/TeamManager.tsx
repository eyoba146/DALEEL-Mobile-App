import React, { useEffect, useState } from 'react';
import { adminApi } from '../api';
import type { AdminUser } from '../api';
import { useAdminAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import {
  Plus,
  Search,
  Trash2,
  ShieldCheck,
  Mail,
  Phone,
  RefreshCw,
  KeyRound,
  AlertCircle,
  ArrowLeft,
  Check,
  UserCheck,
  Compass,
  Briefcase,
  Calendar,
  ShoppingBag,
  TrendingUp,
  Eye,
  EyeOff,
  Sparkles,
  Lock,
  CheckCircle2,
} from 'lucide-react';
import { ResetPasswordModal } from './ResetPasswordModal';

export interface RoleOption {
  value: string;
  label: string;
  desc: string;
  icon: React.ElementType;
  permissions: string[];
}

const ROLE_OPTIONS: RoleOption[] = [
  {
    value: 'SUPER_ADMIN',
    label: 'Full Platform Administrator',
    desc: 'Unrestricted governance across all administrative departments, member accounts, and staff permissions.',
    icon: ShieldCheck,
    permissions: ['System Governance', 'Staff Security', 'Member Management', 'All Operational Queues'],
  },
  {
    value: 'DESTINATION_MANAGER',
    label: 'Tourism & Heritage Lead',
    desc: 'Full curation authority over historical landmarks, UNESCO heritage sites, and geographic navigation pins.',
    icon: Compass,
    permissions: ['Destinations Catalog', 'Map Coordinates', 'Cultural Highlights'],
  },
  {
    value: 'SERVICE_MANAGER',
    label: 'Services Directory Lead',
    desc: 'Oversees verified diaspora service providers, emergency services, and client formal inquiry queues.',
    icon: Briefcase,
    permissions: ['Provider Curation', 'Formal Inquiries', 'Business Directory'],
  },
  {
    value: 'EVENT_MANAGER',
    label: 'Events & Summits Coordinator',
    desc: 'Coordinates cultural exhibitions, diaspora business summits, venue capacities, and attendee RSVPs.',
    icon: Calendar,
    permissions: ['Event Scheduling', 'RSVP Pass Verification', 'Attendee Check-In'],
  },
  {
    value: 'MARKETPLACE_MANAGER',
    label: 'Artisan Marketplace Lead',
    desc: 'Manages Ethiopian artisan partners, fair-trade craft products, stock levels, and purchase order dispatches.',
    icon: ShoppingBag,
    permissions: ['Artisan Curation', 'Craft Inventory', 'Order Dispatches'],
  },
  {
    value: 'INVESTMENT_OFFICER',
    label: 'Investment Desk Officer',
    desc: 'Handles diaspora capital syndicates, sector prospectuses, allocation requests, and investor leads.',
    icon: TrendingUp,
    permissions: ['Prospectus Publications', 'Investor Inquiries', 'Syndicate Leads'],
  },
];

export const TeamManager: React.FC = () => {
  const { adminUser } = useAdminAuth();
  const { success, error: toastError } = useToast();
  const [team, setTeam] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [resetTargetUser, setResetTargetUser] = useState<AdminUser | null>(null);

  // Dedicated In-Page Editor State (NO POPUPS)
  const [isEditorActive, setIsEditorActive] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Form Fields
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    adminRole: 'SERVICE_MANAGER',
    phone: '',
  });

  const loadTeam = async () => {
    setLoading(true);
    try {
      const data = await adminApi.getTeam();
      setTeam(data);
    } catch (err: any) {
      console.error('Failed to load team:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTeam();
  }, []);

  const handleOpenCreate = () => {
    setFormData({
      name: '',
      email: '',
      password: '',
      adminRole: 'SERVICE_MANAGER',
      phone: '',
    });
    setErrorMessage('');
    setShowPassword(false);
    setIsEditorActive(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCloseEditor = () => {
    setIsEditorActive(false);
  };

  const handleGenerateKey = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$%';
    let key = '';
    for (let i = 0; i < 12; i++) {
      key += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setFormData((prev) => ({ ...prev, password: key }));
    setShowPassword(true);
  };

  const handleDelete = async (id: string, name: string) => {
    if (id === adminUser?.id) {
      const msg = 'You cannot remove your own active administrative account.';
      setErrorMessage(msg);
      toastError(msg);
      return;
    }
    if (!window.confirm(`Revoke administrative access for ${name}?`)) return;

    try {
      await adminApi.deleteTeamMember(id);
      success(`Access revoked for ${name}.`, 'Coordinator Removed');
      loadTeam();
    } catch (err: any) {
      const msg = err.message || 'Failed to remove coordinator';
      setErrorMessage(msg);
      toastError(msg);
    }
  };

  const handleSave = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!formData.name.trim() || !formData.email.trim() || !formData.password.trim()) {
      const msg = 'Full name, email, and initial password are required.';
      setErrorMessage(msg);
      toastError(msg);
      return;
    }
    setIsSaving(true);
    setErrorMessage('');

    try {
      await adminApi.createTeamMember(formData);
      success(`Coordinator "${formData.name}" onboarded successfully.`, 'Coordinator Authorized');
      setIsEditorActive(false);
      loadTeam();
    } catch (err: any) {
      const msg = err.message || 'Failed to onboard coordinator';
      setErrorMessage(msg);
      toastError(msg);
    } finally {
      setIsSaving(false);
    }
  };

  const getRoleLabel = (role: string) => {
    return ROLE_OPTIONS.find((r) => r.value === role)?.label || role;
  };

  const selectedRoleConfig = ROLE_OPTIONS.find((r) => r.value === formData.adminRole) || ROLE_OPTIONS[0];

  const filteredTeam = team.filter(
    (m) =>
      m.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.adminRole.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Dedicated In-Page Full Workspace Editor (NO POPUP)
  if (isEditorActive) {
    const SelectedRoleIcon = selectedRoleConfig.icon;

    return (
      <div style={styles.container}>
        {/* Editor Top Navigation Bar */}
        <div style={styles.editorNav}>
          <div style={styles.editorNavLeft}>
            <button style={styles.backBtn} onClick={handleCloseEditor}>
              <ArrowLeft size={16} color="#07152B" />
              <span>Back to Staff Directory</span>
            </button>
            <div style={styles.editorBreadcrumbs}>
              <span style={styles.breadcrumbMuted}>Administrative Team</span>
              <span style={styles.breadcrumbSep}>/</span>
              <span style={styles.breadcrumbCurrent}>Onboard Coordinator</span>
            </div>
          </div>

          <div style={styles.editorNavActions}>
            <button type="button" className="btn btn-secondary" onClick={handleCloseEditor}>
              Cancel
            </button>
            <button
              type="button"
              className="btn btn-primary"
              disabled={isSaving}
              onClick={handleSave}
            >
              <Check size={16} color="#07152B" />
              <span>{isSaving ? 'Authorizing...' : 'Authorize Coordinator'}</span>
            </button>
          </div>
        </div>

        {errorMessage && (
          <div style={styles.errorBox}>
            <AlertCircle size={16} />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* 2-Column Dedicated Luxury Workspace */}
        <div style={styles.editorGrid}>
          {/* Left Column: Account Credentials */}
          <div style={styles.formCard}>
            <div style={styles.cardHeaderPod}>
              <div style={styles.headerIconCircle}>
                <Lock size={18} color="#8C6A21" />
              </div>
              <div>
                <h3 style={styles.cardSectionTitle}>Staff Identity & Credentials</h3>
                <p style={styles.cardSectionSub}>Coordinator profile and cryptographic sign-in passkey</p>
              </div>
            </div>

            <div style={styles.formStack}>
              <div>
                <label style={styles.label}>Full Name *</label>
                <div style={styles.inputWithIconWrap}>
                  <UserCheck size={16} color="#8A9AA8" style={styles.inputLeftIcon} />
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g. Rahel Tadesse"
                    style={{ ...styles.fullInput, paddingLeft: '38px' }}
                  />
                </div>
              </div>

              <div>
                <label style={styles.label}>Official Administrative Email *</label>
                <div style={styles.inputWithIconWrap}>
                  <Mail size={16} color="#8A9AA8" style={styles.inputLeftIcon} />
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="e.g. rahel@daleel.et"
                    style={{ ...styles.fullInput, paddingLeft: '38px' }}
                  />
                </div>
              </div>

              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                  <label style={{ ...styles.label, margin: 0 }}>Initial Access Passkey *</label>
                  <button
                    type="button"
                    onClick={handleGenerateKey}
                    style={styles.generateKeyBtn}
                  >
                    <Sparkles size={13} color="#8C6A21" />
                    <span>Generate Secure Key</span>
                  </button>
                </div>
                <div style={styles.inputWithIconWrap}>
                  <KeyRound size={16} color="#8A9AA8" style={styles.inputLeftIcon} />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    placeholder="Minimum 8 characters"
                    style={{ ...styles.fullInput, paddingLeft: '38px', paddingRight: '40px' }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    style={styles.eyeToggleBtn}
                    title={showPassword ? 'Hide passkey' : 'Show passkey'}
                  >
                    {showPassword ? <EyeOff size={16} color="#5A687A" /> : <Eye size={16} color="#5A687A" />}
                  </button>
                </div>
              </div>

              <div>
                <label style={styles.label}>Direct Contact Phone (Optional)</label>
                <div style={styles.inputWithIconWrap}>
                  <Phone size={16} color="#8A9AA8" style={styles.inputLeftIcon} />
                  <input
                    type="text"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="+251 91 100 0000"
                    style={{ ...styles.fullInput, paddingLeft: '38px' }}
                  />
                </div>
              </div>

              {/* Security Advisory Callout */}
              <div style={styles.securityNoticeBox}>
                <ShieldCheck size={18} color="#8C6A21" style={{ flexShrink: 0, marginTop: '2px' }} />
                <div>
                  <div style={styles.securityNoticeTitle}>Administrative Access Policy</div>
                  <div style={styles.securityNoticeText}>
                    New coordinators receive administrative sign-in privileges immediately. Credentials must only be provisioned to authorized institutional personnel.
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Delegated Role Area */}
          <div style={styles.formCard}>
            <div style={styles.cardHeaderPod}>
              <div style={styles.headerIconCircle}>
                <SelectedRoleIcon size={18} color="#8C6A21" />
              </div>
              <div>
                <h3 style={styles.cardSectionTitle}>Area of Delegated Responsibility</h3>
                <p style={styles.cardSectionSub}>Select platform operational scope assigned to this coordinator</p>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {ROLE_OPTIONS.map((opt) => {
                const isSelected = formData.adminRole === opt.value;
                const RoleIcon = opt.icon;

                return (
                  <div
                    key={opt.value}
                    style={{
                      ...styles.roleSelectCard,
                      ...(isSelected ? styles.roleSelectCardActive : {}),
                    }}
                    onClick={() => setFormData({ ...formData, adminRole: opt.value })}
                  >
                    <div style={styles.roleSelectHeader}>
                      <div
                        style={{
                          ...styles.roleIconCircle,
                          ...(isSelected ? styles.roleIconCircleActive : {}),
                        }}
                      >
                        <RoleIcon size={17} color={isSelected ? '#8C6A21' : '#07152B'} />
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <span style={styles.roleOptionTitle}>{opt.label}</span>
                          {isSelected ? (
                            <CheckCircle2 size={18} color="#8C6A21" />
                          ) : (
                            <div style={styles.radioDotWrap} />
                          )}
                        </div>
                        <p style={styles.roleOptionDesc}>{opt.desc}</p>

                        <div style={styles.permissionsPillRow}>
                          {opt.permissions.map((perm) => (
                            <span
                              key={perm}
                              style={{
                                ...styles.permissionPill,
                                ...(isSelected ? styles.permissionPillActive : {}),
                              }}
                            >
                              {perm}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Scope Summary Footer */}
            <div style={styles.scopeSummaryFooter}>
              <div style={styles.scopeSummaryLabel}>SUMMARY OF AUTHORIZATION</div>
              <div style={styles.scopeSummaryValue}>
                Authorizing <strong>{formData.name || 'Coordinator'}</strong> with <strong>{selectedRoleConfig.label}</strong> credentials.
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Catalog Directory List View
  return (
    <div style={styles.container}>
      {/* Top Header Row */}
      <div style={styles.topRow}>
        <div>
          <h2 style={styles.sectionTitle}>Administrative Team & Staff</h2>
          <p style={styles.sectionDesc}>
            Manage authorized platform coordinators, delegate management areas, and maintain operational staff.
          </p>
        </div>

        <div style={styles.actionsGroup}>
          <button className="btn btn-secondary" onClick={loadTeam}>
            <RefreshCw size={15} color="#07152B" />
            <span>Refresh</span>
          </button>
          <button className="btn btn-primary" onClick={handleOpenCreate}>
            <Plus size={16} color="#07152B" />
            <span>Onboard Coordinator</span>
          </button>
        </div>
      </div>

      {/* Role Delegation Guide Cards */}
      <div style={styles.roleGuideGrid}>
        {ROLE_OPTIONS.map((opt) => {
          const RoleIcon = opt.icon;
          return (
            <div key={opt.value} style={styles.roleCard}>
              <div style={styles.roleCardHeader}>
                <div style={styles.roleGuideIconBadge}>
                  <RoleIcon size={14} color="#8C6A21" />
                </div>
                <span style={styles.roleCardTitle}>{opt.label}</span>
              </div>
              <div style={styles.roleCardDesc}>{opt.desc}</div>
            </div>
          );
        })}
      </div>

      {/* Search & Team Table */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div style={styles.searchWrapper}>
          <Search size={16} color="#8A9AA8" style={{ position: 'absolute', left: '12px' }} />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search staff by coordinator name, email, or role..."
            style={styles.searchInput}
          />
        </div>

        <div className="table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Administrative Coordinator</th>
                <th>Assigned Responsibility</th>
                <th>Contact Phone</th>
                <th>Status</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={5} style={{ textAlign: 'center', padding: '36px', color: '#5A687A' }}>
                    Loading administrative team...
                  </td>
                </tr>
              ) : filteredTeam.length === 0 ? (
                <tr>
                  <td colSpan={5} style={{ textAlign: 'center', padding: '36px', color: '#5A687A' }}>
                    No administrative team members found.
                  </td>
                </tr>
              ) : (
                filteredTeam.map((member) => (
                  <tr key={member.id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={styles.avatarCircle}>
                          {member.name?.charAt(0).toUpperCase() || 'A'}
                        </div>
                        <div>
                          <div style={styles.memberName}>{member.name}</div>
                          <div style={styles.memberEmail}>
                            <Mail size={12} color="#8A9AA8" style={{ display: 'inline', marginRight: '4px' }} />
                            <span>{member.email}</span>
                          </div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className="badge badge-gold">{getRoleLabel(member.adminRole)}</span>
                    </td>
                    <td>
                      <div style={{ fontSize: '13px', color: '#07152B' }}>
                        {member.phone ? (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <Phone size={12} color="#8A9AA8" />
                            <span>{member.phone}</span>
                          </div>
                        ) : (
                          <span style={{ color: '#8A9AA8' }}>Unspecified</span>
                        )}
                      </div>
                    </td>
                    <td>
                      <span className="badge badge-success">
                        <UserCheck size={12} color="#16803C" />
                        <span>Active</span>
                      </span>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '8px' }}>
                        {adminUser?.adminRole === 'SUPER_ADMIN' && (
                          <button
                            type="button"
                            onClick={() => setResetTargetUser(member)}
                            title={`Reset & Assign Password for ${member.name}`}
                            style={{
                              backgroundColor: '#F8F4EC',
                              border: '1px solid #E0C582',
                              borderRadius: '7px',
                              padding: '5px 9px',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '5px',
                              color: '#8C6A21',
                              fontSize: '11.5px',
                              fontWeight: 700,
                              cursor: 'pointer',
                              transition: 'all 0.15s ease',
                            }}
                          >
                            <KeyRound size={13} color="#8C6A21" />
                            <span>Reset Key</span>
                          </button>
                        )}
                        {member.id !== adminUser?.id ? (
                          <button
                            className="btn-icon"
                            onClick={() => handleDelete(member.id, member.name)}
                            title="Revoke Access"
                          >
                            <Trash2 size={15} color="#C53030" />
                          </button>
                        ) : (
                          <span style={{ fontSize: '11.5px', color: '#8A9AA8', fontStyle: 'italic', paddingRight: '4px' }}>
                            Current Session
                          </span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Super Administrator Master Credential Assignment Tool */}
      <ResetPasswordModal
        isOpen={!!resetTargetUser}
        user={resetTargetUser}
        onClose={() => setResetTargetUser(null)}
        onSuccess={() => loadTeam()}
      />
    </div>
  );
};

const styles: { [key: string]: React.CSSProperties } = {
  container: {
    padding: '32px',
    maxWidth: '1400px',
    margin: '0 auto',
    display: 'flex',
    flexDirection: 'column',
    gap: '24px',
  },
  topRow: {
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: '16px',
    flexWrap: 'wrap',
  },
  sectionTitle: {
    fontSize: '26px',
    color: '#07152B',
    margin: 0,
  },
  sectionDesc: {
    fontSize: '13.5px',
    color: '#5A687A',
    marginTop: '4px',
  },
  actionsGroup: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
  },
  roleGuideGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: '12px',
  },
  roleCard: {
    backgroundColor: '#FFFFFF',
    border: '1px solid #E4E9F0',
    borderRadius: '10px',
    padding: '14px',
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
    boxShadow: '0 1px 3px rgba(7, 21, 43, 0.04)',
  },
  roleCardHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  roleCardTitle: {
    fontSize: '13px',
    fontWeight: 700,
    color: '#07152B',
  },
  roleCardDesc: {
    fontSize: '11.5px',
    color: '#5A687A',
    lineHeight: 1.4,
  },
  searchWrapper: {
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
    width: '360px',
  },
  searchInput: {
    width: '100%',
    padding: '10px 14px 10px 36px',
    backgroundColor: '#FFFFFF',
    border: '1px solid #E4E9F0',
    borderRadius: '8px',
    fontSize: '13.5px',
    color: '#07152B',
  },
  avatarCircle: {
    width: '38px',
    height: '38px',
    borderRadius: '50%',
    backgroundColor: '#07152B',
    color: '#DFB76C',
    fontWeight: 800,
    fontSize: '15px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    border: '1px solid #DFB76C',
    flexShrink: 0,
  },
  memberName: {
    fontSize: '14px',
    fontWeight: 700,
    color: '#07152B',
  },
  memberEmail: {
    fontSize: '12px',
    color: '#5A687A',
    marginTop: '1px',
    display: 'flex',
    alignItems: 'center',
  },
  errorBox: {
    backgroundColor: '#FFF0F0',
    border: '1px solid rgba(214, 48, 49, 0.3)',
    color: '#D63031',
    padding: '12px 16px',
    borderRadius: '8px',
    fontSize: '13px',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  label: {
    display: 'block',
    fontSize: '12px',
    fontWeight: 700,
    color: '#07152B',
    marginBottom: '6px',
  },
  // In-Page Dedicated Editor Styles
  editorNav: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    border: '1px solid #E4E9F0',
    borderRadius: '12px',
    padding: '16px 20px',
    boxShadow: '0 2px 8px rgba(7, 21, 43, 0.03)',
  },
  editorNavLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
  },
  backBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    padding: '8px 14px',
    backgroundColor: '#F8FAFC',
    border: '1px solid #E4E9F0',
    borderRadius: '8px',
    fontSize: '13px',
    fontWeight: 600,
    color: '#07152B',
    cursor: 'pointer',
  },
  editorBreadcrumbs: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    fontSize: '13px',
  },
  breadcrumbMuted: {
    color: '#8A9AA8',
  },
  breadcrumbSep: {
    color: '#CBD5E1',
  },
  breadcrumbCurrent: {
    fontWeight: 700,
    color: '#07152B',
  },
  editorNavActions: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
  },
  editorGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: '24px',
    alignItems: 'start',
  },
  formCard: {
    backgroundColor: '#FFFFFF',
    border: '1px solid #E4E9F0',
    borderRadius: '14px',
    padding: '24px',
    boxShadow: '0 2px 8px rgba(7, 21, 43, 0.03)',
  },
  cardSectionTitle: {
    fontSize: '18px',
    color: '#07152B',
    margin: '0 0 4px 0',
  },
  cardSectionSub: {
    fontSize: '12.5px',
    color: '#5A687A',
    margin: '0 0 18px 0',
  },
  formStack: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
  fullInput: {
    width: '100%',
    boxSizing: 'border-box',
    padding: '10px 14px',
    backgroundColor: '#FFFFFF',
    border: '1px solid #E4E9F0',
    borderRadius: '8px',
    fontSize: '13.5px',
    color: '#07152B',
  },
  roleSelectCard: {
    padding: '14px',
    borderRadius: '10px',
    border: '1px solid #E4E9F0',
    backgroundColor: '#FFFFFF',
    cursor: 'pointer',
    transition: 'all 0.15s ease',
  },
  roleSelectCardActive: {
    borderColor: '#DFB76C',
    backgroundColor: '#F8F4EC',
    boxShadow: '0 2px 8px rgba(223, 183, 108, 0.18)',
  },
  roleSelectHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
  },
  radioDotWrap: {
    width: '16px',
    height: '16px',
    borderRadius: '50%',
    border: '2px solid #CBD5E1',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioDot: {
    width: '8px',
    height: '8px',
    borderRadius: '50%',
    backgroundColor: 'transparent',
  },
  radioDotActive: {
    backgroundColor: '#8C6A21',
  },
  roleOptionTitle: {
    fontSize: '13.5px',
    fontWeight: 700,
    color: '#07152B',
  },
  roleOptionDesc: {
    fontSize: '12px',
    color: '#5A687A',
    margin: '4px 0 0 0',
  },
  cardHeaderPod: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    marginBottom: '18px',
  },
  headerIconCircle: {
    width: '38px',
    height: '38px',
    borderRadius: '10px',
    backgroundColor: '#F8F4EC',
    border: '1px solid #DFB76C',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  inputWithIconWrap: {
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
    width: '100%',
  },
  inputLeftIcon: {
    position: 'absolute',
    left: '12px',
    pointerEvents: 'none',
  },
  generateKeyBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '4px',
    padding: '3px 8px',
    backgroundColor: '#F8F4EC',
    border: '1px solid #DFB76C',
    borderRadius: '6px',
    fontSize: '11px',
    fontWeight: 700,
    color: '#8C6A21',
    cursor: 'pointer',
    transition: 'all 0.15s ease',
  },
  eyeToggleBtn: {
    position: 'absolute',
    right: '10px',
    background: 'transparent',
    border: 'none',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '4px',
  },
  securityNoticeBox: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '10px',
    backgroundColor: '#FBF9F5',
    border: '1px solid rgba(223, 183, 108, 0.4)',
    borderRadius: '10px',
    padding: '14px',
    marginTop: '6px',
  },
  securityNoticeTitle: {
    fontSize: '12.5px',
    fontWeight: 700,
    color: '#07152B',
    marginBottom: '3px',
  },
  securityNoticeText: {
    fontSize: '11.5px',
    color: '#5A687A',
    lineHeight: 1.45,
  },
  roleIconCircle: {
    width: '36px',
    height: '36px',
    borderRadius: '9px',
    backgroundColor: '#F1F5F9',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    transition: 'all 0.15s ease',
  },
  roleIconCircleActive: {
    backgroundColor: '#F8F4EC',
    border: '1px solid #DFB76C',
  },
  permissionsPillRow: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '5px',
    marginTop: '8px',
  },
  permissionPill: {
    fontSize: '10.5px',
    fontWeight: 600,
    color: '#5A687A',
    backgroundColor: '#F1F5F9',
    padding: '2px 7px',
    borderRadius: '5px',
  },
  permissionPillActive: {
    color: '#8C6A21',
    backgroundColor: '#FFFFFF',
    border: '1px solid #E0C582',
  },
  scopeSummaryFooter: {
    marginTop: '16px',
    padding: '14px 16px',
    backgroundColor: '#F8FAFC',
    border: '1px solid #E4E9F0',
    borderRadius: '10px',
  },
  scopeSummaryLabel: {
    fontSize: '10.5px',
    fontWeight: 800,
    letterSpacing: '0.5px',
    color: '#8C6A21',
    marginBottom: '4px',
  },
  scopeSummaryValue: {
    fontSize: '12.5px',
    color: '#07152B',
    lineHeight: 1.4,
  },
  roleGuideIconBadge: {
    width: '24px',
    height: '24px',
    borderRadius: '6px',
    backgroundColor: '#F8F4EC',
    border: '1px solid #E0C582',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
};
