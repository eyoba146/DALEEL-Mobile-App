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

const EVENT_CATEGORIES = [
  'Diaspora Summits',
  'Cultural Festivals',
  'Investment Forums',
  'Tech & Innovation',
  'Heritage Tours',
  'Arts & Music',
];

export default function EventDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { showToast } = useToast();
  const { canManageEvents } = useAdminAuth();

  const isNew = id === 'new';

  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Form Fields
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState(EVENT_CATEGORIES[0]);
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [city, setCity] = useState('');
  const [venue, setVenue] = useState('');
  const [price, setPrice] = useState('Free Registration');
  const [organizer, setOrganizer] = useState('');
  const [capacity, setCapacity] = useState('500');
  const [description, setDescription] = useState('');
  const [agenda, setAgenda] = useState('');
  const [image, setImage] = useState('');

  // Errors
  const [titleError, setTitleError] = useState('');
  const [dateError, setDateError] = useState('');
  const [cityError, setCityError] = useState('');

  useEffect(() => {
    if (!isNew && id) {
      loadEvent(id);
    }
  }, [id, isNew]);

  const loadEvent = async (eventId: string) => {
    try {
      setLoading(true);
      const events = await adminApi.getEvents();
      const match = events.find((e: any) => e.id === eventId);
      if (match) {
        setTitle(match.title || '');
        setCategory(match.category || EVENT_CATEGORIES[0]);
        setDate(match.date ? match.date.split('T')[0] : '');
        setTime(match.time || '');
        setCity(match.city || '');
        setVenue(match.venue || '');
        setPrice(match.price || 'Free Registration');
        setOrganizer(match.organizer || '');
        setCapacity(match.capacity ? String(match.capacity) : '');
        setDescription(match.description || '');
        setAgenda(match.agenda || '');
        setImage(match.image || '');
      } else {
        showToast('Event not found', 'error');
        router.back();
      }
    } catch (err: any) {
      showToast(err.message || 'Failed to load event', 'error');
    } finally {
      setLoading(false);
    }
  };

  const validate = () => {
    let isValid = true;
    if (!title.trim()) {
      setTitleError('Event title is required');
      isValid = false;
    } else {
      setTitleError('');
    }

    if (!date.trim()) {
      setDateError('Date is required (YYYY-MM-DD)');
      isValid = false;
    } else {
      setDateError('');
    }

    if (!city.trim()) {
      setCityError('City location is required');
      isValid = false;
    } else {
      setCityError('');
    }

    return isValid;
  };

  const handleSave = async () => {
    if (!canManageEvents) {
      showToast('You do not have clearance to manage events', 'error');
      return;
    }
    if (!validate()) return;

    try {
      setSaving(true);
      const payload = {
        title: title.trim(),
        category,
        date: date.trim(),
        time: time.trim() || null,
        city: city.trim(),
        venue: venue.trim() || null,
        price: price.trim() || 'Free Registration',
        organizer: organizer.trim() || null,
        capacity: capacity ? parseInt(capacity, 10) : null,
        description: description.trim() || null,
        agenda: agenda.trim() || null,
        image: image.trim() || 'https://images.unsplash.com/photo-1540575467063-178a50c2df87',
      };

      if (isNew) {
        await adminApi.createEvent(payload);
        showToast('Summit event created', 'success');
      } else {
        await adminApi.updateEvent(id as string, payload);
        showToast('Summit event updated', 'success');
      }
      router.back();
    } catch (err: any) {
      showToast(err.message || 'Failed to save event', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = () => {
    Alert.alert(
      'Cancel & Delete Event',
      `Are you sure you want to delete "${title}"? All scheduled tickets will be impacted.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              setDeleting(true);
              await adminApi.deleteEvent(id as string);
              showToast('Event deleted', 'success');
              router.back();
            } catch (err: any) {
              showToast(err.message || 'Failed to delete event', 'error');
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
        title={isNew ? 'New Event' : 'Edit Event'}
        subtitle={isNew ? 'Publish Diaspora gathering or summit' : title}
        showBack
        variant="navy"
        badge={category.toUpperCase()}
      />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Gate Check-In Shortcut if existing */}
        {!isNew && (
          <TouchableOpacity
            style={styles.checkInBanner}
            onPress={() => router.push({ pathname: '/event/scanner', params: { eventId: id } })}
            activeOpacity={0.8}
          >
            <View style={styles.bannerIconBox}>
              <Ionicons name="qr-code" size={24} color={colors.gold} />
            </View>
            <View style={styles.bannerTextWrap}>
              <Text style={styles.bannerTitle}>Open Live Gate Check-In Desk</Text>
              <Text style={styles.bannerSub}>Scan passes or search registered attendees for this summit</Text>
            </View>
            <Ionicons name="arrow-forward" size={20} color={colors.gold} />
          </TouchableOpacity>
        )}

        {/* Core Event Info */}
        <Text style={styles.sectionHeading}>EVENT DETAILS & AGENDA</Text>
        <Card style={styles.card}>
          <Input
            label="Summit / Event Title *"
            value={title}
            onChangeText={(txt) => {
              setTitle(txt);
              if (titleError) setTitleError('');
            }}
            placeholder="e.g. Ethiopia Diaspora Business Summit 2026"
            error={titleError}
          />

          <Text style={styles.fieldLabel}>Category *</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.categoryPills}
          >
            {EVENT_CATEGORIES.map((cat) => {
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
            label="Date (YYYY-MM-DD) *"
            value={date}
            onChangeText={(txt) => {
              setDate(txt);
              if (dateError) setDateError('');
            }}
            placeholder="2026-11-20"
            error={dateError}
          />

          <Input
            label="Schedule / Hours"
            value={time}
            onChangeText={setTime}
            placeholder="09:00 AM - 05:00 PM (EAT)"
          />

          <Input
            label="Host City / Region *"
            value={city}
            onChangeText={(txt) => {
              setCity(txt);
              if (cityError) setCityError('');
            }}
            placeholder="Addis Ababa"
            error={cityError}
          />

          <Input
            label="Venue / Hall Name"
            value={venue}
            onChangeText={setVenue}
            placeholder="Skylight Hotel, Grand Ballroom"
          />

          <Input
            label="Description & Highlights"
            value={description}
            onChangeText={setDescription}
            placeholder="Keynote speakers, diaspora matchmaking sessions..."
            multiline
            numberOfLines={4}
          />

          <Input
            label="Official Cover Image URL"
            value={image}
            onChangeText={setImage}
            placeholder="https://images.unsplash.com/..."
          />
        </Card>

        {/* Logistics & Registration */}
        <Text style={styles.sectionHeading}>LOGISTICS & TICKETING</Text>
        <Card style={styles.card}>
          <Input
            label="Registration Fee / Ticket Type"
            value={price}
            onChangeText={setPrice}
            placeholder="Free Registration / 300 ETB"
          />

          <Input
            label="Maximum Hall Capacity (Guests)"
            value={capacity}
            onChangeText={setCapacity}
            placeholder="500"
            keyboardType="number-pad"
          />

          <Input
            label="Organizer / Host Entity"
            value={organizer}
            onChangeText={setOrganizer}
            placeholder="Ethiopian Diaspora Service & DALEEL"
          />

          <Input
            label="Agenda Breakdown"
            value={agenda}
            onChangeText={setAgenda}
            placeholder="Morning: Keynote | Afternoon: Investment Pitches"
            multiline
            numberOfLines={3}
          />
        </Card>

        {/* Action Buttons */}
        <View style={styles.actions}>
          <Button
            title={isNew ? 'Publish Event' : 'Save Changes'}
            onPress={handleSave}
            loading={saving}
            icon={<Ionicons name="calendar-outline" size={18} color="#FFFFFF" />}
          />

          {!isNew && (
            <Button
              title="Delete Event"
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
  checkInBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.navy,
    borderRadius: radius.lg,
    padding: 14,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(223, 183, 108, 0.4)',
    gap: 12,
  },
  bannerIconBox: {
    width: 44,
    height: 44,
    borderRadius: radius.md,
    backgroundColor: 'rgba(223, 183, 108, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bannerTextWrap: {
    flex: 1,
  },
  bannerTitle: {
    ...type.body,
    fontFamily: fonts.sansBold,
    color: '#FFFFFF',
  },
  bannerSub: {
    ...type.tiny,
    color: 'rgba(255, 255, 255, 0.7)',
    marginTop: 2,
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
  actions: {
    gap: 10,
    marginTop: 16,
  },
});
