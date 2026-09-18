import React, { useEffect, useState } from 'react';
import { adminApi } from '../api';
import { MapPicker } from './MapPicker';
import { Plus, Search, Edit2, Trash2, Crosshair, Ribbon, Star, RefreshCw } from 'lucide-react';

interface DestinationItem {
  id: string;
  name: string;
  region: string;
  blurb: string;
  description: string;
  image: string;
  elevation?: string | null;
  bestTimeToVisit?: string | null;
  unescoStatus: boolean;
  rating: number;
  latitude?: number | null;
  longitude?: number | null;
}

export const DestinationsManager: React.FC = () => {
  const [destinations, setDestinations] = useState<DestinationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRegion, setSelectedRegion] = useState('All');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<DestinationItem | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Form Fields
  const [formData, setFormData] = useState({
    name: '',
    region: 'Amhara',
    blurb: '',
    description: '',
    image: '',
    elevation: '',
    bestTimeToVisit: '',
    unescoStatus: false,
    rating: 4.9,
    latitude: 9.0105 as number | null,
    longitude: 38.7615 as number | null,
  });

  const loadDestinations = async () => {
    setLoading(true);
    try {
      const data = await adminApi.getDestinations();
      setDestinations(data);
    } catch (err: any) {
      console.error('Failed to load destinations:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDestinations();
  }, []);

  const handleOpenCreate = () => {
    setEditingItem(null);
    setFormData({
      name: '',
      region: 'Amhara',
      blurb: '',
      description: '',
      image: 'https://images.unsplash.com/photo-1523805009345-7448845a9e53?w=800',
      elevation: '2,500m (8,200 ft)',
      bestTimeToVisit: 'October to March (Dry highlands season)',
      unescoStatus: false,
      rating: 4.9,
      latitude: 12.0322,
      longitude: 39.0416,
    });
    setErrorMessage('');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (item: DestinationItem) => {
    setEditingItem(item);
    setFormData({
      name: item.name,
      region: item.region,
      blurb: item.blurb,
      description: item.description || item.blurb,
      image: item.image,
      elevation: item.elevation || '',
      bestTimeToVisit: item.bestTimeToVisit || '',
      unescoStatus: item.unescoStatus,
      rating: item.rating,
      latitude: item.latitude ?? 9.0105,
      longitude: item.longitude ?? 38.7615,
    });
    setErrorMessage('');
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to remove this heritage destination?')) return;
    try {
      await adminApi.deleteDestination(id);
      loadDestinations();
    } catch (err: any) {
      alert(err.message || 'Failed to remove destination');
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setErrorMessage('');

    try {
      if (editingItem) {
        await adminApi.updateDestination(editingItem.id, formData);
      } else {
        await adminApi.createDestination(formData);
      }
      setIsModalOpen(false);
      loadDestinations();
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to save destination');
    } finally {
      setIsSaving(false);
    }
  };

  const filtered = destinations.filter((item) => {
    const matchesSearch =
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.region.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRegion = selectedRegion === 'All' || item.region === selectedRegion;
    return matchesSearch && matchesRegion;
  });

  return (
    <div style={styles.container}>
      {/* Top Controls Row */}
      <div style={styles.topRow}>
        <div>
          <h2 style={styles.sectionTitle}>Heritage Destinations & Regional Guides</h2>
          <p style={styles.sectionDesc}>
            Manage UNESCO sites, national parks, and coordinate precise GIS map coordinates for traveler navigation.
          </p>
        </div>

        <div style={styles.actionsGroup}>
          <button className="btn btn-secondary" onClick={loadDestinations} title="Refresh catalog">
            <RefreshCw size={15} color="#07152B" />
            <span>Refresh</span>
          </button>
          <button className="btn btn-primary" onClick={handleOpenCreate}>
            <Plus size={16} color="#07152B" />
            <span>Coordinate New Destination</span>
          </button>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div style={styles.filterBar}>
        <div style={styles.searchWrapper}>
          <Search size={16} color="#8A9AA8" style={{ position: 'absolute', left: '12px' }} />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search destination by name or region..."
            style={{ width: '100%', paddingLeft: '36px' }}
          />
        </div>

        <div style={styles.regionFilterRow}>
          {['All', 'Amhara', 'Addis Ababa', 'Oromia', 'Tigray', 'Harari'].map((r) => (
            <button
              key={r}
              style={{
                ...styles.regionChip,
                ...(selectedRegion === r ? styles.regionChipActive : {}),
              }}
              onClick={() => setSelectedRegion(r)}
            >
              {r}
            </button>
          ))}
        </div>
      </div>

      {/* Destinations Table */}
      <div className="table-wrap">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Heritage Destination</th>
              <th>Region</th>
              <th>GIS Coordinates</th>
              <th>Elevation / Advisory</th>
              <th>Status</th>
              <th style={{ textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={6} style={{ textAlign: 'center', padding: '36px', color: '#5A687A' }}>
                  Loading destinations from database...
                </td>
              </tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ textAlign: 'center', padding: '36px', color: '#5A687A' }}>
                  No destinations found matching your query.
                </td>
              </tr>
            ) : (
              filtered.map((item) => (
                <tr key={item.id}>
                  <td>
                    <div style={styles.destinationCell}>
                      <img src={item.image} alt={item.name} style={styles.thumbImg} />
                      <div>
                        <div style={styles.destName}>{item.name}</div>
                        <div style={styles.destBlurb}>
                          {item.blurb.slice(0, 75)}...
                        </div>
                      </div>
                    </div>
                  </td>
                  <td>
                    <span className="badge badge-navy">{item.region}</span>
                  </td>
                  <td>
                    {item.latitude && item.longitude ? (
                      <div style={styles.coordBadge}>
                        <Crosshair size={12} color="#07152B" />
                        <span>
                          {item.latitude.toFixed(4)}N, {item.longitude.toFixed(4)}E
                        </span>
                      </div>
                    ) : (
                      <span style={{ color: '#8A9AA8', fontSize: '12px' }}>Unpinned</span>
                    )}
                  </td>
                  <td>
                    <div style={{ fontSize: '12px', color: '#5A687A' }}>
                      {item.elevation ? <strong>{item.elevation}</strong> : 'Standard elevation'}
                    </div>
                    <div style={{ fontSize: '11px', color: '#8A9AA8', marginTop: '2px' }}>
                      {item.bestTimeToVisit ? item.bestTimeToVisit.slice(0, 30) + '...' : ''}
                    </div>
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                      {item.unescoStatus && (
                        <span className="badge badge-gold" title="UNESCO World Heritage Site">
                          <Ribbon size={12} color="#8C6A21" />
                          <span>UNESCO</span>
                        </span>
                      )}
                      <span style={styles.ratingBadge}>
                        <Star size={11} color="#C59B43" fill="#C59B43" />
                        <span>{item.rating.toFixed(1)}</span>
                      </span>
                    </div>
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <div style={{ display: 'inline-flex', gap: '6px' }}>
                      <button
                        className="btn-icon"
                        onClick={() => handleOpenEdit(item)}
                        title="Edit Destination & Coordinates"
                      >
                        <Edit2 size={15} />
                      </button>
                      <button
                        className="btn-icon"
                        onClick={() => handleDelete(item.id)}
                        title="Delete Destination"
                      >
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

      {/* Create / Edit Modal with Visual Map Picker */}
      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal-window modal-window-wide">
            <div className="modal-header">
              <h3 className="modal-title">
                {editingItem ? 'Edit Heritage Destination & Map Coordinates' : 'Coordinate New Heritage Destination'}
              </h3>
              <button className="btn-icon" onClick={() => setIsModalOpen(false)}>
                ✕
              </button>
            </div>

            <form onSubmit={handleSave}>
              <div className="modal-body">
                {errorMessage && (
                  <div style={styles.errorBox}>{errorMessage}</div>
                )}

                <div style={styles.formGrid}>
                  <div>
                    <label style={styles.label}>Destination Name *</label>
                    <input
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="e.g. Lalibela Rock-Hewn Churches"
                      style={{ width: '100%' }}
                    />
                  </div>

                  <div>
                    <label style={styles.label}>Region *</label>
                    <select
                      value={formData.region}
                      onChange={(e) => setFormData({ ...formData, region: e.target.value })}
                      style={{ width: '100%' }}
                    >
                      <option value="Amhara">Amhara</option>
                      <option value="Addis Ababa">Addis Ababa</option>
                      <option value="Oromia">Oromia</option>
                      <option value="Tigray">Tigray</option>
                      <option value="Harari">Harari</option>
                      <option value="Sidama">Sidama</option>
                      <option value="Afar">Afar</option>
                      <option value="Southern Ethiopia">Southern Ethiopia</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label style={styles.label}>Hero Image URL *</label>
                  <input
                    type="url"
                    required
                    value={formData.image}
                    onChange={(e) => setFormData({ ...formData, image: e.target.value })}
                    placeholder="https://..."
                    style={{ width: '100%' }}
                  />
                </div>

                <div>
                  <label style={styles.label}>Short Blurb (Headline Summary) *</label>
                  <input
                    type="text"
                    required
                    value={formData.blurb}
                    onChange={(e) => setFormData({ ...formData, blurb: e.target.value })}
                    placeholder="12th-century engineering miracle carved from volcanic bedrock..."
                    style={{ width: '100%' }}
                  />
                </div>

                <div>
                  <label style={styles.label}>About the Heritage (Full Overview)</label>
                  <textarea
                    rows={3}
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Historical background, King Lalibela's vision, architecture, and religious significance..."
                    style={{ width: '100%', resize: 'vertical' }}
                  />
                </div>

                <div style={styles.formGrid}>
                  <div>
                    <label style={styles.label}>Elevation</label>
                    <input
                      type="text"
                      value={formData.elevation}
                      onChange={(e) => setFormData({ ...formData, elevation: e.target.value })}
                      placeholder="e.g. 2,500m (8,200 ft)"
                      style={{ width: '100%' }}
                    />
                  </div>

                  <div>
                    <label style={styles.label}>Best Time to Visit</label>
                    <input
                      type="text"
                      value={formData.bestTimeToVisit}
                      onChange={(e) => setFormData({ ...formData, bestTimeToVisit: e.target.value })}
                      placeholder="e.g. October to March"
                      style={{ width: '100%' }}
                    />
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <input
                    type="checkbox"
                    id="unescoCheck"
                    checked={formData.unescoStatus}
                    onChange={(e) => setFormData({ ...formData, unescoStatus: e.target.checked })}
                    style={{ width: '16px', height: '16px', cursor: 'pointer' }}
                  />
                  <label htmlFor="unescoCheck" style={{ fontSize: '13px', fontWeight: 600, color: '#07152B', cursor: 'pointer' }}>
                    Certified UNESCO World Heritage Site
                  </label>
                </div>

                {/* Visual Map Coordinate Coordinator Component */}
                <div>
                  <label style={styles.label}>
                    Interactive Map Pin Coordination (Click or Drag Pin to Set Exact Coordinates)
                  </label>
                  <MapPicker
                    latitude={formData.latitude}
                    longitude={formData.longitude}
                    title={formData.name || 'Destination Title'}
                    address={`${formData.name || 'Destination'}, ${formData.region}, Ethiopia`}
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
                  {isSaving ? 'Saving Destination...' : editingItem ? 'Update Destination' : 'Publish Destination'}
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
    width: '320px',
  },
  regionFilterRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    flexWrap: 'wrap',
  },
  regionChip: {
    padding: '6px 14px',
    borderRadius: '9999px',
    fontSize: '12px',
    fontWeight: 600,
    backgroundColor: '#FFFFFF',
    border: '1px solid #E4E9F0',
    color: '#5A687A',
    cursor: 'pointer',
    transition: 'all 0.15s ease',
  },
  regionChipActive: {
    backgroundColor: '#07152B',
    borderColor: '#07152B',
    color: '#FFFFFF',
  },
  destinationCell: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  thumbImg: {
    width: '54px',
    height: '54px',
    borderRadius: '8px',
    objectFit: 'cover',
    border: '1px solid #E4E9F0',
  },
  destName: {
    fontSize: '14px',
    fontWeight: 700,
    color: '#07152B',
  },
  destBlurb: {
    fontSize: '12px',
    color: '#5A687A',
    marginTop: '2px',
    maxWidth: '300px',
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
  ratingBadge: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '3px',
    fontSize: '12px',
    fontWeight: 700,
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
