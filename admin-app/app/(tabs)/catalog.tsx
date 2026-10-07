import React, { useEffect, useState, useCallback } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAdminAuth } from '../../lib/auth-context';
import { useAdminToast } from '../../lib/toast-context';
import { adminApi } from '../../lib/api';
import { ScreenHeader } from '../../components/ScreenHeader';
import { Card } from '../../components/Card';
import { EmptyState } from '../../components/EmptyState';
import { ErrorState } from '../../components/ErrorState';
import { colors, fonts, radius, shadow, spacing, type } from '../../theme/tokens';

type CatalogTab = 'services' | 'destinations' | 'events' | 'products' | 'investments';

const CATALOG_MODULES: Array<{ id: CatalogTab; label: string; icon: keyof typeof Ionicons.glyphMap }> = [
  { id: 'services', label: 'Services', icon: 'business-outline' },
  { id: 'destinations', label: 'Destinations', icon: 'compass-outline' },
  { id: 'events', label: 'Events', icon: 'calendar-outline' },
  { id: 'products', label: 'Marketplace', icon: 'shirt-outline' },
  { id: 'investments', label: 'Investments', icon: 'stats-chart-outline' },
];

export default function CatalogScreen() {
  const router = useRouter();
  const { isSuperAdmin, canManageServices, canManageDestinations, canManageEvents, canManageMarketplace, canManageInvestments } = useAdminAuth();
  const { success: toastSuccess, error: toastError } = useAdminToast();

  const [activeTab, setActiveTab] = useState<CatalogTab>('services');
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [fetchError, setFetchError] = useState<string | null>(null);

  const loadCatalogData = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setFetchError(null);

    try {
      let data: any[] = [];
      switch (activeTab) {
        case 'services':
          data = await adminApi.getServices();
          break;
        case 'destinations':
          data = await adminApi.getDestinations();
          break;
        case 'events':
          data = await adminApi.getEvents();
          break;
        case 'products':
          data = await adminApi.getProducts();
          break;
        case 'investments':
          data = await adminApi.getInvestments();
          break;
      }
      setItems(data || []);
    } catch (err: any) {
      const msg = err.message || `Failed to load ${activeTab} catalog`;
      setFetchError(msg);
      toastError(msg);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [activeTab]);

  useEffect(() => {
    loadCatalogData();
  }, [loadCatalogData]);

  const handleDeleteItem = (id: string, title: string) => {
    Alert.alert(
      'Confirm Deletion',
      `Are you sure you wish to permanently remove "${title}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              switch (activeTab) {
                case 'services':
                  await adminApi.deleteService(id);
                  break;
                case 'destinations':
                  await adminApi.deleteDestination(id);
                  break;
                case 'events':
                  await adminApi.deleteEvent(id);
                  break;
                case 'products':
                  await adminApi.deleteProduct(id);
                  break;
                case 'investments':
                  await adminApi.deleteInvestment(id);
                  break;
              }
              toastSuccess(`"${title}" removed.`);
              setItems((prev) => prev.filter((item) => item.id !== id));
            } catch (err: any) {
              toastError(err.message || 'Failed to delete entity');
            }
          },
        },
      ]
    );
  };

  const handleCreateNew = () => {
    switch (activeTab) {
      case 'services':
        router.push('/service/new');
        break;
      case 'destinations':
        router.push('/destination/new');
        break;
      case 'events':
        router.push('/event/new');
        break;
      case 'products':
        router.push('/product/new');
        break;
      case 'investments':
        router.push('/investment/new');
        break;
    }
  };

  const handleEditItem = (id: string) => {
    switch (activeTab) {
      case 'services':
        router.push(`/service/${id}`);
        break;
      case 'destinations':
        router.push(`/destination/${id}`);
        break;
      case 'events':
        router.push(`/event/${id}`);
        break;
      case 'products':
        router.push(`/product/${id}`);
        break;
      case 'investments':
        router.push(`/investment/${id}`);
        break;
    }
  };

  const filteredItems = items.filter((item) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    const title = (item.title || item.name || '').toLowerCase();
    const category = (item.category || item.region || item.sector || '').toLowerCase();
    const sub = (item.location || item.blurb || '').toLowerCase();
    return title.includes(q) || category.includes(q) || sub.includes(q);
  });

  return (
    <View style={styles.container}>
      <ScreenHeader
        title="Directory & Catalog"
        subtitle="Operational catalog management across 5 sectors"
        variant="navy"
        badge={`${items.length} Total`}
        rightElement={
          <TouchableOpacity
            onPress={() => loadCatalogData(true)}
            style={styles.headerBtn}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="refresh-outline" size={18} color="#FFFFFF" />
          </TouchableOpacity>
        }
      />

      {/* Module Selector Track */}
      <View style={styles.tabBarWrap}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.moduleTabsRow}
        >
          {CATALOG_MODULES.map((mod) => {
            const isActive = activeTab === mod.id;
            return (
              <TouchableOpacity
                key={mod.id}
                onPress={() => setActiveTab(mod.id)}
                style={[styles.moduleTab, isActive && styles.moduleTabActive]}
              >
                <Ionicons
                  name={mod.icon}
                  size={15}
                  color={isActive ? colors.navy : colors.textSecondary}
                />
                <Text
                  style={[styles.moduleTabText, isActive && styles.moduleTabTextActive]}
                >
                  {mod.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Search Field */}
        <View style={styles.searchBar}>
          <Ionicons name="search-outline" size={16} color={colors.textTertiary} />
          <TextInput
            placeholder={`Search ${activeTab}...`}
            placeholderTextColor={colors.textTertiary}
            value={search}
            onChangeText={setSearch}
            style={styles.searchInput}
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => setSearch('')}>
              <Ionicons name="close-circle" size={16} color={colors.textTertiary} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Entity List */}
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => loadCatalogData(true)}
            tintColor={colors.gold}
          />
        }
      >
        {fetchError && (
          <ErrorState message={fetchError} onRetry={() => loadCatalogData()} />
        )}

        {loading && !refreshing ? (
          <View style={styles.loadingBox}>
            <ActivityIndicator size="small" color={colors.navy} />
            <Text style={styles.loadingText}>Loading {activeTab}...</Text>
          </View>
        ) : filteredItems.length === 0 ? (
          <EmptyState
            icon="folder-open-outline"
            title={`No ${activeTab} Found`}
            description={
              search
                ? `No entries match "${search}". Try another keyword.`
                : `No ${activeTab} entries have been created yet.`
            }
            actionLabel="+ Add New Entry"
            onAction={handleCreateNew}
          />
        ) : (
          filteredItems.map((item) => {
            const title = item.title || item.name;
            const category = item.category || item.region || item.sector;
            const sub = item.venue || item.location || item.blurb;
            const imageUri = item.image;

            return (
              <Card key={item.id} style={styles.itemCard}>
                <View style={styles.cardMainRow}>
                  {/* Thumbnail Photo */}
                  {imageUri ? (
                    <Image source={{ uri: imageUri }} style={styles.thumbnail} />
                  ) : (
                    <View style={styles.placeholderThumbnail}>
                      <Ionicons name="image-outline" size={20} color={colors.textTertiary} />
                    </View>
                  )}

                  {/* Text Details */}
                  <View style={styles.detailsCol}>
                    <View style={styles.badgeRow}>
                      <View style={styles.categoryBadge}>
                        <Text style={styles.categoryBadgeText}>{category}</Text>
                      </View>
                      {item.verified && (
                        <View style={styles.verifiedBadge}>
                          <Ionicons name="shield-checkmark" size={11} color={colors.goldText} />
                          <Text style={styles.verifiedBadgeText}>VERIFIED</Text>
                        </View>
                      )}
                      {item.price && (
                        <Text style={styles.priceTag}>
                          {typeof item.price === 'number'
                            ? `${item.price.toLocaleString()} ETB`
                            : item.price}
                        </Text>
                      )}
                      {item.minInvestment && (
                        <Text style={styles.priceTag}>
                          Min ${item.minInvestment.toLocaleString()}
                        </Text>
                      )}
                    </View>

                    <Text style={styles.cardTitle} numberOfLines={1}>
                      {title}
                    </Text>

                    {sub && (
                      <Text style={styles.cardSub} numberOfLines={2}>
                        {sub}
                      </Text>
                    )}

                    {/* Footer indicators */}
                    <View style={styles.indicatorsRow}>
                      {item.date && (
                        <View style={styles.metaItem}>
                          <Ionicons name="calendar-outline" size={12} color={colors.textSecondary} />
                          <Text style={styles.metaText}>{item.date.split('T')[0]}</Text>
                        </View>
                      )}
                      {item.capacity && (
                        <View style={styles.metaItem}>
                          <Ionicons name="people-outline" size={12} color={colors.textSecondary} />
                          <Text style={styles.metaText}>{item.capacity} max</Text>
                        </View>
                      )}
                      {item.expectedReturn && (
                        <View style={styles.metaItem}>
                          <Ionicons name="trending-up-outline" size={12} color="#15803D" />
                          <Text style={[styles.metaText, { color: '#15803D', fontWeight: '600' }]}>
                            {item.expectedReturn}
                          </Text>
                        </View>
                      )}
                    </View>
                  </View>
                </View>

                {/* Card Action Controls */}
                <View style={styles.actionsBar}>
                  <TouchableOpacity
                    style={styles.editBtn}
                    onPress={() => handleEditItem(item.id)}
                    activeOpacity={0.7}
                  >
                    <Ionicons name="create-outline" size={14} color={colors.navy} />
                    <Text style={styles.editBtnText}>Edit Details</Text>
                  </TouchableOpacity>

                  {activeTab === 'events' && (
                    <TouchableOpacity
                      style={styles.checkInShortcutBtn}
                      onPress={() => router.push(`/event/${item.id}`)}
                      activeOpacity={0.7}
                    >
                      <Ionicons name="qr-code-outline" size={14} color={colors.goldText} />
                      <Text style={styles.checkInShortcutText}>RSVP Passes</Text>
                    </TouchableOpacity>
                  )}

                  <TouchableOpacity
                    style={styles.deleteBtn}
                    onPress={() => handleDeleteItem(item.id, title)}
                    activeOpacity={0.7}
                  >
                    <Ionicons name="trash-outline" size={14} color={colors.error} />
                  </TouchableOpacity>
                </View>
              </Card>
            );
          })
        )}
      </ScrollView>

      {/* Floating Action Button (+ New) */}
      <TouchableOpacity
        style={styles.fabBtn}
        onPress={handleCreateNew}
        activeOpacity={0.85}
      >
        <Ionicons name="add" size={24} color="#FFFFFF" />
        <Text style={styles.fabText}>Add Entry</Text>
      </TouchableOpacity>
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
  tabBarWrap: {
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingTop: 8,
    paddingBottom: 10,
    ...shadow.card,
  },
  moduleTabsRow: {
    paddingHorizontal: 16,
    gap: 8,
    paddingBottom: 10,
  },
  moduleTab: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 999,
    backgroundColor: colors.surface,
  },
  moduleTabActive: {
    backgroundColor: colors.goldSoft,
    borderWidth: 1,
    borderColor: colors.goldBorder,
  },
  moduleTabText: {
    fontSize: 12,
    fontFamily: fonts.sansMedium,
    color: colors.textSecondary,
  },
  moduleTabTextActive: {
    color: colors.goldText,
    fontFamily: fonts.sansBold,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    marginHorizontal: 16,
    paddingHorizontal: 12,
    height: 38,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    fontFamily: fonts.sansRegular,
    color: colors.textPrimary,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 90,
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
  itemCard: {
    padding: 14,
  },
  cardMainRow: {
    flexDirection: 'row',
    gap: 12,
  },
  thumbnail: {
    width: 76,
    height: 76,
    borderRadius: radius.sm,
    backgroundColor: colors.surface,
  },
  placeholderThumbnail: {
    width: 76,
    height: 76,
    borderRadius: radius.sm,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  detailsCol: {
    flex: 1,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexWrap: 'wrap',
    marginBottom: 4,
  },
  categoryBadge: {
    backgroundColor: colors.surface,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  categoryBadgeText: {
    fontSize: 10,
    fontFamily: fonts.sansBold,
    color: colors.textSecondary,
  },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: colors.goldSoft,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: colors.goldBorder,
  },
  verifiedBadgeText: {
    fontSize: 9.5,
    fontFamily: fonts.sansBold,
    color: colors.goldText,
  },
  priceTag: {
    fontSize: 11,
    fontFamily: fonts.sansBold,
    color: colors.navy,
    marginLeft: 'auto',
  },
  cardTitle: {
    ...type.caption,
    fontFamily: fonts.sansBold,
    color: colors.textPrimary,
    fontSize: 14,
    marginBottom: 2,
  },
  cardSub: {
    ...type.tiny,
    color: colors.textSecondary,
    lineHeight: 14,
    marginBottom: 6,
  },
  indicatorsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    fontSize: 11,
    fontFamily: fonts.sansRegular,
    color: colors.textSecondary,
  },
  actionsBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 8,
    borderTopWidth: 1,
    borderTopColor: colors.separator,
    marginTop: 10,
    paddingTop: 8,
  },
  editBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: radius.sm,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  editBtnText: {
    fontSize: 11.5,
    fontFamily: fonts.sansBold,
    color: colors.navy,
  },
  checkInShortcutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: radius.sm,
    backgroundColor: colors.surfaceWarm,
    borderWidth: 1,
    borderColor: colors.goldBorder,
  },
  checkInShortcutText: {
    fontSize: 11.5,
    fontFamily: fonts.sansBold,
    color: colors.goldText,
  },
  deleteBtn: {
    padding: 6,
    borderRadius: radius.sm,
    backgroundColor: colors.errorSoft,
    borderWidth: 1,
    borderColor: '#FED7D7',
  },
  fabBtn: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    backgroundColor: colors.navy,
    borderRadius: 999,
    paddingHorizontal: 18,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    ...shadow.modal,
  },
  fabText: {
    color: '#FFFFFF',
    fontFamily: fonts.sansBold,
    fontSize: 13,
  },
});
