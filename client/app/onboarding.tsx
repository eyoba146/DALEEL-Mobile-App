import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { SupportedLanguage } from '../lib/api';
import { useAuth } from '../lib/auth-context';
import { colors, fonts, radius, shadow, spacing } from '../theme/tokens';

type UserType = 'diaspora' | 'foreign_resident';
type Language = SupportedLanguage;

const COUNTRIES = [
  'United States',
  'United Kingdom',
  'Canada',
  'Germany',
  'Sweden',
  'United Arab Emirates',
  'Saudi Arabia',
  'South Africa',
  'Other',
];

export default function Onboarding() {
  const insets = useSafeAreaInsets();
  const { setOnboarding } = useAuth();
  const [step, setStep] = useState<0 | 1 | 2>(0);
  const [userType, setUserType] = useState<UserType | null>(null);
  const [country, setCountry] = useState<string | null>(null);
  const [language, setLanguage] = useState<Language | null>(null);

  const canContinue = step === 0 ? !!userType : step === 1 ? !!country : !!language;

  const handleContinue = async () => {
    if (step < 2) {
      setStep((s) => (s + 1) as 0 | 1 | 2);
      return;
    }
    if (!userType || !country || !language) return;
    await setOnboarding({ userType, country, language });
    router.replace('/(auth)/login');
  };

  const handleBack = () => {
    if (step > 0) {
      setStep((s) => (s - 1) as 0 | 1 | 2);
    }
  };

  return (
    <View style={styles.screen}>
      {/* ── 1. Luxury Deep Navy Editorial Header Canvas ── */}
      <View style={[styles.heroCanvas, { paddingTop: Math.max(insets.top, 20) + 10 }]}>
        <View style={styles.topNavRow}>
          {step > 0 ? (
            <TouchableOpacity style={styles.backCircleBtn} onPress={handleBack} activeOpacity={0.8}>
              <Ionicons name="arrow-back" size={18} color="#FFFFFF" />
            </TouchableOpacity>
          ) : (
            <View style={{ width: 36 }} />
          )}

          <View style={styles.brandCluster}>
            <View style={styles.compassPod}>
              <Ionicons name="compass" size={16} color={colors.gold} />
            </View>
            <Text style={styles.brandWordmark}>D A L E E L</Text>
          </View>

          <View style={{ width: 36 }} />
        </View>

        <Text style={styles.heroTitle}>Your Bridge to Ethiopia</Text>
        <Text style={styles.heroSubtitle}>
          Curated heritage journeys, verified professional services, and trusted diaspora opportunities.
        </Text>

        {/* 3-Step Progress Indicators */}
        <View style={styles.progressRow}>
          {[0, 1, 2].map((i) => (
            <View
              key={i}
              style={[
                styles.progressBar,
                i <= step && styles.progressBarActive,
                i === step && styles.progressBarCurrent,
              ]}
            />
          ))}
        </View>
      </View>

      {/* ── 2. Scrollable Selection Form Body ── */}
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={[styles.content, { paddingBottom: 120 + insets.bottom }]}
        showsVerticalScrollIndicator={false}
      >
        {step === 0 && (
          <View style={styles.stepSection}>
            <View style={styles.stepLabelBadge}>
              <Text style={styles.stepLabelText}>STEP 1 OF 3</Text>
            </View>
            <Text style={styles.sectionHeading}>Which best describes you?</Text>
            <Text style={styles.sectionSub}>
              We tailor your experience with community recommendations and concierge services.
            </Text>

            <TouchableOpacity
              style={[styles.selectCard, userType === 'diaspora' && styles.selectCardActive]}
              onPress={() => setUserType('diaspora')}
              activeOpacity={0.88}
            >
              <View style={styles.cardIconWrap}>
                <Ionicons
                  name="earth"
                  size={22}
                  color={userType === 'diaspora' ? colors.gold : colors.navy}
                />
              </View>
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={styles.cardTitle}>Ethiopian Diaspora</Text>
                <Text style={styles.cardDescription}>
                  Ethiopian heritage or born abroad, visiting family, investing, or reconnecting with home.
                </Text>
              </View>
              <View
                style={[styles.radioCircle, userType === 'diaspora' && styles.radioCircleActive]}
              >
                {userType === 'diaspora' && <View style={styles.radioDot} />}
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.selectCard, userType === 'foreign_resident' && styles.selectCardActive]}
              onPress={() => setUserType('foreign_resident')}
              activeOpacity={0.88}
            >
              <View style={styles.cardIconWrap}>
                <Ionicons
                  name="airplane"
                  size={22}
                  color={userType === 'foreign_resident' ? colors.gold : colors.navy}
                />
              </View>
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={styles.cardTitle}>Foreign Resident / Traveler</Text>
                <Text style={styles.cardDescription}>
                  Visiting Ethiopia for business, diplomacy, cultural tourism, or international projects.
                </Text>
              </View>
              <View
                style={[
                  styles.radioCircle,
                  userType === 'foreign_resident' && styles.radioCircleActive,
                ]}
              >
                {userType === 'foreign_resident' && <View style={styles.radioDot} />}
              </View>
            </TouchableOpacity>
          </View>
        )}

        {step === 1 && (
          <View style={styles.stepSection}>
            <View style={styles.stepLabelBadge}>
              <Text style={styles.stepLabelText}>STEP 2 OF 3</Text>
            </View>
            <Text style={styles.sectionHeading}>Where are you based?</Text>
            <Text style={styles.sectionSub}>
              We connect you to regional diaspora hubs, legal advisors, and currency estimates.
            </Text>

            <View style={styles.chipsContainer}>
              {COUNTRIES.map((c) => {
                const isSelected = country === c;
                return (
                  <TouchableOpacity
                    key={c}
                    style={[styles.countryChip, isSelected && styles.countryChipSelected]}
                    onPress={() => setCountry(c)}
                    activeOpacity={0.85}
                  >
                    <Text
                      style={[
                        styles.countryChipText,
                        isSelected && styles.countryChipTextSelected,
                      ]}
                    >
                      {c}
                    </Text>
                    {isSelected && (
                      <Ionicons
                        name="checkmark"
                        size={14}
                        color="#FFFFFF"
                        style={{ marginLeft: 6 }}
                      />
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        )}

        {step === 2 && (
          <View style={styles.stepSection}>
            <View style={styles.stepLabelBadge}>
              <Text style={styles.stepLabelText}>STEP 3 OF 3</Text>
            </View>
            <Text style={styles.sectionHeading}>Preferred Language</Text>
            <Text style={styles.sectionSub}>
              You can adjust this anytime in your account settings.
            </Text>

            {[
              { id: 'en', label: 'English', sub: 'Default International' },
              { id: 'am', label: 'አማርኛ (Amharic)', sub: 'National Language' },
              { id: 'om', label: 'Afaan Oromoo (Oromo)', sub: 'Regional Language' },
              { id: 'ar', label: 'العربية (Arabic)', sub: 'Middle East & Gulf' },
            ].map((lang) => {
              const isSelected = language === lang.id;
              return (
                <TouchableOpacity
                  key={lang.id}
                  style={[styles.selectCard, isSelected && styles.selectCardActive]}
                  onPress={() => setLanguage(lang.id as Language)}
                  activeOpacity={0.88}
                >
                  <View style={{ flex: 1 }}>
                    <Text style={styles.cardTitle}>{lang.label}</Text>
                    <Text style={styles.cardDescription}>{lang.sub}</Text>
                  </View>
                  <View style={[styles.radioCircle, isSelected && styles.radioCircleActive]}>
                    {isSelected && <View style={styles.radioDot} />}
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        )}
      </ScrollView>

      {/* ── 3. Sticky Bottom Continue Bar ── */}
      <View style={[styles.bottomBar, { paddingBottom: Math.max(insets.bottom, 16) + 6 }]}>
        <TouchableOpacity
          style={[styles.continueBtn, !canContinue && styles.continueBtnDisabled]}
          onPress={handleContinue}
          disabled={!canContinue}
          activeOpacity={0.88}
        >
          <Text style={styles.continueBtnText}>
            {step < 2 ? 'Continue to Next Step' : 'Get Started with DALEEL'}
          </Text>
          <Ionicons name="arrow-forward" size={16} color="#FFFFFF" style={{ marginLeft: 6 }} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#F7F8FA',
  },
  heroCanvas: {
    backgroundColor: colors.navy,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg + 4,
    borderBottomLeftRadius: radius.xl,
    borderBottomRightRadius: radius.xl,
    ...shadow.header,
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
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandCluster: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  compassPod: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(223, 183, 108, 0.18)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandWordmark: {
    fontFamily: fonts.bodyBold,
    fontSize: 13,
    letterSpacing: 2.5,
    color: '#FFFFFF',
  },
  heroTitle: {
    fontFamily: fonts.heading,
    fontSize: 24,
    color: '#FFFFFF',
    marginBottom: 6,
    lineHeight: 30,
  },
  heroSubtitle: {
    fontFamily: fonts.bodyMedium,
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.72)',
    lineHeight: 18,
    marginBottom: spacing.md,
  },
  progressRow: {
    flexDirection: 'row',
    gap: 6,
    marginTop: 4,
  },
  progressBar: {
    flex: 1,
    height: 3.5,
    borderRadius: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  progressBarActive: {
    backgroundColor: colors.gold,
  },
  progressBarCurrent: {
    backgroundColor: colors.gold,
  },
  content: {
    padding: spacing.lg,
  },
  stepSection: {
    gap: spacing.sm,
  },
  stepLabelBadge: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(7, 21, 43, 0.06)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
    marginBottom: 2,
  },
  stepLabelText: {
    fontFamily: fonts.bodyBold,
    fontSize: 10,
    letterSpacing: 0.8,
    color: colors.navy,
  },
  sectionHeading: {
    fontFamily: fonts.heading,
    fontSize: 20,
    color: colors.navy,
    lineHeight: 26,
  },
  sectionSub: {
    fontFamily: fonts.bodyMedium,
    fontSize: 13,
    color: colors.charcoalLight,
    lineHeight: 18,
    marginBottom: spacing.sm,
  },
  selectCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: spacing.md,
    borderRadius: radius.lg,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    marginBottom: spacing.sm,
    ...shadow.card,
  },
  selectCardActive: {
    borderColor: colors.navy,
    backgroundColor: '#FFFFFF',
  },
  cardIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardTitle: {
    fontFamily: fonts.bodyBold,
    fontSize: 15,
    color: colors.navy,
  },
  cardDescription: {
    fontFamily: fonts.bodyMedium,
    fontSize: 12,
    color: colors.charcoalLight,
    lineHeight: 16,
    marginTop: 2,
  },
  radioCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: '#CBD5E1',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
  radioCircleActive: {
    borderColor: colors.navy,
  },
  radioDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.navy,
  },
  chipsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: spacing.xs,
  },
  countryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: radius.pill,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
  },
  countryChipSelected: {
    backgroundColor: colors.navy,
    borderColor: colors.navy,
  },
  countryChipText: {
    fontFamily: fonts.bodyMedium,
    fontSize: 13,
    color: colors.navy,
  },
  countryChipTextSelected: {
    fontFamily: fonts.bodyBold,
    color: '#FFFFFF',
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    paddingTop: 12,
    paddingHorizontal: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    ...shadow.card,
  },
  continueBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.navy,
    paddingVertical: 14,
    borderRadius: radius.md,
    ...shadow.card,
  },
  continueBtnDisabled: {
    backgroundColor: '#CBD5E1',
  },
  continueBtnText: {
    fontFamily: fonts.bodyBold,
    fontSize: 14,
    color: '#FFFFFF',
  },
});
