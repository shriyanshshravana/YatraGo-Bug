import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, MapPin, Pencil, Save, Loader2 } from 'lucide-react';
import MainLayout from '../layouts/MainLayout';
import TodoList from '../components/TodoList';
import BudgetTracker from '../components/BudgetTracker';
import { getTrips, saveTrips, getToken } from '../utils/storage';
import api from '../services/api';

export default function TripWorkspace() {
  const { id } = useParams();
  const token = getToken();

  const [all, setAll] = useState(getTrips);
  const [trip, setTrip] = useState(() => all.find((t) => t.id === id || t._id === id) || null);
  const [edit, setEdit] = useState(false);
  const [title, setTitle] = useState('');
  const [loading, setLoading] = useState(true);

  // Load from backend API if token is present
  useEffect(() => {
    let ignore = false;
    if (!token) {
      setLoading(false);
      return;
    }

    setLoading(true);
    api.get(`/trips/${id}`)
      .then(({ data }) => {
        if (!ignore && data?.data) {
          const fetchedTrip = {
            ...data.data,
            id: data.data._id || id,
          };
          setTrip(fetchedTrip);
          setTitle(fetchedTrip.title || '');

          // Update local cache
          const updatedAll = all.map((t) => ((t.id === id || t._id === id) ? fetchedTrip : t));
          if (!updatedAll.some((t) => t.id === id || t._id === id)) {
            updatedAll.unshift(fetchedTrip);
          }
          saveTrips(updatedAll);
          setAll(updatedAll);
        }
      })
      .catch((err) => {
        console.warn('Could not fetch trip from API, using cached trip:', err.message);
      })
      .finally(() => {
        if (!ignore) setLoading(false);
      });

    return () => {
      ignore = true;
    };
  }, [id, token]);

  useEffect(() => {
    if (trip?.title) {
      setTitle(trip.title);
    }
  }, [trip?.title]);

  async function update(partial) {
    const updatedTrip = { ...trip, ...partial };
    setTrip(partial);

    // Update local cache immediately for reactivity
    const nextList = all.map((t) => ((t.id === id || t._id === id) ? updatedTrip : t));
    saveTrips(nextList);
    setAll(nextList);

    // Persist to backend if authenticated
    if (token) {
      try {
        await api.put(`/trips/${id}`, {
          title: updatedTrip.title,
          notes: updatedTrip.notes,
          budget: updatedTrip.budget,
          travellers: updatedTrip.travellers,
          tasks: updatedTrip.tasks,
          expenses: updatedTrip.expenses,
          itinerary: updatedTrip.itinerary,
        });
      } catch (err) {
        console.error('Failed to sync trip update to backend:', err.message);
      }
    }
  }

  if (!trip && !loading) {
    return (
      <MainLayout className="page-content">
        <div className="empty-state large-empty">
          <h2>We couldn't find that trip.</h2>
          <p>It may have been removed or you may need to log in to access it.</p>
          <Link className="button button-dark" to="/my-trips">
            Back to My Trips
          </Link>
        </div>
      </MainLayout>
    );
  }

  if (!trip && loading) {
    return (
      <MainLayout className="page-content">
        <div className="empty-state large-empty">
          <Loader2 size={32} className="spin" />
          <p>Loading your trip workspace...</p>
        </div>
      </MainLayout>
    );
  }

  const tasks = trip.tasks || [];
  const done = tasks.filter((t) => t.done).length;

  return (
    <MainLayout className="page-content workspace-page">
      <Link to="/my-trips" className="back-link">
        <ArrowLeft size={16} /> All my trips
      </Link>

      <section className="workspace-hero">
        <div className="workspace-emoji">{trip.emoji || '🧳'}</div>
        <div className="workspace-title">
          {edit ? (
            <form
              className="inline-edit"
              onSubmit={(e) => {
                e.preventDefault();
                update({ title: title.trim() || trip.title });
                setEdit(false);
              }}
            >
              <input value={title} onChange={(e) => setTitle(e.target.value)} />
              <button className="icon-button" aria-label="Save title">
                <Save size={17} />
              </button>
            </form>
          ) : (
            <>
              <span className="eyebrow">YOUR TRIP WORKSPACE</span>
              <h1>
                {trip.title || trip.destinationName}{' '}
                <button className="edit-title" onClick={() => setEdit(true)} aria-label="Edit title">
                  <Pencil size={15} />
                </button>
              </h1>
            </>
          )}
          <p>
            <MapPin size={15} />
            {trip.destinationName}
            {trip.state ? `, ${trip.state}` : ''}
          </p>
        </div>
        <div className="workspace-budget">
          <span>YOUR BUDGET</span>
          <strong>₹{Number(trip.budget || 0).toLocaleString('en-IN')}</strong>
          <small>{trip.travellers || 2} travellers</small>
        </div>
      </section>

      {trip.notes && (
        <div className="trip-note">
          <span className="eyebrow">YOUR NOTES</span>
          <p>{trip.notes}</p>
        </div>
      )}

      <div className="workspace-progress">
        <div>
          <span className="eyebrow">TRIP PREP</span>
          <h2>Little steps, big adventure.</h2>
        </div>
        <div className="prep-progress">
          <strong>
            {done} / {tasks.length}
          </strong>
          <span>tasks complete</span>
          <div className="progress-track">
            <span
              style={{
                width: `${tasks.length ? (done / tasks.length) * 100 : 0}%`,
              }}
            />
          </div>
        </div>
      </div>

      <div className="workspace-grid">
        <TodoList items={tasks} onChange={(nextTasks) => update({ tasks: nextTasks })} />
        <BudgetTracker
          budget={trip.budget}
          expenses={trip.expenses || []}
          onChange={(nextExpenses) => update({ expenses: nextExpenses })}
        />
      </div>

      <div className="workspace-bottom-tip">
        <span>✳</span>
        <p>
          <strong>A small reminder:</strong> keep copies of your tickets, share your plan with someone
          you trust, and check local travel updates before leaving.
        </p>
      </div>
    </MainLayout>
  );
}
