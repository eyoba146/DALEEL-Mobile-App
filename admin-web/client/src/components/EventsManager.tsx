import React, { useEffect, useState } from 'react';
import { adminApi } from '../api';
import { MapPicker } from './MapPicker';
import { ImageUploader } from './ImageUploader';
import {
  Plus,
  Search,
  Edit3,
  Trash2,
  Calendar,
  Crosshair,
  RefreshCw,
  ArrowLeft,
  Check,
  Users,
  MapPin,
  Clock,
  LayoutGrid,
  List,
} from 'lucide-react';

interface EventItemData {
  id: string;
  title: string;
  date: string;
  time?: string | null;
  city: string;
  venue?: string | null;
  category: string;
  price?: string | null;
  organizer?: string | null;
  agenda?: string | null;
  capacity?: number | null;
  description?: string | null;
  image: string;
  latitude?: number | null;
  longitude?: number | null;
  _count?: { rsvps: number };
}

interface EventRsvpItem {
  id: string;
  fullName: string;
  email: string;
  phone?: string | null;
  ticketsCount: number;
  notes?: string | null;
  status: string;
  createdAt: string;
  event: { id: string; title: string; date: string; venue?: string | null };
}

export const EventsManager: React.FC = () => {
  const [activeSubTab, setActiveSubTab] = useState<'events' | 'rsvps'>('events');
  const [events, setEvents] = useState<EventItemData[]>([]);
  const [rsvps, setRsvps] = useState<EventRsvpItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  // Dedicated In-Page Editor State (NO POPUPS)
  const [isEditorActive, setIsEditorActive] = useState(false);
  const [editingItem, setEditingItem] = useState<EventItemData | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Form Fields
  const [formData, setFormData] = useState({
    title: '',
    date: new Date().toISOString().split('T')[0],
    time: '09:00 AM - 05:00 PM',
    city: 'Addis Ababa',
    venue: 'Skylight Hotel Grand Ballroom',
    description: '',
    image: 'https://images.unsplash.com/photo-1511578314322-379afb476865?w=800',
    category: 'Summits',
    price: 'Free with RSVP',
    organizer: 'Ethiopian Diaspora Association',
    agenda: 'Registration, Keynote Addresses, Panel Discussions, Networking Gala',
    capacity: 500,
    latitude: 9.0105 as number | null,
    longitude: 38.7615 as number | null,
  });

  const loadData = async () => {
    setLoading(true);
    try {
      const [eventsData, rsvpsData] = await Promise.all([
        adminApi.getEvents(),
        adminApi.getEventRsvps(),
      ]);
      setEvents(eventsData);
      setRsvps(rsvpsData);
    } catch (err: any) {
      console.error('Failed to load events data:', err);
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
      date: new Date().toISOString().split('T')[0],
      time: '09:00 AM - 05:00 PM',
      city: 'Addis Ababa',
      venue: 'Skylight Hotel Grand Ballroom',
      description: '',
      image: 'https://images.unsplash.com/photo-1511578314322-379afb476865?w=800',
      category: 'Summits',
      price: 'Free with RSVP',
      organizer: 'Ethiopian Diaspora Association',
      agenda: 'Registration, Keynote Addresses, Panel Discussions, Networking Gala',
      capacity: 500,
      latitude: 9.0105,
      longitude: 38.7615,
    });
    setErrorMessage('');
    setIsEditorActive(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleOpenEdit = (item: EventItemData) => {
    setEditingItem(item);
    setFormData({
      title: item.title,
      date: item.date ? item.date.split('T')[0] : new Date().toISOString().split('T')[0],
      time: item.time || '',
      city: item.city || 'Addis Ababa',
      venue: item.venue || '',
      description: item.description || '',
      image: item.image,
      category: item.category,
      price: item.price || 'Free with RSVP',
      organizer: item.organizer || '',
      agenda: item.agenda || '',
      capacity: item.capacity || 500,
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

  const handleDelete = async (id: string, title: string) => {
    if (!window.confirm(`Are you sure you wish to delete "${title}"?`)) return;
    try {
      await adminApi.deleteEvent(id);
      loadData();
      if (editingItem?.id === id) {
        handleCloseEditor();
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to remove event');
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setErrorMessage('');

    try {
      if (editingItem) {
        await adminApi.updateEvent(editingItem.id, formData);
      } else {
        await adminApi.createEvent(formData);
      }
      setIsEditorActive(false);
      loadData();
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to save event');
    } finally {
      setIsSaving(false);
    }
  };

  const handleUpdateRsvpStatus = async (id: string, status: string) => {
    try {
      await adminApi.updateEventRsvpStatus(id, status);
      loadData();
    } catch (err: any) {
      console.error('Failed to update RSVP status:', err);
    }
  };

  const filteredEvents = events.filter(
    (ev) =>
      ev.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ev.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ev.city.toLowerCase().includes(searchTerm.toLowerCase())
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
              <span>Back to Events</span>
            </button>
            <div style={styles.editorBreadcrumbs}>
              <span style={styles.breadcrumbMuted}>Events</span>
              <span style={styles.breadcrumbSep}>/</span>
              <span style={styles.breadcrumbCurrent}>
                {editingItem ? `Edit: ${editingItem.title}` : 'Publish New Event'}
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
              <span>{isSaving ? 'Saving...' : editingItem ? 'Save Event' : 'Publish Event'}</span>
            </button>
          </div>
        </div>

        {errorMessage && <div style={styles.errorBox}>{errorMessage}</div>}

        {/* 2-Column Dedicated Editor Workspace */}
        <form onSubmit={handleSave} style={styles.editorGrid}>
          {/* Left Column: Event Details */}
          <div style={styles.formCard}>
            <h3 style={styles.cardSectionTitle}>Event Information & Schedule</h3>
            <p style={styles.cardSectionSub}>Date, timing, organizer, and attendee ticketing parameters</p>

            <div style={styles.formStack}>
              <div>
                <label style={styles.label}>Event Title *</label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="e.g. Ethiopian Diaspora Global Investment Summit 2026"
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
                    <option value="Summits">Summits & Business</option>
                    <option value="Cultural Celebrations">Cultural Celebrations & Festivals</option>
                    <option value="Diaspora Meetups">Diaspora Meetups & Mixers</option>
                    <option value="Arts & Music">Arts, Music & Heritage</option>
                    <option value="Workshops">Workshops & Masterclasses</option>
                  </select>
                </div>

                <div style={{ flex: 1 }}>
                  <label style={styles.label}>Ticket Price</label>
                  <input
                    type="text"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    placeholder="e.g. Free with RSVP / 500 ETB"
                    style={styles.fullInput}
                  />
                </div>
              </div>

              <div style={styles.inputRow}>
                <div style={{ flex: 1 }}>
                  <label style={styles.label}>Event Date *</label>
                  <input
                    type="date"
                    required
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    style={styles.fullInput}
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={styles.label}>Event Time</label>
                  <input
                    type="text"
                    value={formData.time}
                    onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                    placeholder="e.g. 09:00 AM - 05:00 PM"
                    style={styles.fullInput}
                  />
                </div>
              </div>

              <div style={styles.inputRow}>
                <div style={{ flex: 1 }}>
                  <label style={styles.label}>City</label>
                  <input
                    type="text"
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    placeholder="e.g. Addis Ababa"
                    style={styles.fullInput}
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={styles.label}>Venue Name / Hall</label>
                  <input
                    type="text"
                    value={formData.venue}
                    onChange={(e) => setFormData({ ...formData, venue: e.target.value })}
                    placeholder="e.g. Skylight Hotel Grand Ballroom"
                    style={styles.fullInput}
                  />
                </div>
              </div>

              <div>
                <ImageUploader
                  value={formData.image}
                  onChange={(url) => setFormData({ ...formData, image: url })}
                  label="Event Poster / Artwork"
                />
              </div>

              <div style={styles.inputRow}>
                <div style={{ flex: 1 }}>
                  <label style={styles.label}>Host / Organizer</label>
                  <input
                    type="text"
                    value={formData.organizer}
                    onChange={(e) => setFormData({ ...formData, organizer: e.target.value })}
                    placeholder="e.g. Ethiopian Diaspora Association"
                    style={styles.fullInput}
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={styles.label}>Max Capacity</label>
                  <input
                    type="number"
                    min={10}
                    value={formData.capacity}
                    onChange={(e) => setFormData({ ...formData, capacity: parseInt(e.target.value) || 100 })}
                    style={styles.fullInput}
                  />
                </div>
              </div>

              <div>
                <label style={styles.label}>Agenda Overview</label>
                <input
                  type="text"
                  value={formData.agenda}
                  onChange={(e) => setFormData({ ...formData, agenda: e.target.value })}
                  placeholder="e.g. Registration, Keynotes, Panel Discussions, Gala Dinner"
                  style={styles.fullInput}
                />
              </div>
            </div>
          </div>

          {/* Right Column: Venue Coordinates Map Coordinator */}
          <div style={styles.formCard}>
            <h3 style={styles.cardSectionTitle}>Venue Location Map Coordinator</h3>
            <p style={styles.cardSectionSub}>
              Pin the venue location so attendees can view live maps and get turn-by-turn driving directions
            </p>

            <div style={{ marginTop: '16px' }}>
              <MapPicker
                latitude={formData.latitude}
                longitude={formData.longitude}
                title={formData.title || 'Event Venue'}
                address={`${formData.venue || 'Venue'}, ${formData.city}`}
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
      {/* Top Header Row */}
      <div style={styles.topRow}>
        <div>
          <h2 style={styles.sectionTitle}>Events & Gatherings</h2>
          <p style={styles.sectionDesc}>
            Publish summits, cultural celebrations, venue coordinates, and manage attendee reservations.
          </p>
        </div>

        <div style={styles.actionsGroup}>
          <button className="btn btn-secondary" onClick={loadData}>
            <RefreshCw size={15} color="#07152B" />
            <span>Refresh</span>
          </button>
          <button className="btn btn-primary" onClick={handleOpenCreate}>
            <Plus size={16} color="#07152B" />
            <span>Add Event</span>
          </button>
        </div>
      </div>

      {/* Sub-tabs Row */}
      <div style={styles.tabsRow}>
        <button
          style={{
            ...styles.tabBtn,
            ...(activeSubTab === 'events' ? styles.tabBtnActive : {}),
          }}
          onClick={() => setActiveSubTab('events')}
        >
          <span>Events Catalog</span>
          <span style={styles.tabBadge}>{events.length}</span>
        </button>

        <button
          style={{
            ...styles.tabBtn,
            ...(activeSubTab === 'rsvps' ? styles.tabBtnActive : {}),
          }}
          onClick={() => setActiveSubTab('rsvps')}
        >
          <span>Attendee RSVPs</span>
          <span style={styles.tabBadge}>{rsvps.length}</span>
        </button>
      </div>

      {/* Events Tab View */}
      {activeSubTab === 'events' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div style={styles.filterBar}>
            <div style={styles.searchWrapper}>
              <Search size={16} color="#8A9AA8" style={{ position: 'absolute', left: '12px' }} />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search events by title, category, or city..."
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
            <div style={styles.emptyState}>Loading events...</div>
          ) : filteredEvents.length === 0 ? (
            <div style={styles.emptyState}>No events scheduled yet.</div>
          ) : viewMode === 'grid' ? (
            /* Luxury Cards Grid */
            <div className="luxury-grid">
              {filteredEvents.map((ev) => (
                <div key={ev.id} className="luxury-card">
                  {/* Media Banner with 16:10 Aspect Ratio, Scrim, and Badges */}
                  <div className="luxury-card-media">
                    <img src={ev.image} alt={ev.title} className="luxury-card-img" />
                    <div className="luxury-card-scrim" />

                    <div className="luxury-badge-top-left">
                      <span className="glass-pill">{ev.category}</span>
                    </div>

                    <div className="luxury-badge-top-right">
                      <span className="glass-pill-light" style={{ color: '#07152B', fontWeight: 800 }}>
                        {ev.price || 'Free RSVP'}
                      </span>
                    </div>

                    <div className="luxury-badge-bottom-left">
                      <span className="glass-pill" style={{ textTransform: 'none', fontSize: '11px' }}>
                        <Calendar size={11} color="#DFB76C" />
                        <span>{new Date(ev.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                      </span>
                    </div>

                    <div className="luxury-badge-bottom-right">
                      <span className="glass-pill" style={{ textTransform: 'none', fontSize: '10.5px' }}>
                        <Users size={11} color="#DFB76C" />
                        <span>{ev._count?.rsvps ?? 0} RSVPs</span>
                      </span>
                    </div>
                  </div>

                  {/* Card Body */}
                  <div className="luxury-card-body">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <MapPin size={12} color="#C59B43" />
                      <span style={{ fontSize: '12px', fontWeight: 600, color: '#C59B43', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                        {ev.venue || ev.city}
                      </span>
                    </div>

                    <h3 className="luxury-card-title">{ev.title}</h3>

                    {ev.description && (
                      <p className="luxury-card-blurb">{ev.description}</p>
                    )}

                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '12px', color: '#5A687A', marginTop: '2px' }}>
                      {ev.time && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <Clock size={12} color="#8A9AA8" />
                          <span>{ev.time}</span>
                        </div>
                      )}
                      {ev.organizer && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <span>Hosted by <strong style={{ color: '#07152B' }}>{ev.organizer}</strong></span>
                        </div>
                      )}
                    </div>

                    <div className="luxury-card-meta">
                      {ev.latitude && ev.longitude ? (
                        <div className="luxury-coord-chip">
                          <Crosshair size={12} color="#C59B43" />
                          <span>{ev.latitude.toFixed(4)}°N, {ev.longitude.toFixed(4)}°E</span>
                        </div>
                      ) : (
                        <span style={{ fontSize: '11px', color: '#8A9AA8' }}>Venue coordinates unpinned</span>
                      )}
                    </div>
                  </div>

                  {/* Card Action Footer */}
                  <div className="luxury-card-footer">
                    <button
                      type="button"
                      className="luxury-edit-btn"
                      onClick={() => handleOpenEdit(ev)}
                    >
                      <Edit3 size={14} color="#DFB76C" />
                      <span>Edit Event</span>
                    </button>
                    <button
                      type="button"
                      className="luxury-icon-btn"
                      onClick={() => handleDelete(ev.id, ev.title)}
                      title="Delete Event"
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
              {filteredEvents.map((ev) => (
                <div key={ev.id} className="luxury-list-row">
                  <img src={ev.image} alt={ev.title} className="luxury-list-thumb" />

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                      <h4 style={{ fontSize: '16px', fontWeight: 700, color: '#07152B', margin: 0 }}>
                        {ev.title}
                      </h4>
                      <span className="badge badge-navy">{ev.category}</span>
                      <span className="badge badge-gold">{ev.price || 'Free RSVP'}</span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px', fontSize: '12.5px', color: '#5A687A', margin: '4px 0' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Calendar size={12} color="#C59B43" />
                        <span>{new Date(ev.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                      </span>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <MapPin size={12} color="#C59B43" />
                        <span>{ev.venue || ev.city}</span>
                      </span>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Users size={12} color="#C59B43" />
                        <span>{ev._count?.rsvps ?? 0} RSVPs</span>
                      </span>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <button
                      type="button"
                      className="btn btn-navy"
                      style={{ padding: '8px 14px', fontSize: '12.5px' }}
                      onClick={() => handleOpenEdit(ev)}
                    >
                      <Edit3 size={13} color="#DFB76C" />
                      <span>Edit</span>
                    </button>
                    <button
                      type="button"
                      className="luxury-icon-btn"
                      onClick={() => handleDelete(ev.id, ev.title)}
                      title="Delete Event"
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

      {/* RSVPs Tab View */}
      {activeSubTab === 'rsvps' && (
        <div className="table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Attendee Details</th>
                <th>Target Event</th>
                <th>Passes</th>
                <th>Registration Date</th>
                <th>Status</th>
                <th style={{ textAlign: 'right' }}>Update Status</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: '36px', color: '#5A687A' }}>
                    Loading attendee RSVPs...
                  </td>
                </tr>
              ) : rsvps.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: '36px', color: '#5A687A' }}>
                    No attendee RSVPs registered yet.
                  </td>
                </tr>
              ) : (
                rsvps.map((rsvp) => (
                  <tr key={rsvp.id}>
                    <td>
                      <div style={{ fontWeight: 700, color: '#07152B' }}>{rsvp.fullName}</div>
                      <div style={{ fontSize: '12px', color: '#5A687A', marginTop: '2px' }}>
                        {rsvp.email} • {rsvp.phone || 'No phone'}
                      </div>
                    </td>
                    <td>
                      <div style={{ fontWeight: 600, color: '#07152B', fontSize: '13px' }}>
                        {rsvp.event?.title}
                      </div>
                      <div style={{ fontSize: '11.5px', color: '#5A687A' }}>
                        {new Date(rsvp.event?.date).toLocaleDateString()}
                      </div>
                    </td>
                    <td>
                      <span style={{ fontWeight: 700, color: '#07152B' }}>
                        {rsvp.ticketsCount} {rsvp.ticketsCount === 1 ? 'Pass' : 'Passes'}
                      </span>
                    </td>
                    <td>
                      <span style={{ fontSize: '12px', color: '#5A687A' }}>
                        {new Date(rsvp.createdAt).toLocaleDateString()}
                      </span>
                    </td>
                    <td>
                      <span
                        className={`badge ${
                          rsvp.status === 'confirmed'
                            ? 'badge-success'
                            : rsvp.status === 'cancelled'
                            ? 'badge-error'
                            : 'badge-gold'
                        }`}
                      >
                        {rsvp.status.toUpperCase()}
                      </span>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <select
                        value={rsvp.status}
                        onChange={(e) => handleUpdateRsvpStatus(rsvp.id, e.target.value)}
                        style={{ padding: '6px 10px', fontSize: '12px', borderRadius: '6px' }}
                      >
                        <option value="confirmed">Confirmed</option>
                        <option value="checked_in">Checked In</option>
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
    gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))',
    gap: '20px',
  },
  eventCard: {
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
    height: '160px',
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
    fontSize: '11px',
    fontWeight: 700,
    padding: '4px 10px',
    borderRadius: '9999px',
  },
  priceBadge: {
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
    gap: '8px',
    flex: 1,
  },
  dateBanner: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    fontSize: '12px',
    fontWeight: 600,
    color: '#8C6A21',
  },
  eventTitle: {
    fontSize: '16px',
    fontWeight: 700,
    color: '#07152B',
    margin: '2px 0 4px 0',
  },
  venueRow: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '6px',
    fontSize: '12.5px',
    color: '#475569',
  },
  cardMetaRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 'auto',
    paddingTop: '10px',
  },
  rsvpBadge: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    fontSize: '11.5px',
    fontWeight: 700,
    color: '#07152B',
  },
  coordPill: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '4px',
    backgroundColor: '#F8FAFC',
    border: '1px solid #E4E9F0',
    padding: '3px 8px',
    borderRadius: '6px',
    fontSize: '10.5px',
    fontWeight: 600,
    color: '#07152B',
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
