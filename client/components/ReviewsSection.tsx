import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { ReviewItem, reviewsApi } from '../lib/api';
import { colors, fonts, radius, spacing } from '../theme/tokens';
import { WriteReviewModal } from './WriteReviewModal';

type Props = {
  targetType: 'service' | 'product' | 'destination';
  targetId: string;
  targetName: string;
  style?: any;
};

export const ReviewsSection: React.FC<Props> = ({ targetType, targetId, targetName, style }) => {
  const [reviews, setReviews] = useState<ReviewItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [averageRating, setAverageRating] = useState(5.0);
  const [totalReviews, setTotalReviews] = useState(0);
  const [distribution, setDistribution] = useState<Record<number, number>>({
    5: 0,
    4: 0,
    3: 0,
    2: 0,
    1: 0,
  });
  const [modalVisible, setModalVisible] = useState(false);
  const [votedMap, setVotedMap] = useState<Record<string, boolean>>({});

  useEffect(() => {
    let mounted = true;
    async function loadReviews() {
      try {
        setLoading(true);
        const data = await reviewsApi.getReviews(targetType, targetId);
        if (mounted && data) {
          setReviews(data.reviews || []);
          setAverageRating(data.averageRating || 5.0);
          setTotalReviews(data.totalReviews || 0);
          if (data.distribution) setDistribution(data.distribution);
        }
      } catch {
        // Fallback gracefully
      } finally {
        if (mounted) setLoading(false);
      }
    }

    loadReviews();
    return () => {
      mounted = false;
    };
  }, [targetType, targetId]);

  const handleReviewCreated = (newReview: ReviewItem) => {
    setReviews([newReview, ...reviews]);
    setTotalReviews((prev) => prev + 1);
    setDistribution((prev) => ({
      ...prev,
      [newReview.rating]: (prev[newReview.rating] || 0) + 1,
    }));
  };

  const handleHelpful = async (reviewId: string) => {
    if (votedMap[reviewId]) return;
    setVotedMap((prev) => ({ ...prev, [reviewId]: true }));
    setReviews((prev) =>
      prev.map((r) => (r.id === reviewId ? { ...r, helpfulCount: r.helpfulCount + 1 } : r))
    );
    try {
      await reviewsApi.voteHelpful(reviewId);
    } catch {
      // Revert if error
    }
  };

  const renderStars = (score: number, size: number = 14) => {
    return (
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 2 }}>
        {[1, 2, 3, 4, 5].map((i) => (
          <Ionicons
            key={i}
            name={i <= score ? 'star' : i - 0.5 <= score ? 'star-half' : 'star-outline'}
            size={size}
            color={colors.gold}
          />
        ))}
      </View>
    );
  };

  return (
    <View style={[styles.container, style]}>
      {/* Section Header */}
      <View style={styles.headerRow}>
        <View style={styles.titleGroup}>
          <Ionicons name="chatbubbles-outline" size={18} color={colors.goldRich} />
          <Text style={styles.sectionTitle}>Diaspora Reviews & Ratings</Text>
        </View>
        <TouchableOpacity
          style={styles.writeReviewBtn}
          onPress={() => setModalVisible(true)}
          activeOpacity={0.8}
        >
          <Ionicons name="create-outline" size={14} color={colors.navy} style={{ marginRight: 4 }} />
          <Text style={styles.writeReviewBtnText}>Write Review</Text>
        </TouchableOpacity>
      </View>

      {/* Aggregate Score Card */}
      <View style={styles.aggregateCard}>
        <View style={styles.aggregateLeft}>
          <Text style={styles.bigScore}>{averageRating.toFixed(1)}</Text>
          {renderStars(averageRating, 16)}
          <Text style={styles.totalCountText}>
            {totalReviews > 0 ? `${totalReviews} verified reviews` : 'No reviews yet'}
          </Text>
        </View>

        {/* 5-Star Distribution Bars */}
        <View style={styles.distributionCol}>
          {[5, 4, 3, 2, 1].map((star) => {
            const count = distribution[star] || 0;
            const pct = totalReviews > 0 ? Math.round((count / totalReviews) * 100) : 0;
            return (
              <View key={star} style={styles.barRow}>
                <Text style={styles.barLabel}>{star}★</Text>
                <View style={styles.barTrack}>
                  <View style={[styles.barFill, { width: `${pct}%` }]} />
                </View>
                <Text style={styles.barPct}>{count}</Text>
              </View>
            );
          })}
        </View>
      </View>

      {/* Reviews List */}
      {loading ? (
        <View style={styles.loadingBox}>
          <ActivityIndicator size="small" color={colors.gold} />
          <Text style={styles.loadingText}>Loading community feedback…</Text>
        </View>
      ) : reviews.length === 0 ? (
        <View style={styles.emptyCard}>
          <Ionicons name="sparkles-outline" size={28} color={colors.charcoalLight} />
          <Text style={styles.emptyTitle}>Be the first to leave a review</Text>
          <Text style={styles.emptySub}>
            Share your experience with fellow diaspora travelers and collectors.
          </Text>
          <TouchableOpacity
            style={styles.emptyCtaBtn}
            onPress={() => setModalVisible(true)}
            activeOpacity={0.8}
          >
            <Text style={styles.emptyCtaText}>Add First Review</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.reviewsList}>
          {reviews.map((rev) => {
            const photoList = rev.photos ? rev.photos.split(',').filter(Boolean) : [];
            const hasVoted = !!votedMap[rev.id];

            return (
              <View key={rev.id} style={styles.reviewCard}>
                {/* Author Info & Rating */}
                <View style={styles.cardHeader}>
                  <View style={styles.authorGroup}>
                    {rev.authorAvatar ? (
                      <Image source={{ uri: rev.authorAvatar }} style={styles.authorAvatar} />
                    ) : (
                      <View style={styles.avatarPlaceholder}>
                        <Text style={styles.avatarLetter}>
                          {rev.authorName ? rev.authorName.charAt(0).toUpperCase() : 'D'}
                        </Text>
                      </View>
                    )}
                    <View>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                        <Text style={styles.authorName}>{rev.authorName}</Text>
                        {rev.verified && (
                          <View style={styles.verifiedBadge}>
                            <Ionicons name="checkmark-circle" size={11} color={colors.gold} />
                            <Text style={styles.verifiedBadgeText}>Verified</Text>
                          </View>
                        )}
                      </View>
                      <Text style={styles.reviewDate}>
                        {new Date(rev.createdAt).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </Text>
                    </View>
                  </View>

                  <View>{renderStars(rev.rating, 13)}</View>
                </View>

                {/* Review Title */}
                {rev.title && <Text style={styles.reviewHeadline}>{rev.title}</Text>}

                {/* Review Body */}
                <Text style={styles.reviewComment}>{rev.comment}</Text>

                {/* Attached Photos */}
                {photoList.length > 0 && (
                  <View style={styles.photoThumbRow}>
                    {photoList.map((uri, pIdx) => (
                      <Image key={pIdx} source={{ uri: uri.trim() }} style={styles.reviewImage} />
                    ))}
                  </View>
                )}

                {/* Helpful Upvote Button */}
                <View style={styles.cardFooter}>
                  <TouchableOpacity
                    style={[styles.helpfulBtn, hasVoted && styles.helpfulBtnActive]}
                    onPress={() => handleHelpful(rev.id)}
                    activeOpacity={0.75}
                  >
                    <Ionicons
                      name={hasVoted ? 'thumbs-up' : 'thumbs-up-outline'}
                      size={13}
                      color={hasVoted ? colors.navy : colors.charcoalSub}
                      style={{ marginRight: 4 }}
                    />
                    <Text style={[styles.helpfulBtnText, hasVoted && styles.helpfulBtnTextActive]}>
                      Helpful ({rev.helpfulCount})
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            );
          })}
        </View>
      )}

      {/* Write Review Modal */}
      <WriteReviewModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        targetType={targetType}
        targetId={targetId}
        targetName={targetName}
        onSuccess={handleReviewCreated}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginTop: 24,
    marginBottom: 16,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  titleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.navy,
    fontFamily: fonts.heading,
  },
  writeReviewBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.goldSoft,
    borderWidth: 1,
    borderColor: colors.goldBorder,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: radius.pill,
  },
  writeReviewBtnText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: colors.navy,
    fontFamily: fonts.bodySemiBold,
  },
  aggregateCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: radius.xl,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(23, 25, 28, 0.06)',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
  },
  aggregateLeft: {
    alignItems: 'center',
    paddingRight: 20,
    borderRightWidth: 1,
    borderRightColor: 'rgba(0,0,0,0.06)',
    minWidth: 110,
  },
  bigScore: {
    fontSize: 34,
    fontWeight: '800',
    color: colors.navy,
    fontFamily: fonts.heading,
    lineHeight: 40,
    marginBottom: 2,
  },
  totalCountText: {
    fontSize: 10.5,
    color: colors.charcoalSub,
    fontFamily: fonts.body,
    marginTop: 4,
  },
  distributionCol: {
    flex: 1,
    paddingLeft: 16,
    gap: 4,
  },
  barRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  barLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.charcoalSub,
    width: 20,
  },
  barTrack: {
    flex: 1,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#F1F5F9',
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    backgroundColor: colors.gold,
    borderRadius: 3,
  },
  barPct: {
    fontSize: 10,
    color: colors.charcoalSub,
    width: 16,
    textAlign: 'right',
  },
  loadingBox: {
    paddingVertical: 20,
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 12,
    color: colors.charcoalSub,
    marginTop: 8,
  },
  emptyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: radius.lg,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.06)',
  },
  emptyTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.navy,
    fontFamily: fonts.heading,
    marginTop: 8,
  },
  emptySub: {
    fontSize: 12,
    color: colors.charcoalSub,
    textAlign: 'center',
    marginTop: 4,
    marginBottom: 12,
    fontFamily: fonts.body,
  },
  emptyCtaBtn: {
    backgroundColor: colors.gold,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: radius.pill,
  },
  emptyCtaText: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.navy,
  },
  reviewsList: {
    gap: 12,
  },
  reviewCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: radius.lg,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(23, 25, 28, 0.06)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  authorGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  authorAvatar: {
    width: 34,
    height: 34,
    borderRadius: 17,
  },
  avatarPlaceholder: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: colors.navy,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarLetter: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.gold,
  },
  authorName: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.navy,
    fontFamily: fonts.bodyBold,
  },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.goldSoft,
    paddingHorizontal: 5,
    paddingVertical: 1.5,
    borderRadius: 4,
    gap: 2,
  },
  verifiedBadgeText: {
    fontSize: 9.5,
    fontWeight: '700',
    color: '#8A6204',
  },
  reviewDate: {
    fontSize: 10.5,
    color: colors.charcoalLight,
    marginTop: 1,
  },
  reviewHeadline: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.navy,
    marginBottom: 4,
    fontFamily: fonts.bodyBold,
  },
  reviewComment: {
    fontSize: 12.5,
    color: colors.charcoal,
    lineHeight: 18,
    fontFamily: fonts.body,
  },
  photoThumbRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 10,
  },
  reviewImage: {
    width: 70,
    height: 70,
    borderRadius: 8,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.04)',
  },
  helpfulBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: radius.pill,
    backgroundColor: '#F8FAFC',
  },
  helpfulBtnActive: {
    backgroundColor: colors.goldSoft,
  },
  helpfulBtnText: {
    fontSize: 11,
    color: colors.charcoalSub,
    fontFamily: fonts.bodyMedium,
  },
  helpfulBtnTextActive: {
    color: colors.navy,
    fontWeight: '700',
  },
});
