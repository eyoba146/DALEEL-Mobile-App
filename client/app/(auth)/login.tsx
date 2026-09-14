import { Link, router } from 'expo-router';
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
import { ApiError } from '../../lib/api';
import { useAuth } from '../../lib/auth-context';
import { colors, spacing, type, radius } from '../../theme/tokens';

export default function Login() {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Auto-dismiss errors after 4 seconds
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  const handleLogin = async () => {
    setError(null);
    const trimmedEmail = email.trim();
    if (!trimmedEmail || !password) {
      setError('Please fill in both email and password.');
      return;
    }
    setLoading(true);
    try {
      await login(trimmedEmail, password);
      router.replace('/(tabs)');
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Could not connect. Check your connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.screen}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.topSection}>
            {/* Branding */}
            <View style={styles.brandArea}>
              <View style={styles.logoContainer}>
                <Image source={require('../../assets/icon.png')} style={styles.logo} />
              </View>
              <Text style={styles.wordmark}>D A L E E L</Text>
            </View>

            {/* Editorial Heading */}
            <Text style={styles.hero}>Welcome back</Text>
            <Text style={styles.sub}>Sign in to your account to continue</Text>

            {/* Input Fields */}
            <View style={styles.fields}>
              <Input
                label="Email address"
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                keyboardType="email-address"
                autoComplete="email"
                returnKeyType="next"
              />

              <View style={{ position: 'relative' }}>
                <Input
                  label="Password"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                  autoComplete="password"
                  returnKeyType="done"
                  onSubmitEditing={handleLogin}
                />
                <Pressable
                  style={styles.eyeBtn}
                  onPress={() => setShowPassword(v => !v)}
                  hitSlop={12}
                >
                  <Ionicons
                    name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                    size={20}
                    color={colors.charcoalLight}
                  />
                </Pressable>
              </View>
            </View>

            {/* Forgot Password */}
            <Link href="/(auth)/forgot-password" asChild>
              <TouchableOpacity style={styles.forgotRow} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                <Text style={styles.forgotText}>Forgot password?</Text>
              </TouchableOpacity>
            </Link>

            {/* Error banner */}
            {!!error && (
              <View style={styles.errorRow}>
                <Ionicons name="alert-circle" size={16} color={colors.error} />
                <Text style={styles.errorText}>{error}</Text>
              </View>
            )}

            {/* Primary Action */}
            <Button
              label="Sign In"
              onPress={handleLogin}
              loading={loading}
              variant="gold"
              style={styles.cta}
            />
          </View>

          {/* Bottom section with register link */}
          <View style={styles.bottomSection}>
            <View style={styles.dividerRow}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>or</Text>
              <View style={styles.dividerLine} />
            </View>

            <View style={styles.footer}>
              <Text style={styles.footerText}>Don't have an account?</Text>
              <Link href="/(auth)/register" asChild>
                <TouchableOpacity hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                  <Text style={styles.footerLink}> Create account</Text>
                </TouchableOpacity>
              </Link>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    flexGrow: 1,
    justifyContent: 'space-between',
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.lg,
    paddingBottom: spacing.xl,
  },
  topSection: {
    width: '100%',
  },
  brandArea: {
    alignItems: 'center',
    marginBottom: spacing.xl,
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
    width: 68,
    height: 68,
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
    fontSize: 32,
    lineHeight: 40,
    color: colors.charcoal,
    marginBottom: 6,
  },
  sub: {
    ...type.body,
    fontSize: 15,
    color: colors.charcoalSub,
    marginBottom: spacing.xl,
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

  forgotRow: {
    alignSelf: 'flex-end',
    paddingVertical: spacing.xs,
    marginBottom: spacing.lg,
  },
  forgotText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 13,
    color: colors.navy,
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
  errorText: {
    ...type.bodySmall,
    color: colors.error,
    flex: 1,
  },

  cta: {
    width: '100%',
    marginTop: spacing.xs,
  },

  bottomSection: {
    width: '100%',
    paddingTop: spacing.lg,
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: colors.border,
  },
  dividerText: {
    ...type.caption,
    color: colors.charcoalLight,
    textTransform: 'uppercase',
    letterSpacing: 1,
    fontSize: 11,
  },

  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  footerText: {
    ...type.bodyMedium,
    color: colors.charcoalSub,
  },
  footerLink: {
    fontFamily: 'Inter_700Bold',
    fontSize: 15,
    color: colors.navy,
  },
});

