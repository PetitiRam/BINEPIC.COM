import { View, Text, TouchableOpacity, TextInput, StyleSheet, ScrollView, SafeAreaView } from 'react-native';
import { colors } from '../theme';
import Logo from './Logo';

export function ScreenContainer({ children, withHeader = true, scroll = true }) {
  const Body = scroll ? ScrollView : View;
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.cream }}>
      {withHeader && (
        <View style={styles.header}>
          <Logo size={28} />
        </View>
      )}
      <Body style={{ flex: 1 }} contentContainerStyle={scroll ? { padding: 16, paddingBottom: 40 } : undefined}>
        {children}
      </Body>
    </SafeAreaView>
  );
}

export function PrimaryButton({ title, onPress, disabled, loading }) {
  return (
    <TouchableOpacity style={[styles.primaryBtn, disabled && { opacity: 0.6 }]} onPress={onPress} disabled={disabled || loading}>
      <Text style={styles.primaryBtnText}>{loading ? 'Please wait…' : title}</Text>
    </TouchableOpacity>
  );
}

export function SecondaryButton({ title, onPress, disabled }) {
  return (
    <TouchableOpacity style={[styles.secondaryBtn, disabled && { opacity: 0.6 }]} onPress={onPress} disabled={disabled}>
      <Text style={styles.secondaryBtnText}>{title}</Text>
    </TouchableOpacity>
  );
}

export function FormField({ label, ...inputProps }) {
  return (
    <View style={{ marginBottom: 14 }}>
      {label && <Text style={styles.label}>{label}</Text>}
      <TextInput style={styles.input} placeholderTextColor="#9AA39C" {...inputProps} />
    </View>
  );
}

export function Alert({ type = 'error', message }) {
  if (!message) return null;
  const isError = type === 'error';
  return (
    <View style={[styles.alert, { backgroundColor: isError ? '#FBE3DA' : '#E3F0E5', borderColor: isError ? '#F0BBA3' : '#BBDCC0' }]}>
      <Text style={{ color: isError ? '#8A2E10' : '#1B4332', fontSize: 13 }}>{message}</Text>
    </View>
  );
}

export function EmptyState({ text }) {
  return <Text style={{ textAlign: 'center', color: '#8A9189', padding: 32 }}>{text}</Text>;
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderColor: colors.line, backgroundColor: '#fff' },
  primaryBtn: { backgroundColor: colors.forest, paddingVertical: 14, borderRadius: 10, alignItems: 'center', marginTop: 8 },
  primaryBtnText: { color: colors.cream, fontWeight: '700', fontSize: 16 },
  secondaryBtn: { borderWidth: 1.5, borderColor: colors.forest, paddingVertical: 12, borderRadius: 10, alignItems: 'center' },
  secondaryBtnText: { color: colors.forest, fontWeight: '700' },
  label: { fontSize: 13, fontWeight: '600', color: colors.ink, marginBottom: 6 },
  input: { borderWidth: 1.5, borderColor: colors.line, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, backgroundColor: '#fff', color: colors.ink },
  alert: { borderWidth: 1, borderRadius: 10, padding: 12, marginBottom: 14 }
});
