import { TouchableOpacity, View, Text, Image, StyleSheet } from 'react-native';
import { colors } from '../theme';

export default function ProductCard({ product, onPress }) {
  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.85}>
      <View style={styles.imageWrap}>
        {product.images?.[0] ? (
          <Image source={{ uri: product.images[0] }} style={styles.image} />
        ) : (
          <Text style={styles.noImage}>No image</Text>
        )}
      </View>
      <View style={styles.body}>
        {product.is_trending && <Text style={styles.badge}>Trending</Text>}
        <Text style={styles.title} numberOfLines={2}>{product.title}</Text>
        <Text style={styles.price}>{product.currency} {Number(product.price).toLocaleString()}</Text>
        {product.shop_name && <Text style={styles.meta}>{product.shop_name}</Text>}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1, margin: 6, backgroundColor: '#fff', borderRadius: 12,
    borderWidth: 1, borderColor: colors.line, overflow: 'hidden'
  },
  imageWrap: { width: '100%', aspectRatio: 1, backgroundColor: colors.creamDim, alignItems: 'center', justifyContent: 'center' },
  image: { width: '100%', height: '100%' },
  noImage: { color: '#B8AE93', fontSize: 12 },
  body: { padding: 10, gap: 4 },
  badge: { fontSize: 10, fontWeight: '700', color: colors.terracotta, backgroundColor: '#FBE8DB', alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 999, textTransform: 'uppercase' },
  title: { fontSize: 13, fontWeight: '600', color: colors.ink },
  price: { fontSize: 15, fontWeight: '800', color: colors.forest },
  meta: { fontSize: 11, color: '#8A9189' }
});
