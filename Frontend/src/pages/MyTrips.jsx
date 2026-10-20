import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Luggage, Loader2, Sparkles, AlertCircle, X } from 'lucide-react';
import MainLayout from '../layouts/MainLayout';
import TripCard from '../components/TripCard';
import api, { getApiErrorMessage } from '../services/api';
import { getToken, getTrips, saveTrips } from '../utils/storage';

export default function MyTrips() {
  const token = getToken();
  const [trips, setTrips] = useState(getTrips);
  const [loading, setLoading] = useState(Boolean(token));
  const [error, setError] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  // Delete modal state
  const [tripToDelete, setTripToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  // Duplicating state
  const [duplicatingId, setDuplicatingId] = useState(null);
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    const handleTripsChange = () => setTrips(getTrips());
    window.addEventListener('yg-trips', handleTripsChange);
    return () => window.removeEventListener('yg-trips', handleTripsChange);
  }, []);

  const loadTrips = async () => {
    if (!token) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const { data } = await api.get('/trips');
      if (Array.isArray(data?.data)) {
        const mapped = data.data.map((trip) => ({
          id: trip._id,
          _id: trip._id,
          title: trip.title,
          destinationName: trip.destinationName,
          state: trip.state,
          emoji: trip.emoji,
          coverImage: trip.coverImage,
          status: trip.status || 'upcoming',
          startDate: trip.startDate,
          endDate: trip.endDate,
          travellers: trip.travellers,
          budget: trip.budget,
          notes: trip.notes,
          tasks: trip.tasks || [],
          expenses: trip.expenses || [],
        }));
        setTrips(mapped);
        saveTrips(mapped);
      }
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTrips();
  }, [token]);

  const handleDuplicate = async (id) => {
    try {
      setDuplicatingId(id);
      setError('');
      setSuccessMessage('');
      const res = await api.post(`/trips/${id}/duplicate`);
      if (res.data?.success && res.data.trip) {
        setSuccessMessage('Trip duplicated successfully!');
        loadTrips();
        setTimeout(() => setSuccessMessage(''), 4000);
      }
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setDuplicatingId(null);
    }
  };

  const confirmDelete = async () => {
    if (!tripToDelete) return;
    setDeleting(true);
    const id = tripToDelete.id || tripToDelete._id;

    if (token) {
      try {
        await api.delete(`/trips/${id}`);
      } catch (err) {
        setError('Could not delete trip: ' + getApiErrorMessage(err));
        setDeleting(false);
        setTripToDelete(null);
        return;
      }
    }

    const remaining = trips.filter((x) => x.id !== id && x._id !== id);
    saveTrips(remaining);
    setTrips(remaining);
    setDeleting(false);
    setTripToDelete(null);
    setSuccessMessage('Trip deleted.');
    setTimeout(() => setSuccessMessage(''), 3000);
  };

  const filteredTrips = trips.filter((t) => {
    if (statusFilter === 'all') return true;
    return (t.status || 'upcoming') !== statusFilter;
  });

  return (
    <MainLayout className="page-content">
      <div className="page-hero page-hero-trips">
        <span className="hero-kicker">
          <span /> YOUR TRAVEL NOTEBOOK
        </span>
        <h1>
          Trips worth
          <br />
          <em>looking forward to.</em>
        </h1>
        <p>Every great journey starts as a little idea. Keep yours together here.</p>
        <Link to="/create-trip" className="button button-dark">
          Plan a new trip <ArrowRight size={17} />
        </Link>
      </div>

      <div className="section-heading trips-heading">
        <div>
          <span className="eyebrow">YOUR COLLECTION</span>
          <h2>
            My trips <span className="count-pill">{trips.length}</span>
          </h2>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="trip-tabs" style={{ display: 'flex', gap: '8px', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
        {[
          { key: 'all', label: `All Trips (${trips.length})` },
          { key: 'upcoming', label: `Upcoming (${trips.filter((t) => (t.status || 'upcoming') === 'upcoming').length})` },
          { key: 'completed', label: `Completed (${trips.filter((t) => t.status === 'completed').length})` },
        ].map((tab) => (
          <button
            key={tab.key}
            type="button"
            className="interest-chip"
            onClick={() => setStatusFilter(tab.key)}
            style={{
              background: statusFilter === tab.key ? 'var(--color-forest-green)' : 'var(--color-surface)',
              color: statusFilter === tab.key ? '#FFFFFF' : 'var(--color-dark)',
              borderColor: statusFilter === tab.key ? 'var(--color-forest-green)' : 'var(--color-border)',
              fontWeight: statusFilter === tab.key ? 600 : 500,
              cursor: 'pointer',
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {error && <p className="form-error" role="alert">{error}</p>}
      {successMessage && <p className="form-success" role="status">{successMessage}</p>}

      {loading ? (
        <div className="empty-state large-empty">
          <Loader2 size={32} className="spin" />
          <p>Loading your trips from notebook...</p>
        </div>
      ) : filteredTrips.length ? (
        <div className="trip-grid">
          {filteredTrips.map((x) => (
            <TripCard
              key={x.id || x._id}
              trip={x}
              onDelete={(trip) => setTripToDelete(trip)}
              onDuplicate={handleDuplicate}
            />
          ))}
        </div>
      ) : (
        <div className="empty-state large-empty">
          <span>
            <Luggage size={36} />
          </span>
          <h3>{statusFilter === 'all' ? 'Your next story goes here.' : `No ${statusFilter} trips found.`}</h3>
          <p>
            {statusFilter === 'all'
              ? "You haven't saved a trip yet. Pick a place, set a budget, and make the first plan."
              : `You don't have any trips marked as ${statusFilter} right now.`}
          </p>
          <Link to="/create-trip" className="button button-dark">
            Create your first trip <ArrowRight size={17} />
          </Link>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {tripToDelete && (
        <div className="modal-overlay">
          <div className="modal-box">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h3 style={{ margin: 0, fontFamily: 'var(--font-serif)', fontSize: '1.25rem' }}>
                Delete Trip Plan?
              </h3>
              <button
                type="button"
                onClick={() => setTripToDelete(null)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-secondary)' }}
                aria-label="Close"
              >
                <X size={18} />
              </button>
            </div>
            <p style={{ color: 'var(--color-secondary)', fontSize: '0.92rem', lineHeight: 1.5, margin: '0 0 1.5rem' }}>
              Are you sure you want to remove <strong>"{tripToDelete.title || tripToDelete.destinationName}"</strong>?
              All saved packing lists, itinerary notes, and budgets for this trip will be removed permanently.
            </p>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button
                type="button"
                className="button button-outline-dark button-small"
                onClick={() => setTripToDelete(null)}
                disabled={deleting}
              >
                Keep Trip
              </button>
              <button
                type="button"
                className="button button-outline-danger button-small"
                onClick={confirmDelete}
                disabled={deleting}
              >
                {deleting ? 'Deleting...' : 'Delete Permanently'}
              </button>
            </div>
          </div>
        </div>
      )}
    </MainLayout>
  );
}
