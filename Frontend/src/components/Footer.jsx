import { Link } from 'react-router-dom';
import Logo from './Logo';

export default function Footer() {
  return (
    <footer className="site-footer">
      <div className="footer-main">
        <div>
          <Logo />
          <p className="footer-copy">
            Little plans. Big memories.
            <br />
            Discover the many moods of India.
          </p>
        </div>
        <div className="footer-links">
          <strong>EXPLORE</strong>
          <Link to="/explore">Destinations</Link>
          <Link to="/create-trip">Plan a trip</Link>
          <Link to="/my-trips">My trips</Link>
        </div>
        <div className="footer-links">
          <strong>LEGAL</strong>
          <Link to="/terms">Terms &amp; Conditions</Link>
          <Link to="/privacy">Privacy Policy</Link>
        </div>
        <div className="footer-note">
          <span className="eyebrow">MADE FOR THE CURIOUS</span>
          <p>From mountain mornings to coastal sunsets — your next story starts here.</p>
        </div>
      </div>
      <div className="footer-bottom">
        <span>© {new Date().getFullYear()} YATRAGO</span>
        <span>Made for journeys across India ✦</span>
      </div>
    </footer>
  );
}
