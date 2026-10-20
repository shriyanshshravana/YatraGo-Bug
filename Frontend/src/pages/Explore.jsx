import { useEffect, useMemo, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { ArrowRight, SlidersHorizontal, Loader2, Sparkles } from 'lucide-react';
import MainLayout from '../layouts/MainLayout';
import SearchBar from '../components/SearchBar';
import DestinationCard from '../components/DestinationCard';
import { destinations as fallbackDestinations, travelStyles } from '../data/destinations';
import api from '../services/api';

export default function Explore() {
  const [p, setP] = useSearchParams();
  const [q, setQ] = useState('');
  const [style, setStyle] = useState(p.get('style') || 'All styles');
  const [region, setRegion] = useState('All India');
  const [apiDestinations, setApiDestinations] = useState([]);
  const [loading, setLoading] = useState(false);

  // Sync state if URL query param changes
  useEffect(() => {
    const styleFromUrl = p.get('style');
    if (styleFromUrl && styleFromUrl !== style) {
      setStyle(styleFromUrl);
    }
  }, [p]);

  useEffect(() => {
    let ignore = false;
    setLoading(true);

    const queryParams = new URLSearchParams();
    if (q.trim()) queryParams.set('search', q.trim());
    if (style && style !== 'All styles') queryParams.set('type', style);
    if (region && region !== 'All India') queryParams.set('region', region);

    api.get(`/destinations?${queryParams.toString()}`)
      .then(({ data }) => {
        if (!ignore && Array.isArray(data?.data) && data.data.length > 0) {
          const normalized = data.data.map((d) => ({
            ...d,
            id: d.slug || d._id,
          }));
          setApiDestinations(normalized);
        }
      })
      .catch(() => {
        // Fallback to static starter data on network error
      })
      .finally(() => {
        if (!ignore) setLoading(false);
      });

    return () => {
      ignore = true;
    };
  }, [q, style, region]);

  // Use API results if available, otherwise filter fallback destinations
  const list = useMemo(() => {
    if (apiDestinations.length > 0) {
      return apiDestinations;
    }
    return fallbackDestinations.filter(
      (d) =>
        `${d.name} ${d.state} ${d.type} ${d.region}`.toLowerCase().includes(q.toLowerCase()) &&
        (style === 'All styles' || d.type === style || (style === 'Beach' && d.type === 'Coastal')) &&
        (region === 'All India' || d.region === region)
    );
  }, [apiDestinations, q, style, region]);

  const handleStyleSelect = (s) => {
    setStyle(s);
    if (s === 'All styles') {
      setP({});
    } else {
      setP({ style: s });
    }
  };

  return (
    <MainLayout className="page-content">
      <div className="page-hero page-hero-explore">
        <span className="hero-kicker">
          <span /> THE MAP IS YOURS
        </span>
        <h1>
          Explore <em>India.</em>
        </h1>
        <p>Find your kind of place — from celebrated classics to quiet corners that reward a detour.</p>
        <div className="page-hero-bottom">
          <span>CURATED DESTINATIONS ACROSS INDIA</span>
          <span>CURATED FOR THE CURIOUS ✳</span>
        </div>
      </div>

      {/* Search and Secondary Filter Row */}
      <div className="explore-toolbar">
        <SearchBar value={q} onChange={setQ} />
        <label className="select-filter">
          <SlidersHorizontal size={16} />
          <select value={style} onChange={(e) => handleStyleSelect(e.target.value)} aria-label="Filter by travel style">
            {travelStyles.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </label>
        <label className="select-filter">
          <select value={region} onChange={(e) => setRegion(e.target.value)} aria-label="Filter by region">
            {['All India', 'North India', 'South India', 'East India', 'West India'].map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </label>
      </div>

      {/* Category Pills Bar */}
      <div
        className="category-pills"
        style={{
          display: 'flex',
          gap: '0.5rem',
          flexWrap: 'wrap',
          margin: '1.25rem 0',
          paddingBottom: '0.5rem',
        }}
      >
        {travelStyles.map((s) => {
          const isActive = style === s;
          return (
            <button
              key={s}
              type="button"
              onClick={() => handleStyleSelect(s)}
              className="interest-chip"
              style={{
                background: isActive ? 'var(--color-coral)' : 'var(--color-surface)',
                color: isActive ? '#FFFFFF' : 'var(--color-dark)',
                borderColor: isActive ? 'var(--color-coral)' : 'var(--color-border)',
                fontWeight: isActive ? 600 : 500,
                cursor: 'pointer',
                transition: 'all 0.2s ease',
              }}
            >
              {s}
            </button>
          );
        })}
      </div>

      {/* Results Count and Action */}
      <div className="results-row">
        <p>
          {loading ? (
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
              <Loader2 size={15} className="spin" /> Searching destinations...
            </span>
          ) : (
            <>
              <strong>{list.length}</strong> destinations to explore
              {style !== 'All styles' && ` in ${style}`}
              {region !== 'All India' && ` (${region})`}
            </>
          )}
        </p>
        <Link className="text-link" to="/create-trip">
          Plan a trip <ArrowRight size={16} />
        </Link>
      </div>

      {/* Destination Grid */}
      {list.length ? (
        <div className="destination-grid">
          {list.map((d) => (
            <DestinationCard key={d.id || d._id} destination={d} />
          ))}
        </div>
      ) : (
        <div className="empty-state large-empty">
          <span>🧭</span>
          <h3>No destinations match your filters</h3>
          <p>Try searching another keyword or clear your travel style filters.</p>
          <button
            className="button button-dark"
            onClick={() => {
              setQ('');
              handleStyleSelect('All styles');
              setRegion('All India');
            }}
          >
            Clear filters
          </button>
        </div>
      )}
    </MainLayout>
  );
}
