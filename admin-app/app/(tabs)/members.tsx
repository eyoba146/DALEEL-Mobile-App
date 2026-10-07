import React, { useEffect, useState, useCallback } from 'react';
import {
  ActivityIndicator,
  Alert,
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
import { adminApi, type RegisteredUser, type AdminUser } from '../../lib/api';
import { ScreenHeader } from '../../components/ScreenHeader';
import { Card } from '../../components/Card';
import { EmptyState } from '../../components/EmptyState';
import { ErrorState } from '../../components/ErrorState';
import { colors, fonts, radius, shadow, spacing, type } from '../../theme/tokens';

export default function MembersScreen() {
  const router = useRouter();
  const { adminUser, isSuperAdmin } = useAdminAuth();
  const { success: toastSuccess, error: toastError } = useAdminToast();

  const [segment, setSegment] = useState<'members' | 'team'>('members');
  const [users, setUsers] = useState<RegisteredUser[]>([]);
  const [team, setTeam] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [fetchError, setFetchError] = useState<string | null>(null);

  const loadData = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setFetchError(null);

    try {
      if (segment === 'members') {
        const data = await adminApi.getRegisteredUsers({ search: search.trim() || undefined });
        setUsers(data.users || []);
      } else {
        const teamData = await adminApi.getTeam();
        setTeam(teamData || []);
      }
    } catch (err: any) {
      const msg = err.message || 'Failed to load directory';
      setFetchError(msg);
      toastError(msg);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [segment, search]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleToggleVerification = async (user: RegisteredUser) => {
    setTogglingId(user.id);
    const newStatus = !user.isVerified;
    try {
      await adminApi.updateRegisteredUser(user.id, { isVerified: newStatus });
      toastSuccess(`Verification ${newStatus ? 'granted' : 'revoked'} for ${user.name}`);
      setUsers((prev) =>
        prev.map((u) => (u.id === user.id ? { ...u, isVerified: newStatus } : u))
      );
    } catch (err: any) {
      toastError(err.message || 'Failed to update user verification');
    } finally {
      setTogglingId(null);
    }
  };

  const handleRevokeCoordinator = (id: string, name: string) => {
    if (id === adminUser?.id) {
      toastError('You cannot revoke your own administrative account.');
      return;
    }

    Alert.alert(
      'Revoke Coordinator Access',
      `Are you sure you wish to revoke administrative privileges for "${name}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Revoke Access',
          style: 'destructive',
          onPress: async () => {
            try {
              await adminApi.deleteTeamMember(id);
              toastSuccess(`Access revoked for ${name}`);
              setTeam((prev) => prev.filter((m) => m.id !== id));
            } catch (err: any) {
              toastError(err.message || 'Failed to remove coordinator');
            }
          },
        },
      ]
    );
  };

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
        return 'Platform Administrator';
    }
  };

  return (
    <View style={styles.container}>
      <ScreenHeader
        title="Members & Governance"
        subtitle="Diaspora mobile members and authorized administrative staff"
        variant="navy"
        badge={segment === 'members' ? `${users.length} Members` : `${team.length} Staff`}
        rightElement={
          <TouchableOpacity
            onPress={() => loadData(true)}
            style={styles.headerBtn}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="refresh-outline" size={18} color="#FFFFFF" />
          </TouchableOpacity>
        }
      />

      {/* Segment Switcher */}
      <View style={styles.topControlWrap}>
        <View style={styles.segmentContainer}>
          <TouchableOpacity
            style={[styles.segmentBtn, segment === 'members' && styles.segmentBtnActive]}
            onPress={() => setSegment('members')}
            activeOpacity={0.8}
          >
            <Ionicons
              name="people-outline"
              size={15}
              color={segment === 'members' ? colors.navy : colors.textSecondary}
            />
            <Text
              style={[
                styles.segmentText,
                segment === 'members' && styles.segmentTextActive,
              ]}
            >
              Diaspora Members
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.segmentBtn, segment === 'team' && styles.segmentBtnActive]}
            onPress={() => setSegment('team')}
            activeOpacity={0.8}
          >
            <Ionicons
              name="shield-outline"
              size={15}
              color={segment === 'team' ? colors.navy : colors.textSecondary}
            />
            <Text
              style={[
                styles.segmentText,
                segment === 'team' && styles.segmentTextActive,
              ]}
            >
              Staff Governance
            </Text>
          </TouchableOpacity>
        </View>

        {/* Search bar for members */}
        {segment === 'members' && (
          <View style={styles.searchBar}>
            <Ionicons name="search-outline" size={16} color={colors.textTertiary} />
            <TextInput
              placeholder="Search members by name, email..."
              placeholderTextColor={colors.textTertiary}
              value={search}
              onChangeText={setSearch}
              onSubmitEditing={() => loadData()}
              style={styles.searchInput}
            />
            {search.length > 0 && (
              <TouchableOpacity onPress={() => setSearch('')}>
                <Ionicons name="close-circle" size={16} color={colors.textTertiary} />
              </TouchableOpacity>
            )}
          </View>
        )}
      </View>

      {/* Directory List View */}
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => loadData(true)}
            tintColor={colors.gold}
          />
        }
      >
        {fetchError && (
          <ErrorState message={fetchError} onRetry={() => loadData()} />
        )}

        {loading && !refreshing ? (
          <View style={styles.loadingBox}>
            <ActivityIndicator size="small" color={colors.navy} />
            <Text style={styles.loadingText}>Loading directory...</Text>
          </View>
        ) : segment === 'members' ? (
          users.length === 0 ? (
            <EmptyState
              icon="people-outline"
              title="No Members Found"
              description="No registered mobile members match the active search filter."
            />
          ) : (
            users.map((user) => (
              <Card key={user.id} style={styles.userCard}>
                <TouchableOpacity
                  style={styles.userMainRow}
                  activeOpacity={0.7}
                  onPress={() => router.push({ pathname: '/user/[id]', params: { id: user.id } })}
                >
                  {/* Avatar Circle */}
                  <View style={styles.avatarCircle}>
                    <Text style={styles.avatarText}>
                      {user.name ? user.name.charAt(0).toUpperCase() : 'M'}
                    </Text>
                  </View>

                  <View style={styles.userMeta}>
                    <View style={styles.userNameRow}>
                      <Text style={styles.userName}>{user.name}</Text>
                      {user.isVerified ? (
                        <View style={styles.verifiedBadge}>
                          <Ionicons name="checkmark-circle" size={13} color={colors.goldText} />
                          <Text style={styles.verifiedBadgeText}>VERIFIED</Text>
                        </View>
                      ) : (
                        <View style={styles.unverifiedBadge}>
                          <Text style={styles.unverifiedBadgeText}>UNVERIFIED</Text>
                        </View>
                      )}
                    </View>

                    <Text style={styles.userEmail}>{user.email}</Text>
                    <Text style={styles.userLocation}>
                      {user.country || 'Global Diaspora'} · {user.userType === 'diaspora' ? 'Diaspora Member' : 'Foreign Resident'}
                    </Text>

                    {/* Activity Counters Strip */}
                    <View style={styles.countersRow}>
                      <View style={styles.counterItem}>
                        <Text style={styles.counterVal}>{user._count?.serviceInquiries ?? 0}</Text>
                        <Text style={styles.counterLbl}>Inquiries</Text>
                      </View>
                      <View style={styles.counterItem}>
                        <Text style={styles.counterVal}>{user._count?.eventRsvps ?? 0}</Text>
                        <Text style={styles.counterLbl}>RSVPs</Text>
                      </View>
                      <View style={styles.counterItem}>
                        <Text style={styles.counterVal}>{user._count?.productOrderInquiries ?? 0}</Text>
                        <Text style={styles.counterLbl}>Orders</Text>
                      </View>
                      <View style={styles.counterItem}>
                        <Text style={styles.counterVal}>{user._count?.favorites ?? 0}</Text>
                        <Text style={styles.counterLbl}>Saved</Text>
                      </View>
                    </View>
                  </View>
                </TouchableOpacity>

                {/* Footer Controls */}
                <View style={styles.userFooter}>
                  <Text style={styles.joinedDate}>
                    Joined {user.createdAt ? user.createdAt.split('T')[0] : 'Recently'}
                  </Text>

                  <TouchableOpacity
                    style={[
                      styles.verifyToggleBtn,
                      user.isVerified ? styles.verifyRevoke : styles.verifyGrant,
                    ]}
                    onPress={() => handleToggleVerification(user)}
                    disabled={togglingId === user.id}
                  >
                    {togglingId === user.id ? (
                      <ActivityIndicator size="small" color={user.isVerified ? colors.error : colors.navy} />
                    ) : (
                      <>
                        <Ionicons
                          name={user.isVerified ? 'close-circle-outline' : 'shield-checkmark-outline'}
                          size={14}
                          color={user.isVerified ? colors.error : colors.goldText}
                        />
                        <Text
                          style={[
                            styles.verifyToggleText,
                            { color: user.isVerified ? colors.error : colors.goldText },
                          ]}
                        >
                          {user.isVerified ? 'Revoke Badge' : 'Verify Member'}
                        </Text>
                      </>
                    )}
                  </TouchableOpacity>
                </View>
              </Card>
            ))
          )
        ) : (
          team.length === 0 ? (
            <EmptyState
              icon="shield-outline"
              title="No Staff Coordinators"
              description="No additional coordinators have been authorized on the platform."
            />
          ) : (
            team.map((member) => (
              <Card key={member.id} style={styles.teamCard}>
                <View style={styles.teamMainRow}>
                  <View style={styles.teamAvatarCircle}>
                    <Text style={styles.teamAvatarText}>
                      {member.name ? member.name.charAt(0).toUpperCase() : 'A'}
                    </Text>
                  </View>

                  <View style={styles.teamMeta}>
                    <View style={styles.teamTitleRow}>
                      <Text style={styles.teamName}>{member.name}</Text>
                      <View style={styles.roleBadge}>
                        <Text style={styles.roleBadgeText}>
                          {getRoleDisplayName(member.adminRole)}
                        </Text>
                      </View>
                    </View>

                    <Text style={styles.teamEmail}>{member.email}</Text>
                    {!!member.phone && (
                      <Text style={styles.teamPhone}>{member.phone}</Text>
                    )}
                  </View>
                </View>

                {isSuperAdmin && member.id !== adminUser?.id && (
                  <View style={styles.teamFooter}>
                    <TouchableOpacity
                      style={styles.revokeStaffBtn}
                      onPress={() => handleRevokeCoordinator(member.id, member.name)}
                    >
                      <Ionicons name="trash-outline" size={13} color={colors.error} />
                      <Text style={styles.revokeStaffText}>Revoke Staff Access</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </Card>
            ))
          )
        )}
      </ScrollView>

      {/* Floating Action Button for Coordinators (Super Admin Only) */}
      {segment === 'team' && isSuperAdmin && (
        <TouchableOpacity
          style={styles.fabBtn}
          onPress={() => router.push('/team/new')}
          activeOpacity={0.85}
        >
          <Ionicons name="person-add" size={20} color="#FFFFFF" />
          <Text style={styles.fabText}>Onboard Staff</Text>
        </TouchableOpacity>
      )}
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
  topControlWrap: {
    backgroundColor: '#FFFFFF',
    padding: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    ...shadow.card,
  },
  segmentContainer: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: 4,
  },
  segmentBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 8,
    borderRadius: radius.sm,
  },
  segmentBtnActive: {
    backgroundColor: '#FFFFFF',
    ...shadow.card,
  },
  segmentText: {
    fontSize: 12.5,
    fontFamily: fonts.sansMedium,
    color: colors.textSecondary,
  },
  segmentTextActive: {
    fontFamily: fonts.sansBold,
    color: colors.navy,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    marginTop: 10,
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
  userCard: {
    padding: 14,
  },
  userMainRow: {
    flexDirection: 'row',
    gap: 12,
  },
  avatarCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.surfaceWarm,
    borderWidth: 1,
    borderColor: colors.goldBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontFamily: fonts.sansBold,
    fontSize: 18,
    color: colors.goldText,
  },
  userMeta: {
    flex: 1,
  },
  userNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  userName: {
    ...type.caption,
    fontFamily: fonts.sansBold,
    fontSize: 14,
    color: colors.textPrimary,
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
  unverifiedBadge: {
    backgroundColor: colors.surface,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  unverifiedBadgeText: {
    fontSize: 9.5,
    fontFamily: fonts.sansMedium,
    color: colors.textTertiary,
  },
  userEmail: {
    ...type.tiny,
    color: colors.textSecondary,
    marginTop: 2,
  },
  userLocation: {
    ...type.tiny,
    color: colors.textTertiary,
    marginTop: 2,
  },
  countersRow: {
    flexDirection: 'row',
    marginTop: 10,
    backgroundColor: colors.surface,
    borderRadius: 6,
    padding: 6,
  },
  counterItem: {
    flex: 1,
    alignItems: 'center',
  },
  counterVal: {
    fontSize: 12.5,
    fontFamily: fonts.sansBold,
    color: colors.navy,
  },
  counterLbl: {
    fontSize: 9,
    fontFamily: fonts.sansMedium,
    color: colors.textTertiary,
  },
  userFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: colors.separator,
    marginTop: 10,
    paddingTop: 8,
  },
  joinedDate: {
    fontSize: 11,
    fontFamily: fonts.sansRegular,
    color: colors.textTertiary,
  },
  verifyToggleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: radius.sm,
  },
  verifyGrant: {
    backgroundColor: colors.surfaceWarm,
    borderWidth: 1,
    borderColor: colors.goldBorder,
  },
  verifyRevoke: {
    backgroundColor: colors.errorSoft,
    borderWidth: 1,
    borderColor: '#FED7D7',
  },
  verifyToggleText: {
    fontSize: 11,
    fontFamily: fonts.sansBold,
  },
  teamCard: {
    padding: 14,
  },
  teamMainRow: {
    flexDirection: 'row',
    gap: 12,
  },
  teamAvatarCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.navy,
    alignItems: 'center',
    justifyContent: 'center',
  },
  teamAvatarText: {
    fontFamily: fonts.sansBold,
    fontSize: 18,
    color: '#FFFFFF',
  },
  teamMeta: {
    flex: 1,
  },
  teamTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    flexWrap: 'wrap',
  },
  teamName: {
    ...type.caption,
    fontFamily: fonts.sansBold,
    fontSize: 14,
    color: colors.textPrimary,
  },
  roleBadge: {
    backgroundColor: colors.goldSoft,
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: colors.goldBorder,
  },
  roleBadgeText: {
    fontSize: 10,
    fontFamily: fonts.sansBold,
    color: colors.goldText,
  },
  teamEmail: {
    ...type.tiny,
    color: colors.textSecondary,
    marginTop: 2,
  },
  teamPhone: {
    ...type.tiny,
    color: colors.textTertiary,
    marginTop: 2,
  },
  teamFooter: {
    borderTopWidth: 1,
    borderTopColor: colors.separator,
    marginTop: 10,
    paddingTop: 8,
    alignItems: 'flex-end',
  },
  revokeStaffBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: radius.sm,
    backgroundColor: colors.errorSoft,
  },
  revokeStaffText: {
    fontSize: 11,
    fontFamily: fonts.sansBold,
    color: colors.error,
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
