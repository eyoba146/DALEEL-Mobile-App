import React, { useEffect, useState } from 'react';
import { adminApi } from '../api';
import { Plus, Search, Edit3, Trash2, RefreshCw, ArrowLeft, Check, DollarSign } from 'lucide-react';

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

  // Dedicated In-Page Editor State (NO POPUPS)
  const [isEditorActive, setIsEditorActive] = useState(false);
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
    setIsEditorActive(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
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
      await adminApi.deleteInvestment(id);
      loadData();
      if (editingItem?.id === id) {
        handleCloseEditor();
      }
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
      setIsEditorActive(false);
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

  // Dedicated In-Page Full Workspace Editor (NO POPUP)
  if (isEditorActive) {
    return (
      <div style={styles.container}>
        {/* Editor Top Navigation Bar */}
        <div style={styles.editorNav}>
          <div style={styles.editorNavLeft}>
            <button style={styles.backBtn} onClick={handleCloseEditor}>
              <ArrowLeft size={16} color="#07152B" />
              <span>Back to Deals</span>
            </button>
            <div style={styles.editorBreadcrumbs}>
              <span style={styles.breadcrumbMuted}>Investments</span>
              <span style={styles.breadcrumbSep}>/</span>
              <span style={styles.breadcrumbCurrent}>
                {editingItem ? `Edit: ${editingItem.title}` : 'Post New Investment Opportunity'}
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
              <span>{isSaving ? 'Saving...' : editingItem ? 'Save Deal' : 'Publish Opportunity'}</span>
            </button>
          </div>
        </div>

        {errorMessage && <div style={styles.errorBox}>{errorMessage}</div>}

        {/* 2-Column Dedicated Editor Workspace */}
        <form onSubmit={handleSave} style={styles.editorGrid}>
          {/* Left Column: Investment Terms */}
          <div style={styles.formCard}>
            <h3 style={styles.cardSectionTitle}>Investment Terms & Financials</h3>
            <p style={styles.cardSectionSub}>Target sector, minimum entry capital, projected ROI, and horizon</p>

            <div style={styles.formStack}>
              <div>
                <label style={styles.label}>Opportunity Title *</label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="e.g. Sidama Specialty Coffee Cold-Chain Logistics"
                  style={styles.fullInput}
                />
              </div>

              <div style={styles.inputRow}>
                <div style={{ flex: 1 }}>
                  <label style={styles.label}>Sector *</label>
                  <select
                    value={formData.sector}
                    onChange={(e) => setFormData({ ...formData, sector: e.target.value })}
                    style={styles.fullInput}
                  >
                    <option value="Agro-Processing & Specialty Export">Agro-Processing & Specialty Export</option>
                    <option value="Commercial Real Estate & Hospitality">Commercial Real Estate & Hospitality</option>
                    <option value="Renewable Energy & Solar Parks">Renewable Energy & Solar Parks</option>
                    <option value="Fintech & Digital Infrastructure">Fintech & Digital Infrastructure</option>
                    <option value="Pharmaceuticals & Health Tech">Pharmaceuticals & Health Tech</option>
                    <option value="Mining & Minerals">Mining & Minerals</option>
                  </select>
                </div>

                <div style={{ flex: 1 }}>
                  <label style={styles.label}>Minimum Investment (USD) *</label>
                  <input
                    type="number"
                    required
                    min={1000}
                    value={formData.minInvestment}
                    onChange={(e) => setFormData({ ...formData, minInvestment: Number(e.target.value) })}
                    style={styles.fullInput}
                  />
                </div>
              </div>

              <div style={styles.inputRow}>
                <div style={{ flex: 1 }}>
                  <label style={styles.label}>Projected Return (ROI)</label>
                  <input
                    type="text"
                    value={formData.expectedReturn}
                    onChange={(e) => setFormData({ ...formData, expectedReturn: e.target.value })}
                    placeholder="e.g. 22% Target IRR"
                    style={styles.fullInput}
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={styles.label}>Horizon / Timeline</label>
                  <input
                    type="text"
                    value={formData.timeline}
                    onChange={(e) => setFormData({ ...formData, timeline: e.target.value })}
                    placeholder="e.g. 3 - 5 Years"
                    style={styles.fullInput}
                  />
                </div>
              </div>

              <div>
                <label style={styles.label}>Location / Region *</label>
                <input
                  type="text"
                  required
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  placeholder="e.g. Hawassa Industrial Park, Sidama"
                  style={styles.fullInput}
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
                  style={styles.fullInput}
                />
              </div>

              <div>
                <label style={styles.label}>Full Prospectus Description</label>
                <textarea
                  rows={5}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Detailed business plan, feasibility metrics, and partnership terms..."
                  style={styles.textarea}
                />
              </div>
            </div>
          </div>

          {/* Right Column: Imagery & Investor Relations Contact */}
          <div style={styles.formCard}>
            <h3 style={styles.cardSectionTitle}>Prospectus Imagery & Relations</h3>
            <p style={styles.cardSectionSub}>Hero photo preview and deal officer contact details</p>

            <div style={styles.formStack}>
              <div>
                <label style={styles.label}>Hero Image URL *</label>
                <input
                  type="url"
                  required
                  value={formData.image}
                  onChange={(e) => setFormData({ ...formData, image: e.target.value })}
                  style={styles.fullInput}
                />
                {formData.image && (
                  <div style={styles.imagePreviewWrap}>
                    <img src={formData.image} alt="Preview" style={styles.imagePreview} />
                  </div>
                )}
              </div>

              <div>
                <label style={styles.label}>Deal Officer Email</label>
                <input
                  type="email"
                  value={formData.contactEmail}
                  onChange={(e) => setFormData({ ...formData, contactEmail: e.target.value })}
                  placeholder="invest@daleel.et"
                  style={styles.fullInput}
                />
              </div>

              <div>
                <label style={styles.label}>Direct Contact Phone</label>
                <input
                  type="text"
                  value={formData.contactPhone}
                  onChange={(e) => setFormData({ ...formData, contactPhone: e.target.value })}
                  placeholder="+251 11 551 7000"
                  style={styles.fullInput}
                />
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
          <h2 style={styles.sectionTitle}>Diaspora Investments & Syndicates</h2>
          <p style={styles.sectionDesc}>
            Manage high-growth Ethiopian investment opportunities, syndicates, capital projects, and review investor inquiries.
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
          <span>Active Deals</span>
          <span style={styles.tabBadge}>{investments.length}</span>
        </button>

        <button
          style={{
            ...styles.tabBtn,
            ...(activeSubTab === 'inquiries' ? styles.tabBtnActive : {}),
          }}
          onClick={() => setActiveSubTab('inquiries')}
        >
          <span>Prospectus Requests</span>
          <span style={styles.tabBadge}>{inquiries.length}</span>
        </button>
      </div>

      {/* Deals Tab View */}
      {activeSubTab === 'deals' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div style={styles.searchWrapper}>
            <Search size={16} color="#8A9AA8" style={{ position: 'absolute', left: '12px' }} />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search deals by title, sector, or region..."
              style={styles.searchInput}
            />
          </div>

          {loading ? (
            <div style={styles.emptyState}>Loading investment deals...</div>
          ) : filteredInvestments.length === 0 ? (
            <div style={styles.emptyState}>No investment opportunities found.</div>
          ) : (
            <div style={styles.cardsGrid}>
              {filteredInvestments.map((inv) => (
                <div key={inv.id} style={styles.dealCard}>
                  <div style={styles.cardThumbWrap}>
                    <img src={inv.image} alt={inv.title} style={styles.cardThumb} />
                    <div style={styles.cardOverlayRow}>
                      <span style={styles.sectorBadge}>{inv.sector}</span>
                      <span style={styles.returnBadge}>{inv.expectedReturn || 'Competitive IRR'}</span>
                    </div>
                  </div>

                  <div style={styles.cardBody}>
                    <div style={styles.cardHeaderRow}>
                      <h3 style={styles.dealTitle}>{inv.title}</h3>
                      <div style={styles.minCapitalTag}>
                        <DollarSign size={13} color="#8C6A21" style={{ display: 'inline' }} />
                        <span>${inv.minInvestment?.toLocaleString()} USD</span>
                      </div>
                    </div>

                    <p style={styles.dealBlurb}>{inv.blurb}</p>

                    <div style={styles.dealMetaRow}>
                      <span style={styles.locationText}>{inv.location}</span>
                      <span style={{ color: '#CBD5E1' }}>•</span>
                      <span style={styles.timelineText}>{inv.timeline || '3 - 5 Years'}</span>
                    </div>
                  </div>

                  <div style={styles.cardFooter}>
                    <button
                      type="button"
                      style={styles.editBtn}
                      onClick={() => handleOpenEdit(inv)}
                    >
                      <Edit3 size={13} color="#07152B" />
                      <span>Edit Deal</span>
                    </button>
                    <button
                      type="button"
                      style={styles.deleteBtn}
                      onClick={() => handleDelete(inv.id, inv.title)}
                      title="Delete Deal"
                    >
                      <Trash2 size={14} color="#C53030" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Prospectus Inquiries Tab View */}
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
  cardsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))',
    gap: '20px',
  },
  dealCard: {
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
    height: '170px',
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
  sectorBadge: {
    backgroundColor: 'rgba(7, 21, 43, 0.85)',
    backdropFilter: 'blur(6px)',
    color: '#FFFFFF',
    fontSize: '10.5px',
    fontWeight: 700,
    padding: '4px 10px',
    borderRadius: '9999px',
  },
  returnBadge: {
    backgroundColor: '#F8F4EC',
    border: '1px solid #E0C582',
    color: '#8C6A21',
    fontSize: '11px',
    fontWeight: 800,
    padding: '4px 10px',
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
  dealTitle: {
    fontSize: '16px',
    fontWeight: 700,
    color: '#07152B',
    margin: 0,
  },
  minCapitalTag: {
    fontSize: '13px',
    fontWeight: 800,
    color: '#07152B',
    backgroundColor: '#F8FAFC',
    border: '1px solid #E2E8F0',
    padding: '3px 8px',
    borderRadius: '6px',
    flexShrink: 0,
  },
  dealBlurb: {
    fontSize: '12.5px',
    color: '#475569',
    lineHeight: 1.5,
    margin: 0,
  },
  dealMetaRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    fontSize: '12px',
    marginTop: 'auto',
    paddingTop: '8px',
  },
  locationText: {
    fontWeight: 600,
    color: '#07152B',
  },
  timelineText: {
    color: '#5A687A',
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
