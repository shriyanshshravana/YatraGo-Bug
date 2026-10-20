import { Link } from 'react-router-dom';
import { ArrowUpRight, Clock3, MapPin, Sparkles } from 'lucide-react';

export default function DestinationCard({ destination: d }) {
  return (
    <article className="destination-card">
      <Link className="destination-image-wrap" to={`/destination/${d.id || d.slug}`}>
        <img
          src={d.image}
          alt={`${d.name}, ${d.state}`}
          loading="lazy"
          onError={(e) => {
            e.currentTarget.style.display = 'none';
            e.currentTarget.parentElement?.classList.add('image-fallback');
          }}
        />
        {d.emoji && <span className="image-emoji">{d.emoji}</span>}
        {d.tag && <span className="destination-tag">{d.tag}</span>}
        <span className="card-arrow" aria-label="View destination">
          <ArrowUpRight size={19} />
        </span>
      </Link>

      <div className="destination-info">
        <div className="destination-location">
          <MapPin size={14} />
          <span>{d.state}</span>
          {d.type && (
            <span style={{ marginLeft: 'auto', fontSize: '0.75rem', color: 'var(--color-secondary)', fontWeight: 500 }}>
              {d.type}
            </span>
          )}
        </div>

        <h3>
          <Link to={`/destination/${d.id || d.slug}`}>{d.name}</Link>
        </h3>

        <p>{d.description}</p>

        <div className="card-meta">
          <span>
            <Clock3 size={14} />
            {d.days} days suggested
          </span>
          <strong>
            ₹{Number(d.budget || 0).toLocaleString('en-IN')}
            <small> / person*</small>
          </strong>
        </div>
      </div>
    </article>
  );
}
