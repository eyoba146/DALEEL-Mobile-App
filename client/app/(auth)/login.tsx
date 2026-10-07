import { Feather, Ionicons } from '@expo/vector-icons';
import { Link, router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button } from '../../components/Button';
import { ApiError } from '../../lib/api';
import { useAuth } from '../../lib/auth-context';
import { colors, fonts, radius, shadow, spacing, type } from '../../theme/tokens';

export default function Login() {
  const insets = useSafeAreaInsets();
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Field-level validation tracking
  const [touchedEmail, setTouchedEmail] = useState(false);
  const [touchedPassword, setTouchedPassword] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  // Live field validation computations
  const emailTrimmed = email.trim();
  const isEmailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailTrimmed);
  const emailError = (touchedEmail || submitted)
    ? !emailTrimmed
      ? 'Email address is required.'
      : !isEmailValid
      ? 'Please enter a valid email address (e.g. name@domain.com).'
      : null
    : null;

  const passwordError = (touchedPassword || submitted)
    ? !password
      ? 'Password is required.'
      : password.length < 6
      ? 'Password must be at least 6 characters.'
      : null
    : null;

  // Auto-dismiss errors after 5 seconds
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  const handleLogin = async () => {
    setSubmitted(true);
    setError(null);
    if (!emailTrimmed || !isEmailValid) {
      setTouchedEmail(true);
      return;
    }
    if (!password || password.length < 6) {
      setTouchedPassword(true);
      return;
    }
    setLoading(true);
    try {
      await login(emailTrimmed, password);
      router.replace('/(tabs)');
    } catch (e: any) {
      setError(
        e instanceof ApiError
          ? e.message
          : e?.message || 'Could not connect. Please check your credentials and internet connection.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.screen}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          bounces={false}
        >
          {/* ── 1. Luxury Deep Navy Editorial Header Canvas ── */}
          <View style={[styles.heroCanvas, { paddingTop: Math.max(insets.top, 24) + 16 }]}>
            {/* Top Brand Cluster */}
            <View style={styles.brandCluster}>
              <View style={styles.compassPod}>
                <Ionicons name="compass" size={20} color={colors.gold} />
              </View>
              <Text style={styles.brandWordmark}>D A L E E L</Text>
            </View>

            {/* Editorial Title */}
            <Text style={styles.heroTitle}>Welcome Back</Text>
            <Text style={styles.heroSubtitle}>
              Sign in to access your diaspora concierge, saved sanctuaries, and active inquiries.
            </Text>

            {/* Subtle decorative gold line */}
            <View style={styles.accentLine} />
          </View>

          {/* ── 2. Seamless Form Canvas (Flush to Background, No Card Effect) ── */}
          <View style={[styles.formContainer, { paddingBottom: Math.max(insets.bottom, 20) + 24 }]}>
            {/* Server Error Banner */}
            {!!error && (
              <View style={styles.errorBanner}>
                <Ionicons name="alert-circle" size={18} color={colors.error} />
                <Text style={styles.errorText}>{error}</Text>
              </View>
            )}

            {/* Email Address Input */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>EMAIL ADDRESS *</Text>
              <View style={[styles.inputBox, !!emailError && styles.inputBoxError]}>
                <Ionicons
                  name="mail-outline"
                  size={18}
                  color={emailError ? colors.error : colors.charcoalSub}
                  style={styles.inputIcon}
                />
                <TextInput
                  style={styles.textInput}
                  value={email}
                  onChangeText={(val) => {
                    setEmail(val);
                    if (error) setError(null);
                  }}
                  onBlur={() => setTouchedEmail(true)}
                  placeholder="name@example.com"
                  placeholderTextColor={colors.charcoalLight}
                  autoCapitalize="none"
                  keyboardType="email-address"
                  autoComplete="email"
                  returnKeyType="next"
                />
                {email.length > 0 && (
                  <Pressable onPress={() => setEmail('')} hitSlop={10}>
                    <Ionicons name="close-circle" size={16} color={colors.charcoalLight} />
                  </Pressable>
                )}
              </View>
              {!!emailError && (
                <View style={styles.fieldErrorRow}>
                  <Ionicons name="alert-circle" size={13} color={colors.error} />
                  <Text style={styles.fieldErrorText}>{emailError}</Text>
                </View>
              )}
            </View>

            {/* Password Input */}
            <View style={styles.inputGroup}>
              <View style={styles.passwordLabelRow}>
                <Text style={styles.inputLabel}>PASSWORD *</Text>
                <Link href="/(auth)/forgot-password" asChild>
                  <TouchableOpacity hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                    <Text style={styles.forgotLink}>Forgot password?</Text>
                  </TouchableOpacity>
                </Link>
              </View>
              <View style={[styles.inputBox, !!passwordError && styles.inputBoxError]}>
                <Ionicons
                  name="lock-closed-outline"
                  size={18}
                  color={passwordError ? colors.error : colors.charcoalSub}
                  style={styles.inputIcon}
                />
                <TextInput
                  style={styles.textInput}
                  value={password}
                  onChangeText={(val) => {
                    setPassword(val);
                    if (error) setError(null);
                  }}
                  onBlur={() => setTouchedPassword(true)}
                  placeholder="Enter your password"
                  placeholderTextColor={colors.charcoalLight}
                  secureTextEntry={!showPassword}
                  autoComplete="password"
                  returnKeyType="done"
                  onSubmitEditing={handleLogin}
                />
                <Pressable
                  onPress={() => setShowPassword((v) => !v)}
                  hitSlop={12}
                  style={styles.eyeBtn}
                >
                  <Feather
                    name={showPassword ? 'eye-off' : 'eye'}
                    size={18}
                    color={passwordError ? colors.error : colors.charcoalSub}
                  />
                </Pressable>
              </View>
              {!!passwordError && (
                <View style={styles.fieldErrorRow}>
                  <Ionicons name="alert-circle" size={13} color={colors.error} />
                  <Text style={styles.fieldErrorText}>{passwordError}</Text>
                </View>
              )}
            </View>

            {/* Sign In Primary CTA */}
            <Button
              label={loading ? 'Signing In...' : 'Sign In'}
              onPress={handleLogin}
              loading={loading}
              variant="primary"
              icon="arrow-forward"
              iconPosition="right"
              style={styles.ctaButton}
            />

            {/* Bottom Registration Prompt */}
            <View style={styles.footerRow}>
              <Text style={styles.footerText}>Don't have an account?</Text>
              <Link href="/(auth)/register" asChild>
                <TouchableOpacity hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                  <Text style={styles.registerLink}> Create Account</Text>
                </TouchableOpacity>
              </Link>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.navy,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'space-between',
    backgroundColor: colors.background,
  },

  // Hero Canvas
  heroCanvas: {
    backgroundColor: colors.navy,
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.xxl,
  },
  brandCluster: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: spacing.lg,
  },
  compassPod: {
    width: 34,
    height: 34,
    borderRadius: radius.pill,
    backgroundColor: 'rgba(223,183,108,0.16)',
    borderWidth: 1,
    borderColor: 'rgba(223,183,108,0.35)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandWordmark: {
    fontFamily: fonts.bodyBold,
    fontSize: 12,
    letterSpacing: 4,
    color: colors.gold,
    textTransform: 'uppercase',
  },
  heroTitle: {
    fontFamily: fonts.heading,
    fontSize: 32,
    lineHeight: 38,
    color: '#FFFFFF',
    marginBottom: 8,
  },
  heroSubtitle: {
    fontFamily: fonts.body,
    fontSize: 14.5,
    lineHeight: 22,
    color: '#B2C0D2',
    maxWidth: 340,
  },
  accentLine: {
    width: 48,
    height: 3,
    backgroundColor: colors.gold,
    borderRadius: 2,
    marginTop: spacing.md,
  },

  // Form Container (Flush to Canvas, No Card Effect)
  formContainer: {
    backgroundColor: colors.background,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xl,
    flex: 1,
  },

  // Inputs
  inputGroup: {
    marginBottom: spacing.md,
  },
  inputLabel: {
    fontFamily: fonts.bodyBold,
    fontSize: 11,
    letterSpacing: 0.8,
    color: colors.navy,
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  passwordLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  forgotLink: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 12,
    color: colors.goldText,
  },
  inputBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: 14,
    height: 52,
  },
  inputBoxError: {
    borderColor: colors.error,
    backgroundColor: '#FFF5F5',
  },
  fieldErrorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 6,
    marginLeft: 2,
  },
  fieldErrorText: {
    fontFamily: fonts.bodyMedium,
    fontSize: 12,
    color: colors.error,
    lineHeight: 16,
  },
  inputIcon: {
    marginRight: 10,
  },
  textInput: {
    flex: 1,
    fontFamily: fonts.body,
    fontSize: 14.5,
    color: colors.textPrimary,
    height: '100%',
  },
  eyeBtn: {
    padding: 4,
  },

  // Errors
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.errorSoft,
    borderWidth: 1,
    borderColor: '#FED7D7',
    borderRadius: radius.md,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginBottom: spacing.md,
  },
  errorText: {
    fontFamily: fonts.bodyMedium,
    fontSize: 13,
    color: colors.error,
    flex: 1,
    lineHeight: 18,
  },

  // Buttons
  ctaButton: {
    marginTop: spacing.sm,
    height: 52,
    borderRadius: radius.md,
    backgroundColor: colors.navy,
  },

  // Footer
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.xl,
  },
  footerText: {
    fontFamily: fonts.body,
    fontSize: 14,
    color: colors.textSecondary,
  },
  registerLink: {
    fontFamily: fonts.bodyBold,
    fontSize: 14,
    color: colors.navy,
  },
});
