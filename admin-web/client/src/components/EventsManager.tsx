import React, { useEffect, useState } from 'react';
import { adminApi } from '../api';
import { MapPicker } from './MapPicker';
import { Plus, Search, Edit2, Trash2, Calendar, Users, Crosshair, RefreshCw } from 'lucide-react';

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

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
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
      agenda: 'Opening Ceremony, Keynotes, Breakouts, Gala Dinner',
      capacity: 500,
      latitude: 8.9856,
      longitude: 38.7892,
    });
    setErrorMessage('');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (item: EventItemData) => {
    setEditingItem(item);
    setFormData({
      title: item.title,
      date: item.date ? item.date.split('T')[0] : '',
      time: item.time || '',
      city: item.city || 'Addis Ababa',
      venue: item.venue || '',
      description: '',
      image: item.image,
      category: item.category,
      price: item.price || 'Free',
      organizer: item.organizer || '',
      agenda: item.agenda || '',
      capacity: item.capacity || 500,
      latitude: item.latitude ?? 9.0105,
      longitude: item.longitude ?? 38.7615,
    });
    setErrorMessage('');
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Delete this event?')) return;
    try {
      await adminApi.deleteEvent(id);
      loadData();
    } catch (err: any) {
      alert(err.message || 'Failed to delete event');
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
      setIsModalOpen(false);
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
      alert(err.message || 'Failed to update RSVP status');
    }
  };

  const filteredEvents = events.filter((ev) =>
    ev.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    ev.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (ev.venue && ev.venue.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.topRow}>
        <div>
          <h2 style={styles.sectionTitle}>Events & Diaspora Gatherings Hub</h2>
          <p style={styles.sectionDesc}>
            Publish cultural celebrations, business conferences, summits, venue coordinates, and attendee RSVPs.
          </p>
        </div>

        <div style={styles.actionsGroup}>
          <button className="btn btn-secondary" onClick={loadData}>
            <RefreshCw size={15} color="#07152B" />
            <span>Refresh</span>
          </button>
          <button className="btn btn-primary" onClick={handleOpenCreate}>
            <Plus size={16} color="#07152B" />
            <span>Publish New Event</span>
          </button>
        </div>
      </div>

      {/* Sub Tabs */}
      <div style={styles.tabsRow}>
        <button
          style={{
            ...styles.tabBtn,
            ...(activeSubTab === 'events' ? styles.tabBtnActive : {}),
          }}
          onClick={() => setActiveSubTab('events')}
        >
          <Calendar size={15} color={activeSubTab === 'events' ? '#07152B' : '#5A687A'} />
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
          <Users size={15} color={activeSubTab === 'rsvps' ? '#07152B' : '#5A687A'} />
          <span>Attendee RSVPs</span>
          <span style={styles.tabBadge}>{rsvps.length}</span>
        </button>
      </div>

      {/* Events View */}
      {activeSubTab === 'events' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={styles.searchWrapper}>
            <Search size={16} color="#8A9AA8" style={{ position: 'absolute', left: '12px' }} />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search event title, venue, or category..."
              style={{ width: '320px', paddingLeft: '36px' }}
            />
          </div>

          <div className="table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Event Title & Organizer</th>
                  <th>Date & Time</th>
                  <th>Venue & Location</th>
                  <th>Category / Price</th>
                  <th>RSVPs</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={6} style={{ textAlign: 'center', padding: '36px', color: '#5A687A' }}>
                      Loading events...
                    </td>
                  </tr>
                ) : filteredEvents.length === 0 ? (
                  <tr>
                    <td colSpan={6} style={{ textAlign: 'center', padding: '36px', color: '#5A687A' }}>
                      No events found.
                    </td>
                  </tr>
                ) : (
                  filteredEvents.map((ev) => (
                    <tr key={ev.id}>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <img src={ev.image} alt={ev.title} style={styles.thumbImg} />
                          <div>
                            <div style={styles.eventTitle}>{ev.title}</div>
                            <div style={styles.eventOrg}>{ev.organizer || 'DALEEL Network'}</div>
                          </div>
                        </div>
                      </td>
                      <td>
                        <div style={{ fontWeight: 700, color: '#07152B' }}>
                          {new Date(ev.date).toLocaleDateString(undefined, {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                          })}
                        </div>
                        <div style={{ fontSize: '11.5px', color: '#5A687A', marginTop: '2px' }}>
                          {ev.time || 'All Day'}
                        </div>
                      </td>
                      <td>
                        <div style={{ fontSize: '13px', fontWeight: 600, color: '#07152B' }}>
                          {ev.venue || ev.city}
                        </div>
                        {ev.latitude && ev.longitude ? (
                          <div style={styles.coordBadge}>
                            <Crosshair size={11} color="#07152B" />
                            <span>
                              {ev.latitude.toFixed(3)}N, {ev.longitude.toFixed(3)}E
                            </span>
                          </div>
                        ) : null}
                      </td>
                      <td>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                          <span className="badge badge-navy">{ev.category}</span>
                          <span style={{ fontSize: '11px', color: '#8C6A21', fontWeight: 700 }}>
                            {ev.price || 'Free'}
                          </span>
                        </div>
                      </td>
                      <td>
                        <span className="badge badge-gold">
                          <Users size={12} color="#8C6A21" />
                          <span>{ev._count?.rsvps || 0} Guests</span>
                        </span>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', gap: '6px' }}>
                          <button className="btn-icon" onClick={() => handleOpenEdit(ev)} title="Edit Event">
                            <Edit2 size={15} />
                          </button>
                          <button className="btn-icon" onClick={() => handleDelete(ev.id)} title="Delete Event">
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

      {/* RSVPs View */}
      {activeSubTab === 'rsvps' && (
        <div className="table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Attendee Name</th>
                <th>Event Target</th>
                <th>Tickets</th>
                <th>Status</th>
                <th style={{ textAlign: 'right' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={5} style={{ textAlign: 'center', padding: '36px', color: '#5A687A' }}>
                    Loading RSVPs...
                  </td>
                </tr>
              ) : rsvps.length === 0 ? (
                <tr>
                  <td colSpan={5} style={{ textAlign: 'center', padding: '36px', color: '#5A687A' }}>
                    No attendee RSVPs registered yet.
                  </td>
                </tr>
              ) : (
                rsvps.map((r) => (
                  <tr key={r.id}>
                    <td>
                      <div style={{ fontWeight: 700, color: '#07152B' }}>{r.fullName}</div>
                      <div style={{ fontSize: '12px', color: '#5A687A' }}>
                        {r.email} • {r.phone || 'No phone'}
                      </div>
                    </td>
                    <td>
                      <span className="badge badge-navy">{r.event?.title}</span>
                    </td>
                    <td>
                      <span style={{ fontWeight: 700, color: '#07152B' }}>
                        {r.ticketsCount || 1} Ticket(s)
                      </span>
                    </td>
                    <td>
                      <span
                        className={`badge ${
                          r.status === 'confirmed' ? 'badge-success' : 'badge-warning'
                        }`}
                      >
                        {r.status.toUpperCase()}
                      </span>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <select
                        value={r.status}
                        onChange={(e) => handleUpdateRsvpStatus(r.id, e.target.value)}
                        style={{ padding: '6px 10px', fontSize: '12px', borderRadius: '6px' }}
                      >
                        <option value="confirmed">Confirmed</option>
                        <option value="waitlisted">Waitlisted</option>
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
                {editingItem ? 'Edit Diaspora Event & Venue Coordinates' : 'Publish New Diaspora Event'}
              </h3>
              <button className="btn-icon" onClick={() => setIsModalOpen(false)}>
                ✕
              </button>
            </div>

            <form onSubmit={handleSave}>
              <div className="modal-body">
                {errorMessage && <div style={styles.errorBox}>{errorMessage}</div>}

                <div>
                  <label style={styles.label}>Event Title *</label>
                  <input
                    type="text"
                    required
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="e.g. Ethiopian Diaspora Investment & Homecoming Gala 2026"
                    style={{ width: '100%' }}
                  />
                </div>

                <div style={styles.formGrid}>
                  <div>
                    <label style={styles.label}>Event Date *</label>
                    <input
                      type="date"
                      required
                      value={formData.date}
                      onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                      style={{ width: '100%' }}
                    />
                  </div>
                  <div>
                    <label style={styles.label}>Event Schedule / Time</label>
                    <input
                      type="text"
                      value={formData.time}
                      onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                      placeholder="09:00 AM - 05:00 PM"
                      style={{ width: '100%' }}
                    />
                  </div>
                </div>

                <div style={styles.formGrid}>
                  <div>
                    <label style={styles.label}>City / Region *</label>
                    <input
                      type="text"
                      required
                      value={formData.city}
                      onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                      style={{ width: '100%' }}
                    />
                  </div>
                  <div>
                    <label style={styles.label}>Venue Name</label>
                    <input
                      type="text"
                      value={formData.venue}
                      onChange={(e) => setFormData({ ...formData, venue: e.target.value })}
                      placeholder="e.g. Millennium Hall / Skylight Hotel"
                      style={{ width: '100%' }}
                    />
                  </div>
                </div>

                <div>
                  <label style={styles.label}>Hero Image URL *</label>
                  <input
                    type="url"
                    required
                    value={formData.image}
                    onChange={(e) => setFormData({ ...formData, image: e.target.value })}
                    style={{ width: '100%' }}
                  />
                </div>

                <div style={styles.formGrid}>
                  <div>
                    <label style={styles.label}>Category</label>
                    <select
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                      style={{ width: '100%' }}
                    >
                      <option value="Summits">Summits</option>
                      <option value="Culture">Culture</option>
                      <option value="Business">Business</option>
                      <option value="Networking">Networking</option>
                      <option value="Festival">Festival</option>
                    </select>
                  </div>
                  <div>
                    <label style={styles.label}>Ticket Pricing</label>
                    <input
                      type="text"
                      value={formData.price}
                      onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                      placeholder="e.g. Free with RSVP or 1,500 ETB"
                      style={{ width: '100%' }}
                    />
                  </div>
                </div>

                <div>
                  <label style={styles.label}>Organizer</label>
                  <input
                    type="text"
                    value={formData.organizer}
                    onChange={(e) => setFormData({ ...formData, organizer: e.target.value })}
                    placeholder="e.g. Ministry of Foreign Affairs Diaspora Service"
                    style={{ width: '100%' }}
                  />
                </div>

                {/* Map Coordinator */}
                <div>
                  <label style={styles.label}>Venue Location Coordinates</label>
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

              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setIsModalOpen(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={isSaving}>
                  {isSaving ? 'Publishing Event...' : editingItem ? 'Update Event' : 'Publish Event'}
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
    width: '48px',
    height: '48px',
    borderRadius: '8px',
    objectFit: 'cover',
    border: '1px solid #E4E9F0',
  },
  eventTitle: {
    fontSize: '14px',
    fontWeight: 700,
    color: '#07152B',
  },
  eventOrg: {
    fontSize: '12px',
    color: '#5A687A',
    marginTop: '2px',
  },
  coordBadge: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '4px',
    backgroundColor: '#F0F3F8',
    padding: '3px 8px',
    borderRadius: '6px',
    fontSize: '10.5px',
    fontWeight: 600,
    color: '#07152B',
    marginTop: '3px',
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
