import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  Image,
  Modal,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../lib/auth-context';
import { NotificationPreferences, notificationsApi, resolveMediaUrl, SupportedLanguage } from '../../lib/api';
import { useLanguage } from '../../lib/language-context';
import { getCurrentUserLocation } from '../../lib/location';
import ScreenHeader from '../../components/ScreenHeader';
import { colors, fonts, radius, shadow, spacing } from '../../theme/tokens';

export default function ProfileScreen() {
  const router = useRouter();
  const { user, token, updateUser, uploadAvatar, changePassword, logout } = useAuth();
  const { language, setLanguage, languages, t } = useLanguage();
  const [localAvatarUri, setLocalAvatarUri] = useState<string | null>(null);
  const avatarUri = localAvatarUri || resolveMediaUrl(user?.avatarUrl);

  // Toast state
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [toastType, setToastType] = useState<'success' | 'error'>('success');
  const toastTimeoutRef = useRef<any>(null);
  const toastAnim = useRef(new Animated.Value(-100)).current;

  // Avatar upload loading state
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);

  // Individual Field Editor state
  type EditableField =
    | 'firstName'
    | 'lastName'
    | 'email'
    | 'phone'
    | 'country'
    | 'persona'
    | 'password'
    | 'savedAddress'
    | null;

  const [activeField, setActiveField] = useState<EditableField>(null);
  const [fieldValue, setFieldValue] = useState('');
  const [personaChoice, setPersonaChoice] = useState<'diaspora' | 'foreign_resident'>('diaspora');
  const [isSavingField, setIsSavingField] = useState(false);
  const [isDetectingProfileLocation, setIsDetectingProfileLocation] = useState(false);
  const [profileLocationCoords, setProfileLocationCoords] = useState<{ lat?: number; lon?: number }>({
    lat: user?.savedLatitude ?? undefined,
    lon: user?.savedLongitude ?? undefined,
  });

  // Password editing states
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Sign out confirmation modal state
  const [isSignOutModalVisible, setIsSignOutModalVisible] = useState(false);

  // Notification Preferences states
  const [notifPrefs, setNotifPrefs] = useState<NotificationPreferences>({
    orders: true,
    events: true,
    investments: true,
    announcements: true,
  });
  const [isLoadingPrefs, setIsLoadingPrefs] = useState(false);

  useEffect(() => {
    let isMounted = true;
    async function loadPreferences() {
      if (!token) return;
      try {
        setIsLoadingPrefs(true);
        const res = await notificationsApi.getPreferences(token);
        if (isMounted && res) {
          setNotifPrefs(res);
        }
      } catch {
        // Keep defaults on failure
      } finally {
        if (isMounted) setIsLoadingPrefs(false);
      }
    }
    loadPreferences();
    return () => {
      isMounted = false;
    };
  }, [token]);

  const handleTogglePref = async (key: keyof NotificationPreferences) => {
    const updated = {
      ...notifPrefs,
      [key]: !notifPrefs[key],
    };
    setNotifPrefs(updated);
    if (!token) return;
    try {
      await notificationsApi.updatePreferences(updated, token);
      showToast('Notification preference saved', 'success');
    } catch {
      setNotifPrefs(notifPrefs);
      showToast('Could not save preference', 'error');
    }
  };

  const handleSelectLanguage = async (newLang: SupportedLanguage) => {
    if (newLang === language) return;
    await setLanguage(newLang);
    showToast(t('profile.languageChanged', 'Language updated successfully'), 'success');
  };

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
    setToastMessage(message);
    setToastType(type);

    Animated.spring(toastAnim, {
      toValue: 0,
      useNativeDriver: true,
      tension: 65,
      friction: 9,
    }).start();

    toastTimeoutRef.current = setTimeout(() => {
      Animated.timing(toastAnim, {
        toValue: -100,
        duration: 250,
        useNativeDriver: true,
      }).start(() => setToastMessage(null));
    }, 4000);
  };

  const handlePickAvatar = async () => {
    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        showToast('Please allow photo library access to change your avatar', 'error');
        return;
      }

      // quality: 0.5 keeps payload lightweight (<1MB), fast to encode, fast to upload
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.5,
        base64: true,
      });

      if (result.canceled || !result.assets || result.assets.length === 0) {
        return;
      }

      const asset = result.assets[0];
      const localUri = asset.uri;

      // 1. Immediately update UI with local chosen photo so user sees it right away!
      setLocalAvatarUri(localUri);
      setIsUploadingAvatar(true);

      // 2. Persist locally first so it never gets lost even if offline
      await updateUser({ avatarUrl: localUri });

      // 3. If base64 exists, attempt background server synchronization
      if (asset.base64) {
        try {
          const serverUrl = await uploadAvatar(asset.base64);
          setLocalAvatarUri(null); // transition to server URL
          showToast('Profile photo updated & synced!', 'success');
        } catch (serverErr: any) {
          console.warn('[Avatar Upload] Server sync failed (using local device photo):', serverErr?.message);
          showToast('Profile photo saved on your device!', 'success');
        }
      } else {
        showToast('Profile photo updated!', 'success');
      }
    } catch (err: any) {
      console.error('Failed to update avatar:', err);
      showToast(err.message || 'Could not upload photo. Please try again.', 'error');
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  const handleRemoveAvatar = async () => {
    try {
      setIsUploadingAvatar(true);
      await updateUser({ avatarUrl: null });
      showToast('Profile photo removed', 'success');
    } catch (err: any) {
      showToast(err.message || 'Failed to remove photo', 'error');
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  const openFieldEditor = (field: EditableField) => {
    setActiveField(field);
    if (field === 'password') {
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setShowCurrentPassword(false);
      setShowNewPassword(false);
      setShowConfirmPassword(false);
    } else if (field === 'firstName') {
      setFieldValue(firstName === 'Member' ? '' : firstName);
    } else if (field === 'lastName') {
      setFieldValue(lastName);
    } else if (field === 'email') {
      setFieldValue(user?.email || '');
    } else if (field === 'phone') {
      setFieldValue(user?.phone || '');
    } else if (field === 'country') {
      setFieldValue(user?.country || '');
    } else if (field === 'persona') {
      setPersonaChoice(user?.userType || 'diaspora');
    } else if (field === 'savedAddress') {
      setFieldValue(user?.savedAddress || '');
      setProfileLocationCoords({
        lat: user?.savedLatitude ?? undefined,
        lon: user?.savedLongitude ?? undefined,
      });
    }
  };

  const handleDetectProfileGps = async () => {
    setIsDetectingProfileLocation(true);
    try {
      const loc = await getCurrentUserLocation();
      if (loc.granted && loc.latitude && loc.longitude) {
        setProfileLocationCoords({ lat: loc.latitude, lon: loc.longitude });
        const addr = loc.address || `${loc.latitude.toFixed(4)}, ${loc.longitude.toFixed(4)}`;
        setFieldValue(addr);
        await updateUser({
          savedAddress: addr,
          savedLatitude: loc.latitude,
          savedLongitude: loc.longitude,
        });
        showToast('Current GPS location captured and saved!', 'success');
      } else {
        showToast(loc.error || 'Location permission was denied', 'error');
      }
    } catch {
      showToast('Could not fetch GPS location', 'error');
    } finally {
      setIsDetectingProfileLocation(false);
    }
  };

  const handleSaveField = async () => {
    if (isSavingField) return;
    setIsSavingField(true);
    try {
      if (activeField === 'password') {
        if (!currentPassword) throw new Error('Please enter your current password');
        if (!newPassword) throw new Error('Please enter a new password');
        if (newPassword.length < 8) throw new Error('New password must be at least 8 characters');
        if (newPassword !== confirmPassword) throw new Error('New passwords do not match');
        await changePassword(currentPassword, newPassword);
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
        showToast('Password updated successfully in database!', 'success');
      } else if (activeField === 'firstName') {
        const trimmed = fieldValue.trim();
        if (!trimmed) throw new Error('First name cannot be empty');
        const newFullName = `${trimmed} ${lastName}`.trim();
        await updateUser({ name: newFullName });
        showToast('First name updated in database!', 'success');
      } else if (activeField === 'lastName') {
        const trimmed = fieldValue.trim();
        const newFullName = `${firstName} ${trimmed}`.trim();
        await updateUser({ name: newFullName });
        showToast('Last name updated in database!', 'success');
      } else if (activeField === 'email') {
        const trimmed = fieldValue.trim().toLowerCase();
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(trimmed)) throw new Error('Please enter a valid email address');
        await updateUser({ email: trimmed });
        showToast('Email address updated in database!', 'success');
      } else if (activeField === 'phone') {
        const trimmed = fieldValue.trim();
        await updateUser({ phone: trimmed });
        showToast('Phone number updated in database!', 'success');
      } else if (activeField === 'country') {
        const trimmed = fieldValue.trim();
        if (!trimmed) throw new Error('Country cannot be empty');
        await updateUser({ country: trimmed });
        showToast('Country updated in database!', 'success');
      } else if (activeField === 'persona') {
        await updateUser({ userType: personaChoice });
        showToast('Profile persona updated in database!', 'success');
      } else if (activeField === 'savedAddress') {
        const trimmed = fieldValue.trim();
        await updateUser({
          savedAddress: trimmed || null,
          savedLatitude: profileLocationCoords.lat ?? null,
          savedLongitude: profileLocationCoords.lon ?? null,
        });
        showToast('Saved delivery destination updated in database!', 'success');
      }
      setActiveField(null);
    } catch (err: any) {
      showToast(err.message || 'Failed to save changes', 'error');
    } finally {
      setIsSavingField(false);
    }
  };

  const getDialCode = (country?: string) => {
    switch (country) {
      case 'Ethiopia': return '+251';
      case 'Saudi Arabia': return '+966';
      case 'United Arab Emirates':
      case 'UAE': return '+971';
      case 'United Kingdom':
      case 'UK': return '+44';
      case 'United States':
      case 'USA':
      case 'Canada': return '+1';
      case 'Germany': return '+49';
      case 'Sweden': return '+46';
      case 'Australia': return '+61';
      case 'Kenya': return '+254';
      default: return '+';
    }
  };

  const initials =
    user?.name
      ?.split(' ')
      .filter(Boolean)
      .map((n) => n[0])
      .join('')
      .substring(0, 2)
      .toUpperCase() || 'D';

  const nameParts = (user?.name || '').trim().split(' ');
  const firstName = nameParts[0] || 'Member';
  const lastName = nameParts.slice(1).join(' ') || '';
  const isDiaspora = user?.userType === 'diaspora';

  return (
    <View style={styles.screen}>
      {/* Deep Navy Luxury Header */}
      <ScreenHeader
        title={t('profile.title', 'Account')}
        rightElement={
          <TouchableOpacity
            style={styles.headerSignOutBtn}
            onPress={() => setIsSignOutModalVisible(true)}
            activeOpacity={0.8}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Ionicons name="log-out-outline" size={20} color={colors.gold} />
          </TouchableOpacity>
        }
      />
      {/* 4-Second Auto Dismiss Toast Banner */}
      {toastMessage && (
        <Animated.View
          style={[
            styles.toastContainer,
            toastType === 'error' ? styles.toastError : styles.toastSuccess,
            { transform: [{ translateY: toastAnim }] },
          ]}
        >
          <Ionicons
            name={toastType === 'error' ? 'alert-circle' : 'checkmark-circle'}
            size={20}
            color={toastType === 'error' ? '#C53030' : '#16803C'}
          />
          <Text
            style={[
              styles.toastText,
              { color: toastType === 'error' ? '#9B2C2C' : '#0F2E22' },
            ]}
          >
            {toastMessage}
          </Text>
        </Animated.View>
      )}



      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
          {/* Hero Avatar Card */}
        <View style={styles.heroCard}>
          <View style={styles.avatarWrapper}>
            {/* Outer Gold Radiant Ring */}
            <View style={styles.avatarGoldHalo}>
              <TouchableOpacity
                style={styles.avatarCircle}
                onPress={handlePickAvatar}
                disabled={isUploadingAvatar}
                activeOpacity={0.85}
              >
                {avatarUri ? (
                  <Image
                    source={{ uri: avatarUri }}
                    style={styles.avatarImage}
                    resizeMode="cover"
                  />
                ) : (
                  <View style={styles.avatarInitialsContainer}>
                    <Text style={styles.avatarInitialsText}>{initials}</Text>
                  </View>
                )}

                {/* Uploading Overlay */}
                {isUploadingAvatar && (
                  <View style={styles.avatarLoadingOverlay}>
                    <ActivityIndicator size="small" color={colors.gold} />
                  </View>
                )}
              </TouchableOpacity>
            </View>

            {/* Camera badge trigger */}
            <TouchableOpacity
              style={styles.cameraBadge}
              onPress={handlePickAvatar}
              disabled={isUploadingAvatar}
              activeOpacity={0.85}
            >
              <Ionicons name="camera" size={16} color="#FFFFFF" />
            </TouchableOpacity>
          </View>

          <Text style={styles.userName}>{user?.name || 'Member'}</Text>
          <Text style={styles.userEmail}>{user?.email}</Text>

          {/* Badges Row */}
          <View style={styles.badgeRow}>
            {/* Persona Badge */}
            <View
              style={[
                styles.personaBadge,
                isDiaspora ? styles.personaBadgeDiaspora : styles.personaBadgeForeign,
              ]}
            >
              <Ionicons
                name={isDiaspora ? "people" : "globe-outline"}
                size={14}
                color={colors.gold}
                style={{ marginRight: 5 }}
              />
              <Text
                style={[
                  styles.personaBadgeText,
                  isDiaspora ? styles.personaTextDiaspora : styles.personaTextForeign,
                ]}
              >
                {isDiaspora
                  ? `Ethiopian Diaspora · ${user?.country || 'Abroad'}`
                  : 'Foreign Resident / International User'}
              </Text>
            </View>

            {/* Verification status */}
            <View style={styles.verifiedPill}>
              <Ionicons name="shield-checkmark" size={13} color="#16803C" />
              <Text style={styles.verifiedPillText}>Verified</Text>
            </View>
          </View>
        </View>

        {/* Individual Info Field Cards (Each Individually Editable Inline) */}
        {/* 1. First Name Card */}
        {activeField === 'firstName' ? (
          <View style={styles.inlineEditCard}>
            <View style={styles.inlineCardHeader}>
              <View style={styles.fieldIconCircle}>
                <Ionicons name="person" size={20} color={colors.navy} />
              </View>
              <Text style={styles.inlineCardTitle}>First Name</Text>
            </View>
            <TextInput
              style={styles.inlineInput}
              value={fieldValue}
              onChangeText={setFieldValue}
              placeholder="Enter first name"
              placeholderTextColor={colors.charcoalLight}
              autoFocus
            />
            <View style={styles.inlineBtnRow}>
              <TouchableOpacity
                style={styles.inlineCancelBtn}
                onPress={() => setActiveField(null)}
                disabled={isSavingField}
                activeOpacity={0.8}
              >
                <Text style={styles.inlineCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.inlineSaveBtn}
                onPress={handleSaveField}
                disabled={isSavingField}
                activeOpacity={0.8}
              >
                {isSavingField ? (
                  <ActivityIndicator size="small" color={colors.navy} />
                ) : (
                  <>
                    <Ionicons name="checkmark" size={16} color={colors.navy} style={{ marginRight: 4 }} />
                    <Text style={styles.inlineSaveText}>Save</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <TouchableOpacity
            style={styles.fieldCard}
            onPress={() => openFieldEditor('firstName')}
            activeOpacity={0.85}
          >
            <View style={styles.fieldIconCircle}>
              <Ionicons name="person" size={20} color={colors.navy} />
            </View>
            <View style={styles.fieldTextCol}>
              <Text style={styles.fieldLabel}>First name</Text>
              <Text style={styles.fieldValue}>{firstName}</Text>
            </View>
            <View style={styles.pencilCircle}>
              <Ionicons name="pencil" size={15} color={colors.navy} />
            </View>
          </TouchableOpacity>
        )}

        {/* 2. Last Name Card */}
        {activeField === 'lastName' ? (
          <View style={styles.inlineEditCard}>
            <View style={styles.inlineCardHeader}>
              <View style={styles.fieldIconCircle}>
                <Ionicons name="person" size={20} color={colors.navy} />
              </View>
              <Text style={styles.inlineCardTitle}>Last Name</Text>
            </View>
            <TextInput
              style={styles.inlineInput}
              value={fieldValue}
              onChangeText={setFieldValue}
              placeholder="Enter last name"
              placeholderTextColor={colors.charcoalLight}
              autoFocus
            />
            <View style={styles.inlineBtnRow}>
              <TouchableOpacity
                style={styles.inlineCancelBtn}
                onPress={() => setActiveField(null)}
                disabled={isSavingField}
                activeOpacity={0.8}
              >
                <Text style={styles.inlineCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.inlineSaveBtn}
                onPress={handleSaveField}
                disabled={isSavingField}
                activeOpacity={0.8}
              >
                {isSavingField ? (
                  <ActivityIndicator size="small" color={colors.navy} />
                ) : (
                  <>
                    <Ionicons name="checkmark" size={16} color={colors.navy} style={{ marginRight: 4 }} />
                    <Text style={styles.inlineSaveText}>Save</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <TouchableOpacity
            style={styles.fieldCard}
            onPress={() => openFieldEditor('lastName')}
            activeOpacity={0.85}
          >
            <View style={styles.fieldIconCircle}>
              <Ionicons name="person" size={20} color={colors.navy} />
            </View>
            <View style={styles.fieldTextCol}>
              <Text style={styles.fieldLabel}>Last name</Text>
              <Text style={[styles.fieldValue, !lastName && styles.fieldValuePlaceholder]}>
                {lastName || 'Add last name'}
              </Text>
            </View>
            <View style={styles.pencilCircle}>
              <Ionicons name="pencil" size={15} color={colors.navy} />
            </View>
          </TouchableOpacity>
        )}

        {/* 3. Email Card */}
        {activeField === 'email' ? (
          <View style={styles.inlineEditCard}>
            <View style={styles.inlineCardHeader}>
              <View style={styles.fieldIconCircle}>
                <Ionicons name="mail" size={20} color={colors.navy} />
              </View>
              <Text style={styles.inlineCardTitle}>Email Address</Text>
            </View>
            <TextInput
              style={styles.inlineInput}
              value={fieldValue}
              onChangeText={setFieldValue}
              placeholder="name@example.com"
              placeholderTextColor={colors.charcoalLight}
              keyboardType="email-address"
              autoCapitalize="none"
              autoFocus
            />
            <View style={styles.inlineBtnRow}>
              <TouchableOpacity
                style={styles.inlineCancelBtn}
                onPress={() => setActiveField(null)}
                disabled={isSavingField}
                activeOpacity={0.8}
              >
                <Text style={styles.inlineCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.inlineSaveBtn}
                onPress={handleSaveField}
                disabled={isSavingField}
                activeOpacity={0.8}
              >
                {isSavingField ? (
                  <ActivityIndicator size="small" color={colors.navy} />
                ) : (
                  <>
                    <Ionicons name="checkmark" size={16} color={colors.navy} style={{ marginRight: 4 }} />
                    <Text style={styles.inlineSaveText}>Save</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <TouchableOpacity
            style={styles.fieldCard}
            onPress={() => openFieldEditor('email')}
            activeOpacity={0.85}
          >
            <View style={styles.fieldIconCircle}>
              <Ionicons name="mail" size={20} color={colors.navy} />
            </View>
            <View style={styles.fieldTextCol}>
              <Text style={styles.fieldLabel}>Email address</Text>
              <Text style={styles.fieldValue}>{user?.email}</Text>
            </View>
            <View style={styles.pencilCircle}>
              <Ionicons name="pencil" size={15} color={colors.navy} />
            </View>
          </TouchableOpacity>
        )}

        {/* 4. Phone Number Row */}
        {activeField === 'phone' ? (
          <View style={styles.inlineEditCard}>
            <View style={styles.inlineCardHeader}>
              <View style={styles.fieldIconCircle}>
                <Ionicons name="phone-portrait" size={20} color={colors.navy} />
              </View>
              <Text style={styles.inlineCardTitle}>Phone Number</Text>
            </View>
            <View style={styles.inlinePhoneInputWrap}>
              <View style={styles.inlineDialBadge}>
                <Text style={styles.inlineDialText}>{getDialCode(user?.country)}</Text>
              </View>
              <TextInput
                style={[styles.inlineInput, { flex: 1, marginBottom: 0 }]}
                value={fieldValue}
                onChangeText={setFieldValue}
                placeholder="Mobile number"
                placeholderTextColor={colors.charcoalLight}
                keyboardType="phone-pad"
                autoFocus
              />
            </View>
            <View style={styles.inlineBtnRow}>
              <TouchableOpacity
                style={styles.inlineCancelBtn}
                onPress={() => setActiveField(null)}
                disabled={isSavingField}
                activeOpacity={0.8}
              >
                <Text style={styles.inlineCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.inlineSaveBtn}
                onPress={handleSaveField}
                disabled={isSavingField}
                activeOpacity={0.8}
              >
                {isSavingField ? (
                  <ActivityIndicator size="small" color={colors.navy} />
                ) : (
                  <>
                    <Ionicons name="checkmark" size={16} color={colors.navy} style={{ marginRight: 4 }} />
                    <Text style={styles.inlineSaveText}>Save</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <View style={styles.phoneRow}>
            <View style={styles.countryCodeBadge}>
              <Text style={styles.countryCodeText}>
                {getDialCode(user?.country)}
              </Text>
            </View>
            <TouchableOpacity
              style={[styles.fieldCard, { flex: 1, marginBottom: 0 }]}
              onPress={() => openFieldEditor('phone')}
              activeOpacity={0.85}
            >
              <View style={styles.fieldIconCircle}>
                <Ionicons name="phone-portrait" size={20} color={colors.navy} />
              </View>
              <View style={styles.fieldTextCol}>
                <Text style={styles.fieldLabel}>Phone number</Text>
                <Text style={[styles.fieldValue, !user?.phone && styles.fieldValuePlaceholder]}>
                  {user?.phone || 'Add phone number'}
                </Text>
              </View>
              <View style={styles.pencilCircle}>
                <Ionicons name="pencil" size={15} color={colors.navy} />
              </View>
            </TouchableOpacity>
          </View>
        )}

        {/* 5. Residence Country Card */}
        {activeField === 'country' ? (
          <View style={styles.inlineEditCard}>
            <View style={styles.inlineCardHeader}>
              <View style={styles.fieldIconCircle}>
                <Ionicons name="globe" size={20} color={colors.navy} />
              </View>
              <Text style={styles.inlineCardTitle}>Country of Residence</Text>
            </View>
            <TextInput
              style={styles.inlineInput}
              value={fieldValue}
              onChangeText={setFieldValue}
              placeholder="Enter country name..."
              placeholderTextColor={colors.charcoalLight}
              autoFocus
            />
            <View style={styles.chipGrid}>
              {[
                'Ethiopia',
                'United States',
                'United Kingdom',
                'Canada',
                'Saudi Arabia',
                'United Arab Emirates',
                'Germany',
                'Sweden',
              ].map((c) => (
                <TouchableOpacity
                  key={c}
                  style={[
                    styles.countryChip,
                    fieldValue.toLowerCase() === c.toLowerCase() && styles.countryChipActive,
                  ]}
                  onPress={() => setFieldValue(c)}
                  activeOpacity={0.8}
                >
                  <Text
                    style={[
                      styles.countryChipText,
                      fieldValue.toLowerCase() === c.toLowerCase() && styles.countryChipTextActive,
                    ]}
                  >
                    {c}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            <View style={[styles.inlineBtnRow, { marginTop: 12 }]}>
              <TouchableOpacity
                style={styles.inlineCancelBtn}
                onPress={() => setActiveField(null)}
                disabled={isSavingField}
                activeOpacity={0.8}
              >
                <Text style={styles.inlineCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.inlineSaveBtn}
                onPress={handleSaveField}
                disabled={isSavingField}
                activeOpacity={0.8}
              >
                {isSavingField ? (
                  <ActivityIndicator size="small" color={colors.navy} />
                ) : (
                  <>
                    <Ionicons name="checkmark" size={16} color={colors.navy} style={{ marginRight: 4 }} />
                    <Text style={styles.inlineSaveText}>Save</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <TouchableOpacity
            style={styles.fieldCard}
            onPress={() => openFieldEditor('country')}
            activeOpacity={0.85}
          >
            <View style={styles.fieldIconCircle}>
              <Ionicons name="globe" size={20} color={colors.navy} />
            </View>
            <View style={styles.fieldTextCol}>
              <Text style={styles.fieldLabel}>Country of Residence</Text>
              <Text style={styles.fieldValue}>{user?.country || 'Ethiopia'}</Text>
            </View>
            <View style={styles.pencilCircle}>
              <Ionicons name="pencil" size={15} color={colors.navy} />
            </View>
          </TouchableOpacity>
        )}

        {/* 6. Membership Persona Card */}
        {activeField === 'persona' ? (
          <View style={styles.inlineEditCard}>
            <View style={styles.inlineCardHeader}>
              <View style={styles.fieldIconCircle}>
                <Ionicons name="shield-checkmark" size={20} color={colors.navy} />
              </View>
              <Text style={styles.inlineCardTitle}>Select Profile Persona</Text>
            </View>

            <TouchableOpacity
              style={[
                styles.inlinePersonaOption,
                personaChoice === 'diaspora' && styles.inlinePersonaOptionActive,
              ]}
              onPress={() => setPersonaChoice('diaspora')}
              activeOpacity={0.85}
            >
              <Ionicons
                name="people"
                size={20}
                color={personaChoice === 'diaspora' ? colors.gold : colors.charcoalSub}
                style={{ marginRight: 10 }}
              />
              <View style={{ flex: 1 }}>
                <Text
                  style={[
                    styles.inlinePersonaTitle,
                    personaChoice === 'diaspora' && styles.inlinePersonaTitleActive,
                  ]}
                >
                  Ethiopian Diaspora
                </Text>
                <Text style={styles.inlinePersonaSub}>
                  For Ethiopians living abroad or returning
                </Text>
              </View>
              {personaChoice === 'diaspora' && (
                <Ionicons name="checkmark-circle" size={18} color={colors.gold} />
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.inlinePersonaOption,
                personaChoice === 'foreign_resident' && styles.inlinePersonaOptionActive,
              ]}
              onPress={() => setPersonaChoice('foreign_resident')}
              activeOpacity={0.85}
            >
              <Ionicons
                name="globe-outline"
                size={20}
                color={personaChoice === 'foreign_resident' ? colors.gold : colors.charcoalSub}
                style={{ marginRight: 10 }}
              />
              <View style={{ flex: 1 }}>
                <Text
                  style={[
                    styles.inlinePersonaTitle,
                    personaChoice === 'foreign_resident' && styles.inlinePersonaTitleActive,
                  ]}
                >
                  Foreign Resident / Expat
                </Text>
                <Text style={styles.inlinePersonaSub}>
                  For travelers, diplomats, and expats in Ethiopia
                </Text>
              </View>
              {personaChoice === 'foreign_resident' && (
                <Ionicons name="checkmark-circle" size={18} color={colors.gold} />
              )}
            </TouchableOpacity>

            <View style={[styles.inlineBtnRow, { marginTop: 10 }]}>
              <TouchableOpacity
                style={styles.inlineCancelBtn}
                onPress={() => setActiveField(null)}
                disabled={isSavingField}
                activeOpacity={0.8}
              >
                <Text style={styles.inlineCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.inlineSaveBtn}
                onPress={handleSaveField}
                disabled={isSavingField}
                activeOpacity={0.8}
              >
                {isSavingField ? (
                  <ActivityIndicator size="small" color={colors.navy} />
                ) : (
                  <>
                    <Ionicons name="checkmark" size={16} color={colors.navy} style={{ marginRight: 4 }} />
                    <Text style={styles.inlineSaveText}>Save</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <TouchableOpacity
            style={styles.fieldCard}
            onPress={() => openFieldEditor('persona')}
            activeOpacity={0.85}
          >
            <View style={styles.fieldIconCircle}>
              <Ionicons name="shield-checkmark" size={20} color={colors.navy} />
            </View>
            <View style={styles.fieldTextCol}>
              <Text style={styles.fieldLabel}>Profile Persona</Text>
              <Text style={styles.fieldValue}>
                {isDiaspora ? 'Ethiopian Diaspora' : 'Foreign Resident / International'}
              </Text>
            </View>
            <View style={styles.pencilCircle}>
              <Ionicons name="pencil" size={15} color={colors.navy} />
            </View>
          </TouchableOpacity>
        )}

        {/* Saved Delivery Destination Card */}
        {activeField === 'savedAddress' ? (
          <View style={styles.inlineEditCard}>
            <View style={styles.inlineCardHeader}>
              <View style={styles.fieldIconCircle}>
                <Ionicons name="location" size={20} color={colors.navy} />
              </View>
              <Text style={styles.inlineCardTitle}>Saved Delivery Destination</Text>
            </View>

            <View style={styles.profileGpsActionRow}>
              <Text style={styles.inlineSubLabel}>Default Shipping / Delivery Address</Text>
              <TouchableOpacity
                style={styles.profileGpsBtn}
                onPress={handleDetectProfileGps}
                disabled={isDetectingProfileLocation}
                activeOpacity={0.8}
              >
                {isDetectingProfileLocation ? (
                  <ActivityIndicator size="small" color={colors.navy} style={{ transform: [{ scale: 0.7 }] }} />
                ) : (
                  <Ionicons name="navigate-circle" size={13} color={colors.navy} />
                )}
                <Text style={styles.profileGpsBtnText}>
                  {isDetectingProfileLocation ? 'Capturing GPS...' : 'Use Current GPS'}
                </Text>
              </TouchableOpacity>
            </View>

            <TextInput
              style={styles.inlineInput}
              value={fieldValue}
              onChangeText={setFieldValue}
              placeholder="e.g. Bole Medhanialem, Morning Star Mall, Addis Ababa"
              placeholderTextColor={colors.charcoalLight}
              autoFocus
            />

            {profileLocationCoords.lat && profileLocationCoords.lon ? (
              <View style={styles.profileCoordBadgeRow}>
                <Ionicons name="locate-outline" size={13} color={colors.goldRich} />
                <Text style={styles.profileCoordBadgeText}>
                  Coordinates: {profileLocationCoords.lat.toFixed(4)}° N, {profileLocationCoords.lon.toFixed(4)}° E
                </Text>
              </View>
            ) : null}

            <View style={styles.inlineBtnRow}>
              <TouchableOpacity
                style={styles.inlineCancelBtn}
                onPress={() => setActiveField(null)}
                disabled={isSavingField}
                activeOpacity={0.8}
              >
                <Text style={styles.inlineCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.inlineSaveBtn}
                onPress={handleSaveField}
                disabled={isSavingField}
                activeOpacity={0.8}
              >
                {isSavingField ? (
                  <ActivityIndicator size="small" color={colors.navy} />
                ) : (
                  <>
                    <Ionicons name="checkmark" size={16} color={colors.navy} style={{ marginRight: 4 }} />
                    <Text style={styles.inlineSaveText}>Save</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <TouchableOpacity
            style={styles.fieldCard}
            onPress={() => openFieldEditor('savedAddress')}
            activeOpacity={0.85}
          >
            <View style={styles.fieldIconCircle}>
              <Ionicons name="location-sharp" size={20} color={colors.navy} />
            </View>
            <View style={styles.fieldTextCol}>
              <Text style={styles.fieldLabel}>Saved delivery destination</Text>
              <Text style={[styles.fieldValue, !user?.savedAddress && styles.fieldValuePlaceholder]} numberOfLines={1}>
                {user?.savedAddress || 'Add default delivery address'}
              </Text>
              {user?.savedLatitude && user?.savedLongitude ? (
                <Text style={styles.fieldSubCoord}>
                  GPS: {user.savedLatitude.toFixed(4)}° N, {user.savedLongitude.toFixed(4)}° E
                </Text>
              ) : null}
            </View>
            <View style={styles.pencilCircle}>
              <Ionicons name="pencil" size={15} color={colors.navy} />
            </View>
          </TouchableOpacity>
        )}

        {/* 7. Password & Security Card (Individually Editable Inline) */}
        {activeField === 'password' ? (
          <View style={styles.inlineEditCard}>
            <View style={styles.inlineCardHeader}>
              <View style={styles.fieldIconCircle}>
                <Ionicons name="lock-closed" size={20} color={colors.navy} />
              </View>
              <Text style={styles.inlineCardTitle}>Change Password</Text>
            </View>

            <Text style={styles.inlineSubLabel}>Current Password</Text>
            <View style={styles.passwordInputWrap}>
              <TextInput
                style={styles.passwordInput}
                value={currentPassword}
                onChangeText={setCurrentPassword}
                placeholder="Enter current password"
                placeholderTextColor={colors.charcoalLight}
                secureTextEntry={!showCurrentPassword}
                autoCapitalize="none"
              />
              <TouchableOpacity
                style={styles.passwordEyeBtn}
                onPress={() => setShowCurrentPassword(!showCurrentPassword)}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Ionicons
                  name={showCurrentPassword ? 'eye-off-outline' : 'eye-outline'}
                  size={18}
                  color={colors.charcoalSub}
                />
              </TouchableOpacity>
            </View>

            <Text style={styles.inlineSubLabel}>New Password (min 8 characters)</Text>
            <View style={styles.passwordInputWrap}>
              <TextInput
                style={styles.passwordInput}
                value={newPassword}
                onChangeText={setNewPassword}
                placeholder="Enter new password"
                placeholderTextColor={colors.charcoalLight}
                secureTextEntry={!showNewPassword}
                autoCapitalize="none"
              />
              <TouchableOpacity
                style={styles.passwordEyeBtn}
                onPress={() => setShowNewPassword(!showNewPassword)}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Ionicons
                  name={showNewPassword ? 'eye-off-outline' : 'eye-outline'}
                  size={18}
                  color={colors.charcoalSub}
                />
              </TouchableOpacity>
            </View>

            <Text style={styles.inlineSubLabel}>Confirm New Password</Text>
            <View style={styles.passwordInputWrap}>
              <TextInput
                style={styles.passwordInput}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                placeholder="Re-type new password"
                placeholderTextColor={colors.charcoalLight}
                secureTextEntry={!showConfirmPassword}
                autoCapitalize="none"
              />
              <TouchableOpacity
                style={styles.passwordEyeBtn}
                onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Ionicons
                  name={showConfirmPassword ? 'eye-off-outline' : 'eye-outline'}
                  size={18}
                  color={colors.charcoalSub}
                />
              </TouchableOpacity>
            </View>

            {/* Realtime Matching Status Indicator */}
            {confirmPassword.length > 0 && (
              <View style={styles.matchIndicatorRow}>
                <Ionicons
                  name={newPassword === confirmPassword ? 'checkmark-circle' : 'close-circle'}
                  size={15}
                  color={newPassword === confirmPassword ? '#16803C' : '#DC2626'}
                />
                <Text
                  style={[
                    styles.matchIndicatorText,
                    { color: newPassword === confirmPassword ? '#16803C' : '#DC2626' },
                  ]}
                >
                  {newPassword === confirmPassword
                    ? 'New passwords match'
                    : 'New passwords do not match'}
                </Text>
              </View>
            )}

            <View style={[styles.inlineBtnRow, { marginTop: 12 }]}>
              <TouchableOpacity
                style={styles.inlineCancelBtn}
                onPress={() => setActiveField(null)}
                disabled={isSavingField}
                activeOpacity={0.8}
              >
                <Text style={styles.inlineCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.inlineSaveBtn}
                onPress={handleSaveField}
                disabled={isSavingField}
                activeOpacity={0.8}
              >
                {isSavingField ? (
                  <ActivityIndicator size="small" color={colors.navy} />
                ) : (
                  <>
                    <Ionicons name="shield-checkmark" size={16} color={colors.navy} style={{ marginRight: 4 }} />
                    <Text style={styles.inlineSaveText}>Update Password</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <TouchableOpacity
            style={styles.fieldCard}
            onPress={() => openFieldEditor('password')}
            activeOpacity={0.85}
          >
            <View style={styles.fieldIconCircle}>
              <Ionicons name="lock-closed" size={20} color={colors.navy} />
            </View>
            <View style={styles.fieldTextCol}>
              <Text style={styles.fieldLabel}>Password</Text>
              <Text style={styles.fieldValue}>••••••••••••</Text>
            </View>
            <View style={styles.pencilCircle}>
              <Ionicons name="pencil" size={15} color={colors.navy} />
            </View>
          </TouchableOpacity>
        )}

        {/* Actions Strip */}
        <View style={styles.actionsCard}>
          <TouchableOpacity
            style={styles.actionBtnRow}
            onPress={handlePickAvatar}
            activeOpacity={0.8}
          >
            <View style={[styles.fieldIconCircle, { width: 38, height: 38, borderRadius: 19 }]}>
              <Ionicons name="camera-outline" size={18} color={colors.navy} />
            </View>
            <Text style={styles.actionBtnRowText}>{t('profile.changePhoto', 'Change Profile Photo')}</Text>
            <Ionicons name="chevron-forward" size={18} color={colors.charcoalLight} />
          </TouchableOpacity>

          {user?.avatarUrl && (
            <>
              <View style={styles.divider} />
              <TouchableOpacity
                style={styles.actionBtnRow}
                onPress={handleRemoveAvatar}
                activeOpacity={0.8}
              >
                <View style={[styles.fieldIconCircle, { width: 38, height: 38, borderRadius: 19, backgroundColor: '#FEE2E2' }]}>
                  <Ionicons name="trash-outline" size={18} color="#DC2626" />
                </View>
                <Text style={[styles.actionBtnRowText, { color: '#DC2626' }]}>{t('profile.removePhoto', 'Remove Photo')}</Text>
                <Ionicons name="chevron-forward" size={18} color={colors.charcoalLight} />
              </TouchableOpacity>
            </>
          )}
        </View>

        {/* Quick Link to Notification Center */}
        <TouchableOpacity
          style={styles.notifCenterLink}
          onPress={() => router.push('/notifications')}
          activeOpacity={0.8}
        >
          <View style={styles.notifCenterLinkLeft}>
            <View style={[styles.fieldIconCircle, { width: 38, height: 38, borderRadius: 19, backgroundColor: colors.goldSoft }]}>
              <Ionicons name="notifications" size={18} color={colors.goldText} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.notifCenterLinkTitle}>{t('profile.activityCenter', 'Notification & Activity Center')}</Text>
              <Text style={styles.notifCenterLinkSub}>{t('profile.activityCenterSub', 'View past orders, alerts & updates')}</Text>
            </View>
          </View>
          <Ionicons name="chevron-forward" size={18} color={colors.charcoalLight} />
        </TouchableOpacity>

        {/* Notification Preferences Card */}
        <View style={styles.prefsContainerCard}>
          <View style={styles.prefsHeader}>
            <View style={[styles.fieldIconCircle, { width: 34, height: 34, borderRadius: 17 }]}>
              <Ionicons name="options-outline" size={18} color={colors.navy} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.prefsCardTitle}>{t('profile.notificationPreferences', 'Push & Notification Preferences')}</Text>
              <Text style={styles.prefsCardSubtitle}>{t('profile.notifPrefSub', 'Choose which updates you wish to receive')}</Text>
            </View>
          </View>

          <View style={styles.divider} />

          {/* Row 1: Orders */}
          <View style={styles.prefRow}>
            <View style={styles.prefTextCol}>
              <Text style={styles.prefTitle}>{t('profile.ordersPref', 'Artisan Orders & Inquiries')}</Text>
              <Text style={styles.prefDesc}>{t('profile.ordersPrefSub', 'Delivery tracking, seller replies & inquiry updates')}</Text>
            </View>
            <Switch
              value={notifPrefs.orders}
              onValueChange={() => handleTogglePref('orders')}
              trackColor={{ false: '#E2E8F0', true: colors.gold }}
              thumbColor={notifPrefs.orders ? colors.navy : '#FFFFFF'}
            />
          </View>

          <View style={styles.prefDivider} />

          {/* Row 2: Cultural Events */}
          <View style={styles.prefRow}>
            <View style={styles.prefTextCol}>
              <Text style={styles.prefTitle}>{t('profile.eventsPref', 'Cultural Events & Festivals')}</Text>
              <Text style={styles.prefDesc}>{t('profile.eventsPrefSub', 'Timkat, Meskel, networking summits & RSVP reminders')}</Text>
            </View>
            <Switch
              value={notifPrefs.events}
              onValueChange={() => handleTogglePref('events')}
              trackColor={{ false: '#E2E8F0', true: colors.gold }}
              thumbColor={notifPrefs.events ? colors.navy : '#FFFFFF'}
            />
          </View>

          <View style={styles.prefDivider} />

          {/* Row 3: Diaspora Investments */}
          <View style={styles.prefRow}>
            <View style={styles.prefTextCol}>
              <Text style={styles.prefTitle}>{t('profile.investmentsPref', 'Investment & Real Estate Alerts')}</Text>
              <Text style={styles.prefDesc}>{t('profile.investmentsPrefSub', 'Certified projects, residential launches & yield updates')}</Text>
            </View>
            <Switch
              value={notifPrefs.investments}
              onValueChange={() => handleTogglePref('investments')}
              trackColor={{ false: '#E2E8F0', true: colors.gold }}
              thumbColor={notifPrefs.investments ? colors.navy : '#FFFFFF'}
            />
          </View>

          <View style={styles.prefDivider} />

          {/* Row 4: Community Announcements */}
          <View style={styles.prefRow}>
            <View style={styles.prefTextCol}>
              <Text style={styles.prefTitle}>{t('profile.announcementsPref', 'Community & Embassy Notices')}</Text>
              <Text style={styles.prefDesc}>{t('profile.announcementsPrefSub', 'Consular circulars, Ethiopian Yellow Card assistance & news')}</Text>
            </View>
            <Switch
              value={notifPrefs.announcements}
              onValueChange={() => handleTogglePref('announcements')}
              trackColor={{ false: '#E2E8F0', true: colors.gold }}
              thumbColor={notifPrefs.announcements ? colors.navy : '#FFFFFF'}
            />
          </View>
        </View>

        {/* Language & Localization Card */}
        <View style={styles.prefsContainerCard}>
          <View style={styles.prefsHeader}>
            <View style={[styles.fieldIconCircle, { width: 34, height: 34, borderRadius: 17, backgroundColor: colors.goldSoft }]}>
              <Ionicons name="language" size={18} color={colors.goldText} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.prefsCardTitle}>
                {t('profile.language', 'Language & Localization')}
              </Text>
              <Text style={styles.prefsCardSubtitle}>
                {t('profile.languageSubtitle', 'Choose your preferred display language')}
              </Text>
            </View>
          </View>

          <View style={styles.divider} />

          <View style={styles.langGrid}>
            {languages.map((langItem) => {
              const isSelected = language === langItem.code;
              return (
                <TouchableOpacity
                  key={langItem.code}
                  style={[
                    styles.langCard,
                    isSelected && styles.langCardActive,
                  ]}
                  onPress={() => handleSelectLanguage(langItem.code)}
                  activeOpacity={0.8}
                >
                  <View style={styles.langCardLeft}>
                    <View style={[styles.langBadgePill, isSelected && styles.langBadgePillActive]}>
                      <Text style={[styles.langBadgeText, isSelected && styles.langBadgeTextActive]}>
                        {langItem.badge}
                      </Text>
                    </View>
                    <View>
                      <Text style={[styles.langNativeName, isSelected && styles.langNativeNameActive]}>
                        {langItem.nativeName}
                      </Text>
                      <Text style={styles.langEnglishName}>{langItem.name}</Text>
                    </View>
                  </View>
                  <View style={[styles.langRadio, isSelected && styles.langRadioActive]}>
                    {isSelected && <Ionicons name="checkmark" size={14} color="#FFFFFF" />}
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Sign Out Button */}
        <TouchableOpacity
          style={styles.signOutButton}
          onPress={() => setIsSignOutModalVisible(true)}
          activeOpacity={0.85}
        >
          <Ionicons name="log-out-outline" size={19} color="#DC2626" />
          <Text style={styles.signOutButtonText}>{t('profile.signOut', 'Sign Out of DALEEL')}</Text>
        </TouchableOpacity>

        {/* Footer Brand Info */}
        <View style={styles.footer}>
          <Text style={styles.footerBrand}>D A L E E L</Text>
          <Text style={styles.footerTagline}>The Digital Bridge to Ethiopia</Text>
          <Text style={styles.footerVersion}>VERSION 1.0.0 (RELEASE)</Text>
        </View>

        <View style={{ height: 32 }} />
      </ScrollView>

      {/* Sign Out Confirmation Modal (Never Alert.alert) */}
      <Modal
        visible={isSignOutModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setIsSignOutModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.confirmBox}>
            <View style={styles.confirmIconContainer}>
              <Ionicons name="log-out" size={26} color="#DC2626" />
            </View>
            <Text style={styles.confirmTitle}>{t('profile.signOutConfirm', 'Sign out of DALEEL?')}</Text>
            <Text style={styles.confirmSubtitle}>
              {t('profile.signOutSubtitle', 'You can log back in anytime with your registered email address.')}
            </Text>

            <View style={styles.confirmActionRow}>
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => setIsSignOutModalVisible(false)}
                activeOpacity={0.8}
              >
                <Text style={styles.cancelBtnText}>{t('common.cancel', 'Cancel')}</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.confirmSignOutBtn}
                onPress={() => {
                  setIsSignOutModalVisible(false);
                  logout();
                }}
                activeOpacity={0.8}
              >
                <Text style={styles.confirmSignOutText}>{t('profile.signOut', 'Sign Out')}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.ivory,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 40,
  },

  // Toast
  toastContainer: {
    position: 'absolute',
    top: 54,
    left: 20,
    right: 20,
    zIndex: 999,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 16,
    borderWidth: 1.5,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 8,
  },
  toastSuccess: {
    backgroundColor: '#FFFFFF',
    borderColor: '#C6F6D5',
  },
  toastError: {
    backgroundColor: '#FFFFFF',
    borderColor: '#FED7D7',
  },
  toastText: {
    fontFamily: fonts.bodyMedium,
    fontSize: 14,
    flex: 1,
  },

  // Top Bar (slim)
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    height: 56,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  // unused legacy shims kept for TS
  tagBadge: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  screenTag: { fontFamily: fonts.bodySemiBold, fontSize: 11, color: colors.gold, letterSpacing: 1.2 },
  screenTitle: {
    fontFamily: fonts.heading,
    fontSize: 22,
    color: colors.charcoal,
    letterSpacing: -0.4,
  },
  // Inline Editing Card Styles
  inlineEditCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1.5,
    borderColor: colors.gold,
    shadowColor: colors.gold,
    shadowOpacity: 0.15,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 3 },
    elevation: 3,
  },
  inlineCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  inlineCardTitle: {
    fontFamily: fonts.bodyBold,
    fontSize: 14,
    fontWeight: '700',
    color: colors.navy,
  },
  inlineInput: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 11,
    fontFamily: fonts.bodyMedium,
    fontSize: 15,
    color: colors.charcoal,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 10,
  },
  inlinePhoneInputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
  },
  inlineDialBadge: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  inlineDialText: {
    fontFamily: fonts.bodyBold,
    fontSize: 14,
    color: colors.navy,
  },
  inlineSubLabel: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 12,
    color: colors.charcoalSub,
    marginBottom: 5,
    marginTop: 6,
  },
  passwordInputWrap: {
    position: 'relative',
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  passwordInput: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 11,
    fontFamily: fonts.bodyMedium,
    fontSize: 15,
    color: colors.charcoal,
    borderWidth: 1,
    borderColor: colors.border,
    paddingRight: 42,
  },
  passwordEyeBtn: {
    position: 'absolute',
    right: 12,
    height: 38,
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  matchIndicatorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 6,
    marginBottom: 2,
  },
  matchIndicatorText: {
    fontFamily: fonts.bodyMedium,
    fontSize: 12,
  },
  inlineBtnRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    gap: 8,
  },
  inlineCancelBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: colors.surface,
  },
  inlineCancelText: {
    fontFamily: fonts.bodyMedium,
    fontSize: 13,
    color: colors.charcoalSub,
  },
  inlineSaveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.gold,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 10,
  },
  inlineSaveText: {
    fontFamily: fonts.bodyBold,
    fontSize: 13,
    fontWeight: '700',
    color: colors.navy,
  },
  inlinePersonaOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: '#FFFFFF',
    marginBottom: 8,
  },
  inlinePersonaOptionActive: {
    borderColor: colors.gold,
    backgroundColor: '#FDF8EB',
  },
  inlinePersonaTitle: {
    fontFamily: fonts.bodyBold,
    fontSize: 14,
    color: colors.charcoal,
    marginBottom: 2,
  },
  inlinePersonaTitleActive: {
    color: colors.navy,
  },
  inlinePersonaSub: {
    fontFamily: fonts.body,
    fontSize: 11.5,
    color: colors.charcoalSub,
  },
  headerSignOutBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(223, 183, 108, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(223, 183, 108, 0.3)',
  },
  pencilCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fieldValuePlaceholder: {
    color: colors.charcoalLight,
    fontWeight: '500',
  },
  chipGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 2,
    marginBottom: 4,
  },
  countryChip: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: colors.border,
  },
  countryChipActive: {
    borderColor: colors.gold,
    backgroundColor: colors.goldSoft,
  },
  countryChipText: {
    fontFamily: fonts.bodyMedium,
    fontSize: 13,
    color: colors.charcoal,
  },
  countryChipTextActive: {
    fontFamily: fonts.bodyBold,
    color: colors.navy,
  },

  // ── 3. Individual Info Field Cards (Matching Reference UI) ──
  fieldCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadow.card,
  },
  fieldIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.goldSoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  fieldTextCol: {
    flex: 1,
  },
  fieldLabel: {
    fontFamily: fonts.bodyMedium,
    fontSize: 12,
    color: '#7D8A99',
    marginBottom: 2,
  },
  fieldValue: {
    fontFamily: fonts.bodyBold,
    fontSize: 16,
    fontWeight: '700',
    color: colors.navy,
  },
  fieldSubCoord: {
    fontFamily: fonts.bodyMedium,
    fontSize: 11,
    color: colors.goldRich,
    marginTop: 2,
    fontWeight: '600',
  },
  profileGpsActionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  profileGpsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.goldSoft,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.goldBorder,
  },
  profileGpsBtnText: {
    fontFamily: fonts.bodyBold,
    fontSize: 10.5,
    color: colors.navy,
    fontWeight: '700',
  },
  profileCoordBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 6,
    paddingHorizontal: 4,
  },
  profileCoordBadgeText: {
    fontFamily: fonts.bodyMedium,
    fontSize: 11,
    color: colors.goldRich,
    fontWeight: '600',
  },

  // ── Phone Row with Country Badge (Matching Reference UI) ──
  phoneRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 12,
  },
  countryCodeBadge: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    paddingHorizontal: 16,
    height: 72,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    ...shadow.card,
  },
  countryCodeText: {
    fontFamily: fonts.bodyBold,
    fontSize: 16,
    fontWeight: '700',
    color: colors.navy,
  },

  // ── Actions Strip ──────────────────────────────────
  actionsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 6,
    marginTop: 6,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadow.card,
  },
  actionBtnRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
  },
  actionBtnRowText: {
    flex: 1,
    fontFamily: fonts.bodySemiBold,
    fontSize: 15,
    color: colors.navy,
    marginLeft: 12,
  },

  // Hero Card
  heroCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    paddingVertical: 26,
    paddingHorizontal: 20,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: colors.border,
    marginBottom: 16,
  },
  avatarWrapper: {
    position: 'relative',
    marginBottom: 16,
  },
  avatarGoldHalo: {
    padding: 3,
    borderRadius: 56,
    backgroundColor: colors.goldSoft,
    borderWidth: 2,
    borderColor: colors.gold,
  },
  avatarCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: colors.navy,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
  avatarInitialsContainer: {
    width: '100%',
    height: '100%',
    backgroundColor: colors.navy,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitialsText: {
    fontFamily: fonts.heading,
    fontSize: 36,
    color: colors.gold,
  },
  avatarLoadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(15, 46, 34, 0.7)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cameraBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: colors.navy,
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2.5,
    borderColor: '#FFFFFF',
  },
  userName: {
    fontFamily: fonts.heading,
    fontSize: 24,
    color: colors.charcoal,
    marginBottom: 4,
    textAlign: 'center',
  },
  userEmail: {
    fontFamily: fonts.body,
    fontSize: 14,
    color: colors.charcoalSub,
    marginBottom: 14,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 8,
  },
  personaBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 14,
    borderWidth: 1.5,
  },
  personaBadgeDiaspora: {
    backgroundColor: '#FDF8EB',
    borderColor: colors.goldBorder,
  },
  personaBadgeForeign: {
    backgroundColor: colors.navySoft,
    borderColor: '#C6D9CF',
  },
  personaBadgeText: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 12,
  },
  personaTextDiaspora: {
    color: '#8A6707',
  },
  personaTextForeign: {
    color: colors.navy,
  },
  verifiedPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.successSoft,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#BBE6C9',
  },
  verifiedPillText: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 12,
    color: colors.success,
  },

  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginLeft: 50,
  },

  // Sign out button
  signOutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#FED7D7',
    borderRadius: 16,
    paddingVertical: 15,
    marginBottom: 26,
  },
  signOutButtonText: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 15,
    color: '#DC2626',
  },

  // Footer
  footer: {
    alignItems: 'center',
    gap: 3,
  },
  footerBrand: {
    fontFamily: fonts.bodyBold,
    fontSize: 13,
    color: colors.gold,
    letterSpacing: 2,
  },
  footerTagline: {
    fontFamily: fonts.body,
    fontSize: 12,
    color: colors.charcoalSub,
  },
  footerVersion: {
    fontFamily: fonts.bodyMedium,
    fontSize: 10,
    color: colors.charcoalLight,
    letterSpacing: 0.6,
    marginTop: 2,
  },

  // Confirm Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(8, 28, 21, 0.55)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  confirmBox: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
    width: '100%',
    maxWidth: 360,
    borderWidth: 1.5,
    borderColor: colors.border,
  },
  confirmIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#FEE2E2',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  confirmTitle: {
    fontFamily: fonts.heading,
    fontSize: 22,
    color: colors.charcoal,
    marginBottom: 8,
  },
  confirmSubtitle: {
    fontFamily: fonts.body,
    fontSize: 14,
    color: colors.charcoalSub,
    textAlign: 'center',
    marginBottom: 22,
    lineHeight: 20,
  },
  confirmActionRow: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  cancelBtn: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  cancelBtnText: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 15,
    color: colors.charcoal,
  },
  confirmSignOutBtn: {
    flex: 1,
    backgroundColor: '#DC2626',
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
  },
  confirmSignOutText: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 15,
    color: '#FFFFFF',
  },

  // Notification Center quick link
  notifCenterLink: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderRadius: radius.lg,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(223, 183, 108, 0.35)',
    ...shadow.card,
  },
  notifCenterLinkLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  notifCenterLinkTitle: {
    fontFamily: fonts.bodyBold,
    fontSize: 15,
    color: colors.charcoal,
    letterSpacing: -0.2,
  },
  notifCenterLinkSub: {
    fontFamily: fonts.body,
    fontSize: 12,
    color: colors.charcoalSub,
    marginTop: 2,
  },

  // Notification Preferences
  prefsContainerCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: radius.lg,
    padding: 18,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadow.card,
  },
  prefsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  prefsCardTitle: {
    fontFamily: fonts.bodyBold,
    fontSize: 16,
    color: colors.charcoal,
    letterSpacing: -0.2,
  },
  prefsCardSubtitle: {
    fontFamily: fonts.body,
    fontSize: 12,
    color: colors.charcoalSub,
    marginTop: 2,
  },
  prefRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    gap: 12,
  },
  prefTextCol: {
    flex: 1,
    paddingRight: 8,
  },
  prefTitle: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 14,
    color: colors.charcoal,
    marginBottom: 2,
  },
  prefDesc: {
    fontFamily: fonts.body,
    fontSize: 12,
    color: colors.charcoalSub,
    lineHeight: 16,
  },
  prefDivider: {
    height: 1,
    backgroundColor: colors.separator,
    marginVertical: 4,
  },

  // Language & Localization styles
  langGrid: {
    gap: 10,
    marginTop: 4,
  },
  langCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surface,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: radius.md,
    borderWidth: 1.5,
    borderColor: colors.border,
  },
  langCardActive: {
    backgroundColor: '#FFFFFF',
    borderColor: colors.gold,
  },
  langCardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  langBadgePill: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  langBadgePillActive: {
    backgroundColor: colors.goldSoft,
    borderColor: colors.gold,
  },
  langBadgeText: {
    fontFamily: fonts.bodyBold,
    fontSize: 13,
    color: colors.charcoal,
    letterSpacing: 0.5,
  },
  langBadgeTextActive: {
    color: colors.goldText,
  },
  langNativeName: {
    fontFamily: fonts.bodyBold,
    fontSize: 15,
    color: colors.charcoal,
  },
  langNativeNameActive: {
    color: colors.goldText,
  },
  langEnglishName: {
    fontFamily: fonts.body,
    fontSize: 12,
    color: colors.charcoalSub,
    marginTop: 1,
  },
  langRadio: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1.5,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  langRadioActive: {
    backgroundColor: colors.gold,
    borderColor: colors.gold,
  },
});
