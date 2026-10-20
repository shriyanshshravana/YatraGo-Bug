import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowRight, CalendarDays, Users, Wallet, Loader2 } from 'lucide-react';
import MainLayout from '../layouts/MainLayout';
import { destinations } from '../data/destinations';
import { getTrips, saveTrips, getToken, makeId } from '../utils/storage';
import api, { getApiErrorMessage } from '../services/api';

export default function CreateTrip() {
  const [p] = useSearchParams();
  const nav = useNavigate();
  const token = getToken();

  const [f, setF] = useState({
    destination: p.get('destination') || '',
    title: '',
    startDate: '',
    endDate: '',
    travellers: '2',
    budget: '',
    notes: '',
  });

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const today = new Date().toISOString().split('T')[0];

  const d = destinations.find((x) => x.id === f.destination || x.slug === f.destination);
  const travellersNum = Math.max(1, Number(f.travellers) || 1);
  const perPersonBudget = d ? Number(d.budget) : 2000;
  const minBudget = perPersonBudget * travellersNum;

  const change = (e) => {
    const { name, value } = e.target;
    setF((prev) => {
      const next = { ...prev, [name]: value };
      // When destination or traveller count changes, auto-suggest minimum budget if budget is empty or lower than min
      if (name === 'destination' || name === 'travellers') {
        const selectedDest = destinations.find(
          (x) => x.id === (name === 'destination' ? value : next.destination) || x.slug === (name === 'destination' ? value : next.destination)
        );
        const count = Math.max(1, Number(name === 'travellers' ? value : next.travellers) || 1);
        const required = (selectedDest ? Number(selectedDest.budget) : 2000) * count;
        if (!next.budget || Number(next.budget) < required) {
          next.budget = String(required);
        }
      }
      return next;
    });
  };

  async function submit(e) {
    e.preventDefault();
    setError('');

    if (!f.destination || !f.startDate || !f.endDate || !f.budget) {
      setError('Choose a destination, dates and a budget to create your trip.');
      return;
    }


    if (f.endDate < f.startDate) {
      setError('Return date must be the same as or after departure.');
      return;
    }

    // Bug Fix 2: Disallow unrealistic budgets lower than minimum per person * travellers
    if (Number(f.budget) < minBudget) {
      setError(
        `Total budget for ${travellersNum} traveller${travellersNum > 1 ? 's' : ''} to ${
          d ? d.name : 'this destination'
        } must be at least ₹${minBudget.toLocaleString('en-IN')} (₹${perPersonBudget.toLocaleString(
          'en-IN'
        )} per person).`
      );
      return;
    }

    setLoading(true);

    const tripPayload = {
      destinationName: d ? d.name : 'Incredible India',
      state: d ? d.state : '',
      emoji: d ? d.emoji : '🧳',
      title: f.title.trim() || `${d ? d.name : 'India'} escape`,
      startDate: f.startDate,
      endDate: f.endDate,
      travellers: Number(f.travellers),
      budget: Number(f.budget),
      notes: f.notes.trim(),
      tasks: [
        { text: 'Confirm travel tickets', done: false },
        { text: 'Shortlist places to stay', done: false },
        { text: 'Save important bookings', done: false },
      ],
      expenses: [],
      itinerary: [],
    };

    if (token) {
      try {
        const { data } = await api.post('/trips', tripPayload);
        const createdTrip = {
          ...data.data,
          id: data.data._id,
        };

        saveTrips([createdTrip, ...getTrips().filter((x) => x.id !== createdTrip.id)]);
        nav(`/trip/${createdTrip.id}`);
        return;
      } catch (err) {
        setError(getApiErrorMessage(err));
        setLoading(false);
        return;
      }
    }

    // Fallback if not authenticated: save locally with makeId and navigate
    const localTrip = {
      ...tripPayload,
      id: makeId(),
      createdAt: new Date().toISOString(),
    };
    saveTrips([localTrip, ...getTrips()]);
    nav(`/trip/${localTrip.id}`);
  }

  return (
    <MainLayout className="page-content create-page">
      <div className="form-intro">
        <span className="eyebrow">MAKE THE IDEA HAPPEN</span>
        <h1>
          Plan your next
          <br />
          <em>great escape.</em>
        </h1>
        <p>Start with a place. Add a few details. Leave space for happy accidents.</p>
      </div>

      <div className="create-layout">
        <form className="trip-form panel" onSubmit={submit}>
          <div className="form-section-title">
            <span>01</span>
            <div>
              <h2>The destination</h2>
              <p>Where are we headed?</p>
            </div>
          </div>

          <label className="field-label">
            Choose a destination
            <select name="destination" value={f.destination} onChange={change} required>
              <option value="">Select a place in India</option>
              {destinations.map((x) => (
                <option key={x.id} value={x.id}>
                  {x.name}, {x.state}
                </option>
              ))}
            </select>
          </label>

          {d && (
            <div className="selected-destination">
              <span>{d.emoji}</span>
              <div>
                <strong>
                  {d.name}, {d.state}
                </strong>
                <small>
                  {d.tag} · around ₹{Number(d.budget).toLocaleString('en-IN')} per person
                </small>
              </div>
              <Link to={`/destination/${d.id}`}>Details</Link>
            </div>
          )}

          <div className="form-section-title form-section-spaced">
            <span>02</span>
            <div>
              <h2>Set the dates</h2>
              <p>A rough plan is a good start.</p>
            </div>
          </div>

          <div className="form-two">
            <label className="field-label">
              <span>
                <CalendarDays size={15} /> Departure
              </span>
              <input
                type="date"
                name="startDate"
                value={f.startDate}
                onChange={change}
                required
              />
            </label>
            <label className="field-label">
              <span>
                <CalendarDays size={15} /> Return
              </span>
              <input
                type="date"
                name="endDate"
                min={f.startDate && f.startDate >= today ? f.startDate : today}
                value={f.endDate}
                onChange={change}
                required
              />
            </label>
          </div>

          <div className="form-section-title form-section-spaced">
            <span>03</span>
            <div>
              <h2>The practical bits</h2>
              <p>So the plan fits real life, too.</p>
            </div>
          </div>

          <label className="field-label">
            Trip name
            <input
              name="title"
              value={f.title}
              onChange={change}
              placeholder="e.g. Long weekend in the hills"
            />
          </label>

          <div className="form-two">
            <label className="field-label">
              <span>
                <Users size={15} /> Travellers
              </span>
              <select name="travellers" value={f.travellers} onChange={change}>
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => (
                  <option key={n}>{n}</option>
                ))}
              </select>
            </label>
            <label className="field-label">
              <span>
                <Wallet size={15} /> Total budget (₹)
              </span>
              <input
                type="number"
                name="budget"
                min={minBudget}
                value={f.budget}
                onChange={change}
                placeholder={String(minBudget)}
                required
              />
              <small style={{ display: 'block', marginTop: '4px', fontSize: '0.78rem', color: '#81776F' }}>
                Estimated min: ₹{minBudget.toLocaleString('en-IN')} (₹{perPersonBudget.toLocaleString('en-IN')} / person)
              </small>
            </label>
          </div>

          <label className="field-label">
            Trip notes
            <textarea
              name="notes"
              rows="3"
              value={f.notes}
              onChange={change}
              placeholder="Must-see places, food to try, anything to remember…"
            />
          </label>

          {error && (
            <p className="form-error" role="alert">
              {error}
            </p>
          )}

          <button className="button button-dark button-full" disabled={loading}>
            {loading ? (
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                <Loader2 size={16} className="spin" /> Saving trip to notebook...
              </span>
            ) : (
              <>
                Create my trip <ArrowRight size={17} />
              </>
            )}
          </button>
        </form>

        <aside className="create-aside">
          <div className="aside-quote">
            <span>“</span>
            <p>
              Collect moments,
              <br />
              not just places.
            </p>
            <small>A YATRAGO TRAVEL NOTE</small>
          </div>
          <div className="aside-help">
            <span className="eyebrow">A GOOD TIP</span>
            <h3>
              Plan the essentials.
              <br />
              Keep the magic open.
            </h3>
            <p>
              Book important bits early, but leave a free afternoon to follow a local recommendation or
              take the scenic detour.
            </p>
          </div>
        </aside>
      </div>
    </MainLayout>
  );
}
