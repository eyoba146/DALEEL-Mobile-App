import React, { useState } from 'react';
import { adminApi } from '../api';
import type { AdminUser } from '../api';
import { useToast } from '../context/ToastContext';
import {
  X,
  KeyRound,
  Eye,
  EyeOff,
  Copy,
  Check,
  ShieldAlert,
  Sparkles,
} from 'lucide-react';

interface ResetPasswordModalProps {
  user: AdminUser | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export const ResetPasswordModal: React.FC<ResetPasswordModalProps> = ({
  user,
  isOpen,
  onClose,
  onSuccess,
}) => {
  const { success, error: toastError } = useToast();

  const [newPassword, setNewPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen || !user) return null;

  const handleGeneratePassword = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$%&*';
    let result = 'Daleel#';
    for (let i = 0; i < 6; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    result += '!26';
    setNewPassword(result);
    setIsCopied(false);
  };

  const handleCopy = async () => {
    if (!newPassword) return;
    try {
      await navigator.clipboard.writeText(newPassword);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
      success('Temporary password copied to clipboard', 'Copied');
    } catch {
      toastError('Failed to copy to clipboard', 'Error');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPassword || newPassword.length < 6) {
      toastError('Password must be at least 6 characters long', 'Validation Error');
      return;
    }

    setIsSubmitting(true);
    try {
      await adminApi.resetCoordinatorPassword(user.id, newPassword);
      success(`Password reset for ${user.name} (${user.email})`, 'Credentials Assigned');
      setNewPassword('');
      if (onSuccess) onSuccess();
      onClose();
    } catch (err: any) {
      toastError(err.message || 'Failed to reset password', 'Reset Failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div style={styles.backdrop} onClick={onClose}>
      <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div style={styles.header}>
          <div style={styles.headerLeft}>
            <div style={styles.headerIcon}>
              <KeyRound size={20} color="#DFB76C" />
            </div>
            <div>
              <h3 style={styles.headerTitle}>Reset Coordinator Password</h3>
              <p style={styles.headerSubtitle}>
                Super Administrator Cryptographic Access Delegation
              </p>
            </div>
          </div>
          <button type="button" style={styles.closeBtn} onClick={onClose} title="Close">
            <X size={18} color="#8A9AA8" />
          </button>
        </div>

        <form onSubmit={handleSubmit} style={styles.body}>
          {/* Target Coordinator Badge */}
          <div style={styles.targetCard}>
            <div style={styles.targetAvatar}>
              {user.name ? user.name.charAt(0).toUpperCase() : 'C'}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={styles.targetName}>{user.name}</div>
              <div style={styles.targetEmail}>{user.email}</div>
              <span className="badge badge-navy" style={{ marginTop: '4px' }}>
                {user.adminRole}
              </span>
            </div>
          </div>

          {/* Password Input & Generation Controls */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
              <label style={styles.label}>New Master Password *</label>
              <button
                type="button"
                style={styles.generateBtn}
                onClick={handleGeneratePassword}
              >
                <Sparkles size={12} color="#C59B43" />
                <span>Generate Secure Password</span>
              </button>
            </div>

            <div style={styles.inputWrap}>
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={newPassword}
                onChange={(e) => {
                  setNewPassword(e.target.value);
                  setIsCopied(false);
                }}
                placeholder="Enter or generate temporary password"
                style={styles.input}
              />
              <div style={styles.actionButtonsInside}>
                {newPassword && (
                  <button
                    type="button"
                    style={styles.iconBtnInside}
                    onClick={handleCopy}
                    title="Copy Password"
                  >
                    {isCopied ? <Check size={14} color="#10B981" /> : <Copy size={14} color="#8A9AA8" />}
                  </button>
                )}
                <button
                  type="button"
                  style={styles.iconBtnInside}
                  onClick={() => setShowPassword(!showPassword)}
                  title={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff size={15} color="#8A9AA8" /> : <Eye size={15} color="#8A9AA8" />}
                </button>
              </div>
            </div>
          </div>

          {/* Security Warning Banner */}
          <div style={styles.warningBox}>
            <ShieldAlert size={18} color="#C59B43" style={{ flexShrink: 0, marginTop: '2px' }} />
            <div style={{ fontSize: '12px', color: '#5A4310', lineHeight: 1.5 }}>
              This operation immediately overwrites the coordinator's stored hash in the database. Ensure you convey the new temporary password through a secure administrative channel.
            </div>
          </div>

          {/* Footer */}
          <div style={styles.footer}>
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={isSubmitting || !newPassword}
            >
              <KeyRound size={14} color="#07152B" />
              <span>{isSubmitting ? 'Assigning...' : 'Assign New Password'}</span>
            </button>
          </div>
        </form>
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
    borderRadius: '16px',
    width: '100%',
    maxWidth: '520px',
    boxShadow: '0 24px 60px rgba(0, 0, 0, 0.35)',
    border: '1px solid #E2E8F0',
    overflow: 'hidden',
    animation: 'toastSlideIn 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
  },
  header: {
    padding: '20px 24px',
    borderBottom: '1px solid #E2E8F0',
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
  },
  headerLeft: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '12px',
  },
  headerIcon: {
    width: '38px',
    height: '38px',
    borderRadius: '10px',
    backgroundColor: '#07152B',
    border: '1px solid #DFB76C',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  headerTitle: {
    fontSize: '17px',
    fontWeight: 750,
    color: '#07152B',
    margin: 0,
  },
  headerSubtitle: {
    fontSize: '12px',
    color: '#5A687A',
    margin: '2px 0 0 0',
  },
  closeBtn: {
    background: 'none',
    border: 'none',
    padding: '6px',
    borderRadius: '6px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: {
    padding: '22px 24px',
    display: 'flex',
    flexDirection: 'column',
    gap: '18px',
  },
  targetCard: {
    display: 'flex',
    alignItems: 'center',
    gap: '14px',
    padding: '14px 16px',
    backgroundColor: '#FAFCFE',
    border: '1px solid #EAEFF6',
    borderRadius: '12px',
  },
  targetAvatar: {
    width: '44px',
    height: '44px',
    borderRadius: '50%',
    backgroundColor: '#07152B',
    color: '#DFB76C',
    fontSize: '18px',
    fontWeight: 800,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    border: '1px solid #DFB76C',
    flexShrink: 0,
  },
  targetName: {
    fontSize: '15px',
    fontWeight: 750,
    color: '#07152B',
  },
  targetEmail: {
    fontSize: '12.5px',
    color: '#5A687A',
  },
  label: {
    fontSize: '12px',
    fontWeight: 700,
    color: '#07152B',
  },
  generateBtn: {
    background: 'none',
    border: 'none',
    display: 'inline-flex',
    alignItems: 'center',
    gap: '4px',
    fontSize: '11.5px',
    fontWeight: 700,
    color: '#C59B43',
    cursor: 'pointer',
    padding: '2px 6px',
    borderRadius: '4px',
    transition: 'background-color 0.15s ease',
  },
  inputWrap: {
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
  },
  input: {
    width: '100%',
    padding: '10px 80px 10px 14px',
    fontSize: '13px',
    border: '1px solid #E2E8F0',
    borderRadius: '8px',
    color: '#07152B',
    outline: 'none',
    backgroundColor: '#FFFFFF',
    fontFamily: 'monospace',
  },
  actionButtonsInside: {
    position: 'absolute',
    right: '8px',
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
  },
  iconBtnInside: {
    background: 'none',
    border: 'none',
    padding: '5px',
    borderRadius: '4px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  warningBox: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '10px',
    padding: '12px 14px',
    backgroundColor: '#FDF8E8',
    border: '1px solid #EBD59B',
    borderRadius: '10px',
  },
  footer: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: '10px',
    paddingTop: '12px',
    borderTop: '1px solid #F1F4F9',
  },
};
