import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CurrencySelector } from '../components/CurrencySelector';
import ScreenHeader from '../components/ScreenHeader';
import { useAuth } from '../lib/auth-context';
import { useCart } from '../lib/cart-context';
import { useCurrency } from '../lib/currency-context';
import { getCurrentUserLocation } from '../lib/location';
import { colors, fonts, radius, spacing } from '../theme/tokens';

export default function CartScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { currency, formatPrice } = useCurrency();
  const {
    items,
    itemCount,
    subtotalETB,
    subtotalUSD,
    updateQuantity,
    removeFromCart,
    clearCart,
    checkout,
    isCheckingOut,
  } = useCart();

  // Contact & Delivery State
  const [fullName, setFullName] = useState(user?.name ?? '');
  const [email, setEmail] = useState(user?.email ?? '');
  const [phone, setPhone] = useState(user?.phone ?? '');
  const [whatsapp, setWhatsapp] = useState(user?.phone ?? '');
  const [deliveryAddress, setDeliveryAddress] = useState(user?.savedAddress ?? '');
  const [deliveryLat, setDeliveryLat] = useState<number | null>(user?.savedLatitude ?? null);
  const [deliveryLon, setDeliveryLon] = useState<number | null>(user?.savedLongitude ?? null);
  const [detectingGps, setDetectingGps] = useState(false);
  const [gpsStatusMessage, setGpsStatusMessage] = useState<string | null>(null);
  const [notes, setNotes] = useState('');
  const [formError, setFormError] = useState<string | null>(null);

  // Success State
  const [orderSuccess, setOrderSuccess] = useState(false);
  const [submittedCount, setSubmittedCount] = useState(0);
  const [submittedTotal, setSubmittedTotal] = useState(0);

  const handleDetectLocation = async () => {
    setDetectingGps(true);
    setGpsStatusMessage(null);
    try {
      const loc = await getCurrentUserLocation();
      if (loc.granted && loc.latitude && loc.longitude) {
        setDeliveryLat(loc.latitude);
        setDeliveryLon(loc.longitude);
        if (loc.address) {
          setDeliveryAddress(loc.address);
        } else {
          setDeliveryAddress(`${loc.latitude.toFixed(4)}, ${loc.longitude.toFixed(4)}`);
        }
        setGpsStatusMessage(`GPS Location pinned (${loc.latitude.toFixed(4)}N, ${loc.longitude.toFixed(4)}E)`);
        if (formError) setFormError(null);
      } else {
        setGpsStatusMessage(loc.error || 'Location permission denied');
      }
    } catch {
      setGpsStatusMessage('Unable to detect GPS position');
    } finally {
      setDetectingGps(false);
    }
  };

  const handleConfirmClear = () => {
    Alert.alert(
      'Clear Artisan Bag',
      'Are you sure you want to remove all items from your bag?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Clear All', style: 'destructive', onPress: clearCart },
      ]
    );
  };

  const handleSubmitOrder = async () => {
    setFormError(null);

    if (!fullName.trim()) {
      setFormError('Please provide your full name');
      return;
    }
    if (!email.trim() || !email.includes('@')) {
      setFormError('Please provide a valid email address');
      return;
    }
    if (!deliveryAddress.trim()) {
      setFormError('Please provide a delivery address in Addis Ababa or region');
      return;
    }

    try {
      const result = await checkout({
        fullName: fullName.trim(),
        email: email.trim().toLowerCase(),
        phone: phone.trim() || undefined,
        whatsapp: whatsapp.trim() || undefined,
        deliveryAddress: deliveryAddress.trim(),
        deliveryLatitude: deliveryLat,
        deliveryLongitude: deliveryLon,
        notes: notes.trim() || undefined,
      });

      setSubmittedCount(result.count);
      setSubmittedTotal(result.totalETB);
      setOrderSuccess(true);
    } catch (err: any) {
      setFormError(err?.message || 'Failed to place order request. Please try again.');
    }
  };

  // 1. Order Success Screen
  if (orderSuccess) {
    return (
      <View style={styles.screen}>
        <ScreenHeader
          title="Order Submitted"
          subtitle="Diaspora Artisan Dispatch"
          showBack
          onBack={() => router.push('/marketplace')}
        />
        <ScrollView contentContainerStyle={styles.successScroll} showsVerticalScrollIndicator={false}>
          <View style={styles.successCard}>
            <View style={styles.successBadgeCircle}>
              <Ionicons name="checkmark" size={38} color={colors.navy} />
            </View>

            <Text style={styles.successTitle}>Order Request Placed!</Text>
            <Text style={styles.successSub}>
              Your request for {submittedCount} artisan item(s) has been transmitted to our verified merchants and fulfillment team.
            </Text>

            <View style={styles.successSummaryBox}>
              <View style={styles.successLine}>
                <Text style={styles.successLabel}>Total Amount:</Text>
                <Text style={styles.successValBold}>{formatPrice(submittedTotal, true)}</Text>
              </View>
              <View style={styles.successLine}>
                <Text style={styles.successLabel}>Delivery Destination:</Text>
                <Text style={styles.successVal} numberOfLines={1}>
                  {deliveryAddress}
                </Text>
              </View>
              <View style={styles.successLine}>
                <Text style={styles.successLabel}>Confirmation Email:</Text>
                <Text style={styles.successVal}>{email}</Text>
              </View>
              <View style={styles.successLine}>
                <Text style={styles.successLabel}>Status:</Text>
                <View style={styles.statusPillPending}>
                  <Text style={styles.statusPillText}>IN REVIEW</Text>
                </View>
              </View>
            </View>

            <TouchableOpacity
              style={styles.activityBtn}
              onPress={() => router.push('/activity')}
              activeOpacity={0.88}
            >
              <Ionicons name="time-outline" size={18} color="#FFFFFF" style={{ marginRight: 8 }} />
              <Text style={styles.activityBtnText}>Track in Activity Hub</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.continueShoppingBtn}
              onPress={() => router.push('/marketplace')}
              activeOpacity={0.85}
            >
              <Text style={styles.continueShoppingText}>Continue Exploring Marketplace</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </View>
    );
  }

  // 2. Empty Cart View
  if (items.length === 0) {
    return (
      <View style={styles.screen}>
        <ScreenHeader
          title="Artisan Bag"
          subtitle="Handcrafted Ethiopian treasures"
          showBack
        />
        <View style={styles.emptyContainer}>
          <View style={styles.emptyIconCircle}>
            <Ionicons name="bag-handle-outline" size={42} color={colors.gold} />
          </View>
          <Text style={styles.emptyTitle}>Your Bag is Empty</Text>
          <Text style={styles.emptySubtitle}>
            Explore authentic Ethiopian treasures: single-origin Guji coffee, handwoven Habesha Kemis, and handcrafted leather goods.
          </Text>

          <TouchableOpacity
            style={styles.browseBtn}
            onPress={() => router.push('/marketplace')}
            activeOpacity={0.88}
          >
            <Ionicons name="sparkles" size={16} color={colors.navy} style={{ marginRight: 8 }} />
            <Text style={styles.browseBtnText}>Explore Artisan Marketplace</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // 3. Populated Cart Screen
  return (
    <View style={styles.screen}>
      <ScreenHeader
        title="Artisan Bag"
        subtitle={`${itemCount} item(s) • ${formatPrice(subtotalETB)}`}
        showBack
        rightElement={
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <CurrencySelector compact />
            <TouchableOpacity
              style={styles.clearHeaderBtn}
              onPress={handleConfirmClear}
              activeOpacity={0.75}
            >
              <Text style={styles.clearHeaderText}>Clear</Text>
            </TouchableOpacity>
          </View>
        }
      />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={[styles.contentScroll, { paddingBottom: insets.bottom + 110 }]}
          showsVerticalScrollIndicator={false}
        >
          {/* Section 1: Cart Items */}
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>Bag Items ({itemCount})</Text>
          </View>

          {items.map((cartItem) => {
            const { product, quantity } = cartItem;
            const itemTotal = product.price * quantity;
            return (
              <View key={product.id} style={styles.cartCard}>
                <Image
                  source={{ uri: product.image }}
                  style={styles.cartCardImage}
                  resizeMode="cover"
                />

                <View style={styles.cartCardBody}>
                  <View style={styles.cardTopRow}>
                    <Text style={styles.cartCardTitle} numberOfLines={2}>
                      {product.title}
                    </Text>
                    <TouchableOpacity
                      onPress={() => removeFromCart(product.id)}
                      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    >
                      <Ionicons name="trash-outline" size={17} color={colors.charcoalLight} />
                    </TouchableOpacity>
                  </View>

                  <Text style={styles.sellerSubtitle}>
                    {product.sellerName} • {product.origin || 'Addis Ababa'}
                  </Text>

                  <View style={styles.cardBottomRow}>
                    <View>
                      <Text style={styles.unitPriceText}>
                        {formatPrice(itemTotal)}
                      </Text>
                      {currency !== 'ETB' && (
                        <Text style={styles.unitPriceSubText}>
                          ~{itemTotal.toLocaleString('en-US')} ETB
                        </Text>
                      )}
                    </View>

                    {/* Quantity Stepper */}
                    <View style={styles.stepperWrap}>
                      <TouchableOpacity
                        style={styles.stepperBtn}
                        onPress={() => updateQuantity(product.id, quantity - 1)}
                        activeOpacity={0.8}
                      >
                        <Ionicons
                          name={quantity === 1 ? 'trash-outline' : 'remove'}
                          size={15}
                          color={quantity === 1 ? colors.error : colors.navy}
                        />
                      </TouchableOpacity>

                      <Text style={styles.stepperQtyText}>{quantity}</Text>

                      <TouchableOpacity
                        style={styles.stepperBtn}
                        onPress={() => updateQuantity(product.id, quantity + 1)}
                        activeOpacity={0.8}
                      >
                        <Ionicons name="add" size={15} color={colors.navy} />
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              </View>
            );
          })}

          {/* Section 2: Recipient & Delivery Address */}
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>Delivery & Contact Information</Text>
          </View>

          <View style={styles.formCard}>
            {formError && (
              <View style={styles.formErrorBanner}>
                <Ionicons name="alert-circle" size={16} color={colors.error} style={{ marginRight: 6 }} />
                <Text style={styles.formErrorText}>{formError}</Text>
              </View>
            )}

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Full Name *</Text>
              <TextInput
                style={styles.textInput}
                value={fullName}
                onChangeText={setFullName}
                placeholder="Recipient name"
                placeholderTextColor={colors.charcoalLight}
              />
            </View>

            <View style={styles.inputRow}>
              <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
                <Text style={styles.inputLabel}>Email Address *</Text>
                <TextInput
                  style={styles.textInput}
                  value={email}
                  onChangeText={setEmail}
                  placeholder="name@email.com"
                  placeholderTextColor={colors.charcoalLight}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>

              <View style={[styles.inputGroup, { flex: 1 }]}>
                <Text style={styles.inputLabel}>Phone Number</Text>
                <TextInput
                  style={styles.textInput}
                  value={phone}
                  onChangeText={setPhone}
                  placeholder="+251 91 123 4567"
                  placeholderTextColor={colors.charcoalLight}
                  keyboardType="phone-pad"
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>WhatsApp Contact (Optional)</Text>
              <TextInput
                style={styles.textInput}
                value={whatsapp}
                onChangeText={setWhatsapp}
                placeholder="For fulfillment updates & courier coordination"
                placeholderTextColor={colors.charcoalLight}
                keyboardType="phone-pad"
              />
            </View>

            <View style={styles.inputGroup}>
              <View style={styles.addressLabelRow}>
                <Text style={styles.inputLabel}>Delivery Address *</Text>
                <TouchableOpacity
                  style={styles.gpsBtn}
                  onPress={handleDetectLocation}
                  disabled={detectingGps}
                  activeOpacity={0.75}
                >
                  {detectingGps ? (
                    <ActivityIndicator size="small" color={colors.navy} />
                  ) : (
                    <>
                      <Ionicons name="navigate-outline" size={13} color={colors.navy} style={{ marginRight: 4 }} />
                      <Text style={styles.gpsBtnText}>Use GPS Location</Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>

              <TextInput
                style={[styles.textInput, styles.textArea]}
                value={deliveryAddress}
                onChangeText={setDeliveryAddress}
                placeholder="Street address, neighborhood, Addis Ababa district or international DHL air cargo instructions"
                placeholderTextColor={colors.charcoalLight}
                multiline
                numberOfLines={3}
              />

              {gpsStatusMessage && (
                <Text style={styles.gpsStatusHint}>{gpsStatusMessage}</Text>
              )}
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Order Notes & Special Requests</Text>
              <TextInput
                style={[styles.textInput, styles.textAreaNotes]}
                value={notes}
                onChangeText={setNotes}
                placeholder="Custom tailoring measurements, gift wrap, or specific roast level"
                placeholderTextColor={colors.charcoalLight}
                multiline
                numberOfLines={2}
              />
            </View>
          </View>

          {/* Section 3: Cost Breakdown & Order Summary */}
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>Order Summary</Text>
          </View>

          <View style={styles.summaryCard}>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Items Subtotal ({itemCount})</Text>
              <Text style={styles.summaryValue}>{formatPrice(subtotalETB)}</Text>
            </View>

            {currency !== 'ETB' && (
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Base Currency Equivalent</Text>
                <Text style={styles.summaryValueUSD}>{subtotalETB.toLocaleString('en-US')} ETB</Text>
              </View>
            )}

            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Artisan Coordination</Text>
              <Text style={styles.summaryValueFree}>Complimentary</Text>
            </View>

            <View style={styles.summaryDivider} />

            <View style={styles.summaryRowTotal}>
              <View>
                <Text style={styles.totalLabel}>Total Order</Text>
                {currency !== 'ETB' && (
                  <Text style={styles.totalSubLabel}>Base: {subtotalETB.toLocaleString('en-US')} ETB</Text>
                )}
              </View>
              <Text style={styles.totalValue}>{formatPrice(subtotalETB)}</Text>
            </View>

            <View style={styles.dispatchNotice}>
              <Ionicons name="shield-checkmark" size={15} color={colors.goldText} style={{ marginRight: 6 }} />
              <Text style={styles.dispatchNoticeText}>
                Verified artisan quality with direct merchant dispatch. No immediate payment required — our coordinator confirms availability before delivery.
              </Text>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Floating Bottom Sticky Action Bar */}
      <View style={[styles.bottomBar, { paddingBottom: Math.max(insets.bottom, 14) }]}>
        <View style={styles.bottomPriceCol}>
          <Text style={styles.bottomTotalLabel}>Total ({itemCount} items)</Text>
          <Text style={styles.bottomTotalVal}>{formatPrice(subtotalETB)}</Text>
          {currency !== 'ETB' && (
            <Text style={styles.bottomTotalSubVal}>~ {subtotalETB.toLocaleString('en-US')} ETB</Text>
          )}
        </View>

        <TouchableOpacity
          style={styles.checkoutBtn}
          onPress={handleSubmitOrder}
          disabled={isCheckingOut}
          activeOpacity={0.88}
        >
          {isCheckingOut ? (
            <ActivityIndicator size="small" color={colors.navy} />
          ) : (
            <>
              <Text style={styles.checkoutBtnText}>Submit Order Request</Text>
              <Ionicons name="arrow-forward" size={16} color={colors.navy} style={{ marginLeft: 6 }} />
            </>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  clearHeaderBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: radius.pill,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
  },
  clearHeaderText: {
    fontSize: 12,
    fontFamily: fonts.body,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  contentScroll: {
    padding: 16,
  },
  sectionHeaderRow: {
    marginBottom: 10,
    marginTop: 6,
  },
  sectionTitle: {
    fontSize: 14,
    fontFamily: fonts.heading,
    fontWeight: '700',
    color: colors.navy,
    letterSpacing: 0.3,
  },

  // Cart Cards
  cartCard: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: radius.xl,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(23, 25, 28, 0.06)',
    shadowColor: colors.charcoal,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  cartCardImage: {
    width: 82,
    height: 82,
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
  },
  cartCardBody: {
    flex: 1,
    marginLeft: 12,
    justifyContent: 'space-between',
  },
  cardTopRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  cartCardTitle: {
    flex: 1,
    fontSize: 13.5,
    fontFamily: fonts.body,
    fontWeight: '700',
    color: colors.charcoal,
    lineHeight: 18,
    marginRight: 6,
  },
  sellerSubtitle: {
    fontSize: 11,
    fontFamily: fonts.body,
    color: colors.charcoalSub,
    marginTop: 2,
  },
  cardBottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 6,
  },
  unitPriceText: {
    fontSize: 13.5,
    fontFamily: fonts.body,
    fontWeight: '800',
    color: colors.navy,
  },
  unitPriceSubText: {
    fontSize: 10.5,
    fontFamily: fonts.body,
    fontWeight: '600',
    color: colors.charcoalSub,
    marginTop: 1,
  },
  stepperWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radius.pill,
    paddingHorizontal: 4,
    paddingVertical: 2,
  },
  stepperBtn: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 1,
  },
  stepperQtyText: {
    fontSize: 12,
    fontFamily: fonts.body,
    fontWeight: '800',
    color: colors.navy,
    paddingHorizontal: 10,
  },

  // Form Card
  formCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: radius.xl,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(23, 25, 28, 0.06)',
  },
  formErrorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(214, 48, 49, 0.08)',
    borderRadius: radius.md,
    padding: 10,
    marginBottom: 14,
  },
  formErrorText: {
    fontSize: 12,
    fontFamily: fonts.body,
    color: colors.error,
    fontWeight: '600',
    flex: 1,
  },
  inputGroup: {
    marginBottom: 12,
  },
  inputRow: {
    flexDirection: 'row',
  },
  inputLabel: {
    fontSize: 11.5,
    fontFamily: fonts.body,
    fontWeight: '700',
    color: colors.charcoal,
    marginBottom: 5,
  },
  textInput: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    paddingHorizontal: 12,
    paddingVertical: 9,
    fontSize: 13,
    fontFamily: fonts.body,
    color: colors.charcoal,
    borderWidth: 1,
    borderColor: 'rgba(23, 25, 28, 0.08)',
  },
  textArea: {
    height: 68,
    textAlignVertical: 'top',
    paddingTop: 9,
  },
  textAreaNotes: {
    height: 52,
    textAlignVertical: 'top',
    paddingTop: 8,
  },
  addressLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 5,
  },
  gpsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.goldSoft,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radius.pill,
  },
  gpsBtnText: {
    fontSize: 10.5,
    fontFamily: fonts.body,
    fontWeight: '700',
    color: colors.navy,
  },
  gpsStatusHint: {
    fontSize: 10.5,
    fontFamily: fonts.body,
    color: colors.success,
    marginTop: 4,
  },

  // Summary Card
  summaryCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: radius.xl,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(23, 25, 28, 0.06)',
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  summaryLabel: {
    fontSize: 12.5,
    fontFamily: fonts.body,
    color: colors.charcoalSub,
  },
  summaryValue: {
    fontSize: 13,
    fontFamily: fonts.body,
    fontWeight: '700',
    color: colors.charcoal,
  },
  summaryValueUSD: {
    fontSize: 12,
    fontFamily: fonts.body,
    color: colors.charcoalSub,
  },
  summaryValueFree: {
    fontSize: 12,
    fontFamily: fonts.body,
    fontWeight: '700',
    color: colors.success,
  },
  summaryDivider: {
    height: 1,
    backgroundColor: 'rgba(23, 25, 28, 0.06)',
    marginVertical: 10,
  },
  summaryRowTotal: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  totalLabel: {
    fontSize: 15,
    fontFamily: fonts.heading,
    fontWeight: '700',
    color: colors.navy,
  },
  totalSubLabel: {
    fontSize: 11,
    fontFamily: fonts.body,
    color: colors.charcoalSub,
    marginTop: 2,
  },
  totalValue: {
    fontSize: 18,
    fontFamily: fonts.heading,
    fontWeight: '800',
    color: colors.navy,
  },
  dispatchNotice: {
    flexDirection: 'row',
    backgroundColor: 'rgba(223, 183, 108, 0.12)',
    borderRadius: radius.md,
    padding: 10,
  },
  dispatchNoticeText: {
    flex: 1,
    fontSize: 11,
    fontFamily: fonts.body,
    color: colors.goldText,
    lineHeight: 15,
  },

  // Bottom Sticky Bar
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: 'rgba(23, 25, 28, 0.08)',
    paddingHorizontal: 16,
    paddingTop: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 10,
  },
  bottomPriceCol: {
    justifyContent: 'center',
  },
  bottomTotalLabel: {
    fontSize: 11,
    fontFamily: fonts.body,
    color: colors.charcoalSub,
  },
  bottomTotalVal: {
    fontSize: 16,
    fontFamily: fonts.heading,
    fontWeight: '800',
    color: colors.navy,
  },
  bottomTotalSubVal: {
    fontSize: 10,
    fontFamily: fonts.body,
    fontWeight: '600',
    color: colors.charcoalSub,
    marginTop: 1,
  },
  checkoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.gold,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: radius.pill,
    shadowColor: colors.gold,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 3,
  },
  checkoutBtnText: {
    fontSize: 13.5,
    fontFamily: fonts.body,
    fontWeight: '800',
    color: colors.navy,
  },

  // Empty State
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  emptyIconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(223, 183, 108, 0.16)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontFamily: fonts.heading,
    fontWeight: '700',
    color: colors.charcoal,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 13,
    fontFamily: fonts.body,
    color: colors.charcoalSub,
    textAlign: 'center',
    lineHeight: 19,
    marginBottom: 24,
    maxWidth: 290,
  },
  browseBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.gold,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: radius.pill,
  },
  browseBtnText: {
    fontSize: 13.5,
    fontFamily: fonts.body,
    fontWeight: '700',
    color: colors.navy,
  },

  // Success View
  successScroll: {
    padding: 20,
    alignItems: 'center',
  },
  successCard: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: radius.xl,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(23, 25, 28, 0.06)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 4,
  },
  successBadgeCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: colors.gold,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  successTitle: {
    fontSize: 20,
    fontFamily: fonts.heading,
    fontWeight: '700',
    color: colors.navy,
    marginBottom: 8,
  },
  successSub: {
    fontSize: 13,
    fontFamily: fonts.body,
    color: colors.charcoalSub,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 20,
  },
  successSummaryBox: {
    width: '100%',
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: 14,
    marginBottom: 20,
  },
  successLine: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 5,
  },
  successLabel: {
    fontSize: 12,
    fontFamily: fonts.body,
    color: colors.charcoalSub,
  },
  successVal: {
    fontSize: 12.5,
    fontFamily: fonts.body,
    fontWeight: '600',
    color: colors.charcoal,
    maxWidth: 160,
  },
  successValBold: {
    fontSize: 13.5,
    fontFamily: fonts.body,
    fontWeight: '800',
    color: colors.navy,
  },
  statusPillPending: {
    backgroundColor: colors.goldSoft,
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 4,
  },
  statusPillText: {
    fontSize: 9.5,
    fontFamily: fonts.body,
    fontWeight: '800',
    color: colors.goldText,
  },
  activityBtn: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.navy,
    paddingVertical: 13,
    borderRadius: radius.pill,
    marginBottom: 10,
  },
  activityBtnText: {
    fontSize: 13.5,
    fontFamily: fonts.body,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  continueShoppingBtn: {
    paddingVertical: 8,
  },
  continueShoppingText: {
    fontSize: 13,
    fontFamily: fonts.body,
    fontWeight: '700',
    color: colors.navy,
  },
});
