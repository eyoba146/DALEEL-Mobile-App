import React, { useEffect, useState } from 'react';
import { adminApi } from '../api';
import type { AdminUser } from '../api';
import { useAdminAuth } from '../context/AuthContext';
import { Plus, Search, Trash2, ShieldCheck, Mail, Phone, RefreshCw, KeyRound, AlertCircle, ArrowLeft, Check, UserCheck } from 'lucide-react';

const ROLE_OPTIONS: { value: string; label: string; desc: string }[] = [
  { value: 'SUPER_ADMIN', label: 'Full Administrator', desc: 'Complete management authority across all modules and staff' },
  { value: 'DESTINATION_MANAGER', label: 'Tourism & Heritage Lead', desc: 'Manage UNESCO cultural attractions and map coordinates' },
  { value: 'SERVICE_MANAGER', label: 'Services Directory Lead', desc: 'Partner directory curation and client inquiry triage' },
  { value: 'EVENT_MANAGER', label: 'Events Coordinator', desc: 'Summits, festivals, venue maps, and attendee RSVPs' },
  { value: 'MARKETPLACE_MANAGER', label: 'Marketplace Lead', desc: 'Crafts inventory, artisans, and customer order inquiries' },
  { value: 'INVESTMENT_OFFICER', label: 'Investment Officer', desc: 'Capital syndicates, prospectuses, and investor inquiries' },
];

export const TeamManager: React.FC = () => {
  const { adminUser } = useAdminAuth();
  const [team, setTeam] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  // Dedicated In-Page Editor State (NO POPUPS)
  const [isEditorActive, setIsEditorActive] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Form Fields
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    adminRole: 'SERVICE_MANAGER',
    phone: '',
  });

  const loadTeam = async () => {
    setLoading(true);
    try {
      const data = await adminApi.getTeam();
      setTeam(data);
    } catch (err: any) {
      console.error('Failed to load team:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTeam();
  }, []);

  const handleOpenCreate = () => {
    setFormData({
      name: '',
      email: '',
      password: '',
      adminRole: 'SERVICE_MANAGER',
      phone: '',
    });
    setErrorMessage('');
    setIsEditorActive(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCloseEditor = () => {
    setIsEditorActive(false);
  };

  const handleDelete = async (id: string, name: string) => {
    if (id === adminUser?.id) {
      setErrorMessage('You cannot remove your own active administrative account.');
      return;
    }
    if (!window.confirm(`Revoke administrative access for ${name}?`)) return;

    try {
      await adminApi.deleteTeamMember(id);
      loadTeam();
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to remove coordinator');
    }
  };

  const handleSave = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!formData.name.trim() || !formData.email.trim() || !formData.password.trim()) {
      setErrorMessage('Full name, email, and initial password are required.');
      return;
    }
    setIsSaving(true);
    setErrorMessage('');

    try {
      await adminApi.createTeamMember(formData);
      setIsEditorActive(false);
      loadTeam();
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to onboard coordinator');
    } finally {
      setIsSaving(false);
    }
  };

  const getRoleLabel = (role: string) => {
    return ROLE_OPTIONS.find((r) => r.value === role)?.label || role;
  };

  const filteredTeam = team.filter(
    (m) =>
      m.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.adminRole.toLowerCase().includes(searchTerm.toLowerCase())
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
              <span>Back to Team</span>
            </button>
            <div style={styles.editorBreadcrumbs}>
              <span style={styles.breadcrumbMuted}>Administrative Team</span>
              <span style={styles.breadcrumbSep}>/</span>
              <span style={styles.breadcrumbCurrent}>Onboard Coordinator</span>
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
              <span>{isSaving ? 'Authorizing...' : 'Authorize Coordinator'}</span>
            </button>
          </div>
        </div>

        {errorMessage && (
          <div style={styles.errorBox}>
            <AlertCircle size={16} />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* 2-Column Dedicated Editor Workspace */}
        <div style={styles.editorGrid}>
          {/* Left Column: Account Credentials */}
          <div style={styles.formCard}>
            <h3 style={styles.cardSectionTitle}>Coordinator Credentials</h3>
            <p style={styles.cardSectionSub}>Staff identity, official email address, and initial access key</p>

            <div style={styles.formStack}>
              <div>
                <label style={styles.label}>Full Name *</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Rahel Tadesse"
                  style={styles.fullInput}
                />
              </div>

              <div>
                <label style={styles.label}>Official Administrative Email *</label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="e.g. rahel@daleel.et"
                  style={styles.fullInput}
                />
              </div>

              <div>
                <label style={styles.label}>Initial Access Key (Password) *</label>
                <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                  <KeyRound size={16} color="#8A9AA8" style={{ position: 'absolute', left: '12px' }} />
                  <input
                    type="password"
                    required
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    placeholder="Minimum 8 characters"
                    style={{ ...styles.fullInput, paddingLeft: '38px' }}
                  />
                </div>
              </div>

              <div>
                <label style={styles.label}>Direct Contact Phone (Optional)</label>
                <input
                  type="text"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="+251 91 100 0000"
                  style={styles.fullInput}
                />
              </div>
            </div>
          </div>

          {/* Right Column: Delegated Role Area */}
          <div style={styles.formCard}>
            <h3 style={styles.cardSectionTitle}>Area of Responsibility</h3>
            <p style={styles.cardSectionSub}>Select which platform module this coordinator is authorized to manage</p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {ROLE_OPTIONS.map((opt) => {
                const isSelected = formData.adminRole === opt.value;
                return (
                  <div
                    key={opt.value}
                    style={{
                      ...styles.roleSelectCard,
                      ...(isSelected ? styles.roleSelectCardActive : {}),
                    }}
                    onClick={() => setFormData({ ...formData, adminRole: opt.value })}
                  >
                    <div style={styles.roleSelectHeader}>
                      <div style={styles.radioDotWrap}>
                        <div
                          style={{
                            ...styles.radioDot,
                            ...(isSelected ? styles.radioDotActive : {}),
                          }}
                        />
                      </div>
                      <span style={styles.roleOptionTitle}>{opt.label}</span>
                    </div>
                    <p style={styles.roleOptionDesc}>{opt.desc}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Catalog Directory List View
  return (
    <div style={styles.container}>
      {/* Top Header Row */}
      <div style={styles.topRow}>
        <div>
          <h2 style={styles.sectionTitle}>Administrative Team & Staff</h2>
          <p style={styles.sectionDesc}>
            Manage authorized platform coordinators, delegate management areas, and maintain operational staff.
          </p>
        </div>

        <div style={styles.actionsGroup}>
          <button className="btn btn-secondary" onClick={loadTeam}>
            <RefreshCw size={15} color="#07152B" />
            <span>Refresh</span>
          </button>
          <button className="btn btn-primary" onClick={handleOpenCreate}>
            <Plus size={16} color="#07152B" />
            <span>Onboard Coordinator</span>
          </button>
        </div>
      </div>

      {/* Role Delegation Guide Cards */}
      <div style={styles.roleGuideGrid}>
        {ROLE_OPTIONS.map((opt) => (
          <div key={opt.value} style={styles.roleCard}>
            <div style={styles.roleCardHeader}>
              <ShieldCheck size={16} color="#DFB76C" />
              <span style={styles.roleCardTitle}>{opt.label}</span>
            </div>
            <div style={styles.roleCardDesc}>{opt.desc}</div>
          </div>
        ))}
      </div>

      {/* Search & Team Table */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div style={styles.searchWrapper}>
          <Search size={16} color="#8A9AA8" style={{ position: 'absolute', left: '12px' }} />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search staff by coordinator name, email, or role..."
            style={styles.searchInput}
          />
        </div>

        <div className="table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Administrative Coordinator</th>
                <th>Assigned Responsibility</th>
                <th>Contact Phone</th>
                <th>Status</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={5} style={{ textAlign: 'center', padding: '36px', color: '#5A687A' }}>
                    Loading administrative team...
                  </td>
                </tr>
              ) : filteredTeam.length === 0 ? (
                <tr>
                  <td colSpan={5} style={{ textAlign: 'center', padding: '36px', color: '#5A687A' }}>
                    No administrative team members found.
                  </td>
                </tr>
              ) : (
                filteredTeam.map((member) => (
                  <tr key={member.id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={styles.avatarCircle}>
                          {member.name?.charAt(0).toUpperCase() || 'A'}
                        </div>
                        <div>
                          <div style={styles.memberName}>{member.name}</div>
                          <div style={styles.memberEmail}>
                            <Mail size={12} color="#8A9AA8" style={{ display: 'inline', marginRight: '4px' }} />
                            <span>{member.email}</span>
                          </div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className="badge badge-gold">{getRoleLabel(member.adminRole)}</span>
                    </td>
                    <td>
                      <div style={{ fontSize: '13px', color: '#07152B' }}>
                        {member.phone ? (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <Phone size={12} color="#8A9AA8" />
                            <span>{member.phone}</span>
                          </div>
                        ) : (
                          <span style={{ color: '#8A9AA8' }}>Unspecified</span>
                        )}
                      </div>
                    </td>
                    <td>
                      <span className="badge badge-success">
                        <UserCheck size={12} color="#16803C" />
                        <span>Active</span>
                      </span>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      {member.id !== adminUser?.id ? (
                        <button
                          className="btn-icon"
                          onClick={() => handleDelete(member.id, member.name)}
                          title="Revoke Access"
                        >
                          <Trash2 size={15} color="#C53030" />
                        </button>
                      ) : (
                        <span style={{ fontSize: '11.5px', color: '#8A9AA8', fontStyle: 'italic' }}>
                          Current Session
                        </span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
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
  roleGuideGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: '12px',
  },
  roleCard: {
    backgroundColor: '#FFFFFF',
    border: '1px solid #E4E9F0',
    borderRadius: '10px',
    padding: '14px',
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
    boxShadow: '0 1px 3px rgba(7, 21, 43, 0.04)',
  },
  roleCardHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  roleCardTitle: {
    fontSize: '13px',
    fontWeight: 700,
    color: '#07152B',
  },
  roleCardDesc: {
    fontSize: '11.5px',
    color: '#5A687A',
    lineHeight: 1.4,
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
  avatarCircle: {
    width: '38px',
    height: '38px',
    borderRadius: '50%',
    backgroundColor: '#07152B',
    color: '#DFB76C',
    fontWeight: 800,
    fontSize: '15px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    border: '1px solid #DFB76C',
    flexShrink: 0,
  },
  memberName: {
    fontSize: '14px',
    fontWeight: 700,
    color: '#07152B',
  },
  memberEmail: {
    fontSize: '12px',
    color: '#5A687A',
    marginTop: '1px',
    display: 'flex',
    alignItems: 'center',
  },
  errorBox: {
    backgroundColor: '#FFF0F0',
    border: '1px solid rgba(214, 48, 49, 0.3)',
    color: '#D63031',
    padding: '12px 16px',
    borderRadius: '8px',
    fontSize: '13px',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  label: {
    display: 'block',
    fontSize: '12px',
    fontWeight: 700,
    color: '#07152B',
    marginBottom: '6px',
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
  roleSelectCard: {
    padding: '14px',
    borderRadius: '10px',
    border: '1px solid #E4E9F0',
    backgroundColor: '#FFFFFF',
    cursor: 'pointer',
    transition: 'all 0.15s ease',
  },
  roleSelectCardActive: {
    borderColor: '#DFB76C',
    backgroundColor: '#F8F4EC',
    boxShadow: '0 2px 8px rgba(223, 183, 108, 0.18)',
  },
  roleSelectHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
  },
  radioDotWrap: {
    width: '16px',
    height: '16px',
    borderRadius: '50%',
    border: '2px solid #CBD5E1',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioDot: {
    width: '8px',
    height: '8px',
    borderRadius: '50%',
    backgroundColor: 'transparent',
  },
  radioDotActive: {
    backgroundColor: '#8C6A21',
  },
  roleOptionTitle: {
    fontSize: '13.5px',
    fontWeight: 700,
    color: '#07152B',
  },
  roleOptionDesc: {
    fontSize: '12px',
    color: '#5A687A',
    margin: '4px 0 0 26px',
  },
};
