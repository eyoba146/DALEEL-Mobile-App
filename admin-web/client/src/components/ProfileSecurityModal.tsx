import React, { useState } from 'react';
import { useAdminAuth } from '../context/AuthContext';
import { adminApi } from '../api';
import { useToast } from '../context/ToastContext';
import {
  X,
  User,
  Lock,
  Shield,
  Eye,
  EyeOff,
  CheckCircle2,
  XCircle,
  KeyRound,
  ShieldCheck,
  Smartphone,
  Mail,
  Save,
} from 'lucide-react';

interface ProfileSecurityModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTab?: 'profile' | 'password' | 'permissions';
}

export const ProfileSecurityModal: React.FC<ProfileSecurityModalProps> = ({
  isOpen,
  onClose,
  initialTab = 'profile',
}) => {
  const { adminUser } = useAdminAuth();
  const { success, error: toastError } = useToast();

  const [activeTab, setActiveTab] = useState<'profile' | 'password' | 'permissions'>(initialTab);

  // Profile Form State
  const [name, setName] = useState(adminUser?.name || '');
  const [phone, setPhone] = useState(adminUser?.phone || '');
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  // Password Form State
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPass, setShowCurrentPass] = useState(false);
  const [showNewPass, setShowNewPass] = useState(false);
  const [isSavingPass, setIsSavingPass] = useState(false);

  if (!isOpen || !adminUser) return null;

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
        return 'Administrator';
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
    return { score: 3, label: 'Strong & Institutional', color: '#10B981' };
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toastError('Name cannot be empty', 'Validation Error');
      return;
    }

    setIsSavingProfile(true);
    try {
      await adminApi.updateProfile({
        name: name.trim(),
        phone: phone.trim() || undefined,
      });
      success('Profile details updated successfully', 'Profile Saved');
      setTimeout(() => {
        window.location.reload();
      }, 750);
    } catch (err: any) {
      toastError(err.message || 'Failed to update profile', 'Update Error');
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPassword) {
      toastError('Current password is required', 'Validation Error');
      return;
    }
    if (newPassword.length < 6) {
      toastError('New password must be at least 6 characters', 'Validation Error');
      return;
    }
    if (newPassword !== confirmPassword) {
      toastError('New passwords do not match', 'Validation Error');
      return;
    }

    setIsSavingPass(true);
    try {
      await adminApi.changePassword(currentPassword, newPassword);
      success('Your password has been changed securely', 'Password Updated');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      onClose();
    } catch (err: any) {
      toastError(err.message || 'Failed to change password', 'Security Error');
    } finally {
      setIsSavingPass(false);
    }
  };

  const permissionsMatrix = [
    {
      module: 'Overview & Telemetry',
      authorized: true,
      scope: 'Live platform KPIs, incoming triage counts & activity logs',
    },
    {
      module: 'Heritage Destinations',
      authorized: adminUser.adminRole === 'SUPER_ADMIN' || adminUser.adminRole === 'DESTINATION_MANAGER',
      scope: 'UNESCO attractions, GIS map coordination, regional guides & media',
    },
    {
      module: 'Verified Services',
      authorized: adminUser.adminRole === 'SUPER_ADMIN' || adminUser.adminRole === 'SERVICE_MANAGER',
      scope: 'Partner vetting, direct contacts, address geocoding & inquiry triage',
    },
    {
      module: 'Events & Summits',
      authorized: adminUser.adminRole === 'SUPER_ADMIN' || adminUser.adminRole === 'EVENT_MANAGER',
      scope: 'Event scheduling, ticketing, venue mapping & attendee RSVPs',
    },
    {
      module: 'Artisan Marketplace',
      authorized: adminUser.adminRole === 'SUPER_ADMIN' || adminUser.adminRole === 'MARKETPLACE_MANAGER',
      scope: 'Crafts inventory, pricing, Habesha Kemis, artisan guilds & order dispatch',
    },
    {
      module: 'Diaspora Investments',
      authorized: adminUser.adminRole === 'SUPER_ADMIN' || adminUser.adminRole === 'INVESTMENT_OFFICER',
      scope: 'Capital syndicates, prospectuses, financial IRR metrics & investor inquiries',
    },
    {
      module: 'Administrative Team',
      authorized: adminUser.adminRole === 'SUPER_ADMIN',
      scope: 'Coordinator onboarding, role assignment, credential reset & access audit',
    },
  ];

  const strength = calculatePasswordStrength(newPassword);

  return (
    <div style={styles.backdrop} onClick={onClose}>
      <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
        {/* Modal Header */}
        <div style={styles.header}>
          <div style={styles.headerLeft}>
            <div style={styles.headerIcon}>
              <Shield size={20} color="#DFB76C" />
            </div>
            <div>
              <h3 style={styles.headerTitle}>Administrator Profile & Security</h3>
              <p style={styles.headerSubtitle}>
                Institutional identity, cryptographic credentials, and authorized access scopes
              </p>
            </div>
          </div>
          <button type="button" style={styles.closeBtn} onClick={onClose} title="Close">
            <X size={18} color="#8A9AA8" />
          </button>
        </div>

        {/* Tab Navigation Strip */}
        <div style={styles.tabStrip}>
          <button
            type="button"
            style={{
              ...styles.tabBtn,
              ...(activeTab === 'profile' ? styles.tabBtnActive : {}),
            }}
            onClick={() => setActiveTab('profile')}
          >
            <User size={14} />
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
            <Lock size={14} />
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
            <ShieldCheck size={14} />
            <span>Role & Permissions</span>
          </button>
        </div>

        {/* Tab 1: Profile Details */}
        {activeTab === 'profile' && (
          <form onSubmit={handleSaveProfile} style={styles.body}>
            <div style={styles.profileHero}>
              <div style={styles.avatarLarge}>
                {name ? name.charAt(0).toUpperCase() : 'A'}
              </div>
              <div>
                <div style={styles.heroName}>{name || adminUser.name}</div>
                <div style={styles.heroEmail}>{adminUser.email}</div>
                <div style={styles.badgeRow}>
                  <span className="badge badge-gold">{getRoleDisplayName(adminUser.adminRole)}</span>
                  <span className="badge badge-success">ACTIVE SESSION</span>
                </div>
              </div>
            </div>

            <div style={styles.formGrid}>
              <div>
                <label style={styles.label}>Administrator Full Name *</label>
                <div style={styles.inputWrap}>
                  <User size={15} color="#8A9AA8" style={styles.inputIcon} />
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Eyob Adamu"
                    style={styles.inputWithIcon}
                  />
                </div>
              </div>

              <div>
                <label style={styles.label}>Institutional Email (Immutable)</label>
                <div style={styles.inputWrap}>
                  <Mail size={15} color="#8A9AA8" style={styles.inputIcon} />
                  <input
                    type="email"
                    disabled
                    value={adminUser.email}
                    style={{ ...styles.inputWithIcon, backgroundColor: '#F8FAFC', color: '#64748B' }}
                  />
                </div>
              </div>

              <div>
                <label style={styles.label}>Direct Contact Phone</label>
                <div style={styles.inputWrap}>
                  <Smartphone size={15} color="#8A9AA8" style={styles.inputIcon} />
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="e.g. +251 91 100 0000"
                    style={styles.inputWithIcon}
                  />
                </div>
              </div>

              <div>
                <label style={styles.label}>Assigned Governance Role</label>
                <div style={styles.inputWrap}>
                  <Shield size={15} color="#8A9AA8" style={styles.inputIcon} />
                  <input
                    type="text"
                    disabled
                    value={getRoleDisplayName(adminUser.adminRole)}
                    style={{ ...styles.inputWithIcon, backgroundColor: '#F8FAFC', color: '#64748B' }}
                  />
                </div>
              </div>
            </div>

            <div style={styles.footer}>
              <button type="button" className="btn btn-secondary" onClick={onClose}>
                Cancel
              </button>
              <button type="submit" className="btn btn-primary" disabled={isSavingProfile}>
                <Save size={14} color="#07152B" />
                <span>{isSavingProfile ? 'Saving Details...' : 'Save Profile Changes'}</span>
              </button>
            </div>
          </form>
        )}

        {/* Tab 2: Password & Credentials */}
        {activeTab === 'password' && (
          <form onSubmit={handleChangePassword} style={styles.body}>
            <div style={styles.infoAlert}>
              <KeyRound size={16} color="#8C6A21" style={{ flexShrink: 0, marginTop: '2px' }} />
              <div style={{ fontSize: '12.5px', color: '#5A4310', lineHeight: 1.5 }}>
                Passwords must contain at least 6 characters. For institutional governance, use a combination of uppercase letters, numbers, and special symbols.
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={styles.label}>Current Master Password *</label>
                <div style={styles.inputWrap}>
                  <Lock size={15} color="#8A9AA8" style={styles.inputIcon} />
                  <input
                    type={showCurrentPass ? 'text' : 'password'}
                    required
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="Enter current administrative password"
                    style={styles.inputWithIcon}
                  />
                  <button
                    type="button"
                    style={styles.eyeBtn}
                    onClick={() => setShowCurrentPass(!showCurrentPass)}
                    title={showCurrentPass ? 'Hide password' : 'Show password'}
                  >
                    {showCurrentPass ? <EyeOff size={15} color="#8A9AA8" /> : <Eye size={15} color="#8A9AA8" />}
                  </button>
                </div>
              </div>

              <div>
                <label style={styles.label}>New Secure Password *</label>
                <div style={styles.inputWrap}>
                  <KeyRound size={15} color="#8A9AA8" style={styles.inputIcon} />
                  <input
                    type={showNewPass ? 'text' : 'password'}
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Minimum 6 characters with mixed characters"
                    style={styles.inputWithIcon}
                  />
                  <button
                    type="button"
                    style={styles.eyeBtn}
                    onClick={() => setShowNewPass(!showNewPass)}
                    title={showNewPass ? 'Hide password' : 'Show password'}
                  >
                    {showNewPass ? <EyeOff size={15} color="#8A9AA8" /> : <Eye size={15} color="#8A9AA8" />}
                  </button>
                </div>

                {/* Password Strength Indicator */}
                {newPassword && (
                  <div style={styles.strengthRow}>
                    <div style={styles.strengthBars}>
                      <div
                        style={{
                          ...styles.strengthBar,
                          backgroundColor: strength.score >= 1 ? strength.color : '#E2E8F0',
                        }}
                      />
                      <div
                        style={{
                          ...styles.strengthBar,
                          backgroundColor: strength.score >= 2 ? strength.color : '#E2E8F0',
                        }}
                      />
                      <div
                        style={{
                          ...styles.strengthBar,
                          backgroundColor: strength.score >= 3 ? strength.color : '#E2E8F0',
                        }}
                      />
                    </div>
                    <span style={{ fontSize: '11.5px', fontWeight: 700, color: strength.color }}>
                      {strength.label}
                    </span>
                  </div>
                )}
              </div>

              <div>
                <label style={styles.label}>Confirm New Password *</label>
                <div style={styles.inputWrap}>
                  <Lock size={15} color="#8A9AA8" style={styles.inputIcon} />
                  <input
                    type={showNewPass ? 'text' : 'password'}
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Repeat new password to confirm"
                    style={styles.inputWithIcon}
                  />
                </div>
                {confirmPassword && confirmPassword !== newPassword && (
                  <div style={{ fontSize: '11.5px', color: '#EF4444', marginTop: '4px' }}>
                    Passwords do not match
                  </div>
                )}
              </div>
            </div>

            <div style={styles.footer}>
              <button type="button" className="btn btn-secondary" onClick={onClose}>
                Cancel
              </button>
              <button type="submit" className="btn btn-primary" disabled={isSavingPass}>
                <Lock size={14} color="#07152B" />
                <span>{isSavingPass ? 'Updating Credentials...' : 'Change Password'}</span>
              </button>
            </div>
          </form>
        )}

        {/* Tab 3: Role & Permissions Matrix */}
        {activeTab === 'permissions' && (
          <div style={styles.body}>
            <div style={styles.permissionsIntro}>
              <ShieldCheck size={18} color="#10B981" />
              <div>
                <div style={{ fontWeight: 700, color: '#07152B', fontSize: '13.5px' }}>
                  Role: {getRoleDisplayName(adminUser.adminRole)}
                </div>
                <div style={{ fontSize: '12px', color: '#5A687A', marginTop: '2px' }}>
                  {adminUser.adminRole === 'SUPER_ADMIN'
                    ? 'Your account holds unconstrained administrative jurisdiction across all modules and coordinator governance.'
                    : 'Your account holds authorized domain jurisdiction. Additional privileges must be granted by the Super Administrator.'}
                </div>
              </div>
            </div>

            <div style={styles.matrixWrap}>
              <table style={styles.matrixTable}>
                <thead>
                  <tr>
                    <th style={styles.matrixTh}>Module Jurisdiction</th>
                    <th style={styles.matrixTh}>Access Authorization</th>
                    <th style={styles.matrixTh}>Permitted Operations</th>
                  </tr>
                </thead>
                <tbody>
                  {permissionsMatrix.map((item) => (
                    <tr key={item.module} style={styles.matrixTr}>
                      <td style={styles.matrixTdBold}>{item.module}</td>
                      <td style={styles.matrixTd}>
                        {item.authorized ? (
                          <span style={styles.authPill}>
                            <CheckCircle2 size={12} color="#10B981" />
                            <span>Authorized</span>
                          </span>
                        ) : (
                          <span style={styles.restrictedPill}>
                            <XCircle size={12} color="#EF4444" />
                            <span>Restricted</span>
                          </span>
                        )}
                      </td>
                      <td style={styles.matrixTdMuted}>{item.scope}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div style={styles.footer}>
              <button type="button" className="btn btn-primary" onClick={onClose}>
                <span>Done</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const styles: { [key: string]: React.CSSProperties } = {
  backdrop: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(7, 21, 43, 0.72)',
    backdropFilter: 'blur(8px)',
    WebkitBackdropFilter: 'blur(8px)',
    zIndex: 9999,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '20px',
  },
  modal: {
    backgroundColor: '#FFFFFF',
    borderRadius: '18px',
    width: '100%',
    maxWidth: '680px',
    boxShadow: '0 24px 60px rgba(0, 0, 0, 0.35)',
    border: '1px solid #E2E8F0',
    overflow: 'hidden',
    animation: 'toastSlideIn 0.22s cubic-bezier(0.16, 1, 0.3, 1)',
  },
  header: {
    padding: '22px 28px',
    borderBottom: '1px solid #E2E8F0',
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
  },
  headerLeft: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '14px',
  },
  headerIcon: {
    width: '40px',
    height: '40px',
    borderRadius: '10px',
    backgroundColor: '#07152B',
    border: '1px solid #DFB76C',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  headerTitle: {
    fontSize: '18px',
    fontWeight: 750,
    color: '#07152B',
    margin: 0,
  },
  headerSubtitle: {
    fontSize: '12.5px',
    color: '#5A687A',
    margin: '3px 0 0 0',
  },
  closeBtn: {
    background: 'none',
    border: 'none',
    padding: '6px',
    borderRadius: '8px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabStrip: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    padding: '10px 24px',
    backgroundColor: '#F8FAFC',
    borderBottom: '1px solid #E2E8F0',
  },
  tabBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '7px',
    padding: '7px 14px',
    borderRadius: '8px',
    border: '1px solid transparent',
    backgroundColor: 'transparent',
    color: '#5A687A',
    fontSize: '12.5px',
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'all 0.16s ease',
  },
  tabBtnActive: {
    backgroundColor: '#FFFFFF',
    borderColor: '#E2E8F0',
    color: '#07152B',
    fontWeight: 750,
    boxShadow: '0 2px 6px rgba(0, 0, 0, 0.04)',
  },
  body: {
    padding: '24px 28px',
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
    maxHeight: 'calc(80vh - 160px)',
    overflowY: 'auto',
  },
  profileHero: {
    display: 'flex',
    alignItems: 'center',
    gap: '18px',
    padding: '18px 20px',
    backgroundColor: '#FAFCFE',
    border: '1px solid #EAEFF6',
    borderRadius: '14px',
  },
  avatarLarge: {
    width: '60px',
    height: '60px',
    borderRadius: '50%',
    backgroundColor: '#07152B',
    color: '#DFB76C',
    fontSize: '24px',
    fontWeight: 800,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    border: '2px solid #DFB76C',
    flexShrink: 0,
  },
  heroName: {
    fontSize: '17px',
    fontWeight: 750,
    color: '#07152B',
  },
  heroEmail: {
    fontSize: '13px',
    color: '#5A687A',
    marginTop: '2px',
  },
  badgeRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    marginTop: '8px',
  },
  formGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
    gap: '16px',
  },
  label: {
    display: 'block',
    fontSize: '12px',
    fontWeight: 700,
    color: '#07152B',
    marginBottom: '6px',
  },
  inputWrap: {
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
  },
  inputIcon: {
    position: 'absolute',
    left: '12px',
    pointerEvents: 'none',
  },
  inputWithIcon: {
    width: '100%',
    padding: '10px 14px 10px 38px',
    fontSize: '13px',
    border: '1px solid #E2E8F0',
    borderRadius: '9px',
    color: '#07152B',
    outline: 'none',
    backgroundColor: '#FFFFFF',
    transition: 'border-color 0.16s ease',
  },
  eyeBtn: {
    position: 'absolute',
    right: '10px',
    background: 'none',
    border: 'none',
    padding: '4px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoAlert: {
    padding: '12px 16px',
    backgroundColor: '#FDF8E8',
    border: '1px solid #EBD59B',
    borderRadius: '10px',
    display: 'flex',
    alignItems: 'flex-start',
    gap: '12px',
  },
  strengthRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    marginTop: '8px',
  },
  strengthBars: {
    display: 'flex',
    gap: '4px',
    flex: 1,
    maxWidth: '120px',
  },
  strengthBar: {
    height: '4px',
    flex: 1,
    borderRadius: '2px',
    transition: 'background-color 0.2s ease',
  },
  permissionsIntro: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '12px',
    padding: '14px 18px',
    backgroundColor: '#F0FDF4',
    border: '1px solid #BBF7D0',
    borderRadius: '12px',
  },
  matrixWrap: {
    border: '1px solid #E2E8F0',
    borderRadius: '12px',
    overflow: 'hidden',
  },
  matrixTable: {
    width: '100%',
    borderCollapse: 'collapse',
    textAlign: 'left',
  },
  matrixTh: {
    backgroundColor: '#F8FAFC',
    padding: '10px 14px',
    fontSize: '11px',
    fontWeight: 750,
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    color: '#5A687A',
    borderBottom: '1px solid #E2E8F0',
  },
  matrixTr: {
    borderBottom: '1px solid #F1F4F9',
  },
  matrixTdBold: {
    padding: '12px 14px',
    fontSize: '13px',
    fontWeight: 700,
    color: '#07152B',
  },
  matrixTd: {
    padding: '12px 14px',
  },
  matrixTdMuted: {
    padding: '12px 14px',
    fontSize: '12px',
    color: '#64748B',
    lineHeight: 1.4,
  },
  authPill: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '4px',
    backgroundColor: '#F0FDF4',
    border: '1px solid #BBF7D0',
    borderRadius: '9999px',
    padding: '3px 9px',
    fontSize: '11.5px',
    fontWeight: 700,
    color: '#166534',
  },
  restrictedPill: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '4px',
    backgroundColor: '#FEF2F2',
    border: '1px solid #FECACA',
    borderRadius: '9999px',
    padding: '3px 9px',
    fontSize: '11.5px',
    fontWeight: 700,
    color: '#991B1B',
  },
  footer: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: '10px',
    paddingTop: '16px',
    borderTop: '1px solid #F1F4F9',
  },
};
