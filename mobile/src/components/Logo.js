import { View, Text, Image } from 'react-native';
import { colors } from '../theme';

// Lightweight, dependency-free recreation of the web mark (no react-native-svg
// dependency needed): a rounded forest-green tile with an amber accent dot,
// next to the JEDIDA wordmark. Swap for the real SVG via react-native-svg
// + react-native-svg-transformer if you want pixel-exact parity later.
export default function Logo({ size = 36, withWordmark = true, light = false, overrideUrl = null }) {
  const inkColor = light ? colors.cream : colors.ink;

  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
      {overrideUrl ? (
        <Image source={{ uri: overrideUrl }} style={{ width: size, height: size, borderRadius: size * 0.25 }} />
      ) : (
        <View style={{
          width: size, height: size, borderRadius: size * 0.28, backgroundColor: colors.forest,
          alignItems: 'center', justifyContent: 'center'
        }}>
          <View style={{ width: size * 0.3, height: size * 0.5, borderLeftWidth: 3, borderBottomWidth: 3, borderColor: colors.amber, borderBottomLeftRadius: 8 }} />
        </View>
      )}
      {withWordmark && (
        <Text style={{ fontWeight: '800', fontSize: size * 0.42, color: inkColor }}>
          JEDIDA <Text style={{ color: colors.amber }}>Marketplace</Text>
        </Text>
      )}
    </View>
  );
}
