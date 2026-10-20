import { useMemo, useState } from 'react';
import { ArrowRight, ArrowDownRight, Compass, Sparkles, MapPin, Calendar, Heart, ShieldCheck } from 'lucide-react';
import { Link } from 'react-router-dom';
import MainLayout from '../layouts/MainLayout';
import DestinationCarousel from '../components/DestinationCarousel';
import DestinationCard from '../components/DestinationCard';
import SearchBar from '../components/SearchBar';
import { destinations } from '../data/destinations';

const moods = [
  ['Mountains', 'Cool air, winding roads & slow mornings', '🏔️', 'Mountains'],
  ['Coastlines', 'Salt in the air, sand under your feet', '🌊', 'Beach'],
  ['Culture', 'Old cities, craft, food & living history', '🪔', 'Culture'],
  ['Nature', 'Green escapes and quiet places', '🌿', 'Nature'],
];

export default function Home() {
  const [q, setQ] = useState('');

  const matches = useMemo(
    () =>
      destinations.filter((d) =>
        `${d.name} ${d.state} ${d.type} ${d.region}`.toLowerCase().includes(q.toLowerCase())
      ),
    [q]
  );

  return (
    <>
      <section className="hero">
        <div className="hero-image" />
        <div className="hero-shade" />
        <div className="hero-inner">
          <div className="hero-copy">
            <span className="hero-kicker">
              <span /> YOUR INDIA, YOUR STORY
            </span>
            <h1>
              Take the scenic
              <br />
              <em>route.</em>
            </h1>
            <p>
              From Himalayan hideaways to sunlit coastal lanes — plan a trip that feels like <i>you.</i>
            </p>
            <div className="hero-actions">
              <Link to="/explore" className="button button-light">
                Explore India <ArrowRight size={17} />
              </Link>
              <Link to="/create-trip" className="button button-outline-light">
                Plan my journey <ArrowDownRight size={17} />
              </Link>
            </div>
            <div className="hero-note">
              <span className="hero-note-icon">
                <Compass size={17} />
              </span>
              <span>
                <strong>Made for curious travellers</strong>
                <small>Discover more than just the usual stops.</small>
              </span>
            </div>
          </div>
          <div className="hero-stamp">
            <span>IN</span>
            <small>
              INCREDIBLE
              <br />
              INDIA
            </small>
            <i>✳</i>
          </div>
          <div className="hero-caption">27°N — SOMEWHERE BEAUTIFUL</div>
        </div>

        {/* Animated scroll indicator */}
        <div className="hero-bottom-rule">
          <span>01</span>
          <span>THE JOURNEY IS YOURS</span>
          <span className="hero-scroll-indicator">
            SCROLL TO DISCOVER <span className="scroll-arrow">↓</span>
          </span>
        </div>
      </section>

      <MainLayout>
        {/* Destination Search Section */}
        <section className="quick-search-section">
          <div className="quick-search-copy">
            <span className="eyebrow">WHERE TO NEXT?</span>
            <h2>
              A little inspiration
              <br />
              goes a long way.
            </h2>
          </div>
          <div className="quick-search-right">
            <p>Search a place, a state, or a travel style. Find a corner of India worth getting lost in.</p>
            <SearchBar value={q} onChange={setQ} />
          </div>
        </section>

        {q ? (
          <section className="section-block">
            <div className="section-heading">
              <div>
                <span className="eyebrow">SEARCH RESULTS</span>
                <h2>Places that match "{q}"</h2>
              </div>
              <Link className="text-link" to="/explore">
                All destinations <ArrowRight size={16} />
              </Link>
            </div>
            <div className="destination-grid">
              {matches.map((d) => (
                <DestinationCard key={d.id} destination={d} />
              ))}
            </div>
            {!matches.length && (
              <div className="empty-state">
                <p>No match yet for "{q}". Try searching “Rajasthan”, “mountains”, or “beach”.</p>
              </div>
            )}
          </section>
        ) : (
          <>
            {/* Curated destination collection */}
            <section className="section-block">
              <div className="section-heading">
                <div>
                  <span className="eyebrow">THE GOOD PLACES</span>
                  <h2>
                    Popular for a reason<span className="heading-dot">.</span>
                  </h2>
                  <p>India has a thousand ways to surprise you. Start with one.</p>
                </div>
                <Link className="text-link" to="/explore">
                  See all places <ArrowRight size={16} />
                </Link>
              </div>
              <DestinationCarousel items={destinations.slice(0, 8)} />
            </section>

            {/* Find Your Kind of India / Mood section */}
            <section className="mood-section">
              <div className="section-heading">
                <div>
                  <span className="eyebrow">FIND YOUR KIND OF INDIA</span>
                  <h2>What are you in the mood for?</h2>
                </div>
                <Sparkles className="section-sparkle" />
              </div>
              <div className="mood-grid">
                {moods.map((m, i) => (
                  <Link
                    key={m[0]}
                    to={`/explore?style=${encodeURIComponent(m[3])}`}
                    className={`mood-card mood-${i + 1}`}
                  >
                    <span className="mood-number">0{i + 1}</span>
                    <span className="mood-emoji">{m[2]}</span>
                    <h3>{m[0]}</h3>
                    <p>{m[1]}</p>
                    <ArrowRight size={19} className="mood-arrow" />
                  </Link>
                ))}
              </div>
            </section>

            {/* Editorial Features / Why YatraGo */}
            <section className="section-block" style={{ padding: '2rem 0' }}>
              <div className="section-heading">
                <div>
                  <span className="eyebrow">THE YATRAGO WAY</span>
                  <h2>Travel with intention.</h2>
                </div>
              </div>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
                  gap: '1.5rem',
                  marginTop: '1rem',
                }}
              >
                <div className="panel" style={{ padding: '1.8rem', background: '#FFFFFF' }}>
                  <div style={{ color: 'var(--color-coral)', marginBottom: '0.8rem' }}>
                    <MapPin size={24} />
                  </div>
                  <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.25rem', marginBottom: '0.5rem' }}>
                    Handcrafted Routes
                  </h3>
                  <p style={{ color: 'var(--color-secondary)', fontSize: '0.92rem', lineHeight: 1.6 }}>
                    Every recommendation is selected for its atmosphere, stories, and authentic local rhythm.
                  </p>
                </div>

                <div className="panel" style={{ padding: '1.8rem', background: '#FFFFFF' }}>
                  <div style={{ color: 'var(--color-coral)', marginBottom: '0.8rem' }}>
                    <Calendar size={24} />
                  </div>
                  <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.25rem', marginBottom: '0.5rem' }}>
                    Flexible Itineraries
                  </h3>
                  <p style={{ color: 'var(--color-secondary)', fontSize: '0.92rem', lineHeight: 1.6 }}>
                    Add packing lists, manage real budgets, and leave room for the spontaneous moments.
                  </p>
                </div>

                <div className="panel" style={{ padding: '1.8rem', background: '#FFFFFF' }}>
                  <div style={{ color: 'var(--color-coral)', marginBottom: '0.8rem' }}>
                    <ShieldCheck size={24} />
                  </div>
                  <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.25rem', marginBottom: '0.5rem' }}>
                    Authentic Community
                  </h3>
                  <p style={{ color: 'var(--color-secondary)', fontSize: '0.92rem', lineHeight: 1.6 }}>
                    Read verified reviews from fellow travellers who have explored these roads firsthand.
                  </p>
                </div>
              </div>
            </section>

            {/* Deep forest-green Callout: Your Next Chapter Starts Here */}
            <section className="plan-banner plan-banner-forest">
              <div className="travel-line-motif">
                <span>✦</span>
                <span>✦</span>
                <span>✦</span>
              </div>
              <div className="plan-banner-content">
                <span className="eyebrow" style={{ color: 'var(--color-sunset-gold)' }}>
                  YOUR NEXT CHAPTER STARTS HERE
                </span>
                <h2>
                  Good trips don't happen
                  <br />
                  by accident.
                </h2>
                <p>
                  Turn that “someday” daydream into a real plan — destinations, dates, budgets, and notebooks.
                </p>
                <div style={{ marginTop: '1.5rem' }}>
                  <Link to="/create-trip" className="button button-light">
                    Build my itinerary <ArrowRight size={17} />
                  </Link>
                </div>
              </div>
              <div className="banner-side-note">
                MAKE ROOM
                <br />
                FOR WONDER ✳
              </div>
            </section>
          </>
        )}
      </MainLayout>
    </>
  );
}
