import { useState } from 'react';
import { Text, TouchableOpacity } from 'react-native';
import { ScreenContainer, FormField, PrimaryButton, Alert } from '../../components/UI';
import client from '../../api/client';

export default function ForgotPasswordScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    setError(''); setLoading(true);
    try {
      await client.post('/auth/forgot-password', { email });
      setSent(true);
    } catch (err) {
      setError(err.response?.data?.error || 'Could not send reset link.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScreenContainer>
      <Text style={{ fontSize: 24, fontWeight: '800', marginBottom: 4 }}>Reset your password</Text>
      <Text style={{ color: '#5B6760', marginBottom: 20 }}>
        Enter the email on your account. Since reset links open a web page, finish the reset in your browser, then come back and sign in here.
      </Text>

      <Alert message={error} />
      <Alert type="success" message={sent ? 'If an account exists for that email, a reset link has been sent.' : ''} />

      {!sent && (
        <>
          <FormField label="Email address" autoCapitalize="none" keyboardType="email-address" value={email} onChangeText={setEmail} placeholder="you@example.com" />
          <PrimaryButton title="Send reset link" onPress={handleSubmit} loading={loading} />
        </>
      )}

      <TouchableOpacity onPress={() => navigation.navigate('SignIn')} style={{ marginTop: 20, alignSelf: 'center' }}>
        <Text style={{ color: '#C1622D', fontWeight: '700' }}>Back to sign in</Text>
      </TouchableOpacity>
    </ScreenContainer>
  );
}
