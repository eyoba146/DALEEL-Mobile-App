import React, { useEffect, useState, useCallback } from 'react';
import {
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAdminAuth } from '../../lib/auth-context';
import { useAdminLanguage } from '../../lib/language-context';
import { useAdminToast } from '../../lib/toast-context';
import { adminApi, type PlatformStats, type SidebarCounts } from '../../lib/api';
import { ScreenHeader } from '../../components/ScreenHeader';
import { Card } from '../../components/Card';
import { ErrorState } from '../../components/ErrorState';
import { colors, fonts, radius, shadow, spacing, type } from '../../theme/tokens';

export default function DashboardScreen() {
  const router = useRouter();
  const { adminUser, canManageEvents, canManageServices, isSuperAdmin } = useAdminAuth();
  const { t } = useAdminLanguage();
  const { error: toastError } = useAdminToast();

  const [stats, setStats] = useState<PlatformStats | null>(null);
  const [counts, setCounts] = useState<SidebarCounts | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);

  const loadDashboardData = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setFetchError(null);

    try {
      const [statsData, countsData] = await Promise.all([
        adminApi.getStats(),
        adminApi.getSidebarCounts(),
      ]);
      setStats(statsData);
      setCounts(countsData);
    } catch (err: any) {
      const msg = err.message || 'Failed to load executive dashboard data';
      setFetchError(msg);
      toastError(msg);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  const getRoleDisplayName = (role?: string) => {
    switch (role) {
      case 'SUPER_ADMIN':
        return 'Full Administrator';
      case 'DESTINATION_MANAGER':
        return 'Tourism & Heritage Lead';
      case 'SERVICE_MANAGER':
        return 'Services Directory Lead';
      case 'EVENT_MANAGER':
        return 'Events Coordinator';
      case 'MARKETPLACE_MANAGER':
        return 'Artisan Marketplace Lead';
      case 'INVESTMENT_OFFICER':
        return 'Investment Officer';
      default:
        return 'Platform Coordinator';
    }
  };

  const totalPendingInquiries = counts?.totalPending ?? 0;

  return (
    <View style={styles.container}>
      <ScreenHeader
        title="DALEEL"
        subtitle={`Console · ${adminUser?.name || 'Administrator'}`}
        variant="navy"
        badge={getRoleDisplayName(adminUser?.adminRole)}
        rightElement={
          <TouchableOpacity
            onPress={() => loadDashboardData(true)}
            style={styles.refreshBtn}
            activeOpacity={0.7}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="refresh-outline" size={18} color="#FFFFFF" />
          </TouchableOpacity>
        }
      />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => loadDashboardData(true)}
            tintColor={colors.gold}
            colors={[colors.gold]}
          />
        }
      >
        {fetchError && (
          <ErrorState message={fetchError} onRetry={() => loadDashboardData()} />
        )}

        {/* Urgent Triage Callout Banner */}
        {totalPendingInquiries > 0 ? (
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={() => router.push('/(tabs)/triage')}
            style={styles.urgentBanner}
          >
            <View style={styles.urgentBadge}>
              <Ionicons name="alert-circle" size={18} color="#FFFFFF" />
            </View>
            <View style={styles.urgentTextWrap}>
              <Text style={styles.urgentTitle}>
                {totalPendingInquiries} Inquiries Requiring Triage
              </Text>
              <Text style={styles.urgentSubtitle}>
                New client service, event RSVP, order, or investor requests
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color="#FFFFFF" />
          </TouchableOpacity>
        ) : (
          <View style={styles.healthyBanner}>
            <Ionicons name="checkmark-circle-outline" size={18} color={colors.success} />
            <Text style={styles.healthyText}>{t('allGood')}</Text>
          </View>
        )}

        {/* Quick Operations Strip */}
        <View style={styles.quickOpsSection}>
          <Text style={styles.sectionHeaderTitle}>QUICK ACTIONS</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.quickOpsRow}
          >
            {canManageEvents && (
              <TouchableOpacity
                style={styles.quickActionCard}
                onPress={() => router.push('/event/scanner')}
                activeOpacity={0.75}
              >
                <View style={[styles.actionIconCircle, { backgroundColor: '#FDF8E8' }]}>
                  <Ionicons name="qr-code-outline" size={20} color={colors.goldText} />
                </View>
                <Text style={styles.actionCardTitle}>Check In Pass</Text>
                <Text style={styles.actionCardSub}>Verify RSVP ticket</Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity
              style={styles.quickActionCard}
              onPress={() => router.push('/(tabs)/triage')}
              activeOpacity={0.75}
            >
              <View style={[styles.actionIconCircle, { backgroundColor: '#EFF6FF' }]}>
                <Ionicons name="file-tray-full-outline" size={20} color="#2563EB" />
              </View>
              <Text style={styles.actionCardTitle}>Triage Desk</Text>
              <Text style={styles.actionCardSub}>Manage queues</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.quickActionCard}
              onPress={() => router.push('/(tabs)/catalog')}
              activeOpacity={0.75}
            >
              <View style={[styles.actionIconCircle, { backgroundColor: '#F0FDF4' }]}>
                <Ionicons name="add-circle-outline" size={20} color={colors.success} />
              </View>
              <Text style={styles.actionCardTitle}>Add Listing</Text>
              <Text style={styles.actionCardSub}>Publish entity</Text>
            </TouchableOpacity>

            {isSuperAdmin && (
              <TouchableOpacity
                style={styles.quickActionCard}
                onPress={() => router.push('/team/new')}
                activeOpacity={0.75}
              >
                <View style={[styles.actionIconCircle, { backgroundColor: '#F5F3FF' }]}>
                  <Ionicons name="person-add-outline" size={20} color="#7C3AED" />
                </View>
                <Text style={styles.actionCardTitle}>Onboard Staff</Text>
                <Text style={styles.actionCardSub}>New coordinator</Text>
              </TouchableOpacity>
            )}
          </ScrollView>
        </View>

        {/* Primary Platform KPIs Grid */}
        <View style={styles.kpiSection}>
          <Text style={styles.sectionHeaderTitle}>REAL-TIME OPERATIONS</Text>

          <View style={styles.kpiGrid}>
            <Card style={styles.kpiCard}>
              <View style={styles.kpiHeaderRow}>
                <Text style={styles.kpiLabel}>Service Inquiries</Text>
                <View style={[styles.kpiIconDot, { backgroundColor: '#EFF6FF' }]}>
                  <Ionicons name="briefcase" size={14} color="#2563EB" />
                </View>
              </View>
              <Text style={styles.kpiValue}>{stats?.serviceInquiriesCount ?? 0}</Text>
              <Text style={styles.kpiSub}>Formal client requests</Text>
            </Card>

            <Card style={styles.kpiCard}>
              <View style={styles.kpiHeaderRow}>
                <Text style={styles.kpiLabel}>Event RSVPs</Text>
                <View style={[styles.kpiIconDot, { backgroundColor: '#FDF8E8' }]}>
                  <Ionicons name="calendar" size={14} color={colors.goldText} />
                </View>
              </View>
              <Text style={styles.kpiValue}>{stats?.eventRsvpsCount ?? 0}</Text>
              <Text style={styles.kpiSub}>Registered attendees</Text>
            </Card>

            <Card style={styles.kpiCard}>
              <View style={styles.kpiHeaderRow}>
                <Text style={styles.kpiLabel}>Marketplace Orders</Text>
                <View style={[styles.kpiIconDot, { backgroundColor: '#F0FDF4' }]}>
                  <Ionicons name="bag-handle" size={14} color={colors.success} />
                </View>
              </View>
              <Text style={styles.kpiValue}>{stats?.productOrdersCount ?? 0}</Text>
              <Text style={styles.kpiSub}>Artisan craft inquiries</Text>
            </Card>

            <Card style={styles.kpiCard}>
              <View style={styles.kpiHeaderRow}>
                <Text style={styles.kpiLabel}>Investor Leads</Text>
                <View style={[styles.kpiIconDot, { backgroundColor: '#F5F3FF' }]}>
                  <Ionicons name="trending-up" size={14} color="#7C3AED" />
                </View>
              </View>
              <Text style={styles.kpiValue}>{stats?.investmentInquiriesCount ?? 0}</Text>
              <Text style={styles.kpiSub}>Syndicate prospectuses</Text>
            </Card>
          </View>
        </View>

        {/* Catalog Directory Metrics */}
        <View style={styles.catalogOverviewSection}>
          <Text style={styles.sectionHeaderTitle}>CATALOG INVENTORY</Text>

          <Card style={styles.catalogCard}>
            <View style={styles.catalogRow}>
              <View style={styles.catalogLeft}>
                <Ionicons name="business-outline" size={18} color={colors.navy} />
                <Text style={styles.catalogTitle}>Verified Services</Text>
              </View>
              <Text style={styles.catalogCount}>{stats?.servicesCount ?? 0}</Text>
            </View>

            <View style={styles.catalogDivider} />

            <View style={styles.catalogRow}>
              <View style={styles.catalogLeft}>
                <Ionicons name="compass-outline" size={18} color={colors.navy} />
                <Text style={styles.catalogTitle}>Heritage Destinations</Text>
              </View>
              <Text style={styles.catalogCount}>{stats?.destinationsCount ?? 0}</Text>
            </View>

            <View style={styles.catalogDivider} />

            <View style={styles.catalogRow}>
              <View style={styles.catalogLeft}>
                <Ionicons name="calendar-outline" size={18} color={colors.navy} />
                <Text style={styles.catalogTitle}>Gatherings & Events</Text>
              </View>
              <Text style={styles.catalogCount}>{stats?.eventsCount ?? 0}</Text>
            </View>

            <View style={styles.catalogDivider} />

            <View style={styles.catalogRow}>
              <View style={styles.catalogLeft}>
                <Ionicons name="shirt-outline" size={18} color={colors.navy} />
                <Text style={styles.catalogTitle}>Artisan Products</Text>
              </View>
              <Text style={styles.catalogCount}>{stats?.productsCount ?? 0}</Text>
            </View>

            <View style={styles.catalogDivider} />

            <View style={styles.catalogRow}>
              <View style={styles.catalogLeft}>
                <Ionicons name="stats-chart-outline" size={18} color={colors.navy} />
                <Text style={styles.catalogTitle}>Investment Syndicates</Text>
              </View>
              <Text style={styles.catalogCount}>{stats?.investmentsCount ?? 0}</Text>
            </View>
          </Card>
        </View>

        {/* Member Directory Quick Banner */}
        <TouchableOpacity
          style={styles.membersCard}
          onPress={() => router.push('/(tabs)/members')}
          activeOpacity={0.8}
        >
          <View style={styles.membersIconBox}>
            <Ionicons name="people" size={22} color={colors.gold} />
          </View>
          <View style={styles.membersTextWrap}>
            <Text style={styles.membersTitle}>Diaspora Mobile Members Directory</Text>
            <Text style={styles.membersSub}>
              {stats?.registeredUsersCount ?? 0} Registered Members · {stats?.adminTeamCount ?? 1} Coordinators
            </Text>
          </View>
          <Ionicons name="arrow-forward" size={18} color="#FFFFFF" />
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  refreshBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  urgentBanner: {
    backgroundColor: colors.navy,
    borderRadius: radius.md,
    borderLeftWidth: 4,
    borderLeftColor: colors.gold,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 20,
    ...shadow.card,
  },
  urgentBadge: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: colors.error,
    alignItems: 'center',
    justifyContent: 'center',
  },
  urgentTextWrap: {
    flex: 1,
  },
  urgentTitle: {
    ...type.h3,
    color: '#FFFFFF',
    fontSize: 14.5,
  },
  urgentSubtitle: {
    ...type.caption,
    color: 'rgba(255, 255, 255, 0.7)',
    marginTop: 2,
  },
  healthyBanner: {
    backgroundColor: colors.successSoft,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: '#C6F6D5',
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 20,
  },
  healthyText: {
    ...type.caption,
    color: colors.success,
    fontWeight: '600',
  },
  sectionHeaderTitle: {
    fontFamily: fonts.sansBold,
    fontSize: 11,
    color: colors.textSecondary,
    letterSpacing: 1.2,
    marginBottom: 10,
    marginLeft: 2,
  },
  quickOpsSection: {
    marginBottom: 24,
  },
  quickOpsRow: {
    gap: 10,
  },
  quickActionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 14,
    width: 135,
    ...shadow.card,
  },
  actionIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  actionCardTitle: {
    ...type.caption,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  actionCardSub: {
    ...type.tiny,
    color: colors.textSecondary,
    marginTop: 2,
  },
  kpiSection: {
    marginBottom: 24,
  },
  kpiGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  kpiCard: {
    width: '48%',
    padding: 14,
  },
  kpiHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  kpiLabel: {
    ...type.tiny,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  kpiIconDot: {
    width: 24,
    height: 24,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  kpiValue: {
    fontFamily: fonts.sansBold,
    fontSize: 24,
    color: colors.textPrimary,
    marginTop: 8,
  },
  kpiSub: {
    ...type.tiny,
    color: colors.textTertiary,
    marginTop: 2,
  },
  catalogOverviewSection: {
    marginBottom: 24,
  },
  catalogCard: {
    paddingVertical: 4,
    paddingHorizontal: 16,
  },
  catalogRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
  },
  catalogLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  catalogTitle: {
    ...type.bodySmall,
    color: colors.textPrimary,
    fontWeight: '600',
  },
  catalogCount: {
    fontFamily: fonts.sansBold,
    fontSize: 14,
    color: colors.navy,
  },
  catalogDivider: {
    height: 1,
    backgroundColor: colors.separator,
  },
  membersCard: {
    backgroundColor: colors.navy,
    borderRadius: radius.md,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    ...shadow.card,
  },
  membersIconBox: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: 'rgba(223, 183, 108, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  membersTextWrap: {
    flex: 1,
  },
  membersTitle: {
    ...type.h3,
    color: '#FFFFFF',
    fontSize: 14,
  },
  membersSub: {
    ...type.caption,
    color: 'rgba(255, 255, 255, 0.7)',
    marginTop: 2,
  },
});
