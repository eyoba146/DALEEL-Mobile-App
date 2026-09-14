import { router } from 'expo-router';
import React, { useState, useEffect } from 'react';
import {
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Button } from '../../components/Button';
import { Input } from '../../components/Input';
import { OtpInput } from '../../components/OtpInput';
import { ApiError, authApi } from '../../lib/api';
import { colors, radius, spacing, type } from '../../theme/tokens';

type Step = 'email' | 'code' | 'password';

export default function ForgotPassword() {
  const [step, setStep] = useState<Step>('email');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [cooldown, setCooldown] = useState(0); // 1 min 15 sec rate limit

  // Cooldown countdown timer (75s)
  useEffect(() => {
    if (cooldown <= 0) return;
    const interval = setInterval(() => {
      setCooldown(prev => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, [cooldown]);

  const formatCooldown = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  // Clear messages after 4 seconds
  useEffect(() => {
    let timeout: ReturnType<typeof setTimeout>;
    if (success || error) {
      timeout = setTimeout(() => {
        setSuccess(null);
        setError(null);
      }, 4000);
    }
    return () => clearTimeout(timeout);
  }, [success, error]);

  const clearMessages = () => { setError(null); setSuccess(null); };

  /* ── Step 1: Send code ── */
  const handleSendCode = async () => {
    clearMessages();
    const trimmed = email.trim();
    if (!trimmed.includes('@')) {
      setError('Enter a valid email address.');
      return;
    }
    setLoading(true);
    try {
      await authApi.forgotPassword({ email: trimmed });
      setStep('code');
      setSuccess('A reset code was sent to your email.');
      setCooldown(75); // Start 1m 15s cooldown
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Could not send reset code. Try again.');
    } finally {
      setLoading(false);
    }
  };

  /* ── Resend Code for Step 2 ── */
  const handleResendCode = async () => {
    if (cooldown > 0 || resending) return;
    clearMessages();
    setResending(true);
    try {
      await authApi.forgotPassword({ email: email.trim() });
      setSuccess('A new reset code has been sent to your email.');
      setCooldown(75);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Could not resend code. Try again.');
    } finally {
      setResending(false);
    }
  };

  /* ── Step 2: Verify code ── */
  const handleVerifyCode = async () => {
    clearMessages();
    if (code.length !== 6) {
      setError('Enter all 6 digits of the reset code.');
      return;
    }
    setLoading(true);
    try {
      await authApi.verifyResetCode({ email: email.trim(), code });
      setStep('password');
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Invalid or expired reset code. Please check and try again.');
    } finally {
      setLoading(false);
    }
  };


  /* ── Step 3: Set new password ── */
  const handleResetPassword = async () => {
    clearMessages();
    if (newPassword.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    setLoading(true);
    try {
      await authApi.resetPassword({ email: email.trim(), code, newPassword });
      setSuccess('Password updated successfully! You can now sign in.');
      // Brief delay then navigate
      setTimeout(() => router.replace('/(auth)/login'), 2000);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Failed to reset password. Try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    clearMessages();
    if (step === 'code') { setStep('email'); setCode(''); }
    else if (step === 'password') { setStep('code'); }
    else router.back();
  };

  const stepMeta = {
    email: {
      hero: 'Forgot password?',
      sub: 'Enter your registered email and we\'ll send you a 6-digit reset code.',
    },
    code: {
      hero: 'Enter the code',
      sub: `We sent a 6-digit code to\n${email.trim()}`,
    },
    password: {
      hero: 'New password',
      sub: 'Choose a strong new password for your account.',
    },
  };

  const meta = stepMeta[step];

  return (
    <SafeAreaView style={styles.screen}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Top Bar with Native Back Button */}
          <View style={styles.navBar}>
            <TouchableOpacity style={styles.backBtn} onPress={handleBack} hitSlop={12}>
              <Ionicons name="arrow-back" size={20} color={colors.charcoal} />
            </TouchableOpacity>
          </View>

          {/* Cumulative Step Indicator */}
          <View style={styles.stepRow}>
            {(['email', 'code', 'password'] as Step[]).map((s, i) => {
              const stepIndex = ['email', 'code', 'password'].indexOf(step);
              return (
                <View key={s} style={styles.stepPip}>
                  <View style={[styles.pip, i <= stepIndex && styles.pipActive]} />
                </View>
              );
            })}
          </View>

          {/* Brand */}
          <View style={styles.brandArea}>
            <View style={styles.logoContainer}>
              <Image source={require('../../assets/icon.png')} style={styles.logo} />
            </View>
            <Text style={styles.wordmark}>D A L E E L</Text>
          </View>

          <Text style={styles.hero}>{meta.hero}</Text>
          <Text style={styles.sub}>{meta.sub}</Text>
          {step === 'code' && (
            <View style={styles.emailPillContainer}>
              <View style={styles.emailPill}>
                <Ionicons name="mail-outline" size={14} color={colors.navy} />
                <Text style={styles.emailBold}>{email.trim()}</Text>
              </View>
            </View>
          )}

          {/* ── Step 1 ── */}
          {step === 'email' && (
            <View style={styles.fields}>
              <Input
                label="Email address"
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                keyboardType="email-address"
                autoComplete="email"
                returnKeyType="done"
                onSubmitEditing={handleSendCode}
              />
            </View>
          )}

          {/* ── Step 2 ── */}
          {step === 'code' && (
            <View style={styles.otpArea}>
              <OtpInput
                value={code}
                onChange={v => { setCode(v); clearMessages(); }}
                error={!!error}
              />
            </View>
          )}

          {/* ── Step 3 ── */}
          {step === 'password' && (
            <View style={styles.fields}>
              <View style={{ position: 'relative' }}>
                <Input
                  label="New password (min 8 chars)"
                  value={newPassword}
                  onChangeText={setNewPassword}
                  secureTextEntry={!showPassword}
                  returnKeyType="next"
                />
                <Pressable style={styles.eyeBtn} onPress={() => setShowPassword(v => !v)} hitSlop={12}>
                  <Ionicons name={showPassword ? 'eye-off-outline' : 'eye-outline'} size={20} color={colors.charcoalLight} />
                </Pressable>
              </View>
              <View style={{ position: 'relative' }}>
                <Input
                  label="Confirm new password"
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  secureTextEntry={!showConfirm}
                  returnKeyType="done"
                  onSubmitEditing={handleResetPassword}
                />
                <Pressable style={styles.eyeBtn} onPress={() => setShowConfirm(v => !v)} hitSlop={12}>
                  <Ionicons name={showConfirm ? 'eye-off-outline' : 'eye-outline'} size={20} color={colors.charcoalLight} />
                </Pressable>
              </View>
            </View>
          )}

          {/* Error */}
          {!!error && (
            <View style={styles.errorRow}>
              <Ionicons name="alert-circle" size={16} color={colors.error} />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          {/* Success */}
          {!!success && (
            <View style={styles.successRow}>
              <Ionicons name="checkmark-circle" size={16} color={colors.success} />
              <Text style={styles.successText}>{success}</Text>
            </View>
          )}

          {/* CTA */}
          {step === 'email' && (
            <Button label="Send Reset Code" onPress={handleSendCode} loading={loading} style={styles.cta} />
          )}
          {step === 'code' && (
            <>
              <Button label="Continue" onPress={handleVerifyCode} loading={loading} style={styles.cta} />
              <TouchableOpacity
                onPress={handleResendCode}
                disabled={resending || cooldown > 0 || loading}
                hitSlop={12}
                style={styles.resendBtn}
              >
                <Ionicons
                  name="refresh-outline"
                  size={15}
                  color={resending || cooldown > 0 ? colors.charcoalLight : colors.navy}
                />
                <Text style={[styles.resendText, (resending || cooldown > 0) && styles.mutedText]}>
                  {resending
                    ? 'Sending…'
                    : cooldown > 0
                    ? `Resend code in ${formatCooldown(cooldown)}`
                    : 'Resend code'}
                </Text>
              </TouchableOpacity>
            </>
          )}
          {step === 'password' && (
            <Button label="Reset Password" onPress={handleResetPassword} loading={loading} style={styles.cta} />
          )}

          {/* Spacer */}
          <View style={{ flex: 1, minHeight: 36 }} />

          {/* Back to login — pinned */}
          <TouchableOpacity
            onPress={() => router.replace('/(auth)/login')}
            hitSlop={12}
            style={styles.bottomLink}
          >
            <Text style={styles.bottomLinkText}>← Back to login</Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  content: {
    flexGrow: 1,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xs,
    paddingBottom: spacing.xl,
  },

  navBar: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F7F8FA',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#EAEFF5',
  },

  /* 3-step progress pips */
  stepRow: {
    flexDirection: 'row',
    gap: spacing.xs,
    marginBottom: spacing.lg,
  },
  stepPip: { flex: 1 },
  pip: {
    height: 4,
    borderRadius: 2,
    backgroundColor: '#EAEFF5',
  },
  pipActive: {
    backgroundColor: colors.navy,
  },

  brandArea: {
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  logoContainer: {
    shadowColor: colors.gold,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 10,
    elevation: 2,
    marginBottom: spacing.xs,
  },
  logo: {
    width: 64,
    height: 64,
    borderRadius: 18,
  },
  wordmark: {
    fontFamily: 'Inter_700Bold',
    fontSize: 10,
    letterSpacing: 4,
    color: colors.gold,
    textTransform: 'uppercase',
  },

  hero: {
    fontFamily: 'DMSerifDisplay_400Regular',
    fontSize: 30,
    lineHeight: 38,
    color: colors.charcoal,
    marginBottom: 6,
  },
  sub: {
    ...type.body,
    fontSize: 15,
    color: colors.charcoalSub,
    marginBottom: spacing.sm,
  },
  emailPillContainer: {
    alignItems: 'flex-start',
    marginBottom: spacing.lg,
  },
  emailPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#F3F5F9',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: radius.pill,
  },
  emailBold: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 13,
    color: colors.navy,
  },

  fields: {
    marginBottom: spacing.xs,
  },
  eyeBtn: {
    position: 'absolute',
    right: 16,
    top: 19,
    zIndex: 2,
  },

  otpArea: {
    alignItems: 'center',
    marginTop: spacing.sm,
    marginBottom: spacing.xl,
  },

  errorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: spacing.md,
    backgroundColor: colors.errorSoft,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: '#FED7D7',
  },
  errorText: { ...type.bodySmall, color: colors.error, flex: 1 },

  successRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: spacing.md,
    backgroundColor: '#ECFDF5',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  successText: { ...type.bodySmall, color: colors.success, flex: 1 },

  cta: { width: '100%', marginTop: spacing.xs },
  resendBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: spacing.lg,
    paddingVertical: spacing.xs,
  },
  resendText: {
    ...type.bodySmall,
    fontFamily: 'Inter_600SemiBold',
    color: colors.navy,
  },
  mutedText: {
    color: colors.charcoalLight,
  },

  bottomLink: {
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  bottomLinkText: {
    fontFamily: 'Inter_500Medium',
    fontSize: 14,
    color: colors.charcoalSub,
  },
});


