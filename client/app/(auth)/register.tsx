import { Feather, Ionicons } from '@expo/vector-icons';
import { Link, router } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Easing,
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
import { ApiError, SupportedLanguage } from '../../lib/api';
import { useAuth } from '../../lib/auth-context';
import { colors, fonts, radius, spacing } from '../../theme/tokens';

const POPULAR_COUNTRIES = [
  'United States',
  'United Kingdom',
  'Canada',
  'Germany',
  'Sweden',
  'United Arab Emirates',
  'Saudi Arabia',
  'South Africa',
  'Ethiopia',
];

export default function Register() {
  const insets = useSafeAreaInsets();
  const { register, onboarding } = useAuth();

  // Multi-step Wizard: 1 (Profile Type) -> 2 (Personal Info) -> 3 (Security & Password)
  const [step, setStep] = useState<1 | 2 | 3>(1);

  // Smooth animated progress bar for steps (1 -> 2 -> 3)
  const progressAnim = useRef(new Animated.Value(step === 1 ? 0.333 : step === 2 ? 0.666 : 1)).current;

  useEffect(() => {
    const target = step === 1 ? 0.333 : step === 2 ? 0.666 : 1;
    Animated.timing(progressAnim, {
      toValue: target,
      duration: 450,
      easing: Easing.bezier(0.25, 0.1, 0.25, 1),
      useNativeDriver: false,
    }).start();
  }, [step]);

  const progressWidth = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  // Step 1: Profile Type & Location
  const [userType, setUserType] = useState<'diaspora' | 'foreign_resident'>(
    onboarding?.userType || 'diaspora'
  );
  const [country, setCountry] = useState<string>(onboarding?.country || 'United States');
  const [language] = useState<SupportedLanguage>(onboarding?.language || 'en');

  // Step 2: Personal Details
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');

  // Step 3: Security & Credentials
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Status
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Auto-dismiss errors after 5 seconds
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  // Password strength calculation
  const getPasswordStrength = () => {
    if (!password) return 0;
    let score = 0;
    if (password.length >= 8) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[^A-Za-z0-9]/.test(password)) score++;
    return score;
  };

  const strengthScore = getPasswordStrength();
  const strengthLabels = ['Too Weak', 'Weak', 'Fair', 'Good', 'Strong'];
  const strengthColors = ['#E2E8F0', '#EF4444', '#F59E0B', '#DFB76C', '#10B981'];

  // Smooth animated strength meter
  const strengthAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(strengthAnim, {
      toValue: strengthScore / 4,
      duration: 280,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();
  }, [strengthScore]);

  const strengthWidth = strengthAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  // Field-level validation tracking
  const [touchedCountry, setTouchedCountry] = useState(false);
  const [submittedStep1, setSubmittedStep1] = useState(false);

  const [touchedName, setTouchedName] = useState(false);
  const [touchedEmail, setTouchedEmail] = useState(false);
  const [touchedPhone, setTouchedPhone] = useState(false);
  const [submittedStep2, setSubmittedStep2] = useState(false);

  const [touchedPassword, setTouchedPassword] = useState(false);
  const [touchedConfirmPassword, setTouchedConfirmPassword] = useState(false);
  const [submittedStep3, setSubmittedStep3] = useState(false);

  // Live field validation computations
  const countryTrimmed = country.trim();
  const countryError = (touchedCountry || submittedStep1)
    ? !countryTrimmed
      ? 'Please select or enter your country of residence.'
      : countryTrimmed.length < 2
      ? 'Country name must be at least 2 characters.'
      : null
    : null;

  const nameTrimmed = name.trim();
  const nameError = (touchedName || submittedStep2)
    ? !nameTrimmed
      ? 'Full legal name is required.'
      : nameTrimmed.length < 2
      ? 'Full name must contain at least 2 characters.'
      : null
    : null;

  const emailTrimmed = email.trim();
  const isEmailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailTrimmed);
  const emailError = (touchedEmail || submittedStep2)
    ? !emailTrimmed
      ? 'Email address is required.'
      : !isEmailValid
      ? 'Please enter a valid email address (e.g. name@domain.com).'
      : null
    : null;

  const phoneTrimmed = phone.trim();
  const phoneError = (touchedPhone || submittedStep2) && phoneTrimmed
    ? !/^[+]?[0-9\s\-().]{7,20}$/.test(phoneTrimmed)
      ? 'Please enter a valid phone number (at least 7 digits).'
      : null
    : null;

  const passwordError = (touchedPassword || submittedStep3)
    ? !password
      ? 'Password is required.'
      : password.length < 8
      ? 'Password must contain at least 8 characters.'
      : null
    : null;

  const confirmPasswordError = (touchedConfirmPassword || submittedStep3)
    ? !confirmPassword
      ? 'Please re-enter your password to confirm.'
      : password !== confirmPassword
      ? 'Passwords do not match.'
      : null
    : null;

  // Step 1 Validation -> Proceed to Step 2
  const handleStep1Next = () => {
    setSubmittedStep1(true);
    setError(null);
    if (!countryTrimmed || countryTrimmed.length < 2) {
      setTouchedCountry(true);
      return;
    }
    setStep(2);
  };

  // Step 2 Validation -> Proceed to Step 3
  const handleStep2Next = () => {
    setSubmittedStep2(true);
    setError(null);
    if (!nameTrimmed || nameTrimmed.length < 2) {
      setTouchedName(true);
      return;
    }
    if (!emailTrimmed || !isEmailValid) {
      setTouchedEmail(true);
      return;
    }
    if (phoneTrimmed && !/^[+]?[0-9\s\-().]{7,20}$/.test(phoneTrimmed)) {
      setTouchedPhone(true);
      return;
    }
    setStep(3);
  };

  // Step 3 Final Submission
  const handleFinalSubmit = async () => {
    setSubmittedStep3(true);
    setError(null);
    if (!password || password.length < 8) {
      setTouchedPassword(true);
      return;
    }
    if (!confirmPassword || password !== confirmPassword) {
      setTouchedConfirmPassword(true);
      return;
    }

    setLoading(true);
    try {
      await register(
        nameTrimmed,
        emailTrimmed.toLowerCase(),
        password,
        userType,
        countryTrimmed,
        language
      );
      router.replace('/(tabs)');
    } catch (e: any) {
      setError(
        e instanceof ApiError
          ? e.message
          : e?.message || 'Could not complete registration. Check your connection.'
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
          <View style={[styles.heroCanvas, { paddingTop: Math.max(insets.top, 24) + 12 }]}>
            {/* Top Navigation Row */}
            <View style={styles.topNavRow}>
              <TouchableOpacity
                style={styles.backCircleBtn}
                onPress={() => {
                  if (step === 3) setStep(2);
                  else if (step === 2) setStep(1);
                  else router.back();
                }}
                hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
              >
                <Ionicons name="arrow-back" size={18} color="#FFFFFF" />
              </TouchableOpacity>

              <View style={styles.brandCluster}>
                <View style={styles.compassPod}>
                  <Ionicons name="compass" size={18} color={colors.gold} />
                </View>
                <Text style={styles.brandWordmark}>D A L E E L</Text>
              </View>

              <View style={{ width: 36 }} />
            </View>

            {/* Stepper Progress Indicator (Flush to Header) */}
            <View style={styles.stepIndicatorContainer}>
              <View style={styles.stepTrack}>
                <Animated.View
                  style={[
                    styles.stepFill,
                    { width: progressWidth },
                  ]}
                />
              </View>
              <View style={styles.stepLabelsRow}>
                <Text style={[styles.stepLabel, step >= 1 && styles.stepLabelActive]}>
                  1. Profile Type
                </Text>
                <Text style={[styles.stepLabel, step >= 2 && styles.stepLabelActive]}>
                  2. Personal Info
                </Text>
                <Text style={[styles.stepLabel, step >= 3 && styles.stepLabelActive]}>
                  3. Password
                </Text>
              </View>
            </View>

            {/* Dynamic Step Title */}
            <Text style={styles.heroTitle}>
              {step === 1 && 'Choose Profile Type'}
              {step === 2 && 'Personal Information'}
              {step === 3 && 'Create Password'}
            </Text>
            <Text style={styles.heroSubtitle}>
              {step === 1 && 'Select your connection to Ethiopia and specify your current residence.'}
              {step === 2 && 'Tell us your legal name and contact email for your concierge membership.'}
              {step === 3 && 'Set up a secure passkey to protect your diaspora account.'}
            </Text>
          </View>

          {/* ── 2. Seamless Form Canvas (NO CARD EFFECT, FLUSH TO BACKGROUND) ── */}
          <View style={[styles.formContainer, { paddingBottom: Math.max(insets.bottom, 20) + 28 }]}>
            {/* Error Notification */}
            {!!error && (
              <View style={styles.errorBanner}>
                <Ionicons name="alert-circle" size={18} color={colors.error} />
                <Text style={styles.errorText}>{error}</Text>
              </View>
            )}

            {/* ═══════════════════════════════════════════════════════════
                STEP 1: PROFILE TYPE & COUNTRY OF RESIDENCE
                ═══════════════════════════════════════════════════════════ */}
            {step === 1 && (
              <View>
                <Text style={styles.sectionHeading}>SELECT YOUR CONNECTION</Text>

                {/* Persona Option 1: Ethiopian Diaspora */}
                <TouchableOpacity
                  style={[
                    styles.personaOption,
                    userType === 'diaspora' && styles.personaOptionActive,
                  ]}
                  onPress={() => setUserType('diaspora')}
                  activeOpacity={0.88}
                >
                  <View style={styles.personaTopRow}>
                    <View
                      style={[
                        styles.personaIconCircle,
                        userType === 'diaspora' && styles.personaIconCircleActive,
                      ]}
                    >
                      <Ionicons
                        name="earth"
                        size={20}
                        color={userType === 'diaspora' ? colors.gold : colors.charcoalSub}
                      />
                    </View>
                    <View
                      style={[
                        styles.radioIndicator,
                        userType === 'diaspora' && styles.radioIndicatorActive,
                      ]}
                    >
                      {userType === 'diaspora' && <View style={styles.radioDot} />}
                    </View>
                  </View>
                  <Text
                    style={[
                      styles.personaTitle,
                      userType === 'diaspora' && styles.personaTitleActive,
                    ]}
                  >
                    Ethiopian Diaspora
                  </Text>
                  <Text style={styles.personaDesc}>
                    Living abroad with Ethiopian heritage or citizenship. Unlocks cultural heritage archives, diaspora venture prospectuses, and relocation directories.
                  </Text>
                </TouchableOpacity>

                {/* Persona Option 2: Foreign Resident */}
                <TouchableOpacity
                  style={[
                    styles.personaOption,
                    userType === 'foreign_resident' && styles.personaOptionActive,
                  ]}
                  onPress={() => setUserType('foreign_resident')}
                  activeOpacity={0.88}
                >
                  <View style={styles.personaTopRow}>
                    <View
                      style={[
                        styles.personaIconCircle,
                        userType === 'foreign_resident' && styles.personaIconCircleActive,
                      ]}
                    >
                      <Ionicons
                        name="globe-outline"
                        size={20}
                        color={userType === 'foreign_resident' ? colors.gold : colors.charcoalSub}
                      />
                    </View>
                    <View
                      style={[
                        styles.radioIndicator,
                        userType === 'foreign_resident' && styles.radioIndicatorActive,
                      ]}
                    >
                      {userType === 'foreign_resident' && <View style={styles.radioDot} />}
                    </View>
                  </View>
                  <Text
                    style={[
                      styles.personaTitle,
                      userType === 'foreign_resident' && styles.personaTitleActive,
                    ]}
                  >
                    Foreign Resident & Visitor
                  </Text>
                  <Text style={styles.personaDesc}>
                    International diplomat, expat, investor, or traveler residing in or exploring Ethiopia. Access verified English-speaking services and curated landmarks.
                  </Text>
                </TouchableOpacity>

                {/* Country of Residence */}
                <View style={[styles.inputGroup, { marginTop: spacing.md }]}>
                  <Text style={styles.inputLabel}>COUNTRY OF RESIDENCE *</Text>
                  <View style={[styles.inputBox, !!countryError && styles.inputBoxError]}>
                    <Ionicons
                      name="location-outline"
                      size={18}
                      color={countryError ? colors.error : colors.charcoalSub}
                      style={styles.inputIcon}
                    />
                    <TextInput
                      style={styles.textInput}
                      value={country}
                      onChangeText={(val) => {
                        setCountry(val);
                        if (error) setError(null);
                      }}
                      onBlur={() => setTouchedCountry(true)}
                      placeholder="e.g. United States, United Kingdom"
                      placeholderTextColor={colors.charcoalLight}
                      returnKeyType="done"
                    />
                  </View>
                  {!!countryError && (
                    <View style={styles.fieldErrorRow}>
                      <Ionicons name="alert-circle" size={13} color={colors.error} />
                      <Text style={styles.fieldErrorText}>{countryError}</Text>
                    </View>
                  )}

                  {/* Horizontal Country Quick Pills */}
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.countryChipsRow}
                  >
                    {POPULAR_COUNTRIES.map((c) => (
                      <TouchableOpacity
                        key={c}
                        style={[
                          styles.countryChip,
                          country.toLowerCase() === c.toLowerCase() && styles.countryChipActive,
                        ]}
                        onPress={() => {
                          setCountry(c);
                          if (error) setError(null);
                        }}
                        activeOpacity={0.8}
                      >
                        <Text
                          style={[
                            styles.countryChipText,
                            country.toLowerCase() === c.toLowerCase() && styles.countryChipTextActive,
                          ]}
                        >
                          {c}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>

                {/* Step 1 Continue CTA */}
                <Button
                  label="Continue to Personal Info"
                  onPress={handleStep1Next}
                  variant="primary"
                  icon="arrow-forward"
                  iconPosition="right"
                  style={styles.ctaButton}
                />
              </View>
            )}

            {/* ═══════════════════════════════════════════════════════════
                STEP 2: PERSONAL INFORMATION
                ═══════════════════════════════════════════════════════════ */}
            {step === 2 && (
              <View>
                {/* Full Legal Name */}
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>FULL LEGAL NAME *</Text>
                  <View style={[styles.inputBox, !!nameError && styles.inputBoxError]}>
                    <Ionicons
                      name="person-outline"
                      size={18}
                      color={nameError ? colors.error : colors.charcoalSub}
                      style={styles.inputIcon}
                    />
                    <TextInput
                      style={styles.textInput}
                      value={name}
                      onChangeText={(val) => {
                        setName(val);
                        if (error) setError(null);
                      }}
                      onBlur={() => setTouchedName(true)}
                      placeholder="e.g. Almaz Bekele"
                      placeholderTextColor={colors.charcoalLight}
                      autoCapitalize="words"
                      autoComplete="name"
                      returnKeyType="next"
                    />
                  </View>
                  {!!nameError && (
                    <View style={styles.fieldErrorRow}>
                      <Ionicons name="alert-circle" size={13} color={colors.error} />
                      <Text style={styles.fieldErrorText}>{nameError}</Text>
                    </View>
                  )}
                </View>

                {/* Email Address */}
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
                      placeholder="almaz@example.com"
                      placeholderTextColor={colors.charcoalLight}
                      autoCapitalize="none"
                      keyboardType="email-address"
                      autoComplete="email"
                      returnKeyType="next"
                    />
                  </View>
                  {!!emailError && (
                    <View style={styles.fieldErrorRow}>
                      <Ionicons name="alert-circle" size={13} color={colors.error} />
                      <Text style={styles.fieldErrorText}>{emailError}</Text>
                    </View>
                  )}
                </View>

                {/* Contact Phone (Optional) */}
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>CONTACT PHONE (OPTIONAL)</Text>
                  <View style={[styles.inputBox, !!phoneError && styles.inputBoxError]}>
                    <Ionicons
                      name="call-outline"
                      size={18}
                      color={phoneError ? colors.error : colors.charcoalSub}
                      style={styles.inputIcon}
                    />
                    <TextInput
                      style={styles.textInput}
                      value={phone}
                      onChangeText={(val) => {
                        setPhone(val);
                        if (error) setError(null);
                      }}
                      onBlur={() => setTouchedPhone(true)}
                      placeholder="+251 9... or +1 202..."
                      placeholderTextColor={colors.charcoalLight}
                      keyboardType="phone-pad"
                      autoComplete="tel"
                      returnKeyType="done"
                    />
                  </View>
                  {!!phoneError && (
                    <View style={styles.fieldErrorRow}>
                      <Ionicons name="alert-circle" size={13} color={colors.error} />
                      <Text style={styles.fieldErrorText}>{phoneError}</Text>
                    </View>
                  )}
                </View>

                {/* Step 2 Actions */}
                <Button
                  label="Continue to Security"
                  onPress={handleStep2Next}
                  variant="primary"
                  icon="arrow-forward"
                  iconPosition="right"
                  style={styles.ctaButton}
                />

                <TouchableOpacity
                  style={styles.backStepButton}
                  onPress={() => setStep(1)}
                  activeOpacity={0.8}
                >
                  <Ionicons name="arrow-back" size={16} color={colors.navy} />
                  <Text style={styles.backStepText}>Back to Profile Type</Text>
                </TouchableOpacity>
              </View>
            )}

            {/* ═══════════════════════════════════════════════════════════
                STEP 3: PASSWORD & SECURITY
                ═══════════════════════════════════════════════════════════ */}
            {step === 3 && (
              <View>
                {/* Password Input */}
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>CREATE PASSWORD (MIN 8 CHARACTERS) *</Text>
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
                      placeholder="At least 8 characters"
                      placeholderTextColor={colors.charcoalLight}
                      secureTextEntry={!showPassword}
                      autoComplete="new-password"
                      returnKeyType="next"
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

                  {/* Password Strength Meter */}
                  {password.length > 0 && (
                    <View style={styles.strengthRow}>
                      <View style={styles.strengthTrack}>
                        <Animated.View
                          style={[
                            styles.strengthFill,
                            {
                              width: strengthWidth,
                              backgroundColor: strengthColors[strengthScore],
                            },
                          ]}
                        />
                      </View>
                      <Text style={[styles.strengthText, { color: strengthColors[strengthScore] }]}>
                        {strengthLabels[strengthScore]}
                      </Text>
                    </View>
                  )}
                </View>

                {/* Confirm Password Input */}
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>CONFIRM PASSWORD *</Text>
                  <View style={[styles.inputBox, !!confirmPasswordError && styles.inputBoxError]}>
                    <Ionicons
                      name="shield-checkmark-outline"
                      size={18}
                      color={confirmPasswordError ? colors.error : colors.charcoalSub}
                      style={styles.inputIcon}
                    />
                    <TextInput
                      style={styles.textInput}
                      value={confirmPassword}
                      onChangeText={(val) => {
                        setConfirmPassword(val);
                        if (error) setError(null);
                      }}
                      onBlur={() => setTouchedConfirmPassword(true)}
                      placeholder="Re-enter your password"
                      placeholderTextColor={colors.charcoalLight}
                      secureTextEntry={!showConfirmPassword}
                      autoComplete="new-password"
                      returnKeyType="done"
                    />
                    <Pressable
                      onPress={() => setShowConfirmPassword((v) => !v)}
                      hitSlop={12}
                      style={styles.eyeBtn}
                    >
                      <Feather
                        name={showConfirmPassword ? 'eye-off' : 'eye'}
                        size={18}
                        color={confirmPasswordError ? colors.error : colors.charcoalSub}
                      />
                    </Pressable>
                  </View>
                  {!!confirmPasswordError && (
                    <View style={styles.fieldErrorRow}>
                      <Ionicons name="alert-circle" size={13} color={colors.error} />
                      <Text style={styles.fieldErrorText}>{confirmPasswordError}</Text>
                    </View>
                  )}
                </View>

                {/* Summary Info Pill */}
                <View style={styles.summaryBadge}>
                  <Ionicons name="information-circle-outline" size={16} color={colors.navy} />
                  <Text style={styles.summaryText}>
                    Registering as{' '}
                    <Text style={{ fontWeight: '700' }}>
                      {userType === 'diaspora' ? 'Ethiopian Diaspora' : 'Foreign Resident'}
                    </Text>{' '}
                    residing in <Text style={{ fontWeight: '700' }}>{country}</Text>.
                  </Text>
                </View>

                {/* Step 3 Final CTA */}
                <Button
                  label={loading ? 'Creating Membership...' : 'Complete Registration'}
                  onPress={handleFinalSubmit}
                  loading={loading}
                  variant="primary"
                  icon="checkmark-circle"
                  iconPosition="right"
                  style={styles.ctaButton}
                />

                <TouchableOpacity
                  style={styles.backStepButton}
                  onPress={() => setStep(2)}
                  activeOpacity={0.8}
                >
                  <Ionicons name="arrow-back" size={16} color={colors.navy} />
                  <Text style={styles.backStepText}>Back to Personal Info</Text>
                </TouchableOpacity>

                <Text style={styles.termsNote}>
                  By creating an account, you agree to DALEEL's Terms of Service and Privacy Policy.
                </Text>
              </View>
            )}

            {/* Bottom Sign In Prompt */}
            <View style={styles.footerRow}>
              <Text style={styles.footerText}>Already have an account?</Text>
              <Link href="/(auth)/login" asChild>
                <TouchableOpacity hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                  <Text style={styles.loginLink}> Sign In</Text>
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
    paddingBottom: spacing.xl,
  },
  topNavRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  backCircleBtn: {
    width: 36,
    height: 36,
    borderRadius: radius.pill,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandCluster: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  compassPod: {
    width: 30,
    height: 30,
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

  // Step Progress Bar in Header
  stepIndicatorContainer: {
    marginBottom: spacing.md,
  },
  stepTrack: {
    width: '100%',
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 2,
    overflow: 'hidden',
    marginBottom: 8,
  },
  stepFill: {
    height: '100%',
    backgroundColor: colors.gold,
    borderRadius: 2,
  },
  stepLabelsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  stepLabel: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.45)',
  },
  stepLabelActive: {
    color: colors.gold,
    fontFamily: fonts.bodyBold,
  },

  heroTitle: {
    fontFamily: fonts.heading,
    fontSize: 30,
    lineHeight: 36,
    color: '#FFFFFF',
    marginBottom: 6,
  },
  heroSubtitle: {
    fontFamily: fonts.body,
    fontSize: 14,
    lineHeight: 21,
    color: '#B2C0D2',
    maxWidth: 340,
  },

  // Form Container (Seamless on Canvas, No Card Effect)
  formContainer: {
    backgroundColor: colors.background,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xl,
    flex: 1,
  },

  sectionHeading: {
    fontFamily: fonts.bodyBold,
    fontSize: 11,
    letterSpacing: 0.8,
    color: colors.navy,
    marginBottom: 12,
    textTransform: 'uppercase',
  },

  // Persona Options (Flush to Background)
  personaOption: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: radius.lg,
    padding: 16,
    marginBottom: 12,
  },
  personaOptionActive: {
    borderColor: colors.navy,
    backgroundColor: '#FFFFFF',
  },
  personaTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  personaIconCircle: {
    width: 36,
    height: 36,
    borderRadius: radius.md,
    backgroundColor: '#F8FAFC',
    alignItems: 'center',
    justifyContent: 'center',
  },
  personaIconCircleActive: {
    backgroundColor: colors.navy,
  },
  radioIndicator: {
    width: 20,
    height: 20,
    borderRadius: radius.pill,
    borderWidth: 2,
    borderColor: colors.borderStrong,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioIndicatorActive: {
    borderColor: colors.navy,
  },
  radioDot: {
    width: 10,
    height: 10,
    borderRadius: radius.pill,
    backgroundColor: colors.navy,
  },
  personaTitle: {
    fontFamily: fonts.bodyBold,
    fontSize: 15,
    color: colors.navy,
    marginBottom: 4,
  },
  personaTitleActive: {
    color: colors.navy,
  },
  personaDesc: {
    fontFamily: fonts.body,
    fontSize: 13,
    lineHeight: 19,
    color: colors.textSecondary,
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
  inputBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
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

  // Strength Meter
  strengthRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 6,
  },
  strengthTrack: {
    flex: 1,
    height: 4,
    backgroundColor: '#EAEFF6',
    borderRadius: 2,
    overflow: 'hidden',
  },
  strengthFill: {
    height: '100%',
    borderRadius: 2,
  },
  strengthText: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 11,
  },

  // Country Chips
  countryChipsRow: {
    gap: 6,
    paddingVertical: 10,
  },
  countryChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: radius.pill,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: colors.border,
  },
  countryChipActive: {
    backgroundColor: colors.navy,
    borderColor: colors.navy,
  },
  countryChipText: {
    fontFamily: fonts.bodyMedium,
    fontSize: 12,
    color: colors.textSecondary,
  },
  countryChipTextActive: {
    color: '#FFFFFF',
    fontFamily: fonts.bodyBold,
  },

  // Summary Badge
  summaryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(7, 21, 43, 0.04)',
    borderWidth: 1,
    borderColor: 'rgba(7, 21, 43, 0.08)',
    borderRadius: radius.md,
    padding: 12,
    marginBottom: spacing.md,
  },
  summaryText: {
    fontFamily: fonts.body,
    fontSize: 12.5,
    color: colors.navy,
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
  backStepButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    height: 44,
    marginTop: 8,
  },
  backStepText: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 13,
    color: colors.navy,
  },
  termsNote: {
    fontFamily: fonts.body,
    fontSize: 11.5,
    color: colors.charcoalLight,
    textAlign: 'center',
    lineHeight: 16,
    marginTop: spacing.md,
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
  loginLink: {
    fontFamily: fonts.bodyBold,
    fontSize: 14,
    color: colors.navy,
  },
});
