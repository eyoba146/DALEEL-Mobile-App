import { router } from 'expo-router';
import React, { useState } from 'react';
import { Image, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { useAuth } from '../lib/auth-context';
import { appName, colors, radius, spacing, type } from '../theme/tokens';

import { SupportedLanguage } from '../lib/api';

type UserType = 'diaspora' | 'foreign_resident';
type Language = SupportedLanguage;

const COUNTRIES = [
  'United States', 'United Kingdom', 'Canada', 'Germany', 'Sweden',
  'United Arab Emirates', 'Saudi Arabia', 'South Africa', 'Other',
];

export default function Onboarding() {
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

  return (
    <SafeAreaView style={styles.screen} edges={['top', 'bottom']}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Text style={styles.brand}>{appName}</Text>
          <Text style={styles.tagline}>Your bridge to Ethiopia</Text>
        </View>

        <View style={styles.progressRow}>
          {[0, 1, 2].map((i) => (
            <View key={i} style={[styles.progressDot, i <= step && styles.progressDotActive]} />
          ))}
        </View>

        {step === 0 && (
          <View>
            <Text style={styles.title}>Which best describes you?</Text>
            <Text style={styles.subtitle}>This helps us personalize what you see.</Text>

            <SelectCard
              title="Ethiopian Diaspora"
              subtitle="Ethiopian-born or Ethiopian heritage, living abroad"
              selected={userType === 'diaspora'}
              onPress={() => setUserType('diaspora')}
            />
            <SelectCard
              title="Foreign Resident / International User"
              subtitle="Visiting, working, or interested in Ethiopia"
              selected={userType === 'foreign_resident'}
              onPress={() => setUserType('foreign_resident')}
            />
          </View>
        )}

        {step === 1 && (
          <View>
            <Text style={styles.title}>Where do you live?</Text>
            <Text style={styles.subtitle}>We'll surface services and events near you.</Text>
            <View style={styles.chipWrap}>
              {COUNTRIES.map((c) => (
                <Chip key={c} label={c} selected={country === c} onPress={() => setCountry(c)} />
              ))}
            </View>
          </View>
        )}

        {step === 2 && (
          <View>
            <Text style={styles.title}>Choose your language</Text>
            <Text style={styles.subtitle}>You can change this anytime in Settings.</Text>
            <SelectCard
              title="English"
              selected={language === 'en'}
              onPress={() => setLanguage('en')}
            />
            <SelectCard
              title="አማርኛ (Amharic)"
              selected={language === 'am'}
              onPress={() => setLanguage('am')}
            />
            <SelectCard
              title="Afaan Oromoo (Oromo)"
              selected={language === 'om'}
              onPress={() => setLanguage('om')}
            />
            <SelectCard
              title="العربية (Arabic)"
              selected={language === 'ar'}
              onPress={() => setLanguage('ar')}
            />
          </View>
        )}
      </ScrollView>

      <View style={styles.footer}>
        <Button
          label={step < 2 ? 'Continue' : 'Get started'}
          onPress={handleContinue}
          disabled={!canContinue}
        />
      </View>
    </SafeAreaView>
  );
}

function SelectCard({
  title,
  subtitle,
  selected,
  onPress,
}: {
  title: string;
  subtitle?: string;
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <Card
      style={[selectStyles.card, selected && selectStyles.cardSelected]}
      onTouchEnd={onPress}
    >
      <View style={selectStyles.row}>
        <View style={{ flex: 1 }}>
          <Text style={selectStyles.title}>{title}</Text>
          {!!subtitle && <Text style={selectStyles.subtitle}>{subtitle}</Text>}
        </View>
        <View style={[selectStyles.radio, selected && selectStyles.radioSelected]}>
          {selected && <View style={selectStyles.radioDot} />}
        </View>
      </View>
    </Card>
  );
}

function Chip({ label, selected, onPress }: { label: string; selected: boolean; onPress: () => void }) {
  return (
    <Text
      onPress={onPress}
      style={[chipStyles.chip, selected && chipStyles.chipSelected]}
    >
      {label}
    </Text>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg, paddingBottom: spacing.xl },
  header: { alignItems: 'center', marginBottom: spacing.lg },
  brand: { ...type.display, color: colors.green, letterSpacing: 0.5 },
  tagline: { ...type.body, color: colors.charcoalSoft, marginTop: spacing.xs },
  progressRow: { flexDirection: 'row', justifyContent: 'center', gap: spacing.xs, marginBottom: spacing.xl },
  progressDot: { width: 28, height: 4, borderRadius: 2, backgroundColor: colors.border },
  progressDotActive: { backgroundColor: colors.gold },
  title: { ...type.h1, color: colors.charcoal, marginBottom: spacing.xs },
  subtitle: { ...type.body, color: colors.charcoalSoft, marginBottom: spacing.lg },
  chipWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  footer: { padding: spacing.lg, borderTopWidth: 1, borderTopColor: colors.border },
});

const selectStyles = StyleSheet.create({
  card: { padding: spacing.md, marginBottom: spacing.sm, borderWidth: 1.5, borderColor: 'transparent' },
  cardSelected: { borderColor: colors.gold },
  row: { flexDirection: 'row', alignItems: 'center' },
  title: { ...type.h2, color: colors.charcoal },
  subtitle: { ...type.bodySmall, color: colors.charcoalSoft, marginTop: 2 },
  radio: {
    width: 24, height: 24, borderRadius: 12, borderWidth: 2, borderColor: colors.border,
    alignItems: 'center', justifyContent: 'center', marginLeft: spacing.sm,
  },
  radioSelected: { borderColor: colors.gold },
  radioDot: { width: 12, height: 12, borderRadius: 6, backgroundColor: colors.gold },
});

const chipStyles = StyleSheet.create({
  chip: {
    ...type.bodySmall,
    color: colors.charcoal,
    backgroundColor: colors.card,
    borderWidth: 1.5,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.pill,
    overflow: 'hidden',
  },
  chipSelected: {
    backgroundColor: colors.goldSoft,
    borderColor: colors.gold,
    color: colors.charcoal,
  },
});
