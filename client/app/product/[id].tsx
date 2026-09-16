import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
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
import { contentApi, Product, ProductOrderInquiry, ProductOrderInquiryPayload } from '../../lib/api';
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

  // Active Inquiry State for this product
  const [activeInquiry, setActiveInquiry] = useState<ProductOrderInquiry | null>(null);
  const [loadingInquiry, setLoadingInquiry] = useState(false);

  // Order Modal State
  const [orderModalVisible, setOrderModalVisible] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [cancelPromptVisible, setCancelPromptVisible] = useState(false);
  const [cancellingOrder, setCancellingOrder] = useState(false);

  // Form inputs
  const [quantity, setQuantity] = useState(1);
  const [fullName, setFullName] = useState(user?.name ?? '');
  const [email, setEmail] = useState(user?.email ?? '');
  const [phone, setPhone] = useState(user?.phone ?? '');
  const [whatsapp, setWhatsapp] = useState(user?.phone ?? '');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [notes, setNotes] = useState('');
  const [formError, setFormError] = useState<string | null>(null);
  const [submittingOrder, setSubmittingOrder] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState(false);

  // Scroll tracking to hide floating top nav bar on scroll
  const scrollY = useRef(new Animated.Value(0)).current;
  const [isScrolledPastHero, setIsScrolledPastHero] = useState(false);

  const navOpacity = scrollY.interpolate({
    inputRange: [0, 80],
    outputRange: [1, 0],
    extrapolate: 'clamp',
  });

  const navTranslateY = scrollY.interpolate({
    inputRange: [0, 80],
    outputRange: [0, -55],
    extrapolate: 'clamp',
  });

  useEffect(() => {
    const listenerId = scrollY.addListener(({ value }) => {
      if (value > 70 && !isScrolledPastHero) {
        setIsScrolledPastHero(true);
      } else if (value <= 70 && isScrolledPastHero) {
        setIsScrolledPastHero(false);
      }
    });
    return () => {
      scrollY.removeListener(listenerId);
    };
  }, [isScrolledPastHero, scrollY]);

  // Load product & existing user inquiry
  const loadProductAndInquiry = useCallback(async () => {
    if (!id) return;
    try {
      setLoading(true);
      const data = await contentApi.product(id);
      if (data) setProduct(data);
    } catch {
      const fallback = sampleProducts.find((p) => p.id === id);
      if (fallback) setProduct(fallback);
    } finally {
      setLoading(false);
    }

    try {
      setLoadingInquiry(true);
      const inq = await contentApi.getMyProductInquiry(id, token, user?.email);
      if (inq && inq.status !== 'cancelled') {
        setActiveInquiry(inq);
        setQuantity(inq.quantity);
        setDeliveryAddress(inq.deliveryAddress || '');
        setNotes(inq.notes || '');
        if (inq.fullName) setFullName(inq.fullName);
        if (inq.email) setEmail(inq.email);
        if (inq.phone) setPhone(inq.phone);
        if (inq.whatsapp) setWhatsapp(inq.whatsapp);
      } else {
        setActiveInquiry(null);
      }
    } catch {
      // Offline fallback
    } finally {
      setLoadingInquiry(false);
    }
  }, [id, token, user?.email]);

  useEffect(() => {
    loadProductAndInquiry();
  }, [loadProductAndInquiry]);

  useEffect(() => {
    if (user && !activeInquiry) {
      if (!fullName) setFullName(user.name);
      if (!email) setEmail(user.email);
      if (!phone && user.phone) setPhone(user.phone);
      if (!whatsapp && user.phone) setWhatsapp(user.phone);
    }
  }, [user, activeInquiry]);

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

  const handleWhatsAppSeller = (referenceId?: string) => {
    if (!product?.sellerWhatsapp) return;
    const cleanNumber = product.sellerWhatsapp.replace(/[^0-9+]/g, '');
    const refText = referenceId ? ` (Inquiry Ref: #${referenceId.slice(0, 8)})` : '';
    const prefilledText = encodeURIComponent(
      `Hello ${product.sellerName}, I found your authentic piece "${product.title}" on the DALEEL App and would like to check on my order${refText}.`
    );
    Linking.openURL(`https://wa.me/${cleanNumber}?text=${prefilledText}`);
  };

  const handleQuantityChange = (delta: number) => {
    setQuantity((prev) => Math.max(1, Math.min(20, prev + delta)));
  };

  // Submit or Update Inquiry
  const handleSubmitOrder = async () => {
    setFormError(null);

    if (!fullName.trim() || !email.trim() || !deliveryAddress.trim()) {
      setFormError('Please provide your full name, email address, and delivery destination address.');
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

      if (isEditMode && activeInquiry) {
        const res = await contentApi.updateProductOrderInquiry(activeInquiry.id, payload, token);
        setActiveInquiry(res.inquiry);
        setIsEditMode(false);
        setOrderSuccess(true);
      } else {
        const res = await contentApi.createProductOrderInquiry(product.id, payload, token);
        setActiveInquiry(res.inquiry);
        setOrderSuccess(true);
      }
    } catch (err: any) {
      // Mock fallback
      const mockInq: ProductOrderInquiry = {
        id: activeInquiry?.id || `inq-${Date.now()}`,
        productId: product.id,
        userId: user?.id || null,
        fullName: fullName.trim(),
        email: email.trim().toLowerCase(),
        phone: phone.trim() || null,
        whatsapp: whatsapp.trim() || null,
        quantity,
        deliveryAddress: deliveryAddress.trim(),
        notes: notes.trim() || null,
        status: 'pending',
        createdAt: activeInquiry?.createdAt || new Date().toISOString(),
      };
      setActiveInquiry(mockInq);
      setIsEditMode(false);
      setOrderSuccess(true);
    } finally {
      setSubmittingOrder(false);
    }
  };

  // Cancel Inquiry
  const handleCancelInquiry = async () => {
    if (!activeInquiry) return;
    setCancellingOrder(true);
    try {
      await contentApi.cancelProductOrderInquiry(activeInquiry.id, token);
      setActiveInquiry(null);
      setCancelPromptVisible(false);
      setOrderModalVisible(false);
      setIsEditMode(false);
    } catch (err: any) {
      setActiveInquiry(null);
      setCancelPromptVisible(false);
      setOrderModalVisible(false);
      setIsEditMode(false);
    } finally {
      setCancellingOrder(false);
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
  const hasPendingInquiry = activeInquiry && activeInquiry.status === 'pending';
  const hasActiveInquiry = activeInquiry && activeInquiry.status !== 'cancelled';

  return (
    <View style={styles.screen}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

      {/* Floating Header Navigation Bar (Smoothly hides on scroll down) */}
      <Animated.View
        pointerEvents={isScrolledPastHero ? 'none' : 'auto'}
        style={[
          styles.floatingNavBar,
          {
            paddingTop: Math.max(insets.top, 16),
            opacity: navOpacity,
            transform: [{ translateY: navTranslateY }],
          },
        ]}
      >
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
      </Animated.View>

      <Animated.ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingBottom: 110 + insets.bottom }]}
        showsVerticalScrollIndicator={false}
        scrollEventThrottle={16}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: true }
        )}
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
          {/* Active Order Status Notification Banner */}
          {hasActiveInquiry && (
            <TouchableOpacity
              style={styles.activeOrderBanner}
              activeOpacity={0.88}
              onPress={() => {
                setOrderSuccess(false);
                setIsEditMode(false);
                setCancelPromptVisible(false);
                setFormError(null);
                setOrderModalVisible(true);
              }}
            >
              <View style={styles.activeOrderIconBox}>
                <Ionicons
                  name={activeInquiry.status === 'pending' ? 'time' : 'checkmark-circle'}
                  size={20}
                  color={activeInquiry.status === 'pending' ? colors.gold : colors.success}
                />
              </View>
              <View style={{ flex: 1 }}>
                <View style={styles.activeOrderTitleRow}>
                  <Text style={styles.activeOrderTitle}>Active Inquiry</Text>
                  <View
                    style={[
                      styles.statusPill,
                      activeInquiry.status === 'pending'
                        ? styles.statusPillPending
                        : styles.statusPillConfirmed,
                    ]}
                  >
                    <Text
                      style={[
                        styles.statusPillText,
                        activeInquiry.status === 'pending'
                          ? styles.statusPillTextPending
                          : styles.statusPillTextConfirmed,
                      ]}
                    >
                      {activeInquiry.status === 'pending' ? 'PENDING APPROVAL' : activeInquiry.status.toUpperCase()}
                    </Text>
                  </View>
                </View>
                <Text style={styles.activeOrderSub}>
                  {activeInquiry.quantity} piece(s) requested • Tap to view, edit or cancel
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={colors.navy} />
            </TouchableOpacity>
          )}

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
                  onPress={() => handleWhatsAppSeller(activeInquiry?.id)}
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
      </Animated.ScrollView>

      {/* Sticky Bottom Ordering Bar */}
      <View style={[styles.bottomBar, { paddingBottom: Math.max(insets.bottom, 14) }]}>
        <View style={styles.bottomPriceCol}>
          <Text style={styles.bottomPriceLabel}>
            {hasActiveInquiry ? 'Your Inquiry Total' : 'Price per piece'}
          </Text>
          <Text style={styles.bottomPriceValue}>
            {formatPrice(hasActiveInquiry ? product.price * activeInquiry.quantity : product.price, product.currency)}
          </Text>
        </View>

        <View style={styles.bottomActionsRow}>
          {product.sellerWhatsapp && (
            <TouchableOpacity
              style={styles.chatWhatsappBtn}
              onPress={() => handleWhatsAppSeller(activeInquiry?.id)}
              activeOpacity={0.85}
            >
              <Ionicons name="logo-whatsapp" size={20} color="#25D366" />
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={[styles.orderMainBtn, hasActiveInquiry && styles.orderManageBtn]}
            onPress={() => {
              setOrderSuccess(false);
              setIsEditMode(false);
              setCancelPromptVisible(false);
              setFormError(null);
              setOrderModalVisible(true);
            }}
            activeOpacity={0.88}
          >
            <Ionicons
              name={hasActiveInquiry ? 'clipboard-outline' : 'bag-check-outline'}
              size={18}
              color="#FFFFFF"
              style={{ marginRight: 6 }}
            />
            <Text style={styles.orderMainBtnText}>
              {hasActiveInquiry ? 'Manage Order' : 'Request / Order'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Interactive Order / Inquiry Modal Sheet (True Fullscreen Dark Overlay) */}
      <Modal
        visible={orderModalVisible}
        animationType="slide"
        transparent={true}
        statusBarTranslucent={true}
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
                  <Text style={styles.modalTitle}>
                    {hasActiveInquiry && !isEditMode ? 'Order Inquiry Status' : isEditMode ? 'Edit Order Inquiry' : 'New Order Request'}
                  </Text>
                  <Text style={styles.modalSubtitle} numberOfLines={1}>
                    {product.title}
                  </Text>
                </View>
                <TouchableOpacity
                  style={styles.closeModalBtn}
                  onPress={() => {
                    setOrderModalVisible(false);
                    setIsEditMode(false);
                    setCancelPromptVisible(false);
                  }}
                >
                  <Ionicons name="close" size={22} color={colors.charcoal} />
                </TouchableOpacity>
              </View>
            </View>

            {/* View A: Success Receipt State */}
            {orderSuccess ? (
              <ScrollView contentContainerStyle={styles.successContent}>
                <View style={styles.successIconCircle}>
                  <Ionicons name="checkmark-done" size={42} color={colors.success} />
                </View>
                <Text style={styles.successTitle}>Inquiry Confirmed!</Text>
                <Text style={styles.successBody}>
                  Your order request has been transmitted directly to {product.sellerName}. It is currently under review.
                </Text>

                <View style={styles.summaryBox}>
                  <View style={styles.summaryLine}>
                    <Text style={styles.summaryLabel}>Status:</Text>
                    <View style={styles.statusPillPending}>
                      <Text style={styles.statusPillTextPending}>PENDING APPROVAL</Text>
                    </View>
                  </View>
                  <View style={styles.summaryLine}>
                    <Text style={styles.summaryLabel}>Total Estimated Price:</Text>
                    <Text style={styles.summaryVal}>
                      {formatPrice(totalPrice, product.currency)} ({quantity} pcs)
                    </Text>
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
                      handleWhatsAppSeller(activeInquiry?.id);
                    }}
                    activeOpacity={0.88}
                  >
                    <Ionicons name="logo-whatsapp" size={18} color="#FFFFFF" style={{ marginRight: 8 }} />
                    <Text style={styles.whatsappFollowUpText}>Chat on WhatsApp with Merchant</Text>
                  </TouchableOpacity>
                )}

                <TouchableOpacity
                  style={styles.doneBtn}
                  onPress={() => {
                    setOrderSuccess(false);
                    setOrderModalVisible(false);
                  }}
                  activeOpacity={0.88}
                >
                  <Text style={styles.doneBtnText}>Return to Product</Text>
                </TouchableOpacity>
              </ScrollView>
            ) : hasActiveInquiry && !isEditMode ? (
              /* View B: Active Order Management View (Status, Details, Edit & Cancel) */
              <ScrollView contentContainerStyle={styles.manageContent} showsVerticalScrollIndicator={false}>
                {/* Live Status Card */}
                <View style={styles.statusCard}>
                  <View style={styles.statusHeaderRow}>
                    <Text style={styles.statusCardTitle}>Current Status</Text>
                    <View
                      style={[
                        styles.statusPill,
                        activeInquiry.status === 'pending'
                          ? styles.statusPillPending
                          : styles.statusPillConfirmed,
                      ]}
                    >
                      <View
                        style={[
                          styles.pulsingDot,
                          { backgroundColor: activeInquiry.status === 'pending' ? colors.gold : colors.success },
                        ]}
                      />
                      <Text
                        style={[
                          styles.statusPillText,
                          activeInquiry.status === 'pending'
                            ? styles.statusPillTextPending
                            : styles.statusPillTextConfirmed,
                        ]}
                      >
                        {activeInquiry.status === 'pending' ? 'PENDING APPROVAL' : activeInquiry.status.toUpperCase()}
                      </Text>
                    </View>
                  </View>
                  <Text style={styles.statusDescription}>
                    {activeInquiry.status === 'pending'
                      ? 'Your order inquiry has been submitted and is currently awaiting merchant verification. You can freely edit delivery instructions or cancel until approved.'
                      : 'Your inquiry has been approved by the merchant. The artisan is preparing your package.'}
                  </Text>
                </View>

                {/* Inquiry Order Details */}
                <View style={styles.summaryBox}>
                  <View style={styles.summaryLine}>
                    <Text style={styles.summaryLabel}>Quantity Ordered:</Text>
                    <Text style={styles.summaryVal}>{activeInquiry.quantity} piece(s)</Text>
                  </View>
                  <View style={styles.summaryLine}>
                    <Text style={styles.summaryLabel}>Estimated Total:</Text>
                    <Text style={styles.summaryVal}>
                      {formatPrice(product.price * activeInquiry.quantity, product.currency)}
                    </Text>
                  </View>
                  <View style={styles.summaryLine}>
                    <Text style={styles.summaryLabel}>Delivery Destination:</Text>
                    <Text style={styles.summaryVal} numberOfLines={1}>
                      {activeInquiry.deliveryAddress}
                    </Text>
                  </View>
                  {activeInquiry.notes ? (
                    <View style={styles.summaryLineCol}>
                      <Text style={styles.summaryLabel}>Custom Notes / Sizing:</Text>
                      <Text style={styles.summaryValNote}>{activeInquiry.notes}</Text>
                    </View>
                  ) : null}
                  <View style={styles.summaryLine}>
                    <Text style={styles.summaryLabel}>Submitted At:</Text>
                    <Text style={styles.summaryVal}>
                      {new Date(activeInquiry.createdAt).toLocaleDateString()}
                    </Text>
                  </View>
                </View>

                {/* Inline Cancel Confirmation Box */}
                {cancelPromptVisible ? (
                  <View style={styles.cancelConfirmCard}>
                    <View style={styles.cancelConfirmHeader}>
                      <Ionicons name="warning-outline" size={18} color="#DC2626" style={{ marginRight: 6 }} />
                      <Text style={styles.cancelConfirmTitle}>Cancel this Order Inquiry?</Text>
                    </View>
                    <Text style={styles.cancelConfirmText}>
                      This will withdraw your request. You can submit a new inquiry anytime.
                    </Text>
                    <View style={styles.cancelActionsRow}>
                      <TouchableOpacity
                        style={styles.cancelDismissBtn}
                        onPress={() => setCancelPromptVisible(false)}
                        disabled={cancellingOrder}
                      >
                        <Text style={styles.cancelDismissText}>Keep Inquiry</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.cancelConfirmBtn}
                        onPress={handleCancelInquiry}
                        disabled={cancellingOrder}
                      >
                        {cancellingOrder ? (
                          <ActivityIndicator size="small" color="#FFFFFF" />
                        ) : (
                          <Text style={styles.cancelConfirmBtnText}>Confirm Cancel</Text>
                        )}
                      </TouchableOpacity>
                    </View>
                  </View>
                ) : null}

                {/* Action Buttons for Pending Order */}
                {hasPendingInquiry && !cancelPromptVisible && (
                  <View style={styles.manageBtnRow}>
                    <TouchableOpacity
                      style={styles.editInquiryBtn}
                      onPress={() => {
                        setFormError(null);
                        setIsEditMode(true);
                      }}
                      activeOpacity={0.85}
                    >
                      <Ionicons name="create-outline" size={17} color={colors.navy} style={{ marginRight: 6 }} />
                      <Text style={styles.editInquiryBtnText}>Edit Inquiry Details</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.cancelInquiryBtn}
                      onPress={() => setCancelPromptVisible(true)}
                      activeOpacity={0.85}
                    >
                      <Ionicons name="trash-outline" size={17} color="#DC2626" style={{ marginRight: 6 }} />
                      <Text style={styles.cancelInquiryBtnText}>Cancel Order</Text>
                    </TouchableOpacity>
                  </View>
                )}

                {product.sellerWhatsapp && (
                  <TouchableOpacity
                    style={[styles.whatsappFollowUpBtn, { marginTop: 12 }]}
                    onPress={() => {
                      setOrderModalVisible(false);
                      handleWhatsAppSeller(activeInquiry.id);
                    }}
                    activeOpacity={0.88}
                  >
                    <Ionicons name="logo-whatsapp" size={18} color="#FFFFFF" style={{ marginRight: 8 }} />
                    <Text style={styles.whatsappFollowUpText}>Chat with Merchant on WhatsApp</Text>
                  </TouchableOpacity>
                )}
              </ScrollView>
            ) : (
              /* View C: Order Inquiry Form (Both for New Orders and Inline Editing) */
              <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.formContent}
              >
                {/* Inline Error Notice (No Alert.alert) */}
                {formError ? (
                  <View style={styles.inlineErrorBox}>
                    <Ionicons name="alert-circle" size={16} color="#DC2626" style={{ marginRight: 8 }} />
                    <Text style={styles.inlineErrorText}>{formError}</Text>
                  </View>
                ) : null}

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
                    onChangeText={(val) => {
                      setFullName(val);
                      if (formError) setFormError(null);
                    }}
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
                    onChangeText={(val) => {
                      setEmail(val);
                      if (formError) setFormError(null);
                    }}
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
                    onChangeText={(val) => {
                      setDeliveryAddress(val);
                      if (formError) setFormError(null);
                    }}
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

                {/* Submit / Update Button */}
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
                        {isEditMode
                          ? `Save Updated Inquiry (${formatPrice(totalPrice, product.currency)})`
                          : `Submit Inquiry (${formatPrice(totalPrice, product.currency)})`}
                      </Text>
                      <Ionicons name="arrow-forward" size={16} color="#FFFFFF" style={{ marginLeft: 6 }} />
                    </>
                  )}
                </TouchableOpacity>

                {isEditMode && (
                  <TouchableOpacity
                    style={styles.cancelEditBtn}
                    onPress={() => {
                      setFormError(null);
                      setIsEditMode(false);
                    }}
                  >
                    <Text style={styles.cancelEditText}>Discard Changes</Text>
                  </TouchableOpacity>
                )}

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

  // Floating Navigation (Hides smoothly on scroll)
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

  // Active Order Banner on Product Detail Screen
  activeOrderBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFDF5',
    borderWidth: 1.5,
    borderColor: 'rgba(198, 148, 10, 0.4)',
    borderRadius: radius.lg,
    padding: 12,
    marginBottom: 16,
  },
  activeOrderIconBox: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(198, 148, 10, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  activeOrderTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 2,
  },
  activeOrderTitle: {
    fontSize: 12.5,
    fontFamily: fonts.body,
    fontWeight: '700',
    color: colors.navy,
  },
  activeOrderSub: {
    fontSize: 11.5,
    fontFamily: fonts.body,
    color: colors.charcoalSub,
  },

  // Status Pills
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  statusPillPending: {
    backgroundColor: 'rgba(198, 148, 10, 0.15)',
  },
  statusPillConfirmed: {
    backgroundColor: 'rgba(46, 125, 50, 0.12)',
  },
  statusPillText: {
    fontSize: 9.5,
    fontFamily: fonts.body,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  statusPillTextPending: {
    color: colors.goldRich,
  },
  statusPillTextConfirmed: {
    color: colors.success,
  },
  pulsingDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 4,
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
  orderManageBtn: {
    backgroundColor: colors.goldRich,
  },
  orderMainBtnText: {
    fontSize: 13.5,
    fontFamily: fonts.body,
    fontWeight: '700',
    color: '#FFFFFF',
  },

  // Modal Sheet (True Fullscreen dark overlay with statusBarTranslucent)
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '92%',
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

  // Inline Error Box (Replaces Alert.alert)
  inlineErrorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEE2E2',
    borderWidth: 1,
    borderColor: '#F87171',
    borderRadius: radius.md,
    paddingHorizontal: 12,
    paddingVertical: 9,
    marginBottom: 14,
  },
  inlineErrorText: {
    flex: 1,
    fontSize: 12,
    fontFamily: fonts.body,
    fontWeight: '600',
    color: '#B91C1C',
    lineHeight: 16,
  },

  // Manage Order View Styles
  manageContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 24,
  },
  statusCard: {
    backgroundColor: colors.ivory,
    borderRadius: radius.lg,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(198, 148, 10, 0.3)',
    marginBottom: 16,
  },
  statusHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  statusCardTitle: {
    fontSize: 13,
    fontFamily: fonts.body,
    fontWeight: '700',
    color: colors.navy,
  },
  statusDescription: {
    fontSize: 12,
    fontFamily: fonts.body,
    color: colors.charcoalSub,
    lineHeight: 17,
  },
  manageBtnRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 8,
  },
  editInquiryBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.ivory,
    borderWidth: 1.2,
    borderColor: colors.navy,
    borderRadius: radius.pill,
    paddingVertical: 12,
  },
  editInquiryBtnText: {
    fontSize: 12.5,
    fontFamily: fonts.body,
    fontWeight: '700',
    color: colors.navy,
  },
  cancelInquiryBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FEF2F2',
    borderWidth: 1.2,
    borderColor: '#F87171',
    borderRadius: radius.pill,
    paddingVertical: 12,
  },
  cancelInquiryBtnText: {
    fontSize: 12.5,
    fontFamily: fonts.body,
    fontWeight: '700',
    color: '#DC2626',
  },

  // Cancel Confirmation Card
  cancelConfirmCard: {
    backgroundColor: '#FEF2F2',
    borderWidth: 1.2,
    borderColor: '#F87171',
    borderRadius: radius.lg,
    padding: 14,
    marginTop: 10,
    marginBottom: 10,
  },
  cancelConfirmHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  cancelConfirmTitle: {
    fontSize: 13,
    fontFamily: fonts.body,
    fontWeight: '700',
    color: '#DC2626',
  },
  cancelConfirmText: {
    fontSize: 11.5,
    fontFamily: fonts.body,
    color: colors.charcoalSub,
    marginBottom: 12,
    lineHeight: 16,
  },
  cancelActionsRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
  },
  cancelDismissBtn: {
    paddingVertical: 7,
    paddingHorizontal: 12,
    borderRadius: radius.pill,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: 'rgba(23, 25, 28, 0.15)',
  },
  cancelDismissText: {
    fontSize: 11.5,
    fontFamily: fonts.body,
    fontWeight: '600',
    color: colors.charcoal,
  },
  cancelConfirmBtn: {
    paddingVertical: 7,
    paddingHorizontal: 14,
    borderRadius: radius.pill,
    backgroundColor: '#DC2626',
  },
  cancelConfirmBtnText: {
    fontSize: 11.5,
    fontFamily: fonts.body,
    fontWeight: '700',
    color: '#FFFFFF',
  },

  // Form Content
  formContent: {
    paddingHorizontal: 20,
    paddingTop: 14,
    paddingBottom: 24,
  },
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
  cancelEditBtn: {
    paddingVertical: 10,
    alignItems: 'center',
    marginTop: 6,
  },
  cancelEditText: {
    fontSize: 12.5,
    fontFamily: fonts.body,
    fontWeight: '600',
    color: colors.charcoalSub,
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
    marginBottom: 14,
    gap: 8,
  },
  summaryLine: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  summaryLineCol: {
    marginTop: 2,
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
  summaryValNote: {
    fontSize: 11.5,
    fontFamily: fonts.body,
    color: colors.charcoal,
    fontStyle: 'italic',
    marginTop: 2,
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
