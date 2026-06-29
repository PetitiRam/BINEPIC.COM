import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import AuthLayout from '../components/AuthLayout';
import client from '../api/client';

export default function SignUp() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    fullName: '', email: '', phoneNumber: '', locationCountry: '', locationCity: '',
    password: '', confirmPassword: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const update = (key) => (e) => setForm({ ...form, [key]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (form.password !== form.confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    setLoading(true);
    try {
      const { data } = await client.post('/auth/signup', {
        fullName: form.fullName,
        email: form.email,
        phoneNumber: form.phoneNumber,
        locationCountry: form.locationCountry,
        locationCity: form.locationCity,
        password: form.password
      });
      localStorage.setItem('jedida_access_token', data.accessToken);
      localStorage.setItem('jedida_refresh_token', data.refreshToken);
      navigate('/verify-phone');
    } catch (err) {
      setError(err.response?.data?.error || 'Could not create your account. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout>
      <div className="eyebrow">Get started</div>
      <h1>Create your buyer account</h1>
      <p className="hint">Every account starts as a buyer — you can upgrade to seller or delivery partner later.</p>

      {error && <div className="alert alert-error">{error}</div>}

      <form onSubmit={handleSubmit}>
        <div className="field-group">
          <label htmlFor="fullName">Full name</label>
          <input id="fullName" placeholder="e.g. Joseph Nsubuga" value={form.fullName} onChange={update('fullName')} required />
        </div>

        <div className="field-group">
          <label htmlFor="email">Email address</label>
          <input id="email" type="email" placeholder="you@example.com" value={form.email} onChange={update('email')} required />
        </div>

        <div className="field-group">
          <label htmlFor="phoneNumber">Phone number</label>
          <input id="phoneNumber" type="tel" placeholder="+256 7XX XXX XXX" value={form.phoneNumber} onChange={update('phoneNumber')} required />
        </div>

        <div className="field-row">
          <div className="field-group">
            <label htmlFor="locationCountry">Country</label>
            <input id="locationCountry" placeholder="Uganda" value={form.locationCountry} onChange={update('locationCountry')} />
          </div>
          <div className="field-group">
            <label htmlFor="locationCity">City</label>
            <input id="locationCity" placeholder="Kampala" value={form.locationCity} onChange={update('locationCity')} />
          </div>
        </div>

        <div className="field-group">
          <label htmlFor="password">Password</label>
          <input id="password" type="password" placeholder="At least 8 characters" value={form.password} onChange={update('password')} required minLength={8} />
        </div>

        <div className="field-group">
          <label htmlFor="confirmPassword">Confirm password</label>
          <input id="confirmPassword" type="password" placeholder="Re-enter your password" value={form.confirmPassword} onChange={update('confirmPassword')} required minLength={8} />
        </div>

        <button className="btn-primary" type="submit" disabled={loading}>
          {loading ? 'Creating your account…' : 'Create account'}
        </button>
      </form>

      <p className="auth-footer-note">
        Already have an account? <Link to="/signin" className="btn-link">Sign in</Link>
      </p>
    </AuthLayout>
  );
}
