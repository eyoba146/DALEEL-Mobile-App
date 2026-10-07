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
  AlertCircle,
  CheckCircle2,
  Compass,
  Briefcase,
  ShoppingBag,
  TrendingUp,
  ShieldCheck,
  Sparkles,
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

  // Field-level validation states
  const [touchedEmail, setTouchedEmail] = useState(false);
  const [touchedPassword, setTouchedPassword] = useState(false);
  const [touchedRecovery, setTouchedRecovery] = useState(false);
  const [submittedLogin, setSubmittedLogin] = useState(false);
  const [submittedRecovery, setSubmittedRecovery] = useState(false);

  // Recovery states
  const [recoveryEmail, setRecoveryEmail] = useState('');
  const [recoverySuccessMsg, setRecoverySuccessMsg] = useState('');
  const [recoveryErrorMsg, setRecoveryErrorMsg] = useState('');
  const [isRecovering, setIsRecovering] = useState(false);

  const isEmailValid = (val: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val.trim());
  const emailError = (touchedEmail || submittedLogin) && !isEmailValid(email) ? 'Please enter a valid administrative email address' : '';
  const passwordError = (touchedPassword || submittedLogin) && password.length < 6 ? 'Passkey must be at least 6 characters' : '';
  const recoveryEmailError = (touchedRecovery || submittedRecovery) && !isEmailValid(recoveryEmail) ? 'Please enter a valid administrative email address' : '';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmittedLogin(true);
    setTouchedEmail(true);
    setTouchedPassword(true);

    if (!isEmailValid(email) || password.length < 6) {
      return;
    }

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
    setTouchedEmail(false);
    setTouchedPassword(false);
    setErrorMsg('');
  };

  const handleRecoverySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmittedRecovery(true);
    setTouchedRecovery(true);

    if (!isEmailValid(recoveryEmail)) {
      return;
    }

    setRecoveryErrorMsg('');
    setRecoverySuccessMsg('');
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
    <div className="login-split-container">
      {/* ═══════════════════════════════════════════════════════════════
          LEFT 50%: INSTITUTIONAL BRANDING & HERITAGE HERO
          ═══════════════════════════════════════════════════════════════ */}
      <div className="login-hero-side">
        {/* Top: Institutional Brand Crest */}
        <div>
          <div style={styles.heroBrandRow}>
            <div style={styles.crestCircle}>
              <Shield size={24} color="#DFB76C" />
            </div>
            <div>
              <span style={styles.heroBrandTitle}>DALEEL</span>
              <span style={styles.heroBrandPill}>GOVERNANCE PLATFORM</span>
            </div>
          </div>

          <div style={styles.heroTextSection}>
            <h1 style={styles.heroMainHeadline}>
              Authoritative Portal for Diaspora Operations
            </h1>
            <p style={styles.heroSubheadline}>
              Integrated command environment orchestrating Ethiopian cultural heritage sanctuaries, vetted diaspora concierge directories, fair-trade artisan logistics, and strategic diaspora investments.
            </p>
          </div>

          {/* 4 Key Institutional Operational Pillars */}
          <div style={styles.pillarsGrid}>
            <div style={styles.pillarCard}>
              <div style={styles.pillarIconWrap}>
                <Compass size={18} color="#DFB76C" />
              </div>
              <div>
                <div style={styles.pillarTitle}>Cultural Sanctuaries</div>
                <div style={styles.pillarDesc}>UNESCO sites, regional destinations, and live geolocation pins</div>
              </div>
            </div>

            <div style={styles.pillarCard}>
              <div style={styles.pillarIconWrap}>
                <Briefcase size={18} color="#DFB76C" />
              </div>
              <div>
                <div style={styles.pillarTitle}>Verified Directory</div>
                <div style={styles.pillarDesc}>Vetted diaspora legal, health, residency, and business services</div>
              </div>
            </div>

            <div style={styles.pillarCard}>
              <div style={styles.pillarIconWrap}>
                <ShoppingBag size={18} color="#DFB76C" />
              </div>
              <div>
                <div style={styles.pillarTitle}>Artisan Marketplace</div>
                <div style={styles.pillarDesc}>Authentic Ethiopian crafts, inventory levels, and order dispatching</div>
              </div>
            </div>

            <div style={styles.pillarCard}>
              <div style={styles.pillarIconWrap}>
                <TrendingUp size={18} color="#DFB76C" />
              </div>
              <div>
                <div style={styles.pillarTitle}>Diaspora Capital Leads</div>
                <div style={styles.pillarDesc}>Sector prospectuses, syndicate allocations, and investor inquiries</div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom: Security Accreditation Capsule */}
        <div style={styles.heroSecurityBox}>
          <div style={styles.securityHeaderRow}>
            <ShieldCheck size={16} color="#DFB76C" />
            <span style={styles.securityTitle}>Federal Platform Security Standards</span>
          </div>
          <div style={styles.securityText}>
            256-Bit Cryptographic Authorization • Granular Role-Based Permissions • Real-Time Session Governance
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════
          RIGHT 50%: AUTHENTICATION & LOGIN DESK (FLUSH TO BACKGROUND)
          ═══════════════════════════════════════════════════════════════ */}
      <div className="login-form-side">
        <div style={styles.formDesk}>
          {/* Form Header */}
          <div style={styles.formHeader}>
            <div style={styles.formBadge}>
              {mode === 'login' ? 'ADMINISTRATIVE ACCESS' : 'CREDENTIAL RECOVERY'}
            </div>
            <h2 style={styles.formTitle}>
              {mode === 'login' ? 'Sign In to Portal' : 'Reset Credentials'}
            </h2>
            <p style={styles.formSubtitle}>
              {mode === 'login'
                ? 'Enter your institutional email and access passkey to access the operations console.'
                : 'Enter your verified administrative email to dispatch a credential reset request to the Super Administrator.'}
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
                  <label style={styles.label}>Official Email Address</label>
                  <div style={styles.inputWrap}>
                    <Mail size={17} color={emailError ? "#DC2626" : "#8A9AA8"} style={styles.fieldIcon} />
                    <input
                      type="email"
                      value={email}
                      onBlur={() => setTouchedEmail(true)}
                      onChange={(e) => {
                        setEmail(e.target.value);
                        if (errorMsg) setErrorMsg('');
                      }}
                      placeholder="superadmin@daleel.et"
                      style={{
                        ...styles.inputField,
                        ...(emailError ? styles.inputFieldError : {}),
                      }}
                    />
                  </div>
                  {emailError && (
                    <div style={styles.inlineErrorRow}>
                      <AlertCircle size={13} color="#DC2626" style={{ flexShrink: 0 }} />
                      <span>{emailError}</span>
                    </div>
                  )}
                </div>

                <div style={styles.formGroup}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <label style={styles.label}>Access Passkey</label>
                    <button
                      type="button"
                      onClick={() => {
                        setMode('forgot');
                        setRecoveryEmail(email);
                        setErrorMsg('');
                      }}
                      style={styles.forgotLink}
                    >
                      Forgot passkey?
                    </button>
                  </div>
                  <div style={styles.inputWrap}>
                    <Lock size={17} color={passwordError ? "#DC2626" : "#8A9AA8"} style={styles.fieldIcon} />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onBlur={() => setTouchedPassword(true)}
                      onChange={(e) => {
                        setPassword(e.target.value);
                        if (errorMsg) setErrorMsg('');
                      }}
                      placeholder="••••••••••••"
                      style={{
                        ...styles.inputField,
                        ...(passwordError ? styles.inputFieldError : {}),
                      }}
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
                  {passwordError && (
                    <div style={styles.inlineErrorRow}>
                      <AlertCircle size={13} color="#DC2626" style={{ flexShrink: 0 }} />
                      <span>{passwordError}</span>
                    </div>
                  )}
                </div>

                <div style={styles.optionsRow}>
                  <label style={styles.checkboxLabel}>
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      style={styles.checkbox}
                    />
                    <span>Remember active session</span>
                  </label>

                  <button
                    type="button"
                    style={styles.helpToggle}
                    onClick={() => setShowCredentialsHelp(!showCredentialsHelp)}
                  >
                    <Sparkles size={13} color="#8C6A21" />
                    <span>{showCredentialsHelp ? 'Hide directory' : 'Coordinator presets'}</span>
                  </button>
                </div>

                {/* Coordinator Accounts Drawer */}
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
                      <span>Enter Management Console</span>
                      <ArrowRight size={17} color="#FFFFFF" />
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

              {recoverySuccessMsg && (
                <div style={styles.successBanner}>
                  <CheckCircle2 size={18} color="#059669" style={{ flexShrink: 0, marginTop: '2px' }} />
                  <div>
                    <div style={{ fontWeight: 700, color: '#065F46', fontSize: '13px' }}>
                      Request Dispatched
                    </div>
                    <div style={{ fontSize: '12.5px', color: '#047857', marginTop: '2px', lineHeight: 1.4 }}>
                      {recoverySuccessMsg}
                    </div>
                  </div>
                </div>
              )}

              <div style={styles.noticeBox}>
                <KeyRound size={16} color="#8C6A21" style={{ flexShrink: 0, marginTop: '2px' }} />
                <div style={{ fontSize: '12px', color: '#785A18', lineHeight: 1.45 }}>
                  Because administrative roles hold elevated platform authority, password resets must be verified and issued directly by the Super Administrator.
                </div>
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>Official Administrative Email</label>
                <div style={styles.inputWrap}>
                  <Mail size={17} color={recoveryEmailError ? "#DC2626" : "#8A9AA8"} style={styles.fieldIcon} />
                  <input
                    type="email"
                    value={recoveryEmail}
                    onBlur={() => setTouchedRecovery(true)}
                    onChange={(e) => {
                      setRecoveryEmail(e.target.value);
                      if (recoveryErrorMsg) setRecoveryErrorMsg('');
                    }}
                    placeholder="coordinator@daleel.et"
                    style={{
                      ...styles.inputField,
                      ...(recoveryEmailError ? styles.inputFieldError : {}),
                    }}
                  />
                </div>
                {recoveryEmailError && (
                  <div style={styles.inlineErrorRow}>
                    <AlertCircle size={13} color="#DC2626" style={{ flexShrink: 0 }} />
                    <span>{recoveryEmailError}</span>
                  </div>
                )}
              </div>

              {!recoverySuccessMsg ? (
                <button
                  type="submit"
                  disabled={isRecovering}
                  style={{
                    ...styles.submitBtn,
                    opacity: isRecovering ? 0.7 : 1,
                  }}
                >
                  {isRecovering ? (
                    <span>Transmitting Request...</span>
                  ) : (
                    <>
                      <KeyRound size={16} color="#FFFFFF" />
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
                  <ArrowRight size={17} color="#FFFFFF" />
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
    </div>
  );
};

const styles: { [key: string]: React.CSSProperties } = {
  // Hero Side (Left 50%) Styles
  heroBrandRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '14px',
    marginBottom: '32px',
  },
  crestCircle: {
    width: '46px',
    height: '46px',
    backgroundColor: 'rgba(223, 183, 108, 0.12)',
    border: '1.5px solid #DFB76C',
    borderRadius: '12px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    boxShadow: '0 4px 14px rgba(7, 21, 43, 0.3)',
  },
  heroBrandTitle: {
    fontFamily: "'DM Serif Display', Georgia, serif",
    fontSize: '26px',
    color: '#FFFFFF',
    fontWeight: 400,
    letterSpacing: '0.04em',
    display: 'block',
    lineHeight: 1.1,
  },
  heroBrandPill: {
    fontSize: '9.5px',
    fontWeight: 800,
    letterSpacing: '0.08em',
    color: '#DFB76C',
    textTransform: 'uppercase',
    display: 'block',
    marginTop: '3px',
  },
  heroTextSection: {
    marginBottom: '36px',
    maxWidth: '560px',
  },
  heroMainHeadline: {
    fontFamily: "'DM Serif Display', Georgia, serif",
    fontSize: 'clamp(28px, 3.5vw, 38px)',
    color: '#FFFFFF',
    fontWeight: 400,
    lineHeight: 1.2,
    margin: '0 0 14px 0',
    letterSpacing: '-0.01em',
  },
  heroSubheadline: {
    fontSize: '14.5px',
    color: '#B2C0D2',
    lineHeight: 1.6,
    margin: 0,
  },
  pillarsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
    gap: '16px',
    marginBottom: '32px',
    maxWidth: '580px',
  },
  pillarCard: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '12px',
    padding: '14px 16px',
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    border: '1px solid rgba(255, 255, 255, 0.08)',
    borderRadius: '12px',
  },
  pillarIconWrap: {
    width: '32px',
    height: '32px',
    borderRadius: '8px',
    backgroundColor: 'rgba(223, 183, 108, 0.14)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    marginTop: '2px',
  },
  pillarTitle: {
    fontSize: '13px',
    fontWeight: 700,
    color: '#FFFFFF',
    marginBottom: '2px',
  },
  pillarDesc: {
    fontSize: '11.5px',
    color: '#8E9EAF',
    lineHeight: 1.4,
  },
  heroSecurityBox: {
    padding: '16px 20px',
    backgroundColor: 'rgba(7, 21, 43, 0.6)',
    border: '1px solid rgba(223, 183, 108, 0.25)',
    borderRadius: '12px',
    maxWidth: '560px',
  },
  securityHeaderRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    marginBottom: '4px',
  },
  securityTitle: {
    fontSize: '12px',
    fontWeight: 750,
    color: '#DFB76C',
    letterSpacing: '0.04em',
    textTransform: 'uppercase',
  },
  securityText: {
    fontSize: '11.5px',
    color: '#A0B0C4',
    lineHeight: 1.4,
  },

  // Form Side (Right 50%) Styles (Flush to Background, No Card Effect)
  formDesk: {
    width: '100%',
    maxWidth: '440px',
    boxSizing: 'border-box',
    display: 'flex',
    flexDirection: 'column',
  },
  formHeader: {
    textAlign: 'center',
    marginBottom: '24px',
  },
  formBadge: {
    display: 'inline-block',
    fontSize: '10px',
    fontWeight: 800,
    letterSpacing: '0.08em',
    color: '#8C6A21',
    backgroundColor: '#F8F4EC',
    border: '1px solid #E0C582',
    padding: '3px 12px',
    borderRadius: '9999px',
    marginBottom: '8px',
  },
  formTitle: {
    fontSize: '24px',
    fontWeight: 800,
    color: '#07152B',
    margin: '0 0 6px 0',
    letterSpacing: '-0.02em',
  },
  formSubtitle: {
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
    borderRadius: '10px',
    marginBottom: '18px',
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
    gap: '16px',
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
  inputFieldError: {
    border: '1.5px solid #EF4444',
    backgroundColor: '#FFF5F5',
  },
  inlineErrorRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    marginTop: '5px',
    color: '#DC2626',
    fontSize: '12px',
    fontWeight: 500,
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
    background: '#07152B',
    color: '#FFFFFF',
    border: '1px solid #07152B',
    borderRadius: '10px',
    fontSize: '14px',
    fontWeight: 700,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    cursor: 'pointer',
    boxShadow: '0 4px 14px rgba(7, 21, 43, 0.25)',
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
    marginTop: '24px',
    paddingTop: '16px',
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
