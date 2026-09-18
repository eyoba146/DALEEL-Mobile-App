import React, { useEffect, useState } from 'react';
import { adminApi } from '../api';
import { Plus, Search, Edit2, Trash2, TrendingUp, FileText, RefreshCw } from 'lucide-react';

interface InvestmentItem {
  id: string;
  title: string;
  sector: string;
  location: string;
  minInvestment: number;
  blurb: string;
  image: string;
  description?: string | null;
  expectedReturn?: string | null;
  timeline?: string | null;
  contactEmail?: string | null;
  contactPhone?: string | null;
}

interface InvestmentInquiryItem {
  id: string;
  fullName: string;
  contactEmail: string;
  contactPhone?: string | null;
  investmentAmount?: string | null;
  message: string;
  status: string;
  createdAt: string;
  opportunity: {
    id: string;
    title: string;
    sector: string;
  };
}

export const InvestmentsManager: React.FC = () => {
  const [activeSubTab, setActiveSubTab] = useState<'deals' | 'inquiries'>('deals');
  const [investments, setInvestments] = useState<InvestmentItem[]>([]);
  const [inquiries, setInquiries] = useState<InvestmentInquiryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<InvestmentItem | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Form Fields
  const [formData, setFormData] = useState({
    title: '',
    sector: 'Agro-Processing & Specialty Export',
    location: 'Hawassa Industrial Park, Sidama',
    minInvestment: 25000,
    blurb: 'Export-grade avocado oil processing plant with guaranteed European offtake agreements.',
    image: 'https://images.unsplash.com/photo-1500937386664-56d1dfef3854?w=800',
    description: 'Joint venture opportunity with Ethiopian agribusiness pioneers. Tax holidays and capital repatriation support.',
    expectedReturn: '22% Target IRR',
    timeline: '3 - 5 Years',
    contactEmail: 'invest@daleel.et',
    contactPhone: '+251 11 551 7000',
  });

  const loadData = async () => {
    setLoading(true);
    try {
      const [invData, inqData] = await Promise.all([
        adminApi.getInvestments(),
        adminApi.getInvestmentInquiries(),
      ]);
      setInvestments(invData);
      setInquiries(inqData);
    } catch (err: any) {
      console.error('Failed to load investments data:', err);
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
      sector: 'Agro-Processing & Specialty Export',
      location: 'Hawassa Industrial Park, Sidama',
      minInvestment: 25000,
      blurb: 'Export-grade avocado oil processing plant with guaranteed European offtake agreements.',
      image: 'https://images.unsplash.com/photo-1500937386664-56d1dfef3854?w=800',
      description: 'Joint venture opportunity with Ethiopian agribusiness pioneers. Tax holidays and capital repatriation support.',
      expectedReturn: '22% Target IRR',
      timeline: '3 - 5 Years',
      contactEmail: 'invest@daleel.et',
      contactPhone: '+251 11 551 7000',
    });
    setErrorMessage('');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (item: InvestmentItem) => {
    setEditingItem(item);
    setFormData({
      title: item.title,
      sector: item.sector,
      location: item.location,
      minInvestment: item.minInvestment,
      blurb: item.blurb,
      image: item.image,
      description: item.description || '',
      expectedReturn: item.expectedReturn || '',
      timeline: item.timeline || '',
      contactEmail: item.contactEmail || '',
      contactPhone: item.contactPhone || '',
    });
    setErrorMessage('');
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you wish to remove this investment opportunity?')) return;
    try {
      await adminApi.deleteInvestment(id);
      loadData();
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to delete investment deal');
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setErrorMessage('');

    try {
      if (editingItem) {
        await adminApi.updateInvestment(editingItem.id, formData);
      } else {
        await adminApi.createInvestment(formData);
      }
      setIsModalOpen(false);
      loadData();
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to save investment deal');
    } finally {
      setIsSaving(false);
    }
  };

  const handleUpdateInquiryStatus = async (id: string, status: string) => {
    try {
      await adminApi.updateInvestmentInquiryStatus(id, status);
      loadData();
    } catch (err: any) {
      console.error('Failed to update inquiry status:', err);
    }
  };

  const filteredInvestments = investments.filter(
    (item) =>
      item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.sector.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.location.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div style={styles.container}>
      {/* Top Header Row */}
      <div style={styles.topRow}>
        <div>
          <h2 style={styles.sectionTitle}>Diaspora Investments & Syndicates</h2>
          <p style={styles.sectionDesc}>
            Manage high-growth Ethiopian investment opportunities, syndicates, capital projects, and review investor prospectus inquiries.
          </p>
        </div>

        <div style={styles.actionsGroup}>
          <button className="btn btn-secondary" onClick={loadData}>
            <RefreshCw size={15} color="#07152B" />
            <span>Refresh</span>
          </button>
          <button className="btn btn-primary" onClick={handleOpenCreate}>
            <Plus size={16} color="#07152B" />
            <span>Post Opportunity</span>
          </button>
        </div>
      </div>

      {/* Sub-tabs Row */}
      <div style={styles.tabsRow}>
        <button
          style={{
            ...styles.tabBtn,
            ...(activeSubTab === 'deals' ? styles.tabBtnActive : {}),
          }}
          onClick={() => setActiveSubTab('deals')}
        >
          <TrendingUp size={15} color={activeSubTab === 'deals' ? '#07152B' : '#5A687A'} />
          <span>Active Investment Deals</span>
          <span style={styles.tabBadge}>{investments.length}</span>
        </button>

        <button
          style={{
            ...styles.tabBtn,
            ...(activeSubTab === 'inquiries' ? styles.tabBtnActive : {}),
          }}
          onClick={() => setActiveSubTab('inquiries')}
        >
          <FileText size={15} color={activeSubTab === 'inquiries' ? '#07152B' : '#5A687A'} />
          <span>Investor Prospectus Requests</span>
          <span style={styles.tabBadge}>{inquiries.length}</span>
        </button>
      </div>

      {/* Deals Catalog Tab */}
      {activeSubTab === 'deals' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={styles.searchWrapper}>
            <Search size={16} color="#8A9AA8" style={{ position: 'absolute', left: '12px' }} />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Filter by deal title, sector, or region..."
              style={{ width: '340px', paddingLeft: '36px' }}
            />
          </div>

          <div className="table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Deal Title & Location</th>
                  <th>Sector</th>
                  <th>Minimum Entry</th>
                  <th>Projected ROI</th>
                  <th>Horizon</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={6} style={{ textAlign: 'center', padding: '36px', color: '#5A687A' }}>
                      Loading investment opportunities...
                    </td>
                  </tr>
                ) : filteredInvestments.length === 0 ? (
                  <tr>
                    <td colSpan={6} style={{ textAlign: 'center', padding: '36px', color: '#5A687A' }}>
                      No investment opportunities found.
                    </td>
                  </tr>
                ) : (
                  filteredInvestments.map((inv) => (
                    <tr key={inv.id}>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <img src={inv.image} alt={inv.title} style={styles.thumbImg} />
                          <div>
                            <div style={styles.dealTitle}>{inv.title}</div>
                            <div style={styles.dealSub}>{inv.location}</div>
                          </div>
                        </div>
                      </td>
                      <td>
                        <span className="badge badge-navy">{inv.sector}</span>
                      </td>
                      <td>
                        <div style={{ fontWeight: 700, color: '#07152B', fontSize: '14px' }}>
                          ${inv.minInvestment?.toLocaleString()} USD
                        </div>
                      </td>
                      <td>
                        <span className="badge badge-gold">
                          {inv.expectedReturn || 'Competitive IRR'}
                        </span>
                      </td>
                      <td>
                        <span style={{ fontSize: '12.5px', color: '#5A687A' }}>
                          {inv.timeline || '3 - 5 Years'}
                        </span>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', gap: '6px' }}>
                          <button className="btn-icon" onClick={() => handleOpenEdit(inv)} title="Edit Deal">
                            <Edit2 size={15} />
                          </button>
                          <button className="btn-icon" onClick={() => handleDelete(inv.id)} title="Delete Deal">
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

      {/* Investor Prospectus Requests Tab */}
      {activeSubTab === 'inquiries' && (
        <div className="table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Prospective Investor</th>
                <th>Target Opportunity</th>
                <th>Intended Capital</th>
                <th>Investor Message</th>
                <th>Status</th>
                <th style={{ textAlign: 'right' }}>Update Status</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: '36px', color: '#5A687A' }}>
                    Loading investor inquiries...
                  </td>
                </tr>
              ) : inquiries.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: '36px', color: '#5A687A' }}>
                    No prospectus requests received yet.
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
                      <div style={{ fontWeight: 600, color: '#07152B', fontSize: '13px' }}>
                        {inq.opportunity?.title}
                      </div>
                      <span className="badge badge-navy" style={{ marginTop: '4px' }}>
                        {inq.opportunity?.sector}
                      </span>
                    </td>
                    <td>
                      <div style={{ fontWeight: 700, color: '#8C6A21', fontSize: '13.5px' }}>
                        {inq.investmentAmount || 'Not specified'}
                      </div>
                    </td>
                    <td>
                      <div style={{ fontSize: '12.5px', color: '#07152B', maxWidth: '320px' }}>
                        {inq.message}
                      </div>
                    </td>
                    <td>
                      <span
                        className={`badge ${
                          inq.status === 'completed'
                            ? 'badge-success'
                            : inq.status === 'contacted'
                            ? 'badge-gold'
                            : inq.status === 'closed'
                            ? 'badge-navy'
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
                        <option value="completed">Term Sheet Sent</option>
                        <option value="closed">Closed</option>
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
                {editingItem ? 'Edit Investment Opportunity' : 'Post New Investment Opportunity'}
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
                    <label style={styles.label}>Opportunity Title *</label>
                    <input
                      type="text"
                      required
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      placeholder="e.g. Sidama Specialty Coffee Cold-Chain Logistics"
                      style={{ width: '100%' }}
                    />
                  </div>

                  <div>
                    <label style={styles.label}>Sector *</label>
                    <select
                      value={formData.sector}
                      onChange={(e) => setFormData({ ...formData, sector: e.target.value })}
                      style={{ width: '100%' }}
                    >
                      <option value="Agro-Processing & Specialty Export">Agro-Processing & Specialty Export</option>
                      <option value="Commercial Real Estate & Hospitality">Commercial Real Estate & Hospitality</option>
                      <option value="Renewable Energy & Solar Parks">Renewable Energy & Solar Parks</option>
                      <option value="Fintech & Digital Infrastructure">Fintech & Digital Infrastructure</option>
                      <option value="Pharmaceuticals & Health Tech">Pharmaceuticals & Health Tech</option>
                      <option value="Mining & Precious Minerals">Mining & Precious Minerals</option>
                    </select>
                  </div>
                </div>

                <div style={styles.formGrid}>
                  <div>
                    <label style={styles.label}>Minimum Investment (USD) *</label>
                    <input
                      type="number"
                      required
                      min={1000}
                      value={formData.minInvestment}
                      onChange={(e) => setFormData({ ...formData, minInvestment: Number(e.target.value) })}
                      style={{ width: '100%' }}
                    />
                  </div>

                  <div>
                    <label style={styles.label}>Project Location / Region *</label>
                    <input
                      type="text"
                      required
                      value={formData.location}
                      onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                      placeholder="e.g. Hawassa Industrial Park, Sidama"
                      style={{ width: '100%' }}
                    />
                  </div>
                </div>

                <div style={styles.formGrid}>
                  <div>
                    <label style={styles.label}>Projected Return (ROI)</label>
                    <input
                      type="text"
                      value={formData.expectedReturn}
                      onChange={(e) => setFormData({ ...formData, expectedReturn: e.target.value })}
                      placeholder="e.g. 22% Target IRR"
                      style={{ width: '100%' }}
                    />
                  </div>
                  <div>
                    <label style={styles.label}>Investment Horizon</label>
                    <input
                      type="text"
                      value={formData.timeline}
                      onChange={(e) => setFormData({ ...formData, timeline: e.target.value })}
                      placeholder="e.g. 3 - 5 Years"
                      style={{ width: '100%' }}
                    />
                  </div>
                </div>

                <div>
                  <label style={styles.label}>Prospectus Image URL *</label>
                  <input
                    type="url"
                    required
                    value={formData.image}
                    onChange={(e) => setFormData({ ...formData, image: e.target.value })}
                    style={{ width: '100%' }}
                  />
                </div>

                <div>
                  <label style={styles.label}>Executive Summary (Blurb) *</label>
                  <input
                    type="text"
                    required
                    value={formData.blurb}
                    onChange={(e) => setFormData({ ...formData, blurb: e.target.value })}
                    placeholder="High-growth agro-processing export venture..."
                    style={{ width: '100%' }}
                  />
                </div>

                <div style={styles.formGrid}>
                  <div>
                    <label style={styles.label}>Contact Email</label>
                    <input
                      type="email"
                      value={formData.contactEmail}
                      onChange={(e) => setFormData({ ...formData, contactEmail: e.target.value })}
                      placeholder="invest@daleel.et"
                      style={{ width: '100%' }}
                    />
                  </div>
                  <div>
                    <label style={styles.label}>Contact Phone</label>
                    <input
                      type="text"
                      value={formData.contactPhone}
                      onChange={(e) => setFormData({ ...formData, contactPhone: e.target.value })}
                      placeholder="+251 11 551 7000"
                      style={{ width: '100%' }}
                    />
                  </div>
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setIsModalOpen(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={isSaving}>
                  {isSaving ? 'Saving Deal...' : editingItem ? 'Update Deal' : 'Publish Opportunity'}
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
  dealTitle: {
    fontSize: '14px',
    fontWeight: 700,
    color: '#07152B',
  },
  dealSub: {
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
