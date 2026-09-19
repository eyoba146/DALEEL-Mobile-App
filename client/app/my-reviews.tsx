import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Modal,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import ScreenHeader from '../components/ScreenHeader';
import { reviewsApi, UserReviewItem } from '../lib/api';
import { useAuth } from '../lib/auth-context';
import { colors, fonts, radius, spacing } from '../theme/tokens';

type FilterTab = 'all' | 'product' | 'service' | 'destination';

export default function MyReviewsScreen() {
  const router = useRouter();
  const { user, token } = useAuth();

  const [reviews, setReviews] = useState<UserReviewItem[]>([]);
  const [stats, setStats] = useState({
    totalReviews: 0,
    totalHelpfulReceived: 0,
    avgRatingGiven: 5.0,
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedTab, setSelectedTab] = useState<FilterTab>('all');

  // Edit Review Modal
  const [editingReview, setEditingReview] = useState<UserReviewItem | null>(null);
  const [editRating, setEditRating] = useState(5);
  const [editTitle, setEditTitle] = useState('');
  const [editComment, setEditComment] = useState('');
  const [isSavingEdit, setIsSavingEdit] = useState(false);

  // Photo viewer lightbox
  const [previewPhoto, setPreviewPhoto] = useState<string | null>(null);

  const fetchMyReviews = useCallback(async () => {
    try {
      const res = await reviewsApi.getMyReviews(token, user?.email);
      if (res) {
        setReviews(res.reviews || []);
        setStats(
          res.stats || {
            totalReviews: 0,
            totalHelpfulReceived: 0,
            avgRatingGiven: 5.0,
          }
        );
      }
    } catch (err) {
      console.warn('Error fetching my reviews:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [token, user?.email]);

  useEffect(() => {
    fetchMyReviews();
  }, [fetchMyReviews]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchMyReviews();
  };

  const filteredReviews = useMemo(() => {
    if (selectedTab === 'all') return reviews;
    return reviews.filter((r) => r.targetType === selectedTab);
  }, [reviews, selectedTab]);

  const openEditModal = (review: UserReviewItem) => {
    setEditingReview(review);
    setEditRating(review.rating);
    setEditTitle(review.title || '');
    setEditComment(review.comment);
  };

  const handleSaveEdit = async () => {
    if (!editingReview) return;
    if (!editComment.trim()) {
      Alert.alert('Required', 'Please enter your review text.');
      return;
    }

    setIsSavingEdit(true);
    try {
      await reviewsApi.updateMyReview(
        editingReview.id,
        {
          rating: editRating,
          title: editTitle.trim() || undefined,
          comment: editComment.trim(),
        },
        token
      );
      setEditingReview(null);
      await fetchMyReviews();
    } catch (err: any) {
      Alert.alert('Error', err?.message || 'Failed to update review');
    } finally {
      setIsSavingEdit(false);
    }
  };

  const handleDelete = (reviewId: string) => {
    Alert.alert(
      'Delete Review',
      'Are you sure you want to remove your review? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await reviewsApi.deleteMyReview(reviewId, token);
              setReviews((prev) => prev.filter((r) => r.id !== reviewId));
              await fetchMyReviews();
            } catch (err: any) {
              Alert.alert('Error', err?.message || 'Could not delete review');
            }
          },
        },
      ]
    );
  };

  const handleNavigateTarget = (targetType: string, targetId: string) => {
    if (targetType === 'product') {
      router.push({ pathname: '/product/[id]', params: { id: targetId } });
    } else if (targetType === 'service') {
      router.push({ pathname: '/service/[id]', params: { id: targetId } });
    } else if (targetType === 'destination') {
      router.push({ pathname: '/destination/[id]', params: { id: targetId } });
    }
  };

  const renderStars = (rating: number) => {
    return (
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3 }}>
        {[1, 2, 3, 4, 5].map((star) => (
          <Ionicons
            key={star}
            name={star <= rating ? 'star' : 'star-outline'}
            size={14}
            color={colors.gold}
          />
        ))}
      </View>
    );
  };

  return (
    <View style={styles.screen}>
      <ScreenHeader title="My Reviews & Photos" />

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.gold}
            colors={[colors.gold]}
          />
        }
      >
        {/* Top Summary Stats Hero Card */}
        <View style={styles.statsHeroCard}>
          <View style={styles.statItem}>
            <View style={styles.statIconBox}>
              <Ionicons name="chatbubbles" size={18} color={colors.gold} />
            </View>
            <Text style={styles.statNumber}>{stats.totalReviews}</Text>
            <Text style={styles.statLabel}>Reviews Written</Text>
          </View>

          <View style={styles.statDivider} />

          <View style={styles.statItem}>
            <View style={styles.statIconBox}>
              <Ionicons name="thumbs-up" size={18} color={colors.gold} />
            </View>
            <Text style={styles.statNumber}>{stats.totalHelpfulReceived}</Text>
            <Text style={styles.statLabel}>Helpful Upvotes</Text>
          </View>

          <View style={styles.statDivider} />

          <View style={styles.statItem}>
            <View style={styles.statIconBox}>
              <Ionicons name="star" size={18} color={colors.gold} />
            </View>
            <Text style={styles.statNumber}>{stats.avgRatingGiven.toFixed(1)}</Text>
            <Text style={styles.statLabel}>Avg Score Given</Text>
          </View>
        </View>

        {/* Filter Tabs */}
        <View style={styles.tabsRow}>
          {[
            { id: 'all', label: `All (${reviews.length})` },
            { id: 'product', label: 'Products' },
            { id: 'service', label: 'Services' },
            { id: 'destination', label: 'Destinations' },
          ].map((tab) => {
            const active = selectedTab === tab.id;
            return (
              <TouchableOpacity
                key={tab.id}
                style={[styles.tabPill, active && styles.tabPillActive]}
                onPress={() => setSelectedTab(tab.id as FilterTab)}
                activeOpacity={0.8}
              >
                <Text style={[styles.tabPillText, active && styles.tabPillTextActive]}>
                  {tab.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Reviews List */}
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.gold} />
            <Text style={styles.loadingText}>Loading your feedback...</Text>
          </View>
        ) : filteredReviews.length === 0 ? (
          <View style={styles.emptyCard}>
            <View style={styles.emptyIconCircle}>
              <Ionicons name="chatbubbles-outline" size={36} color={colors.charcoalLight} />
            </View>
            <Text style={styles.emptyTitle}>No Reviews Found</Text>
            <Text style={styles.emptySub}>
              {selectedTab === 'all'
                ? 'You have not authored any reviews yet. Share your feedback on Ethiopian artisan crafts and partner services!'
                : `No reviews found in this category.`}
            </Text>
            <TouchableOpacity
              style={styles.emptyExploreBtn}
              onPress={() => router.push('/marketplace')}
              activeOpacity={0.85}
            >
              <Text style={styles.emptyExploreBtnText}>Explore Marketplace</Text>
              <Ionicons name="arrow-forward" size={15} color={colors.navy} />
            </TouchableOpacity>
          </View>
        ) : (
          filteredReviews.map((rev) => {
            const photos = rev.photos ? rev.photos.split(',').map((p) => p.trim()).filter(Boolean) : [];

            return (
              <View key={rev.id} style={styles.reviewCard}>
                {/* Target Item Header */}
                <TouchableOpacity
                  style={styles.targetHeaderRow}
                  onPress={() => handleNavigateTarget(rev.targetType, rev.targetId)}
                  activeOpacity={0.8}
                >
                  {rev.targetImage && (
                    <Image source={{ uri: rev.targetImage }} style={styles.targetThumbnail} />
                  )}
                  <View style={{ flex: 1, marginLeft: 10 }}>
                    <View style={styles.targetCategoryRow}>
                      <Text style={styles.targetTypeBadge}>
                        {rev.targetType.toUpperCase()}
                      </Text>
                      {rev.targetCategory && (
                        <Text style={styles.targetCategorySub}>• {rev.targetCategory}</Text>
                      )}
                    </View>
                    <Text style={styles.targetTitleText} numberOfLines={1}>
                      {rev.targetTitle || rev.targetId}
                    </Text>
                  </View>
                  <Ionicons name="chevron-forward" size={16} color={colors.charcoalLight} />
                </TouchableOpacity>

                {/* Star Rating & Date */}
                <View style={styles.ratingDateRow}>
                  {renderStars(rev.rating)}
                  <Text style={styles.reviewDate}>
                    {new Date(rev.createdAt).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                    })}
                  </Text>
                </View>

                {/* Title & Comment */}
                {rev.title && <Text style={styles.reviewHeadline}>{rev.title}</Text>}
                <Text style={styles.reviewBody}>{rev.comment}</Text>

                {/* Photos Row */}
                {photos.length > 0 && (
                  <View style={styles.photosGrid}>
                    {photos.map((photoUri, pIdx) => (
                      <TouchableOpacity
                        key={pIdx}
                        style={styles.photoThumbWrap}
                        onPress={() => setPreviewPhoto(photoUri)}
                        activeOpacity={0.85}
                      >
                        <Image source={{ uri: photoUri }} style={styles.photoThumb} />
                        <View style={styles.photoZoomIcon}>
                          <Ionicons name="expand" size={12} color="#FFFFFF" />
                        </View>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}

                {/* Footer: Helpful count + Actions */}
                <View style={styles.cardFooterRow}>
                  <View style={styles.helpfulBadge}>
                    <Ionicons name="thumbs-up" size={12} color="#2563EB" />
                    <Text style={styles.helpfulBadgeText}>
                      {rev.helpfulCount} helpful {rev.helpfulCount === 1 ? 'vote' : 'votes'}
                    </Text>
                  </View>

                  <View style={styles.cardActionsRow}>
                    <TouchableOpacity
                      style={styles.actionPencilBtn}
                      onPress={() => openEditModal(rev)}
                      activeOpacity={0.75}
                    >
                      <Ionicons name="pencil" size={13} color={colors.navy} />
                      <Text style={styles.actionBtnText}>Edit</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.actionTrashBtn}
                      onPress={() => handleDelete(rev.id)}
                      activeOpacity={0.75}
                    >
                      <Ionicons name="trash-outline" size={13} color="#DC2626" />
                      <Text style={[styles.actionBtnText, { color: '#DC2626' }]}>Delete</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            );
          })
        )}
      </ScrollView>

      {/* Edit Review Modal */}
      <Modal
        visible={!!editingReview}
        animationType="slide"
        transparent
        onRequestClose={() => setEditingReview(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Edit Review</Text>
              <TouchableOpacity onPress={() => setEditingReview(null)}>
                <Ionicons name="close" size={22} color={colors.navy} />
              </TouchableOpacity>
            </View>

            {/* Stars Selector */}
            <Text style={styles.formLabel}>Your Rating</Text>
            <View style={styles.interactiveStarsRow}>
              {[1, 2, 3, 4, 5].map((star) => (
                <TouchableOpacity
                  key={star}
                  onPress={() => setEditRating(star)}
                  style={{ padding: 4 }}
                >
                  <Ionicons
                    name={star <= editRating ? 'star' : 'star-outline'}
                    size={32}
                    color={colors.gold}
                  />
                </TouchableOpacity>
              ))}
            </View>

            {/* Headline */}
            <Text style={styles.formLabel}>Headline (Optional)</Text>
            <TextInput
              style={styles.textInput}
              value={editTitle}
              onChangeText={setEditTitle}
              placeholder="e.g. Masterful hand-weaving"
              placeholderTextColor={colors.charcoalLight}
            />

            {/* Comment */}
            <Text style={styles.formLabel}>Review Comments</Text>
            <TextInput
              style={styles.textArea}
              value={editComment}
              onChangeText={setEditComment}
              placeholder="Describe your authentic experience..."
              placeholderTextColor={colors.charcoalLight}
              multiline
              numberOfLines={4}
            />

            {/* Save Button */}
            <TouchableOpacity
              style={[styles.saveModalBtn, isSavingEdit && { opacity: 0.6 }]}
              onPress={handleSaveEdit}
              disabled={isSavingEdit}
              activeOpacity={0.85}
            >
              {isSavingEdit ? (
                <ActivityIndicator size="small" color={colors.navy} />
              ) : (
                <Text style={styles.saveModalBtnText}>Update Review</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Full Photo Lightbox Modal */}
      <Modal
        visible={!!previewPhoto}
        transparent
        animationType="fade"
        onRequestClose={() => setPreviewPhoto(null)}
      >
        <View style={styles.lightboxOverlay}>
          <TouchableOpacity
            style={styles.lightboxCloseBtn}
            onPress={() => setPreviewPhoto(null)}
          >
            <Ionicons name="close" size={24} color="#FFFFFF" />
          </TouchableOpacity>
          {previewPhoto && (
            <Image
              source={{ uri: previewPhoto }}
              style={styles.lightboxImage}
              resizeMode="contain"
            />
          )}
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#F7F8FA',
  },
  scrollContent: {
    padding: spacing.md,
    paddingBottom: 60,
  },
  statsHeroCard: {
    backgroundColor: '#07152B',
    borderRadius: radius.xl,
    padding: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    borderWidth: 1,
    borderColor: 'rgba(223, 183, 108, 0.3)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 4,
    marginBottom: spacing.md,
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statIconBox: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(223, 183, 108, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  statNumber: {
    fontFamily: fonts.serifBold,
    fontSize: 18,
    color: '#FFFFFF',
  },
  statLabel: {
    fontFamily: fonts.body,
    fontSize: 10,
    color: '#94A3B8',
    marginTop: 2,
    textAlign: 'center',
  },
  statDivider: {
    width: 1,
    height: 36,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  tabsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: spacing.md,
    flexWrap: 'wrap',
  },
  tabPill: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: radius.pill,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  tabPillActive: {
    backgroundColor: '#07152B',
    borderColor: '#07152B',
  },
  tabPillText: {
    fontFamily: fonts.bodyMedium,
    fontSize: 12,
    color: colors.charcoalSub,
  },
  tabPillTextActive: {
    fontFamily: fonts.bodyBold,
    color: colors.gold,
  },
  loadingContainer: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  loadingText: {
    fontFamily: fonts.bodyMedium,
    fontSize: 13,
    color: colors.charcoalLight,
    marginTop: 10,
  },
  emptyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: radius.xl,
    padding: spacing.xl,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.05)',
    marginTop: 10,
  },
  emptyIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  emptyTitle: {
    fontFamily: fonts.heading,
    fontSize: 18,
    color: colors.navy,
    marginBottom: 6,
  },
  emptySub: {
    fontFamily: fonts.body,
    fontSize: 13,
    color: colors.charcoalSub,
    textAlign: 'center',
    lineHeight: 19,
    marginBottom: 16,
  },
  emptyExploreBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.gold,
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: radius.pill,
    gap: 6,
  },
  emptyExploreBtnText: {
    fontFamily: fonts.bodyBold,
    fontSize: 13,
    color: colors.navy,
  },
  reviewCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: radius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.06)',
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  targetHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    marginBottom: 10,
  },
  targetThumbnail: {
    width: 38,
    height: 38,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
  },
  targetCategoryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 2,
  },
  targetTypeBadge: {
    fontFamily: fonts.bodyBold,
    fontSize: 9.5,
    color: colors.goldRich,
    letterSpacing: 0.8,
  },
  targetCategorySub: {
    fontFamily: fonts.body,
    fontSize: 11,
    color: colors.charcoalLight,
  },
  targetTitleText: {
    fontFamily: fonts.bodyBold,
    fontSize: 13.5,
    color: colors.navy,
  },
  ratingDateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  reviewDate: {
    fontFamily: fonts.body,
    fontSize: 11.5,
    color: '#94A3B8',
  },
  reviewHeadline: {
    fontFamily: fonts.bodyBold,
    fontSize: 14,
    color: colors.navy,
    marginBottom: 4,
  },
  reviewBody: {
    fontFamily: fonts.body,
    fontSize: 13,
    color: '#334155',
    lineHeight: 19,
    marginBottom: 8,
  },
  photosGrid: {
    flexDirection: 'row',
    gap: 8,
    marginVertical: 6,
  },
  photoThumbWrap: {
    position: 'relative',
    width: 56,
    height: 56,
    borderRadius: radius.sm,
    overflow: 'hidden',
  },
  photoThumb: {
    width: '100%',
    height: '100%',
  },
  photoZoomIcon: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 4,
    padding: 2,
  },
  cardFooterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#F8FAFC',
    marginTop: 4,
  },
  helpfulBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: radius.pill,
    gap: 4,
  },
  helpfulBadgeText: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 11,
    color: '#2563EB',
  },
  cardActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  actionPencilBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: radius.sm,
    gap: 4,
  },
  actionTrashBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEE2E2',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: radius.sm,
    gap: 4,
  },
  actionBtnText: {
    fontFamily: fonts.bodyBold,
    fontSize: 11.5,
    color: colors.navy,
  },

  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(7, 21, 43, 0.65)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    padding: spacing.lg,
    maxHeight: '85%',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  modalTitle: {
    fontFamily: fonts.heading,
    fontSize: 18,
    color: colors.navy,
  },
  formLabel: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 12,
    color: colors.charcoal,
    marginTop: 10,
    marginBottom: 6,
  },
  interactiveStarsRow: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 8,
  },
  textInput: {
    backgroundColor: '#F8FAFC',
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 10,
    fontFamily: fonts.body,
    fontSize: 13,
    color: colors.charcoal,
  },
  textArea: {
    backgroundColor: '#F8FAFC',
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 10,
    fontFamily: fonts.body,
    fontSize: 13,
    color: colors.charcoal,
    height: 90,
    textAlignVertical: 'top',
  },
  saveModalBtn: {
    backgroundColor: colors.gold,
    borderRadius: radius.lg,
    paddingVertical: 13,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.lg,
    marginBottom: spacing.md,
  },
  saveModalBtnText: {
    fontFamily: fonts.bodyBold,
    fontSize: 14,
    color: colors.navy,
  },

  // Lightbox
  lightboxOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.92)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.md,
  },
  lightboxCloseBtn: {
    position: 'absolute',
    top: 50,
    right: 20,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  lightboxImage: {
    width: '100%',
    height: '80%',
  },
});
