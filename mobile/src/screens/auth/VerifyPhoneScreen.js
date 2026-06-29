import { useState } from 'react';
import { Text, View } from 'react-native';
import { ScreenContainer, FormField, PrimaryButton, SecondaryButton, Alert } from '../../components/UI';
import client from '../../api/client';
import { useAuth } from '../../context/AuthContext';

export default function VerifyPhoneScreen() {
  const { refreshUser } = useAuth();
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);

  const handleVerify = async () => {
    setError(''); setLoading(true);
    try {
      await client.post('/auth/verify-phone', { code });
      await refreshUser(); // RootNavigator re-renders into Marketplace once phone_verified flips
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
    } catch (err) {
      setError(err.response?.data?.error || 'Could not resend code.');
    } finally {
      setResending(false);
    }
  };

  return (
    <ScreenContainer>
      <Text style={{ fontSize: 24, fontWeight: '800', marginBottom: 4 }}>Verify your phone number</Text>
      <Text style={{ color: '#5B6760', marginBottom: 20 }}>We sent a 6-digit code by SMS. Enter it below to start buying.</Text>

      <Alert message={error} />
      <Alert type="success" message={info} />

      <FormField label="Verification code" keyboardType="number-pad" maxLength={6} value={code} onChangeText={setCode} placeholder="••••••" />

      <PrimaryButton title="Verify and continue" onPress={handleVerify} loading={loading} />
      <View style={{ marginTop: 12 }}>
        <SecondaryButton title={resending ? 'Sending…' : 'Resend code'} onPress={handleResend} disabled={resending} />
      </View>
    </ScreenContainer>
  );
}
