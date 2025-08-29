import { View, Text, StyleSheet } from 'react-native';

export default function ClubsScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.h1}>Clubs</Text>
      <Text style={styles.sub}>Find clubs and view their pages.</Text>
    </View>
  );
}
const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: '#0b0e13' },
  h1: { fontSize: 22, fontWeight: '700', color: '#fff' },
  sub: { color: '#c1c7d0', marginTop: 6 },
});
