import { Link } from 'react-router-dom';
import { CalendarDays, MapPin, Trash2, ArrowUpRight, Copy, Users } from 'lucide-react';
import { destinations } from '../data/destinations';

function formatTripDate(val) {
  if (!val) return null;
  const d = new Date(val);
  if (isNaN(d.getTime())) return val;
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

export default function TripCard({ trip: t, onDelete, onDuplicate }) {
  // Find destination cover image from catalog if coverImage is not explicitly set
  const destinationMatch = destinations.find(
    (d) =>
      d.name.toLowerCase() === (t.destinationName || t.destination || '').toLowerCase() ||
      d.id === (t.destinationSlug || t.destinationId)
  );

  const coverImage = t.coverImage || destinationMatch?.image;
  const status = (t.status || 'upcoming').toLowerCase();

  const formattedStart = formatTripDate(t.startDate);
  const formattedEnd = formatTripDate(t.endDate);
  const dateDisplay = formattedStart
    ? formattedEnd && formattedEnd !== formattedStart
      ? `${formattedStart} – ${formattedEnd}`
      : formattedStart
    : 'Dates flexible';

  return (
    <article className="trip-card">
      <div className="trip-card-art">
        {coverImage ? (
          <img
            src={coverImage}
            alt={t.destinationName || t.destination || 'Trip'}
            className="trip-card-bg-img"
            loading="lazy"
            onError={(e) => {
              e.currentTarget.style.display = 'none';
            }}
          />
        ) : null}
        <div className="trip-card-art-overlay" />

        <span className="trip-card-emoji-badge">
          {t.emoji || destinationMatch?.emoji || '🧳'}
        </span>

        <span className={`trip-status-pill status-${status}`}>
          {status}
        </span>
      </div>

      <div className="trip-card-content">
        <div className="destination-location">
          <MapPin size={13} />
          <span>{t.state ? `${t.destinationName || t.destination}, ${t.state}` : (t.destinationName || t.destination)}</span>
        </div>

        <h3>
          <Link to={`/trip/${t.id || t._id}`}>{t.title || `${t.destinationName || 'India'} Journey`}</Link>
        </h3>

        <div className="trip-card-details">
          <p className="trip-meta-item">
            <CalendarDays size={14} />
            <span>{dateDisplay}</span>
          </p>

          {t.travellers && (
            <p className="trip-meta-item">
              <Users size={14} />
              <span>{t.travellers} traveller{Number(t.travellers) === 1 ? 's' : ''}</span>
            </p>
          )}
        </div>

        <div className="trip-card-bottom">
          <div className="trip-budget-display">
            <strong>₹{Number(t.budget || 0).toLocaleString('en-IN')}</strong>
            <small>estimated budget</small>
          </div>

          <div className="trip-card-actions">
            {onDuplicate && (
              <button
                type="button"
                className="round-control"
                onClick={() => onDuplicate(t.id || t._id)}
                title="Duplicate trip plan"
                aria-label="Duplicate trip"
              >
                <Copy size={15} />
              </button>
            )}

            <Link
              className="round-control"
              to={`/trip/${t.id || t._id}`}
              aria-label="Open trip workspace"
              title="Open workspace"
            >
              <ArrowUpRight size={17} />
            </Link>

            {onDelete && (
              <button
                type="button"
                className="round-control danger-hover"
                onClick={() => onDelete(t)}
                aria-label="Delete trip"
                title="Delete trip"
              >
                <Trash2 size={15} />
              </button>
            )}
          </div>
        </div>
      </div>
    </article>
  );
}
