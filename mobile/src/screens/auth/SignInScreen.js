import { useState } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { ScreenContainer, FormField, PrimaryButton, Alert } from '../../components/UI';
import { useAuth } from '../../context/AuthContext';

export default function SignInScreen({ navigation }) {
  const { signIn } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSignIn = async () => {
    setError(''); setLoading(true);
    try {
      await signIn(email, password);
      // RootNavigator re-renders into the right role stack automatically
    } catch (err) {
      setError(err.response?.data?.error || 'Could not sign in. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScreenContainer>
      <Text style={{ fontSize: 24, fontWeight: '800', marginBottom: 4 }}>Sign in to JEDIDA</Text>
      <Text style={{ color: '#5B6760', marginBottom: 20 }}>Buy, sell or manage deliveries — all in one account.</Text>

      <Alert message={error} />

      <FormField label="Email address" autoCapitalize="none" keyboardType="email-address" value={email} onChangeText={setEmail} placeholder="you@example.com" />
      <FormField label="Password" secureTextEntry value={password} onChangeText={setPassword} placeholder="Your password" />

      <TouchableOpacity onPress={() => navigation.navigate('ForgotPassword')} style={{ alignSelf: 'flex-end', marginBottom: 10 }}>
        <Text style={{ color: '#C1622D', fontWeight: '600', fontSize: 13 }}>Forgot password?</Text>
      </TouchableOpacity>

      <PrimaryButton title="Sign in" onPress={handleSignIn} loading={loading} />

      <View style={{ flexDirection: 'row', justifyContent: 'center', marginTop: 20 }}>
        <Text style={{ color: '#5B6760' }}>New to JEDIDA? </Text>
        <TouchableOpacity onPress={() => navigation.navigate('SignUp')}>
          <Text style={{ color: '#C1622D', fontWeight: '700' }}>Create an account</Text>
        </TouchableOpacity>
      </View>
    </ScreenContainer>
  );
}
