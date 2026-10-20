import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight, Mail, Lock, Eye, EyeOff, ShieldCheck } from 'lucide-react';
import MainLayout from '../layouts/MainLayout';
import api, { getApiErrorMessage } from '../services/api';
import { saveAuthSession } from '../utils/storage';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const nav = useNavigate();

  async function handleLogin(e) {
    e.preventDefault();
    setError('');

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError('Please enter a valid email address.');
      return;
    }

    if (!password) {
      setError('Please enter your password.');
      return;
    }

    setLoading(true);
    try {
      const { data } = await api.post('/auth/login', {
        email: email.trim().toLowerCase(),
        password,
      });

      // Establish session
      saveAuthSession({
        token: data.token,
        user: data.user,
      });

      if (!rememberMe) {
        // If not remember me, we can optionally clear token on window unload or keep in session
      }

      nav('/profile');
    } catch (err) {
      // If user is unverified, prompt them to verify
      if (err.response?.status === 403 && err.response?.data?.isVerified === false) {
        sessionStorage.setItem('yg_email', email.trim().toLowerCase());
        sessionStorage.setItem('yg_mode', 'login');
        nav('/verify-otp');
        return;
      }

      setError(getApiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <MainLayout className="auth-page">
      <div className="auth-art auth-art-login">
        <div className="auth-art-copy">
          <span className="eyebrow">YOUR NEXT CHAPTER</span>
          <h1>Come back<br />to <em>the wonder.</em></h1>
          <p>Your saved trips, little plans and big ideas are waiting for you.</p>
          <div className="auth-art-sticker">NAMASTE<br /><span>traveller ✳</span></div>
        </div>
      </div>

      <div className="auth-form-side">
        <form className="auth-form" onSubmit={handleLogin}>
          <span className="eyebrow">WELCOME BACK</span>
          <h2>Log in to YATRAGO</h2>
          <p>Sign in to access your saved trips, to-dos and itineraries.</p>

          <label className="field-label">
            Email address
            <div className="input-icon">
              <Mail size={17} />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
                autoComplete="email"
              />
            </div>
          </label>

          <label className="field-label">
            Password
            <div className="input-icon">
              <Lock size={17} />
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                required
                autoComplete="current-password"
              />
              <button
                type="button"
                className="password-toggle-btn"
                onClick={() => setShowPassword(!showPassword)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '0 8px', color: '#718096' }}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </label>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', margin: '8px 0 16px 0', fontSize: '0.85rem' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#4a5568', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
              />
              Remember me
            </label>
            <Link to="/forgot-password" style={{ color: '#0d3b66', fontWeight: 500 }}>
              Forgot password?
            </Link>
          </div>

          {error && <p className="form-error" role="alert">{error}</p>}

          <button className="button button-dark button-full" disabled={loading}>
            {loading ? 'Logging in...' : 'Log in'} <ArrowRight size={17} />
          </button>

          <p className="auth-switch">
            New to YatraGo? <Link to="/signup">Create an account</Link>
          </p>
        </form>
      </div>
    </MainLayout>
  );
}
