import React, { useEffect, useState } from 'react';
import { adminApi } from '../api';
import { MapPicker } from './MapPicker';
import { ImageUploader } from './ImageUploader';
import {
  Plus,
  Search,
  Edit3,
  Trash2,
  Crosshair,
  Award,
  Star,
  ArrowLeft,
  Check,
  RefreshCw,
  LayoutGrid,
  List,
  MapPin,
  Mountain,
  Compass,
} from 'lucide-react';

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

const REGIONS = ['All', 'Amhara', 'Oromia', 'Tigray', 'SNNPR', 'Afar', 'Harari', 'Addis Ababa'];

export const DestinationsManager: React.FC = () => {
  const [destinations, setDestinations] = useState<DestinationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRegion, setSelectedRegion] = useState('All');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  // Dedicated In-Page Editor State (NO POPUPS)
  const [isEditorActive, setIsEditorActive] = useState(false);
  const [editingItem, setEditingItem] = useState<DestinationItem | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Form Fields
  const [formData, setFormData] = useState({
    name: '',
    region: 'Amhara',
    blurb: '',
    description: '',
    image: 'https://images.unsplash.com/photo-1523805009345-7448845a9e53?w=800',
    elevation: '2,500m (8,200 ft)',
    bestTimeToVisit: 'October to March (Dry highlands season)',
    unescoStatus: false,
    rating: 4.9,
    latitude: 12.0322 as number | null,
    longitude: 39.0416 as number | null,
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
    setIsEditorActive(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
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
      rating: item.rating || 4.9,
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
    if (!window.confirm(`Are you sure you wish to delete "${name}"?`)) return;
    try {
      await adminApi.deleteDestination(id);
      loadDestinations();
      if (editingItem?.id === id) {
        handleCloseEditor();
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to remove destination');
    }
  };

  const handleSave = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!formData.name.trim()) {
      setErrorMessage('Destination name is required.');
      return;
    }
    if (!formData.blurb.trim()) {
      setErrorMessage('A short summary blurb is required.');
      return;
    }

    setIsSaving(true);
    setErrorMessage('');

    try {
      if (editingItem) {
        await adminApi.updateDestination(editingItem.id, formData);
      } else {
        await adminApi.createDestination(formData);
      }
      setIsEditorActive(false);
      loadDestinations();
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to save destination');
    } finally {
      setIsSaving(false);
    }
  };

  const filtered = destinations.filter((item) => {
    const term = searchTerm.toLowerCase().trim();
    const matchesSearch =
      !term ||
      item.name.toLowerCase().includes(term) ||
      item.region.toLowerCase().includes(term) ||
      item.blurb.toLowerCase().includes(term) ||
      (item.description && item.description.toLowerCase().includes(term)) ||
      (item.elevation && item.elevation.toLowerCase().includes(term));
    const matchesRegion = selectedRegion === 'All' || item.region === selectedRegion;
    return matchesSearch && matchesRegion;
  });

  // Dedicated Full-Page In-Place Editor View (NO POPUP)
  if (isEditorActive) {
    return (
      <div style={styles.container}>
        {/* Editor Top Navigation Bar */}
        <div style={styles.editorNav}>
          <div style={styles.editorNavLeft}>
            <button style={styles.backBtn} onClick={handleCloseEditor}>
              <ArrowLeft size={16} color="#07152B" />
              <span>Back to Destinations</span>
            </button>
            <div style={styles.editorBreadcrumbs}>
              <span style={styles.breadcrumbMuted}>Destinations</span>
              <span style={styles.breadcrumbSep}>/</span>
              <span style={styles.breadcrumbCurrent}>
                {editingItem ? `Edit: ${editingItem.name}` : 'New Destination'}
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
              <span>{isSaving ? 'Saving Changes...' : editingItem ? 'Save Destination' : 'Publish Destination'}</span>
            </button>
          </div>
        </div>

        {errorMessage && <div style={styles.errorBox}>{errorMessage}</div>}

        {/* 2-Column Dedicated Editor Workspace */}
        <div style={styles.editorGrid}>
          {/* Left Column: Core Destination Information */}
          <div style={styles.formCard}>
            <h3 style={styles.cardSectionTitle}>Destination Information</h3>
            <p style={styles.cardSectionSub}>Core details displayed to users in the explore catalog</p>

            <div style={styles.formStack}>
              <div>
                <label style={styles.label}>Destination Name *</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Lalibela Rock-Hewn Churches"
                  style={styles.fullInput}
                />
              </div>

              <div style={styles.inputRow}>
                <div style={{ flex: 1 }}>
                  <label style={styles.label}>Region *</label>
                  <select
                    value={formData.region}
                    onChange={(e) => setFormData({ ...formData, region: e.target.value })}
                    style={styles.fullInput}
                  >
                    {REGIONS.filter((r) => r !== 'All').map((r) => (
                      <option key={r} value={r}>
                        {r}
                      </option>
                    ))}
                  </select>
                </div>

                <div style={{ flex: 1 }}>
                  <label style={styles.label}>Rating (1.0 to 5.0)</label>
                  <input
                    type="number"
                    step="0.1"
                    min="1"
                    max="5"
                    value={formData.rating}
                    onChange={(e) => setFormData({ ...formData, rating: parseFloat(e.target.value) })}
                    style={styles.fullInput}
                  />
                </div>
              </div>

              {/* Advanced Image Uploader (File upload, Camera capture, or URL) */}
              <div>
                <ImageUploader
                  value={formData.image}
                  onChange={(url) => setFormData({ ...formData, image: url })}
                  label="Destination Photo"
                />
              </div>

              <div style={styles.inputRow}>
                <div style={{ flex: 1 }}>
                  <label style={styles.label}>Elevation (e.g. 2,500m)</label>
                  <input
                    type="text"
                    value={formData.elevation}
                    onChange={(e) => setFormData({ ...formData, elevation: e.target.value })}
                    placeholder="e.g. 2,500m (8,200 ft)"
                    style={styles.fullInput}
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={styles.label}>Best Time to Visit</label>
                  <input
                    type="text"
                    value={formData.bestTimeToVisit}
                    onChange={(e) => setFormData({ ...formData, bestTimeToVisit: e.target.value })}
                    placeholder="e.g. October to March"
                    style={styles.fullInput}
                  />
                </div>
              </div>

              <div style={styles.checkboxRow}>
                <input
                  type="checkbox"
                  id="unescoCheck"
                  checked={formData.unescoStatus}
                  onChange={(e) => setFormData({ ...formData, unescoStatus: e.target.checked })}
                  style={styles.checkbox}
                />
                <label htmlFor="unescoCheck" style={styles.checkboxLabel}>
                  Designated UNESCO World Heritage Site
                </label>
              </div>

              <div>
                <label style={styles.label}>Summary Blurb *</label>
                <input
                  type="text"
                  required
                  value={formData.blurb}
                  onChange={(e) => setFormData({ ...formData, blurb: e.target.value })}
                  placeholder="Eleventh-century monolithic rock-cut churches..."
                  style={styles.fullInput}
                />
              </div>

              <div>
                <label style={styles.label}>Historical & Cultural Description</label>
                <textarea
                  rows={5}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Comprehensive guide detailing historical significance..."
                  style={styles.textarea}
                />
              </div>
            </div>
          </div>

          {/* Right Column: Interactive GIS Map Coordinator */}
          <div style={styles.formCard}>
            <h3 style={styles.cardSectionTitle}>Interactive Map Coordinator</h3>
            <p style={styles.cardSectionSub}>
              Search for landmarks or click anywhere to coordinate real-time GPS coordinates
            </p>

            <div style={{ marginTop: '16px' }}>
              <MapPicker
                latitude={formData.latitude}
                longitude={formData.longitude}
                title={formData.name || 'Destination'}
                address={`${formData.name || 'Site'}, ${formData.region}`}
                onCoordinatesChange={(lat, lng) => {
                  setFormData((prev) => ({ ...prev, latitude: lat, longitude: lng }));
                }}
              />
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
          <h2 style={styles.sectionTitle}>Heritage Destinations & Tourism</h2>
          <p style={styles.sectionDesc}>
            Manage cultural attractions, UNESCO heritage sites, regional landmarks, and interactive map pins.
          </p>
        </div>

        <div style={styles.actionsGroup}>
          <button className="btn btn-secondary" onClick={loadDestinations}>
            <RefreshCw size={15} color="#07152B" />
            <span>Refresh</span>
          </button>
          <button className="btn btn-primary" onClick={handleOpenCreate}>
            <Plus size={16} color="#07152B" />
            <span>Add Destination</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar with View Switcher */}
      <div style={styles.filterBar}>
        <div style={styles.searchWrapper}>
          <Search size={16} color="#8A9AA8" style={{ position: 'absolute', left: '12px' }} />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by destination name, region, or history..."
            style={styles.searchInput}
          />
        </div>

        <div style={styles.filterActionsRight}>
          <div style={styles.regionFilterRow}>
            {REGIONS.map((region) => (
              <button
                key={region}
                style={{
                  ...styles.regionChip,
                  ...(selectedRegion === region ? styles.regionChipActive : {}),
                }}
                onClick={() => setSelectedRegion(region)}
              >
                {region}
              </button>
            ))}
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
      </div>

      {/* Empty State */}
      {loading ? (
        <div style={styles.emptyState}>Loading destinations catalog...</div>
      ) : filtered.length === 0 ? (
        <div style={styles.emptyState}>No destinations match your search or filter criteria.</div>
      ) : viewMode === 'grid' ? (
        /* Editorial Luxury Destination Cards Grid */
        <div className="editorial-grid">
          {filtered.map((item) => (
            <div key={item.id} className="editorial-card">
              {/* Media Wrap with Clean Aspect, Gentle Top Vignette, and Elegant Badges */}
              <div className="editorial-card-media">
                <img src={item.image} alt={item.name} className="editorial-card-img" />
                <div className="editorial-card-top-scrim" />

                {/* Top-Left: Primary Distinction (UNESCO Heritage or Region) */}
                <div className="editorial-badge-top-left">
                  {item.unescoStatus ? (
                    <span className="editorial-badge-unesco">
                      <Award size={12} color="#DFB76C" />
                      <span>UNESCO Heritage</span>
                    </span>
                  ) : (
                    <span className="editorial-badge-region">
                      {item.region}
                    </span>
                  )}
                </div>

                {/* Top-Right: Rating Badge */}
                <div className="editorial-badge-top-right">
                  <span className="editorial-badge-rating">
                    <Star size={11} fill="#DFB76C" color="#DFB76C" />
                    <span>{item.rating ? item.rating.toFixed(1) : '4.9'}</span>
                  </span>
                </div>
              </div>

              {/* Editorial Card Body */}
              <div className="editorial-card-body">
                <div className="editorial-geography">
                  <MapPin size={12} color="#C59B43" />
                  <span>{item.region.toUpperCase()} • ETHIOPIA</span>
                </div>

                <h3 className="editorial-title">{item.name}</h3>

                <p className="editorial-blurb">{item.blurb}</p>

                {/* Refined Metadata Micro-Chips Row */}
                <div className="editorial-chips-row">
                  {item.elevation && (
                    <span className="editorial-chip" title="Elevation">
                      <Mountain size={12} color="#C59B43" />
                      <span>{item.elevation}</span>
                    </span>
                  )}

                  {item.bestTimeToVisit && (
                    <span className="editorial-chip" title="Best Time to Visit">
                      <Compass size={12} color="#8A9AA8" />
                      <span>{item.bestTimeToVisit.split('(')[0].trim()}</span>
                    </span>
                  )}

                  {item.latitude && item.longitude && (
                    <span className="editorial-chip" title="Coordinates">
                      <Crosshair size={12} color="#8A9AA8" />
                      <span>{item.latitude.toFixed(2)}°N, {item.longitude.toFixed(2)}°E</span>
                    </span>
                  )}
                </div>
              </div>

              {/* Seamless Action Buttons */}
              <div className="editorial-card-footer">
                <button
                  type="button"
                  className="editorial-edit-btn"
                  onClick={() => handleOpenEdit(item)}
                >
                  <Edit3 size={13} color="#DFB76C" />
                  <span>Edit Destination</span>
                </button>
                <button
                  type="button"
                  className="editorial-delete-btn"
                  onClick={() => handleDelete(item.id, item.name)}
                  title="Delete Destination"
                >
                  <Trash2 size={15} />
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* Compact List View */
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {filtered.map((item) => (
            <div key={item.id} className="luxury-list-row">
              <img src={item.image} alt={item.name} className="luxury-list-thumb" />

              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                  <h4 style={{ fontSize: '16px', fontWeight: 700, color: '#07152B', margin: 0 }}>
                    {item.name}
                  </h4>
                  <span className="badge badge-navy">{item.region}</span>
                  {item.unescoStatus && (
                    <span className="badge badge-gold">
                      <Award size={11} />
                      <span>UNESCO</span>
                    </span>
                  )}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '3px', marginLeft: 'auto' }}>
                    <Star size={13} fill="#DFB76C" color="#DFB76C" />
                    <span style={{ fontSize: '12.5px', fontWeight: 700, color: '#07152B' }}>
                      {item.rating || 4.9}
                    </span>
                  </div>
                </div>

                <p style={{ fontSize: '13px', color: '#5A687A', margin: '0 0 6px 0', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {item.blurb}
                </p>

                <div style={{ display: 'flex', alignItems: 'center', gap: '14px', fontSize: '12px', color: '#8A9AA8' }}>
                  {item.latitude && item.longitude && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#07152B' }}>
                      <Crosshair size={12} color="#C59B43" />
                      <span>{item.latitude.toFixed(4)}°N, {item.longitude.toFixed(4)}°E</span>
                    </div>
                  )}
                  {item.elevation && <span>Elevation: {item.elevation}</span>}
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <button
                  type="button"
                  className="btn btn-navy"
                  style={{ padding: '8px 14px', fontSize: '12.5px' }}
                  onClick={() => handleOpenEdit(item)}
                >
                  <Edit3 size={13} color="#DFB76C" />
                  <span>Edit</span>
                </button>
                <button
                  type="button"
                  className="luxury-icon-btn"
                  onClick={() => handleDelete(item.id, item.name)}
                  title="Delete Destination"
                >
                  <Trash2 size={15} />
                </button>
              </div>
            </div>
          ))}
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
  filterActionsRight: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    flexWrap: 'wrap',
  },
  regionFilterRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    flexWrap: 'wrap',
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
  cardsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))',
    gap: '20px',
  },
  destinationCard: {
    backgroundColor: '#FFFFFF',
    border: '1px solid #E4E9F0',
    borderRadius: '14px',
    overflow: 'hidden',
    boxShadow: '0 2px 8px rgba(7, 21, 43, 0.04)',
    display: 'flex',
    flexDirection: 'column',
    transition: 'all 0.2s ease',
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
  regionBadge: {
    backgroundColor: 'rgba(7, 21, 43, 0.85)',
    backdropFilter: 'blur(6px)',
    color: '#FFFFFF',
    fontSize: '11px',
    fontWeight: 700,
    padding: '4px 10px',
    borderRadius: '9999px',
  },
  unescoBadge: {
    backgroundColor: '#F8F4EC',
    border: '1px solid #E0C582',
    color: '#8C6A21',
    fontSize: '10.5px',
    fontWeight: 800,
    padding: '4px 10px',
    borderRadius: '9999px',
    display: 'inline-flex',
    alignItems: 'center',
    gap: '4px',
  },
  cardBody: {
    padding: '16px 18px',
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
    flex: 1,
  },
  cardHeaderRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '8px',
  },
  cardTitle: {
    fontSize: '16px',
    fontWeight: 700,
    color: '#07152B',
    margin: 0,
  },
  ratingBadge: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '4px',
    fontSize: '12px',
    fontWeight: 700,
    color: '#07152B',
  },
  cardBlurb: {
    fontSize: '12.5px',
    color: '#475569',
    lineHeight: 1.5,
    margin: 0,
  },
  cardMetaRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 'auto',
    paddingTop: '8px',
  },
  coordPill: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '5px',
    backgroundColor: '#F8FAFC',
    border: '1px solid #E4E9F0',
    padding: '4px 8px',
    borderRadius: '6px',
    fontSize: '11px',
    fontWeight: 600,
    color: '#07152B',
  },
  metaNote: {
    fontSize: '11.5px',
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
    transition: 'all 0.15s ease',
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
