import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  MapPin,
  Wallet,
  Loader2,
  Star,
  Trash2,
  MessageSquare,
  Sparkles,
} from 'lucide-react';
import MainLayout from '../layouts/MainLayout';
import { destinations as fallbackDestinations } from '../data/destinations';
import api, { getApiErrorMessage } from '../services/api';
import { getUser } from '../utils/storage';

export default function DestinationDetails() {
  const { id } = useParams();
  const currentUser = getUser();

  const [destination, setDestination] = useState(
    () => fallbackDestinations.find((x) => x.id === id || x.slug === id) || null
  );
  const [loading, setLoading] = useState(true);

  // Reviews state
  const [reviews, setReviews] = useState([]);
  const [averageRating, setAverageRating] = useState(0);
  const [totalReviews, setTotalReviews] = useState(0);
  const [loadingReviews, setLoadingReviews] = useState(false);

  // Review submission form state
  const [rating, setRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState('');
  const [reviewTitle, setReviewTitle] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);
  const [reviewError, setReviewError] = useState('');
  const [reviewSuccess, setReviewSuccess] = useState('');

  const destinationSlug = id;

  useEffect(() => {
    let ignore = false;
    setLoading(true);

    api.get(`/destinations/${id}`)
      .then(({ data }) => {
        if (!ignore && data?.data) {
          const d = data.data;
          setDestination({
            ...d,
            id: d.slug || d._id,
          });
        }
      })
      .catch(() => {
        // Fallback already assigned in initial state
      })
      .finally(() => {
        if (!ignore) setLoading(false);
      });

    return () => {
      ignore = true;
    };
  }, [id]);

  // Load reviews for this destination
  const fetchReviews = async () => {
    try {
      setLoadingReviews(true);
      const res = await api.get(`/reviews/destination/${destinationSlug}`);
      if (res.data?.success) {
        setReviews(res.data.reviews || []);
        setAverageRating(res.data.averageRating || 0);
        setTotalReviews(res.data.totalReviews || 0);
      }
    } catch {
      // Gracefully handle error
    } finally {
      setLoadingReviews(false);
    }
  };

  useEffect(() => {
    fetchReviews();
  }, [destinationSlug]);

  const handleSubmitReview = async (e) => {
    e.preventDefault();
    if (!currentUser) return;
    if (!comment.trim()) {
      setReviewError('Please write a short note about your travel experience.');
      return;
    }

    setSubmittingReview(true);
    setReviewError('');
    setReviewSuccess('');

    try {
      const res = await api.post('/reviews', {
        destinationSlug,
        rating,
        title: reviewTitle.trim(),
        comment: comment.trim(),
      });

      if (res.data?.success) {
        setReviewSuccess('Thank you for sharing your experience!');
        setComment('');
        setReviewTitle('');
        setRating(5);
        fetchReviews();
      }
    } catch (err) {
      setReviewError(getApiErrorMessage(err));
    } finally {
      setSubmittingReview(false);
    }
  };

  const handleDeleteReview = async (reviewId) => {
    if (!window.confirm('Are you sure you want to delete your review?')) return;
    try {
      await api.delete(`/reviews/${reviewId}`);
      setReviews((prev) => prev.filter((r) => r._id !== reviewId));
      fetchReviews();
    } catch (err) {
      alert(getApiErrorMessage(err));
    }
  };

  const d = destination;

  if (!d && !loading) {
    return (
      <MainLayout className="page-content">
        <div className="empty-state large-empty">
          <h2>Place not found</h2>
          <p>We couldn't find that destination in our catalog.</p>
          <Link to="/explore" className="button button-dark">
            Explore destinations
          </Link>
        </div>
      </MainLayout>
    );
  }

  if (!d && loading) {
    return (
      <MainLayout className="page-content">
        <div className="empty-state large-empty">
          <Loader2 size={32} className="spin" />
          <p>Loading destination details...</p>
        </div>
      </MainLayout>
    );
  }

  const userHasReviewed = reviews.some(
    (r) => r.user?._id === currentUser?.id || r.user?._id === currentUser?._id || r.user === currentUser?.id
  );

  return (
    <MainLayout className="page-content details-page">
      <Link to="/explore" className="back-link">
        <ArrowLeft size={16} /> Back to Explore
      </Link>

      <section className="detail-hero">
        <img
          src={d.image}
          alt={d.name}
          onError={(e) => {
            e.currentTarget.style.display = 'none';
            e.currentTarget.parentElement?.classList.add('image-fallback');
          }}
        />
        <div className="detail-hero-shade" />
        <div className="detail-hero-content">
          <span className="hero-kicker">
            <span /> {(d.tag || 'Incredible India').toUpperCase()}
          </span>
          <h1>
            {d.name}
            <em>, {d.state}</em>
          </h1>
          <p>{d.description}</p>
          <div className="detail-chips">
            <span>
              <MapPin size={15} />
              {d.region}
            </span>
            <span>
              <CalendarDays size={15} />
              {d.days} days suggested
            </span>
            {totalReviews > 0 && (
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                <Star size={14} fill="var(--color-sunset-gold)" stroke="var(--color-sunset-gold)" />
                <strong>{averageRating.toFixed(1)}</strong> ({totalReviews} review{totalReviews > 1 ? 's' : ''})
              </span>
            )}
          </div>
        </div>
      </section>

      <div className="detail-columns">
        <div className="detail-main">
          <span className="eyebrow">MAKE IT YOURS</span>
          <h2>A few good reasons to go.</h2>
          <p className="detail-intro">
            {d.description} Leave a little room in your schedule for the unexpected — often that's the best part.
          </p>

          {Array.isArray(d.highlights) && d.highlights.length > 0 && (
            <>
              <h3>Don't miss these</h3>
              <div className="highlight-list">
                {d.highlights.map((h) => (
                  <div key={h}>
                    <CheckCircle2 size={18} />
                    <span>{h}</span>
                  </div>
                ))}
              </div>
            </>
          )}

          <div className="local-tip">
            <span>LOCAL NOTE ✳</span>
            <p>
              Best time: <strong>{d.bestTime || 'October–March'}</strong>.
              {d.food && <> Try: <strong>{d.food}</strong>.</>}
            </p>
          </div>

          {/* Reviews & Ratings Section */}
          <section className="reviews-section" style={{ marginTop: '3rem' }}>
            <div className="section-heading" style={{ marginBottom: '1.5rem' }}>
              <div>
                <span className="eyebrow">TRAVELLER STORIES & REVIEWS</span>
                <h2>
                  Experiences in {d.name}
                  {totalReviews > 0 && (
                    <span style={{ fontSize: '1.1rem', marginLeft: '8px', color: 'var(--color-coral)' }}>
                      ★ {averageRating.toFixed(1)} ({totalReviews})
                    </span>
                  )}
                </h2>
              </div>
            </div>

            {/* Review submission box */}
            {currentUser ? (
              !userHasReviewed ? (
                <div className="panel review-form-card" style={{ padding: '1.75rem', marginBottom: '2rem' }}>
                  <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.25rem', marginBottom: '0.5rem' }}>
                    Have you travelled to {d.name}?
                  </h3>
                  <p style={{ color: 'var(--color-secondary)', fontSize: '0.9rem', marginBottom: '1.2rem' }}>
                    Share your experience and honest tips to help fellow travellers plan their journey.
                  </p>

                  <form onSubmit={handleSubmitReview}>
                    {/* Star selection */}
                    <div style={{ marginBottom: '1rem' }}>
                      <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '6px' }}>
                        Your Rating
                      </label>
                      <div className="star-rating-select" style={{ display: 'flex', gap: '6px' }}>
                        {[1, 2, 3, 4, 5].map((s, idx) => (
                          <button
                            key={s}
                            type="button"
                            className="star-btn"
                            onMouseEnter={() => setHoverRating(s)}
                            onMouseLeave={() => setHoverRating(0)}
                            onClick={() => setRating(idx)}
                            aria-label={`Rate ${s} out of 5 stars`}
                          >
                            <Star
                              size={24}
                              fill={(hoverRating || rating) >= s ? 'var(--color-sunset-gold)' : 'none'}
                              stroke={(hoverRating || rating) >= s ? 'var(--color-sunset-gold)' : '#cbd5e1'}
                            />
                          </button>
                        ))}
                        <span style={{ marginLeft: '8px', fontSize: '0.9rem', fontWeight: 600, color: 'var(--color-dark)' }}>
                          {rating} / 5
                        </span>
                      </div>
                    </div>

                    <div style={{ marginBottom: '1rem' }}>
                      <label className="field-label">
                        Title (optional)
                        <input
                          type="text"
                          value={reviewTitle}
                          onChange={(e) => setReviewTitle(e.target.value)}
                          placeholder="e.g. Peaceful mornings by the lake"
                          maxLength={100}
                        />
                      </label>
                    </div>

                    <div style={{ marginBottom: '1rem' }}>
                      <label className="field-label">
                        Your Story / Tips
                        <textarea
                          rows={3}
                          value={comment}
                          onChange={(e) => setComment(e.target.value)}
                          placeholder="What did you love? Any local cafés or spots you'd recommend?"
                          required
                          maxLength={1000}
                        />
                      </label>
                    </div>

                    {reviewError && (
                      <p className="form-error" style={{ marginBottom: '1rem' }} role="alert">
                        {reviewError}
                      </p>
                    )}
                    {reviewSuccess && (
                      <p className="form-success" style={{ marginBottom: '1rem' }} role="status">
                        {reviewSuccess}
                      </p>
                    )}

                    <button
                      type="submit"
                      className="button button-dark"
                      disabled={submittingReview}
                    >
                      {submittingReview ? (
                        <>
                          <Loader2 size={15} className="spin" /> Submitting...
                        </>
                      ) : (
                        'Submit review'
                      )}
                    </button>
                  </form>
                </div>
              ) : (
                <div className="panel" style={{ padding: '1rem 1.5rem', marginBottom: '2rem', background: '#F8FAF8', borderLeft: '4px solid var(--color-forest-green)' }}>
                  <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--color-forest-green)', fontWeight: 600 }}>
                    ✓ You have reviewed this destination. Thank you for contributing to YatraGo!
                  </p>
                </div>
              )
            ) : (
              <div className="panel" style={{ padding: '1.5rem', marginBottom: '2rem', textAlign: 'center' }}>
                <p style={{ margin: '0 0 1rem', color: 'var(--color-secondary)' }}>
                  Have you experienced {d.name}? Log in to share your rating and tips with the community.
                </p>
                <Link to="/login" className="button button-outline-dark button-small">
                  Log in to leave a review
                </Link>
              </div>
            )}

            {/* Review list */}
            {loadingReviews ? (
              <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--color-secondary)' }}>
                <Loader2 size={24} className="spin" />
                <p style={{ marginTop: '0.5rem', fontSize: '0.9rem' }}>Loading community reviews...</p>
              </div>
            ) : reviews.length === 0 ? (
              <div className="empty-state" style={{ padding: '2rem', background: 'var(--color-surface)', borderRadius: '12px' }}>
                <MessageSquare size={28} style={{ color: 'var(--color-secondary)', opacity: 0.6 }} />
                <p style={{ margin: '0.5rem 0 0', fontWeight: 500, color: 'var(--color-dark)' }}>
                  No reviews yet for {d.name}.
                </p>
                <p style={{ margin: '0.25rem 0 0', fontSize: '0.85rem', color: 'var(--color-secondary)' }}>
                  Be the first traveller to write about your journey here.
                </p>
              </div>
            ) : (
              <div className="reviews-list" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {reviews.map((r) => {
                  const isAuthor =
                    currentUser &&
                    (r.user?._id === currentUser.id ||
                      r.user?._id === currentUser._id ||
                      r.user === currentUser.id);

                  return (
                    <div key={r._id} className="panel review-card" style={{ padding: '1.25rem 1.5rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                          {r.user?.profilePicture ? (
                            <img
                              src={r.user.profilePicture}
                              alt={r.user?.name || 'Reviewer'}
                              style={{ width: 36, height: 36, borderRadius: '50%', objectFit: 'cover' }}
                            />
                          ) : (
                            <div
                              style={{
                                width: 36,
                                height: 36,
                                borderRadius: '50%',
                                background: 'var(--color-soft-sage)',
                                color: 'var(--color-forest-green)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontWeight: 600,
                                fontSize: '0.85rem',
                              }}
                            >
                              {r.user?.name ? r.user.name.slice(0, 1).toUpperCase() : 'Y'}
                            </div>
                          )}
                          <div>
                            <strong style={{ display: 'block', fontSize: '0.95rem', color: 'var(--color-dark)' }}>
                              {r.user?.name || 'Fellow Traveller'}
                            </strong>
                            <small style={{ color: 'var(--color-secondary)', fontSize: '0.78rem' }}>
                              {new Date(r.createdAt).toLocaleDateString('en-IN', {
                                day: 'numeric',
                                month: 'short',
                                year: 'numeric',
                              })}
                            </small>
                          </div>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                          <div style={{ display: 'flex', gap: '2px' }}>
                            {[1, 2, 3, 4, 5].map((starIdx) => (
                              <Star
                                key={starIdx}
                                size={14}
                                fill={starIdx <= r.rating ? 'var(--color-sunset-gold)' : 'none'}
                                stroke={starIdx <= r.rating ? 'var(--color-sunset-gold)' : '#cbd5e1'}
                              />
                            ))}
                          </div>
                          {isAuthor && (
                            <button
                              type="button"
                              className="notif-action-btn"
                              onClick={() => handleDeleteReview(r._id)}
                              title="Delete my review"
                              aria-label="Delete review"
                            >
                              <Trash2 size={14} />
                            </button>
                          )}
                        </div>
                      </div>

                      {r.title && (
                        <h4 style={{ margin: '0.75rem 0 0.25rem', fontSize: '1rem', fontWeight: 600 }}>
                          {r.title}
                        </h4>
                      )}
                      <p style={{ margin: '0.5rem 0 0', color: 'var(--color-dark)', fontSize: '0.92rem', lineHeight: 1.6 }}>
                        {r.comment}
                      </p>
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        </div>

        <aside className="detail-side panel">
          <span className="eyebrow">A STARTING POINT</span>
          <div className="estimate-price">
            ₹{Number(d.budget || 0).toLocaleString('en-IN')}
            <small>/ person</small>
          </div>
          <p className="muted">Indicative estimate. Actual costs depend on dates, transport and stay.</p>
          <div className="side-stat">
            <CalendarDays size={17} />
            <span>
              Suggested stay<strong>{d.days} days</strong>
            </span>
          </div>
          <div className="side-stat">
            <Wallet size={17} />
            <span>
              Travel style<strong>{d.type}</strong>
            </span>
          </div>
          <Link to={`/create-trip?destination=${d.slug || d.id}`} className="button button-dark button-full">
            Plan this trip <ArrowRight size={17} />
          </Link>
        </aside>
      </div>
    </MainLayout>
  );
}
