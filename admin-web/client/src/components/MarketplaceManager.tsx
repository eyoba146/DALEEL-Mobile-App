import React, { useEffect, useState } from 'react';
import { adminApi } from '../api';
import { Plus, Search, Edit2, Trash2, ShoppingBag, MapPin, PackageCheck, RefreshCw } from 'lucide-react';

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

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
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
    setIsModalOpen(true);
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
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you wish to delete this artisan product?')) return;
    try {
      await adminApi.deleteProduct(id);
      loadData();
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
      setIsModalOpen(false);
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

  return (
    <div style={styles.container}>
      {/* Top Header Row */}
      <div style={styles.topRow}>
        <div>
          <h2 style={styles.sectionTitle}>Artisan Marketplace & Fulfillment</h2>
          <p style={styles.sectionDesc}>
            Curate authentic Ethiopian crafts, traditional apparel, Buna coffee ceremony sets, and manage delivery orders.
          </p>
        </div>

        <div style={styles.actionsGroup}>
          <button className="btn btn-secondary" onClick={loadData}>
            <RefreshCw size={15} color="#07152B" />
            <span>Refresh</span>
          </button>
          <button className="btn btn-primary" onClick={handleOpenCreate}>
            <Plus size={16} color="#07152B" />
            <span>Add Artisan Product</span>
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
          <ShoppingBag size={15} color={activeSubTab === 'products' ? '#07152B' : '#5A687A'} />
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
          <PackageCheck size={15} color={activeSubTab === 'orders' ? '#07152B' : '#5A687A'} />
          <span>Customer Order Inquiries</span>
          <span style={styles.tabBadge}>{orders.length}</span>
        </button>
      </div>

      {/* Product Catalog Tab */}
      {activeSubTab === 'products' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={styles.searchWrapper}>
            <Search size={16} color="#8A9AA8" style={{ position: 'absolute', left: '12px' }} />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search products by title, category, or guild..."
              style={{ width: '340px', paddingLeft: '36px' }}
            />
          </div>

          <div className="table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Product Details</th>
                  <th>Category</th>
                  <th>Unit Price</th>
                  <th>Artisan / Guild</th>
                  <th>Inventory Status</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={6} style={{ textAlign: 'center', padding: '36px', color: '#5A687A' }}>
                      Loading artisan inventory...
                    </td>
                  </tr>
                ) : filteredProducts.length === 0 ? (
                  <tr>
                    <td colSpan={6} style={{ textAlign: 'center', padding: '36px', color: '#5A687A' }}>
                      No artisan products listed.
                    </td>
                  </tr>
                ) : (
                  filteredProducts.map((prod) => (
                    <tr key={prod.id}>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <img src={prod.image} alt={prod.title} style={styles.thumbImg} />
                          <div>
                            <div style={styles.prodTitle}>{prod.title}</div>
                            <div style={styles.prodBlurb}>{prod.blurb || prod.origin || 'Addis Ababa'}</div>
                          </div>
                        </div>
                      </td>
                      <td>
                        <span className="badge badge-navy">{prod.category}</span>
                      </td>
                      <td>
                        <div style={{ fontWeight: 700, color: '#07152B', fontSize: '14px' }}>
                          {prod.price?.toLocaleString()} {prod.currency || 'ETB'}
                        </div>
                      </td>
                      <td>
                        <div style={{ fontWeight: 600, color: '#07152B', fontSize: '13px' }}>
                          {prod.sellerName}
                        </div>
                        <div style={{ fontSize: '11.5px', color: '#5A687A' }}>
                          {prod.sellerLocation}
                        </div>
                      </td>
                      <td>
                        {prod.inStock ? (
                          <span className="badge badge-success">In Stock</span>
                        ) : (
                          <span className="badge badge-error">Sold Out</span>
                        )}
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', gap: '6px' }}>
                          <button className="btn-icon" onClick={() => handleOpenEdit(prod)} title="Edit Product">
                            <Edit2 size={15} />
                          </button>
                          <button className="btn-icon" onClick={() => handleDelete(prod.id)} title="Delete Product">
                            <Trash2 size={15} color="#D63031" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Customer Orders Tab */}
      {activeSubTab === 'orders' && (
        <div className="table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Customer Details</th>
                <th>Ordered Product</th>
                <th>Qty & Value</th>
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
                          <img src={ord.product.image} alt={ord.product.title} style={styles.thumbImg} />
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

      {/* Create / Edit Modal */}
      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal-window modal-window-wide">
            <div className="modal-header">
              <h3 className="modal-title">
                {editingItem ? 'Edit Artisan Product' : 'Add New Artisan Product'}
              </h3>
              <button className="btn-icon" onClick={() => setIsModalOpen(false)}>
                ✕
              </button>
            </div>

            <form onSubmit={handleSave}>
              <div className="modal-body">
                {errorMessage && <div style={styles.errorBox}>{errorMessage}</div>}

                <div style={styles.formGrid}>
                  <div>
                    <label style={styles.label}>Product Title *</label>
                    <input
                      type="text"
                      required
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      placeholder="e.g. Royal Gonderian Silk Kemis"
                      style={{ width: '100%' }}
                    />
                  </div>

                  <div>
                    <label style={styles.label}>Category *</label>
                    <select
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                      style={{ width: '100%' }}
                    >
                      <option value="Textiles & Habesha Kemis">Textiles & Habesha Kemis</option>
                      <option value="Coffee & Buna Ceremonial">Coffee & Buna Ceremonial</option>
                      <option value="Jewelry & Silver Filigree">Jewelry & Silver Filigree</option>
                      <option value="Leathercraft & Art">Leathercraft & Art</option>
                      <option value="Spices & Specialty Foods">Spices & Specialty Foods</option>
                    </select>
                  </div>
                </div>

                <div style={styles.formGrid}>
                  <div>
                    <label style={styles.label}>Price (ETB) *</label>
                    <input
                      type="number"
                      required
                      min={1}
                      value={formData.price}
                      onChange={(e) => setFormData({ ...formData, price: Number(e.target.value) })}
                      style={{ width: '100%' }}
                    />
                  </div>

                  <div>
                    <label style={styles.label}>Currency</label>
                    <input
                      type="text"
                      value={formData.currency}
                      onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                      style={{ width: '100%' }}
                    />
                  </div>
                </div>

                <div style={styles.formGrid}>
                  <div>
                    <label style={styles.label}>Seller / Guild Name *</label>
                    <input
                      type="text"
                      required
                      value={formData.sellerName}
                      onChange={(e) => setFormData({ ...formData, sellerName: e.target.value })}
                      placeholder="e.g. Sheba Heritage Weavers Guild"
                      style={{ width: '100%' }}
                    />
                  </div>

                  <div>
                    <label style={styles.label}>Seller Location</label>
                    <input
                      type="text"
                      value={formData.sellerLocation}
                      onChange={(e) => setFormData({ ...formData, sellerLocation: e.target.value })}
                      placeholder="e.g. Shiro Meda, Addis Ababa"
                      style={{ width: '100%' }}
                    />
                  </div>
                </div>

                <div>
                  <label style={styles.label}>Product Image URL *</label>
                  <input
                    type="url"
                    required
                    value={formData.image}
                    onChange={(e) => setFormData({ ...formData, image: e.target.value })}
                    style={{ width: '100%' }}
                  />
                </div>

                <div>
                  <label style={styles.label}>Short Summary (Blurb)</label>
                  <input
                    type="text"
                    value={formData.blurb}
                    onChange={(e) => setFormData({ ...formData, blurb: e.target.value })}
                    placeholder="Handcrafted authentic Ethiopian artisan good..."
                    style={{ width: '100%' }}
                  />
                </div>

                <div style={styles.formGrid}>
                  <div>
                    <label style={styles.label}>Materials</label>
                    <input
                      type="text"
                      value={formData.materials}
                      onChange={(e) => setFormData({ ...formData, materials: e.target.value })}
                      placeholder="e.g. 100% Cotton, Silver, Clay"
                      style={{ width: '100%' }}
                    />
                  </div>
                  <div>
                    <label style={styles.label}>Origin Region</label>
                    <input
                      type="text"
                      value={formData.origin}
                      onChange={(e) => setFormData({ ...formData, origin: e.target.value })}
                      placeholder="e.g. Harar, Gonder, Addis Ababa"
                      style={{ width: '100%' }}
                    />
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <input
                    type="checkbox"
                    id="inStockCheck"
                    checked={formData.inStock}
                    onChange={(e) => setFormData({ ...formData, inStock: e.target.checked })}
                    style={{ width: '16px', height: '16px', cursor: 'pointer' }}
                  />
                  <label htmlFor="inStockCheck" style={{ fontSize: '13px', fontWeight: 600, color: '#07152B', cursor: 'pointer' }}>
                    Available In Stock for Purchase
                  </label>
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setIsModalOpen(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={isSaving}>
                  {isSaving ? 'Saving Product...' : editingItem ? 'Update Product' : 'Add Product'}
                </button>
              </div>
            </form>
          </div>
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
  searchWrapper: {
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
  },
  thumbImg: {
    width: '46px',
    height: '46px',
    borderRadius: '8px',
    objectFit: 'cover',
    border: '1px solid #E4E9F0',
  },
  prodTitle: {
    fontSize: '14px',
    fontWeight: 700,
    color: '#07152B',
  },
  prodBlurb: {
    fontSize: '12px',
    color: '#5A687A',
    marginTop: '2px',
  },
  errorBox: {
    backgroundColor: '#FFF0F0',
    border: '1px solid rgba(214, 48, 49, 0.3)',
    color: '#D63031',
    padding: '10px 14px',
    borderRadius: '8px',
    fontSize: '13px',
  },
  formGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: '14px',
  },
  label: {
    display: 'block',
    fontSize: '12px',
    fontWeight: 700,
    color: '#07152B',
    marginBottom: '6px',
  },
};
