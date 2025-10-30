// components/cards/Podium.tsx
import React from "react";
import { View, Text, StyleSheet, Image } from "react-native";
import { Trophy } from "lucide-react-native";

type Item = {
  id: string;
  display_name: string | null;
  avatar_url: string | null;
  rating: number | null;
};

export default function Podium({ items }: { items: Item[] }) {
  if (!items?.length) return null;
  const [gold, silver, bronze] = [
    items[0],
    items[1] ?? null,
    items[2] ?? null,
  ];

  const Pod = ({ p, color, place }: { p: Item | null; color: "gold"|"silver"|"bronze"; place: 1|2|3 }) => {
    if (!p) return <View style={[styles.pod, styles[`pod_${color}` as const], styles.podEmpty]} />;
    return (
      <View style={[styles.pod, styles[`pod_${color}` as const]]}>
        <View style={styles.avatarWrap}>
          {p.avatar_url ? (
            <Image source={{ uri: p.avatar_url }} style={styles.avatar} />
          ) : (
            <View style={styles.avatarFallback}><Text style={styles.avatarFallbackText}>{(p.display_name ?? "?").slice(0,1).toUpperCase()}</Text></View>
          )}
        </View>
        <View style={styles.placeRow}>
          <Trophy size={18} />
          <Text style={styles.placeText}>#{place}</Text>
        </View>
        <Text style={styles.name} numberOfLines={1}>{p.display_name ?? "Player"}</Text>
        <Text style={styles.rating}>{Math.round(p.rating ?? 1000)}</Text>
      </View>
    );
  };

  return (
    <View style={styles.wrap}>
      <Pod p={silver} color="silver" place={2} />
      <Pod p={gold} color="gold" place={1} />
      <Pod p={bronze} color="bronze" place={3} />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flexDirection: "row", alignItems: "flex-end", justifyContent: "center", gap: 12, marginBottom: 16 },
  pod: { width: 110, borderRadius: 18, paddingVertical: 14, paddingHorizontal: 10, alignItems: "center", shadowOpacity: 0.35, shadowRadius: 12, shadowOffset: { width: 0, height: 6 } },
  podEmpty: { opacity: 0.3 },
  pod_gold: { backgroundColor: "#2A1B00", shadowColor: "#FFB200", borderWidth: 1, borderColor: "#FFB20080" },
  pod_silver: { backgroundColor: "#1E232A", shadowColor: "#B0C4DE", borderWidth: 1, borderColor: "#B0C4DE80" },
  pod_bronze: { backgroundColor: "#2B1E17", shadowColor: "#CD7F32", borderWidth: 1, borderColor: "#CD7F3280" },
  avatarWrap: { width: 64, height: 64, borderRadius: 32, overflow: "hidden", marginBottom: 8, backgroundColor: "#111", borderWidth: 1, borderColor: "#ffffff20" },
  avatar: { width: "100%", height: "100%" },
  avatarFallback: { flex: 1, alignItems: "center", justifyContent: "center" },
  avatarFallbackText: { color: "white", fontWeight: "700", fontSize: 22 },
  placeRow: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 4 },
  placeText: { color: "white", fontWeight: "700" },
  name: { color: "white", fontWeight: "600", fontSize: 14, marginBottom: 2 },
  rating: { color: "#FFD18A", fontWeight: "800", fontSize: 16 },
});
