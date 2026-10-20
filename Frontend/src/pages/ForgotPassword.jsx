import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Mail, KeyRound } from 'lucide-react';
import MainLayout from '../layouts/MainLayout';
import api, { getApiErrorMessage } from '../services/api';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [infoMessage, setInfoMessage] = useState('');
  const nav = useNavigate();

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

          {error && <p className="form-error" role="alert">{error}</p>}
          {infoMessage && <p className="form-success" style={{ background: '#fef3c7', color: '#92400e', padding: '10px', borderRadius: '6px', fontSize: '0.85rem' }}>{infoMessage}</p>}

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
