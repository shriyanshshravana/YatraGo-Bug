import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Lock, Eye, EyeOff, ShieldCheck } from 'lucide-react';
import MainLayout from '../layouts/MainLayout';
import api, { getApiErrorMessage } from '../services/api';

export default function ResetPassword() {
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const refs = useRef([]);
  const nav = useNavigate();

  useEffect(() => {
    const saved = sessionStorage.getItem('yg_reset_email') || '';
    if (saved) {
      setEmail(saved);
    }
  }, []);

  function handleOtpChange(val, idx) {
    if (!/^\d?$/.test(val)) return;
    const next = [...otp];
    next[idx] = val;
    setOtp(next);
    if (val && idx < 5) refs.current[idx + 1]?.focus();
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

    const otpCode = otp.join('');
    if (otpCode.length !== 6) {
      setError('Please enter the full 6-digit reset code.');
      return;
    }

    if (newPassword.length < 6) {
      setError('New password must be at least 6 characters long.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);
    try {
      await api.post('/auth/reset-password', {
        email: email.trim().toLowerCase(),
        otp: otpCode,
        newPassword,
      });

      setSuccess(true);
      sessionStorage.removeItem('yg_reset_email');
      setTimeout(() => {
        nav('/login');
      }, 2000);
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
          <span className="eyebrow">A FRESH START</span>
          <h1>Set your new<br /><em>password.</em></h1>
          <p>Choose a secure password with at least 6 characters.</p>
          <div className="otp-big-icon"><ShieldCheck size={42} /></div>
        </div>
      </div>

      <div className="auth-form-side">
        <form className="auth-form" onSubmit={handleSubmit}>
          <Link to="/forgot-password" className="back-link">
            <ArrowLeft size={15} /> Back
          </Link>

          <span className="eyebrow">SECURITY VERIFICATION</span>
          <h2>Reset password</h2>
          <p>Enter the 6-digit code sent to <strong>{email || 'your email'}</strong>.</p>

          <div className="otp-inputs">
            {otp.map((v, i) => (
              <input
                key={i}
                ref={(el) => (refs.current[i] = el)}
                value={v}
                onChange={(e) => handleOtpChange(e.target.value, i)}
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

          <label className="field-label" style={{ marginTop: '16px' }}>
            New password
            <div className="input-icon">
              <Lock size={17} />
              <input
                type={showPassword ? 'text' : 'password'}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="At least 6 characters"
                required
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
            Confirm new password
            <div className="input-icon">
              <Lock size={17} />
              <input
                type={showPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Re-enter new password"
                required
              />
            </div>
          </label>

          {error && <p className="form-error" role="alert">{error}</p>}
          {success && (
            <p className="form-success" style={{ background: '#dcfce7', color: '#166534', padding: '10px', borderRadius: '6px' }}>
              Password updated successfully! Redirecting to login...
            </p>
          )}

          <button className="button button-dark button-full" disabled={loading || success}>
            {loading ? 'Updating password...' : 'Update password'} <ArrowRight size={17} />
          </button>
        </form>
      </div>
    </MainLayout>
  );
}
