import { useState } from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { ScreenContainer, FormField, PrimaryButton, Alert } from '../../components/UI';
import { useAuth } from '../../context/AuthContext';

export default function SignUpScreen({ navigation }) {
  const { signUp } = useAuth();
  const [form, setForm] = useState({
    fullName: '', email: '', phoneNumber: '', locationCountry: '', locationCity: '',
    password: '', confirmPassword: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const update = (key) => (val) => setForm({ ...form, [key]: val });

  const handleSubmit = async () => {
    setError('');
    if (form.password !== form.confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    setLoading(true);
    try {
      await signUp({
        fullName: form.fullName, email: form.email, phoneNumber: form.phoneNumber,
        locationCountry: form.locationCountry, locationCity: form.locationCity, password: form.password
      });
      navigation.navigate('VerifyPhone');
    } catch (err) {
      setError(err.response?.data?.error || 'Could not create your account.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScreenContainer>
      <Text style={{ fontSize: 24, fontWeight: '800', marginBottom: 4 }}>Create your buyer account</Text>
      <Text style={{ color: '#5B6760', marginBottom: 20 }}>Every account starts as a buyer — upgrade to seller or delivery later.</Text>

      <Alert message={error} />

      <FormField label="Full name" value={form.fullName} onChangeText={update('fullName')} placeholder="e.g. Joseph Nsubuga" />
      <FormField label="Email address" autoCapitalize="none" keyboardType="email-address" value={form.email} onChangeText={update('email')} placeholder="you@example.com" />
      <FormField label="Phone number" keyboardType="phone-pad" value={form.phoneNumber} onChangeText={update('phoneNumber')} placeholder="+256 7XX XXX XXX" />
      <FormField label="Country" value={form.locationCountry} onChangeText={update('locationCountry')} placeholder="Uganda" />
      <FormField label="City" value={form.locationCity} onChangeText={update('locationCity')} placeholder="Kampala" />
      <FormField label="Password" secureTextEntry value={form.password} onChangeText={update('password')} placeholder="At least 8 characters" />
      <FormField label="Confirm password" secureTextEntry value={form.confirmPassword} onChangeText={update('confirmPassword')} placeholder="Re-enter your password" />

      <PrimaryButton title="Create account" onPress={handleSubmit} loading={loading} />

      <View style={{ flexDirection: 'row', justifyContent: 'center', marginTop: 20 }}>
        <Text style={{ color: '#5B6760' }}>Already have an account? </Text>
        <TouchableOpacity onPress={() => navigation.navigate('SignIn')}>
          <Text style={{ color: '#C1622D', fontWeight: '700' }}>Sign in</Text>
        </TouchableOpacity>
      </View>
    </ScreenContainer>
  );
}
