import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import { ReviewItem, reviewsApi } from '../lib/api';
import { useAuth } from '../lib/auth-context';
import { colors, fonts, radius, spacing } from '../theme/tokens';

type Props = {
  visible: boolean;
  onClose: () => void;
  targetType: 'service' | 'product' | 'destination';
  targetId: string;
  targetName: string;
  onSuccess: (newReview: ReviewItem) => void;
};

const RATING_LABELS: Record<number, string> = {
  5: 'Exceptional (Masterpiece / 5-Star)',
  4: 'Very Good (High Quality)',
  3: 'Average (Met Expectations)',
  2: 'Fair (Room for Improvement)',
  1: 'Disappointing',
};

export const WriteReviewModal: React.FC<Props> = ({
  visible,
  onClose,
  targetType,
  targetId,
  targetName,
  onSuccess,
}) => {
  const { user, token } = useAuth();
  const [rating, setRating] = useState(5);
  const [title, setTitle] = useState('');
  const [comment, setComment] = useState('');
  const [authorName, setAuthorName] = useState(user?.name ?? '');
  const [photos, setPhotos] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handlePickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.7,
      });

      if (!result.canceled && result.assets && result.assets[0]?.uri) {
        if (photos.length >= 3) {
          setErrorMsg('Maximum 3 photos per review');
          return;
        }
        setPhotos([...photos, result.assets[0].uri]);
        setErrorMsg(null);
      }
    } catch {
      setErrorMsg('Unable to access photo library');
    }
  };

  const handleRemovePhoto = (index: number) => {
    setPhotos(photos.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (!comment.trim()) {
      setErrorMsg('Please write a brief comment describing your experience.');
      return;
    }

    setSubmitting(true);
    setErrorMsg(null);

    try {
      const res = await reviewsApi.createReview(
        {
          targetType,
          targetId,
          rating,
          title: title.trim() || undefined,
          comment: comment.trim(),
          photos: photos.length > 0 ? photos : undefined,
          authorName: authorName.trim() || (user ? user.name : 'Diaspora Community Member'),
        },
        token
      );

      if (res?.review) {
        onSuccess(res.review);
        // Reset form
        setTitle('');
        setComment('');
        setPhotos([]);
        setRating(5);
        onClose();
      }
    } catch (err: any) {
      setErrorMsg(err?.message || 'Could not submit review at this time. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.modalOverlay}
      >
        <TouchableWithoutFeedback onPress={onClose}>
          <View style={styles.backdrop} />
        </TouchableWithoutFeedback>

        <View style={styles.modalCard}>
          {/* Header */}
          <View style={styles.modalHeader}>
            <View style={styles.titleGroup}>
              <View style={styles.goldBadge}>
                <Ionicons name="star" size={16} color={colors.navy} />
              </View>
              <View>
                <Text style={styles.modalTitle}>Community Review</Text>
                <Text style={styles.modalSubtitle} numberOfLines={1}>
                  {targetName}
                </Text>
              </View>
            </View>
            <TouchableOpacity style={styles.closeBtn} onPress={onClose} disabled={submitting}>
              <Ionicons name="close" size={20} color={colors.charcoalSub} />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 460 }}>
            {errorMsg && (
              <View style={styles.errorNotice}>
                <Ionicons name="alert-circle-outline" size={16} color="#DC2626" style={{ marginRight: 6 }} />
                <Text style={styles.errorNoticeText}>{errorMsg}</Text>
              </View>
            )}

            {/* Interactive Star Rating Selector */}
            <View style={styles.ratingSelectorBox}>
              <Text style={styles.sectionLabel}>Your Overall Rating</Text>
              <View style={styles.starsRow}>
                {[1, 2, 3, 4, 5].map((star) => {
                  const filled = star <= rating;
                  return (
                    <TouchableOpacity
                      key={star}
                      onPress={() => setRating(star)}
                      activeOpacity={0.7}
                      hitSlop={{ top: 8, bottom: 8, left: 6, right: 6 }}
                    >
                      <Ionicons
                        name={filled ? 'star' : 'star-outline'}
                        size={32}
                        color={filled ? colors.gold : colors.charcoalLight}
                        style={{ marginHorizontal: 3 }}
                      />
                    </TouchableOpacity>
                  );
                })}
              </View>
              <Text style={styles.ratingScoreHint}>{RATING_LABELS[rating]}</Text>
            </View>

            {/* Author Name */}
            <Text style={styles.inputLabel}>Your Name / Diaspora Location *</Text>
            <TextInput
              style={styles.inputField}
              placeholder="e.g. Hanna Berhane (Atlanta, USA)"
              placeholderTextColor={colors.charcoalLight}
              value={authorName}
              onChangeText={setAuthorName}
            />

            {/* Review Title */}
            <Text style={styles.inputLabel}>Review Headline</Text>
            <TextInput
              style={styles.inputField}
              placeholder="Summarize your experience in one sentence…"
              placeholderTextColor={colors.charcoalLight}
              value={title}
              onChangeText={setTitle}
            />

            {/* Review Comment */}
            <Text style={styles.inputLabel}>Detailed Feedback / Craft Experience *</Text>
            <TextInput
              style={[styles.inputField, styles.textArea]}
              placeholder="Describe the authenticity, customer coordination, craftsmanship, packaging, or timeliness…"
              placeholderTextColor={colors.charcoalLight}
              multiline
              numberOfLines={4}
              value={comment}
              onChangeText={setComment}
            />

            {/* Photo Attachments */}
            <Text style={styles.inputLabel}>Attach Photos of Received Piece (Optional)</Text>
            <View style={styles.photoPickerRow}>
              {photos.map((uri, idx) => (
                <View key={idx} style={styles.photoThumbWrap}>
                  <Image source={{ uri }} style={styles.photoThumb} />
                  <TouchableOpacity
                    style={styles.photoRemoveBtn}
                    onPress={() => handleRemovePhoto(idx)}
                  >
                    <Ionicons name="close" size={12} color="#FFFFFF" />
                  </TouchableOpacity>
                </View>
              ))}

              {photos.length < 3 && (
                <TouchableOpacity
                  style={styles.addPhotoBtn}
                  onPress={handlePickImage}
                  activeOpacity={0.8}
                >
                  <Ionicons name="camera-outline" size={20} color={colors.goldRich} />
                  <Text style={styles.addPhotoText}>Add Photo</Text>
                </TouchableOpacity>
              )}
            </View>

            {/* Verified Badge Notice */}
            <View style={styles.verifiedNoticeBox}>
              <Ionicons name="shield-checkmark" size={16} color={colors.goldRich} style={{ marginRight: 8 }} />
              <Text style={styles.verifiedNoticeText}>
                Your review will be tagged with a Verified Diaspora Member badge to guide the community.
              </Text>
            </View>

            {/* Submit Button */}
            <TouchableOpacity
              style={[styles.submitBtn, submitting && { opacity: 0.7 }]}
              onPress={handleSubmit}
              disabled={submitting}
              activeOpacity={0.88}
            >
              {submitting ? (
                <ActivityIndicator size="small" color={colors.navy} />
              ) : (
                <>
                  <Text style={styles.submitBtnText}>Post Community Review</Text>
                  <Ionicons name="checkmark-circle" size={18} color={colors.navy} style={{ marginLeft: 6 }} />
                </>
              )}
            </TouchableOpacity>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  backdrop: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(7, 21, 43, 0.7)',
  },
  modalCard: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    padding: 20,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 8 },
    elevation: 8,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.06)',
    paddingBottom: 12,
  },
  titleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  goldBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.gold,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.navy,
    fontFamily: fonts.heading,
  },
  modalSubtitle: {
    fontSize: 11.5,
    color: colors.charcoalSub,
    fontFamily: fonts.body,
    marginTop: 1,
  },
  closeBtn: {
    padding: 4,
  },
  errorNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF2F2',
    borderRadius: radius.md,
    padding: 10,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#FCA5A5',
  },
  errorNoticeText: {
    fontSize: 12,
    color: '#B91C1C',
    fontFamily: fonts.bodyMedium,
    flex: 1,
  },
  ratingSelectorBox: {
    alignItems: 'center',
    backgroundColor: '#FAF7F0',
    borderRadius: 16,
    paddingVertical: 14,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: 'rgba(223, 183, 108, 0.3)',
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.navy,
    fontFamily: fonts.bodyBold,
    marginBottom: 8,
  },
  starsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  ratingScoreHint: {
    fontSize: 12,
    fontFamily: fonts.bodySemiBold,
    color: colors.goldText,
  },
  inputLabel: {
    fontSize: 11.5,
    fontWeight: '700',
    color: colors.navy,
    fontFamily: fonts.bodyBold,
    marginBottom: 5,
    marginTop: 10,
  },
  inputField: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: radius.md,
    paddingHorizontal: 12,
    paddingVertical: 9,
    fontSize: 13,
    color: colors.charcoal,
    fontFamily: fonts.body,
  },
  textArea: {
    height: 75,
    textAlignVertical: 'top',
  },
  photoPickerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 6,
  },
  photoThumbWrap: {
    position: 'relative',
    width: 60,
    height: 60,
    borderRadius: 10,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.gold,
  },
  photoThumb: {
    width: '100%',
    height: '100%',
  },
  photoRemoveBtn: {
    position: 'absolute',
    top: 2,
    right: 2,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: 'rgba(0,0,0,0.7)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  addPhotoBtn: {
    width: 80,
    height: 60,
    borderRadius: 10,
    backgroundColor: '#FAF7F0',
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: colors.gold,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addPhotoText: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.goldText,
    marginTop: 2,
  },
  verifiedNoticeBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    borderRadius: radius.md,
    padding: 10,
    marginTop: 14,
    marginBottom: 16,
  },
  verifiedNoticeText: {
    fontSize: 11,
    color: colors.charcoalSub,
    lineHeight: 15,
    flex: 1,
    fontFamily: fonts.body,
  },
  submitBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.gold,
    paddingVertical: 13,
    borderRadius: radius.pill,
    shadowColor: colors.gold,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 3,
    marginBottom: 8,
  },
  submitBtnText: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.navy,
    fontFamily: fonts.bodyBold,
  },
});
