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
import { adminApi } from '../../lib/api';
import { useToast } from '../../lib/toast-context';
import { useAdminAuth } from '../../lib/auth-context';
import { colors, type, fonts, radius } from '../../theme/tokens';

export default function ProfileSecurityScreen() {
  const router = useRouter();
  const { adminUser, refreshUser } = useAdminAuth();
  const { showToast } = useToast();

  const [activeTab, setActiveTab] = useState<'profile' | 'password'>('profile');

  // Profile Form
  const [name, setName] = useState(adminUser?.name || '');
  const [phone, setPhone] = useState(adminUser?.phone || '');
  const [savingProfile, setSavingProfile] = useState(false);
  const [nameError, setNameError] = useState('');

  // Password Form
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPass, setShowCurrentPass] = useState(false);
  const [showNewPass, setShowNewPass] = useState(false);
  const [savingPass, setSavingPass] = useState(false);

  const [currentPassError, setCurrentPassError] = useState('');
  const [newPassError, setNewPassError] = useState('');
  const [confirmPassError, setConfirmPassError] = useState('');

  const handleSaveProfile = async () => {
    if (!name.trim()) {
      setNameError('Full name is required');
      return;
    }
    setNameError('');

    try {
      setSavingProfile(true);
      await adminApi.updateProfile({
        name: name.trim(),
        phone: phone.trim() || undefined,
      });
      await refreshUser();
      showToast('Profile updated successfully', 'success');
    } catch (err: any) {
      showToast(err.message || 'Failed to update profile', 'error');
    } finally {
      setSavingProfile(false);
    }
  };

  const handleSavePassword = async () => {
    let isValid = true;
    if (!currentPassword) {
      setCurrentPassError('Current passkey is required');
      isValid = false;
    } else {
      setCurrentPassError('');
    }

    if (!newPassword || newPassword.length < 6) {
      setNewPassError('New passkey must be at least 6 characters');
      isValid = false;
    } else {
      setNewPassError('');
    }

    if (confirmPassword !== newPassword) {
      setConfirmPassError('Passwords do not match');
      isValid = false;
    } else {
      setConfirmPassError('');
    }

    if (!isValid) return;

    try {
      setSavingPass(true);
      await adminApi.changePassword(currentPassword, newPassword);
      showToast('Passkey updated successfully', 'success');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      showToast(err.message || 'Failed to change passkey', 'error');
    } finally {
      setSavingPass(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScreenHeader
        title="Security & Account"
        subtitle={adminUser?.email || 'Officer Credentials'}
        showBack
        variant="navy"
        badge="SECURITY"
      />

      {/* Tab Switcher */}
      <View style={styles.tabBar}>
        <TouchableOpacity
          style={[styles.tabBtn, activeTab === 'profile' && styles.tabBtnActive]}
          onPress={() => setActiveTab('profile')}
        >
          <Ionicons
            name="person-outline"
            size={16}
            color={activeTab === 'profile' ? colors.gold : colors.textSecondary}
          />
          <Text style={[styles.tabBtnText, activeTab === 'profile' && styles.tabBtnTextActive]}>
            Officer Profile
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabBtn, activeTab === 'password' && styles.tabBtnActive]}
          onPress={() => setActiveTab('password')}
        >
          <Ionicons
            name="key-outline"
            size={16}
            color={activeTab === 'password' ? colors.gold : colors.textSecondary}
          />
          <Text style={[styles.tabBtnText, activeTab === 'password' && styles.tabBtnTextActive]}>
            Passkey & Auth
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {activeTab === 'profile' ? (
          <>
            <Text style={styles.sectionHeading}>OFFICER PROFILE INFORMATION</Text>
            <Card style={styles.card}>
              <Input
                label="Full Name *"
                value={name}
                onChangeText={(txt) => {
                  setName(txt);
                  if (nameError) setNameError('');
                }}
                placeholder="Full Name"
                error={nameError}
              />

              <Input
                label="Official Institutional Email (Read-Only)"
                value={adminUser?.email || ''}
                editable={false}
                placeholder="email@daleel.et"
              />

              <Input
                label="Contact Phone Number"
                value={phone}
                onChangeText={setPhone}
                placeholder="+251 911 000 000"
                keyboardType="phone-pad"
              />
            </Card>

            <Text style={styles.sectionHeading}>AUTHORITY & CLEARANCE</Text>
            <Card style={styles.card}>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Assigned Role</Text>
                <Text style={styles.infoValue}>{adminUser?.adminRole || 'COORDINATOR'}</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Session Status</Text>
                <Text style={[styles.infoValue, { color: colors.success }]}>Authenticated</Text>
              </View>
            </Card>

            <View style={styles.actions}>
              <Button
                title="Update Profile"
                onPress={handleSaveProfile}
                loading={savingProfile}
                icon={<Ionicons name="save-outline" size={18} color="#FFFFFF" />}
              />
            </View>
          </>
        ) : (
          <>
            <Text style={styles.sectionHeading}>UPDATE ADMINISTRATIVE PASSKEY</Text>
            <Card style={styles.card}>
              <Input
                label="Current Passkey *"
                value={currentPassword}
                onChangeText={(txt) => {
                  setCurrentPassword(txt);
                  if (currentPassError) setCurrentPassError('');
                }}
                placeholder="Enter current passkey"
                secureTextEntry={!showCurrentPass}
                error={currentPassError}
                rightIcon={
                  <TouchableOpacity
                    onPress={() => setShowCurrentPass(!showCurrentPass)}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                  >
                    <Ionicons
                      name={showCurrentPass ? 'eye-off' : 'eye'}
                      size={20}
                      color={colors.textTertiary}
                    />
                  </TouchableOpacity>
                }
              />

              <Input
                label="New Passkey (Min 6 characters) *"
                value={newPassword}
                onChangeText={(txt) => {
                  setNewPassword(txt);
                  if (newPassError) setNewPassError('');
                }}
                placeholder="Enter new passkey"
                secureTextEntry={!showNewPass}
                error={newPassError}
                rightIcon={
                  <TouchableOpacity
                    onPress={() => setShowNewPass(!showNewPass)}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                  >
                    <Ionicons
                      name={showNewPass ? 'eye-off' : 'eye'}
                      size={20}
                      color={colors.textTertiary}
                    />
                  </TouchableOpacity>
                }
              />

              <Input
                label="Confirm New Passkey *"
                value={confirmPassword}
                onChangeText={(txt) => {
                  setConfirmPassword(txt);
                  if (confirmPassError) setConfirmPassError('');
                }}
                placeholder="Re-enter new passkey"
                secureTextEntry={!showNewPass}
                error={confirmPassError}
              />
            </Card>

            <View style={styles.actions}>
              <Button
                title="Change Administrative Passkey"
                onPress={handleSavePassword}
                loading={savingPass}
                icon={<Ionicons name="key-outline" size={18} color="#FFFFFF" />}
              />
            </View>
          </>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.surface,
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: colors.card,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  tabBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    gap: 8,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabBtnActive: {
    borderBottomColor: colors.gold,
  },
  tabBtnText: {
    ...type.caption,
    fontFamily: fonts.sansMedium,
    color: colors.textSecondary,
  },
  tabBtnTextActive: {
    fontFamily: fonts.sansBold,
    color: colors.navy,
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
    marginBottom: 16,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  infoLabel: {
    ...type.caption,
    color: colors.textSecondary,
  },
  infoValue: {
    ...type.caption,
    fontFamily: fonts.sansBold,
    color: colors.textPrimary,
  },
  actions: {
    marginTop: 8,
  },
});
