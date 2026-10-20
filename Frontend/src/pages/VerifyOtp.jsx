import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, ArrowRight, ShieldCheck, RefreshCw } from 'lucide-react';
import MainLayout from '../layouts/MainLayout';
import api, { getApiErrorMessage } from '../services/api';
import { saveAuthSession } from '../utils/storage';

export default function VerifyOtp() {
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [cooldown, setCooldown] = useState(60);
  const [resendMessage, setResendMessage] = useState('');
  const [emailConfigNotice, setEmailConfigNotice] = useState(false);
  const refs = useRef([]);
  const nav = useNavigate();

  const email = sessionStorage.getItem('yg_email') || '';
  const mode = sessionStorage.getItem('yg_mode') || 'signup';

  useEffect(() => {
    if (!email) {
      nav('/login', { replace: true });
    }
    if (sessionStorage.getItem('yg_email_configured') === 'false') {
      setEmailConfigNotice(true);
    }
  }, [email, nav]);

  // Countdown timer for resend OTP cooldown
  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setInterval(() => {
      setCooldown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [cooldown]);

  function handleChange(val, idx) {
    if (!/^\d?$/.test(val)) return;
    const next = [...otp];
    next[idx] = val;
    setOtp(next);
    if (val && idx < 5) {
      refs.current[idx + 1]?.focus();
    }
  }

  function handlePaste(e) {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').trim();
    const digits = pasted.replace(/\D/g, '').slice(0, 6).split('');
    if (digits.length > 0) {
      const next = [...otp];
      digits.forEach((d, i) => {
        next[i] = d;
      });
      setOtp(next);
      const nextFocus = Math.min(digits.length, 5);
      refs.current[nextFocus]?.focus();
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    const code = otp.join('');

    if (code.length !== 6) {
      setError('Please enter all six digits of the verification code.');
      return;
    }

    setLoading(true);
    try {
      const { data } = await api.post('/auth/verify-otp', {
        email: email.trim().toLowerCase(),
        otp: code,
      });

      setSuccess(true);
      // Save authenticated session token & user
      saveAuthSession({
        token: data.token,
        user: data.user,
      });

      ['yg_email', 'yg_name', 'yg_mode', 'yg_email_configured'].forEach((k) =>
        sessionStorage.removeItem(k)
      );

      setTimeout(() => {
        nav('/profile');
      }, 1200);
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  async function handleResend() {
    if (cooldown > 0 || resending) return;
    setError('');
    setResendMessage('');
    setResending(true);

    try {
      const { data } = await api.post('/auth/resend-otp', {
        email: email.trim().toLowerCase(),
      });

      setOtp(['', '', '', '', '', '']);
      refs.current[0]?.focus();
      setCooldown(60);

      if (data.emailConfigured === false) {
        setEmailConfigNotice(true);
        setResendMessage('New OTP generated in database. Note: Email delivery is not configured on server (EMAIL_USER / EMAIL_PASS missing).');
      } else {
        setResendMessage('A fresh verification code has been sent to your email.');
      }
    } catch (err) {
      if (err.response?.status === 429 && err.response?.data?.retryAfterSeconds) {
        setCooldown(err.response.data.retryAfterSeconds);
      }
      setError(getApiErrorMessage(err));
    } finally {
      setResending(false);
    }
  }

  async function handleDevVerify() {
    setLoading(true);
    setError('');
    try {
      const { data } = await api.post('/auth/dev-verify', {
        email: email.trim().toLowerCase(),
      });
      setSuccess(true);
      saveAuthSession({
        token: data.token,
        user: data.user,
      });
      ['yg_email', 'yg_name', 'yg_mode', 'yg_email_configured'].forEach((k) =>
        sessionStorage.removeItem(k)
      );
      setTimeout(() => {
        nav('/profile');
      }, 1000);
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <MainLayout className="auth-page">
      <div className="auth-art auth-art-otp">
        <div className="auth-art-copy">
          <span className="eyebrow">A QUICK SECURITY CHECK</span>
          <h1>Almost<br /><em>there.</em></h1>
          <p>We sent a 6-digit one-time passcode to confirm your travel identity.</p>
          <div className="otp-big-icon"><ShieldCheck size={42} /></div>
        </div>
      </div>

      <div className="auth-form-side">
        <form className="auth-form" onSubmit={handleSubmit}>
          <Link to={mode === 'signup' ? '/signup' : '/login'} className="back-link">
            <ArrowLeft size={15} /> Go back
          </Link>

          <span className="eyebrow">SECURITY VERIFICATION</span>
          <h2>Enter your 6-digit code</h2>
          <p>
            Sent to <strong>{email}</strong>.
          </p>

          {emailConfigNotice && (
            <div style={{ background: '#fffbeb', border: '1px solid #fef3c7', borderRadius: '8px', padding: '14px', fontSize: '0.84rem', color: '#92400e', marginBottom: '16px' }}>
              <strong>📧 Email Service Notice:</strong>
              <p style={{ margin: '4px 0 8px 0' }}>
                Email credentials (<code>EMAIL_USER</code> / <code>EMAIL_PASS</code>) are not configured in <code>Backend/.env</code>.
              </p>
              <button
                type="button"
                onClick={handleDevVerify}
                disabled={loading}
                style={{
                  background: '#0d3b66',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '6px',
                  padding: '7px 12px',
                  fontSize: '0.82rem',
                  fontWeight: '600',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                ⚡ Verify Account Directly (Dev Mode)
              </button>
            </div>
          )}

          <div className="otp-inputs">
            {otp.map((v, i) => (
              <input
                key={i}
                ref={(el) => (refs.current[i] = el)}
                value={v}
                onChange={(e) => handleChange(e.target.value, i)}
                onPaste={handlePaste}
                onKeyDown={(e) => {
                  if (e.key === 'Backspace' && !otp[i] && i > 0) {
                    refs.current[i - 1]?.focus();
                  }
                }}
                inputMode="numeric"
                maxLength="1"
                aria-label={`OTP digit ${i + 1}`}
                required
              />
            ))}
          </div>

          {error && <p className="form-error" role="alert">{error}</p>}
          {resendMessage && <p className="form-success" style={{ background: '#f0fdf4', color: '#166534', padding: '10px', borderRadius: '6px' }}>{resendMessage}</p>}
          {success && <p className="form-success" style={{ background: '#dcfce7', color: '#166534', padding: '10px', borderRadius: '6px' }}>Code verified! Taking you to your profile...</p>}

          <button className="button button-dark button-full" disabled={loading || success}>
            {loading ? 'Verifying...' : 'Verify & continue'} <ArrowRight size={17} />
          </button>

          <div className="otp-resend" style={{ marginTop: '16px', textAlign: 'center', fontSize: '0.88rem' }}>
            {cooldown > 0 ? (
              <span style={{ color: '#718096' }}>Resend code in <strong>{cooldown}s</strong></span>
            ) : (
              <button
                type="button"
                onClick={handleResend}
                disabled={resending}
                style={{ background: 'none', border: 'none', color: '#0d3b66', fontWeight: 600, cursor: 'pointer', textDecoration: 'underline' }}
              >
                {resending ? 'Sending fresh code...' : 'Resend code'}
              </button>
            )}
          </div>
        </form>
      </div>
    </MainLayout>
  );
}
