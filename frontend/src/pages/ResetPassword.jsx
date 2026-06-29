import { useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import AuthLayout from '../components/AuthLayout';
import client from '../api/client';

export default function ResetPassword() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const uid = params.get('uid');
  const token = params.get('token');

  const [newPassword, setNewPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (newPassword !== confirm) {
      setError('Passwords do not match.');
      return;
    }
    setLoading(true);
    try {
      await client.post('/auth/reset-password', { uid, token, newPassword });
      navigate('/signin');
    } catch (err) {
      setError(err.response?.data?.error || 'Could not reset password. The link may have expired.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout>
      <div className="eyebrow">Account recovery</div>
      <h1>Choose a new password</h1>
      <p className="hint">Make it at least 8 characters.</p>

      {error && <div className="alert alert-error">{error}</div>}

      <form onSubmit={handleSubmit}>
        <div className="field-group">
          <label htmlFor="newPassword">New password</label>
          <input id="newPassword" type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required minLength={8} />
        </div>
        <div className="field-group">
          <label htmlFor="confirm">Confirm new password</label>
          <input id="confirm" type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} required minLength={8} />
        </div>
        <button className="btn-primary" type="submit" disabled={loading}>
          {loading ? 'Saving…' : 'Reset password'}
        </button>
      </form>

      <p className="auth-footer-note">
        <Link to="/signin" className="btn-link">Back to sign in</Link>
      </p>
    </AuthLayout>
  );
}
