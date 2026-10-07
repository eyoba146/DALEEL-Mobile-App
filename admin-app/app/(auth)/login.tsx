import React, { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAdminAuth } from '../../lib/auth-context';
import { useAdminToast } from '../../lib/toast-context';
import { Button } from '../../components/Button';
import { Input } from '../../components/Input';
import { colors, fonts, radius, shadow, spacing, type } from '../../theme/tokens';

export default function AdminLoginScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { login } = useAdminAuth();
  const { error: toastError, success: toastSuccess } = useAdminToast();

  const [email, setEmail] = useState('admin@daleel.et');
  const [password, setPassword] = useState('admin123');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  // Validation States
  const [touchedEmail, setTouchedEmail] = useState(false);
  const [touchedPassword, setTouchedPassword] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const isEmailValid = (val: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val.trim());
  const emailError =
    (touchedEmail || submitted) && !isEmailValid(email)
      ? 'Please enter a valid administrative email'
      : '';
  const passwordError =
    (touchedPassword || submitted) && password.length < 6
      ? 'Passkey must be at least 6 characters'
      : '';

  const handleLogin = async () => {
    setSubmitted(true);
    setTouchedEmail(true);
    setTouchedPassword(true);

    if (!isEmailValid(email) || password.length < 6) {
      toastError('Please resolve the highlighted credential fields.');
      return;
    }

    setLoading(true);
    try {
      const user = await login(email, password);
      toastSuccess(`Welcome back, ${user.name}`);
      router.replace('/(tabs)');
    } catch (err: any) {
      const msg = err.message || 'Invalid administrative credentials. Please verify your passkey.';
      toastError(msg, 'Access Denied');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: colors.navy }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          {
            paddingTop: Math.max(insets.top, 24) + 16,
            paddingBottom: Math.max(insets.bottom, 24) + 24,
          },
        ]}
        keyboardShouldPersistTaps="handled"
      >
        {/* Editorial Header Section */}
        <View style={styles.headerArea}>
          <View style={styles.brandIconWrap}>
            <Ionicons name="shield-checkmark" size={30} color={colors.gold} />
          </View>
          <View style={styles.systemBadge}>
            <Text style={styles.systemBadgeText}>RESTRICTED ACCESS CONSOLE</Text>
          </View>
          <Text style={styles.mainTitle}>Administrative Sign In</Text>
          <Text style={styles.subtitle}>
            Governance, inquiry triage, partner verification, and diaspora platform administration.
          </Text>
        </View>

        {/* Credentials Form Desk */}
        <View style={styles.formCard}>
          <Input
            label="Official Administrative Email"
            value={email}
            onChangeText={setEmail}
            onBlur={() => setTouchedEmail(true)}
            error={emailError}
            autoCapitalize="none"
            keyboardType="email-address"
            autoCorrect={false}
            leftIcon="mail-outline"
          />

          <Input
            label="Security Passkey"
            value={password}
            onChangeText={setPassword}
            onBlur={() => setTouchedPassword(true)}
            error={passwordError}
            secureTextEntry={!showPassword}
            leftIcon="lock-closed-outline"
            rightElement={
              <TouchableOpacity
                onPress={() => setShowPassword(!showPassword)}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Ionicons
                  name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                  size={18}
                  color={colors.textTertiary}
                />
              </TouchableOpacity>
            }
          />

          <Button
            label={loading ? 'Verifying Credentials...' : 'Authenticate & Enter Console'}
            onPress={handleLogin}
            loading={loading}
            variant="gold"
            size="large"
            icon="key-outline"
            style={{ marginTop: 8 }}
          />

          {/* Quick Demo Pre-fill Coordinator Badges */}
          <View style={styles.demoCredsBox}>
            <View style={styles.demoHeader}>
              <Ionicons name="information-circle-outline" size={15} color={colors.goldText} />
              <Text style={styles.demoTitle}>Default Super Administrator Credentials</Text>
            </View>
            <Text style={styles.demoDetails}>admin@daleel.et · admin123</Text>
          </View>
        </View>

        {/* Institutional Security Notice */}
        <View style={styles.securityNoticeRow}>
          <Ionicons name="lock-closed" size={13} color="rgba(255, 255, 255, 0.4)" />
          <Text style={styles.securityNoticeText}>
            Protected institutional network. Unauthorized access attempts are monitored and recorded.
          </Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 20,
    justifyContent: 'center',
  },
  headerArea: {
    alignItems: 'center',
    marginBottom: 28,
  },
  brandIconWrap: {
    width: 62,
    height: 62,
    borderRadius: 18,
    backgroundColor: 'rgba(223, 183, 108, 0.15)',
    borderWidth: 1.5,
    borderColor: colors.goldBorder,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  systemBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 999,
    marginBottom: 10,
  },
  systemBadgeText: {
    fontSize: 10,
    fontFamily: fonts.sansBold,
    color: colors.gold,
    letterSpacing: 1.2,
  },
  mainTitle: {
    fontSize: 26,
    fontFamily: fonts.serifBold,
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    ...type.bodySmall,
    color: 'rgba(255, 255, 255, 0.7)',
    textAlign: 'center',
    maxWidth: 320,
    lineHeight: 20,
  },
  formCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: radius.lg,
    padding: 22,
    ...shadow.modal,
  },
  demoCredsBox: {
    marginTop: 18,
    padding: 12,
    backgroundColor: colors.surfaceWarm,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.goldBorder,
  },
  demoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  demoTitle: {
    ...type.tiny,
    fontWeight: '700',
    color: colors.goldText,
  },
  demoDetails: {
    ...type.caption,
    color: colors.textPrimary,
    fontWeight: '600',
  },
  securityNoticeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 24,
    paddingHorizontal: 16,
  },
  securityNoticeText: {
    fontSize: 11,
    fontFamily: fonts.sansMedium,
    color: 'rgba(255, 255, 255, 0.5)',
    textAlign: 'center',
    lineHeight: 16,
    flex: 1,
  },
});
