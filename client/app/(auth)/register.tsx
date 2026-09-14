import { Ionicons } from '@expo/vector-icons';
import { Link, router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  Image,
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
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button } from '../../components/Button';
import { Input } from '../../components/Input';
import { ApiError } from '../../lib/api';
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
  const { register, onboarding } = useAuth();

  // Wizard Step State (1, 2, or 3)
  const [step, setStep] = useState<1 | 2 | 3>(1);

  // Step 1: User type & Location
  const [userType, setUserType] = useState<'diaspora' | 'foreign_resident'>(
    onboarding?.userType || 'diaspora'
  );
  const [country, setCountry] = useState<string>(onboarding?.country || 'United States');
  const [isCustomCountry, setIsCustomCountry] = useState(false);
  const [language, setLanguage] = useState<'en' | 'am'>(onboarding?.language || 'en');

  // Step 2: Personal Details
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');

  // Step 3: Security & Credentials
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Auto-dismiss errors after 4 seconds
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  const handleNextStep = () => {
    setError(null);
    if (step === 1) {
      const trimmedCountry = country.trim();
      if (!trimmedCountry) {
        setError('Please select or enter your country of residence.');
        return;
      }
      setStep(2);
    } else if (step === 2) {
      const trimmedName = name.trim();
      if (!trimmedName || trimmedName.length < 2) {
        setError('Please enter your legal full name (at least 2 characters).');
        return;
      }
      setStep(3);
    }
  };

  const handlePrevStep = () => {
    setError(null);
    if (step === 3) setStep(2);
    else if (step === 2) setStep(1);
    else router.back();
  };

  const handleRegister = async () => {
    setError(null);
    const trimmedName = name.trim();
    const trimmedEmail = email.trim().toLowerCase();
    const trimmedCountry = country.trim();

    if (!trimmedEmail) {
      setError('Please enter your email address.');
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmedEmail)) {
      setError('Please enter a valid email address.');
      return;
    }

    if (!password) {
      setError('Please enter a password.');
      return;
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match. Please verify your password confirmation.');
      return;
    }

    setLoading(true);
    try {
      await register(trimmedName, trimmedEmail, password, userType, trimmedCountry, language);
      router.replace('/(auth)/verify-email');
    } catch (e: any) {
      setError(e instanceof ApiError ? e.message : e.message || 'Could not register. Try again.');
    } finally {
      setLoading(false);
    }
  };

  // Password strength score (0 to 4)
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
  const strengthColors = ['#E2E8F0', '#E53E3E', '#ED8936', '#ECC94B', '#38A169'];

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
          {/* Top Bar with Dynamic Back Button */}
          <View style={styles.navBar}>
            <TouchableOpacity
              style={styles.backBtn}
              onPress={handlePrevStep}
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            >
              <Ionicons name="arrow-back" size={20} color={colors.charcoal} />
            </TouchableOpacity>

            <View style={styles.brandRow}>
              <View style={styles.miniLogo}>
                <Image source={require('../../assets/icon.png')} style={styles.miniLogoImg} />
              </View>
              <Text style={styles.miniWordmark}>DALEEL</Text>
            </View>
            <View style={{ width: 42 }} />
          </View>

          {/* Stepper Progress Bar */}
          <View style={styles.stepperContainer}>
            <View style={styles.stepperTrack}>
              {/* Active Progress Line */}
              <View
                style={[
                  styles.stepperProgressFill,
                  { width: step === 1 ? '16%' : step === 2 ? '50%' : '100%' },
                ]}
              />
            </View>

            <View style={styles.stepNodesRow}>
              {/* Step 1 Node */}
              <TouchableOpacity
                style={[styles.stepNode, step >= 1 && styles.stepNodeActive]}
                onPress={() => setStep(1)}
                activeOpacity={0.8}
              >
                {step > 1 ? (
                  <Ionicons name="checkmark" size={14} color={colors.navy} />
                ) : (
                  <Text style={[styles.stepNodeNum, styles.stepNodeNumActive]}>1</Text>
                )}
              </TouchableOpacity>

              {/* Step 2 Node */}
              <TouchableOpacity
                style={[styles.stepNode, step >= 2 && styles.stepNodeActive]}
                onPress={() => { if (step > 2) setStep(2); }}
                activeOpacity={0.8}
              >
                {step > 2 ? (
                  <Ionicons name="checkmark" size={14} color={colors.navy} />
                ) : (
                  <Text style={[styles.stepNodeNum, step >= 2 && styles.stepNodeNumActive]}>2</Text>
                )}
              </TouchableOpacity>

              {/* Step 3 Node */}
              <View style={[styles.stepNode, step === 3 && styles.stepNodeActive]}>
                <Text style={[styles.stepNodeNum, step === 3 && styles.stepNodeNumActive]}>3</Text>
              </View>
            </View>

            <View style={styles.stepLabelsRow}>
              <Text style={[styles.stepLabelText, step === 1 && styles.stepLabelTextActive]}>
                Persona
              </Text>
              <Text style={[styles.stepLabelText, step === 2 && styles.stepLabelTextActive]}>
                Profile
              </Text>
              <Text style={[styles.stepLabelText, step === 3 && styles.stepLabelTextActive]}>
                Security
              </Text>
            </View>
          </View>

          {/* Step Header */}
          <Text style={styles.hero}>
            {step === 1 && 'Choose your persona'}
            {step === 2 && 'Personal information'}
            {step === 3 && 'Account security'}
          </Text>
          <Text style={styles.sub}>
            {step === 1 && 'Select your connection to Ethiopia and where you currently reside.'}
            {step === 2 && 'Tell us your legal name so we can personalize your digital journey.'}
            {step === 3 && 'Set up your secure login credentials and confirm your password.'}
          </Text>

          {/* ═══════════════════════════════════════════════════════════════
              STEP 1: PERSONA & LOCATION
              ═══════════════════════════════════════════════════════════════ */}
          {step === 1 && (
            <View>
              {/* Select User Persona */}
              <Text style={styles.sectionLabel}>CHOOSE YOUR PROFILE TYPE</Text>
              <View style={styles.personaContainer}>
                {/* Persona 1: Ethiopian Diaspora */}
                <TouchableOpacity
                  style={[
                    styles.personaCard,
                    userType === 'diaspora' && styles.personaCardActive,
                  ]}
                  onPress={() => setUserType('diaspora')}
                  activeOpacity={0.85}
                >
                  <View style={styles.personaHeader}>
                    <View
                      style={[
                        styles.personaIconWrap,
                        userType === 'diaspora' && styles.personaIconWrapActive,
                      ]}
                    >
                      <Ionicons
                        name="people"
                        size={22}
                        color={userType === 'diaspora' ? colors.gold : colors.charcoalSub}
                      />
                    </View>
                    <View
                      style={[
                        styles.radioCircle,
                        userType === 'diaspora' && styles.radioCircleActive,
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
                    Living abroad with Ethiopian heritage or nationality.
                  </Text>
                </TouchableOpacity>

                {/* Persona 2: Foreign Resident */}
                <TouchableOpacity
                  style={[
                    styles.personaCard,
                    userType === 'foreign_resident' && styles.personaCardActive,
                  ]}
                  onPress={() => setUserType('foreign_resident')}
                  activeOpacity={0.85}
                >
                  <View style={styles.personaHeader}>
                    <View
                      style={[
                        styles.personaIconWrap,
                        userType === 'foreign_resident' && styles.personaIconWrapActive,
                      ]}
                    >
                      <Ionicons
                        name="globe-outline"
                        size={22}
                        color={userType === 'foreign_resident' ? colors.gold : colors.charcoalSub}
                      />
                    </View>
                    <View
                      style={[
                        styles.radioCircle,
                        userType === 'foreign_resident' && styles.radioCircleActive,
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
                    Foreign Resident
                  </Text>
                  <Text style={styles.personaDesc}>
                    International visitor, investor, expat, or diplomat in Ethiopia.
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Country Selection */}
              <Text style={styles.sectionLabel}>COUNTRY OF RESIDENCE</Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.countryScroll}
              >
                {POPULAR_COUNTRIES.map((c) => {
                  const selected = country === c && !isCustomCountry;
                  return (
                    <TouchableOpacity
                      key={c}
                      style={[styles.countryChip, selected && styles.countryChipActive]}
                      onPress={() => {
                        setCountry(c);
                        setIsCustomCountry(false);
                      }}
                      activeOpacity={0.8}
                    >
                      <Text
                        style={[
                          styles.countryChipText,
                          selected && styles.countryChipTextActive,
                        ]}
                      >
                        {c}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
                <TouchableOpacity
                  style={[styles.countryChip, isCustomCountry && styles.countryChipActive]}
                  onPress={() => {
                    setIsCustomCountry(true);
                    setCountry('');
                  }}
                  activeOpacity={0.8}
                >
                  <Text
                    style={[
                      styles.countryChipText,
                      isCustomCountry && styles.countryChipTextActive,
                    ]}
                  >
                    + Other Country
                  </Text>
                </TouchableOpacity>
              </ScrollView>

              {isCustomCountry && (
                <View style={styles.customCountryWrap}>
                  <TextInput
                    style={styles.customCountryInput}
                    placeholder="Type your country name"
                    placeholderTextColor={colors.charcoalLight}
                    value={country}
                    onChangeText={setCountry}
                    autoFocus
                  />
                </View>
              )}

              {/* Preferred Language */}
              <Text style={styles.sectionLabel}>PREFERRED LANGUAGE</Text>
              <View style={styles.langToggleRow}>
                <TouchableOpacity
                  style={[styles.langBtn, language === 'en' && styles.langBtnActive]}
                  onPress={() => setLanguage('en')}
                  activeOpacity={0.8}
                >
                  <Text
                    style={[
                      styles.langBtnText,
                      language === 'en' && styles.langBtnTextActive,
                    ]}
                  >
                    English
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.langBtn, language === 'am' && styles.langBtnActive]}
                  onPress={() => setLanguage('am')}
                  activeOpacity={0.8}
                >
                  <Text
                    style={[
                      styles.langBtnText,
                      language === 'am' && styles.langBtnTextActive,
                    ]}
                  >
                    አማርኛ (Amharic)
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Error Message */}
              {!!error && (
                <View style={styles.errorRow}>
                  <Ionicons name="alert-circle" size={16} color={colors.error} />
                  <Text style={styles.errorText}>{error}</Text>
                </View>
              )}

              {/* Step 1 Next Button */}
              <Button
                label="Continue to Personal Info →"
                onPress={handleNextStep}
                variant="gold"
                style={styles.submitBtn}
              />
            </View>
          )}

          {/* ═══════════════════════════════════════════════════════════════
              STEP 2: PERSONAL INFORMATION
              ═══════════════════════════════════════════════════════════════ */}
          {step === 2 && (
            <View>
              <Text style={styles.sectionLabel}>YOUR LEGAL IDENTITY</Text>
              <View style={styles.fields}>
                <Input
                  label="Legal Full Name *"
                  placeholder="e.g. Samuel Bekele"
                  value={name}
                  onChangeText={setName}
                  autoCapitalize="words"
                  autoComplete="name"
                  autoFocus
                  returnKeyType="next"
                />

                <Input
                  label="Mobile Phone Number (Optional)"
                  placeholder="e.g. +1 202 555 0192"
                  value={phone}
                  onChangeText={setPhone}
                  keyboardType="phone-pad"
                  autoComplete="tel"
                  returnKeyType="done"
                />
              </View>

              {/* Error Message */}
              {!!error && (
                <View style={styles.errorRow}>
                  <Ionicons name="alert-circle" size={16} color={colors.error} />
                  <Text style={styles.errorText}>{error}</Text>
                </View>
              )}

              <View style={styles.navBtnRow}>
                <TouchableOpacity
                  style={styles.stepBackBtn}
                  onPress={handlePrevStep}
                  activeOpacity={0.8}
                >
                  <Ionicons name="arrow-back" size={16} color={colors.navy} style={{ marginRight: 4 }} />
                  <Text style={styles.stepBackText}>Back</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.stepNextBtn}
                  onPress={handleNextStep}
                  activeOpacity={0.8}
                >
                  <Text style={styles.stepNextText}>Continue to Security</Text>
                  <Ionicons name="arrow-forward" size={16} color={colors.navy} style={{ marginLeft: 4 }} />
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* ═══════════════════════════════════════════════════════════════
              STEP 3: SECURITY & CREDENTIALS (PASSWORD & CONFIRM PASSWORD)
              ═══════════════════════════════════════════════════════════════ */}
          {step === 3 && (
            <View>
              <Text style={styles.sectionLabel}>EMAIL & LOGIN CREDENTIALS</Text>
              <View style={styles.fields}>
                <Input
                  label="Email Address *"
                  placeholder="name@example.com"
                  value={email}
                  onChangeText={setEmail}
                  autoCapitalize="none"
                  keyboardType="email-address"
                  autoComplete="email"
                  returnKeyType="next"
                  autoFocus
                />

                {/* Password Input */}
                <View style={{ position: 'relative' }}>
                  <Input
                    label="Password (min 8 characters) *"
                    placeholder="Enter strong password"
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry={!showPassword}
                    returnKeyType="next"
                  />
                  <Pressable
                    style={styles.eyeBtn}
                    onPress={() => setShowPassword((v) => !v)}
                    hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                  >
                    <Ionicons
                      name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                      size={20}
                      color={colors.charcoalSub}
                    />
                  </Pressable>
                </View>

                {/* Password Strength Meter */}
                {password.length > 0 && (
                  <View style={styles.strengthMeterWrap}>
                    <View style={styles.strengthBarsRow}>
                      {[1, 2, 3, 4].map((index) => (
                        <View
                          key={index}
                          style={[
                            styles.strengthBar,
                            strengthScore >= index && { backgroundColor: strengthColors[strengthScore] },
                          ]}
                        />
                      ))}
                    </View>
                    <Text
                      style={[
                        styles.strengthLabel,
                        { color: strengthColors[strengthScore] || colors.charcoalLight },
                      ]}
                    >
                      {strengthLabels[strengthScore]}
                    </Text>
                  </View>
                )}

                {/* Confirm Password Input */}
                <View style={{ position: 'relative', marginTop: 4 }}>
                  <Input
                    label="Confirm Password *"
                    placeholder="Re-enter your password"
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                    secureTextEntry={!showConfirmPassword}
                    returnKeyType="done"
                    onSubmitEditing={handleRegister}
                  />
                  <Pressable
                    style={styles.eyeBtn}
                    onPress={() => setShowConfirmPassword((v) => !v)}
                    hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                  >
                    <Ionicons
                      name={showConfirmPassword ? 'eye-off-outline' : 'eye-outline'}
                      size={20}
                      color={colors.charcoalSub}
                    />
                  </Pressable>
                </View>

                {/* Live Match Verification Feedback */}
                {confirmPassword.length > 0 && (
                  <View style={styles.matchRow}>
                    <Ionicons
                      name={password === confirmPassword ? 'checkmark-circle' : 'close-circle'}
                      size={16}
                      color={password === confirmPassword ? '#16803C' : '#DC2626'}
                    />
                    <Text
                      style={[
                        styles.matchText,
                        { color: password === confirmPassword ? '#16803C' : '#DC2626' },
                      ]}
                    >
                      {password === confirmPassword
                        ? 'Passwords match perfectly'
                        : 'Passwords do not match yet'}
                    </Text>
                  </View>
                )}
              </View>

              {/* Error Message */}
              {!!error && (
                <View style={styles.errorRow}>
                  <Ionicons name="alert-circle" size={16} color={colors.error} />
                  <Text style={styles.errorText}>{error}</Text>
                </View>
              )}

              <View style={styles.navBtnRow}>
                <TouchableOpacity
                  style={styles.stepBackBtn}
                  onPress={handlePrevStep}
                  disabled={loading}
                  activeOpacity={0.8}
                >
                  <Ionicons name="arrow-back" size={16} color={colors.navy} style={{ marginRight: 4 }} />
                  <Text style={styles.stepBackText}>Back</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.stepNextBtn, loading && { opacity: 0.7 }]}
                  onPress={handleRegister}
                  disabled={loading}
                  activeOpacity={0.8}
                >
                  <Text style={styles.stepNextText}>
                    {loading ? 'Creating Account…' : 'Create My Account'}
                  </Text>
                  <Ionicons name="shield-checkmark" size={16} color={colors.navy} style={{ marginLeft: 6 }} />
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* Bottom link to Login */}
          <View style={styles.bottomSection}>
            <Text style={styles.footerPrompt}>Already have an account? </Text>
            <Link href="/(auth)/login" asChild>
              <TouchableOpacity hitSlop={{ top: 8, bottom: 8, left: 4, right: 4 }}>
                <Text style={styles.footerLink}>Sign in</Text>
              </TouchableOpacity>
            </Link>
          </View>

          <View style={{ height: 32 }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.ivory,
  },
  content: {
    flexGrow: 1,
    paddingHorizontal: 22,
    paddingTop: 32,
    paddingBottom: 48,
  },

  navBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 28,
  },
  backBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: colors.border,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  miniLogo: {
    width: 24,
    height: 24,
    borderRadius: 6,
    overflow: 'hidden',
  },
  miniLogoImg: {
    width: '100%',
    height: '100%',
  },
  miniWordmark: {
    fontFamily: fonts.bodyBold,
    fontSize: 14,
    color: colors.navy,
    letterSpacing: 1.5,
  },

  // ── Stepper Progress Indicator ───────────────────────
  stepperContainer: {
    marginTop: 4,
    marginBottom: 24,
    paddingHorizontal: 6,
  },
  stepperTrack: {
    height: 4,
    backgroundColor: colors.border,
    borderRadius: 2,
    marginBottom: -16,
    marginHorizontal: 24,
    overflow: 'hidden',
  },
  stepperProgressFill: {
    height: '100%',
    backgroundColor: colors.gold,
    borderRadius: 2,
  },
  stepNodesRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  stepNode: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepNodeActive: {
    backgroundColor: colors.gold,
    borderColor: colors.gold,
    shadowColor: colors.gold,
    shadowOpacity: 0.35,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  stepNodeNum: {
    fontFamily: fonts.bodyBold,
    fontSize: 12,
    color: colors.charcoalLight,
  },
  stepNodeNumActive: {
    color: colors.navy,
  },
  stepLabelsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 6,
  },
  stepLabelText: {
    fontFamily: fonts.bodyMedium,
    fontSize: 11,
    color: colors.charcoalLight,
    width: 60,
    textAlign: 'center',
  },
  stepLabelTextActive: {
    fontFamily: fonts.bodyBold,
    color: colors.navy,
  },

  // ── Headers ──────────────────────────────────────────
  hero: {
    fontFamily: fonts.heading,
    fontSize: 28,
    color: colors.charcoal,
    letterSpacing: -0.4,
    marginBottom: 6,
  },
  sub: {
    fontFamily: fonts.body,
    fontSize: 14,
    color: colors.charcoalSub,
    lineHeight: 20,
    marginBottom: 20,
  },

  sectionLabel: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 11,
    color: colors.charcoalSub,
    letterSpacing: 0.8,
    marginBottom: 10,
    marginTop: 4,
  },

  // Persona Selection Cards
  personaContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 18,
  },
  personaCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 14,
    borderWidth: 1.5,
    borderColor: colors.border,
  },
  personaCardActive: {
    borderColor: colors.gold,
    backgroundColor: '#FFFDF9',
  },
  personaHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  personaIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  personaIconWrapActive: {
    backgroundColor: colors.goldSoft,
  },
  radioCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioCircleActive: {
    borderColor: colors.gold,
  },
  radioDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.gold,
  },
  personaTitle: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 14,
    color: colors.charcoal,
    marginBottom: 4,
  },
  personaTitleActive: {
    color: colors.navy,
  },
  personaDesc: {
    fontFamily: fonts.body,
    fontSize: 11,
    color: colors.charcoalSub,
    lineHeight: 16,
  },

  // Country selector
  countryScroll: {
    gap: 8,
    paddingBottom: 4,
    marginBottom: 14,
  },
  countryChip: {
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: colors.border,
  },
  countryChipActive: {
    borderColor: colors.navy,
    backgroundColor: colors.navy,
  },
  countryChipText: {
    fontFamily: fonts.bodyMedium,
    fontSize: 13,
    color: colors.charcoal,
  },
  countryChipTextActive: {
    color: '#FFFFFF',
    fontFamily: fonts.bodySemiBold,
  },
  customCountryWrap: {
    marginBottom: 16,
  },
  customCountryInput: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: colors.gold,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontFamily: fonts.bodyMedium,
    fontSize: 15,
    color: colors.charcoal,
  },

  // Language toggle
  langToggleRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  langBtn: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    paddingVertical: 12,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: colors.border,
    alignItems: 'center',
  },
  langBtnActive: {
    borderColor: colors.gold,
    backgroundColor: colors.goldSoft,
  },
  langBtnText: {
    fontFamily: fonts.bodyMedium,
    fontSize: 13,
    color: colors.charcoal,
  },
  langBtnTextActive: {
    fontFamily: fonts.bodySemiBold,
    color: colors.navy,
  },

  fields: {
    gap: 4,
    marginBottom: 12,
  },
  eyeBtn: {
    position: 'absolute',
    right: 16,
    top: 19,
  },

  // Password Strength Bar
  strengthMeterWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: -4,
    marginBottom: 10,
    paddingHorizontal: 4,
  },
  strengthBarsRow: {
    flex: 1,
    flexDirection: 'row',
    gap: 4,
    height: 4,
  },
  strengthBar: {
    flex: 1,
    height: 4,
    backgroundColor: '#E2E8F0',
    borderRadius: 2,
  },
  strengthLabel: {
    fontFamily: fonts.bodyMedium,
    fontSize: 11,
    width: 65,
    textAlign: 'right',
  },

  // Password Confirmation Match Row
  matchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: -2,
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  matchText: {
    fontFamily: fonts.bodyMedium,
    fontSize: 12,
  },

  errorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.errorSoft,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FED7D7',
    marginBottom: 16,
  },
  errorText: {
    fontFamily: fonts.bodyMedium,
    fontSize: 13,
    color: colors.error,
    flex: 1,
  },

  submitBtn: {
    marginTop: 8,
    marginBottom: 20,
  },

  navBtnRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 10,
    marginBottom: 24,
  },
  stepBackBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
    borderRadius: 14,
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderWidth: 1,
    borderColor: colors.border,
  },
  stepBackText: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 15,
    color: colors.navy,
  },
  stepNextBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.gold,
    borderRadius: 14,
    paddingVertical: 15,
    paddingHorizontal: 20,
    shadowColor: colors.gold,
    shadowOpacity: 0.35,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 3,
  },
  stepNextText: {
    fontFamily: fonts.bodyBold,
    fontSize: 15,
    color: colors.navy,
    fontWeight: '700',
  },

  bottomSection: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  footerPrompt: {
    fontFamily: fonts.body,
    fontSize: 14,
    color: colors.charcoalSub,
  },
  footerLink: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 14,
    color: colors.gold,
  },
});
