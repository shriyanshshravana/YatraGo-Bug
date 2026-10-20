import { useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { Menu, X, UserRound, MapPinned, LogOut } from 'lucide-react';
import Logo from './Logo';
import NotificationBell from './NotificationBell';
import { logoutUser } from '../utils/storage';

export default function Navbar({ user }) {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const close = () => setOpen(false);

  return (
    <header className="site-header">
      <div className="nav-wrap">
        <Logo />
        <button
          className="mobile-menu"
          onClick={() => setOpen(!open)}
          aria-label="Toggle menu"
        >
          {open ? <X /> : <Menu />}
        </button>

        <nav className={`nav-links ${open ? 'nav-open' : ''}`}>
          <NavLink to="/" onClick={close}>Home</NavLink>
          <NavLink to="/explore" onClick={close}>Explore India</NavLink>
          <NavLink to="/my-trips" onClick={close}>My Trips</NavLink>
          <Link to="/create-trip" className="nav-plan" onClick={close}>
            <MapPinned size={16} /> Plan a trip
          </Link>

          {user ? (
            <div className="nav-auth-group" style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <NotificationBell user={user} />
              <Link to="/profile" className="nav-login" onClick={close}>
                {user?.profilePicture ? (
                  <img
                    src={user.profilePicture}
                    alt={user.name || 'Profile'}
                    style={{
                      width: 20,
                      height: 20,
                      borderRadius: '50%',
                      objectFit: 'cover',
                      marginRight: 4
                    }}
                  />
                ) : (
                  <UserRound size={16} />
                )}
                <span>Profile</span>
              </Link>
              <button
                className="icon-button"
                title="Log out"
                onClick={() => {
                  logoutUser();
                  close();
                  navigate('/');
                }}
              >
                <LogOut size={17} />
              </button>
            </div>
          ) : (
            <Link className="nav-login" to="/login" onClick={close}>
              <UserRound size={16} /> Log in
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}
