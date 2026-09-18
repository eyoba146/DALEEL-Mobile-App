import React, { useEffect, useState } from 'react';
import { adminApi } from '../api';
import type { AdminUser } from '../api';
import { useAdminAuth } from '../context/AuthContext';
import { Plus, Search, Trash2, ShieldCheck, Mail, Phone, RefreshCw, KeyRound, AlertCircle } from 'lucide-react';

const ROLE_OPTIONS: { value: string; label: string; desc: string }[] = [
  { value: 'SUPER_ADMIN', label: 'Super Administrator', desc: 'Full authority across all domains, coordinates, and staff' },
  { value: 'DESTINATION_MANAGER', label: 'Tourism & Heritage Lead', desc: 'Manage UNESCO attractions and interactive GIS map pins' },
  { value: 'SERVICE_MANAGER', label: 'Verified Partners Lead', desc: 'Directory curation and client inquiry triage' },
  { value: 'EVENT_MANAGER', label: 'Events Coordinator', desc: 'Summits, festivals, venue maps, and attendee RSVPs' },
  { value: 'MARKETPLACE_MANAGER', label: 'Artisan Merchant Lead', desc: 'Crafts inventory, sellers, and order inquiries' },
  { value: 'INVESTMENT_OFFICER', label: 'Investment Officer', desc: 'Capital syndicates, prospectuses, and investor leads' },
];

export const TeamManager: React.FC = () => {
  const { adminUser } = useAdminAuth();
  const [team, setTeam] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Form
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
    setIsModalOpen(true);
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
      setErrorMessage(err.message || 'Failed to remove team member');
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setErrorMessage('');

    try {
      await adminApi.createTeamMember(formData);
      setIsModalOpen(false);
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

  return (
    <div style={styles.container}>
      {/* Top Header Row */}
      <div style={styles.topRow}>
        <div>
          <h2 style={styles.sectionTitle}>Administrative Team & Role Delegation</h2>
          <p style={styles.sectionDesc}>
            Super Admin portal to assign role-based permissions, onboard specialized coordinators, and audit operational access.
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
            style={{ width: '360px', paddingLeft: '36px' }}
          />
        </div>

        <div className="table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Administrative Coordinator</th>
                <th>Assigned Role</th>
                <th>Contact Phone</th>
                <th>Authority Status</th>
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
                      <span className="badge badge-success">ACTIVE COORDINATOR</span>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      {member.id !== adminUser?.id ? (
                        <button
                          className="btn-icon"
                          onClick={() => handleDelete(member.id, member.name)}
                          title="Revoke Access"
                        >
                          <Trash2 size={15} color="#D63031" />
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

      {/* Onboard Coordinator Modal */}
      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal-window">
            <div className="modal-header">
              <h3 className="modal-title">Onboard Administrative Coordinator</h3>
              <button className="btn-icon" onClick={() => setIsModalOpen(false)}>
                ✕
              </button>
            </div>

            <form onSubmit={handleSave}>
              <div className="modal-body">
                {errorMessage && (
                  <div style={styles.errorBox}>
                    <AlertCircle size={15} />
                    <span>{errorMessage}</span>
                  </div>
                )}

                <div>
                  <label style={styles.label}>Full Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g. Rahel Tadesse"
                    style={{ width: '100%' }}
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
                    style={{ width: '100%' }}
                  />
                </div>

                <div>
                  <label style={styles.label}>Initial Master Access Key *</label>
                  <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                    <KeyRound size={16} color="#8A9AA8" style={{ position: 'absolute', left: '12px' }} />
                    <input
                      type="password"
                      required
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      placeholder="Minimum 8 characters"
                      style={{ width: '100%', paddingLeft: '38px' }}
                    />
                  </div>
                </div>

                <div>
                  <label style={styles.label}>Delegated Role *</label>
                  <select
                    value={formData.adminRole}
                    onChange={(e) => setFormData({ ...formData, adminRole: e.target.value })}
                    style={{ width: '100%' }}
                  >
                    {ROLE_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label style={styles.label}>Direct Contact Phone (Optional)</label>
                  <input
                    type="text"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="+251 91 100 0000"
                    style={{ width: '100%' }}
                  />
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setIsModalOpen(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={isSaving}>
                  {isSaving ? 'Creating Account...' : 'Authorize Coordinator'}
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
    padding: '10px 14px',
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
};
