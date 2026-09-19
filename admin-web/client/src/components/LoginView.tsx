import React, { useState } from 'react';
import { useAdminAuth } from '../context/AuthContext';
import { adminApi } from '../api';
import {
  Shield,
  Lock,
  Mail,
  Eye,
  EyeOff,
  ArrowRight,
  ArrowLeft,
  KeyRound,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
} from 'lucide-react';

export const LoginView: React.FC = () => {
  const { login } = useAdminAuth();

  // Mode: 'login' | 'forgot'
  const [mode, setMode] = useState<'login' | 'forgot'>('login');

  // Sign in states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showCredentialsHelp, setShowCredentialsHelp] = useState(false);

  // Recovery states
  const [recoveryEmail, setRecoveryEmail] = useState('');
  const [recoverySuccessMsg, setRecoverySuccessMsg] = useState('');
  const [recoveryErrorMsg, setRecoveryErrorMsg] = useState('');
  const [isRecovering, setIsRecovering] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setIsSubmitting(true);

    try {
      await login(email, password);
    } catch (err: any) {
      setErrorMsg(err.message || 'Authentication failed. Please verify credentials.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleApplyPreset = (presetEmail: string) => {
    setEmail(presetEmail);
    setPassword('Admin2026!');
    setErrorMsg('');
  };

  const handleRecoverySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setRecoveryErrorMsg('');
    setRecoverySuccessMsg('');

    if (!recoveryEmail.trim()) {
      setRecoveryErrorMsg('Please enter your official administrative email address.');
      return;
    }

    setIsRecovering(true);
    try {
      const res = await adminApi.forgotPassword(recoveryEmail.trim());
      setRecoverySuccessMsg(
        res.message ||
          'Recovery notification dispatched. The Super Administrator has been alerted to reset your credentials.'
      );
    } catch (err: any) {
      setRecoveryErrorMsg(err.message || 'Failed to dispatch recovery request. Check your connection.');
    } finally {
      setIsRecovering(false);
    }
  };

  return (
    <div style={styles.pageRoot}>
      {/* Background Decor */}
      <div style={styles.topAccentBar} />

      <div style={styles.loginCard}>
        {/* Institutional Crest & Brand */}
        <div style={styles.header}>
          <div style={styles.crestCircle}>
            {mode === 'login' ? (
              <Shield size={28} color="#DFB76C" />
            ) : (
              <KeyRound size={28} color="#DFB76C" />
            )}
          </div>
          <h1 style={styles.brandTitle}>DALEEL</h1>
          <div style={styles.portalTag}>
            {mode === 'login' ? 'MANAGEMENT PORTAL' : 'CREDENTIAL RECOVERY'}
          </div>
          <p style={styles.portalSub}>
            {mode === 'login'
              ? 'Administrative portal for Ethiopian destinations, verified services, and diaspora investments.'
              : 'Federal administrative access keys are managed through cryptographic assignment by the Super Administrator.'}
          </p>
        </div>

        {/* Normal Login View */}
        {mode === 'login' && (
          <>
            {/* Error Alert */}
            {errorMsg && (
              <div style={styles.errorBanner}>
                <AlertCircle size={16} style={{ flexShrink: 0 }} />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Login Form */}
            <form onSubmit={handleSubmit} style={styles.form}>
              <div style={styles.formGroup}>
                <label style={styles.label}>Email Address</label>
                <div style={styles.inputWrap}>
                  <Mail size={17} color="#8A9AA8" style={styles.fieldIcon} />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="superadmin@daleel.et"
                    style={styles.inputField}
                  />
                </div>
              </div>

              <div style={styles.formGroup}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <label style={styles.label}>Password</label>
                  <button
                    type="button"
                    onClick={() => {
                      setMode('forgot');
                      setRecoveryEmail(email);
                      setErrorMsg('');
                    }}
                    style={styles.forgotLink}
                  >
                    Forgot password?
                  </button>
                </div>
                <div style={styles.inputWrap}>
                  <Lock size={17} color="#8A9AA8" style={styles.fieldIcon} />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••••••"
                    style={styles.inputField}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    style={styles.eyeBtn}
                    aria-label="Toggle password visibility"
                  >
                    {showPassword ? <EyeOff size={16} color="#8A9AA8" /> : <Eye size={16} color="#8A9AA8" />}
                  </button>
                </div>
              </div>

              <div style={styles.optionsRow}>
                <label style={styles.checkboxLabel}>
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    style={styles.checkbox}
                  />
                  <span>Remember session</span>
                </label>

                <button
                  type="button"
                  style={styles.helpToggle}
                  onClick={() => setShowCredentialsHelp(!showCredentialsHelp)}
                >
                  <HelpCircle size={13} color="#8C6A21" />
                  <span>{showCredentialsHelp ? 'Hide directory' : 'Coordinator presets'}</span>
                </button>
              </div>

              {/* Discreet Coordinator Accounts Drawer */}
              {showCredentialsHelp && (
                <div style={styles.helpDrawer}>
                  <div style={styles.drawerTitle}>Active Coordinator Directory:</div>
                  <div style={styles.accountsList}>
                    {[
                      { role: 'Super Admin', mail: 'superadmin@daleel.et' },
                      { role: 'Destinations Lead', mail: 'destinations@daleel.et' },
                      { role: 'Services Lead', mail: 'services@daleel.et' },
                      { role: 'Events Lead', mail: 'events@daleel.et' },
                      { role: 'Marketplace Lead', mail: 'marketplace@daleel.et' },
                      { role: 'Investment Officer', mail: 'investments@daleel.et' },
                    ].map((acc) => (
                      <button
                        key={acc.mail}
                        type="button"
                        style={styles.accountItem}
                        onClick={() => handleApplyPreset(acc.mail)}
                      >
                        <span style={styles.accRole}>{acc.role}</span>
                        <span style={styles.accMail}>{acc.mail}</span>
                      </button>
                    ))}
                  </div>
                  <div style={styles.drawerHint}>Default access key: Admin2026!</div>
                </div>
              )}

              <button
                type="submit"
                disabled={isSubmitting}
                style={{
                  ...styles.submitBtn,
                  opacity: isSubmitting ? 0.7 : 1,
                }}
              >
                {isSubmitting ? (
                  <span>Authenticating...</span>
                ) : (
                  <>
                    <span>Sign In to Management Portal</span>
                    <ArrowRight size={17} color="#07152B" />
                  </>
                )}
              </button>
            </form>
          </>
        )}

        {/* Forgot Password Recovery Mode */}
        {mode === 'forgot' && (
          <form onSubmit={handleRecoverySubmit} style={styles.form}>
            {recoveryErrorMsg && (
              <div style={styles.errorBanner}>
                <AlertCircle size={16} style={{ flexShrink: 0 }} />
                <span>{recoveryErrorMsg}</span>
              </div>
            )}

            {recoverySuccessMsg ? (
              <div style={styles.successBanner}>
                <CheckCircle2 size={20} color="#059669" style={{ flexShrink: 0, marginTop: '2px' }} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 750, color: '#065F46', fontSize: '13px', marginBottom: '4px' }}>
                    Request Registered
                  </div>
                  <div style={{ fontSize: '12px', color: '#047857', lineHeight: 1.5 }}>
                    {recoverySuccessMsg}
                  </div>
                </div>
              </div>
            ) : (
              <div style={styles.noticeBox}>
                <KeyRound size={18} color="#C59B43" style={{ flexShrink: 0, marginTop: '2px' }} />
                <div style={{ fontSize: '12px', color: '#5A4310', lineHeight: 1.5 }}>
                  Submitting this request creates an elevated notification for the Super Administrator. Once reviewed, your administrator will generate a new secure password key for your account from the <strong>Administrative Team</strong> console.
                </div>
              </div>
            )}

            <div style={styles.formGroup}>
              <label style={styles.label}>Official Administrative Email *</label>
              <div style={styles.inputWrap}>
                <Mail size={17} color="#8A9AA8" style={styles.fieldIcon} />
                <input
                  type="email"
                  required
                  value={recoveryEmail}
                  onChange={(e) => setRecoveryEmail(e.target.value)}
                  placeholder="e.g. rahel@daleel.et or superadmin@daleel.et"
                  style={styles.inputField}
                  disabled={!!recoverySuccessMsg}
                />
              </div>
            </div>

            {!recoverySuccessMsg ? (
              <button
                type="submit"
                disabled={isRecovering || !recoveryEmail}
                style={{
                  ...styles.submitBtn,
                  opacity: isRecovering || !recoveryEmail ? 0.7 : 1,
                }}
              >
                {isRecovering ? (
                  <span>Transmitting Request...</span>
                ) : (
                  <>
                    <KeyRound size={16} color="#07152B" />
                    <span>Dispatch Recovery Request</span>
                  </>
                )}
              </button>
            ) : (
              <button
                type="button"
                onClick={() => {
                  setMode('login');
                  setRecoverySuccessMsg('');
                }}
                style={styles.submitBtn}
              >
                <span>Return to Sign In</span>
                <ArrowRight size={17} color="#07152B" />
              </button>
            )}

            <button
              type="button"
              style={styles.backToLoginBtn}
              onClick={() => {
                setMode('login');
                setRecoveryErrorMsg('');
                setRecoverySuccessMsg('');
              }}
            >
              <ArrowLeft size={14} color="#5A687A" />
              <span>Back to Sign In</span>
            </button>
          </form>
        )}

        {/* Institutional Trust Footer */}
        <div style={styles.footer}>
          <span>Authorized Platform Staff Only</span>
          <span style={styles.footerDivider}>•</span>
          <span>DALEEL Heritage & Tourism Portal</span>
        </div>
      </div>
    </div>
  );
};

const styles: { [key: string]: React.CSSProperties } = {
  pageRoot: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F7F8FA',
    backgroundImage:
      'radial-gradient(circle at 10% 20%, rgba(223, 183, 108, 0.08) 0%, transparent 40%), radial-gradient(circle at 90% 80%, rgba(7, 21, 43, 0.05) 0%, transparent 40%)',
    padding: '24px',
    position: 'relative',
  },
  topAccentBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '4px',
    background: 'linear-gradient(90deg, #07152B 0%, #DFB76C 50%, #07152B 100%)',
  },
  loginCard: {
    width: '100%',
    maxWidth: '480px',
    backgroundColor: '#FFFFFF',
    border: '1px solid #E4E9F0',
    borderRadius: '20px',
    padding: '40px 36px',
    boxShadow: '0 20px 48px rgba(7, 21, 43, 0.08), 0 2px 8px rgba(7, 21, 43, 0.03)',
  },
  header: {
    textAlign: 'center',
    marginBottom: '28px',
  },
  crestCircle: {
    width: '58px',
    height: '58px',
    backgroundColor: '#07152B',
    border: '2px solid #DFB76C',
    borderRadius: '16px',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: '14px',
    boxShadow: '0 6px 18px rgba(7, 21, 43, 0.2)',
  },
  brandTitle: {
    fontFamily: "'DM Serif Display', Georgia, serif",
    fontSize: '32px',
    color: '#07152B',
    fontWeight: 400,
    letterSpacing: '0.02em',
    margin: '0 0 6px 0',
  },
  portalTag: {
    display: 'inline-block',
    fontSize: '10px',
    fontWeight: 800,
    letterSpacing: '0.08em',
    color: '#8C6A21',
    backgroundColor: '#F8F4EC',
    border: '1px solid #E0C582',
    padding: '3px 12px',
    borderRadius: '9999px',
    marginBottom: '10px',
  },
  portalSub: {
    fontSize: '13px',
    color: '#5A687A',
    lineHeight: 1.5,
    margin: 0,
  },
  errorBanner: {
    backgroundColor: '#FFF0F0',
    border: '1px solid rgba(214, 48, 49, 0.3)',
    color: '#D63031',
    fontSize: '13px',
    padding: '12px 14px',
    borderRadius: '8px',
    marginBottom: '20px',
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    fontWeight: 500,
  },
  successBanner: {
    backgroundColor: '#ECFDF5',
    border: '1px solid #A7F3D0',
    padding: '14px 16px',
    borderRadius: '10px',
    display: 'flex',
    alignItems: 'flex-start',
    gap: '12px',
  },
  noticeBox: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '10px',
    padding: '12px 14px',
    backgroundColor: '#FDF8E8',
    border: '1px solid #EBD59B',
    borderRadius: '10px',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '18px',
  },
  formGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
  },
  label: {
    fontSize: '12px',
    fontWeight: 700,
    color: '#07152B',
  },
  forgotLink: {
    background: 'none',
    border: 'none',
    color: '#8C6A21',
    fontSize: '11.5px',
    fontWeight: 700,
    cursor: 'pointer',
    padding: 0,
    textDecoration: 'underline',
  },
  inputWrap: {
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
  },
  fieldIcon: {
    position: 'absolute',
    left: '14px',
    pointerEvents: 'none',
  },
  inputField: {
    width: '100%',
    padding: '12px 42px 12px 40px',
    backgroundColor: '#FFFFFF',
    border: '1px solid #E4E9F0',
    borderRadius: '10px',
    color: '#07152B',
    fontSize: '14px',
    outline: 'none',
    boxSizing: 'border-box',
    transition: 'all 0.18s ease',
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
  optionsRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    fontSize: '12px',
  },
  checkboxLabel: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    color: '#5A687A',
    cursor: 'pointer',
    userSelect: 'none',
  },
  checkbox: {
    cursor: 'pointer',
  },
  helpToggle: {
    background: 'none',
    border: 'none',
    color: '#8C6A21',
    fontWeight: 650,
    cursor: 'pointer',
    fontSize: '12px',
    display: 'inline-flex',
    alignItems: 'center',
    gap: '4px',
  },
  helpDrawer: {
    backgroundColor: '#F8FAFC',
    border: '1px solid #E4E9F0',
    borderRadius: '10px',
    padding: '12px',
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  drawerTitle: {
    fontSize: '11px',
    fontWeight: 700,
    color: '#07152B',
    textTransform: 'uppercase',
    letterSpacing: '0.04em',
  },
  accountsList: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: '6px',
  },
  accountItem: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-start',
    padding: '6px 8px',
    backgroundColor: '#FFFFFF',
    border: '1px solid #E4E9F0',
    borderRadius: '6px',
    cursor: 'pointer',
    textAlign: 'left',
    transition: 'all 0.15s ease',
  },
  accRole: {
    fontSize: '11px',
    fontWeight: 700,
    color: '#07152B',
  },
  accMail: {
    fontSize: '10px',
    color: '#5A687A',
  },
  drawerHint: {
    fontSize: '10.5px',
    color: '#8A9AA8',
    fontStyle: 'italic',
    textAlign: 'center',
  },
  submitBtn: {
    marginTop: '6px',
    padding: '13px 20px',
    background: 'linear-gradient(135deg, #DFB76C 0%, #C59B43 100%)',
    color: '#07152B',
    border: '1px solid rgba(197, 155, 67, 0.4)',
    borderRadius: '10px',
    fontSize: '14px',
    fontWeight: 700,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    cursor: 'pointer',
    boxShadow: '0 4px 14px rgba(223, 183, 108, 0.35)',
    transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
  },
  backToLoginBtn: {
    background: 'none',
    border: 'none',
    color: '#5A687A',
    fontSize: '12.5px',
    fontWeight: 650,
    cursor: 'pointer',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '6px',
    padding: '6px',
    marginTop: '4px',
  },
  footer: {
    marginTop: '28px',
    paddingTop: '20px',
    borderTop: '1px solid #EAEFF6',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    fontSize: '11px',
    color: '#8A9AA8',
    flexWrap: 'wrap',
  },
  footerDivider: {
    color: '#CBD5E1',
  },
};
