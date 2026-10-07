import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { ScreenHeader } from '../../components/ScreenHeader';
import { Card } from '../../components/Card';
import { Input } from '../../components/Input';
import { Button } from '../../components/Button';
import { adminApi } from '../../lib/api';
import { useToast } from '../../lib/toast-context';
import { useAdminAuth } from '../../lib/auth-context';
import { colors, type, fonts, radius } from '../../theme/tokens';

const SERVICE_CATEGORIES = [
  'Legal & Relocation',
  'Banking & Diaspora Accounts',
  'Healthcare & Concierge',
  'Real Estate & Architecture',
  'Transport & Logistics',
  'Hospitality & Tourism',
  'Government & Embassies',
  'Emergency & Police',
];

export default function ServiceDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { showToast } = useToast();
  const { canManageServices } = useAdminAuth();

  const isNew = id === 'new';

  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Form Fields
  const [name, setName] = useState('');
  const [category, setCategory] = useState(SERVICE_CATEGORIES[0]);
  const [location, setLocation] = useState('');
  const [address, setAddress] = useState('');
  const [blurb, setBlurb] = useState('');
  const [image, setImage] = useState('');
  const [phone, setPhone] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [email, setEmail] = useState('');
  const [verified, setVerified] = useState(true);

  // Errors
  const [nameError, setNameError] = useState('');
  const [locationError, setLocationError] = useState('');
  const [blurbError, setBlurbError] = useState('');

  useEffect(() => {
    if (!isNew && id) {
      loadService(id);
    }
  }, [id, isNew]);

  const loadService = async (serviceId: string) => {
    try {
      setLoading(true);
      const services = await adminApi.getServices();
      const match = services.find((s: any) => s.id === serviceId);
      if (match) {
        setName(match.name || '');
        setCategory(match.category || SERVICE_CATEGORIES[0]);
        setLocation(match.location || '');
        setAddress(match.address || '');
        setBlurb(match.blurb || '');
        setImage(match.image || '');
        setPhone(match.phone || '');
        setWhatsapp(match.whatsapp || '');
        setEmail(match.email || '');
        setVerified(match.verified ?? true);
      } else {
        showToast('Service record not found', 'error');
        router.back();
      }
    } catch (err: any) {
      showToast(err.message || 'Failed to load service', 'error');
    } finally {
      setLoading(false);
    }
  };

  const validate = () => {
    let isValid = true;
    if (!name.trim()) {
      setNameError('Service name is required');
      isValid = false;
    } else {
      setNameError('');
    }

    if (!location.trim()) {
      setLocationError('City / Location is required');
      isValid = false;
    } else {
      setLocationError('');
    }

    if (!blurb.trim()) {
      setBlurbError('Description / summary is required');
      isValid = false;
    } else {
      setBlurbError('');
    }

    return isValid;
  };

  const handleSave = async () => {
    if (!canManageServices) {
      showToast('You do not have clearance to manage services', 'error');
      return;
    }
    if (!validate()) return;

    try {
      setSaving(true);
      const payload = {
        name: name.trim(),
        category,
        location: location.trim(),
        address: address.trim() || null,
        blurb: blurb.trim(),
        image: image.trim() || 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab',
        phone: phone.trim() || null,
        whatsapp: whatsapp.trim() || null,
        email: email.trim() || null,
        verified,
      };

      if (isNew) {
        await adminApi.createService(payload);
        showToast('Service successfully created', 'success');
      } else {
        await adminApi.updateService(id as string, payload);
        showToast('Service updated successfully', 'success');
      }
      router.back();
    } catch (err: any) {
      showToast(err.message || 'Failed to save service', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = () => {
    Alert.alert(
      'Delete Service',
      `Are you sure you want to delete "${name}"? This action cannot be reversed.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              setDeleting(true);
              await adminApi.deleteService(id as string);
              showToast('Service deleted', 'success');
              router.back();
            } catch (err: any) {
              showToast(err.message || 'Failed to delete service', 'error');
            } finally {
              setDeleting(false);
            }
          },
        },
      ]
    );
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScreenHeader
        title={isNew ? 'New Service' : 'Edit Service'}
        subtitle={isNew ? 'Create institutional directory partner' : name}
        showBack
        variant="navy"
        badge={verified ? 'VERIFIED' : 'PENDING'}
      />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Core Identity */}
        <Text style={styles.sectionHeading}>ORGANIZATION & IDENTITY</Text>
        <Card style={styles.card}>
          <Input
            label="Service / Partner Name *"
            value={name}
            onChangeText={(txt) => {
              setName(txt);
              if (nameError) setNameError('');
            }}
            placeholder="e.g. Addis Relocation & Concierge Legal"
            error={nameError}
          />

          <Text style={styles.fieldLabel}>Sector / Category *</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.categoryPills}
          >
            {SERVICE_CATEGORIES.map((cat) => {
              const selected = category === cat;
              return (
                <TouchableOpacity
                  key={cat}
                  style={[styles.pill, selected && styles.pillSelected]}
                  onPress={() => setCategory(cat)}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.pillText, selected && styles.pillTextSelected]}>
                    {cat}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          <Input
            label="City / Region *"
            value={location}
            onChangeText={(txt) => {
              setLocation(txt);
              if (locationError) setLocationError('');
            }}
            placeholder="e.g. Addis Ababa (Bole Sub-city)"
            error={locationError}
          />

          <Input
            label="Street Address / Building"
            value={address}
            onChangeText={setAddress}
            placeholder="e.g. Morning Star Mall, 4th Floor"
          />

          <Input
            label="Description / Editorial Summary *"
            value={blurb}
            onChangeText={(txt) => {
              setBlurb(txt);
              if (blurbError) setBlurbError('');
            }}
            placeholder="Describe legal or concierge services provided to the Diaspora..."
            multiline
            numberOfLines={4}
            error={blurbError}
          />

          <Input
            label="Image URL"
            value={image}
            onChangeText={setImage}
            placeholder="https://images.unsplash.com/..."
          />
        </Card>

        {/* Contact Information */}
        <Text style={styles.sectionHeading}>COMMUNICATIONS & DIRECT CHANNELS</Text>
        <Card style={styles.card}>
          <Input
            label="Official Phone Number"
            value={phone}
            onChangeText={setPhone}
            placeholder="+251 911 234 567"
            keyboardType="phone-pad"
          />

          <Input
            label="WhatsApp Number (with country code)"
            value={whatsapp}
            onChangeText={setWhatsapp}
            placeholder="+251911234567"
            keyboardType="phone-pad"
          />

          <Input
            label="Official Contact Email"
            value={email}
            onChangeText={setEmail}
            placeholder="inquiries@partner.et"
            keyboardType="email-address"
            autoCapitalize="none"
          />
        </Card>

        {/* Verification Status Toggle */}
        <Text style={styles.sectionHeading}>GOVERNANCE STATUS</Text>
        <Card style={styles.card}>
          <View style={styles.switchRow}>
            <View style={styles.switchTextWrap}>
              <Text style={styles.switchTitle}>Verified Institutional Partner</Text>
              <Text style={styles.switchSub}>
                Displays the Warm Gold verification badge on the customer mobile app
              </Text>
            </View>
            <Switch
              value={verified}
              onValueChange={setVerified}
              trackColor={{ false: colors.border, true: colors.gold }}
              thumbColor={verified ? colors.navy : '#FFFFFF'}
            />
          </View>
        </Card>

        {/* Action Buttons */}
        <View style={styles.actions}>
          <Button
            title={isNew ? 'Create Directory Service' : 'Save Changes'}
            onPress={handleSave}
            loading={saving}
            icon={<Ionicons name="checkmark-circle-outline" size={18} color="#FFFFFF" />}
          />

          {!isNew && (
            <Button
              title="Delete Service"
              variant="danger"
              onPress={handleDelete}
              loading={deleting}
              icon={<Ionicons name="trash-outline" size={18} color="#FFFFFF" />}
            />
          )}

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
  fieldLabel: {
    ...type.caption,
    fontFamily: fonts.sansMedium,
    color: colors.textPrimary,
    marginBottom: 8,
  },
  categoryPills: {
    gap: 8,
    paddingBottom: 14,
  },
  pill: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: radius.full,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  pillSelected: {
    backgroundColor: colors.navy,
    borderColor: colors.gold,
  },
  pillText: {
    ...type.caption,
    color: colors.textSecondary,
    fontFamily: fonts.sansMedium,
  },
  pillTextSelected: {
    color: '#FFFFFF',
    fontFamily: fonts.sansBold,
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 14,
  },
  switchTextWrap: {
    flex: 1,
  },
  switchTitle: {
    ...type.body,
    fontFamily: fonts.sansSemiBold,
    color: colors.textPrimary,
  },
  switchSub: {
    ...type.tiny,
    color: colors.textSecondary,
    marginTop: 2,
  },
  actions: {
    gap: 10,
    marginTop: 16,
  },
});
