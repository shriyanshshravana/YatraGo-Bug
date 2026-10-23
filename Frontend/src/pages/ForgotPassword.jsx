import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Mail, KeyRound } from 'lucide-react';
import MainLayout from '../layouts/MainLayout';
import api, { getApiErrorMessage } from '../services/api';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [infoMessage, setInfoMessage] = useState('');
  const [hasExistingSession, setHasExistingSession] = useState(false);
  const nav = useNavigate();

  useEffect(() => {
    const saved = sessionStorage.getItem('yg_reset_email') || '';
    if (saved) {
      setEmail(saved);
      setHasExistingSession(true);
    }
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setInfoMessage('');

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError('Please enter a valid email address.');
      return;
    }

    setLoading(true);
    try {
      const { data } = await api.post('/auth/forgot-password', {
        email: email.trim().toLowerCase(),
      });

      sessionStorage.setItem('yg_reset_email', email.trim().toLowerCase());

      if (data.emailSent === false && data.emailConfigured) {
        setError(data.message || 'Email delivery failed on the server. Please check your Brevo account or spam folder.');
        return;
      }

      if (data.emailConfigured === false) {
        setInfoMessage('Reset code generated. Note: Email service is not configured on server (EMAIL_USER / EMAIL_PASS missing). Configure SMTP to receive emails.');
      }

      setTimeout(() => {
        nav('/reset-password');
      }, 1200);
    } catch (err) {
      if (err.response?.status === 429) {
        // Cooldown active: An OTP was already sent within the last 60 seconds and is valid for 10 minutes.
        sessionStorage.setItem('yg_reset_email', email.trim().toLowerCase());
        setInfoMessage(
          'An OTP code was already sent recently and is valid for 10 minutes. Redirecting to the code entry page...'
        );
        setTimeout(() => {
          nav('/reset-password');
        }, 1200);
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
          <span className="eyebrow">RECOVER YOUR ACCOUNT</span>
          <h1>Reset your<br /><em>password.</em></h1>
          <p>We will send a 6-digit verification code to your email to safely reset your password.</p>
          <div className="auth-art-sticker">SECURITY ✳<br /><span>protected</span></div>
        </div>
      </div>

      <div className="auth-form-side">
        <form className="auth-form" onSubmit={handleSubmit}>
          <Link to="/login" className="back-link">
            <ArrowLeft size={15} /> Back to Login
          </Link>

          <span className="eyebrow">ACCOUNT RECOVERY</span>
          <h2>Forgot password?</h2>
          <p>Enter the email address registered with your YATRAGO account.</p>

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

          {hasExistingSession && (
            <p className="auth-switch" style={{ margin: '4px 0 16px 0', textAlign: 'left', fontSize: '0.84rem' }}>
              Already received a code for this email?{' '}
              <Link to="/reset-password" style={{ color: 'var(--color-coral, #CC5963)', fontWeight: '600' }}>
                Enter code here &rarr;
              </Link>
            </p>
          )}

          {error && <p className="form-error" role="alert">{error}</p>}
          {infoMessage && (
            <div
              className="form-success"
              style={{
                background: '#fef3c7',
                border: '1px solid #fde68a',
                color: '#92400e',
                padding: '12px 14px',
                borderRadius: '8px',
                fontSize: '0.85rem',
                marginBottom: '16px',
                lineHeight: 1.5,
              }}
            >
              <p style={{ margin: '0 0 8px 0', fontWeight: '500' }}>{infoMessage}</p>
              <button
                type="button"
                onClick={() => nav('/reset-password')}
                style={{
                  background: 'var(--color-coral, #CC5963)',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '4px',
                  padding: '6px 14px',
                  fontSize: '0.82rem',
                  fontWeight: '600',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                }}
              >
                Go to Enter Code &rarr;
              </button>
            </div>
          )}

          <button className="button button-dark button-full" disabled={loading}>
            {loading ? 'Sending code...' : 'Send reset code'} <ArrowRight size={17} />
          </button>

          <p className="auth-switch">
            Remembered your password? <Link to="/login">Log in</Link>
          </p>
        </form>
      </div>
    </MainLayout>
  );
}
