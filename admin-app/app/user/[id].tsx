import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { ScreenHeader } from '../../components/ScreenHeader';
import { Card } from '../../components/Card';
import { Button } from '../../components/Button';
import { adminApi, RegisteredUser } from '../../lib/api';
import { useToast } from '../../lib/toast-context';
import { colors, type, fonts, radius } from '../../theme/tokens';

export default function UserDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { showToast } = useToast();

  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<RegisteredUser | null>(null);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    if (id) {
      loadUser(id);
    }
  }, [id]);

  const loadUser = async (userId: string) => {
    try {
      setLoading(true);
      const res = await adminApi.getRegisteredUsers();
      const match = res.users.find((u) => u.id === userId);
      if (match) {
        setUser(match);
      } else {
        showToast('Member not found', 'error');
        router.back();
      }
    } catch (err: any) {
      showToast(err.message || 'Failed to load member profile', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleVerification = async (current: boolean) => {
    if (!user) return;
    const nextState = !current;
    Alert.alert(
      nextState ? 'Verify Diaspora Member' : 'Revoke Verification',
      nextState
        ? `Grant verified status to ${user.name}? This activates the gold verification badge.`
        : `Revoke verification badge for ${user.name}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: nextState ? 'Verify' : 'Revoke',
          style: nextState ? 'default' : 'destructive',
          onPress: async () => {
            try {
              setUpdating(true);
              const updated = await adminApi.updateRegisteredUser(user.id, {
                isVerified: nextState,
                revokeVerification: !nextState,
              });
              setUser(updated);
              showToast(
                nextState ? 'Member verified successfully' : 'Member verification revoked',
                'success'
              );
            } catch (err: any) {
              showToast(err.message || 'Failed to update verification', 'error');
            } finally {
              setUpdating(false);
            }
          },
        },
      ]
    );
  };

  const handleToggleActive = async (currentActive: boolean) => {
    if (!user) return;
    const nextActive = !currentActive;
    Alert.alert(
      nextActive ? 'Activate Account' : 'Suspend Account',
      nextActive
        ? `Re-activate login access for ${user.name}?`
        : `Suspend account access for ${user.name}? The user will be logged out.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: nextActive ? 'Activate' : 'Suspend',
          style: nextActive ? 'default' : 'destructive',
          onPress: async () => {
            try {
              setUpdating(true);
              const updated = await adminApi.updateRegisteredUser(user.id, {
                isActive: nextActive,
              });
              setUser(updated);
              showToast(
                nextActive ? 'Member account active' : 'Member account suspended',
                'success'
              );
            } catch (err: any) {
              showToast(err.message || 'Failed to toggle account status', 'error');
            } finally {
              setUpdating(false);
            }
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={colors.gold} />
      </View>
    );
  }

  if (!user) return null;

  const initials = user.name
    ? user.name
        .split(' ')
        .map((p) => p[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    : 'U';

  const isVerified = user.isVerified;
  const isActive = user.isActive ?? true;

  return (
    <View style={styles.container}>
      <ScreenHeader
        title={user.name}
        subtitle={user.email}
        showBack
        variant="navy"
        badge={isVerified ? 'VERIFIED' : 'UNVERIFIED'}
      />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Profile Card */}
        <Card style={styles.profileCard}>
          <View style={styles.profileRow}>
            <View style={styles.avatarCircle}>
              <Text style={styles.avatarInitials}>{initials}</Text>
            </View>
            <View style={styles.profileDetails}>
              <Text style={styles.profileName}>{user.name}</Text>
              <Text style={styles.profileEmail}>{user.email}</Text>
              <View style={styles.typeBadge}>
                <Ionicons
                  name={user.userType === 'diaspora' ? 'airplane' : 'home'}
                  size={12}
                  color={colors.gold}
                />
                <Text style={styles.typeBadgeText}>
                  {user.userType === 'diaspora' ? 'Diaspora Citizen' : 'Foreign Resident'}
                </Text>
              </View>
            </View>
          </View>
        </Card>

        {/* Member Engagement Counters */}
        <Text style={styles.sectionHeading}>ENGAGEMENT & ACTIVITY</Text>
        <View style={styles.statsGrid}>
          <Card style={styles.statBox}>
            <Text style={styles.statNum}>{user._count?.serviceInquiries ?? 0}</Text>
            <Text style={styles.statLabel}>Service Requests</Text>
          </Card>
          <Card style={styles.statBox}>
            <Text style={styles.statNum}>{user._count?.eventRsvps ?? 0}</Text>
            <Text style={styles.statLabel}>Summit RSVPs</Text>
          </Card>
          <Card style={styles.statBox}>
            <Text style={styles.statNum}>{user._count?.productOrderInquiries ?? 0}</Text>
            <Text style={styles.statLabel}>Craft Inquiries</Text>
          </Card>
          <Card style={styles.statBox}>
            <Text style={styles.statNum}>{user._count?.investmentInquiries ?? 0}</Text>
            <Text style={styles.statLabel}>Investor Leads</Text>
          </Card>
        </View>

        {/* Profile Details Card */}
        <Text style={styles.sectionHeading}>RESIDENCE & PROFILE ATTRIBUTES</Text>
        <Card style={styles.infoCard}>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Country of Residence</Text>
            <Text style={styles.infoValue}>{user.country || 'Not specified'}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Phone Number</Text>
            <Text style={styles.infoValue}>{user.phone || 'Not provided'}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Language Preference</Text>
            <Text style={styles.infoValue}>
              {user.language === 'am' ? 'Amharic (አማርኛ)' : 'English'}
            </Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Member Since</Text>
            <Text style={styles.infoValue}>
              {new Date(user.createdAt).toLocaleDateString()}
            </Text>
          </View>
        </Card>

        {/* Governance Controls */}
        <Text style={styles.sectionHeading}>ADMINISTRATIVE GOVERNANCE</Text>
        <Card style={styles.card}>
          <View style={styles.switchRow}>
            <View style={styles.switchTextWrap}>
              <Text style={styles.switchTitle}>Verified Diaspora Identity</Text>
              <Text style={styles.switchSub}>
                Grants verified status badge and prioritized triage processing
              </Text>
            </View>
            <Switch
              value={isVerified}
              onValueChange={() => handleToggleVerification(isVerified)}
              disabled={updating}
              trackColor={{ false: colors.border, true: colors.gold }}
              thumbColor={isVerified ? colors.navy : '#FFFFFF'}
            />
          </View>

          <View style={[styles.switchRow, { marginTop: 14, paddingTop: 14, borderTopWidth: 1, borderTopColor: colors.border }]}>
            <View style={styles.switchTextWrap}>
              <Text style={styles.switchTitle}>Account Active Status</Text>
              <Text style={styles.switchSub}>
                Allow or suspend authentication access on the customer mobile app
              </Text>
            </View>
            <Switch
              value={isActive}
              onValueChange={() => handleToggleActive(isActive)}
              disabled={updating}
              trackColor={{ false: colors.border, true: colors.navy }}
              thumbColor={isActive ? colors.gold : '#FFFFFF'}
            />
          </View>
        </Card>

        <View style={styles.actions}>
          <Button
            title="Return to Members Desk"
            variant="ghost"
            onPress={() => router.back()}
          />
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.surface,
  },
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  profileCard: {
    padding: 16,
    marginBottom: 16,
  },
  profileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  avatarCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: colors.navy,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.gold,
  },
  avatarInitials: {
    fontFamily: fonts.sansBold,
    fontSize: 22,
    color: '#FFFFFF',
  },
  profileDetails: {
    flex: 1,
  },
  profileName: {
    ...type.h3,
    color: colors.textPrimary,
  },
  profileEmail: {
    ...type.caption,
    color: colors.textSecondary,
    marginTop: 2,
  },
  typeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: colors.navyLight,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radius.full,
    alignSelf: 'flex-start',
    marginTop: 6,
  },
  typeBadgeText: {
    ...type.tiny,
    color: colors.gold,
    fontFamily: fonts.sansSemiBold,
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
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  statBox: {
    width: '48.5%',
    padding: 12,
    alignItems: 'center',
  },
  statNum: {
    ...type.h2,
    fontFamily: fonts.sansBold,
    color: colors.navy,
  },
  statLabel: {
    ...type.tiny,
    color: colors.textSecondary,
    marginTop: 2,
    textAlign: 'center',
  },
  infoCard: {
    padding: 14,
    marginBottom: 16,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  infoLabel: {
    ...type.caption,
    color: colors.textSecondary,
  },
  infoValue: {
    ...type.caption,
    fontFamily: fonts.sansMedium,
    color: colors.textPrimary,
  },
  card: {
    padding: 16,
    marginBottom: 16,
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 14,
  },
  switchTextWrap: {
    flex: 1,
  },
  switchTitle: {
    ...type.body,
    fontFamily: fonts.sansSemiBold,
    color: colors.textPrimary,
  },
  switchSub: {
    ...type.tiny,
    color: colors.textSecondary,
    marginTop: 2,
  },
  actions: {
    marginTop: 10,
  },
});
