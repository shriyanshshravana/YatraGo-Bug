import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ArrowRight,
  CalendarDays,
  LogOut,
  MapPin,
  UserRound,
  Mail,
  Phone,
  Edit3,
  Save,
  CheckCircle2,
  Camera,
  Trash2,
  Loader2,
  UploadCloud,
  X,
  Compass,
  Home as HomeIcon,
} from 'lucide-react';
import MainLayout from '../layouts/MainLayout';
import api, { getApiErrorMessage } from '../services/api';
import { getUser, logoutUser, saveUser } from '../utils/storage';

const AVAILABLE_INTERESTS = [
  'Heritage & Forts',
  'Himalayan Treks',
  'Coastal & Beaches',
  'Backwaters',
  'Local Food & Cafés',
  'Slow Travel',
  'Photography',
  'Wildlife Safaris',
  'Spiritual Walks',
  'Art & Architecture',
];

export default function Profile() {
  const [u, setU] = useState(getUser());
  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);

  // Edit fields
  const [editName, setEditName] = useState('');
  const [editBio, setEditBio] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editHomeCity, setEditHomeCity] = useState('');
  const [editTravelStyle, setEditTravelStyle] = useState('');
  const [editInterests, setEditInterests] = useState([]);

  const [error, setError] = useState('');
  const [profileSuccess, setProfileSuccess] = useState('');
  const [saving, setSaving] = useState(false);

  // Profile Picture Upload State
  const fileInputRef = useRef(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [photoError, setPhotoError] = useState('');
  const [photoSuccess, setPhotoSuccess] = useState('');

  const nav = useNavigate();

  // Cleanup object URL on unmount or when preview changes
  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const [profileRes, tripsRes] = await Promise.allSettled([
          api.get('/auth/profile'),
          api.get('/trips'),
        ]);

        if (profileRes.status === 'fulfilled' && profileRes.value.data?.user) {
          const freshUser = profileRes.value.data.user;
          setU(freshUser);
          saveUser(freshUser);
          setEditName(freshUser.name || '');
          setEditBio(freshUser.bio || '');
          setEditPhone(freshUser.phone || '');
          setEditHomeCity(freshUser.homeCity || '');
          setEditTravelStyle(freshUser.travelStyle || 'Curious Explorer');
          setEditInterests(Array.isArray(freshUser.travelInterests) ? freshUser.travelInterests : []);
        }

        if (tripsRes.status === 'fulfilled' && Array.isArray(tripsRes.value.data?.data)) {
          setTrips(tripsRes.value.data.data);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, []);

  const handleFileSelect = (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;

    // Reset input value so selecting the same file again triggers onChange
    e.target.value = '';

    const validTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      setPhotoError('Unsupported file format. Please select a JPEG, PNG, or WebP image.');
      setPhotoSuccess('');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setPhotoError('Image size exceeds 5 MB. Please select a smaller photo.');
      setPhotoSuccess('');
      return;
    }

    setPhotoError('');
    setPhotoSuccess('');

    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }

    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl(objectUrl);
    setSelectedFile(file);
  };

  const handleUploadPhoto = async () => {
    if (!selectedFile) return;

    setUploadingPhoto(true);
    setPhotoError('');
    setPhotoSuccess('');

    const formData = new FormData();
    formData.append('profilePicture', selectedFile);

    try {
      // Allow browser to generate multipart boundary by setting Content-Type to undefined
      const res = await api.post('/users/profile-picture', formData, {
        headers: {
          'Content-Type': undefined,
        },
      });
      const updatedUser = res.data?.user || {
        ...u,
        profilePicture: res.data?.profilePicture,
        avatar: res.data?.profilePicture,
      };

      setU(updatedUser);
      saveUser(updatedUser);
      setPhotoSuccess('Profile picture updated successfully!');

      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
      setPreviewUrl(null);
      setSelectedFile(null);
    } catch (err) {
      setPhotoError(getApiErrorMessage(err));
    } finally {
      setUploadingPhoto(false);
    }
  };

  const handleCancelPreview = () => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    setPreviewUrl(null);
    setSelectedFile(null);
    setPhotoError('');
  };

  const handleRemovePhoto = async () => {
    if (uploadingPhoto) return;
    if (!window.confirm('Are you sure you want to remove your profile picture?')) return;

    setUploadingPhoto(true);
    setPhotoError('');
    setPhotoSuccess('');

    try {
      const res = await api.delete('/users/profile-picture');
      const updatedUser = res.data?.user || {
        ...u,
        profilePicture: '',
        avatar: '',
      };

      setU(updatedUser);
      saveUser(updatedUser);
      setPhotoSuccess('Profile picture removed.');
    } catch (err) {
      setPhotoError(getApiErrorMessage(err));
    } finally {
      setUploadingPhoto(false);
    }
  };

  const toggleInterest = (interest) => {
    setEditInterests((prev) =>
      prev.includes(interest) ? prev.filter((i) => i !== interest) : [...prev, interest]
    );
  };

  async function handleSaveProfile(e) {
    e.preventDefault();
    setError('');
    setProfileSuccess('');
    setSaving(true);
    try {
      const { data } = await api.put('/auth/profile', {
        name: editName.trim(),
        bio: editBio.trim(),
        phone: editPhone.trim(),
        homeCity: editHomeCity.trim(),
        travelStyle: editTravelStyle.trim(),
        travelInterests: editInterests,
      });

      setU(data.user);
      saveUser(data.user);
      setProfileSuccess('Profile saved successfully!');
      setIsEditing(false);
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  async function handleLogout() {
    try {
      await api.post('/auth/logout');
    } catch {
      // Ignore network errors on logout
    }
    logoutUser();
    nav('/');
  }

  if (!u && !loading) {
    return (
      <MainLayout className="page-content">
        <div className="empty-state large-empty">
          <span><UserRound size={36} /></span>
          <h2>Your travel profile is waiting.</h2>
          <p>Log in or create an account to see your profile.</p>
          <Link className="button button-dark" to="/login">
            Log in <ArrowRight size={17} />
          </Link>
        </div>
      </MainLayout>
    );
  }

  const hasPhoto = Boolean(u?.profilePicture || u?.avatar);

  return (
    <MainLayout className="page-content profile-page">
      <div className="profile-hero">
        <span className="hero-kicker">
          <span /> YOUR LITTLE CORNER OF YATRAGO
        </span>

        <div className="profile-avatar-wrap">
          <div
            className="profile-avatar"
            aria-label="Profile avatar"
            onClick={() => !uploadingPhoto && !previewUrl && fileInputRef.current?.click()}
            style={{ cursor: !uploadingPhoto && !previewUrl ? 'pointer' : 'default' }}
            title={!uploadingPhoto && !previewUrl ? (hasPhoto ? 'Click to change photo' : 'Click to add photo') : undefined}
          >
            {previewUrl ? (
              <img src={previewUrl} alt="Preview" className="profile-avatar-img" />
            ) : hasPhoto ? (
              <img
                src={u.profilePicture || u.avatar}
                alt={u?.name ? `${u.name}'s profile picture` : 'Profile picture'}
                className="profile-avatar-img"
              />
            ) : (
              <span>{u?.name ? u.name.slice(0, 1).toUpperCase() : 'Y'}</span>
            )}
            {uploadingPhoto && (
              <div className="profile-avatar-loading" role="status" aria-label="Uploading...">
                <Loader2 className="spinner" size={24} />
              </div>
            )}
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            style={{ display: 'none' }}
            onChange={handleFileSelect}
            aria-label="Upload profile picture"
          />

          <div className="profile-avatar-actions">
            {previewUrl ? (
              <>
                <button
                  type="button"
                  className="button button-dark button-small"
                  onClick={handleUploadPhoto}
                  disabled={uploadingPhoto}
                >
                  {uploadingPhoto ? (
                    <>
                      <Loader2 className="spinner" size={13} /> Uploading...
                    </>
                  ) : (
                    <>
                      <UploadCloud size={13} /> Save Photo
                    </>
                  )}
                </button>
                <button
                  type="button"
                  className="button button-outline-dark button-small"
                  onClick={handleCancelPreview}
                  disabled={uploadingPhoto}
                >
                  <X size={13} /> Cancel
                </button>
              </>
            ) : hasPhoto ? (
              <>
                <button
                  type="button"
                  className="button button-outline-dark button-small"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploadingPhoto}
                  aria-label="Change photo"
                >
                  <Camera size={13} /> Change Photo
                </button>
                <button
                  type="button"
                  className="button button-outline-danger button-small"
                  onClick={handleRemovePhoto}
                  disabled={uploadingPhoto}
                  aria-label="Remove photo"
                >
                  <Trash2 size={13} /> Remove
                </button>
              </>
            ) : (
              <button
                type="button"
                className="button button-dark button-small"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadingPhoto}
                aria-label="Add photo"
              >
                <Camera size={13} /> Add Photo
              </button>
            )}
          </div>

          {photoError && (
            <div className="profile-photo-msg error" role="alert">
              {photoError}
            </div>
          )}
          {photoSuccess && (
            <div className="profile-photo-msg success" role="status">
              {photoSuccess}
            </div>
          )}
        </div>

        <h1>
          Hello, <em>{u?.name ? u.name.split(' ')[0] : 'Traveller'}.</em>
        </h1>
        <p>Every traveller has a story. This is where yours takes shape.</p>
      </div>

      <div className="profile-grid">
        <section className="panel profile-details">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <span className="eyebrow" style={{ margin: 0 }}>ACCOUNT DETAILS</span>
            {!isEditing && (
              <button
                type="button"
                onClick={() => setIsEditing(true)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--color-coral)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  fontSize: '0.85rem',
                  fontWeight: 600,
                }}
              >
                <Edit3 size={14} /> Edit Profile
              </button>
            )}
          </div>

          {error && <p className="form-error" role="alert">{error}</p>}
          {profileSuccess && <p className="form-success" role="status">{profileSuccess}</p>}

          {isEditing ? (
            <form onSubmit={handleSaveProfile} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <label className="field-label">
                Full Name
                <input
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  placeholder="Your full name"
                  required
                />
              </label>

              <label className="field-label">
                Bio / Travel Tagline
                <textarea
                  rows="2"
                  value={editBio}
                  onChange={(e) => setEditBio(e.target.value)}
                  placeholder="e.g. Always looking for mountain mist and old bookshops"
                />
              </label>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <label className="field-label">
                  Home City
                  <input
                    value={editHomeCity}
                    onChange={(e) => setEditHomeCity(e.target.value)}
                    placeholder="e.g. Jaipur, Bengaluru"
                  />
                </label>

                <label className="field-label">
                  Phone Number
                  <input
                    value={editPhone}
                    onChange={(e) => setEditPhone(e.target.value)}
                    placeholder="+91 98765 43210"
                  />
                </label>
              </div>

              <label className="field-label">
                Travel Style
                <input
                  value={editTravelStyle}
                  onChange={(e) => setEditTravelStyle(e.target.value)}
                  placeholder="e.g. Slow Travel, Cultural Explorer, Nature Lover"
                />
              </label>

              <div>
                <label className="field-label" style={{ marginBottom: '6px' }}>
                  Travel Interests (select all that match)
                </label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                  {AVAILABLE_INTERESTS.map((interest) => {
                    const selected = editInterests.includes(interest);
                    return (
                      <button
                        key={interest}
                        type="button"
                        onClick={() => toggleInterest(interest)}
                        className="interest-chip"
                        style={{
                          background: selected ? 'var(--color-coral)' : 'var(--color-surface)',
                          color: selected ? '#FFFFFF' : 'var(--color-dark)',
                          borderColor: selected ? 'var(--color-coral)' : 'var(--color-border)',
                          cursor: 'pointer',
                          fontSize: '0.8rem',
                          padding: '0.35rem 0.75rem',
                        }}
                      >
                        {selected ? '✓ ' : '+ '}
                        {interest}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div style={{ display: 'flex', gap: '8px', marginTop: '10px' }}>
                <button className="button button-dark button-small" disabled={saving}>
                  <Save size={15} /> {saving ? 'Saving...' : 'Save Profile'}
                </button>
                <button
                  type="button"
                  className="button button-outline-dark button-small"
                  onClick={() => setIsEditing(false)}
                >
                  Cancel
                </button>
              </div>
            </form>
          ) : (
            <>
              <h2>Your details</h2>
              <div className="profile-detail-row">
                <UserRound size={18} />
                <div>
                  <small>Name</small>
                  <strong>{u?.name}</strong>
                </div>
              </div>

              <div className="profile-detail-row">
                <Mail size={18} />
                <div>
                  <small>Email</small>
                  <strong>{u?.email}</strong>
                </div>
              </div>

              {u?.homeCity && (
                <div className="profile-detail-row">
                  <HomeIcon size={18} />
                  <div>
                    <small>Home City</small>
                    <strong>{u.homeCity}</strong>
                  </div>
                </div>
              )}

              {u?.phone && (
                <div className="profile-detail-row">
                  <Phone size={18} />
                  <div>
                    <small>Phone</small>
                    <strong>{u.phone}</strong>
                  </div>
                </div>
              )}

              {u?.travelStyle && (
                <div className="profile-detail-row">
                  <Compass size={18} />
                  <div>
                    <small>Travel Style</small>
                    <strong>{u.travelStyle}</strong>
                  </div>
                </div>
              )}

              <div className="profile-detail-row">
                <CalendarDays size={18} />
                <div>
                  <small>Traveller since</small>
                  <strong>
                    {u?.createdAt
                      ? new Date(u.createdAt).toLocaleDateString('en-IN', {
                          month: 'long',
                          year: 'numeric',
                        })
                      : 'Recently'}
                  </strong>
                </div>
              </div>

              {u?.bio && (
                <div
                  style={{
                    padding: '12px 14px',
                    background: 'var(--color-surface)',
                    borderLeft: '3px solid var(--color-coral)',
                    borderRadius: '4px',
                    fontSize: '0.9rem',
                    color: 'var(--color-dark)',
                    margin: '12px 0',
                    fontStyle: 'italic',
                  }}
                >
                  "{u.bio}"
                </div>
              )}

              {Array.isArray(u?.travelInterests) && u.travelInterests.length > 0 && (
                <div style={{ marginTop: '1rem' }}>
                  <small style={{ display: 'block', color: 'var(--color-secondary)', marginBottom: '6px' }}>
                    Travel Interests
                  </small>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                    {u.travelInterests.map((interest) => (
                      <span key={interest} className="interest-chip">
                        {interest}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}

          <button
            className="button button-outline-dark button-full"
            onClick={handleLogout}
            style={{ marginTop: '24px' }}
          >
            <LogOut size={16} /> Log out
          </button>
        </section>

        <section className="profile-trip-panel">
          <div className="panel-heading">
            <div>
              <span className="eyebrow">YOUR PLANS</span>
              <h2>Travel notebook</h2>
            </div>
            <span className="count-pill">{trips.length}</span>
          </div>

          {trips.length ? (
            <div className="profile-trip-list">
              {trips.slice(0, 3).map((t) => (
                <Link
                  key={t._id || t.id}
                  to={`/trip/${t._id || t.id}`}
                  className="profile-trip-row"
                >
                  <span>{t.emoji || '🧳'}</span>
                  <div>
                    <strong>{t.title || t.destinationName}</strong>
                    <small>
                      <MapPin size={12} />
                      {t.destinationName}
                    </small>
                  </div>
                  <ArrowRight size={17} />
                </Link>
              ))}
            </div>
          ) : (
            <div className="profile-no-trips">
              <p>No trips planned just yet.</p>
              <Link to="/create-trip" className="text-link">
                Start your first plan <ArrowRight size={15} />
              </Link>
            </div>
          )}

          <Link className="button button-dark button-full" to="/my-trips">
            View all my trips <ArrowRight size={16} />
          </Link>
        </section>
      </div>
    </MainLayout>
  );
}
