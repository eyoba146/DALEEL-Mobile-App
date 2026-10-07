import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
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

const INVESTMENT_SECTORS = [
  'Agro-Processing & Horticulture',
  'Renewable Energy & Solar',
  'Hospitality & Eco-Lodges',
  'Light Manufacturing & Textiles',
  'Tech & Digital Services',
  'Healthcare & Pharmaceuticals',
  'Logistics & Warehousing',
];

export default function InvestmentDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { showToast } = useToast();
  const { canManageInvestments } = useAdminAuth();

  const isNew = id === 'new';

  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Form Fields
  const [title, setTitle] = useState('');
  const [sector, setSector] = useState(INVESTMENT_SECTORS[0]);
  const [location, setLocation] = useState('');
  const [minInvestment, setMinInvestment] = useState('');
  const [blurb, setBlurb] = useState('');
  const [description, setDescription] = useState('');
  const [expectedReturn, setExpectedReturn] = useState('');
  const [timeline, setTimeline] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [image, setImage] = useState('');

  // Errors
  const [titleError, setTitleError] = useState('');
  const [locationError, setLocationError] = useState('');
  const [minError, setMinError] = useState('');
  const [blurbError, setBlurbError] = useState('');

  useEffect(() => {
    if (!isNew && id) {
      loadInvestment(id);
    }
  }, [id, isNew]);

  const loadInvestment = async (invId: string) => {
    try {
      setLoading(true);
      const items = await adminApi.getInvestments();
      const match = items.find((item: any) => item.id === invId);
      if (match) {
        setTitle(match.title || '');
        setSector(match.sector || INVESTMENT_SECTORS[0]);
        setLocation(match.location || '');
        setMinInvestment(match.minInvestment ? String(match.minInvestment) : '');
        setBlurb(match.blurb || '');
        setDescription(match.description || '');
        setExpectedReturn(match.expectedReturn || '');
        setTimeline(match.timeline || '');
        setContactEmail(match.contactEmail || '');
        setContactPhone(match.contactPhone || '');
        setImage(match.image || '');
      } else {
        showToast('Prospectus not found', 'error');
        router.back();
      }
    } catch (err: any) {
      showToast(err.message || 'Failed to load opportunity', 'error');
    } finally {
      setLoading(false);
    }
  };

  const validate = () => {
    let isValid = true;
    if (!title.trim()) {
      setTitleError('Venture prospectus title is required');
      isValid = false;
    } else {
      setTitleError('');
    }

    if (!location.trim()) {
      setLocationError('Project region / location is required');
      isValid = false;
    } else {
      setLocationError('');
    }

    if (!minInvestment.trim() || isNaN(Number(minInvestment))) {
      setMinError('Valid minimum entry capital in USD is required');
      isValid = false;
    } else {
      setMinError('');
    }

    if (!blurb.trim()) {
      setBlurbError('Executive prospectus summary is required');
      isValid = false;
    } else {
      setBlurbError('');
    }

    return isValid;
  };

  const handleSave = async () => {
    if (!canManageInvestments) {
      showToast('You do not have clearance to manage investments', 'error');
      return;
    }
    if (!validate()) return;

    try {
      setSaving(true);
      const payload = {
        title: title.trim(),
        sector,
        location: location.trim(),
        minInvestment: parseFloat(minInvestment),
        blurb: blurb.trim(),
        description: description.trim() || blurb.trim(),
        expectedReturn: expectedReturn.trim() || null,
        timeline: timeline.trim() || null,
        contactEmail: contactEmail.trim() || null,
        contactPhone: contactPhone.trim() || null,
        image: image.trim() || 'https://images.unsplash.com/photo-1460925895917-afdab827c52f',
      };

      if (isNew) {
        await adminApi.createInvestment(payload);
        showToast('Investment opportunity published', 'success');
      } else {
        await adminApi.updateInvestment(id as string, payload);
        showToast('Prospectus updated', 'success');
      }
      router.back();
    } catch (err: any) {
      showToast(err.message || 'Failed to save investment', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = () => {
    Alert.alert(
      'Remove Prospectus',
      `Are you sure you want to delete "${title}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              setDeleting(true);
              await adminApi.deleteInvestment(id as string);
              showToast('Investment prospectus deleted', 'success');
              router.back();
            } catch (err: any) {
              showToast(err.message || 'Failed to delete investment', 'error');
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
        title={isNew ? 'New Opportunity' : 'Edit Prospectus'}
        subtitle={isNew ? 'Publish Diaspora investment venture' : title}
        showBack
        variant="navy"
        badge={sector.toUpperCase()}
      />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Venture Details */}
        <Text style={styles.sectionHeading}>VENTURE SPECIFICATIONS</Text>
        <Card style={styles.card}>
          <Input
            label="Prospectus Title *"
            value={title}
            onChangeText={(txt) => {
              setTitle(txt);
              if (titleError) setTitleError('');
            }}
            placeholder="e.g. Export Horticulture & Cold Chain Facility"
            error={titleError}
          />

          <Text style={styles.fieldLabel}>Industry Sector *</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.sectorPills}
          >
            {INVESTMENT_SECTORS.map((sec) => {
              const selected = sector === sec;
              return (
                <TouchableOpacity
                  key={sec}
                  style={[styles.pill, selected && styles.pillSelected]}
                  onPress={() => setSector(sec)}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.pillText, selected && styles.pillTextSelected]}>
                    {sec}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          <Input
            label="Project Location *"
            value={location}
            onChangeText={(txt) => {
              setLocation(txt);
              if (locationError) setLocationError('');
            }}
            placeholder="e.g. Hawassa Industrial Park, Sidama"
            error={locationError}
          />

          <Input
            label="Minimum Ticket Size ($ USD) *"
            value={minInvestment}
            onChangeText={(txt) => {
              setMinInvestment(txt);
              if (minError) setMinError('');
            }}
            placeholder="e.g. 50000"
            keyboardType="numeric"
            error={minError}
          />

          <Input
            label="Executive Summary *"
            value={blurb}
            onChangeText={(txt) => {
              setBlurb(txt);
              if (blurbError) setBlurbError('');
            }}
            placeholder="Key investment thesis, government incentives, market demand..."
            multiline
            numberOfLines={4}
            error={blurbError}
          />

          <Input
            label="Detailed Financial Narrative"
            value={description}
            onChangeText={setDescription}
            placeholder="Capital expenditure breakdown, equity structure, exit strategy..."
            multiline
            numberOfLines={5}
          />

          <Input
            label="Prospectus Cover Image URL"
            value={image}
            onChangeText={setImage}
            placeholder="https://images.unsplash.com/..."
          />
        </Card>

        {/* Financial Metrics */}
        <Text style={styles.sectionHeading}>FINANCIAL PROJECTIONS & TIMELINE</Text>
        <Card style={styles.card}>
          <Input
            label="Projected Return / IRR"
            value={expectedReturn}
            onChangeText={setExpectedReturn}
            placeholder="e.g. 20% - 25% Projected IRR"
          />

          <Input
            label="Execution Timeline"
            value={timeline}
            onChangeText={setTimeline}
            placeholder="e.g. 18 Months to Commissioning"
          />

          <Input
            label="Desk Officer Contact Email"
            value={contactEmail}
            onChangeText={setContactEmail}
            placeholder="invest@daleel.et"
            keyboardType="email-address"
            autoCapitalize="none"
          />

          <Input
            label="Inquiry Desk Phone"
            value={contactPhone}
            onChangeText={setContactPhone}
            placeholder="+251 11 551 2345"
            keyboardType="phone-pad"
          />
        </Card>

        {/* Action Buttons */}
        <View style={styles.actions}>
          <Button
            title={isNew ? 'Publish Prospectus' : 'Save Changes'}
            onPress={handleSave}
            loading={saving}
            icon={<Ionicons name="trending-up-outline" size={18} color="#FFFFFF" />}
          />

          {!isNew && (
            <Button
              title="Delete Prospectus"
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
  sectorPills: {
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
  actions: {
    gap: 10,
    marginTop: 16,
  },
});
