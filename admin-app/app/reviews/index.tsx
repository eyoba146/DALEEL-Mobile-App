import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  TextInput,
  RefreshControl,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { ScreenHeader } from '../../components/ScreenHeader';
import { Card } from '../../components/Card';
import { EmptyState } from '../../components/EmptyState';
import { adminApi, AdminReviewItem } from '../../lib/api';
import { useToast } from '../../lib/toast-context';
import { colors, type, fonts, radius } from '../../theme/tokens';

export default function ReviewsModerationScreen() {
  const router = useRouter();
  const { showToast } = useToast();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [reviews, setReviews] = useState<AdminReviewItem[]>([]);
  const [counts, setCounts] = useState({
    total: 0,
    pending: 0,
    approved: 0,
    rejected: 0,
    verified: 0,
  });

  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');
  const [search, setSearch] = useState('');

  useEffect(() => {
    loadReviews(true);
  }, [statusFilter]);

  const loadReviews = async (showLoader = false) => {
    try {
      if (showLoader) setLoading(true);
      else setRefreshing(true);

      const res = await adminApi.getAdminReviews({
        status: statusFilter !== 'all' ? statusFilter : undefined,
        search: search.trim() || undefined,
      });

      setReviews(res.reviews || []);
      setCounts(res.counts || { total: 0, pending: 0, approved: 0, rejected: 0, verified: 0 });
    } catch (err: any) {
      showToast(err.message || 'Failed to load community reviews', 'error');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleUpdateStatus = async (id: string, status: 'approved' | 'rejected') => {
    try {
      await adminApi.updateReviewStatus(id, status);
      showToast(`Review marked as ${status}`, 'success');
      loadReviews(false);
    } catch (err: any) {
      showToast(err.message || 'Failed to update review status', 'error');
    }
  };

  const handleToggleVerified = async (id: string, current: boolean) => {
    try {
      await adminApi.toggleReviewVerified(id, !current);
      showToast(!current ? 'Verified purchaser badge enabled' : 'Verified badge removed', 'success');
      loadReviews(false);
    } catch (err: any) {
      showToast(err.message || 'Failed to toggle verified badge', 'error');
    }
  };

  const handleDelete = (id: string) => {
    Alert.alert(
      'Delete Review',
      'Are you sure you want to permanently delete this community review?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await adminApi.deleteReview(id);
              showToast('Review deleted', 'success');
              loadReviews(false);
            } catch (err: any) {
              showToast(err.message || 'Failed to delete review', 'error');
            }
          },
        },
      ]
    );
  };

  const renderStars = (rating: number) => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <Ionicons
          key={i}
          name={i <= rating ? 'star' : 'star-outline'}
          size={14}
          color={i <= rating ? colors.gold : colors.textTertiary}
        />
      );
    }
    return <View style={styles.starsRow}>{stars}</View>;
  };

  return (
    <View style={styles.container}>
      <ScreenHeader
        title="Reviews Moderation"
        subtitle={`${counts.pending} pending community ratings`}
        showBack
        variant="navy"
        badge={counts.pending > 0 ? `${counts.pending} PENDING` : 'ACTIVE'}
      />

      {/* Status Filter Tabs */}
      <View style={styles.filterBar}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterPills}
        >
          {[
            { key: 'all', label: `All (${counts.total})` },
            { key: 'pending', label: `Pending (${counts.pending})` },
            { key: 'approved', label: `Approved (${counts.approved})` },
            { key: 'rejected', label: `Rejected (${counts.rejected})` },
          ].map((tab) => {
            const active = statusFilter === tab.key;
            return (
              <TouchableOpacity
                key={tab.key}
                style={[styles.filterPill, active && styles.filterPillActive]}
                onPress={() => setStatusFilter(tab.key as any)}
                activeOpacity={0.7}
              >
                <Text style={[styles.filterPillText, active && styles.filterPillTextActive]}>
                  {tab.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBox}>
          <Ionicons name="search" size={16} color={colors.textTertiary} />
          <TextInput
            style={styles.searchInput}
            value={search}
            onChangeText={setSearch}
            placeholder="Search author, comments, target..."
            placeholderTextColor={colors.textTertiary}
            returnKeyType="search"
            onSubmitEditing={() => loadReviews(true)}
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => setSearch('')}>
              <Ionicons name="close-circle" size={16} color={colors.textTertiary} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => loadReviews(false)}
            tintColor={colors.gold}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        {loading ? (
          <View style={styles.loaderBox}>
            <ActivityIndicator size="large" color={colors.gold} />
          </View>
        ) : reviews.length === 0 ? (
          <EmptyState
            title="No Reviews Found"
            description="All community reviews in this queue have been moderated."
            icon="star-outline"
          />
        ) : (
          reviews.map((rev) => {
            const isApproved = rev.status === 'approved';
            const isRejected = rev.status === 'rejected';
            const isPending = rev.status === 'pending';

            return (
              <Card key={rev.id} style={styles.reviewCard}>
                {/* Header Row: Author + Rating + Status Badge */}
                <View style={styles.reviewHeader}>
                  <View style={styles.authorGroup}>
                    <View style={styles.authorAvatar}>
                      <Text style={styles.authorInitial}>
                        {(rev.authorName || 'U')[0].toUpperCase()}
                      </Text>
                    </View>
                    <View>
                      <View style={styles.authorNameRow}>
                        <Text style={styles.authorName}>{rev.authorName}</Text>
                        {rev.verified && (
                          <View style={styles.verifiedBadge}>
                            <Ionicons name="checkmark-circle" size={12} color={colors.gold} />
                            <Text style={styles.verifiedText}>Verified</Text>
                          </View>
                        )}
                      </View>
                      {renderStars(rev.rating)}
                    </View>
                  </View>

                  <View
                    style={[
                      styles.statusBadge,
                      isApproved
                        ? styles.statusBadgeApproved
                        : isRejected
                        ? styles.statusBadgeRejected
                        : styles.statusBadgePending,
                    ]}
                  >
                    <Text
                      style={[
                        styles.statusText,
                        isApproved
                          ? styles.statusTextApproved
                          : isRejected
                          ? styles.statusTextRejected
                          : styles.statusTextPending,
                      ]}
                    >
                      {rev.status.toUpperCase()}
                    </Text>
                  </View>
                </View>

                {/* Target Entity Pill */}
                {rev.targetTitle && (
                  <View style={styles.targetPill}>
                    <Ionicons
                      name={
                        rev.targetType === 'service'
                          ? 'business'
                          : rev.targetType === 'destination'
                          ? 'compass'
                          : 'bag-handle'
                      }
                      size={12}
                      color={colors.textSecondary}
                    />
                    <Text style={styles.targetTitle} numberOfLines={1}>
                      {rev.targetType.toUpperCase()}: {rev.targetTitle}
                    </Text>
                  </View>
                )}

                {/* Comment Body */}
                <Text style={styles.commentText}>{rev.comment}</Text>

                {/* Footer Date & Actions */}
                <View style={styles.footerRow}>
                  <Text style={styles.dateText}>
                    {new Date(rev.createdAt).toLocaleDateString()}
                  </Text>

                  <View style={styles.actionsRow}>
                    {/* Toggle Verified */}
                    <TouchableOpacity
                      style={styles.actionBtn}
                      onPress={() => handleToggleVerified(rev.id, rev.verified)}
                      activeOpacity={0.7}
                    >
                      <Ionicons
                        name={rev.verified ? 'shield-checkmark' : 'shield-outline'}
                        size={15}
                        color={rev.verified ? colors.gold : colors.textSecondary}
                      />
                    </TouchableOpacity>

                    {/* Approve */}
                    {!isApproved && (
                      <TouchableOpacity
                        style={[styles.actionBtn, styles.approveBtn]}
                        onPress={() => handleUpdateStatus(rev.id, 'approved')}
                        activeOpacity={0.7}
                      >
                        <Ionicons name="checkmark" size={15} color={colors.success} />
                        <Text style={styles.approveBtnText}>Approve</Text>
                      </TouchableOpacity>
                    )}

                    {/* Reject */}
                    {!isRejected && (
                      <TouchableOpacity
                        style={[styles.actionBtn, styles.rejectBtn]}
                        onPress={() => handleUpdateStatus(rev.id, 'rejected')}
                        activeOpacity={0.7}
                      >
                        <Ionicons name="close" size={15} color={colors.warning} />
                        <Text style={styles.rejectBtnText}>Reject</Text>
                      </TouchableOpacity>
                    )}

                    {/* Delete */}
                    <TouchableOpacity
                      style={[styles.actionBtn, styles.deleteBtn]}
                      onPress={() => handleDelete(rev.id)}
                      activeOpacity={0.7}
                    >
                      <Ionicons name="trash-outline" size={15} color={colors.danger} />
                    </TouchableOpacity>
                  </View>
                </View>
              </Card>
            );
          })
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.surface,
  },
  filterBar: {
    backgroundColor: colors.card,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  filterPills: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 8,
  },
  filterPill: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: radius.full,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  filterPillActive: {
    backgroundColor: colors.navy,
    borderColor: colors.navy,
  },
  filterPillText: {
    ...type.caption,
    fontFamily: fonts.sansMedium,
    color: colors.textSecondary,
  },
  filterPillTextActive: {
    color: '#FFFFFF',
    fontFamily: fonts.sansBold,
  },
  searchContainer: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: colors.card,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    paddingHorizontal: 12,
    height: 40,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    height: 40,
    fontSize: 13,
    color: colors.textPrimary,
    fontFamily: fonts.sansRegular,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  loaderBox: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  reviewCard: {
    padding: 14,
    marginBottom: 12,
  },
  reviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  authorGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  authorAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.navy,
    alignItems: 'center',
    justifyContent: 'center',
  },
  authorInitial: {
    ...type.caption,
    fontFamily: fonts.sansBold,
    color: '#FFFFFF',
  },
  authorNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  authorName: {
    ...type.body,
    fontFamily: fonts.sansSemiBold,
    color: colors.textPrimary,
  },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    backgroundColor: colors.goldSoft,
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: radius.xs,
  },
  verifiedText: {
    ...type.tiny,
    fontSize: 9,
    fontFamily: fonts.sansBold,
    color: colors.goldText,
  },
  starsRow: {
    flexDirection: 'row',
    gap: 2,
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: radius.xs,
  },
  statusBadgeApproved: {
    backgroundColor: 'rgba(46, 204, 113, 0.15)',
  },
  statusBadgeRejected: {
    backgroundColor: 'rgba(214, 48, 49, 0.15)',
  },
  statusBadgePending: {
    backgroundColor: 'rgba(243, 156, 18, 0.15)',
  },
  statusText: {
    ...type.tiny,
    fontSize: 10,
    fontFamily: fonts.sansBold,
  },
  statusTextApproved: {
    color: colors.success,
  },
  statusTextRejected: {
    color: colors.danger,
  },
  statusTextPending: {
    color: colors.warning,
  },
  targetPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.surface,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: radius.xs,
    alignSelf: 'flex-start',
    marginBottom: 8,
  },
  targetTitle: {
    ...type.tiny,
    color: colors.textSecondary,
    fontFamily: fonts.sansMedium,
  },
  commentText: {
    ...type.body,
    color: colors.textPrimary,
    lineHeight: 20,
    marginBottom: 12,
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: 10,
  },
  dateText: {
    ...type.tiny,
    color: colors.textTertiary,
  },
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: radius.sm,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 4,
  },
  approveBtn: {
    borderColor: 'rgba(46, 204, 113, 0.3)',
  },
  approveBtnText: {
    ...type.tiny,
    color: colors.success,
    fontFamily: fonts.sansBold,
  },
  rejectBtn: {
    borderColor: 'rgba(243, 156, 18, 0.3)',
  },
  rejectBtnText: {
    ...type.tiny,
    color: colors.warning,
    fontFamily: fonts.sansBold,
  },
  deleteBtn: {
    borderColor: 'rgba(214, 48, 49, 0.3)',
  },
});
