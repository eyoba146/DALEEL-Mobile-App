import React, { useEffect, useState } from 'react';
import { adminApi } from '../api';
import { ImageUploader } from './ImageUploader';
import {
  Plus,
  Search,
  Edit3,
  Trash2,
  RefreshCw,
  ArrowLeft,
  Check,
  MapPin,
  LayoutGrid,
  List,
  Sparkles,
} from 'lucide-react';

interface ProductItem {
  id: string;
  title: string;
  price: number;
  currency: string;
  category: string;
  sellerName: string;
  sellerVerified: boolean;
  sellerLocation: string;
  sellerPhone?: string | null;
  sellerWhatsapp?: string | null;
  image: string;
  blurb?: string | null;
  description?: string | null;
  materials?: string | null;
  origin?: string | null;
  inStock: boolean;
}

interface OrderInquiryItem {
  id: string;
  fullName: string;
  contactEmail: string;
  contactPhone?: string | null;
  deliveryAddress?: string | null;
  quantity: number;
  notes?: string | null;
  status: string;
  createdAt: string;
  latitude?: number | null;
  longitude?: number | null;
  product: {
    id: string;
    title: string;
    price: number;
    currency: string;
    image: string;
  };
}

export const MarketplaceManager: React.FC = () => {
  const [activeSubTab, setActiveSubTab] = useState<'products' | 'orders'>('products');
  const [products, setProducts] = useState<ProductItem[]>([]);
  const [orders, setOrders] = useState<OrderInquiryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  // Dedicated In-Page Editor State (NO POPUPS)
  const [isEditorActive, setIsEditorActive] = useState(false);
  const [editingItem, setEditingItem] = useState<ProductItem | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Form Fields
  const [formData, setFormData] = useState({
    title: '',
    price: 3500,
    currency: 'ETB',
    category: 'Textiles & Habesha Kemis',
    sellerName: 'Sheba Heritage Weavers Guild',
    sellerVerified: true,
    sellerLocation: 'Shiro Meda, Addis Ababa',
    sellerPhone: '+251 91 123 4567',
    sellerWhatsapp: '+251 91 123 4567',
    image: 'https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?w=800',
    blurb: 'Handwoven pure Ethiopian cotton with traditional Tibeb embroidery borders',
    description: 'Authentic ceremonial attire handcrafted by master weavers in Addis Ababa.',
    materials: '100% Organic Handspun Cotton, Silk Thread',
    origin: 'Addis Ababa',
    inStock: true,
  });

  const loadData = async () => {
    setLoading(true);
    try {
      const [prodData, orderData] = await Promise.all([
        adminApi.getProducts(),
        adminApi.getOrders(),
      ]);
      setProducts(prodData);
      setOrders(orderData);
    } catch (err: any) {
      console.error('Failed to load marketplace data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleOpenCreate = () => {
    setEditingItem(null);
    setFormData({
      title: '',
      price: 3500,
      currency: 'ETB',
      category: 'Textiles & Habesha Kemis',
      sellerName: 'Sheba Heritage Weavers Guild',
      sellerVerified: true,
      sellerLocation: 'Shiro Meda, Addis Ababa',
      sellerPhone: '+251 91 123 4567',
      sellerWhatsapp: '+251 91 123 4567',
      image: 'https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?w=800',
      blurb: 'Handwoven pure Ethiopian cotton with traditional Tibeb embroidery borders',
      description: 'Authentic ceremonial attire handcrafted by master weavers in Addis Ababa.',
      materials: '100% Organic Handspun Cotton, Silk Thread',
      origin: 'Addis Ababa',
      inStock: true,
    });
    setErrorMessage('');
    setIsEditorActive(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleOpenEdit = (item: ProductItem) => {
    setEditingItem(item);
    setFormData({
      title: item.title,
      price: item.price,
      currency: item.currency || 'ETB',
      category: item.category,
      sellerName: item.sellerName,
      sellerVerified: item.sellerVerified,
      sellerLocation: item.sellerLocation,
      sellerPhone: item.sellerPhone || '',
      sellerWhatsapp: item.sellerWhatsapp || '',
      image: item.image,
      blurb: item.blurb || '',
      description: item.description || '',
      materials: item.materials || '',
      origin: item.origin || '',
      inStock: item.inStock,
    });
    setErrorMessage('');
    setIsEditorActive(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCloseEditor = () => {
    setIsEditorActive(false);
    setEditingItem(null);
  };

  const handleDelete = async (id: string, title: string) => {
    if (!window.confirm(`Are you sure you wish to delete "${title}"?`)) return;
    try {
      await adminApi.deleteProduct(id);
      loadData();
      if (editingItem?.id === id) {
        handleCloseEditor();
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to delete product');
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setErrorMessage('');

    try {
      if (editingItem) {
        await adminApi.updateProduct(editingItem.id, formData);
      } else {
        await adminApi.createProduct(formData);
      }
      setIsEditorActive(false);
      loadData();
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to save product');
    } finally {
      setIsSaving(false);
    }
  };

  const handleUpdateOrderStatus = async (id: string, status: string) => {
    try {
      await adminApi.updateOrderStatus(id, status);
      loadData();
    } catch (err: any) {
      console.error('Failed to update status:', err);
    }
  };

  const filteredProducts = products.filter(
    (p) =>
      p.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.sellerName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Dedicated In-Page Full Workspace Editor (NO POPUP)
  if (isEditorActive) {
    return (
      <div style={styles.container}>
        {/* Editor Top Navigation Bar */}
        <div style={styles.editorNav}>
          <div style={styles.editorNavLeft}>
            <button style={styles.backBtn} onClick={handleCloseEditor}>
              <ArrowLeft size={16} color="#07152B" />
              <span>Back to Products</span>
            </button>
            <div style={styles.editorBreadcrumbs}>
              <span style={styles.breadcrumbMuted}>Marketplace</span>
              <span style={styles.breadcrumbSep}>/</span>
              <span style={styles.breadcrumbCurrent}>
                {editingItem ? `Edit: ${editingItem.title}` : 'Add New Artisan Product'}
              </span>
            </div>
          </div>

          <div style={styles.editorNavActions}>
            <button type="button" className="btn btn-secondary" onClick={handleCloseEditor}>
              Cancel
            </button>
            <button
              type="button"
              className="btn btn-primary"
              disabled={isSaving}
              onClick={handleSave}
            >
              <Check size={16} color="#07152B" />
              <span>{isSaving ? 'Saving...' : editingItem ? 'Save Product' : 'Publish Product'}</span>
            </button>
          </div>
        </div>

        {errorMessage && <div style={styles.errorBox}>{errorMessage}</div>}

        {/* 2-Column Dedicated Editor Workspace */}
        <form onSubmit={handleSave} style={styles.editorGrid}>
          {/* Left Column: Product Details */}
          <div style={styles.formCard}>
            <h3 style={styles.cardSectionTitle}>Product Details & Pricing</h3>
            <p style={styles.cardSectionSub}>Pricing, category, materials, and inventory availability</p>

            <div style={styles.formStack}>
              <div>
                <label style={styles.label}>Product Title *</label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="e.g. Royal Gonderian Silk Kemis"
                  style={styles.fullInput}
                />
              </div>

              <div style={styles.inputRow}>
                <div style={{ flex: 1 }}>
                  <label style={styles.label}>Category *</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    style={styles.fullInput}
                  >
                    <option value="Textiles & Habesha Kemis">Textiles & Habesha Kemis</option>
                    <option value="Coffee & Buna Ceremonial">Coffee & Buna Ceremonial</option>
                    <option value="Jewelry & Silver Filigree">Jewelry & Silver Filigree</option>
                    <option value="Leathercraft & Art">Leathercraft & Art</option>
                    <option value="Spices & Specialty Foods">Spices & Specialty Foods</option>
                  </select>
                </div>

                <div style={{ flex: 1 }}>
                  <label style={styles.label}>Price (ETB) *</label>
                  <input
                    type="number"
                    required
                    min={1}
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: Number(e.target.value) })}
                    style={styles.fullInput}
                  />
                </div>
              </div>

              <div style={styles.inputRow}>
                <div style={{ flex: 1 }}>
                  <label style={styles.label}>Materials</label>
                  <input
                    type="text"
                    value={formData.materials}
                    onChange={(e) => setFormData({ ...formData, materials: e.target.value })}
                    placeholder="e.g. 100% Cotton, Silver, Clay"
                    style={styles.fullInput}
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={styles.label}>Origin Region</label>
                  <input
                    type="text"
                    value={formData.origin}
                    onChange={(e) => setFormData({ ...formData, origin: e.target.value })}
                    placeholder="e.g. Addis Ababa, Harar, Gondar"
                    style={styles.fullInput}
                  />
                </div>
              </div>

              <div>
                <label style={styles.label}>Summary Blurb</label>
                <input
                  type="text"
                  value={formData.blurb}
                  onChange={(e) => setFormData({ ...formData, blurb: e.target.value })}
                  placeholder="Handcrafted authentic Ethiopian artisan good..."
                  style={styles.fullInput}
                />
              </div>

              <div>
                <label style={styles.label}>Full Description</label>
                <textarea
                  rows={4}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Detailed craftsmanship and ceremonial background..."
                  style={styles.textarea}
                />
              </div>

              <div style={styles.checkboxRow}>
                <input
                  type="checkbox"
                  id="inStockCheck"
                  checked={formData.inStock}
                  onChange={(e) => setFormData({ ...formData, inStock: e.target.checked })}
                  style={styles.checkbox}
                />
                <label htmlFor="inStockCheck" style={styles.checkboxLabel}>
                  Available in Stock for Immediate Order
                </label>
              </div>
            </div>
          </div>

          {/* Right Column: Imagery & Guild Seller Details */}
          <div style={styles.formCard}>
            <h3 style={styles.cardSectionTitle}>Artisan Guild & Imagery</h3>
            <p style={styles.cardSectionSub}>Seller workshop details and high-resolution photo preview</p>

            <div style={styles.formStack}>
              <div>
                <ImageUploader
                  value={formData.image}
                  onChange={(url) => setFormData({ ...formData, image: url })}
                  label="Artisan Product Photo"
                />
              </div>

              <div>
                <label style={styles.label}>Seller / Artisan Guild Name *</label>
                <input
                  type="text"
                  required
                  value={formData.sellerName}
                  onChange={(e) => setFormData({ ...formData, sellerName: e.target.value })}
                  placeholder="e.g. Sheba Heritage Weavers Guild"
                  style={styles.fullInput}
                />
              </div>

              <div>
                <label style={styles.label}>Seller Location</label>
                <input
                  type="text"
                  value={formData.sellerLocation}
                  onChange={(e) => setFormData({ ...formData, sellerLocation: e.target.value })}
                  placeholder="e.g. Shiro Meda, Addis Ababa"
                  style={styles.fullInput}
                />
              </div>

              <div style={styles.inputRow}>
                <div style={{ flex: 1 }}>
                  <label style={styles.label}>Contact Phone</label>
                  <input
                    type="text"
                    value={formData.sellerPhone}
                    onChange={(e) => setFormData({ ...formData, sellerPhone: e.target.value })}
                    placeholder="+251 91 123 4567"
                    style={styles.fullInput}
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={styles.label}>WhatsApp (Optional)</label>
                  <input
                    type="text"
                    value={formData.sellerWhatsapp}
                    onChange={(e) => setFormData({ ...formData, sellerWhatsapp: e.target.value })}
                    placeholder="+251 91 123 4567"
                    style={styles.fullInput}
                  />
                </div>
              </div>
            </div>
          </div>
        </form>
      </div>
    );
  }

  // Catalog Directory List View
  return (
    <div style={styles.container}>
      {/* Top Header Row */}
      <div style={styles.topRow}>
        <div>
          <h2 style={styles.sectionTitle}>Artisan Marketplace & Orders</h2>
          <p style={styles.sectionDesc}>
            Curate authentic Ethiopian crafts, traditional apparel, Buna ceremony sets, and review customer orders.
          </p>
        </div>

        <div style={styles.actionsGroup}>
          <button className="btn btn-secondary" onClick={loadData}>
            <RefreshCw size={15} color="#07152B" />
            <span>Refresh</span>
          </button>
          <button className="btn btn-primary" onClick={handleOpenCreate}>
            <Plus size={16} color="#07152B" />
            <span>Add Product</span>
          </button>
        </div>
      </div>

      {/* Sub-tabs Row */}
      <div style={styles.tabsRow}>
        <button
          style={{
            ...styles.tabBtn,
            ...(activeSubTab === 'products' ? styles.tabBtnActive : {}),
          }}
          onClick={() => setActiveSubTab('products')}
        >
          <span>Product Catalog</span>
          <span style={styles.tabBadge}>{products.length}</span>
        </button>

        <button
          style={{
            ...styles.tabBtn,
            ...(activeSubTab === 'orders' ? styles.tabBtnActive : {}),
          }}
          onClick={() => setActiveSubTab('orders')}
        >
          <span>Customer Orders</span>
          <span style={styles.tabBadge}>{orders.length}</span>
        </button>
      </div>

      {/* Products Tab View */}
      {activeSubTab === 'products' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div style={styles.filterBar}>
            <div style={styles.searchWrapper}>
              <Search size={16} color="#8A9AA8" style={{ position: 'absolute', left: '12px' }} />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search products by title, category, or artisan..."
                style={styles.searchInput}
              />
            </div>

            {/* Grid / List View Toggle */}
            <div style={styles.viewToggleWrap}>
              <button
                type="button"
                style={{
                  ...styles.viewToggleBtn,
                  ...(viewMode === 'grid' ? styles.viewToggleBtnActive : {}),
                }}
                onClick={() => setViewMode('grid')}
                title="Showcase Grid View"
              >
                <LayoutGrid size={15} color={viewMode === 'grid' ? '#07152B' : '#5A687A'} />
              </button>
              <button
                type="button"
                style={{
                  ...styles.viewToggleBtn,
                  ...(viewMode === 'list' ? styles.viewToggleBtnActive : {}),
                }}
                onClick={() => setViewMode('list')}
                title="Compact List View"
              >
                <List size={15} color={viewMode === 'list' ? '#07152B' : '#5A687A'} />
              </button>
            </div>
          </div>

          {loading ? (
            <div style={styles.emptyState}>Loading artisan products...</div>
          ) : filteredProducts.length === 0 ? (
            <div style={styles.emptyState}>No products found.</div>
          ) : viewMode === 'grid' ? (
            /* Luxury Cards Grid */
            <div className="luxury-grid">
              {filteredProducts.map((prod) => (
                <div key={prod.id} className="luxury-card">
                  {/* Media Banner with 16:10 Aspect Ratio, Scrim, and Badges */}
                  <div className="luxury-card-media">
                    <img src={prod.image} alt={prod.title} className="luxury-card-img" />
                    <div className="luxury-card-scrim" />

                    <div className="luxury-badge-top-left">
                      <span className="glass-pill">{prod.category}</span>
                    </div>

                    <div className="luxury-badge-top-right">
                      <span className="gold-glow-badge">
                        {prod.price?.toLocaleString()} {prod.currency || 'ETB'}
                      </span>
                    </div>

                    <div className="luxury-badge-bottom-left">
                      <span className="glass-pill" style={{ textTransform: 'none', fontSize: '11px' }}>
                        <MapPin size={11} color="#DFB76C" />
                        <span>{prod.sellerLocation || prod.origin || 'Ethiopia'}</span>
                      </span>
                    </div>

                    <div className="luxury-badge-bottom-right">
                      {prod.inStock ? (
                        <span className="glass-pill-light" style={{ color: '#16803C' }}>
                          ● IN STOCK
                        </span>
                      ) : (
                        <span className="glass-pill-light" style={{ color: '#D63031' }}>
                          SOLD OUT
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Card Body */}
                  <div className="luxury-card-body">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Sparkles size={12} color="#C59B43" />
                      <span style={{ fontSize: '12px', fontWeight: 600, color: '#C59B43', letterSpacing: '0.03em' }}>
                        {prod.sellerName}
                      </span>
                    </div>

                    <h3 className="luxury-card-title">{prod.title}</h3>

                    <p className="luxury-card-blurb">
                      {prod.blurb || prod.description || prod.materials || 'Handcrafted authentic artisan heritage piece.'}
                    </p>

                    <div className="luxury-card-meta">
                      {prod.materials && (
                        <span style={{ fontSize: '11.5px', color: '#5A687A' }}>
                          {prod.materials}
                        </span>
                      )}
                      {prod.origin && (
                        <span style={{ fontSize: '11.5px', color: '#8A9AA8', fontStyle: 'italic', marginLeft: 'auto' }}>
                          Origin: {prod.origin}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Card Action Footer */}
                  <div className="luxury-card-footer">
                    <button
                      type="button"
                      className="luxury-edit-btn"
                      onClick={() => handleOpenEdit(prod)}
                    >
                      <Edit3 size={14} color="#DFB76C" />
                      <span>Edit Product</span>
                    </button>
                    <button
                      type="button"
                      className="luxury-icon-btn"
                      onClick={() => handleDelete(prod.id, prod.title)}
                      title="Delete Product"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            /* Compact List View */
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {filteredProducts.map((prod) => (
                <div key={prod.id} className="luxury-list-row">
                  <img src={prod.image} alt={prod.title} className="luxury-list-thumb" />

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                      <h4 style={{ fontSize: '16px', fontWeight: 700, color: '#07152B', margin: 0 }}>
                        {prod.title}
                      </h4>
                      <span className="badge badge-navy">{prod.category}</span>
                      <span className="badge badge-gold">
                        {prod.price?.toLocaleString()} {prod.currency || 'ETB'}
                      </span>
                      {prod.inStock ? (
                        <span className="badge badge-success">In Stock</span>
                      ) : (
                        <span className="badge badge-error">Sold Out</span>
                      )}
                    </div>

                    <p style={{ fontSize: '13px', color: '#5A687A', margin: '0 0 6px 0', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {prod.blurb || prod.description || 'Authentic artisan work'}
                    </p>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px', fontSize: '12px', color: '#8A9AA8' }}>
                      <span>Artisan: <strong style={{ color: '#07152B' }}>{prod.sellerName}</strong></span>
                      {prod.materials && <span>Materials: {prod.materials}</span>}
                      {prod.origin && <span>Origin: {prod.origin}</span>}
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <button
                      type="button"
                      className="btn btn-navy"
                      style={{ padding: '8px 14px', fontSize: '12.5px' }}
                      onClick={() => handleOpenEdit(prod)}
                    >
                      <Edit3 size={13} color="#DFB76C" />
                      <span>Edit</span>
                    </button>
                    <button
                      type="button"
                      className="luxury-icon-btn"
                      onClick={() => handleDelete(prod.id, prod.title)}
                      title="Delete Product"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Orders Tab View */}
      {activeSubTab === 'orders' && (
        <div className="table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Customer Details</th>
                <th>Ordered Item</th>
                <th>Quantity & Total</th>
                <th>Delivery Address</th>
                <th>Status</th>
                <th style={{ textAlign: 'right' }}>Update Status</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: '36px', color: '#5A687A' }}>
                    Loading customer orders...
                  </td>
                </tr>
              ) : orders.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: '36px', color: '#5A687A' }}>
                    No customer orders placed yet.
                  </td>
                </tr>
              ) : (
                orders.map((ord) => (
                  <tr key={ord.id}>
                    <td>
                      <div style={{ fontWeight: 700, color: '#07152B' }}>{ord.fullName}</div>
                      <div style={{ fontSize: '12px', color: '#5A687A', marginTop: '2px' }}>
                        {ord.contactEmail} • {ord.contactPhone || 'No phone'}
                      </div>
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        {ord.product?.image && (
                          <img src={ord.product.image} alt={ord.product.title} style={styles.tableThumb} />
                        )}
                        <div>
                          <div style={{ fontWeight: 600, color: '#07152B', fontSize: '13px' }}>
                            {ord.product?.title}
                          </div>
                          <div style={{ fontSize: '11.5px', color: '#5A687A' }}>
                            {ord.product?.price} {ord.product?.currency} each
                          </div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <div style={{ fontWeight: 700, color: '#07152B' }}>
                        Qty: {ord.quantity}
                      </div>
                      <div style={{ fontSize: '12px', color: '#8C6A21', fontWeight: 600 }}>
                        {((ord.product?.price || 0) * ord.quantity).toLocaleString()} {ord.product?.currency || 'ETB'}
                      </div>
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '4px', maxWidth: '280px' }}>
                        <MapPin size={14} color="#8C6A21" style={{ marginTop: '2px', flexShrink: 0 }} />
                        <div>
                          <div style={{ fontSize: '12.5px', color: '#07152B' }}>
                            {ord.deliveryAddress || 'Standard Delivery (Addis Ababa)'}
                          </div>
                          {ord.notes && (
                            <div style={{ fontSize: '11px', color: '#5A687A', fontStyle: 'italic', marginTop: '2px' }}>
                              Note: "{ord.notes}"
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td>
                      <span
                        className={`badge ${
                          ord.status === 'delivered'
                            ? 'badge-success'
                            : ord.status === 'dispatched'
                            ? 'badge-gold'
                            : ord.status === 'confirmed'
                            ? 'badge-navy'
                            : ord.status === 'cancelled'
                            ? 'badge-error'
                            : 'badge-warning'
                        }`}
                      >
                        {ord.status.toUpperCase()}
                      </span>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <select
                        value={ord.status}
                        onChange={(e) => handleUpdateOrderStatus(ord.id, e.target.value)}
                        style={{ padding: '6px 10px', fontSize: '12px', borderRadius: '6px' }}
                      >
                        <option value="pending">Pending</option>
                        <option value="confirmed">Confirmed</option>
                        <option value="dispatched">Dispatched</option>
                        <option value="delivered">Delivered</option>
                        <option value="cancelled">Cancelled</option>
                      </select>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

const styles: { [key: string]: React.CSSProperties } = {
  container: {
    padding: '32px',
    maxWidth: '1400px',
    margin: '0 auto',
    display: 'flex',
    flexDirection: 'column',
    gap: '24px',
  },
  topRow: {
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: '16px',
    flexWrap: 'wrap',
  },
  sectionTitle: {
    fontSize: '26px',
    color: '#07152B',
    margin: 0,
  },
  sectionDesc: {
    fontSize: '13.5px',
    color: '#5A687A',
    marginTop: '4px',
  },
  actionsGroup: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
  },
  tabsRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    borderBottom: '1px solid #E4E9F0',
    paddingBottom: '4px',
  },
  tabBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '8px',
    padding: '10px 18px',
    borderBottom: '2px solid transparent',
    color: '#5A687A',
    fontWeight: 600,
    fontSize: '13.5px',
    cursor: 'pointer',
    backgroundColor: 'transparent',
    transition: 'all 0.15s ease',
  },
  tabBtnActive: {
    color: '#07152B',
    borderBottomColor: '#DFB76C',
    fontWeight: 700,
  },
  tabBadge: {
    backgroundColor: '#EAEFF8',
    color: '#07152B',
    fontSize: '11px',
    fontWeight: 700,
    padding: '2px 8px',
    borderRadius: '9999px',
  },
  filterBar: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '16px',
    flexWrap: 'wrap',
  },
  searchWrapper: {
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
    width: '360px',
  },
  searchInput: {
    width: '100%',
    padding: '10px 14px 10px 36px',
    backgroundColor: '#FFFFFF',
    border: '1px solid #E4E9F0',
    borderRadius: '8px',
    fontSize: '13.5px',
    color: '#07152B',
  },
  viewToggleWrap: {
    display: 'flex',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    border: '1px solid #E4E9F0',
    borderRadius: '8px',
    padding: '3px',
    gap: '2px',
  },
  viewToggleBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '32px',
    height: '32px',
    borderRadius: '6px',
    backgroundColor: 'transparent',
    border: 'none',
    cursor: 'pointer',
    transition: 'all 0.15s ease',
  },
  viewToggleBtnActive: {
    backgroundColor: '#F0F3F8',
    boxShadow: '0 1px 3px rgba(7, 21, 43, 0.08)',
  },
  cardsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
    gap: '20px',
  },
  productCard: {
    backgroundColor: '#FFFFFF',
    border: '1px solid #E4E9F0',
    borderRadius: '14px',
    overflow: 'hidden',
    boxShadow: '0 2px 8px rgba(7, 21, 43, 0.04)',
    display: 'flex',
    flexDirection: 'column',
  },
  cardThumbWrap: {
    position: 'relative',
    height: '180px',
    width: '100%',
    overflow: 'hidden',
  },
  cardThumb: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
  },
  cardOverlayRow: {
    position: 'absolute',
    top: '12px',
    left: '12px',
    right: '12px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  categoryBadge: {
    backgroundColor: 'rgba(7, 21, 43, 0.85)',
    backdropFilter: 'blur(6px)',
    color: '#FFFFFF',
    fontSize: '10.5px',
    fontWeight: 700,
    padding: '4px 10px',
    borderRadius: '9999px',
  },
  stockBadge: {
    backgroundColor: '#E8F7ED',
    border: '1px solid rgba(22, 128, 60, 0.25)',
    color: '#16803C',
    fontSize: '10px',
    fontWeight: 800,
    padding: '4px 8px',
    borderRadius: '9999px',
  },
  outStockBadge: {
    backgroundColor: '#FFF0F0',
    border: '1px solid rgba(214, 48, 49, 0.25)',
    color: '#D63031',
    fontSize: '10px',
    fontWeight: 800,
    padding: '4px 8px',
    borderRadius: '9999px',
  },
  cardBody: {
    padding: '16px 18px',
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
    flex: 1,
  },
  cardHeaderRow: {
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: '8px',
  },
  prodTitle: {
    fontSize: '15px',
    fontWeight: 700,
    color: '#07152B',
    margin: 0,
  },
  priceTag: {
    fontSize: '14px',
    fontWeight: 800,
    color: '#07152B',
    flexShrink: 0,
  },
  prodBlurb: {
    fontSize: '12.5px',
    color: '#475569',
    lineHeight: 1.4,
    margin: 0,
  },
  sellerRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    fontSize: '11.5px',
    color: '#5A687A',
    marginTop: 'auto',
    paddingTop: '6px',
  },
  sellerName: {
    fontWeight: 600,
    color: '#07152B',
  },
  sellerLoc: {
    color: '#8A9AA8',
  },
  cardFooter: {
    padding: '12px 18px',
    borderTop: '1px solid #EAEFF6',
    backgroundColor: '#FAFCFE',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '8px',
  },
  editBtn: {
    flex: 1,
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '6px',
    padding: '8px 14px',
    backgroundColor: '#FFFFFF',
    border: '1px solid #CBD5E1',
    borderRadius: '8px',
    fontSize: '12.5px',
    fontWeight: 700,
    color: '#07152B',
    cursor: 'pointer',
  },
  deleteBtn: {
    width: '34px',
    height: '34px',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFF5F5',
    border: '1px solid #FED7D7',
    borderRadius: '8px',
    cursor: 'pointer',
  },
  tableThumb: {
    width: '40px',
    height: '40px',
    borderRadius: '6px',
    objectFit: 'cover',
    border: '1px solid #E4E9F0',
  },
  emptyState: {
    padding: '48px',
    textAlign: 'center',
    backgroundColor: '#FFFFFF',
    border: '1px solid #E4E9F0',
    borderRadius: '12px',
    color: '#5A687A',
    fontSize: '14px',
  },
  // In-Page Dedicated Editor Styles
  editorNav: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    border: '1px solid #E4E9F0',
    borderRadius: '12px',
    padding: '16px 20px',
    boxShadow: '0 2px 8px rgba(7, 21, 43, 0.03)',
  },
  editorNavLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
  },
  backBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    padding: '8px 14px',
    backgroundColor: '#F8FAFC',
    border: '1px solid #E4E9F0',
    borderRadius: '8px',
    fontSize: '13px',
    fontWeight: 600,
    color: '#07152B',
    cursor: 'pointer',
  },
  editorBreadcrumbs: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    fontSize: '13px',
  },
  breadcrumbMuted: {
    color: '#8A9AA8',
  },
  breadcrumbSep: {
    color: '#CBD5E1',
  },
  breadcrumbCurrent: {
    fontWeight: 700,
    color: '#07152B',
  },
  editorNavActions: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
  },
  editorGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: '24px',
    alignItems: 'start',
  },
  formCard: {
    backgroundColor: '#FFFFFF',
    border: '1px solid #E4E9F0',
    borderRadius: '14px',
    padding: '24px',
    boxShadow: '0 2px 8px rgba(7, 21, 43, 0.03)',
  },
  cardSectionTitle: {
    fontSize: '18px',
    color: '#07152B',
    margin: '0 0 4px 0',
  },
  cardSectionSub: {
    fontSize: '12.5px',
    color: '#5A687A',
    margin: '0 0 18px 0',
  },
  formStack: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
  inputRow: {
    display: 'flex',
    gap: '14px',
  },
  fullInput: {
    width: '100%',
    boxSizing: 'border-box',
    padding: '10px 14px',
    backgroundColor: '#FFFFFF',
    border: '1px solid #E4E9F0',
    borderRadius: '8px',
    fontSize: '13.5px',
    color: '#07152B',
  },
  textarea: {
    width: '100%',
    boxSizing: 'border-box',
    padding: '10px 14px',
    backgroundColor: '#FFFFFF',
    border: '1px solid #E4E9F0',
    borderRadius: '8px',
    fontSize: '13.5px',
    color: '#07152B',
    fontFamily: 'inherit',
  },
  imagePreviewWrap: {
    marginTop: '8px',
    height: '140px',
    width: '100%',
    borderRadius: '8px',
    overflow: 'hidden',
    border: '1px solid #E4E9F0',
  },
  imagePreview: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
  },
  checkboxRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  checkbox: {
    width: '16px',
    height: '16px',
    cursor: 'pointer',
  },
  checkboxLabel: {
    fontSize: '13px',
    fontWeight: 600,
    color: '#07152B',
    cursor: 'pointer',
  },
  label: {
    display: 'block',
    fontSize: '12px',
    fontWeight: 700,
    color: '#07152B',
    marginBottom: '6px',
  },
  errorBox: {
    backgroundColor: '#FFF0F0',
    border: '1px solid rgba(214, 48, 49, 0.3)',
    color: '#D63031',
    padding: '12px 16px',
    borderRadius: '8px',
    fontSize: '13px',
  },
};
