import React, { useEffect, useState } from 'react';
import { adminApi } from '../api';
import { MapPicker } from './MapPicker';
import { ImageUploader } from './ImageUploader';
import {
  Plus,
  Search,
  Edit3,
  Trash2,
  CheckCircle,
  Crosshair,
  RefreshCw,
  ArrowLeft,
  Check,
  Phone,
  Mail,
  MapPin,
  LayoutGrid,
  List,
} from 'lucide-react';

interface ServiceItem {
  id: string;
  name: string;
  category: string;
  location: string;
  address?: string | null;
  verified: boolean;
  blurb: string;
  image: string;
  phone?: string | null;
  whatsapp?: string | null;
  email?: string | null;
  latitude?: number | null;
  longitude?: number | null;
}

interface ServiceInquiryItem {
  id: string;
  fullName: string;
  contactEmail: string;
  contactPhone?: string | null;
  contactWhatsapp?: string | null;
  timeframe?: string | null;
  message: string;
  status: string;
  createdAt: string;
  service: { id: string; name: string; category: string };
}

export const ServicesManager: React.FC = () => {
  const [activeSubTab, setActiveSubTab] = useState<'directory' | 'inquiries'>('directory');
  const [services, setServices] = useState<ServiceItem[]>([]);
  const [inquiries, setInquiries] = useState<ServiceInquiryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  // Dedicated In-Page Editor State (NO POPUPS)
  const [isEditorActive, setIsEditorActive] = useState(false);
  const [editingItem, setEditingItem] = useState<ServiceItem | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Form Fields
  const [formData, setFormData] = useState({
    name: '',
    category: 'Legal & Relocation',
    location: 'Addis Ababa',
    subCity: 'Bole Sub-City',
    blurb: '',
    description: '',
    image: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=800',
    verified: true,
    phone: '+251 11 662 1000',
    email: 'contact@partner.et',
    whatsapp: '+251 91 100 0000',
    latitude: 9.0105 as number | null,
    longitude: 38.7615 as number | null,
  });

  const loadData = async () => {
    setLoading(true);
    try {
      const [svcData, inqData] = await Promise.all([
        adminApi.getServices(),
        adminApi.getServiceInquiries(),
      ]);
      setServices(svcData);
      setInquiries(inqData);
    } catch (err: any) {
      console.error('Failed to load services data:', err);
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
      name: '',
      category: 'Legal & Relocation',
      location: 'Addis Ababa',
      subCity: 'Bole Sub-City',
      blurb: '',
      description: '',
      image: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=800',
      verified: true,
      phone: '+251 11 662 1000',
      email: 'contact@partner.et',
      whatsapp: '+251 91 100 0000',
      latitude: 9.0105,
      longitude: 38.7615,
    });
    setErrorMessage('');
    setIsEditorActive(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleOpenEdit = (item: ServiceItem) => {
    setEditingItem(item);
    setFormData({
      name: item.name,
      category: item.category,
      location: item.location || 'Addis Ababa',
      subCity: item.address || '',
      blurb: item.blurb,
      description: item.blurb,
      image: item.image,
      verified: item.verified,
      phone: item.phone || '',
      email: item.email || '',
      whatsapp: item.whatsapp || '',
      latitude: item.latitude ?? 9.0105,
      longitude: item.longitude ?? 38.7615,
    });
    setErrorMessage('');
    setIsEditorActive(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCloseEditor = () => {
    setIsEditorActive(false);
    setEditingItem(null);
  };

  const handleDelete = async (id: string, name: string) => {
    if (!window.confirm(`Are you sure you wish to remove "${name}"?`)) return;
    try {
      await adminApi.deleteService(id);
      loadData();
      if (editingItem?.id === id) {
        handleCloseEditor();
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to remove service');
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setErrorMessage('');

    try {
      if (editingItem) {
        await adminApi.updateService(editingItem.id, formData);
      } else {
        await adminApi.createService(formData);
      }
      setIsEditorActive(false);
      loadData();
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to save service partner');
    } finally {
      setIsSaving(false);
    }
  };

  const handleUpdateInquiryStatus = async (id: string, status: string) => {
    try {
      await adminApi.updateServiceInquiryStatus(id, status);
      loadData();
    } catch (err: any) {
      console.error('Failed to update status:', err);
    }
  };

  const filteredServices = services.filter((s) =>
    s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (s.location && s.location.toLowerCase().includes(searchTerm.toLowerCase()))
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
              <span>Back to Services</span>
            </button>
            <div style={styles.editorBreadcrumbs}>
              <span style={styles.breadcrumbMuted}>Services</span>
              <span style={styles.breadcrumbSep}>/</span>
              <span style={styles.breadcrumbCurrent}>
                {editingItem ? `Edit: ${editingItem.name}` : 'Onboard New Partner'}
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
              <span>{isSaving ? 'Saving...' : editingItem ? 'Save Partner Profile' : 'Onboard Partner'}</span>
            </button>
          </div>
        </div>

        {errorMessage && <div style={styles.errorBox}>{errorMessage}</div>}

        {/* 2-Column Dedicated Editor Workspace */}
        <form onSubmit={handleSave} style={styles.editorGrid}>
          {/* Left Column: Business & Contact Info */}
          <div style={styles.formCard}>
            <h3 style={styles.cardSectionTitle}>Partner Business Profile</h3>
            <p style={styles.cardSectionSub}>Verified credentials, category, and direct diaspora contact channels</p>

            <div style={styles.formStack}>
              <div>
                <label style={styles.label}>Business Name *</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Ethiopian Diaspora Trust Law Firm"
                  style={styles.fullInput}
                />
              </div>

              <div>
                <label style={styles.label}>Category *</label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  style={styles.fullInput}
                >
                  <option value="Legal & Relocation">Legal & Relocation</option>
                  <option value="Banking & Diaspora Accounts">Banking & Diaspora Accounts</option>
                  <option value="Healthcare & Concierge">Healthcare & Concierge</option>
                  <option value="Real Estate & Architecture">Real Estate & Architecture</option>
                  <option value="Car Rental & Transport">Car Rental & Transport</option>
                  <option value="Logistics & Customs">Logistics & Customs</option>
                </select>
              </div>

              <div style={styles.inputRow}>
                <div style={{ flex: 1 }}>
                  <label style={styles.label}>City / Region</label>
                  <input
                    type="text"
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    placeholder="e.g. Addis Ababa"
                    style={styles.fullInput}
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={styles.label}>Office Sub-City / Street</label>
                  <input
                    type="text"
                    value={formData.subCity}
                    onChange={(e) => setFormData({ ...formData, subCity: e.target.value })}
                    placeholder="e.g. Bole Medhanealem, Atlas area"
                    style={styles.fullInput}
                  />
                </div>
              </div>

              <div>
                <ImageUploader
                  value={formData.image}
                  onChange={(url) => setFormData({ ...formData, image: url })}
                  label="Partner Brand Photo / Logo"
                />
              </div>

              <div>
                <label style={styles.label}>Summary Overview *</label>
                <input
                  type="text"
                  required
                  value={formData.blurb}
                  onChange={(e) => setFormData({ ...formData, blurb: e.target.value })}
                  placeholder="Licensed legal & property deeds notary advisory in Addis Ababa..."
                  style={styles.fullInput}
                />
              </div>

              <div style={styles.inputRow}>
                <div style={{ flex: 1 }}>
                  <label style={styles.label}>Direct Phone</label>
                  <input
                    type="text"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="+251 11 662 1000"
                    style={styles.fullInput}
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={styles.label}>Official Email</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="contact@partner.et"
                    style={styles.fullInput}
                  />
                </div>
              </div>

              <div style={styles.checkboxRow}>
                <input
                  type="checkbox"
                  id="verifiedCheck"
                  checked={formData.verified}
                  onChange={(e) => setFormData({ ...formData, verified: e.target.checked })}
                  style={styles.checkbox}
                />
                <label htmlFor="verifiedCheck" style={styles.checkboxLabel}>
                  Certified DALEEL Verified Partner Badge
                </label>
              </div>
            </div>
          </div>

          {/* Right Column: Office Location Map Coordinator */}
          <div style={styles.formCard}>
            <h3 style={styles.cardSectionTitle}>Office Location Map Coordinator</h3>
            <p style={styles.cardSectionSub}>
              Pin physical office coordinates so diaspora users can navigate directly via interactive maps
            </p>

            <div style={{ marginTop: '16px' }}>
              <MapPicker
                latitude={formData.latitude}
                longitude={formData.longitude}
                title={formData.name || 'Partner Office'}
                address={`${formData.name || 'Office'}, ${formData.subCity || formData.location}`}
                onCoordinatesChange={(lat, lng) => {
                  setFormData((prev) => ({ ...prev, latitude: lat, longitude: lng }));
                }}
              />
            </div>
          </div>
        </form>
      </div>
    );
  }

  // Catalog Directory List View
  return (
    <div style={styles.container}>
      {/* Header Row */}
      <div style={styles.topRow}>
        <div>
          <h2 style={styles.sectionTitle}>Verified Services & Partner Directory</h2>
          <p style={styles.sectionDesc}>
            Manage institutional partners, legal consultancies, banking, health, and review client inquiries.
          </p>
        </div>

        <div style={styles.actionsGroup}>
          <button className="btn btn-secondary" onClick={loadData}>
            <RefreshCw size={15} color="#07152B" />
            <span>Refresh</span>
          </button>
          <button className="btn btn-primary" onClick={handleOpenCreate}>
            <Plus size={16} color="#07152B" />
            <span>Onboard Partner</span>
          </button>
        </div>
      </div>

      {/* Sub-tabs Row */}
      <div style={styles.tabsRow}>
        <button
          style={{
            ...styles.tabBtn,
            ...(activeSubTab === 'directory' ? styles.tabBtnActive : {}),
          }}
          onClick={() => setActiveSubTab('directory')}
        >
          <span>Partner Directory</span>
          <span style={styles.tabBadge}>{services.length}</span>
        </button>

        <button
          style={{
            ...styles.tabBtn,
            ...(activeSubTab === 'inquiries' ? styles.tabBtnActive : {}),
          }}
          onClick={() => setActiveSubTab('inquiries')}
        >
          <span>Client Inquiries</span>
          <span style={styles.tabBadge}>{inquiries.length}</span>
        </button>
      </div>

      {/* Directory Tab View */}
      {activeSubTab === 'directory' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div style={styles.filterBar}>
            <div style={styles.searchWrapper}>
              <Search size={16} color="#8A9AA8" style={{ position: 'absolute', left: '12px' }} />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search partner name, category, or subcity..."
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
            <div style={styles.emptyState}>Loading verified partners...</div>
          ) : filteredServices.length === 0 ? (
            <div style={styles.emptyState}>No service partners found.</div>
          ) : viewMode === 'grid' ? (
            /* Luxury Cards Grid */
            <div className="luxury-grid">
              {filteredServices.map((svc) => (
                <div key={svc.id} className="luxury-card">
                  {/* Media Banner with 16:10 Aspect Ratio, Scrim, and Badges */}
                  <div className="luxury-card-media">
                    <img src={svc.image} alt={svc.name} className="luxury-card-img" />
                    <div className="luxury-card-scrim" />

                    <div className="luxury-badge-top-left">
                      <span className="glass-pill">{svc.category}</span>
                    </div>

                    {svc.verified && (
                      <div className="luxury-badge-top-right">
                        <span className="glass-pill-light" style={{ color: '#16803C' }}>
                          <CheckCircle size={12} color="#16803C" />
                          <span>VERIFIED</span>
                        </span>
                      </div>
                    )}

                    <div className="luxury-badge-bottom-left">
                      <span className="glass-pill" style={{ textTransform: 'none', fontSize: '11px' }}>
                        <MapPin size={11} color="#DFB76C" />
                        <span>{svc.address || svc.location}</span>
                      </span>
                    </div>
                  </div>

                  {/* Card Body */}
                  <div className="luxury-card-body">
                    <h3 className="luxury-card-title">{svc.name}</h3>

                    <p className="luxury-card-blurb">{svc.blurb}</p>

                    {/* Direct Contact Channels */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', margin: '4px 0', fontSize: '12px', color: '#5A687A' }}>
                      {svc.phone && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <Phone size={12} color="#C59B43" />
                          <span>{svc.phone}</span>
                        </div>
                      )}
                      {svc.email && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <Mail size={12} color="#C59B43" />
                          <span>{svc.email}</span>
                        </div>
                      )}
                    </div>

                    <div className="luxury-card-meta">
                      {svc.latitude && svc.longitude ? (
                        <div className="luxury-coord-chip">
                          <Crosshair size={12} color="#C59B43" />
                          <span>
                            {svc.latitude.toFixed(4)}°N, {svc.longitude.toFixed(4)}°E
                          </span>
                        </div>
                      ) : (
                        <span style={{ fontSize: '11px', color: '#8A9AA8' }}>Office unpinned</span>
                      )}
                    </div>
                  </div>

                  {/* Card Action Footer */}
                  <div className="luxury-card-footer">
                    <button
                      type="button"
                      className="luxury-edit-btn"
                      onClick={() => handleOpenEdit(svc)}
                    >
                      <Edit3 size={14} color="#DFB76C" />
                      <span>Edit Partner</span>
                    </button>
                    <button
                      type="button"
                      className="luxury-icon-btn"
                      onClick={() => handleDelete(svc.id, svc.name)}
                      title="Remove Partner"
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
              {filteredServices.map((svc) => (
                <div key={svc.id} className="luxury-list-row">
                  <img src={svc.image} alt={svc.name} className="luxury-list-thumb" />

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                      <h4 style={{ fontSize: '16px', fontWeight: 700, color: '#07152B', margin: 0 }}>
                        {svc.name}
                      </h4>
                      <span className="badge badge-navy">{svc.category}</span>
                      {svc.verified && (
                        <span className="badge badge-success">
                          <CheckCircle size={11} />
                          <span>VERIFIED</span>
                        </span>
                      )}
                    </div>

                    <p style={{ fontSize: '13px', color: '#5A687A', margin: '0 0 6px 0', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {svc.blurb}
                    </p>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px', fontSize: '12px', color: '#8A9AA8' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <MapPin size={12} color="#C59B43" />
                        <span>{svc.address || svc.location}</span>
                      </span>
                      {svc.phone && (
                        <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <Phone size={12} color="#C59B43" />
                          <span>{svc.phone}</span>
                        </span>
                      )}
                      {svc.latitude && svc.longitude && (
                        <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#07152B' }}>
                          <Crosshair size={12} color="#C59B43" />
                          <span>{svc.latitude.toFixed(4)}°N, {svc.longitude.toFixed(4)}°E</span>
                        </span>
                      )}
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <button
                      type="button"
                      className="btn btn-navy"
                      style={{ padding: '8px 14px', fontSize: '12.5px' }}
                      onClick={() => handleOpenEdit(svc)}
                    >
                      <Edit3 size={13} color="#DFB76C" />
                      <span>Edit</span>
                    </button>
                    <button
                      type="button"
                      className="luxury-icon-btn"
                      onClick={() => handleDelete(svc.id, svc.name)}
                      title="Remove Partner"
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

      {/* Inquiries Tab View */}
      {activeSubTab === 'inquiries' && (
        <div className="table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Customer Name</th>
                <th>Target Partner</th>
                <th>Inquiry Message</th>
                <th>Timeframe</th>
                <th>Status</th>
                <th style={{ textAlign: 'right' }}>Update Status</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: '36px', color: '#5A687A' }}>
                    Loading inquiries...
                  </td>
                </tr>
              ) : inquiries.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: '36px', color: '#5A687A' }}>
                    No client inquiries submitted yet.
                  </td>
                </tr>
              ) : (
                inquiries.map((inq) => (
                  <tr key={inq.id}>
                    <td>
                      <div style={{ fontWeight: 700, color: '#07152B' }}>{inq.fullName}</div>
                      <div style={{ fontSize: '12px', color: '#5A687A', marginTop: '2px' }}>
                        {inq.contactEmail} • {inq.contactPhone || 'No phone'}
                      </div>
                    </td>
                    <td>
                      <span className="badge badge-navy">{inq.service?.name}</span>
                    </td>
                    <td>
                      <div style={{ fontSize: '13px', color: '#07152B', maxWidth: '340px' }}>
                        {inq.message}
                      </div>
                    </td>
                    <td>
                      <span style={{ fontSize: '12px', color: '#5A687A' }}>{inq.timeframe || 'Immediate'}</span>
                    </td>
                    <td>
                      <span
                        className={`badge ${
                          inq.status === 'completed'
                            ? 'badge-success'
                            : inq.status === 'contacted'
                            ? 'badge-gold'
                            : 'badge-warning'
                        }`}
                      >
                        {inq.status.toUpperCase()}
                      </span>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <select
                        value={inq.status}
                        onChange={(e) => handleUpdateInquiryStatus(inq.id, e.target.value)}
                        style={{ padding: '6px 10px', fontSize: '12px', borderRadius: '6px' }}
                      >
                        <option value="pending">Pending</option>
                        <option value="contacted">Contacted</option>
                        <option value="completed">Completed</option>
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
    gridTemplateColumns: 'repeat(auto-fill, minmax(380px, 1fr))',
    gap: '20px',
  },
  serviceCard: {
    backgroundColor: '#FFFFFF',
    border: '1px solid #E4E9F0',
    borderRadius: '14px',
    padding: '20px',
    boxShadow: '0 2px 8px rgba(7, 21, 43, 0.04)',
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  svcCardTop: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '14px',
  },
  svcThumb: {
    width: '56px',
    height: '56px',
    borderRadius: '10px',
    objectFit: 'cover',
    border: '1px solid #E4E9F0',
    flexShrink: 0,
  },
  svcHeaderRow: {
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: '8px',
  },
  svcName: {
    fontSize: '15px',
    fontWeight: 700,
    color: '#07152B',
    margin: 0,
  },
  verifiedChip: {
    backgroundColor: '#E8F7ED',
    border: '1px solid rgba(22, 128, 60, 0.25)',
    color: '#16803C',
    fontSize: '10px',
    fontWeight: 800,
    padding: '2px 6px',
    borderRadius: '9999px',
    display: 'inline-flex',
    alignItems: 'center',
    gap: '4px',
    flexShrink: 0,
  },
  svcBlurb: {
    fontSize: '12.5px',
    color: '#475569',
    lineHeight: 1.5,
    margin: 0,
  },
  contactDetails: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
    padding: '10px 12px',
    backgroundColor: '#F8FAFC',
    borderRadius: '8px',
    border: '1px solid #E2E8F0',
  },
  contactItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    fontSize: '12px',
    color: '#334155',
  },
  coordPill: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '4px',
    backgroundColor: '#F8FAFC',
    border: '1px solid #E4E9F0',
    padding: '4px 8px',
    borderRadius: '6px',
    fontSize: '11px',
    fontWeight: 600,
    color: '#07152B',
  },
  cardFooter: {
    marginTop: 'auto',
    paddingTop: '8px',
    borderTop: '1px solid #EAEFF6',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  editBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    padding: '6px 12px',
    backgroundColor: '#FFFFFF',
    border: '1px solid #CBD5E1',
    borderRadius: '6px',
    fontSize: '12px',
    fontWeight: 700,
    color: '#07152B',
    cursor: 'pointer',
  },
  deleteBtn: {
    width: '30px',
    height: '30px',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFF5F5',
    border: '1px solid #FED7D7',
    borderRadius: '6px',
    cursor: 'pointer',
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
