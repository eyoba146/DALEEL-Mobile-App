import React, { useState } from 'react';
import { useAdminAuth } from '../context/AuthContext';
import { adminApi } from '../api';
import { useToast } from '../context/ToastContext';
import {
  User,
  Lock,
  Eye,
  EyeOff,
  CheckCircle2,
  XCircle,
  KeyRound,
  ShieldCheck,
  Smartphone,
  Mail,
  Save,
  Shield,
  Building,
} from 'lucide-react';

export const ProfileSecurityView: React.FC = () => {
  const { adminUser, refreshUser } = useAdminAuth();
  const { success, error: toastError } = useToast();

  const [activeTab, setActiveTab] = useState<'profile' | 'password' | 'permissions'>('profile');

  // Profile Details Form State
  const [name, setName] = useState(adminUser?.name || '');
  const [phone, setPhone] = useState(adminUser?.phone || '');
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  // Password & Security Form State
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPass, setShowCurrentPass] = useState(false);
  const [showNewPass, setShowNewPass] = useState(false);
  const [isSavingPass, setIsSavingPass] = useState(false);

  const getRoleDisplayName = (role?: string) => {
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
        return 'Platform Administrator';
    }
  };

  const calculatePasswordStrength = (pass: string) => {
    if (!pass) return { score: 0, label: 'None', color: '#8A9AA8' };
    let score = 0;
    if (pass.length >= 6) score += 1;
    if (pass.length >= 10) score += 1;
    if (/[A-Z]/.test(pass)) score += 1;
    if (/[0-9]/.test(pass)) score += 1;
    if (/[^A-Za-z0-9]/.test(pass)) score += 1;

    if (score <= 2) return { score: 1, label: 'Weak', color: '#EF4444' };
    if (score <= 4) return { score: 2, label: 'Good', color: '#DFB76C' };
    return { score: 3, label: 'Strong', color: '#10B981' };
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toastError('Display name cannot be empty.', 'Validation Error');
      return;
    }

    setIsSavingProfile(true);
    try {
      await adminApi.updateProfile({
        name: name.trim(),
        phone: phone.trim() || undefined,
      });
      await refreshUser();
      success('Profile details updated successfully.', 'Profile Saved');
    } catch (err: any) {
      toastError(err.message || 'Failed to update profile details.', 'Update Error');
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPassword) {
      toastError('Please enter your current password.', 'Validation Error');
      return;
    }
    if (newPassword.length < 6) {
      toastError('New password must be at least 6 characters.', 'Validation Error');
      return;
    }
    if (newPassword !== confirmPassword) {
      toastError('New password and confirmation do not match.', 'Validation Error');
      return;
    }

    setIsSavingPass(true);
    try {
      await adminApi.changePassword(currentPassword, newPassword);
      success('Your password has been changed successfully.', 'Password Changed');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      toastError(err.message || 'Failed to update password. Please check your current password.', 'Update Failed');
    } finally {
      setIsSavingPass(false);
    }
  };

  const strength = calculatePasswordStrength(newPassword);

  const permissionsList = [
    {
      module: 'Executive Overview',
      desc: 'System activity metrics, incoming inquiries, and analytics',
      hasAccess: true,
      roleScope: 'All Administrators',
    },
    {
      module: 'Heritage & Tourism',
      desc: 'UNESCO destinations, attractions, and geographical coordinates',
      hasAccess: adminUser?.adminRole === 'SUPER_ADMIN' || adminUser?.adminRole === 'DESTINATION_MANAGER',
      roleScope: 'Tourism & Heritage Lead / Full Administrator',
    },
    {
      module: 'Verified Services Directory',
      desc: 'Partner business listings, verified badges, and client inquiries',
      hasAccess: adminUser?.adminRole === 'SUPER_ADMIN' || adminUser?.adminRole === 'SERVICE_MANAGER',
      roleScope: 'Services Directory Lead / Full Administrator',
    },
    {
      module: 'Events & Gatherings',
      desc: 'Summits, cultural gatherings, venues, and attendee registrations',
      hasAccess: adminUser?.adminRole === 'SUPER_ADMIN' || adminUser?.adminRole === 'EVENT_MANAGER',
      roleScope: 'Events Coordinator / Full Administrator',
    },
    {
      module: 'Artisan Marketplace',
      desc: 'Traditional crafts catalog, inventory pricing, and customer orders',
      hasAccess: adminUser?.adminRole === 'SUPER_ADMIN' || adminUser?.adminRole === 'MARKETPLACE_MANAGER',
      roleScope: 'Marketplace Lead / Full Administrator',
    },
    {
      module: 'Diaspora Investments',
      desc: 'High-growth syndicates, venture projects, and investor prospectuses',
      hasAccess: adminUser?.adminRole === 'SUPER_ADMIN' || adminUser?.adminRole === 'INVESTMENT_OFFICER',
      roleScope: 'Investment Officer / Full Administrator',
    },
    {
      module: 'Administrative Team Management',
      desc: 'Coordinator onboarding, access authorization, and security controls',
      hasAccess: adminUser?.adminRole === 'SUPER_ADMIN',
      roleScope: 'Full Administrator Only',
    },
  ];

  return (
    <div style={styles.container}>
      {/* Top Breadcrumbs & Page Header */}
      <div style={styles.topHeader}>
        <div>
          <div style={styles.breadcrumb}>
            <span style={styles.breadcrumbMuted}>Platform Settings</span>
            <span style={styles.breadcrumbSep}>/</span>
            <span style={styles.breadcrumbCurrent}>Security & Profile</span>
          </div>
          <h1 style={styles.pageTitle}>Security & Profile Settings</h1>
          <p style={styles.pageSubtitle}>
            Manage your personal administrative identity, update your security password, and review your assigned permissions.
          </p>
        </div>
      </div>

      {/* Institutional Profile Identity Banner */}
      <div style={styles.identityCard}>
        <div style={styles.identityLeft}>
          <div style={styles.avatarLarge}>
            {adminUser?.name ? adminUser.name.charAt(0).toUpperCase() : 'A'}
          </div>
          <div style={styles.identityMeta}>
            <div style={styles.identityNameRow}>
              <h2 style={styles.identityName}>{adminUser?.name}</h2>
              <span className="badge badge-gold" style={{ fontSize: '12px', padding: '3px 10px' }}>
                {getRoleDisplayName(adminUser?.adminRole)}
              </span>
            </div>
            <div style={styles.identityDetails}>
              <span style={styles.identityDetailItem}>
                <Mail size={13} color="#8A9AA8" />
                <span>{adminUser?.email}</span>
              </span>
              {adminUser?.phone && (
                <span style={styles.identityDetailItem}>
                  <Smartphone size={13} color="#8A9AA8" />
                  <span>{adminUser?.phone}</span>
                </span>
              )}
              <span style={styles.identityDetailItem}>
                <Building size={13} color="#8A9AA8" />
                <span>DALEEL Platform Administration</span>
              </span>
            </div>
          </div>
        </div>

        <div style={styles.identityRight}>
          <div style={styles.statusPill}>
            <span style={styles.statusDot} />
            <span>Account Active & Verified</span>
          </div>
        </div>
      </div>

      {/* Sub-Navigation Tabs */}
      <div style={styles.tabNav}>
        <button
          type="button"
          style={{
            ...styles.tabBtn,
            ...(activeTab === 'profile' ? styles.tabBtnActive : {}),
          }}
          onClick={() => setActiveTab('profile')}
        >
          <User size={16} color={activeTab === 'profile' ? '#07152B' : '#5A687A'} />
          <span>Profile Details</span>
        </button>

        <button
          type="button"
          style={{
            ...styles.tabBtn,
            ...(activeTab === 'password' ? styles.tabBtnActive : {}),
          }}
          onClick={() => setActiveTab('password')}
        >
          <Lock size={16} color={activeTab === 'password' ? '#07152B' : '#5A687A'} />
          <span>Password & Credentials</span>
        </button>

        <button
          type="button"
          style={{
            ...styles.tabBtn,
            ...(activeTab === 'permissions' ? styles.tabBtnActive : {}),
          }}
          onClick={() => setActiveTab('permissions')}
        >
          <ShieldCheck size={16} color={activeTab === 'permissions' ? '#07152B' : '#5A687A'} />
          <span>Access & Permissions</span>
        </button>
      </div>

      {/* TAB 1: Profile Details Form */}
      {activeTab === 'profile' && (
        <div style={styles.workspaceCard}>
          <div style={styles.cardHeader}>
            <h3 style={styles.cardTitle}>Personal Information</h3>
            <p style={styles.cardSubtitle}>
              Update your administrative profile name and contact number shown across the team directory.
            </p>
          </div>

          <form onSubmit={handleSaveProfile} style={styles.formStack}>
            <div style={styles.formGrid2}>
              <div>
                <label style={styles.label}>Full Name *</label>
                <div style={styles.inputWrap}>
                  <User size={16} color="#8A9AA8" style={styles.fieldIcon} />
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Your official name"
                    style={{ ...styles.inputField, paddingLeft: '38px' }}
                  />
                </div>
              </div>

              <div>
                <label style={styles.label}>Direct Contact Phone</label>
                <div style={styles.inputWrap}>
                  <Smartphone size={16} color="#8A9AA8" style={styles.fieldIcon} />
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+251 91 100 0000"
                    style={{ ...styles.inputField, paddingLeft: '38px' }}
                  />
                </div>
              </div>
            </div>

            <div style={styles.formGrid2}>
              <div>
                <label style={styles.label}>Official Administrative Email</label>
                <div style={styles.inputWrap}>
                  <Mail size={16} color="#8A9AA8" style={styles.fieldIcon} />
                  <input
                    type="email"
                    disabled
                    value={adminUser?.email || ''}
                    style={{ ...styles.inputField, paddingLeft: '38px', backgroundColor: '#F8FAFC', color: '#64748B' }}
                  />
                </div>
                <span style={styles.fieldHint}>
                  Official email addresses are managed centrally by the Super Administrator.
                </span>
              </div>

              <div>
                <label style={styles.label}>Assigned Role Authority</label>
                <div style={styles.inputWrap}>
                  <Shield size={16} color="#8A9AA8" style={styles.fieldIcon} />
                  <input
                    type="text"
                    disabled
                    value={getRoleDisplayName(adminUser?.adminRole)}
                    style={{ ...styles.inputField, paddingLeft: '38px', backgroundColor: '#F8FAFC', color: '#64748B' }}
                  />
                </div>
                <span style={styles.fieldHint}>
                  Role permissions determine which platform modules you are authorized to manage.
                </span>
              </div>
            </div>

            <div style={styles.actionsBar}>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={isSavingProfile}
                style={{ minWidth: '180px' }}
              >
                <Save size={15} color="#07152B" />
                <span>{isSavingProfile ? 'Saving Details...' : 'Save Profile Details'}</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* TAB 2: Password & Credentials Form */}
      {activeTab === 'password' && (
        <div style={styles.workspaceCard}>
          <div style={styles.cardHeader}>
            <h3 style={styles.cardTitle}>Update Account Password</h3>
            <p style={styles.cardSubtitle}>
              Ensure your administrative account remains protected with a strong, secure password.
            </p>
          </div>

          <form onSubmit={handleChangePassword} style={styles.formStack}>
            {/* Current Password Field */}
            <div style={{ maxWidth: '540px' }}>
              <label style={styles.label}>Current Password *</label>
              <div style={styles.inputWrap}>
                <KeyRound size={16} color="#8A9AA8" style={styles.fieldIcon} />
                <input
                  type={showCurrentPass ? 'text' : 'password'}
                  required
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="Enter your existing password"
                  style={{ ...styles.inputField, paddingLeft: '38px', paddingRight: '40px' }}
                />
                <button
                  type="button"
                  onClick={() => setShowCurrentPass(!showCurrentPass)}
                  style={styles.eyeBtn}
                  aria-label="Toggle password visibility"
                >
                  {showCurrentPass ? <EyeOff size={15} color="#8A9AA8" /> : <Eye size={15} color="#8A9AA8" />}
                </button>
              </div>
            </div>

            <div style={styles.formGrid2}>
              {/* New Password Field */}
              <div>
                <label style={styles.label}>New Password *</label>
                <div style={styles.inputWrap}>
                  <Lock size={16} color="#8A9AA8" style={styles.fieldIcon} />
                  <input
                    type={showNewPass ? 'text' : 'password'}
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Minimum 6 characters"
                    style={{ ...styles.inputField, paddingLeft: '38px', paddingRight: '40px' }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPass(!showNewPass)}
                    style={styles.eyeBtn}
                    aria-label="Toggle password visibility"
                  >
                    {showNewPass ? <EyeOff size={15} color="#8A9AA8" /> : <Eye size={15} color="#8A9AA8" />}
                  </button>
                </div>

                {/* Password Strength Indicator */}
                {newPassword && (
                  <div style={styles.strengthBox}>
                    <div style={styles.strengthHeader}>
                      <span style={{ fontSize: '11.5px', color: '#5A687A' }}>Password Strength:</span>
                      <span style={{ fontSize: '12px', fontWeight: 700, color: strength.color }}>
                        {strength.label}
                      </span>
                    </div>
                    <div style={styles.strengthBarWrap}>
                      <div
                        style={{
                          height: '100%',
                          width: `${(strength.score / 3) * 100}%`,
                          backgroundColor: strength.color,
                          borderRadius: '9999px',
                          transition: 'all 0.25s ease',
                        }}
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Confirm Password Field */}
              <div>
                <label style={styles.label}>Confirm New Password *</label>
                <div style={styles.inputWrap}>
                  <Lock size={16} color="#8A9AA8" style={styles.fieldIcon} />
                  <input
                    type="password"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Re-enter your new password"
                    style={{ ...styles.inputField, paddingLeft: '38px' }}
                  />
                </div>
                {confirmPassword && newPassword && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '6px' }}>
                    {confirmPassword === newPassword ? (
                      <>
                        <CheckCircle2 size={13} color="#10B981" />
                        <span style={{ fontSize: '11.5px', color: '#059669', fontWeight: 600 }}>
                          Passwords match
                        </span>
                      </>
                    ) : (
                      <>
                        <XCircle size={13} color="#EF4444" />
                        <span style={{ fontSize: '11.5px', color: '#DC2626', fontWeight: 600 }}>
                          Passwords do not match
                        </span>
                      </>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Password Policy Guidelines */}
            <div style={styles.policyCard}>
              <div style={styles.policyTitle}>Security Recommendations:</div>
              <div style={styles.policyGrid}>
                <div style={styles.policyItem}>
                  <span style={newPassword.length >= 6 ? styles.checkGreen : styles.checkMuted}>●</span>
                  <span>At least 6 characters in length</span>
                </div>
                <div style={styles.policyItem}>
                  <span style={/[A-Z]/.test(newPassword) ? styles.checkGreen : styles.checkMuted}>●</span>
                  <span>Includes uppercase and lowercase letters</span>
                </div>
                <div style={styles.policyItem}>
                  <span style={/[0-9]/.test(newPassword) ? styles.checkGreen : styles.checkMuted}>●</span>
                  <span>Includes numbers (0-9)</span>
                </div>
                <div style={styles.policyItem}>
                  <span style={/[^A-Za-z0-9]/.test(newPassword) ? styles.checkGreen : styles.checkMuted}>●</span>
                  <span>Includes special symbols (!@#$%^&*)</span>
                </div>
              </div>
            </div>

            <div style={styles.actionsBar}>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={isSavingPass || !currentPassword || !newPassword || newPassword !== confirmPassword}
                style={{ minWidth: '180px' }}
              >
                <KeyRound size={15} color="#07152B" />
                <span>{isSavingPass ? 'Updating...' : 'Update Password'}</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* TAB 3: Access & Permissions View */}
      {activeTab === 'permissions' && (
        <div style={styles.workspaceCard}>
          <div style={styles.cardHeader}>
            <h3 style={styles.cardTitle}>Assigned Role & Privileges</h3>
            <p style={styles.cardSubtitle}>
              Overview of platform module permissions associated with your administrative authorization level.
            </p>
          </div>

          <div style={styles.permissionsGrid}>
            {permissionsList.map((item) => (
              <div
                key={item.module}
                style={{
                  ...styles.permCard,
                  borderColor: item.hasAccess ? '#E0C582' : '#E2E8F0',
                  backgroundColor: item.hasAccess ? '#FFFFFF' : '#F8FAFC',
                }}
              >
                <div style={styles.permCardHeader}>
                  <div style={styles.permTitle}>{item.module}</div>
                  {item.hasAccess ? (
                    <span className="badge badge-success" style={{ fontSize: '11px' }}>
                      <CheckCircle2 size={11} />
                      <span>Authorized</span>
                    </span>
                  ) : (
                    <span className="badge badge-neutral" style={{ fontSize: '11px' }}>
                      <span>Restricted</span>
                    </span>
                  )}
                </div>
                <div style={styles.permDesc}>{item.desc}</div>
                <div style={styles.permScope}>
                  <span style={{ fontWeight: 650, color: '#07152B' }}>Scope: </span>
                  <span>{item.roleScope}</span>
                </div>
              </div>
            ))}
          </div>

          <div style={styles.scopeNotice}>
            <Shield size={16} color="#8C6A21" style={{ flexShrink: 0, marginTop: '2px' }} />
            <div style={{ fontSize: '12.5px', color: '#5A4310', lineHeight: 1.5 }}>
              To request adjustments to your module access privileges or assume responsibility for additional platform sections, please contact the Super Administrator.
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const styles: { [key: string]: React.CSSProperties } = {
  container: {
    padding: '32px',
    maxWidth: '1200px',
    margin: '0 auto',
    display: 'flex',
    flexDirection: 'column',
    gap: '24px',
  },
  topHeader: {
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: '16px',
    flexWrap: 'wrap',
  },
  breadcrumb: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    fontSize: '12px',
    marginBottom: '6px',
  },
  breadcrumbMuted: {
    color: '#8A9AA8',
    fontWeight: 600,
  },
  breadcrumbSep: {
    color: '#CBD5E1',
  },
  breadcrumbCurrent: {
    color: '#8C6A21',
    fontWeight: 700,
  },
  pageTitle: {
    fontSize: '26px',
    fontWeight: 800,
    color: '#07152B',
    margin: 0,
    letterSpacing: '-0.02em',
  },
  pageSubtitle: {
    fontSize: '13.5px',
    color: '#5A687A',
    margin: '4px 0 0 0',
  },
  identityCard: {
    backgroundColor: '#FFFFFF',
    border: '1px solid #E2E8F0',
    borderRadius: '16px',
    padding: '24px 28px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '20px',
    flexWrap: 'wrap',
    boxShadow: '0 2px 10px rgba(7, 21, 43, 0.04)',
  },
  identityLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '20px',
  },
  avatarLarge: {
    width: '64px',
    height: '64px',
    borderRadius: '50%',
    backgroundColor: '#07152B',
    color: '#DFB76C',
    fontSize: '24px',
    fontWeight: 800,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    border: '2px solid #DFB76C',
    boxShadow: '0 4px 14px rgba(7, 21, 43, 0.2)',
    flexShrink: 0,
  },
  identityMeta: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
  },
  identityNameRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    flexWrap: 'wrap',
  },
  identityName: {
    fontSize: '20px',
    fontWeight: 800,
    color: '#07152B',
    margin: 0,
    letterSpacing: '-0.01em',
  },
  identityDetails: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
    flexWrap: 'wrap',
    fontSize: '12.5px',
    color: '#5A687A',
  },
  identityDetailItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
  },
  identityRight: {
    display: 'flex',
    alignItems: 'center',
  },
  statusPill: {
    display: 'flex',
    alignItems: 'center',
    gap: '7px',
    padding: '6px 14px',
    backgroundColor: '#ECFDF5',
    border: '1px solid #A7F3D0',
    borderRadius: '9999px',
    fontSize: '12px',
    fontWeight: 700,
    color: '#047857',
  },
  statusDot: {
    width: '7px',
    height: '7px',
    borderRadius: '50%',
    backgroundColor: '#10B981',
  },
  tabNav: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    borderBottom: '1px solid #E2E8F0',
    paddingBottom: '2px',
  },
  tabBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '10px 18px',
    borderRadius: '8px 8px 0 0',
    backgroundColor: 'transparent',
    border: 'none',
    borderBottom: '2px solid transparent',
    color: '#5A687A',
    fontSize: '13.5px',
    fontWeight: 650,
    cursor: 'pointer',
    transition: 'all 0.15s ease',
  },
  tabBtnActive: {
    color: '#07152B',
    borderBottom: '2px solid #07152B',
    backgroundColor: 'rgba(7, 21, 43, 0.03)',
  },
  workspaceCard: {
    backgroundColor: '#FFFFFF',
    border: '1px solid #E2E8F0',
    borderRadius: '16px',
    padding: '30px 32px',
    boxShadow: '0 2px 10px rgba(7, 21, 43, 0.04)',
    display: 'flex',
    flexDirection: 'column',
    gap: '24px',
  },
  cardHeader: {
    borderBottom: '1px solid #F1F4F9',
    paddingBottom: '16px',
  },
  cardTitle: {
    fontSize: '18px',
    fontWeight: 750,
    color: '#07152B',
    margin: 0,
  },
  cardSubtitle: {
    fontSize: '13px',
    color: '#5A687A',
    margin: '4px 0 0 0',
  },
  formStack: {
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
  },
  formGrid2: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
    gap: '20px',
  },
  label: {
    display: 'block',
    fontSize: '12.5px',
    fontWeight: 700,
    color: '#07152B',
    marginBottom: '6px',
  },
  inputWrap: {
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
  },
  fieldIcon: {
    position: 'absolute',
    left: '12px',
    pointerEvents: 'none',
  },
  inputField: {
    width: '100%',
    padding: '11px 14px',
    fontSize: '13.5px',
    border: '1px solid #CBD5E1',
    borderRadius: '9px',
    color: '#07152B',
    outline: 'none',
    backgroundColor: '#FFFFFF',
    transition: 'all 0.15s ease',
    boxSizing: 'border-box',
  },
  fieldHint: {
    display: 'block',
    fontSize: '11.5px',
    color: '#8A9AA8',
    marginTop: '4px',
  },
  eyeBtn: {
    position: 'absolute',
    right: '12px',
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    padding: '4px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  strengthBox: {
    marginTop: '8px',
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  },
  strengthHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  strengthBarWrap: {
    height: '5px',
    backgroundColor: '#E2E8F0',
    borderRadius: '9999px',
    overflow: 'hidden',
  },
  policyCard: {
    backgroundColor: '#F8FAFC',
    border: '1px solid #E2E8F0',
    borderRadius: '10px',
    padding: '16px 20px',
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
  },
  policyTitle: {
    fontSize: '12px',
    fontWeight: 700,
    color: '#07152B',
  },
  policyGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
    gap: '8px',
  },
  policyItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    fontSize: '12px',
    color: '#5A687A',
  },
  checkGreen: {
    color: '#10B981',
    fontSize: '14px',
  },
  checkMuted: {
    color: '#CBD5E1',
    fontSize: '14px',
  },
  actionsBar: {
    paddingTop: '16px',
    borderTop: '1px solid #F1F4F9',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'flex-start',
  },
  permissionsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
    gap: '16px',
  },
  permCard: {
    border: '1px solid #E2E8F0',
    borderRadius: '12px',
    padding: '18px 20px',
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
    transition: 'all 0.15s ease',
  },
  permCardHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  permTitle: {
    fontSize: '14px',
    fontWeight: 750,
    color: '#07152B',
  },
  permDesc: {
    fontSize: '12.5px',
    color: '#5A687A',
    lineHeight: 1.45,
  },
  permScope: {
    marginTop: '6px',
    paddingTop: '8px',
    borderTop: '1px dashed #E2E8F0',
    fontSize: '11.5px',
    color: '#64748B',
  },
  scopeNotice: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '10px',
    padding: '14px 16px',
    backgroundColor: '#FDF8E8',
    border: '1px solid #EBD59B',
    borderRadius: '10px',
  },
};
