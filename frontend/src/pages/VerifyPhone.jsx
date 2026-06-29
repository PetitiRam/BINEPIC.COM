import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AuthLayout from '../components/AuthLayout';
import client from '../api/client';

export default function VerifyPhone() {
  const navigate = useNavigate();
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await client.post('/auth/verify-phone', { code });
      navigate('/marketplace');
    } catch (err) {
      setError(err.response?.data?.error || 'Invalid code. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setError(''); setInfo(''); setResending(true);
    try {
      const { data } = await client.post('/auth/resend-otp');
      setInfo(data.message);
      setCooldown(60);
      const timer = setInterval(() => {
        setCooldown((c) => {
          if (c <= 1) { clearInterval(timer); return 0; }
          return c - 1;
        });
      }, 1000);
    } catch (err) {
      setError(err.response?.data?.error || 'Could not resend code. Please try again.');
    } finally {
      setResending(false);
    }
  };

  return (
    <AuthLayout>
      <div className="eyebrow">One last step</div>
      <h1>Verify your phone number</h1>
      <p className="hint">We sent a 6-digit code by SMS. Enter it below to start buying.</p>

      {error && <div className="alert alert-error">{error}</div>}
      {info && <div className="alert alert-success">{info}</div>}

      <form onSubmit={handleSubmit}>
        <div className="field-group">
          <label htmlFor="code">Verification code</label>
          <input id="code" inputMode="numeric" maxLength={6} placeholder="••••••" value={code} onChange={(e) => setCode(e.target.value)} required />
        </div>
        <button className="btn-primary" type="submit" disabled={loading}>
          {loading ? 'Verifying…' : 'Verify and continue'}
        </button>
      </form>

      <p className="auth-footer-note">
        Didn't get a code?{' '}
        <button type="button" className="btn-link" onClick={handleResend} disabled={resending || cooldown > 0}>
          {cooldown > 0 ? `Resend in ${cooldown}s` : resending ? 'Sending…' : 'Resend code'}
        </button>
      </p>
    </AuthLayout>
  );
}
