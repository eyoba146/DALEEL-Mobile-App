import React, { useEffect, useState } from 'react';
import { adminApi, type AdminReviewItem } from '../api';
import { useToast } from '../context/ToastContext';
import {
  Star,
  CheckCircle,
  XCircle,
  Clock,
  Trash2,
  Search,
  RefreshCw,
  ShieldCheck,
  ThumbsUp,
  Eye,
  MessageSquare,
  X,
} from 'lucide-react';

export const ReviewsManager: React.FC = () => {
  const { success, error: toastError } = useToast();

  const [reviews, setReviews] = useState<AdminReviewItem[]>([]);
  const [counts, setCounts] = useState({
    total: 0,
    pending: 0,
    approved: 0,
    rejected: 0,
    verified: 0,
  });
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Filters
  const [targetTypeFilter, setTargetTypeFilter] = useState<'all' | 'product' | 'service' | 'destination'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Photo viewer lightbox
  const [previewPhoto, setPreviewPhoto] = useState<string | null>(null);

  const fetchReviews = async (showLoading = true) => {
    if (showLoading) setLoading(true);
    else setIsRefreshing(true);

    try {
      const res = await adminApi.getAdminReviews({
        targetType: targetTypeFilter !== 'all' ? targetTypeFilter : undefined,
        status: statusFilter !== 'all' ? statusFilter : undefined,
        search: searchQuery.trim() || undefined,
      });
      setReviews(res.reviews || []);
      setCounts(res.counts || { total: 0, pending: 0, approved: 0, rejected: 0, verified: 0 });
    } catch (err: any) {
      console.error('Failed to load reviews:', err);
      toastError(err.message || 'Failed to load community reviews');
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchReviews();
  }, [targetTypeFilter, statusFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchReviews();
  };

  const handleUpdateStatus = async (id: string, status: 'approved' | 'rejected' | 'pending') => {
    try {
      await adminApi.updateReviewStatus(id, status);
      success(`Review successfully marked as ${status}`);
      // Optimistic update
      setReviews((prev) =>
        prev.map((r) => (r.id === id ? { ...r, status } : r))
      );
      fetchReviews(false);
    } catch (err: any) {
      toastError(err.message || 'Could not update review status');
    }
  };

  const handleToggleVerified = async (id: string, currentVerified: boolean) => {
    try {
      const newStatus = !currentVerified;
      await adminApi.toggleReviewVerified(id, newStatus);
      success(newStatus ? 'Verified Diaspora badge granted' : 'Verified badge revoked');
      setReviews((prev) =>
        prev.map((r) => (r.id === id ? { ...r, verified: newStatus } : r))
      );
      fetchReviews(false);
    } catch (err: any) {
      toastError(err.message || 'Failed to toggle verification badge');
    }
  };

  const handleDeleteReview = async (id: string) => {
    if (!window.confirm('Are you sure you want to permanently delete this review? This action cannot be undone.')) {
      return;
    }
    try {
      await adminApi.deleteReview(id);
      success('Review permanently removed');
      setReviews((prev) => prev.filter((r) => r.id !== id));
      fetchReviews(false);
    } catch (err: any) {
      toastError(err.message || 'Failed to delete review');
    }
  };

  const renderStars = (rating: number) => {
    return (
      <div style={styles.starsRow}>
        {[1, 2, 3, 4, 5].map((s) => (
          <Star
            key={s}
            size={15}
            fill={s <= rating ? '#DFB76C' : 'none'}
            color={s <= rating ? '#DFB76C' : '#CBD5E1'}
          />
        ))}
        <span style={styles.ratingNumText}>({rating}.0)</span>
      </div>
    );
  };

  const getTargetTypeBadge = (type: string) => {
    switch (type) {
      case 'product':
        return { label: 'Artisan Product', bg: '#EFF6FF', text: '#2563EB', border: '#BFDBFE' };
      case 'service':
        return { label: 'Verified Service', bg: '#F0FDF4', text: '#16A34A', border: '#BBF7D0' };
      case 'destination':
        return { label: 'Heritage Site', bg: '#FAF5FF', text: '#9333EA', border: '#E9D5FF' };
      default:
        return { label: type, bg: '#F1F5F9', text: '#475569', border: '#E2E8F0' };
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return { label: 'Approved & Live', bg: 'rgba(34, 197, 94, 0.12)', text: '#16A34A', icon: CheckCircle };
      case 'rejected':
        return { label: 'Rejected', bg: 'rgba(239, 68, 68, 0.12)', text: '#DC2626', icon: XCircle };
      case 'pending':
      default:
        return { label: 'Pending Moderation', bg: 'rgba(223, 183, 108, 0.18)', text: '#B45309', icon: Clock };
    }
  };

  return (
    <div style={styles.container}>
      {/* Top Title & Refresh */}
      <div style={styles.headerRow}>
        <div>
          <h1 style={styles.pageTitle}>Community Reviews & Ratings Desk</h1>
          <p style={styles.pageSub}>
            Moderate feedback, verify diaspora buyers, and maintain authentic Ethiopian community trust.
          </p>
        </div>

        <button
          style={styles.refreshBtn}
          onClick={() => fetchReviews(false)}
          disabled={isRefreshing}
          title="Refresh Reviews"
        >
          <RefreshCw size={16} color="#07152B" className={isRefreshing ? 'spin' : ''} />
          <span>Refresh</span>
        </button>
      </div>

      {/* KPI Metrics Cards */}
      <div style={styles.kpiGrid}>
        <div style={styles.kpiCard}>
          <div style={styles.kpiIconBoxNavy}>
            <MessageSquare size={20} color="#DFB76C" />
          </div>
          <div>
            <div style={styles.kpiValue}>{counts.total}</div>
            <div style={styles.kpiLabel}>Total Reviews</div>
          </div>
        </div>

        <div style={styles.kpiCard}>
          <div style={styles.kpiIconBoxAmber}>
            <Clock size={20} color="#D97706" />
          </div>
          <div>
            <div style={{ ...styles.kpiValue, color: '#D97706' }}>{counts.pending}</div>
            <div style={styles.kpiLabel}>Pending Moderation</div>
          </div>
        </div>

        <div style={styles.kpiCard}>
          <div style={styles.kpiIconBoxGreen}>
            <CheckCircle size={20} color="#16A34A" />
          </div>
          <div>
            <div style={{ ...styles.kpiValue, color: '#16A34A' }}>{counts.approved}</div>
            <div style={styles.kpiLabel}>Approved & Live</div>
          </div>
        </div>

        <div style={styles.kpiCard}>
          <div style={styles.kpiIconBoxBlue}>
            <ShieldCheck size={20} color="#2563EB" />
          </div>
          <div>
            <div style={{ ...styles.kpiValue, color: '#2563EB' }}>{counts.verified}</div>
            <div style={styles.kpiLabel}>Verified Diaspora Badges</div>
          </div>
        </div>
      </div>

      {/* Filter Bar & Search */}
      <div style={styles.filterCard}>
        {/* Target Type Tabs */}
        <div style={styles.tabsRow}>
          {[
            { id: 'all', label: 'All Categories' },
            { id: 'product', label: 'Artisan Products' },
            { id: 'service', label: 'Partner Services' },
            { id: 'destination', label: 'Heritage Destinations' },
          ].map((tab) => (
            <button
              key={tab.id}
              style={{
                ...styles.filterTab,
                ...(targetTypeFilter === tab.id ? styles.filterTabActive : {}),
              }}
              onClick={() => setTargetTypeFilter(tab.id as any)}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div style={styles.filterSubRow}>
          {/* Status Pills */}
          <div style={styles.statusPillsRow}>
            {[
              { id: 'all', label: 'All Status' },
              { id: 'pending', label: `Pending (${counts.pending})` },
              { id: 'approved', label: 'Approved' },
              { id: 'rejected', label: 'Rejected' },
            ].map((pill) => (
              <button
                key={pill.id}
                style={{
                  ...styles.statusPillBtn,
                  ...(statusFilter === pill.id ? styles.statusPillBtnActive : {}),
                }}
                onClick={() => setStatusFilter(pill.id as any)}
              >
                {pill.label}
              </button>
            ))}
          </div>

          {/* Search Form */}
          <form onSubmit={handleSearchSubmit} style={styles.searchForm}>
            <Search size={16} color="#64748B" style={{ marginLeft: 12 }} />
            <input
              type="text"
              placeholder="Search reviewer, title, or comments..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={styles.searchInput}
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  fetchReviews();
                }}
                style={styles.clearSearchBtn}
              >
                <X size={14} color="#94A3B8" />
              </button>
            )}
            <button type="submit" style={styles.searchSubmitBtn}>
              Search
            </button>
          </form>
        </div>
      </div>

      {/* Reviews Table / Card List */}
      {loading ? (
        <div style={styles.emptyState}>
          <RefreshCw size={28} color="#DFB76C" className="spin" style={{ marginBottom: 12 }} />
          <p style={styles.emptyTitle}>Loading community reviews...</p>
        </div>
      ) : reviews.length === 0 ? (
        <div style={styles.emptyState}>
          <MessageSquare size={36} color="#CBD5E1" style={{ marginBottom: 12 }} />
          <p style={styles.emptyTitle}>No reviews match your filters</p>
          <p style={styles.emptySub}>Try switching the target category or clearing your search term.</p>
        </div>
      ) : (
        <div style={styles.reviewsList}>
          {reviews.map((rev) => {
            const typeBadge = getTargetTypeBadge(rev.targetType);
            const statusBadge = getStatusBadge(rev.status);
            const StatusIcon = statusBadge.icon;
            const photoList = rev.photos ? rev.photos.split(',').map((p) => p.trim()).filter(Boolean) : [];

            return (
              <div key={rev.id} style={styles.reviewCard}>
                {/* Header Row: Target & Reviewer Info */}
                <div style={styles.cardHeader}>
                  {/* Target info with thumbnail */}
                  <div style={styles.targetInfo}>
                    {rev.targetImage && (
                      <img src={rev.targetImage} alt="" style={styles.targetThumb} />
                    )}
                    <div>
                      <div style={styles.targetBadgeRow}>
                        <span
                          style={{
                            ...styles.typeBadge,
                            backgroundColor: typeBadge.bg,
                            color: typeBadge.text,
                            borderColor: typeBadge.border,
                          }}
                        >
                          {typeBadge.label}
                        </span>
                        {rev.targetCategory && (
                          <span style={styles.targetCategoryText}>• {rev.targetCategory}</span>
                        )}
                      </div>
                      <div style={styles.targetTitleText}>{rev.targetTitle || rev.targetId}</div>
                    </div>
                  </div>

                  {/* Status badge & helpful upvotes */}
                  <div style={styles.headerRight}>
                    <div
                      style={{
                        ...styles.statusBadge,
                        backgroundColor: statusBadge.bg,
                        color: statusBadge.text,
                      }}
                    >
                      <StatusIcon size={14} style={{ marginRight: 5 }} />
                      {statusBadge.label}
                    </div>

                    <div style={styles.helpfulBadge} title={`${rev.helpfulCount} diaspora users found this helpful`}>
                      <ThumbsUp size={13} color="#2563EB" style={{ marginRight: 4 }} />
                      <span>{rev.helpfulCount} Helpful</span>
                    </div>
                  </div>
                </div>

                {/* Body Row: Author, Rating, Content */}
                <div style={styles.cardBody}>
                  {/* Author Column */}
                  <div style={styles.authorCol}>
                    <div style={styles.authorAvatarWrap}>
                      {rev.authorAvatar ? (
                        <img src={rev.authorAvatar} alt="" style={styles.authorAvatarImg} />
                      ) : (
                        <div style={styles.authorAvatarPlaceholder}>
                          {rev.authorName.charAt(0).toUpperCase()}
                        </div>
                      )}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={styles.authorNameRow}>
                        <span style={styles.authorNameText}>{rev.authorName}</span>
                      </div>
                      <div style={styles.authorSubText}>
                        {rev.user?.email || 'Guest Reviewer'} {rev.user?.country ? `• ${rev.user.country}` : ''}
                      </div>

                      {/* Diaspora Badge Status & Toggle */}
                      <button
                        style={{
                          ...styles.verifiedBadgeBtn,
                          backgroundColor: rev.verified ? 'rgba(37, 99, 235, 0.1)' : '#F1F5F9',
                          borderColor: rev.verified ? '#2563EB' : '#CBD5E1',
                          color: rev.verified ? '#2563EB' : '#64748B',
                        }}
                        onClick={() => handleToggleVerified(rev.id, rev.verified)}
                        title="Click to toggle Verified Diaspora Buyer status"
                      >
                        <ShieldCheck size={13} style={{ marginRight: 4 }} />
                        {rev.verified ? 'Verified Diaspora Buyer' : 'Unverified (Click to Verify)'}
                      </button>
                    </div>
                  </div>

                  {/* Review Text Column */}
                  <div style={styles.contentCol}>
                    <div style={styles.ratingAndDateRow}>
                      {renderStars(rev.rating)}
                      <span style={styles.dateText}>
                        {new Date(rev.createdAt).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                        })}
                      </span>
                    </div>

                    {rev.title && <div style={styles.reviewTitleText}>{rev.title}</div>}
                    <div style={styles.reviewCommentText}>{rev.comment}</div>

                    {/* Photos Gallery */}
                    {photoList.length > 0 && (
                      <div style={styles.photosRow}>
                        {photoList.map((photoUrl, pIdx) => (
                          <div
                            key={pIdx}
                            style={styles.photoThumbWrap}
                            onClick={() => setPreviewPhoto(photoUrl)}
                            title="Click to expand full resolution"
                          >
                            <img src={photoUrl} alt="" style={styles.photoThumb} />
                            <div style={styles.photoOverlay}>
                              <Eye size={14} color="#FFFFFF" />
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Footer Action Bar */}
                <div style={styles.cardFooter}>
                  <div style={styles.reviewIdText}>Review ID: {rev.id}</div>

                  <div style={styles.actionsRow}>
                    {rev.status !== 'approved' && (
                      <button
                        style={styles.approveBtn}
                        onClick={() => handleUpdateStatus(rev.id, 'approved')}
                      >
                        <CheckCircle size={15} style={{ marginRight: 6 }} />
                        Approve & Publish
                      </button>
                    )}

                    {rev.status !== 'rejected' && (
                      <button
                        style={styles.rejectBtn}
                        onClick={() => handleUpdateStatus(rev.id, 'rejected')}
                      >
                        <XCircle size={15} style={{ marginRight: 6 }} />
                        Reject Review
                      </button>
                    )}

                    {rev.status !== 'pending' && (
                      <button
                        style={styles.pendingBtn}
                        onClick={() => handleUpdateStatus(rev.id, 'pending')}
                      >
                        <Clock size={15} style={{ marginRight: 6 }} />
                        Mark Pending
                      </button>
                    )}

                    <button
                      style={styles.deleteBtn}
                      onClick={() => handleDeleteReview(rev.id)}
                      title="Delete review permanently"
                    >
                      <Trash2 size={15} color="#DC2626" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Lightbox Modal for Photo Preview */}
      {previewPhoto && (
        <div style={styles.modalOverlay} onClick={() => setPreviewPhoto(null)}>
          <div style={styles.modalBox} onClick={(e) => e.stopPropagation()}>
            <button style={styles.closeModalBtn} onClick={() => setPreviewPhoto(null)}>
              <X size={20} color="#FFFFFF" />
            </button>
            <img src={previewPhoto} alt="Customer uploaded review" style={styles.fullPhoto} />
          </div>
        </div>
      )}
    </div>
  );
};

const styles: { [key: string]: React.CSSProperties } = {
  container: {
    padding: '32px',
    maxWidth: '1380px',
    margin: '0 auto',
  },
  headerRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: '24px',
  },
  pageTitle: {
    fontSize: '26px',
    fontWeight: 700,
    color: '#07152B',
    margin: '0 0 6px 0',
    letterSpacing: '-0.02em',
  },
  pageSub: {
    fontSize: '14px',
    color: '#64748B',
    margin: 0,
  },
  refreshBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    backgroundColor: '#FFFFFF',
    border: '1px solid #E2E8F0',
    borderRadius: '10px',
    padding: '10px 16px',
    fontSize: '13px',
    fontWeight: 600,
    color: '#07152B',
    cursor: 'pointer',
    boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
  },
  kpiGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
    gap: '16px',
    marginBottom: '24px',
  },
  kpiCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: '14px',
    padding: '18px 20px',
    border: '1px solid #E2E8F0',
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
    boxShadow: '0 1px 4px rgba(0,0,0,0.03)',
  },
  kpiIconBoxNavy: {
    width: '44px',
    height: '44px',
    borderRadius: '12px',
    backgroundColor: '#07152B',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  kpiIconBoxAmber: {
    width: '44px',
    height: '44px',
    borderRadius: '12px',
    backgroundColor: 'rgba(217, 119, 6, 0.12)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  kpiIconBoxGreen: {
    width: '44px',
    height: '44px',
    borderRadius: '12px',
    backgroundColor: 'rgba(22, 163, 74, 0.12)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  kpiIconBoxBlue: {
    width: '44px',
    height: '44px',
    borderRadius: '12px',
    backgroundColor: 'rgba(37, 99, 235, 0.12)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  kpiValue: {
    fontSize: '22px',
    fontWeight: 700,
    color: '#07152B',
  },
  kpiLabel: {
    fontSize: '12.5px',
    color: '#64748B',
    marginTop: '2px',
    fontWeight: 500,
  },
  filterCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: '14px',
    padding: '16px 20px',
    border: '1px solid #E2E8F0',
    marginBottom: '24px',
    boxShadow: '0 1px 4px rgba(0,0,0,0.03)',
  },
  tabsRow: {
    display: 'flex',
    gap: '8px',
    borderBottom: '1px solid #F1F5F9',
    paddingBottom: '12px',
    marginBottom: '14px',
    flexWrap: 'wrap',
  },
  filterTab: {
    backgroundColor: 'transparent',
    border: 'none',
    padding: '8px 16px',
    borderRadius: '8px',
    fontSize: '13px',
    fontWeight: 600,
    color: '#64748B',
    cursor: 'pointer',
    transition: 'all 0.15s ease',
  },
  filterTabActive: {
    backgroundColor: '#07152B',
    color: '#DFB76C',
  },
  filterSubRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: '16px',
    flexWrap: 'wrap',
  },
  statusPillsRow: {
    display: 'flex',
    gap: '8px',
    flexWrap: 'wrap',
  },
  statusPillBtn: {
    backgroundColor: '#F8FAFC',
    border: '1px solid #E2E8F0',
    borderRadius: '20px',
    padding: '6px 14px',
    fontSize: '12px',
    fontWeight: 600,
    color: '#64748B',
    cursor: 'pointer',
  },
  statusPillBtnActive: {
    backgroundColor: 'rgba(223, 183, 108, 0.2)',
    borderColor: '#DFB76C',
    color: '#07152B',
  },
  searchForm: {
    display: 'flex',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    border: '1px solid #E2E8F0',
    borderRadius: '10px',
    overflow: 'hidden',
    width: '360px',
    maxWidth: '100%',
  },
  searchInput: {
    border: 'none',
    backgroundColor: 'transparent',
    padding: '8px 10px',
    fontSize: '13px',
    color: '#07152B',
    flex: 1,
    outline: 'none',
  },
  clearSearchBtn: {
    border: 'none',
    backgroundColor: 'transparent',
    cursor: 'pointer',
    padding: '4px 6px',
  },
  searchSubmitBtn: {
    backgroundColor: '#07152B',
    color: '#DFB76C',
    border: 'none',
    padding: '8px 14px',
    fontSize: '12px',
    fontWeight: 600,
    cursor: 'pointer',
  },
  reviewsList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
  reviewCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: '14px',
    border: '1px solid #E2E8F0',
    boxShadow: '0 1px 4px rgba(0,0,0,0.03)',
    overflow: 'hidden',
  },
  cardHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '14px 20px',
    backgroundColor: '#F8FAFC',
    borderBottom: '1px solid #F1F5F9',
    flexWrap: 'wrap',
    gap: '12px',
  },
  targetInfo: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  targetThumb: {
    width: '42px',
    height: '42px',
    borderRadius: '8px',
    objectFit: 'cover',
    border: '1px solid #E2E8F0',
  },
  targetBadgeRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    marginBottom: '2px',
  },
  typeBadge: {
    fontSize: '11px',
    fontWeight: 700,
    padding: '2px 8px',
    borderRadius: '6px',
    border: '1px solid transparent',
  },
  targetCategoryText: {
    fontSize: '11px',
    color: '#64748B',
    fontWeight: 500,
  },
  targetTitleText: {
    fontSize: '14px',
    fontWeight: 700,
    color: '#07152B',
  },
  headerRight: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
  },
  statusBadge: {
    display: 'flex',
    alignItems: 'center',
    fontSize: '12px',
    fontWeight: 700,
    padding: '5px 12px',
    borderRadius: '20px',
  },
  helpfulBadge: {
    display: 'flex',
    alignItems: 'center',
    fontSize: '12px',
    fontWeight: 600,
    color: '#2563EB',
    backgroundColor: '#EFF6FF',
    padding: '5px 10px',
    borderRadius: '20px',
    border: '1px solid #BFDBFE',
  },
  cardBody: {
    padding: '20px',
    display: 'grid',
    gridTemplateColumns: '280px 1fr',
    gap: '24px',
  },
  authorCol: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '12px',
    borderRight: '1px solid #F1F5F9',
    paddingRight: '16px',
  },
  authorAvatarWrap: {
    flexShrink: 0,
  },
  authorAvatarImg: {
    width: '44px',
    height: '44px',
    borderRadius: '22px',
    objectFit: 'cover',
  },
  authorAvatarPlaceholder: {
    width: '44px',
    height: '44px',
    borderRadius: '22px',
    backgroundColor: '#07152B',
    color: '#DFB76C',
    fontSize: '16px',
    fontWeight: 700,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  authorNameRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
  },
  authorNameText: {
    fontSize: '14px',
    fontWeight: 700,
    color: '#07152B',
  },
  authorSubText: {
    fontSize: '12px',
    color: '#64748B',
    marginTop: '2px',
  },
  verifiedBadgeBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    border: '1px solid transparent',
    borderRadius: '6px',
    padding: '4px 8px',
    fontSize: '11px',
    fontWeight: 600,
    marginTop: '8px',
    cursor: 'pointer',
    transition: 'all 0.15s ease',
  },
  contentCol: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
  },
  ratingAndDateRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  starsRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '3px',
  },
  ratingNumText: {
    fontSize: '12px',
    fontWeight: 700,
    color: '#07152B',
    marginLeft: '6px',
  },
  dateText: {
    fontSize: '12px',
    color: '#94A3B8',
  },
  reviewTitleText: {
    fontSize: '15px',
    fontWeight: 700,
    color: '#07152B',
    marginTop: '4px',
  },
  reviewCommentText: {
    fontSize: '13.5px',
    color: '#334155',
    lineHeight: 1.6,
  },
  photosRow: {
    display: 'flex',
    gap: '10px',
    marginTop: '10px',
    flexWrap: 'wrap',
  },
  photoThumbWrap: {
    position: 'relative',
    width: '64px',
    height: '64px',
    borderRadius: '8px',
    overflow: 'hidden',
    cursor: 'pointer',
    border: '1px solid #E2E8F0',
  },
  photoThumb: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
  },
  photoOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.3)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    opacity: 0,
    transition: 'opacity 0.2s ease',
  },
  cardFooter: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '12px 20px',
    backgroundColor: '#FAFAFA',
    borderTop: '1px solid #F1F5F9',
    flexWrap: 'wrap',
    gap: '12px',
  },
  reviewIdText: {
    fontSize: '11px',
    color: '#94A3B8',
    fontFamily: 'monospace',
  },
  actionsRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  approveBtn: {
    display: 'flex',
    alignItems: 'center',
    backgroundColor: '#16A34A',
    color: '#FFFFFF',
    border: 'none',
    padding: '7px 14px',
    borderRadius: '8px',
    fontSize: '12px',
    fontWeight: 600,
    cursor: 'pointer',
    boxShadow: '0 1px 3px rgba(22, 163, 74, 0.2)',
  },
  rejectBtn: {
    display: 'flex',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    color: '#DC2626',
    border: '1px solid #FCA5A5',
    padding: '7px 14px',
    borderRadius: '8px',
    fontSize: '12px',
    fontWeight: 600,
    cursor: 'pointer',
  },
  pendingBtn: {
    display: 'flex',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    color: '#D97706',
    border: '1px solid #FDE68A',
    padding: '7px 14px',
    borderRadius: '8px',
    fontSize: '12px',
    fontWeight: 600,
    cursor: 'pointer',
  },
  deleteBtn: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '32px',
    height: '32px',
    backgroundColor: '#FEE2E2',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
  },
  emptyState: {
    backgroundColor: '#FFFFFF',
    borderRadius: '14px',
    padding: '48px 24px',
    textAlign: 'center',
    border: '1px solid #E2E8F0',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyTitle: {
    fontSize: '16px',
    fontWeight: 700,
    color: '#07152B',
    margin: '0 0 4px 0',
  },
  emptySub: {
    fontSize: '13px',
    color: '#64748B',
    margin: 0,
  },
  modalOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(7, 21, 43, 0.85)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 9999,
    padding: '24px',
  },
  modalBox: {
    position: 'relative',
    maxWidth: '800px',
    maxHeight: '85vh',
    borderRadius: '12px',
    overflow: 'hidden',
    boxShadow: '0 10px 40px rgba(0,0,0,0.5)',
  },
  closeModalBtn: {
    position: 'absolute',
    top: '12px',
    right: '12px',
    backgroundColor: 'rgba(0,0,0,0.6)',
    border: 'none',
    width: '36px',
    height: '36px',
    borderRadius: '18px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
  },
  fullPhoto: {
    width: '100%',
    height: 'auto',
    maxHeight: '80vh',
    display: 'block',
    objectFit: 'contain',
  },
};
