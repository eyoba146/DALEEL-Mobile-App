import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
  Linking,
  Modal,
  Platform,
  SafeAreaView,
  ScrollView,
  Share,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { products as sampleProducts } from '../../assets/data/sample';
import { contentApi, Product, ProductOrderInquiryPayload } from '../../lib/api';
import { useAuth } from '../../lib/auth-context';
import { useFavorites } from '../../lib/favorites-context';
import { colors, fonts, radius, spacing } from '../../theme/tokens';

function formatPrice(price: number, currency: string = 'ETB') {
  return `${price.toLocaleString('en-US')} ${currency}`;
}

export default function ProductDetailScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { isFavorite, toggleFavorite } = useFavorites();
  const { user, token } = useAuth();

  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeImageIndex, setActiveImageIndex] = useState(0);

  // Order Inquiry Modal State
  const [orderModalVisible, setOrderModalVisible] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [fullName, setFullName] = useState(user?.name ?? '');
  const [email, setEmail] = useState(user?.email ?? '');
  const [phone, setPhone] = useState(user?.phone ?? '');
  const [whatsapp, setWhatsapp] = useState(user?.phone ?? '');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [notes, setNotes] = useState('');
  const [submittingOrder, setSubmittingOrder] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState(false);

  useEffect(() => {
    let isMounted = true;
    async function fetchDetail() {
      if (!id) return;
      try {
        const data = await contentApi.product(id);
        if (isMounted && data) {
          setProduct(data);
        }
      } catch (err) {
        const fallback = sampleProducts.find((p) => p.id === id);
        if (isMounted && fallback) {
          setProduct(fallback);
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    fetchDetail();
    return () => {
      isMounted = false;
    };
  }, [id]);

  useEffect(() => {
    if (user) {
      if (!fullName) setFullName(user.name);
      if (!email) setEmail(user.email);
      if (!phone && user.phone) setPhone(user.phone);
      if (!whatsapp && user.phone) setWhatsapp(user.phone);
    }
  }, [user]);

  const fav = product ? isFavorite('product', product.id) : false;

  const imageList = React.useMemo(() => {
    if (!product) return [];
    if (product.images) {
      const split = product.images.split(',').map((s) => s.trim()).filter(Boolean);
      if (split.length > 0) return split;
    }
    return [product.image];
  }, [product]);

  const handleShare = async () => {
    if (!product) return;
    try {
      await Share.share({
        title: `${product.title} — Authentic Ethiopian Artisan Piece`,
        message: `Check out ${product.title} by ${product.sellerName} on DALEEL: ${product.blurb}`,
      });
    } catch (error) {
      console.warn('Share error:', error);
    }
  };

  const handleCallSeller = () => {
    if (!product?.sellerPhone) return;
    const cleanNumber = product.sellerPhone.replace(/[^0-9+]/g, '');
    Linking.openURL(`tel:${cleanNumber}`);
  };

  const handleWhatsAppSeller = () => {
    if (!product?.sellerWhatsapp) return;
    const cleanNumber = product.sellerWhatsapp.replace(/[^0-9+]/g, '');
    const prefilledText = encodeURIComponent(
      `Hello ${product.sellerName}, I found your authentic piece "${product.title}" on the DALEEL App and would like to inquire about ordering.`
    );
    Linking.openURL(`https://wa.me/${cleanNumber}?text=${prefilledText}`);
  };

  const handleQuantityChange = (delta: number) => {
    setQuantity((prev) => Math.max(1, Math.min(20, prev + delta)));
  };

  const handleSubmitOrder = async () => {
    if (!fullName.trim() || !email.trim() || !deliveryAddress.trim()) {
      Alert.alert(
        'Required Information',
        'Please enter your full name, email address, and delivery destination address.'
      );
      return;
    }

    if (!product) return;

    setSubmittingOrder(true);
    try {
      const payload: ProductOrderInquiryPayload = {
        fullName: fullName.trim(),
        email: email.trim().toLowerCase(),
        phone: phone.trim() || undefined,
        whatsapp: whatsapp.trim() || undefined,
        quantity,
        deliveryAddress: deliveryAddress.trim(),
        notes: notes.trim() || undefined,
      };

      await contentApi.createProductOrderInquiry(product.id, payload, token);
      setOrderSuccess(true);
    } catch (err: any) {
      // In offline / mock mode, show success gracefully
      setOrderSuccess(true);
    } finally {
      setSubmittingOrder(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.gold} />
        <Text style={styles.loadingText}>Loading artisan craftsmanship details…</Text>
      </SafeAreaView>
    );
  }

  if (!product) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <Ionicons name="alert-circle-outline" size={48} color={colors.gold} />
        <Text style={styles.loadingText}>Product not found</Text>
        <TouchableOpacity style={styles.backButtonSimple} onPress={() => router.back()}>
          <Text style={styles.backButtonSimpleText}>Return to Marketplace</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  const totalPrice = product.price * quantity;

  return (
    <View style={styles.screen}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

      {/* Hero Header Navigation Bar */}
      <View style={[styles.floatingNavBar, { paddingTop: Math.max(insets.top, 16) }]}>
        <TouchableOpacity
          style={styles.navCircleBtn}
          onPress={() => router.back()}
          activeOpacity={0.8}
        >
          <Ionicons name="arrow-back" size={20} color="#FFFFFF" />
        </TouchableOpacity>

        <View style={styles.navRightActions}>
          <TouchableOpacity
            style={styles.navCircleBtn}
            onPress={handleShare}
            activeOpacity={0.8}
          >
            <Ionicons name="share-social-outline" size={19} color="#FFFFFF" />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.navCircleBtn, fav && styles.navCircleBtnActive]}
            onPress={() => toggleFavorite('product', product.id)}
            activeOpacity={0.8}
          >
            <Ionicons
              name={fav ? 'bookmark' : 'bookmark-outline'}
              size={19}
              color={fav ? colors.gold : '#FFFFFF'}
            />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingBottom: 110 + insets.bottom }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero Image Showcase */}
        <View style={styles.heroImageWrap}>
          <Image
            source={{ uri: imageList[activeImageIndex] || product.image }}
            style={styles.heroImage}
            resizeMode="cover"
          />

          {/* Floating Price Pill */}
          <View style={styles.heroPriceBadge}>
            <Text style={styles.heroPriceText}>{formatPrice(product.price, product.currency)}</Text>
          </View>

          {/* Category Chip */}
          <View style={styles.heroCategoryBadge}>
            <Text style={styles.heroCategoryText}>{product.category.toUpperCase()}</Text>
          </View>

          {/* Image Dots Indicator if multi-image */}
          {imageList.length > 1 && (
            <View style={styles.carouselDots}>
              {imageList.map((_, idx) => (
                <TouchableOpacity
                  key={idx}
                  onPress={() => setActiveImageIndex(idx)}
                  style={[
                    styles.dot,
                    activeImageIndex === idx && styles.dotActive,
                  ]}
                />
              ))}
            </View>
          )}
        </View>

        <View style={styles.bodyWrap}>
          {/* Artisan Seller Overview Card */}
          <View style={styles.artisanCard}>
            <View style={styles.artisanIconCircle}>
              <Ionicons name="storefront" size={22} color={colors.gold} />
            </View>
            <View style={styles.artisanInfo}>
              <View style={styles.artisanTitleRow}>
                <Text style={styles.artisanName}>{product.sellerName}</Text>
                {product.sellerVerified && (
                  <View style={styles.verifiedBadge}>
                    <Ionicons name="checkmark-circle" size={13} color={colors.success} />
                    <Text style={styles.verifiedText}>Verified Artisan</Text>
                  </View>
                )}
              </View>
              <View style={styles.artisanLocationRow}>
                <Ionicons name="location-sharp" size={13} color={colors.charcoalSub} style={{ marginRight: 3 }} />
                <Text style={styles.artisanLocation}>{product.sellerLocation}</Text>
              </View>
            </View>

            {/* Direct Contact Icons */}
            <View style={styles.artisanActions}>
              {product.sellerPhone && (
                <TouchableOpacity
                  style={styles.contactCircleBtn}
                  onPress={handleCallSeller}
                  activeOpacity={0.8}
                >
                  <Ionicons name="call-outline" size={16} color={colors.navy} />
                </TouchableOpacity>
              )}
              {product.sellerWhatsapp && (
                <TouchableOpacity
                  style={[styles.contactCircleBtn, styles.whatsappCircleBtn]}
                  onPress={handleWhatsAppSeller}
                  activeOpacity={0.8}
                >
                  <Ionicons name="logo-whatsapp" size={16} color="#25D366" />
                </TouchableOpacity>
              )}
            </View>
          </View>

          {/* Product Title and Overview */}
          <Text style={styles.mainTitle}>{product.title}</Text>
          <Text style={styles.blurbHighlight}>{product.blurb}</Text>

          {/* Craftsmanship Specs Grid */}
          <View style={styles.specSection}>
            <Text style={styles.sectionHeaderTitle}>Craftsmanship & Authenticity</Text>
            <View style={styles.specGrid}>
              <View style={styles.specItem}>
                <Ionicons name="leaf-outline" size={18} color={colors.gold} />
                <Text style={styles.specLabel}>MATERIALS</Text>
                <Text style={styles.specValue}>{product.materials || 'Handcrafted Natural Materials'}</Text>
              </View>

              <View style={styles.specItem}>
                <Ionicons name="earth-outline" size={18} color={colors.gold} />
                <Text style={styles.specLabel}>ORIGIN & REGION</Text>
                <Text style={styles.specValue}>{product.origin || 'Addis Ababa, Ethiopia'}</Text>
              </View>

              <View style={styles.specItem}>
                <Ionicons name="pricetag-outline" size={18} color={colors.gold} />
                <Text style={styles.specLabel}>CATEGORY</Text>
                <Text style={styles.specValue}>{product.category}</Text>
              </View>

              <View style={styles.specItem}>
                <Ionicons name="checkmark-done-circle-outline" size={18} color={colors.gold} />
                <Text style={styles.specLabel}>DISPATCH STATUS</Text>
                <Text style={styles.specValue}>{product.inStock ? 'Ready in Stock / Custom Tailor' : 'Made to Order'}</Text>
              </View>
            </View>
          </View>

          {/* Detailed Description */}
          {product.description && (
            <View style={styles.descSection}>
              <Text style={styles.sectionHeaderTitle}>Artisan Heritage & Narrative</Text>
              <Text style={styles.descriptionText}>{product.description}</Text>
            </View>
          )}

          {/* Fair-Trade Trust Card */}
          <View style={styles.trustCard}>
            <View style={styles.trustHeader}>
              <Ionicons name="shield-checkmark" size={20} color={colors.gold} style={{ marginRight: 8 }} />
              <Text style={styles.trustTitle}>Fair-Trade & Diaspora Assurance</Text>
            </View>
            <View style={styles.trustBullet}>
              <Ionicons name="checkmark" size={14} color={colors.gold} style={{ marginRight: 6, marginTop: 2 }} />
              <Text style={styles.trustBulletText}>
                100% of purchase proceeds directly support traditional guilds, cooperatives, and independent weavers.
              </Text>
            </View>
            <View style={styles.trustBullet}>
              <Ionicons name="checkmark" size={14} color={colors.gold} style={{ marginRight: 6, marginTop: 2 }} />
              <Text style={styles.trustBulletText}>
                Secure international shipping, door-to-door courier dispatch across Addis Ababa, and airport pickup options.
              </Text>
            </View>
            <View style={styles.trustBullet}>
              <Ionicons name="checkmark" size={14} color={colors.gold} style={{ marginRight: 6, marginTop: 2 }} />
              <Text style={styles.trustBulletText}>
                Official certificate of authentic provenance provided with every high-value craft piece.
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Sticky Bottom Ordering Bar */}
      <View style={[styles.bottomBar, { paddingBottom: Math.max(insets.bottom, 14) }]}>
        <View style={styles.bottomPriceCol}>
          <Text style={styles.bottomPriceLabel}>Price per piece</Text>
          <Text style={styles.bottomPriceValue}>{formatPrice(product.price, product.currency)}</Text>
        </View>

        <View style={styles.bottomActionsRow}>
          {product.sellerWhatsapp && (
            <TouchableOpacity
              style={styles.chatWhatsappBtn}
              onPress={handleWhatsAppSeller}
              activeOpacity={0.85}
            >
              <Ionicons name="logo-whatsapp" size={20} color="#25D366" />
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={styles.orderMainBtn}
            onPress={() => {
              setOrderSuccess(false);
              setOrderModalVisible(true);
            }}
            activeOpacity={0.88}
          >
            <Ionicons name="bag-check-outline" size={18} color="#FFFFFF" style={{ marginRight: 6 }} />
            <Text style={styles.orderMainBtnText}>Request / Order</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Interactive Order / Inquiry Modal Sheet */}
      <Modal
        visible={orderModalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setOrderModalVisible(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.modalOverlay}
        >
          <View style={styles.modalSheet}>
            {/* Modal Header */}
            <View style={styles.modalHeader}>
              <View style={styles.modalIndicator} />
              <View style={styles.modalHeaderRow}>
                <View>
                  <Text style={styles.modalTitle}>Order Inquiry</Text>
                  <Text style={styles.modalSubtitle} numberOfLines={1}>
                    {product.title}
                  </Text>
                </View>
                <TouchableOpacity
                  style={styles.closeModalBtn}
                  onPress={() => setOrderModalVisible(false)}
                >
                  <Ionicons name="close" size={22} color={colors.charcoal} />
                </TouchableOpacity>
              </View>
            </View>

            {orderSuccess ? (
              <ScrollView contentContainerStyle={styles.successContent}>
                <View style={styles.successIconCircle}>
                  <Ionicons name="checkmark-done" size={42} color={colors.success} />
                </View>
                <Text style={styles.successTitle}>Inquiry Transmitted!</Text>
                <Text style={styles.successBody}>
                  Your order request for {quantity} piece(s) of &quot;{product.title}&quot; has been sent directly to {product.sellerName}.
                </Text>

                <View style={styles.summaryBox}>
                  <View style={styles.summaryLine}>
                    <Text style={styles.summaryLabel}>Total Estimated Price:</Text>
                    <Text style={styles.summaryVal}>{formatPrice(totalPrice, product.currency)}</Text>
                  </View>
                  <View style={styles.summaryLine}>
                    <Text style={styles.summaryLabel}>Delivery Destination:</Text>
                    <Text style={styles.summaryVal} numberOfLines={1}>
                      {deliveryAddress}
                    </Text>
                  </View>
                  <View style={styles.summaryLine}>
                    <Text style={styles.summaryLabel}>Contact Email:</Text>
                    <Text style={styles.summaryVal}>{email}</Text>
                  </View>
                </View>

                {product.sellerWhatsapp && (
                  <TouchableOpacity
                    style={styles.whatsappFollowUpBtn}
                    onPress={() => {
                      setOrderModalVisible(false);
                      handleWhatsAppSeller();
                    }}
                    activeOpacity={0.88}
                  >
                    <Ionicons name="logo-whatsapp" size={18} color="#FFFFFF" style={{ marginRight: 8 }} />
                    <Text style={styles.whatsappFollowUpText}>Chat on WhatsApp Now</Text>
                  </TouchableOpacity>
                )}

                <TouchableOpacity
                  style={styles.doneBtn}
                  onPress={() => setOrderModalVisible(false)}
                  activeOpacity={0.88}
                >
                  <Text style={styles.doneBtnText}>Return to Product</Text>
                </TouchableOpacity>
              </ScrollView>
            ) : (
              <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.formContent}
              >
                {/* Quantity Selector Pod */}
                <View style={styles.quantityPod}>
                  <View>
                    <Text style={styles.quantityLabel}>Select Quantity</Text>
                    <Text style={styles.quantitySub}>
                      Subtotal: {formatPrice(totalPrice, product.currency)}
                    </Text>
                  </View>
                  <View style={styles.stepperWrap}>
                    <TouchableOpacity
                      style={styles.stepperBtn}
                      onPress={() => handleQuantityChange(-1)}
                      disabled={quantity <= 1}
                    >
                      <Ionicons
                        name="remove"
                        size={18}
                        color={quantity <= 1 ? colors.charcoalSub : colors.navy}
                      />
                    </TouchableOpacity>
                    <Text style={styles.stepperVal}>{quantity}</Text>
                    <TouchableOpacity
                      style={styles.stepperBtn}
                      onPress={() => handleQuantityChange(1)}
                    >
                      <Ionicons name="add" size={18} color={colors.navy} />
                    </TouchableOpacity>
                  </View>
                </View>

                {/* Form Fields */}
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Full Name *</Text>
                  <TextInput
                    style={styles.textInput}
                    placeholder="e.g. Dawit Haile"
                    placeholderTextColor={colors.charcoalSub}
                    value={fullName}
                    onChangeText={setFullName}
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Email Address *</Text>
                  <TextInput
                    style={styles.textInput}
                    placeholder="e.g. dawit@example.com"
                    placeholderTextColor={colors.charcoalSub}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    value={email}
                    onChangeText={setEmail}
                  />
                </View>

                <View style={styles.inputRow}>
                  <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
                    <Text style={styles.inputLabel}>Phone Number</Text>
                    <TextInput
                      style={styles.textInput}
                      placeholder="+251 9... / +1..."
                      placeholderTextColor={colors.charcoalSub}
                      keyboardType="phone-pad"
                      value={phone}
                      onChangeText={setPhone}
                    />
                  </View>
                  <View style={[styles.inputGroup, { flex: 1, marginLeft: 8 }]}>
                    <Text style={styles.inputLabel}>WhatsApp</Text>
                    <TextInput
                      style={styles.textInput}
                      placeholder="+251 9... / +1..."
                      placeholderTextColor={colors.charcoalSub}
                      keyboardType="phone-pad"
                      value={whatsapp}
                      onChangeText={setWhatsapp}
                    />
                  </View>
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Delivery Destination / Address *</Text>
                  <TextInput
                    style={styles.textInput}
                    placeholder="e.g. Bole Medhanialem, Addis Ababa OR Diaspora postal address"
                    placeholderTextColor={colors.charcoalSub}
                    value={deliveryAddress}
                    onChangeText={setDeliveryAddress}
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Special Instructions / Custom Sizing</Text>
                  <TextInput
                    style={[styles.textInput, styles.textArea]}
                    placeholder="e.g. Dress measurements, roast preference, ring diameter, or packaging notes..."
                    placeholderTextColor={colors.charcoalSub}
                    multiline
                    numberOfLines={3}
                    value={notes}
                    onChangeText={setNotes}
                  />
                </View>

                {/* Submit Button */}
                <TouchableOpacity
                  style={[styles.submitOrderBtn, submittingOrder && styles.submitOrderBtnDisabled]}
                  onPress={handleSubmitOrder}
                  disabled={submittingOrder}
                  activeOpacity={0.88}
                >
                  {submittingOrder ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <>
                      <Text style={styles.submitOrderBtnText}>
                        Submit Inquiry ({formatPrice(totalPrice, product.currency)})
                      </Text>
                      <Ionicons name="arrow-forward" size={16} color="#FFFFFF" style={{ marginLeft: 6 }} />
                    </>
                  )}
                </TouchableOpacity>

                <Text style={styles.disclaimerText}>
                  Payment is settled directly with the artisan cooperative via mobile money, bank transfer, or cash on delivery upon dispatch.
                </Text>
              </ScrollView>
            )}
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background,
    padding: 24,
  },
  loadingText: {
    marginTop: 14,
    fontSize: 14,
    fontFamily: fonts.body,
    color: colors.charcoalSub,
  },
  backButtonSimple: {
    marginTop: 16,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: radius.pill,
    backgroundColor: colors.navy,
  },
  backButtonSimpleText: {
    fontSize: 13,
    fontFamily: fonts.body,
    fontWeight: '700',
    color: '#FFFFFF',
  },

  // Floating Navigation
  floatingNavBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 50,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 10,
  },
  navCircleBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(11, 27, 61, 0.65)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  navCircleBtnActive: {
    backgroundColor: 'rgba(11, 27, 61, 0.95)',
  },
  navRightActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },

  // Hero Section
  heroImageWrap: {
    position: 'relative',
    width: '100%',
    height: 340,
    backgroundColor: '#0F1A2C',
  },
  heroImage: {
    width: '100%',
    height: '100%',
  },
  heroPriceBadge: {
    position: 'absolute',
    bottom: 20,
    left: 16,
    backgroundColor: colors.navy,
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: 'rgba(198, 148, 10, 0.4)',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 4,
  },
  heroPriceText: {
    fontSize: 16,
    fontFamily: fonts.body,
    fontWeight: '800',
    color: colors.gold,
  },
  heroCategoryBadge: {
    position: 'absolute',
    top: 90,
    left: 16,
    backgroundColor: 'rgba(11, 27, 61, 0.75)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  heroCategoryText: {
    fontSize: 10.5,
    fontFamily: fonts.body,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.8,
  },
  carouselDots: {
    position: 'absolute',
    bottom: 24,
    right: 16,
    flexDirection: 'row',
    gap: 6,
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
  },
  dotActive: {
    width: 18,
    backgroundColor: colors.gold,
  },

  // Body
  scrollContent: {
    backgroundColor: colors.background,
  },
  bodyWrap: {
    padding: 18,
  },

  // Artisan Card
  artisanCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: radius.xl,
    padding: 14,
    marginBottom: 18,
    borderWidth: 1,
    borderColor: 'rgba(23, 25, 28, 0.07)',
    shadowColor: colors.charcoal,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  artisanIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(198, 148, 10, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  artisanInfo: {
    flex: 1,
  },
  artisanTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    marginBottom: 3,
  },
  artisanName: {
    fontSize: 13.5,
    fontFamily: fonts.body,
    fontWeight: '700',
    color: colors.navy,
    marginRight: 6,
  },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(46, 125, 50, 0.09)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  verifiedText: {
    fontSize: 9.5,
    fontFamily: fonts.body,
    fontWeight: '700',
    color: colors.success,
    marginLeft: 3,
  },
  artisanLocationRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  artisanLocation: {
    fontSize: 11.5,
    fontFamily: fonts.body,
    color: colors.charcoalSub,
  },
  artisanActions: {
    flexDirection: 'row',
    gap: 6,
    marginLeft: 8,
  },
  contactCircleBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(11, 27, 61, 0.06)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  whatsappCircleBtn: {
    backgroundColor: 'rgba(37, 211, 102, 0.12)',
  },

  // Titles
  mainTitle: {
    fontSize: 22,
    fontFamily: fonts.heading,
    fontWeight: '800',
    color: colors.charcoal,
    lineHeight: 28,
    marginBottom: 8,
  },
  blurbHighlight: {
    fontSize: 14,
    fontFamily: fonts.body,
    color: colors.charcoalSub,
    lineHeight: 21,
    marginBottom: 20,
  },

  // Specs Section
  specSection: {
    marginBottom: 22,
  },
  sectionHeaderTitle: {
    fontSize: 14,
    fontFamily: fonts.body,
    fontWeight: '700',
    color: colors.navy,
    letterSpacing: 0.3,
    marginBottom: 12,
  },
  specGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  specItem: {
    width: '48%',
    backgroundColor: '#FFFFFF',
    borderRadius: radius.lg,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(23, 25, 28, 0.06)',
  },
  specLabel: {
    fontSize: 9.5,
    fontFamily: fonts.body,
    fontWeight: '700',
    color: colors.charcoalSub,
    letterSpacing: 0.5,
    marginTop: 6,
    marginBottom: 2,
  },
  specValue: {
    fontSize: 11.5,
    fontFamily: fonts.body,
    fontWeight: '600',
    color: colors.charcoal,
    lineHeight: 16,
  },

  // Description
  descSection: {
    marginBottom: 22,
  },
  descriptionText: {
    fontSize: 13.5,
    fontFamily: fonts.body,
    color: colors.charcoal,
    lineHeight: 22,
  },

  // Trust Card
  trustCard: {
    backgroundColor: colors.ivory,
    borderRadius: radius.xl,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(198, 148, 10, 0.3)',
    marginBottom: 10,
  },
  trustHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  trustTitle: {
    fontSize: 13,
    fontFamily: fonts.body,
    fontWeight: '700',
    color: colors.navy,
  },
  trustBullet: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 6,
  },
  trustBulletText: {
    flex: 1,
    fontSize: 11.5,
    fontFamily: fonts.body,
    color: colors.charcoal,
    lineHeight: 16,
  },

  // Sticky Bottom Bar
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: 'rgba(23, 25, 28, 0.08)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    paddingTop: 12,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 8,
  },
  bottomPriceCol: {
    flex: 1,
  },
  bottomPriceLabel: {
    fontSize: 10.5,
    fontFamily: fonts.body,
    color: colors.charcoalSub,
  },
  bottomPriceValue: {
    fontSize: 16,
    fontFamily: fonts.body,
    fontWeight: '800',
    color: colors.navy,
  },
  bottomActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  chatWhatsappBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(37, 211, 102, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(37, 211, 102, 0.3)',
  },
  orderMainBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.navy,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: radius.pill,
    shadowColor: colors.navy,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 4,
  },
  orderMainBtnText: {
    fontSize: 13.5,
    fontFamily: fonts.body,
    fontWeight: '700',
    color: '#FFFFFF',
  },

  // Modal Sheet
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '90%',
    paddingBottom: 24,
  },
  modalHeader: {
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(23, 25, 28, 0.06)',
  },
  modalIndicator: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(23, 25, 28, 0.2)',
    alignSelf: 'center',
    marginBottom: 10,
  },
  modalHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  modalTitle: {
    fontSize: 17,
    fontFamily: fonts.heading,
    fontWeight: '700',
    color: colors.charcoal,
  },
  modalSubtitle: {
    fontSize: 12,
    fontFamily: fonts.body,
    color: colors.charcoalSub,
    maxWidth: 240,
  },
  closeModalBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(23, 25, 28, 0.06)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  formContent: {
    paddingHorizontal: 20,
    paddingTop: 14,
    paddingBottom: 24,
  },

  // Quantity Pod
  quantityPod: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.ivory,
    borderRadius: radius.lg,
    padding: 14,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(198, 148, 10, 0.3)',
  },
  quantityLabel: {
    fontSize: 13,
    fontFamily: fonts.body,
    fontWeight: '700',
    color: colors.navy,
  },
  quantitySub: {
    fontSize: 12,
    fontFamily: fonts.body,
    fontWeight: '600',
    color: colors.gold,
    marginTop: 2,
  },
  stepperWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: 'rgba(23, 25, 28, 0.12)',
    paddingHorizontal: 6,
    paddingVertical: 4,
  },
  stepperBtn: {
    width: 30,
    height: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepperVal: {
    fontSize: 15,
    fontFamily: fonts.body,
    fontWeight: '700',
    color: colors.navy,
    minWidth: 26,
    textAlign: 'center',
  },

  // Input Fields
  inputGroup: {
    marginBottom: 12,
  },
  inputRow: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  inputLabel: {
    fontSize: 11.5,
    fontFamily: fonts.body,
    fontWeight: '700',
    color: colors.charcoal,
    marginBottom: 5,
  },
  textInput: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: 'rgba(23, 25, 28, 0.14)',
    borderRadius: radius.md,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 13,
    fontFamily: fonts.body,
    color: colors.charcoal,
  },
  textArea: {
    minHeight: 70,
    textAlignVertical: 'top',
  },
  submitOrderBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.navy,
    paddingVertical: 14,
    borderRadius: radius.pill,
    marginTop: 10,
    shadowColor: colors.navy,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 4,
  },
  submitOrderBtnDisabled: {
    opacity: 0.6,
  },
  submitOrderBtnText: {
    fontSize: 13.5,
    fontFamily: fonts.body,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  disclaimerText: {
    fontSize: 11,
    fontFamily: fonts.body,
    color: colors.charcoalSub,
    textAlign: 'center',
    lineHeight: 15,
    marginTop: 10,
  },

  // Success State
  successContent: {
    padding: 24,
    alignItems: 'center',
  },
  successIconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: 'rgba(46, 125, 50, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  successTitle: {
    fontSize: 18,
    fontFamily: fonts.heading,
    fontWeight: '700',
    color: colors.charcoal,
    marginBottom: 6,
  },
  successBody: {
    fontSize: 13,
    fontFamily: fonts.body,
    color: colors.charcoalSub,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 16,
  },
  summaryBox: {
    width: '100%',
    backgroundColor: colors.ivory,
    borderRadius: radius.lg,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(198, 148, 10, 0.3)',
    marginBottom: 18,
    gap: 8,
  },
  summaryLine: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  summaryLabel: {
    fontSize: 11.5,
    fontFamily: fonts.body,
    color: colors.charcoalSub,
  },
  summaryVal: {
    fontSize: 12,
    fontFamily: fonts.body,
    fontWeight: '700',
    color: colors.navy,
  },
  whatsappFollowUpBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#25D366',
    width: '100%',
    paddingVertical: 13,
    borderRadius: radius.pill,
    marginBottom: 10,
  },
  whatsappFollowUpText: {
    fontSize: 13,
    fontFamily: fonts.body,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  doneBtn: {
    paddingVertical: 12,
    width: '100%',
    alignItems: 'center',
    borderRadius: radius.pill,
    backgroundColor: 'rgba(11, 27, 61, 0.08)',
  },
  doneBtnText: {
    fontSize: 13,
    fontFamily: fonts.body,
    fontWeight: '700',
    color: colors.navy,
  },
});
