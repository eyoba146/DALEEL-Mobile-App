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

const REGIONS = [
  'Addis Ababa',
  'Amhara',
  'Oromia',
  'Tigray',
  'SNNPR',
  'Afar',
  'Harari',
  'Sidama',
  'Somali',
  'Dire Dawa',
  'Benishangul-Gumuz',
];

export default function DestinationDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { showToast } = useToast();
  const { canManageDestinations } = useAdminAuth();

  const isNew = id === 'new';

  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Form Fields
  const [name, setName] = useState('');
  const [region, setRegion] = useState(REGIONS[0]);
  const [blurb, setBlurb] = useState('');
  const [description, setDescription] = useState('');
  const [image, setImage] = useState('');
  const [elevation, setElevation] = useState('');
  const [bestTimeToVisit, setBestTimeToVisit] = useState('');
  const [unescoStatus, setUnescoStatus] = useState(false);
  const [rating, setRating] = useState('4.8');

  // Errors
  const [nameError, setNameError] = useState('');
  const [blurbError, setBlurbError] = useState('');

  useEffect(() => {
    if (!isNew && id) {
      loadDestination(id);
    }
  }, [id, isNew]);

  const loadDestination = async (destinationId: string) => {
    try {
      setLoading(true);
      const destinations = await adminApi.getDestinations();
      const match = destinations.find((d: any) => d.id === destinationId);
      if (match) {
        setName(match.name || '');
        setRegion(match.region || REGIONS[0]);
        setBlurb(match.blurb || '');
        setDescription(match.description || '');
        setImage(match.image || '');
        setElevation(match.elevation || '');
        setBestTimeToVisit(match.bestTimeToVisit || '');
        setUnescoStatus(match.unescoStatus ?? false);
        setRating(match.rating ? String(match.rating) : '4.8');
      } else {
        showToast('Destination record not found', 'error');
        router.back();
      }
    } catch (err: any) {
      showToast(err.message || 'Failed to load destination', 'error');
    } finally {
      setLoading(false);
    }
  };

  const validate = () => {
    let isValid = true;
    if (!name.trim()) {
      setNameError('Destination title is required');
      isValid = false;
    } else {
      setNameError('');
    }

    if (!blurb.trim()) {
      setBlurbError('Short summary blurb is required');
      isValid = false;
    } else {
      setBlurbError('');
    }

    return isValid;
  };

  const handleSave = async () => {
    if (!canManageDestinations) {
      showToast('You do not have clearance to manage destinations', 'error');
      return;
    }
    if (!validate()) return;

    try {
      setSaving(true);
      const payload = {
        name: name.trim(),
        region,
        blurb: blurb.trim(),
        description: description.trim() || blurb.trim(),
        image: image.trim() || 'https://images.unsplash.com/photo-1547471080-7cc2caa01a7e',
        elevation: elevation.trim() || null,
        bestTimeToVisit: bestTimeToVisit.trim() || null,
        unescoStatus,
        rating: parseFloat(rating) || 4.8,
      };

      if (isNew) {
        await adminApi.createDestination(payload);
        showToast('Heritage destination created', 'success');
      } else {
        await adminApi.updateDestination(id as string, payload);
        showToast('Destination updated', 'success');
      }
      router.back();
    } catch (err: any) {
      showToast(err.message || 'Failed to save destination', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = () => {
    Alert.alert(
      'Delete Destination',
      `Are you sure you want to remove "${name}" from heritage landmarks?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              setDeleting(true);
              await adminApi.deleteDestination(id as string);
              showToast('Destination deleted', 'success');
              router.back();
            } catch (err: any) {
              showToast(err.message || 'Failed to delete destination', 'error');
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
        title={isNew ? 'New Destination' : 'Edit Destination'}
        subtitle={isNew ? 'Curate Ethiopian Heritage Landmark' : name}
        showBack
        variant="navy"
        badge={unescoStatus ? 'UNESCO' : 'HERITAGE'}
      />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Core Landmark Info */}
        <Text style={styles.sectionHeading}>HERITAGE & LOCATION</Text>
        <Card style={styles.card}>
          <Input
            label="Landmark / Site Name *"
            value={name}
            onChangeText={(txt) => {
              setName(txt);
              if (nameError) setNameError('');
            }}
            placeholder="e.g. Rock-Hewn Churches of Lalibela"
            error={nameError}
          />

          <Text style={styles.fieldLabel}>Regional State *</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.regionPills}
          >
            {REGIONS.map((r) => {
              const selected = region === r;
              return (
                <TouchableOpacity
                  key={r}
                  style={[styles.pill, selected && styles.pillSelected]}
                  onPress={() => setRegion(r)}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.pillText, selected && styles.pillTextSelected]}>
                    {r}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          <Input
            label="Short Summary Blurb *"
            value={blurb}
            onChangeText={(txt) => {
              setBlurb(txt);
              if (blurbError) setBlurbError('');
            }}
            placeholder="Brief overview highlight for cards and diaspora mobile feed..."
            multiline
            numberOfLines={3}
            error={blurbError}
          />

          <Input
            label="Comprehensive Cultural Description"
            value={description}
            onChangeText={setDescription}
            placeholder="Detailed historical context, architectural significance, and visitor advice..."
            multiline
            numberOfLines={5}
          />

          <Input
            label="Cover Image URL"
            value={image}
            onChangeText={setImage}
            placeholder="https://images.unsplash.com/..."
          />
        </Card>

        {/* Travel Metadata */}
        <Text style={styles.sectionHeading}>VISITOR & GEOGRAPHIC METRICS</Text>
        <Card style={styles.card}>
          <Input
            label="Elevation"
            value={elevation}
            onChangeText={setElevation}
            placeholder="e.g. 2,500m above sea level"
          />

          <Input
            label="Optimal Season to Visit"
            value={bestTimeToVisit}
            onChangeText={setBestTimeToVisit}
            placeholder="e.g. October to March (Dry Season)"
          />

          <Input
            label="Editorial Rating (1.0 - 5.0)"
            value={rating}
            onChangeText={setRating}
            placeholder="4.9"
            keyboardType="decimal-pad"
          />
        </Card>

        {/* UNESCO Status */}
        <Text style={styles.sectionHeading}>INTERNATIONAL HERITAGE CLASSIFICATION</Text>
        <Card style={styles.card}>
          <View style={styles.switchRow}>
            <View style={styles.switchTextWrap}>
              <Text style={styles.switchTitle}>UNESCO World Heritage Site</Text>
              <Text style={styles.switchSub}>
                Renders the prestigious gold UNESCO emblem badge on mobile screens
              </Text>
            </View>
            <Switch
              value={unescoStatus}
              onValueChange={setUnescoStatus}
              trackColor={{ false: colors.border, true: colors.gold }}
              thumbColor={unescoStatus ? colors.navy : '#FFFFFF'}
            />
          </View>
        </Card>

        {/* Action Buttons */}
        <View style={styles.actions}>
          <Button
            title={isNew ? 'Publish Landmark' : 'Save Landmark'}
            onPress={handleSave}
            loading={saving}
            icon={<Ionicons name="compass-outline" size={18} color="#FFFFFF" />}
          />

          {!isNew && (
            <Button
              title="Delete Landmark"
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
  regionPills: {
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
