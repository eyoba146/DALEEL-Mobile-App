import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  StyleProp,
  StyleSheet,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
  ViewStyle,
} from 'react-native';
import { CurrencyCode, useCurrency } from '../lib/currency-context';
import { colors, fonts, radius, shadow, spacing } from '../theme/tokens';

type Props = {
  style?: StyleProp<ViewStyle>;
  compact?: boolean;
};

export const CurrencySelector: React.FC<Props> = ({ style, compact = false }) => {
  const {
    currency,
    currencyMeta,
    currencies,
    setCurrency,
    isLoadingRates,
    lastUpdated,
    refreshRates,
  } = useCurrency();
  const [modalVisible, setModalVisible] = useState(false);

  const handleOpen = () => {
    setModalVisible(true);
    // Refresh live rates whenever user opens the currency switcher to ensure latest rates
    refreshRates().catch(() => {});
  };

  const handleSelect = (code: CurrencyCode) => {
    setCurrency(code);
    setModalVisible(false);
  };

  return (
    <>
      <TouchableOpacity
        style={[styles.selectorBtn, compact && styles.selectorBtnCompact, style]}
        onPress={handleOpen}
        activeOpacity={0.8}
        accessibilityLabel={`Currency: ${currencyMeta.code}`}
      >
        <View style={styles.pillSymbolBadge}>
          <Text style={styles.pillSymbolText}>{currencyMeta.symbol}</Text>
        </View>
        <Text style={styles.codeText}>{currencyMeta.code}</Text>
        <Ionicons name="chevron-down" size={11} color={colors.charcoalSub} style={{ marginLeft: 1 }} />
      </TouchableOpacity>

      {/* Modal Sheet for selecting currency */}
      <Modal
        visible={modalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setModalVisible(false)}
      >
        <TouchableWithoutFeedback onPress={() => setModalVisible(false)}>
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback>
              <View style={styles.modalCard}>
                <View style={styles.modalHeader}>
                  <View style={styles.titleGroup}>
                    <Ionicons name="globe-outline" size={20} color={colors.goldRich} />
                    <Text style={styles.modalTitle}>Diaspora Currency</Text>
                  </View>
                  <View style={styles.headerRightActions}>
                    <TouchableOpacity
                      style={styles.refreshBtn}
                      onPress={() => refreshRates()}
                      disabled={isLoadingRates}
                      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                      accessibilityLabel="Refresh Exchange Rates"
                    >
                      {isLoadingRates ? (
                        <ActivityIndicator size="small" color={colors.goldRich} />
                      ) : (
                        <Ionicons name="sync" size={16} color={colors.goldRich} />
                      )}
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.closeBtn}
                      onPress={() => setModalVisible(false)}
                      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    >
                      <Ionicons name="close" size={20} color={colors.charcoalSub} />
                    </TouchableOpacity>
                  </View>
                </View>

                <View style={styles.rateStatusRow}>
                  <View style={styles.liveBadge}>
                    <View style={styles.livePulseDot} />
                    <Text style={styles.liveBadgeText}>LIVE MARKET RATES</Text>
                  </View>
                  <Text style={styles.modalSubtitleText}>
                    Automatic conversion on all artisan items
                  </Text>
                </View>

                <View style={styles.currencyList}>
                  {currencies.map((c) => {
                    const isActive = currency === c.code;
                    return (
                      <TouchableOpacity
                        key={c.code}
                        style={[styles.currencyItem, isActive && styles.currencyItemActive]}
                        onPress={() => handleSelect(c.code)}
                        activeOpacity={0.8}
                      >
                        <View style={styles.currencyLeft}>
                          {/* Luxury Badge Token (Zero emojis) */}
                          <View style={[styles.currencyToken, isActive && styles.currencyTokenActive]}>
                            <Text
                              style={[
                                styles.currencyTokenText,
                                isActive && styles.currencyTokenTextActive,
                              ]}
                            >
                              {c.symbol}
                            </Text>
                          </View>

                          <View style={styles.currencyMeta}>
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                              <Text
                                style={[styles.currencyName, isActive && styles.currencyNameActive]}
                              >
                                {c.name}
                              </Text>
                              <Text style={styles.currencyCodePill}>{c.code}</Text>
                            </View>
                            <Text style={styles.currencySub}>
                              {c.code === 'ETB'
                                ? 'Base Currency (1.00 ETB)'
                                : `Live: 1 ${c.code} ≈ ${(1 / c.ratePerETB).toFixed(2)} ETB`}
                            </Text>
                          </View>
                        </View>

                        <View style={styles.currencyRight}>
                          {isActive && (
                            <Ionicons name="checkmark-circle" size={20} color={colors.goldRich} />
                          )}
                        </View>
                      </TouchableOpacity>
                    );
                  })}
                </View>

                <View style={styles.footerNoteWrap}>
                  <Ionicons name="shield-checkmark" size={13} color={colors.goldRich} style={{ marginRight: 4 }} />
                  <Text style={styles.footerNoteText}>
                    Live rates automatically updated from global forex feeds
                  </Text>
                </View>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  selectorBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingVertical: 5,
    paddingHorizontal: 8,
    borderRadius: 9999,
    borderWidth: 1.5,
    borderColor: 'rgba(223, 183, 108, 0.45)',
    shadowColor: colors.navy,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 2,
    gap: 4,
  },
  selectorBtnCompact: {
    paddingVertical: 4,
    paddingHorizontal: 7,
  },
  pillSymbolBadge: {
    backgroundColor: colors.navy,
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 6,
    minWidth: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pillSymbolText: {
    fontSize: 10,
    fontWeight: '800',
    color: colors.gold,
    fontFamily: fonts.bodyBold,
  },
  codeText: {
    fontSize: 11.5,
    fontWeight: '800',
    color: colors.navy,
    fontFamily: fonts.bodyBold,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(7, 21, 43, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalCard: {
    width: '100%',
    maxWidth: 380,
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    padding: 20,
    shadowColor: '#000',
    shadowOpacity: 0.18,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 8 },
    elevation: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  titleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.navy,
    fontFamily: fonts.heading,
  },
  headerRightActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  refreshBtn: {
    padding: 4,
  },
  closeBtn: {
    padding: 4,
  },
  rateStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
    marginTop: 2,
  },
  liveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(37, 211, 102, 0.12)',
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 6,
    gap: 4,
  },
  livePulseDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#16A34A',
  },
  liveBadgeText: {
    fontSize: 9.5,
    fontWeight: '800',
    color: '#15803D',
    letterSpacing: 0.5,
  },
  modalSubtitleText: {
    fontSize: 11,
    color: colors.charcoalSub,
    fontFamily: fonts.body,
    flex: 1,
  },
  currencyList: {
    gap: 8,
  },
  currencyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 14,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  currencyItemActive: {
    backgroundColor: '#FEF9EE',
    borderColor: colors.gold,
  },
  currencyLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  currencyToken: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  currencyTokenActive: {
    backgroundColor: colors.navy,
    borderColor: colors.gold,
  },
  currencyTokenText: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.navy,
    fontFamily: fonts.bodyBold,
  },
  currencyTokenTextActive: {
    color: colors.gold,
  },
  currencyMeta: {
    flex: 1,
  },
  currencyName: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.navy,
    fontFamily: fonts.bodyBold,
  },
  currencyNameActive: {
    color: colors.navy,
  },
  currencyCodePill: {
    fontSize: 10,
    fontWeight: '800',
    color: colors.charcoalSub,
    backgroundColor: 'rgba(0,0,0,0.05)',
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 4,
  },
  currencySub: {
    fontSize: 11,
    color: colors.charcoalSub,
    marginTop: 2,
    fontFamily: fonts.body,
  },
  currencyRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  footerNoteWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 14,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.05)',
  },
  footerNoteText: {
    fontSize: 10.5,
    color: colors.charcoalSub,
    fontFamily: fonts.body,
  },
});

