import React, { useMemo, useRef } from "react";
import { View, Text, ScrollView, Pressable, StyleSheet } from "react-native";
import { LinearGradient } from "expo-linear-gradient";

const palette = {
  bg: "#0b0e13",
  panel: "#0e1116",
  border: "#1f2630",
  text: "#ffffff",
  sub: "#9aa0a6",
  accent: "#ff6a00",
  accentSoft: "#ffb86b",
};

type Section = { id: string; title: string; body: React.ReactNode };

export default function PrivacyScreen() {
  const scrollRef = useRef<ScrollView>(null);

  const sections = useMemo<Section[]>(
    () => [
      {
        id: "intro",
        title: "1. Introduction",
        body: (
          <Text style={s.p}>
            This policy explains how United Padel collects, uses, and protects your information when you use
            our platform.
          </Text>
        ),
      },
      {
        id: "collect",
        title: "2. What We Collect",
        body: (
          <View style={{ gap: 6 }}>
            <Text style={s.li}>• Personal identifiers (name, email, phone number)</Text>
            <Text style={s.li}>• Demographic info (age, gender, location)</Text>
            <Text style={s.li}>• Profile data (avatar, bio, rating)</Text>
            <Text style={s.li}>• Match data and performance history</Text>
            <Text style={s.li}>• Payment details (processed securely by Stripe)</Text>
          </View>
        ),
      },
      {
        id: "use",
        title: "3. How We Use Your Information",
        body: (
          <View style={{ gap: 6 }}>
            <Text style={s.li}>• Operate and improve the platform</Text>
            <Text style={s.li}>• Deliver rankings, tournaments, and analytics</Text>
            <Text style={s.li}>• Offer customer support</Text>
            <Text style={s.li}>• Send match confirmations and notifications</Text>
            <Text style={s.li}>• Track badges, referrals, and engagement</Text>
          </View>
        ),
      },
      {
        id: "sharing",
        title: "4. Data Sharing",
        body: (
          <View style={{ gap: 6 }}>
            <Text style={s.p}>We do not sell your data. We may share limited info:</Text>
            <Text style={s.li}>• With clubs/tournament hosts you interact with</Text>
            <Text style={s.li}>• With Stripe for payment processing</Text>
            <Text style={s.li}>• When required by law</Text>
          </View>
        ),
      },
      {
        id: "security",
        title: "5. Storage & Security",
        body: (
          <Text style={s.p}>
            Your data is stored securely with Supabase and Stripe using industry-standard protections.
            However, no method is 100% secure.
          </Text>
        ),
      },
      {
        id: "rights",
        title: "6. Your Rights",
        body: (
          <View style={{ gap: 6 }}>
            <Text style={s.li}>• View and update your profile</Text>
            <Text style={s.li}>• Request data deletion (support@unitedpadel.co.uk)</Text>
            <Text style={s.li}>• Opt out of promotional emails</Text>
          </View>
        ),
      },
      {
        id: "cookies",
        title: "7. Cookies & Tracking",
        body: (
          <Text style={s.p}>
            We use cookies to improve experience and analytics. You can disable cookies in browser settings.
          </Text>
        ),
      },
      {
        id: "retention",
        title: "8. Data Retention",
        body: (
          <Text style={s.p}>
            We retain data while your account is active or as needed to meet legal obligations.
          </Text>
        ),
      },
      {
        id: "updates",
        title: "9. Updates",
        body: (
          <Text style={s.p}>
            We may update this policy. We’ll notify you through the platform or email when we do.
          </Text>
        ),
      },
      {
        id: "contact",
        title: "10. Contact",
        body: <Text style={s.p}>Questions or data requests: support@unitedpadel.co.uk</Text>,
      },
    ],
    []
  );

  const jumpTo = (id: string) => {
    const idx = sections.findIndex((s) => s.id === id);
    if (idx <= 0 || !scrollRef.current) return;
    scrollRef.current.scrollTo({ y: 220 + idx * 220, animated: true });
  };

  return (
    <View style={{ flex: 1, backgroundColor: palette.bg }}>
      <LinearGradient colors={["#111522", "#0b0e13"]} style={s.header}>
        <Text style={s.kicker}>Legal</Text>
        <Text style={s.title}>Privacy Policy</Text>
        <View style={s.chips}>
          <View style={s.chip}>
            <Text style={s.chipText}>Effective: Aug 2025</Text>
          </View>
        </View>
      </LinearGradient>

      <ScrollView ref={scrollRef} contentContainerStyle={{ padding: 16, paddingBottom: 36 }}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 12 }}>
          <View style={{ flexDirection: "row", gap: 8 }}>
            {sections.map((sct) => (
              <Pressable key={sct.id} onPress={() => jumpTo(sct.id)} style={s.pill}>
                <Text style={s.pillText}>{sct.title.replace(/^\d+\.\s/, "")}</Text>
              </Pressable>
            ))}
          </View>
        </ScrollView>

        <View style={{ gap: 12 }}>
          {sections.map((sct) => (
            <View key={sct.id} style={s.card}>
              <Text style={s.h2}>{sct.title}</Text>
              <View style={{ marginTop: 6 }}>{sct.body}</View>
            </View>
          ))}
        </View>
        <View style={{ height: 16 }} />
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  header: { paddingTop: 18, paddingHorizontal: 16, paddingBottom: 14, borderBottomWidth: 1, borderBottomColor: palette.border },
  kicker: { color: palette.sub, fontWeight: "800", marginBottom: 4 },
  title: { color: palette.text, fontSize: 26, fontWeight: "900" },
  chips: { flexDirection: "row", gap: 8, marginTop: 8 },
  chip: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: palette.border,
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: "#10151d",
  },
  chipText: { color: palette.sub, fontWeight: "700", fontSize: 12 },

  pill: {
    borderWidth: 1,
    borderColor: palette.border,
    backgroundColor: "#10151d",
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  pillText: { color: palette.sub, fontWeight: "700" },

  card: {
    backgroundColor: palette.panel,
    borderWidth: 1,
    borderColor: palette.border,
    borderRadius: 14,
    padding: 14,
  },
  h2: { color: palette.text, fontWeight: "900", fontSize: 16 },
  p: { color: palette.sub, lineHeight: 20 },
  li: { color: palette.sub, lineHeight: 20 },
});
