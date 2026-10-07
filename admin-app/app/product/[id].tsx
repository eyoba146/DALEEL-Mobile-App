import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { ScreenHeader } from '../../components/ScreenHeader';
import { Card } from '../../components/Card';
import { Input } from '../../components/Input';
import { Button } from '../../components/Button';
import { adminApi } from '../../lib/api';
import { useToast } from '../../lib/toast-context';
import { useAdminAuth } from '../../lib/auth-context';
import { colors, type, fonts, radius } from '../../theme/tokens';

const PRODUCT_CATEGORIES = [
  'Textiles & Habesha Kemis',
  'Traditional Coffee & Spices',
  'Leather Goods',
  'Religious & Cultural Art',
  'Pottery & Crafts',
  'Jewelry & Precious Metals',
];

export default function ProductDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { showToast } = useToast();
  const { canManageMarketplace } = useAdminAuth();

  const isNew = id === 'new';

  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Form Fields
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState(PRODUCT_CATEGORIES[0]);
  const [price, setPrice] = useState('');
  const [currency, setCurrency] = useState('ETB');
  const [sellerName, setSellerName] = useState('');
  const [sellerLocation, setSellerLocation] = useState('');
  const [sellerPhone, setSellerPhone] = useState('');
  const [sellerWhatsapp, setSellerWhatsapp] = useState('');
  const [sellerVerified, setSellerVerified] = useState(true);
  const [inStock, setInStock] = useState(true);
  const [blurb, setBlurb] = useState('');
  const [materials, setMaterials] = useState('');
  const [origin, setOrigin] = useState('');
  const [image, setImage] = useState('');

  // Errors
  const [titleError, setTitleError] = useState('');
  const [priceError, setPriceError] = useState('');
  const [sellerError, setSellerError] = useState('');

  useEffect(() => {
    if (!isNew && id) {
      loadProduct(id);
    }
  }, [id, isNew]);

  const loadProduct = async (prodId: string) => {
    try {
      setLoading(true);
      const prods = await adminApi.getProducts();
      const match = prods.find((p: any) => p.id === prodId);
      if (match) {
        setTitle(match.title || '');
        setCategory(match.category || PRODUCT_CATEGORIES[0]);
        setPrice(match.price ? String(match.price) : '');
        setCurrency(match.currency || 'ETB');
        setSellerName(match.sellerName || '');
        setSellerLocation(match.sellerLocation || '');
        setSellerPhone(match.sellerPhone || '');
        setSellerWhatsapp(match.sellerWhatsapp || '');
        setSellerVerified(match.sellerVerified ?? true);
        setInStock(match.inStock ?? true);
        setBlurb(match.blurb || '');
        setMaterials(match.materials || '');
        setOrigin(match.origin || '');
        setImage(match.image || '');
      } else {
        showToast('Product record not found', 'error');
        router.back();
      }
    } catch (err: any) {
      showToast(err.message || 'Failed to load product', 'error');
    } finally {
      setLoading(false);
    }
  };

  const validate = () => {
    let isValid = true;
    if (!title.trim()) {
      setTitleError('Product title is required');
      isValid = false;
    } else {
      setTitleError('');
    }

    if (!price.trim() || isNaN(Number(price))) {
      setPriceError('A valid numeric price in ETB is required');
      isValid = false;
    } else {
      setPriceError('');
    }

    if (!sellerName.trim()) {
      setSellerError('Artisan / Cooperative seller name is required');
      isValid = false;
    } else {
      setSellerError('');
    }

    return isValid;
  };

  const handleSave = async () => {
    if (!canManageMarketplace) {
      showToast('You do not have clearance to manage marketplace', 'error');
      return;
    }
    if (!validate()) return;

    try {
      setSaving(true);
      const payload = {
        title: title.trim(),
        category,
        price: parseFloat(price),
        currency: currency.trim() || 'ETB',
        sellerName: sellerName.trim(),
        sellerLocation: sellerLocation.trim() || 'Addis Ababa',
        sellerPhone: sellerPhone.trim() || null,
        sellerWhatsapp: sellerWhatsapp.trim() || null,
        sellerVerified,
        inStock,
        blurb: blurb.trim() || null,
        materials: materials.trim() || null,
        origin: origin.trim() || null,
        image: image.trim() || 'https://images.unsplash.com/photo-1590736969955-71cc94801759',
      };

      if (isNew) {
        await adminApi.createProduct(payload);
        showToast('Artisan craft created', 'success');
      } else {
        await adminApi.updateProduct(id as string, payload);
        showToast('Artisan craft updated', 'success');
      }
      router.back();
    } catch (err: any) {
      showToast(err.message || 'Failed to save product', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = () => {
    Alert.alert(
      'Remove Product',
      `Are you sure you want to delete "${title}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              setDeleting(true);
              await adminApi.deleteProduct(id as string);
              showToast('Product removed', 'success');
              router.back();
            } catch (err: any) {
              showToast(err.message || 'Failed to delete product', 'error');
            } finally {
              setDeleting(false);
            }
          },
        },
      ]
    );
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScreenHeader
        title={isNew ? 'New Craft / Product' : 'Edit Craft'}
        subtitle={isNew ? 'Catalog Ethiopian artisan product' : title}
        showBack
        variant="navy"
        badge={inStock ? 'IN STOCK' : 'OUT OF STOCK'}
      />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Product Identity */}
        <Text style={styles.sectionHeading}>PRODUCT SPECIFICATIONS</Text>
        <Card style={styles.card}>
          <Input
            label="Product Title *"
            value={title}
            onChangeText={(txt) => {
              setTitle(txt);
              if (titleError) setTitleError('');
            }}
            placeholder="e.g. Handwoven Dorze Cotton Habesha Kemis"
            error={titleError}
          />

          <Text style={styles.fieldLabel}>Craft Category *</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.categoryPills}
          >
            {PRODUCT_CATEGORIES.map((cat) => {
              const selected = category === cat;
              return (
                <TouchableOpacity
                  key={cat}
                  style={[styles.pill, selected && styles.pillSelected]}
                  onPress={() => setCategory(cat)}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.pillText, selected && styles.pillTextSelected]}>
                    {cat}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          <Input
            label="Price (ETB) *"
            value={price}
            onChangeText={(txt) => {
              setPrice(txt);
              if (priceError) setPriceError('');
            }}
            placeholder="e.g. 8500"
            keyboardType="numeric"
            error={priceError}
          />

          <Input
            label="Product Overview / Story"
            value={blurb}
            onChangeText={setBlurb}
            placeholder="Detailed weaving process, regional cultural context..."
            multiline
            numberOfLines={4}
          />

          <Input
            label="Authentic Materials"
            value={materials}
            onChangeText={setMaterials}
            placeholder="e.g. 100% Organic Ethiopian Cotton, Tibeb Embroidery"
          />

          <Input
            label="Geographic Origin"
            value={origin}
            onChangeText={setOrigin}
            placeholder="e.g. Dorze Highlands, Gamo Zone"
          />

          <Input
            label="Product Image URL"
            value={image}
            onChangeText={setImage}
            placeholder="https://images.unsplash.com/..."
          />
        </Card>

        {/* Artisan / Seller Details */}
        <Text style={styles.sectionHeading}>ARTISAN / COOPERATIVE</Text>
        <Card style={styles.card}>
          <Input
            label="Artisan or Guild Name *"
            value={sellerName}
            onChangeText={(txt) => {
              setSellerName(txt);
              if (sellerError) setSellerError('');
            }}
            placeholder="e.g. Addis Crafts Weavers Collective"
            error={sellerError}
          />

          <Input
            label="Workshop Location"
            value={sellerLocation}
            onChangeText={setSellerLocation}
            placeholder="Shiro Meda, Addis Ababa"
          />

          <Input
            label="Direct Phone Number"
            value={sellerPhone}
            onChangeText={setSellerPhone}
            placeholder="+251 911 345 678"
            keyboardType="phone-pad"
          />

          <Input
            label="WhatsApp Contact"
            value={sellerWhatsapp}
            onChangeText={setSellerWhatsapp}
            placeholder="+251911345678"
            keyboardType="phone-pad"
          />
        </Card>

        {/* Stock & Verified Toggles */}
        <Text style={styles.sectionHeading}>INVENTORY & VERIFICATION</Text>
        <Card style={styles.card}>
          <View style={styles.switchRow}>
            <View style={styles.switchTextWrap}>
              <Text style={styles.switchTitle}>Currently In Stock</Text>
              <Text style={styles.switchSub}>
                Available for Diaspora inquiry and cooperative reservation
              </Text>
            </View>
            <Switch
              value={inStock}
              onValueChange={setInStock}
              trackColor={{ false: colors.border, true: colors.gold }}
              thumbColor={inStock ? colors.navy : '#FFFFFF'}
            />
          </View>

          <View style={[styles.switchRow, { marginTop: 14, paddingTop: 14, borderTopWidth: 1, borderTopColor: colors.border }]}>
            <View style={styles.switchTextWrap}>
              <Text style={styles.switchTitle}>Verified Master Artisan</Text>
              <Text style={styles.switchSub}>
                Certified authentic heritage cooperative badge
              </Text>
            </View>
            <Switch
              value={sellerVerified}
              onValueChange={setSellerVerified}
              trackColor={{ false: colors.border, true: colors.gold }}
              thumbColor={sellerVerified ? colors.navy : '#FFFFFF'}
            />
          </View>
        </Card>

        {/* Action Buttons */}
        <View style={styles.actions}>
          <Button
            title={isNew ? 'Publish Craft' : 'Save Changes'}
            onPress={handleSave}
            loading={saving}
            icon={<Ionicons name="bag-check-outline" size={18} color="#FFFFFF" />}
          />

          {!isNew && (
            <Button
              title="Delete Craft"
              variant="danger"
              onPress={handleDelete}
              loading={deleting}
              icon={<Ionicons name="trash-outline" size={18} color="#FFFFFF" />}
            />
          )}

          <Button
            title="Cancel"
            variant="ghost"
            onPress={() => router.back()}
          />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
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
  sectionHeading: {
    ...type.tiny,
    fontFamily: fonts.sansBold,
    color: colors.textTertiary,
    letterSpacing: 1,
    marginBottom: 8,
    marginLeft: 4,
    marginTop: 12,
  },
  card: {
    padding: 16,
    marginBottom: 12,
  },
  fieldLabel: {
    ...type.caption,
    fontFamily: fonts.sansMedium,
    color: colors.textPrimary,
    marginBottom: 8,
  },
  categoryPills: {
    gap: 8,
    paddingBottom: 14,
  },
  pill: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: radius.full,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  pillSelected: {
    backgroundColor: colors.navy,
    borderColor: colors.gold,
  },
  pillText: {
    ...type.caption,
    color: colors.textSecondary,
    fontFamily: fonts.sansMedium,
  },
  pillTextSelected: {
    color: '#FFFFFF',
    fontFamily: fonts.sansBold,
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
    gap: 10,
    marginTop: 16,
  },
});
