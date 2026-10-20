import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight, Mail, UserRound, Lock, Eye, EyeOff } from 'lucide-react';
import MainLayout from '../layouts/MainLayout';
import api, { getApiErrorMessage } from '../services/api';

export default function Signup() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const nav = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');

    if (name.trim().length < 2) {
      setError('Please enter your full name (at least 2 characters).');
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError('Enter a valid email address.');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    if (!termsAccepted) {
      setError('You must accept the Terms and Conditions and Privacy Policy to create an account.');
      return;
    }

    setLoading(true);
    try {
      const { data } = await api.post('/auth/register', {
        name: name.trim(),
        email: email.trim().toLowerCase(),
        password,
        confirmPassword,
        termsAccepted: true,
      });

      if (data.emailSent === false && data.emailConfigured) {
        setError(data.message || 'Could not send verification email. Please check your spam folder or verify email configuration.');
        return;
      }

      // Store in session for the OTP verification screen
      sessionStorage.setItem('yg_email', email.trim().toLowerCase());
      sessionStorage.setItem('yg_name', name.trim());
      sessionStorage.setItem('yg_mode', 'signup');
      if (data.emailConfigured === false) {
        sessionStorage.setItem('yg_email_configured', 'false');
      } else {
        sessionStorage.removeItem('yg_email_configured');
      }

      nav('/verify-otp');
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <MainLayout className="auth-page">
      <div className="auth-art auth-art-signup">
        <div className="auth-art-copy">
          <span className="eyebrow">THERE'S A WHOLE INDIA OUT THERE</span>
          <h1>Make room<br />for <em>memories.</em></h1>
          <p>Build a travel notebook that grows with every place you discover.</p>
          <div className="auth-art-sticker">GO A LITTLE<br /><span>further ✳</span></div>
        </div>
      </div>

      <div className="auth-form-side">
        <form className="auth-form" onSubmit={handleSubmit}>
          <span className="eyebrow">START YOUR JOURNEY</span>
          <h2>Create your account</h2>
          <p>A few details now. A lot of good journeys later.</p>

          <label className="field-label">
            Full name
            <div className="input-icon">
              <UserRound size={17} />
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="What should we call you?"
                required
                autoComplete="name"
              />
            </div>
          </label>

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
                placeholder="At least 6 characters"
                required
                autoComplete="new-password"
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

          <label className="field-label">
            Confirm password
            <div className="input-icon">
              <Lock size={17} />
              <input
                type={showPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Re-enter your password"
                required
                autoComplete="new-password"
              />
            </div>
          </label>

          {/* Terms and Conditions Checkbox (unchecked by default) */}
          <div className="terms-checkbox-row" style={{ margin: '14px 0 10px 0', display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
            <input
              type="checkbox"
              id="terms-checkbox"
              checked={termsAccepted}
              onChange={(e) => setTermsAccepted(e.target.checked)}
              style={{ marginTop: '3px', cursor: 'pointer' }}
              required
            />
            <label htmlFor="terms-checkbox" style={{ fontSize: '0.84rem', color: '#4a5568', lineHeight: '1.4', cursor: 'pointer' }}>
              I agree to the <Link to="/terms" target="_blank" style={{ textDecoration: 'underline', color: '#0d3b66' }}>Terms and Conditions</Link> and <Link to="/privacy" target="_blank" style={{ textDecoration: 'underline', color: '#0d3b66' }}>Privacy Policy</Link>.
            </label>
          </div>

          {error && <p className="form-error" role="alert">{error}</p>}

          <button className="button button-dark button-full" disabled={loading || !termsAccepted}>
            {loading ? 'Creating account...' : 'Create account'} <ArrowRight size={17} />
          </button>

          <p className="auth-switch">
            Already have an account? <Link to="/login">Log in</Link>
          </p>
        </form>
      </div>
    </MainLayout>
  );
}
