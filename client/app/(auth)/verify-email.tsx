import { router } from 'expo-router';
import React, { useState, useEffect } from 'react';
import {
  Image,
  KeyboardAvoidingView,
  Platform,
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
import { useAuth } from '../../lib/auth-context';
import { colors, radius, spacing, type } from '../../theme/tokens';

export default function VerifyEmail() {
  const { user, token, checkVerificationStatus, logout } = useAuth();
  const [code, setCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>('A verification code has been sent to your email.');
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [isChangingEmail, setIsChangingEmail] = useState(false);
  const [newEmail, setNewEmail] = useState('');
  const [cooldown, setCooldown] = useState(75); // 1 min and 15 seconds rate limit

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

  const handleVerify = async () => {
    setError(null);
    setSuccess(null);
    if (code.length !== 6) {
      setError('Enter all 6 digits of your code.');
      return;
    }
    setLoading(true);
    try {
      if (!user?.email) throw new Error('Missing email');
      await authApi.verifyEmail({ email: user.email, code });
      await checkVerificationStatus();
      router.replace('/(tabs)');
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Verification failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (!token || cooldown > 0) return;
    setResending(true);
    setError(null);
    setSuccess(null);
    try {
      await authApi.resendVerification(token);
      setCode('');
      setSuccess('A new verification code was sent to your email.');
      setCooldown(75); // Reset 1m 15s cooldown
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Failed to resend code.');
    } finally {
      setResending(false);
    }
  };

  const handleChangeEmail = async () => {
    if (!token) return;
    setError(null);
    setSuccess(null);
    const trimmed = newEmail.trim();
    if (!trimmed.includes('@')) {
      setError('Enter a valid email address.');
      return;
    }
    setLoading(true);
    try {
      await authApi.changePendingEmail(token, trimmed);
      await checkVerificationStatus();
      setIsChangingEmail(false);
      setNewEmail('');
      setCode('');
      setSuccess(`A new code was sent to ${trimmed}.`);
      setCooldown(75);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Failed to change email.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoBack = async () => {
    await logout();
    router.replace('/(auth)/login');
  };

  if (isChangingEmail) {
    return (
      <SafeAreaView style={styles.screen}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
          <View style={styles.content}>
            {/* Top Bar */}
            <View style={styles.navBar}>
              <TouchableOpacity
                style={styles.backBtn}
                onPress={() => { setIsChangingEmail(false); setError(null); }}
                hitSlop={12}
              >
                <Ionicons name="arrow-back" size={20} color={colors.charcoal} />
              </TouchableOpacity>
            </View>

            <Text style={styles.heroLeft}>Change Email</Text>
            <Text style={styles.subLeft}>Enter your correct email address. We'll send a new verification code.</Text>

            {/* Full-width input */}
            <View style={styles.inputArea}>
              <Input
                label="New email address"
                value={newEmail}
                onChangeText={setNewEmail}
                autoCapitalize="none"
                keyboardType="email-address"
                autoComplete="email"
                returnKeyType="done"
                onSubmitEditing={handleChangeEmail}
              />
            </View>

            {!!error && (
              <View style={styles.errorRow}>
                <Ionicons name="alert-circle" size={16} color={colors.error} />
                <Text style={styles.errorText}>{error}</Text>
              </View>
            )}

            {!!success && (
              <View style={styles.successRow}>
                <Ionicons name="checkmark-circle" size={16} color={colors.success} />
                <Text style={styles.successText}>{success}</Text>
              </View>
            )}

            <Button
              label="Update & Send Code"
              onPress={handleChangeEmail}
              loading={loading}
              style={{ width: '100%', marginTop: spacing.sm }}
            />
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.screen}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Top Bar with Back Button */}
          <View style={styles.navBar}>
            <TouchableOpacity
              style={styles.backBtn}
              onPress={handleGoBack}
              hitSlop={12}
            >
              <Ionicons name="arrow-back" size={20} color={colors.charcoal} />
            </TouchableOpacity>
          </View>

          {/* Email illustration badge */}
          <View style={styles.badgeArea}>
            <View style={styles.iconCircle}>
              <Ionicons name="mail-open-outline" size={32} color={colors.navy} />
            </View>
          </View>

          <Text style={styles.hero}>Check your email</Text>
          <Text style={styles.sub}>Enter the 6-digit verification code sent to</Text>
          <View style={styles.emailPillContainer}>
            <View style={styles.emailPill}>
              <Ionicons name="mail-outline" size={14} color={colors.navy} />
              <Text style={styles.emailHighlight}>{user?.email}</Text>
            </View>
          </View>

          {/* 6-box OTP */}
          <View style={styles.otpArea}>
            <OtpInput
              value={code}
              onChange={v => { setCode(v); if (error) setError(null); }}
              error={!!error}
            />
          </View>

          {!!error && (
            <View style={styles.errorRow}>
              <Ionicons name="alert-circle" size={16} color={colors.error} />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          {!!success && (
            <View style={styles.successRow}>
              <Ionicons name="checkmark-circle" size={16} color={colors.success} />
              <Text style={styles.successText}>{success}</Text>
            </View>
          )}

          <Button
            label="Verify Email"
            onPress={handleVerify}
            loading={loading}
            style={styles.cta}
          />

          {/* Secondary actions — horizontal row */}
          <View style={styles.secondaryRow}>
            <TouchableOpacity
              onPress={handleResend}
              disabled={resending || loading || cooldown > 0}
              hitSlop={12}
              style={styles.secondaryBtn}
            >
              <Ionicons
                name="refresh-outline"
                size={15}
                color={resending || cooldown > 0 ? colors.charcoalLight : colors.navy}
              />
              <Text style={[styles.secondaryText, (resending || cooldown > 0) && styles.mutedText]}>
                {resending
                  ? 'Sending…'
                  : cooldown > 0
                  ? `Resend in ${formatCooldown(cooldown)}`
                  : 'Resend code'}
              </Text>
            </TouchableOpacity>

            <View style={styles.secondaryDot} />

            <TouchableOpacity
              onPress={() => { setIsChangingEmail(true); setError(null); }}
              disabled={loading}
              hitSlop={12}
              style={styles.secondaryBtn}
            >
              <Ionicons name="pencil-outline" size={15} color={colors.navy} />
              <Text style={styles.secondaryText}>Change email</Text>
            </TouchableOpacity>
          </View>

          {/* Spacer pushes back-to-login to the very bottom */}
          <View style={{ flex: 1, minHeight: 48 }} />

          {/* Back to login — pinned to bottom */}
          <TouchableOpacity
            onPress={handleGoBack}
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

  /* Non-scrollable layout used for the change-email sub-screen */
  content: {
    flex: 1,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xs,
    paddingBottom: spacing.xl,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xs,
    paddingBottom: spacing.xl,
  },

  navBar: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
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

  badgeArea: {
    alignItems: 'center',
    marginTop: spacing.md,
    marginBottom: spacing.lg,
  },
  iconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#F0F4FA',
    borderWidth: 1.5,
    borderColor: '#E2E8F4',
    alignItems: 'center',
    justifyContent: 'center',
  },

  hero: {
    fontFamily: 'DMSerifDisplay_400Regular',
    fontSize: 28,
    lineHeight: 36,
    color: colors.charcoal,
    textAlign: 'center',
    marginBottom: 6,
  },
  heroLeft: {
    fontFamily: 'DMSerifDisplay_400Regular',
    fontSize: 28,
    lineHeight: 36,
    color: colors.charcoal,
    marginBottom: 6,
  },
  sub: {
    fontFamily: 'Inter_400Regular',
    fontSize: 15,
    color: colors.charcoalSub,
    textAlign: 'center',
    marginBottom: 8,
  },
  subLeft: {
    fontFamily: 'Inter_400Regular',
    fontSize: 15,
    color: colors.charcoalSub,
    marginBottom: spacing.xl,
  },

  emailPillContainer: {
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  emailPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#F3F5F9',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: radius.pill,
  },
  emailHighlight: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 14,
    color: colors.navy,
  },

  inputArea: {
    width: '100%',
    marginBottom: spacing.sm,
  },

  otpArea: {
    marginBottom: spacing.xl,
    alignItems: 'center',
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

  cta: { width: '100%', marginBottom: spacing.xl },

  /* Horizontal row: Resend · Change email */
  secondaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  secondaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingVertical: spacing.xs,
  },
  secondaryText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 14,
    color: colors.navy,
  },
  mutedText: {
    color: colors.charcoalLight,
  },
  secondaryDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.charcoalLight,
  },

  /* Back to login — absolute bottom */
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
