import React, { useState } from 'react';
import { useAdminAuth } from '../context/AuthContext';
import { Shield, Lock, Mail, Eye, EyeOff, Sparkles, ArrowRight } from 'lucide-react';

const QUICK_ROLES = [
  { label: 'Super Admin', email: 'superadmin@daleel.et', desc: 'Full platform authority' },
  { label: 'Destinations Lead', email: 'destinations@daleel.et', desc: 'Tourism & heritage maps' },
  { label: 'Services Lead', email: 'services@daleel.et', desc: 'Partner directory & inquiries' },
  { label: 'Events Lead', email: 'events@daleel.et', desc: 'Gatherings & RSVPs' },
  { label: 'Marketplace Lead', email: 'marketplace@daleel.et', desc: 'Artisan goods & orders' },
  { label: 'Investment Lead', email: 'investments@daleel.et', desc: 'Diaspora opportunities' },
];

export const LoginView: React.FC = () => {
  const { login } = useAdminAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setIsSubmitting(true);

    try {
      await login(email, password);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to authenticate administrative session');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleQuickSelect = (quickEmail: string) => {
    setEmail(quickEmail);
    setPassword('Admin2026!');
    setErrorMsg('');
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        {/* Brand Header */}
        <div style={styles.header}>
          <div style={styles.logoBadge}>
            <Shield size={28} color="#DFB76C" />
          </div>
          <h1 style={styles.brandTitle}>DALEEL</h1>
          <div style={styles.brandSubtitle}>Administrative Command Portal</div>
          <div style={styles.roleTag}>ROLE-BASED ACCESS CONTROL</div>
        </div>

        {/* Quick Role Fill Pills */}
        <div style={styles.quickFillSection}>
          <div style={styles.quickFillLabel}>
            <Sparkles size={13} color="#DFB76C" />
            <span>Select Demo Role to Quick-Fill</span>
          </div>
          <div style={styles.pillsGrid}>
            {QUICK_ROLES.map((role) => (
              <button
                key={role.email}
                type="button"
                style={{
                  ...styles.pill,
                  ...(email === role.email ? styles.pillActive : {}),
                }}
                onClick={() => handleQuickSelect(role.email)}
              >
                <span style={styles.pillLabel}>{role.label}</span>
                <span style={styles.pillDesc}>{role.desc}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Error Notification */}
        {errorMsg ? <div style={styles.errorBanner}>{errorMsg}</div> : null}

        {/* Login Form */}
        <form onSubmit={handleSubmit} style={styles.form}>
          <div style={styles.inputGroup}>
            <label style={styles.inputLabel}>Administrative Email</label>
            <div style={styles.inputWrapper}>
              <Mail size={17} color="#8E9FB8" style={styles.inputIcon} />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="coordinator@daleel.et"
                style={styles.textInput}
              />
            </div>
          </div>

          <div style={styles.inputGroup}>
            <label style={styles.inputLabel}>Access Key (Password)</label>
            <div style={styles.inputWrapper}>
              <Lock size={17} color="#8E9FB8" style={styles.inputIcon} />
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your security credentials"
                style={styles.textInput}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={styles.eyeBtn}
              >
                {showPassword ? <EyeOff size={16} color="#8E9FB8" /> : <Eye size={16} color="#8E9FB8" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            style={{
              ...styles.submitBtn,
              opacity: isSubmitting ? 0.7 : 1,
            }}
          >
            {isSubmitting ? (
              <span>Verifying Administrative Session...</span>
            ) : (
              <>
                <span>Enter Command Center</span>
                <ArrowRight size={17} color="#07152B" />
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

const styles: { [key: string]: React.CSSProperties } = {
  container: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#040D1B',
    backgroundImage: 'radial-gradient(ellipse 80% 50% at 50% -20%, rgba(223, 183, 108, 0.15), transparent)',
    padding: '24px',
  },
  card: {
    width: '100%',
    maxWidth: '520px',
    backgroundColor: '#07152B',
    border: '1px solid rgba(223, 183, 108, 0.22)',
    borderRadius: '20px',
    padding: '36px',
    boxShadow: '0 20px 50px rgba(0, 0, 0, 0.6), 0 0 40px rgba(223, 183, 108, 0.08)',
  },
  header: {
    textAlign: 'center',
    marginBottom: '28px',
  },
  logoBadge: {
    width: '56px',
    height: '56px',
    backgroundColor: 'rgba(223, 183, 108, 0.12)',
    border: '1px solid rgba(223, 183, 108, 0.35)',
    borderRadius: '16px',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: '14px',
    boxShadow: '0 0 24px rgba(223, 183, 108, 0.2)',
  },
  brandTitle: {
    fontSize: '28px',
    letterSpacing: '0.08em',
    color: '#DFB76C',
    fontWeight: 800,
    margin: '0 0 4px 0',
  },
  brandSubtitle: {
    fontSize: '14px',
    color: '#EAEFF8',
    fontWeight: 500,
    marginBottom: '10px',
  },
  roleTag: {
    display: 'inline-block',
    fontSize: '10.5px',
    fontWeight: 700,
    letterSpacing: '0.08em',
    color: '#DFB76C',
    backgroundColor: 'rgba(223, 183, 108, 0.08)',
    border: '1px solid rgba(223, 183, 108, 0.25)',
    padding: '3px 10px',
    borderRadius: '9999px',
  },
  quickFillSection: {
    marginBottom: '22px',
    padding: '14px',
    backgroundColor: '#0A1B36',
    border: '1px solid rgba(223, 183, 108, 0.12)',
    borderRadius: '12px',
  },
  quickFillLabel: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    fontSize: '11.5px',
    fontWeight: 700,
    color: '#DFB76C',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    marginBottom: '10px',
  },
  pillsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: '8px',
  },
  pill: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-start',
    padding: '8px 10px',
    backgroundColor: 'rgba(7, 21, 43, 0.8)',
    border: '1px solid rgba(223, 183, 108, 0.18)',
    borderRadius: '8px',
    cursor: 'pointer',
    textAlign: 'left',
    transition: 'all 0.18s ease',
  },
  pillActive: {
    backgroundColor: 'rgba(223, 183, 108, 0.18)',
    borderColor: '#DFB76C',
    boxShadow: '0 0 12px rgba(223, 183, 108, 0.25)',
  },
  pillLabel: {
    fontSize: '12px',
    fontWeight: 700,
    color: '#FFFFFF',
  },
  pillDesc: {
    fontSize: '10px',
    color: '#8E9FB8',
    marginTop: '2px',
  },
  errorBanner: {
    backgroundColor: 'rgba(239, 68, 68, 0.14)',
    border: '1px solid rgba(239, 68, 68, 0.4)',
    color: '#FCA5A5',
    fontSize: '12.5px',
    padding: '10px 14px',
    borderRadius: '8px',
    marginBottom: '16px',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
  inputGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
  },
  inputLabel: {
    fontSize: '12px',
    fontWeight: 600,
    color: '#EAEFF8',
  },
  inputWrapper: {
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
  },
  inputIcon: {
    position: 'absolute',
    left: '12px',
    pointerEvents: 'none',
  },
  textInput: {
    width: '100%',
    padding: '11px 40px 11px 38px',
    backgroundColor: '#0C1E38',
    border: '1px solid rgba(223, 183, 108, 0.2)',
    borderRadius: '10px',
    color: '#FFFFFF',
    fontSize: '13.5px',
    outline: 'none',
    boxSizing: 'border-box',
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
  submitBtn: {
    marginTop: '8px',
    padding: '12px 20px',
    background: 'linear-gradient(135deg, #DFB76C 0%, #C6940A 100%)',
    color: '#07152B',
    border: 'none',
    borderRadius: '10px',
    fontSize: '14px',
    fontWeight: 700,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    cursor: 'pointer',
    boxShadow: '0 6px 20px rgba(223, 183, 108, 0.35)',
    transition: 'all 0.2s ease',
  },
};
