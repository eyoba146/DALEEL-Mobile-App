import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { ScreenHeader } from '../../components/ScreenHeader';
import { Card } from '../../components/Card';
import { Input } from '../../components/Input';
import { Button } from '../../components/Button';
import { adminApi, AdminRole } from '../../lib/api';
import { useToast } from '../../lib/toast-context';
import { useAdminAuth } from '../../lib/auth-context';
import { colors, type, fonts, radius } from '../../theme/tokens';

interface RoleOption {
  value: AdminRole;
  label: string;
  desc: string;
  icon: keyof typeof Ionicons.glyphMap;
}

const ROLES: RoleOption[] = [
  {
    value: 'SUPER_ADMIN',
    label: 'Full Platform Administrator',
    desc: 'Unrestricted governance across all administrative departments, members, and staff.',
    icon: 'shield-checkmark',
  },
  {
    value: 'SERVICE_MANAGER',
    label: 'Services Directory Lead',
    desc: 'Oversees verified diaspora service providers, emergency services, and formal inquiries.',
    icon: 'briefcase',
  },
  {
    value: 'DESTINATION_MANAGER',
    label: 'Tourism & Heritage Lead',
    desc: 'Full curation authority over historical landmarks, UNESCO heritage, and cultural pins.',
    icon: 'compass',
  },
  {
    value: 'EVENT_MANAGER',
    label: 'Summits & Events Officer',
    desc: 'Curates diaspora conferences, ticket capacity, and live gate attendee check-in desks.',
    icon: 'calendar',
  },
  {
    value: 'MARKETPLACE_MANAGER',
    label: 'Artisan Marketplace Officer',
    desc: 'Curates authentic Ethiopian crafts, master weavers, and diaspora artisan reservations.',
    icon: 'bag-handle',
  },
  {
    value: 'INVESTMENT_OFFICER',
    label: 'Diaspora Investment Officer',
    desc: 'Manages high-value project prospectuses and triages institutional investor leads.',
    icon: 'trending-up',
  },
];

export default function NewTeamMemberScreen() {
  const router = useRouter();
  const { showToast } = useToast();
  const { isSuperAdmin } = useAdminAuth();

  const [saving, setSaving] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [phone, setPhone] = useState('');
  const [adminRole, setAdminRole] = useState<AdminRole>('SERVICE_MANAGER');

  // Errors
  const [nameError, setNameError] = useState('');
  const [emailError, setEmailError] = useState('');
  const [passError, setPassError] = useState('');

  const validate = () => {
    let isValid = true;
    if (!name.trim()) {
      setNameError('Full name is required');
      isValid = false;
    } else {
      setNameError('');
    }

    if (!email.trim() || !email.includes('@')) {
      setEmailError('Valid institutional email is required');
      isValid = false;
    } else {
      setEmailError('');
    }

    if (!password || password.length < 6) {
      setPassError('Administrative passkey must be at least 6 characters');
      isValid = false;
    } else {
      setPassError('');
    }

    return isValid;
  };

  const handleSave = async () => {
    if (!isSuperAdmin) {
      showToast('Only Super Administrators can onboard staff', 'error');
      return;
    }

    if (!validate()) return;

    try {
      setSaving(true);
      await adminApi.createTeamMember({
        name: name.trim(),
        email: email.trim().toLowerCase(),
        password,
        adminRole,
        phone: phone.trim() || undefined,
      });

      showToast('Staff coordinator onboarded successfully', 'success');
      router.back();
    } catch (err: any) {
      showToast(err.message || 'Failed to onboard staff member', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScreenHeader
        title="Onboard Coordinator"
        subtitle="Staff Credentials & Access Roles"
        showBack
        variant="navy"
        badge="SECURITY"
      />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Officer Identity */}
        <Text style={styles.sectionHeading}>COORDINATOR CREDENTIALS</Text>
        <Card style={styles.card}>
          <Input
            label="Full Name *"
            value={name}
            onChangeText={(txt) => {
              setName(txt);
              if (nameError) setNameError('');
            }}
            placeholder="e.g. Selamawit Tadesse"
            error={nameError}
          />

          <Input
            label="Official Email Address *"
            value={email}
            onChangeText={(txt) => {
              setEmail(txt);
              if (emailError) setEmailError('');
            }}
            placeholder="coordinator@daleel.et"
            keyboardType="email-address"
            autoCapitalize="none"
            error={emailError}
          />

          <Input
            label="Initial Administrative Passkey *"
            value={password}
            onChangeText={(txt) => {
              setPassword(txt);
              if (passError) setPassError('');
            }}
            placeholder="Min 6 characters"
            secureTextEntry={!showPassword}
            error={passError}
            rightIcon={
              <TouchableOpacity
                onPress={() => setShowPassword(!showPassword)}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Ionicons
                  name={showPassword ? 'eye-off' : 'eye'}
                  size={20}
                  color={colors.textTertiary}
                />
              </TouchableOpacity>
            }
          />

          <Input
            label="Direct Contact Phone"
            value={phone}
            onChangeText={setPhone}
            placeholder="+251 911 000 000"
            keyboardType="phone-pad"
          />
        </Card>

        {/* Role & Permissions Assignment */}
        <Text style={styles.sectionHeading}>DEPARTMENTAL ROLE & CLEARANCE</Text>
        <View style={styles.rolesList}>
          {ROLES.map((r) => {
            const selected = adminRole === r.value;
            return (
              <TouchableOpacity
                key={r.value}
                style={[styles.roleCard, selected && styles.roleCardSelected]}
                onPress={() => setAdminRole(r.value)}
                activeOpacity={0.7}
              >
                <View style={styles.roleCardHeader}>
                  <View
                    style={[
                      styles.roleIconWrap,
                      selected && { backgroundColor: 'rgba(223, 183, 108, 0.2)' },
                    ]}
                  >
                    <Ionicons
                      name={r.icon}
                      size={20}
                      color={selected ? colors.gold : colors.navy}
                    />
                  </View>
                  <View style={styles.roleTextWrap}>
                    <Text style={[styles.roleTitle, selected && styles.roleTitleSelected]}>
                      {r.label}
                    </Text>
                    <Text style={styles.roleDesc}>{r.desc}</Text>
                  </View>
                  <View style={[styles.radioCircle, selected && styles.radioCircleSelected]}>
                    {selected && <View style={styles.radioInner} />}
                  </View>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Action Buttons */}
        <View style={styles.actions}>
          <Button
            title="Create Staff Account"
            onPress={handleSave}
            loading={saving}
            icon={<Ionicons name="person-add-outline" size={18} color="#FFFFFF" />}
          />

          <Button
            title="Cancel"
            variant="ghost"
            onPress={() => router.back()}
          />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.surface,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  sectionHeading: {
    ...type.tiny,
    fontFamily: fonts.sansBold,
    color: colors.textTertiary,
    letterSpacing: 1,
    marginBottom: 8,
    marginLeft: 4,
    marginTop: 12,
  },
  card: {
    padding: 16,
    marginBottom: 12,
  },
  rolesList: {
    gap: 10,
    marginBottom: 16,
  },
  roleCard: {
    backgroundColor: colors.card,
    borderRadius: radius.md,
    padding: 14,
    borderWidth: 1.5,
    borderColor: colors.border,
  },
  roleCardSelected: {
    backgroundColor: colors.navy,
    borderColor: colors.gold,
  },
  roleCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  roleIconWrap: {
    width: 38,
    height: 38,
    borderRadius: radius.sm,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  roleTextWrap: {
    flex: 1,
  },
  roleTitle: {
    ...type.body,
    fontFamily: fonts.sansSemiBold,
    color: colors.textPrimary,
  },
  roleTitleSelected: {
    color: '#FFFFFF',
  },
  roleDesc: {
    ...type.tiny,
    color: colors.textSecondary,
    marginTop: 2,
  },
  radioCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioCircleSelected: {
    borderColor: colors.gold,
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.gold,
  },
  actions: {
    gap: 10,
    marginTop: 10,
  },
});
