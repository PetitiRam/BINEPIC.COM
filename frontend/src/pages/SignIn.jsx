import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import AuthLayout from '../components/AuthLayout';
import client from '../api/client';

export default function SignIn() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const { data } = await client.post('/auth/signin', { email, password });
      localStorage.setItem('jedida_access_token', data.accessToken);
      localStorage.setItem('jedida_refresh_token', data.refreshToken);
      localStorage.setItem('jedida_user', JSON.stringify(data.user));
      navigate('/marketplace');
    } catch (err) {
      setError(err.response?.data?.error || 'Could not sign in. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout>
      <div className="eyebrow">Welcome back</div>
      <h1>Sign in to JEDIDA</h1>
      <p className="hint">Buy, sell or manage deliveries — all in one account.</p>

      {error && <div className="alert alert-error">{error}</div>}

      <form onSubmit={handleSubmit}>
        <div className="field-group">
          <label htmlFor="email">Email address</label>
          <input id="email" type="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </div>

        <div className="field-group">
          <label htmlFor="password">Password</label>
          <input id="password" type="password" placeholder="Your password" value={password} onChange={(e) => setPassword(e.target.value)} required />
        </div>

        <div style={{ textAlign: 'right', marginBottom: 4 }}>
          <Link to="/forgot-password" className="btn-link">Forgot password?</Link>
        </div>

        <button className="btn-primary" type="submit" disabled={loading}>
          {loading ? 'Signing in…' : 'Sign in'}
        </button>
      </form>

      <p className="auth-footer-note">
        New to JEDIDA? <Link to="/signup" className="btn-link">Create an account</Link>
      </p>
    </AuthLayout>
  );
}
