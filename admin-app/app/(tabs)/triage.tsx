import React, { useEffect, useState, useCallback } from 'react';
import {
  ActivityIndicator,
  Linking,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAdminAuth } from '../../lib/auth-context';
import { useAdminToast } from '../../lib/toast-context';
import { adminApi, type UnifiedInquiryItem } from '../../lib/api';
import { ScreenHeader } from '../../components/ScreenHeader';
import { Card } from '../../components/Card';
import { EmptyState } from '../../components/EmptyState';
import { ErrorState } from '../../components/ErrorState';
import { colors, fonts, radius, shadow, spacing, type } from '../../theme/tokens';

const DEPARTMENTS = [
  { id: 'all', label: 'All Queues' },
  { id: 'SERVICES', label: 'Services' },
  { id: 'EVENTS', label: 'Events' },
  { id: 'MARKETPLACE', label: 'Marketplace' },
  { id: 'INVESTMENTS', label: 'Investments' },
];

const STATUS_FILTERS = [
  { id: 'all', label: 'All' },
  { id: 'active', label: 'Active' },
  { id: 'confirmed', label: 'Confirmed' },
  { id: 'cancelled', label: 'Cancelled' },
];

export default function TriageScreen() {
  const { adminUser } = useAdminAuth();
  const { success: toastSuccess, error: toastError } = useAdminToast();

  const [inquiries, setInquiries] = useState<UnifiedInquiryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [selectedDept, setSelectedDept] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('active');
  const [fetchError, setFetchError] = useState<string | null>(null);

  const loadInquiries = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setFetchError(null);

    try {
      const data = await adminApi.getUnifiedInquiries({
        department: selectedDept === 'all' ? undefined : selectedDept,
        status: selectedStatus === 'all' ? undefined : selectedStatus,
        search: search.trim() || undefined,
      });
      setInquiries(data.inquiries || []);
    } catch (err: any) {
      const msg = err.message || 'Failed to load triage queue';
      setFetchError(msg);
      toastError(msg);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [selectedDept, selectedStatus, search]);

  useEffect(() => {
    loadInquiries();
  }, [loadInquiries]);

  const handleUpdateStatus = async (item: UnifiedInquiryItem, newStatus: string) => {
    setUpdatingId(item.id);
    try {
      await adminApi.updateUnifiedInquiryStatus(item.module, item.id, newStatus);
      toastSuccess(`Inquiry updated to ${newStatus}`);
      // Optimistic update
      setInquiries((prev) =>
        prev.map((inq) => (inq.id === item.id ? { ...inq, status: newStatus } : inq))
      );
    } catch (err: any) {
      toastError(err.message || 'Failed to update status');
    } finally {
      setUpdatingId(null);
    }
  };

  const getModuleBadgeColor = (module: string) => {
    switch (module) {
      case 'SERVICES':
        return { bg: '#EFF6FF', text: '#2563EB', border: '#BFDBFE' };
      case 'EVENTS':
        return { bg: '#FDF8E8', text: colors.goldText, border: colors.goldBorder };
      case 'MARKETPLACE':
        return { bg: '#F0FDF4', text: '#15803D', border: '#BBF7D0' };
      case 'INVESTMENTS':
        return { bg: '#F5F3FF', text: '#7C3AED', border: '#DDD6FE' };
      default:
        return { bg: colors.surface, text: colors.textSecondary, border: colors.border };
    }
  };

  const getStatusBadgeColor = (status: string) => {
    const s = status.toLowerCase();
    if (s.includes('confirm') || s.includes('complete')) {
      return { bg: colors.statusConfirmedSoft, text: colors.statusConfirmed };
    }
    if (s.includes('cancel')) {
      return { bg: colors.statusCancelledSoft, text: colors.statusCancelled };
    }
    return { bg: colors.statusPendingSoft, text: colors.statusPending };
  };

  return (
    <View style={styles.container}>
      <ScreenHeader
        title="Triage Desk"
        subtitle="Role-based incoming inquiries & formal orders"
        variant="navy"
        badge={`${inquiries.length} Active`}
        rightElement={
          <TouchableOpacity
            onPress={() => loadInquiries(true)}
            style={styles.headerBtn}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="refresh-outline" size={18} color="#FFFFFF" />
          </TouchableOpacity>
        }
      />

      {/* Filter and Search Bar */}
      <View style={styles.filterBar}>
        <View style={styles.searchWrap}>
          <Ionicons name="search-outline" size={16} color={colors.textTertiary} />
          <TextInput
            placeholder="Search customer, title, email..."
            placeholderTextColor={colors.textTertiary}
            value={search}
            onChangeText={setSearch}
            onSubmitEditing={() => loadInquiries()}
            style={styles.searchInput}
            returnKeyType="search"
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => setSearch('')}>
              <Ionicons name="close-circle" size={16} color={colors.textTertiary} />
            </TouchableOpacity>
          )}
        </View>

        {/* Department Track */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.deptRow}
        >
          {DEPARTMENTS.map((dept) => {
            const isSelected = selectedDept === dept.id;
            return (
              <TouchableOpacity
                key={dept.id}
                onPress={() => setSelectedDept(dept.id)}
                style={[styles.deptPill, isSelected && styles.deptPillActive]}
              >
                <Text style={[styles.deptPillText, isSelected && styles.deptPillTextActive]}>
                  {dept.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Status Track */}
        <View style={styles.statusRow}>
          {STATUS_FILTERS.map((st) => {
            const isSelected = selectedStatus === st.id;
            return (
              <TouchableOpacity
                key={st.id}
                onPress={() => setSelectedStatus(st.id)}
                style={[styles.statusChip, isSelected && styles.statusChipActive]}
              >
                <Text style={[styles.statusChipText, isSelected && styles.statusChipTextActive]}>
                  {st.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* Inquiries List View */}
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => loadInquiries(true)}
            tintColor={colors.gold}
          />
        }
      >
        {fetchError && (
          <ErrorState message={fetchError} onRetry={() => loadInquiries()} />
        )}

        {loading && !refreshing ? (
          <View style={styles.loadingBox}>
            <ActivityIndicator size="small" color={colors.navy} />
            <Text style={styles.loadingText}>Loading triage queue...</Text>
          </View>
        ) : inquiries.length === 0 ? (
          <EmptyState
            icon="file-tray-outline"
            title="Triage Queue Clear"
            description="No matching inquiries or orders found for the current department and status filter."
            actionLabel="Reset Filters"
            onAction={() => {
              setSelectedDept('all');
              setSelectedStatus('all');
              setSearch('');
            }}
          />
        ) : (
          inquiries.map((item) => {
            const deptTheme = getModuleBadgeColor(item.module);
            const statusTheme = getStatusBadgeColor(item.status);
            const isItemUpdating = updatingId === item.id;

            return (
              <Card key={`${item.module}-${item.id}`} style={styles.inquiryCard}>
                {/* Header row: Department & Status Badges */}
                <View style={styles.cardHeaderRow}>
                  <View
                    style={[
                      styles.deptBadge,
                      { backgroundColor: deptTheme.bg, borderColor: deptTheme.border },
                    ]}
                  >
                    <Text style={[styles.deptBadgeText, { color: deptTheme.text }]}>
                      {item.moduleLabel}
                    </Text>
                  </View>

                  <View style={[styles.statusBadge, { backgroundColor: statusTheme.bg }]}>
                    <Text style={[styles.statusBadgeText, { color: statusTheme.text }]}>
                      {item.status.toUpperCase()}
                    </Text>
                  </View>
                </View>

                {/* Title & Customer Information */}
                <Text style={styles.itemTitle}>{item.title}</Text>

                <View style={styles.customerBox}>
                  <View style={styles.customerRow}>
                    <Ionicons name="person-circle-outline" size={16} color={colors.textSecondary} />
                    <Text style={styles.customerName}>{item.customerName}</Text>
                  </View>
                  <View style={styles.customerRow}>
                    <Ionicons name="mail-outline" size={15} color={colors.textTertiary} />
                    <Text style={styles.customerDetailText}>{item.customerEmail}</Text>
                  </View>
                  {!!item.customerPhone && (
                    <View style={styles.customerRow}>
                      <Ionicons name="call-outline" size={15} color={colors.textTertiary} />
                      <Text style={styles.customerDetailText}>{item.customerPhone}</Text>
                    </View>
                  )}
                </View>

                {/* Additional context message / note if present */}
                {!!item.details?.message && (
                  <View style={styles.messageBox}>
                    <Text style={styles.messageText} numberOfLines={3}>
                      "{item.details.message}"
                    </Text>
                  </View>
                )}

                {/* Actions & Triage Controls */}
                <View style={styles.cardFooter}>
                  {/* Left: Direct Call / WhatsApp */}
                  <View style={styles.contactActions}>
                    {!!item.customerPhone && (
                      <TouchableOpacity
                        style={styles.contactBtn}
                        onPress={() => Linking.openURL(`tel:${item.customerPhone}`)}
                        activeOpacity={0.7}
                      >
                        <Ionicons name="call" size={14} color={colors.navy} />
                      </TouchableOpacity>
                    )}
                    {!!item.customerWhatsapp && (
                      <TouchableOpacity
                        style={[styles.contactBtn, { backgroundColor: '#F0FDF4' }]}
                        onPress={() =>
                          Linking.openURL(
                            `https://wa.me/${item.customerWhatsapp?.replace(/[^0-9]/g, '')}`
                          )
                        }
                        activeOpacity={0.7}
                      >
                        <Ionicons name="logo-whatsapp" size={14} color="#15803D" />
                      </TouchableOpacity>
                    )}
                  </View>

                  {/* Right: State Transition Buttons */}
                  <View style={styles.stateButtons}>
                    {isItemUpdating ? (
                      <ActivityIndicator size="small" color={colors.navy} />
                    ) : (
                      <>
                        {item.status !== 'confirmed' && item.status !== 'completed' && (
                          <TouchableOpacity
                            style={[styles.actionBtn, styles.actionConfirm]}
                            onPress={() =>
                              handleUpdateStatus(
                                item,
                                item.module === 'SERVICES' ? 'completed' : 'confirmed'
                              )
                            }
                          >
                            <Ionicons name="checkmark" size={14} color="#15803D" />
                            <Text style={styles.actionConfirmText}>Confirm</Text>
                          </TouchableOpacity>
                        )}

                        {item.status !== 'cancelled' && (
                          <TouchableOpacity
                            style={[styles.actionBtn, styles.actionCancel]}
                            onPress={() => handleUpdateStatus(item, 'cancelled')}
                          >
                            <Ionicons name="close" size={14} color={colors.error} />
                            <Text style={styles.actionCancelText}>Cancel</Text>
                          </TouchableOpacity>
                        )}
                      </>
                    )}
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
    backgroundColor: colors.background,
  },
  headerBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterBar: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    ...shadow.card,
  },
  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    paddingHorizontal: 12,
    height: 40,
    gap: 8,
    marginBottom: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 13.5,
    fontFamily: fonts.sansRegular,
    color: colors.textPrimary,
  },
  deptRow: {
    gap: 8,
    paddingBottom: 8,
  },
  deptPill: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 999,
    backgroundColor: colors.surface,
  },
  deptPillActive: {
    backgroundColor: colors.navy,
  },
  deptPillText: {
    fontSize: 12,
    fontFamily: fonts.sansMedium,
    color: colors.textSecondary,
  },
  deptPillTextActive: {
    color: '#FFFFFF',
    fontFamily: fonts.sansBold,
  },
  statusRow: {
    flexDirection: 'row',
    gap: 8,
    paddingTop: 4,
    paddingBottom: 4,
  },
  statusChip: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 5,
    borderRadius: radius.sm,
    backgroundColor: 'transparent',
  },
  statusChipActive: {
    backgroundColor: colors.surfaceWarm,
    borderBottomWidth: 2,
    borderBottomColor: colors.gold,
  },
  statusChipText: {
    fontSize: 11.5,
    fontFamily: fonts.sansMedium,
    color: colors.textSecondary,
  },
  statusChipTextActive: {
    color: colors.goldText,
    fontFamily: fonts.sansBold,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
    gap: 12,
  },
  loadingBox: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48,
    gap: 10,
  },
  loadingText: {
    ...type.bodySmall,
    color: colors.textSecondary,
  },
  inquiryCard: {
    padding: 16,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  deptBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
  },
  deptBadgeText: {
    fontSize: 10.5,
    fontFamily: fonts.sansBold,
    letterSpacing: 0.5,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  statusBadgeText: {
    fontSize: 10,
    fontFamily: fonts.sansBold,
    letterSpacing: 0.5,
  },
  itemTitle: {
    ...type.h3,
    color: colors.textPrimary,
    marginBottom: 10,
  },
  customerBox: {
    backgroundColor: colors.surface,
    borderRadius: radius.sm,
    padding: 10,
    gap: 4,
    marginBottom: 10,
  },
  customerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  customerName: {
    ...type.caption,
    fontFamily: fonts.sansBold,
    color: colors.textPrimary,
  },
  customerDetailText: {
    ...type.tiny,
    color: colors.textSecondary,
  },
  messageBox: {
    backgroundColor: '#F8FAFC',
    borderLeftWidth: 3,
    borderLeftColor: colors.gold,
    padding: 8,
    borderRadius: 4,
    marginBottom: 12,
  },
  messageText: {
    ...type.caption,
    fontStyle: 'italic',
    color: colors.textSecondary,
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: colors.separator,
    paddingTop: 10,
  },
  contactActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  contactBtn: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stateButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
  },
  actionConfirm: {
    backgroundColor: '#F0FDF4',
    borderWidth: 1,
    borderColor: '#BBF7D0',
  },
  actionConfirmText: {
    fontSize: 11,
    fontFamily: fonts.sansBold,
    color: '#15803D',
  },
  actionCancel: {
    backgroundColor: colors.errorSoft,
    borderWidth: 1,
    borderColor: '#FED7D7',
  },
  actionCancelText: {
    fontSize: 11,
    fontFamily: fonts.sansBold,
    color: colors.error,
  },
});
