import React, { useEffect, useState } from 'react';
import { adminApi } from '../api';
import { MapPicker } from './MapPicker';
import { Plus, Search, Edit2, Trash2, CheckCircle, MessageSquare, Crosshair, RefreshCw } from 'lucide-react';

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

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<ServiceItem | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Form
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
    setIsModalOpen(true);
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
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Remove this service provider?')) return;
    try {
      await adminApi.deleteService(id);
      loadData();
    } catch (err: any) {
      alert(err.message || 'Failed to remove service');
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
      setIsModalOpen(false);
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
      alert(err.message || 'Failed to update status');
    }
  };

  const filteredServices = services.filter((s) =>
    s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div style={styles.container}>
      {/* Header Row */}
      <div style={styles.topRow}>
        <div>
          <h2 style={styles.sectionTitle}>Verified Services & Partner Directory</h2>
          <p style={styles.sectionDesc}>
            Manage institutional partners, legal consultancies, banking, health, and triage client inquiries.
          </p>
        </div>

        <div style={styles.actionsGroup}>
          <button className="btn btn-secondary" onClick={loadData}>
            <RefreshCw size={15} color="#07152B" />
            <span>Refresh</span>
          </button>
          <button className="btn btn-primary" onClick={handleOpenCreate}>
            <Plus size={16} color="#07152B" />
            <span>Onboard Service Partner</span>
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
          <MessageSquare size={15} color={activeSubTab === 'inquiries' ? '#07152B' : '#5A687A'} />
          <span>Client Inquiries Triage</span>
          <span style={styles.tabBadge}>{inquiries.length}</span>
        </button>
      </div>

      {/* Directory Tab View */}
      {activeSubTab === 'directory' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={styles.searchWrapper}>
            <Search size={16} color="#8A9AA8" style={{ position: 'absolute', left: '12px' }} />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Filter by partner name, category, or subcity..."
              style={{ width: '320px', paddingLeft: '36px' }}
            />
          </div>

          <div className="table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Partner Name & Subcity</th>
                  <th>Category</th>
                  <th>Verification</th>
                  <th>Direct Contact</th>
                  <th>Office Coordinates</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={6} style={{ textAlign: 'center', padding: '36px', color: '#5A687A' }}>
                      Loading verified partners...
                    </td>
                  </tr>
                ) : filteredServices.length === 0 ? (
                  <tr>
                    <td colSpan={6} style={{ textAlign: 'center', padding: '36px', color: '#5A687A' }}>
                      No service partners found.
                    </td>
                  </tr>
                ) : (
                  filteredServices.map((svc) => (
                    <tr key={svc.id}>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <img src={svc.image} alt={svc.name} style={styles.thumbImg} />
                          <div>
                            <div style={styles.partnerName}>{svc.name}</div>
                            <div style={styles.partnerSub}>{svc.address || svc.location}</div>
                          </div>
                        </div>
                      </td>
                      <td>
                        <span className="badge badge-navy">{svc.category}</span>
                      </td>
                      <td>
                        {svc.verified ? (
                          <span className="badge badge-success">
                            <CheckCircle size={12} color="#16803C" />
                            <span>VERIFIED</span>
                          </span>
                        ) : (
                          <span className="badge badge-warning">UNVERIFIED</span>
                        )}
                      </td>
                      <td>
                        <div style={{ fontSize: '12px', color: '#5A687A', display: 'flex', flexDirection: 'column', gap: '2px' }}>
                          {svc.phone && <span>{svc.phone}</span>}
                          {svc.email && <span style={{ color: '#8A9AA8' }}>{svc.email}</span>}
                        </div>
                      </td>
                      <td>
                        {svc.latitude && svc.longitude ? (
                          <div style={styles.coordBadge}>
                            <Crosshair size={12} color="#07152B" />
                            <span>
                              {svc.latitude.toFixed(4)}N, {svc.longitude.toFixed(4)}E
                            </span>
                          </div>
                        ) : (
                          <span style={{ color: '#8A9AA8', fontSize: '12px' }}>Unpinned</span>
                        )}
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', gap: '6px' }}>
                          <button className="btn-icon" onClick={() => handleOpenEdit(svc)} title="Edit Partner">
                            <Edit2 size={15} />
                          </button>
                          <button className="btn-icon" onClick={() => handleDelete(svc.id)} title="Delete Partner">
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

      {/* Inquiries Triage Tab View */}
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

      {/* Create / Edit Modal with MapPicker */}
      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal-window modal-window-wide">
            <div className="modal-header">
              <h3 className="modal-title">
                {editingItem ? 'Edit Service Partner & Office Coordinates' : 'Onboard New Verified Service Partner'}
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
                    <label style={styles.label}>Partner Business Name *</label>
                    <input
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="e.g. Ethiopian Diaspora Trust Law Firm"
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
                      <option value="Legal & Relocation">Legal & Relocation</option>
                      <option value="Banking & Diaspora Accounts">Banking & Diaspora Accounts</option>
                      <option value="Healthcare & Concierge">Healthcare & Concierge</option>
                      <option value="Real Estate & Architecture">Real Estate & Architecture</option>
                      <option value="Car Rental & Transport">Car Rental & Transport</option>
                      <option value="Logistics & Customs">Logistics & Customs</option>
                    </select>
                  </div>
                </div>

                <div style={styles.formGrid}>
                  <div>
                    <label style={styles.label}>City / Region</label>
                    <input
                      type="text"
                      value={formData.location}
                      onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                      placeholder="e.g. Addis Ababa"
                      style={{ width: '100%' }}
                    />
                  </div>
                  <div>
                    <label style={styles.label}>Office Sub-City / Street</label>
                    <input
                      type="text"
                      value={formData.subCity}
                      onChange={(e) => setFormData({ ...formData, subCity: e.target.value })}
                      placeholder="e.g. Bole Medhanealem, Atlas Hotel area"
                      style={{ width: '100%' }}
                    />
                  </div>
                </div>

                <div>
                  <label style={styles.label}>Hero Photo / Logo URL *</label>
                  <input
                    type="url"
                    required
                    value={formData.image}
                    onChange={(e) => setFormData({ ...formData, image: e.target.value })}
                    style={{ width: '100%' }}
                  />
                </div>

                <div>
                  <label style={styles.label}>Partner Summary (Blurb) *</label>
                  <input
                    type="text"
                    required
                    value={formData.blurb}
                    onChange={(e) => setFormData({ ...formData, blurb: e.target.value })}
                    placeholder="Licensed legal & property deeds notary advisory in Addis Ababa..."
                    style={{ width: '100%' }}
                  />
                </div>

                <div style={styles.formGrid}>
                  <div>
                    <label style={styles.label}>Phone Number</label>
                    <input
                      type="text"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      placeholder="+251 91 100 0000"
                      style={{ width: '100%' }}
                    />
                  </div>
                  <div>
                    <label style={styles.label}>Official Email</label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder="info@partner.et"
                      style={{ width: '100%' }}
                    />
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <input
                    type="checkbox"
                    id="verifiedCheck"
                    checked={formData.verified}
                    onChange={(e) => setFormData({ ...formData, verified: e.target.checked })}
                    style={{ width: '16px', height: '16px', cursor: 'pointer' }}
                  />
                  <label htmlFor="verifiedCheck" style={{ fontSize: '13px', fontWeight: 600, color: '#07152B', cursor: 'pointer' }}>
                    Certified DALEEL Verified Partner Badge
                  </label>
                </div>

                {/* Map Coordinator */}
                <div>
                  <label style={styles.label}>Partner Office Location on Map</label>
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

              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setIsModalOpen(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={isSaving}>
                  {isSaving ? 'Saving Partner...' : editingItem ? 'Update Partner Profile' : 'Onboard Partner'}
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
  partnerName: {
    fontSize: '14px',
    fontWeight: 700,
    color: '#07152B',
  },
  partnerSub: {
    fontSize: '12px',
    color: '#5A687A',
    marginTop: '2px',
  },
  coordBadge: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '4px',
    backgroundColor: '#F0F3F8',
    padding: '4px 8px',
    borderRadius: '6px',
    fontSize: '11px',
    fontWeight: 600,
    color: '#07152B',
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
