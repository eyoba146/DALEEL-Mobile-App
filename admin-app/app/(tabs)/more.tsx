import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  Alert,
  Switch,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { ScreenHeader } from '../../components/ScreenHeader';
import { Card } from '../../components/Card';
import { Button } from '../../components/Button';
import { useAdminAuth } from '../../lib/auth-context';
import { useAdminLanguage } from '../../lib/language-context';
import { adminApi, SidebarCounts } from '../../lib/api';
import { colors, type, fonts, radius } from '../../theme/tokens';

export default function MoreScreen() {
  const router = useRouter();
  const { adminUser, logout, isSuperAdmin } = useAdminAuth();
  const { language, setLanguage, t } = useAdminLanguage();
  const [counts, setCounts] = useState<SidebarCounts | null>(null);

  useEffect(() => {
    adminApi.getSidebarCounts()
      .then((c) => setCounts(c))
      .catch((err) => console.log('Sidebar counts load:', err));
  }, []);

  const handleSignOut = () => {
    Alert.alert(
      t('logout') || 'Sign Out',
      'Are you sure you want to end your administrative session?',
      [
        { text: t('cancel') || 'Cancel', style: 'cancel' },
        {
          text: t('logout') || 'Sign Out',
          style: 'destructive',
          onPress: async () => {
            await logout();
            router.replace('/(auth)/login');
          },
        },
      ]
    );
  };

  const getRoleBadge = (role?: string) => {
    switch (role) {
      case 'SUPER_ADMIN':
        return 'Super Admin';
      case 'SERVICE_MANAGER':
        return 'Services Manager';
      case 'DESTINATION_MANAGER':
        return 'Destinations Manager';
      case 'EVENT_MANAGER':
        return 'Event Manager';
      case 'MARKETPLACE_MANAGER':
        return 'Marketplace Officer';
      case 'INVESTMENT_OFFICER':
        return 'Investment Officer';
      default:
        return 'Staff Coordinator';
    }
  };

  const initials = adminUser?.name
    ? adminUser.name
        .split(' ')
        .map((p) => p[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    : 'DA';

  return (
    <View style={styles.container}>
      <ScreenHeader
        title={t('more') || 'Executive Desk'}
        subtitle="Security & Operations Hub"
        variant="navy"
      />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Profile Header Card */}
        <Card style={styles.profileCard}>
          <View style={styles.profileRow}>
            <View style={styles.avatarCircle}>
              <Text style={styles.avatarInitials}>{initials}</Text>
            </View>
            <View style={styles.profileDetails}>
              <Text style={styles.profileName} numberOfLines={1}>
                {adminUser?.name || 'Administrator'}
              </Text>
              <Text style={styles.profileEmail} numberOfLines={1}>
                {adminUser?.email || 'admin@daleel.et'}
              </Text>
              <View style={styles.roleBadge}>
                <Ionicons name="shield-checkmark" size={12} color={colors.gold} />
                <Text style={styles.roleText}>{getRoleBadge(adminUser?.adminRole)}</Text>
              </View>
            </View>
          </View>
        </Card>

        {/* Section: Operational Desks */}
        <Text style={styles.sectionHeading}>OPERATIONAL DESKS</Text>
        <Card style={styles.menuCard}>
          {/* Reviews Moderation */}
          <TouchableOpacity
            style={styles.menuItem}
            activeOpacity={0.7}
            onPress={() => router.push('/reviews/index')}
          >
            <View style={[styles.menuIconBox, { backgroundColor: 'rgba(223, 183, 108, 0.12)' }]}>
              <Ionicons name="star" size={20} color={colors.gold} />
            </View>
            <View style={styles.menuTextWrap}>
              <Text style={styles.menuTitle}>Community Reviews Moderation</Text>
              <Text style={styles.menuSub}>Review, verify, and approve customer ratings</Text>
            </View>
            {counts && (counts.reviews ?? 0) > 0 && (
              <View style={styles.badgePill}>
                <Text style={styles.badgeText}>{counts.reviews} pending</Text>
              </View>
            )}
            <Ionicons name="chevron-forward" size={18} color={colors.textTertiary} />
          </TouchableOpacity>

          <View style={styles.menuDivider} />

          {/* Event Gate Check-In & Scanner */}
          <TouchableOpacity
            style={styles.menuItem}
            activeOpacity={0.7}
            onPress={() => router.push('/event/scanner')}
          >
            <View style={[styles.menuIconBox, { backgroundColor: 'rgba(52, 152, 219, 0.12)' }]}>
              <Ionicons name="scan" size={20} color={colors.info} />
            </View>
            <View style={styles.menuTextWrap}>
              <Text style={styles.menuTitle}>Gate Passcode & Check-In Desk</Text>
              <Text style={styles.menuSub}>Verify attendee tickets and RSVP codes live</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={colors.textTertiary} />
          </TouchableOpacity>

          <View style={styles.menuDivider} />

          {/* Institutional Security & Passkey */}
          <TouchableOpacity
            style={styles.menuItem}
            activeOpacity={0.7}
            onPress={() => router.push('/profile/security')}
          >
            <View style={[styles.menuIconBox, { backgroundColor: 'rgba(46, 204, 113, 0.12)' }]}>
              <Ionicons name="key-outline" size={20} color={colors.success} />
            </View>
            <View style={styles.menuTextWrap}>
              <Text style={styles.menuTitle}>Account Security & Passkey</Text>
              <Text style={styles.menuSub}>Update credentials and administrative profile</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={colors.textTertiary} />
          </TouchableOpacity>
        </Card>

        {/* Section: Language & Localization */}
        <Text style={styles.sectionHeading}>PREFERENCES & LOCALIZATION</Text>
        <Card style={styles.menuCard}>
          <View style={styles.languageRow}>
            <View style={styles.menuIconBox}>
              <Ionicons name="language-outline" size={20} color={colors.navy} />
            </View>
            <View style={styles.menuTextWrap}>
              <Text style={styles.menuTitle}>Platform Interface Language</Text>
              <Text style={styles.menuSub}>
                {language === 'am' ? 'የአማርኛ በይነገጽ ነቅቷል' : 'English interface active'}
              </Text>
            </View>
            <View style={styles.languageToggleGroup}>
              <TouchableOpacity
                style={[
                  styles.langBtn,
                  language === 'en' && styles.langBtnActive,
                ]}
                onPress={() => setLanguage('en')}
              >
                <Text
                  style={[
                    styles.langBtnText,
                    language === 'en' && styles.langBtnTextActive,
                  ]}
                >
                  EN
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.langBtn,
                  language === 'am' && styles.langBtnActive,
                ]}
                onPress={() => setLanguage('am')}
              >
                <Text
                  style={[
                    styles.langBtnText,
                    language === 'am' && styles.langBtnTextActive,
                  ]}
                >
                  አማ
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </Card>

        {/* Section: System Governance */}
        <Text style={styles.sectionHeading}>SYSTEM GOVERNANCE</Text>
        <Card style={styles.infoCard}>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Platform</Text>
            <Text style={styles.infoValue}>DALEEL Mobile Executive Desk</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Version</Text>
            <Text style={styles.infoValue}>1.0.0 (Institutional Build)</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Security Clearance</Text>
            <Text style={[styles.infoValue, { color: colors.goldText }]}>
              {isSuperAdmin ? 'Full System Authority' : 'Departmental Clearance'}
            </Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Audit Trail</Text>
            <Text style={styles.infoValue}>Cryptographically Logged</Text>
          </View>
        </Card>

        {/* Sign Out Action */}
        <View style={styles.actionContainer}>
          <Button
            title={t('logout') || 'Sign Out'}
            variant="danger"
            icon={<Ionicons name="log-out-outline" size={18} color="#FFFFFF" />}
            onPress={handleSignOut}
          />
        </View>

        <Text style={styles.copyrightText}>
          DALEEL Digital Heritage & Commerce Administration © 2026
        </Text>
      </ScrollView>
    </View>
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
  profileCard: {
    padding: 16,
    marginBottom: 20,
    backgroundColor: colors.card,
  },
  profileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  avatarCircle: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: colors.navy,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.gold,
  },
  avatarInitials: {
    fontFamily: fonts.sansBold,
    fontSize: 20,
    color: '#FFFFFF',
    letterSpacing: 1,
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
  roleBadge: {
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
  roleText: {
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
  },
  menuCard: {
    padding: 0,
    overflow: 'hidden',
    marginBottom: 20,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    gap: 12,
  },
  menuIconBox: {
    width: 38,
    height: 38,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuTextWrap: {
    flex: 1,
  },
  menuTitle: {
    ...type.body,
    fontFamily: fonts.sansSemiBold,
    color: colors.textPrimary,
  },
  menuSub: {
    ...type.tiny,
    color: colors.textSecondary,
    marginTop: 2,
  },
  menuDivider: {
    height: 1,
    backgroundColor: colors.border,
    marginLeft: 64,
  },
  badgePill: {
    backgroundColor: colors.goldSoft,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radius.full,
    marginRight: 6,
  },
  badgeText: {
    ...type.tiny,
    fontFamily: fonts.sansBold,
    color: colors.goldText,
  },
  languageRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    gap: 12,
  },
  languageToggleGroup: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: 2,
    borderWidth: 1,
    borderColor: colors.border,
  },
  langBtn: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: radius.sm,
  },
  langBtnActive: {
    backgroundColor: colors.navy,
  },
  langBtnText: {
    ...type.caption,
    fontFamily: fonts.sansSemiBold,
    color: colors.textSecondary,
  },
  langBtnTextActive: {
    color: '#FFFFFF',
    fontFamily: fonts.sansBold,
  },
  infoCard: {
    padding: 14,
    marginBottom: 24,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
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
  actionContainer: {
    marginBottom: 16,
  },
  copyrightText: {
    ...type.tiny,
    color: colors.textTertiary,
    textAlign: 'center',
    marginBottom: 10,
  },
});
