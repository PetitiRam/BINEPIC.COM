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
  const [step, setStep] = useState(1);
const [code, setCode] = useState('');



const handleSubmit = async (e) => {
  e.preventDefault();
  setError('');
  setLoading(true);

  try {
    // STEP 1: LOGIN REQUEST (EMAIL + PASSWORD)
    if (step === 1) {
      const { data } = await client.post('/auth/signin', {
        email,
        password
      });

      // backend says OTP is required
      if (data.requiresOtp) {
        setStep(2);
        return;
      }

      // fallback (if backend ever logs in directly)
      localStorage.setItem('jedida_access_token', data.accessToken);
      localStorage.setItem('jedida_refresh_token', data.refreshToken);
      localStorage.setItem('jedida_user', JSON.stringify(data.user));

      navigate('/marketplace');
      return;
    }

    // STEP 2: VERIFY OTP
    if (step === 2) {
      const { data } = await client.post('/auth/verify-signin-otp', {
        email,
        code
      });

      localStorage.setItem('jedida_access_token', data.accessToken);
      localStorage.setItem('jedida_refresh_token', data.refreshToken);
      localStorage.setItem('jedida_user', JSON.stringify(data.user));

      navigate('/marketplace');
    }

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
      {step === 1 && (
  <>
    <div className="field-group">
      <label htmlFor="email">Email address</label>
      <input
        id="email"
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
      />
    </div>

    <div className="field-group">
      <label htmlFor="password">Password</label>
      <input
        id="password"
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        required
      />
    </div>

                  
    <button
      type="submit"
      className="btn-primary"
      onClick={() => setStep(1)}
      disabled={loading}
    >
                                           
      {loading ? 'Sending OTP…' : 'Continue'}
    </button>
  </>
)}
{step === 2 && (
  <>
    <div className="field-group">
      <label htmlFor="otp">Enter OTP code</label>
      <input
        id="otp"
        type="text"
        value={code}
        onChange={(e) => setCode(e.target.value)}
        required
      />
    </div>

    <button
      className="btn-primary"
      type="submit"
      disabled={loading}
    >
      {loading ? 'Signing in…' : 'Sign in'}
    </button>

    <button
      type="button"
      className="btn-link"
      onClick={() => setStep(1)}
    >
      Back
    </button>
  </>
)}
      </form>

      <p className="auth-footer-note">
        New to JEDIDA? <Link to="/signup" className="btn-link">Create an account</Link>
      </p>
    </AuthLayout>
  );
}
