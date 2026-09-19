import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import {
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
  const { currency, currencyMeta, currencies, setCurrency } = useCurrency();
  const [modalVisible, setModalVisible] = useState(false);

  const handleSelect = (code: CurrencyCode) => {
    setCurrency(code);
    setModalVisible(false);
  };

  return (
    <>
      <TouchableOpacity
        style={[styles.selectorBtn, compact && styles.selectorBtnCompact, style]}
        onPress={() => setModalVisible(true)}
        activeOpacity={0.8}
      >
        <Text style={styles.flagText}>{currencyMeta.flag}</Text>
        <Text style={styles.codeText}>{currencyMeta.code}</Text>
        <Ionicons name="chevron-down" size={12} color={colors.charcoalSub} style={{ marginLeft: 2 }} />
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
                    <Ionicons name="cash-outline" size={20} color={colors.goldRich} />
                    <Text style={styles.modalTitle}>Diaspora Currency</Text>
                  </View>
                  <TouchableOpacity
                    style={styles.closeBtn}
                    onPress={() => setModalVisible(false)}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                  >
                    <Ionicons name="close" size={20} color={colors.charcoalSub} />
                  </TouchableOpacity>
                </View>

                <Text style={styles.modalSubtitle}>
                  Choose your preferred currency for artisan crafts and marketplace checkout.
                </Text>

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
                          <Text style={styles.currencyFlag}>{c.flag}</Text>
                          <View style={styles.currencyMeta}>
                            <Text style={[styles.currencyName, isActive && styles.currencyNameActive]}>
                              {c.name}
                            </Text>
                            <Text style={styles.currencySub}>
                              {c.code === 'ETB'
                                ? 'Base Currency (1.00 ETB)'
                                : `Approx. 1 ${c.code} ≈ ${(1 / c.ratePerETB).toFixed(1)} ETB`}
                            </Text>
                          </View>
                        </View>

                        <View style={styles.currencyRight}>
                          <Text style={[styles.currencySymbol, isActive && styles.currencySymbolActive]}>
                            {c.symbol}
                          </Text>
                          {isActive && (
                            <Ionicons name="checkmark-circle" size={18} color={colors.goldRich} />
                          )}
                        </View>
                      </TouchableOpacity>
                    );
                  })}
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
    paddingVertical: 6,
    paddingHorizontal: 10,
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
    paddingHorizontal: 8,
  },
  flagText: {
    fontSize: 14,
  },
  codeText: {
    fontSize: 12,
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
    marginBottom: 6,
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
  closeBtn: {
    padding: 4,
  },
  modalSubtitle: {
    fontSize: 12.5,
    color: colors.charcoalSub,
    lineHeight: 18,
    marginBottom: 16,
    fontFamily: fonts.body,
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
  currencyFlag: {
    fontSize: 22,
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
  currencySub: {
    fontSize: 11,
    color: colors.charcoalSub,
    marginTop: 2,
    fontFamily: fonts.body,
  },
  currencyRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  currencySymbol: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.charcoalSub,
  },
  currencySymbolActive: {
    color: colors.goldText,
  },
});
