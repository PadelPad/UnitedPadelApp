import React, { useMemo, useRef } from "react";
import { View, Text, ScrollView, Pressable, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
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

export default function TermsScreen() {
  const router = useRouter();
  const scrollRef = useRef<ScrollView>(null);

  const sections = useMemo<Section[]>(
    () => [
      {
        id: "intro",
        title: "1. Introduction",
        body: (
          <Text style={s.p}>
            Welcome to United Padel. These Terms govern your access to our apps, website, leaderboard,
            tournaments, and related services. By creating an account or using the product, you agree to these
            Terms.
          </Text>
        ),
      },
      {
        id: "eligibility",
        title: "2. Eligibility & Account Creation",
        body: (
          <View style={{ gap: 6 }}>
            <Text style={s.li}>• You must be at least 13 years old.</Text>
            <Text style={s.li}>• Provide accurate personal information.</Text>
            <Text style={s.li}>• Maintain only one individual or club account unless authorized.</Text>
            <Text style={s.p}>
              You are responsible for keeping your credentials secure; we’re not liable for loss resulting
              from unauthorized access to your account.
            </Text>
          </View>
        ),
      },
      {
        id: "matches",
        title: "3. Match Submissions & Leaderboards",
        body: (
          <View style={{ gap: 6 }}>
            <Text style={s.li}>• Results you submit must be accurate and may be publicly displayed.</Text>
            <Text style={s.li}>• Ratings are updated by our Elo-based system.</Text>
            <Text style={s.li}>• Falsifying results may lead to suspension or permanent ban.</Text>
          </View>
        ),
      },
      {
        id: "avatars",
        title: "4. Avatar & Image Policy",
        body: (
          <View style={{ gap: 6 }}>
            <Text style={s.li}>• Only upload images you have the right to use.</Text>
            <Text style={s.li}>
              • You grant us a license to store and display your avatar on your profile and leaderboard.
            </Text>
            <Text style={s.li}>• Inappropriate or offensive images are prohibited.</Text>
          </View>
        ),
      },
      {
        id: "payments",
        title: "5. Subscriptions & Payments",
        body: (
          <View style={{ gap: 6 }}>
            <Text style={s.li}>
              • Some features require a paid subscription processed via Stripe; auto-renew applies unless
              canceled.
            </Text>
            <Text style={s.li}>• Refunds follow our cancellation policy.</Text>
            <Text style={s.li}>• Plan features and pricing may change with prior notice.</Text>
          </View>
        ),
      },
      {
        id: "conduct",
        title: "6. User Conduct",
        body: (
          <View style={{ gap: 6 }}>
            <Text style={s.li}>• No harassment, impersonation, or abusive behavior.</Text>
            <Text style={s.li}>• Don’t upload illegal, harmful, or misleading content.</Text>
            <Text style={s.li}>• No bots or scripts to game rankings or referrals.</Text>
            <Text style={s.p}>Violations may result in account termination.</Text>
          </View>
        ),
      },
      {
        id: "privacy",
        title: "7. Privacy",
        body: (
          <Text style={s.p}>
            Your data is handled under our Privacy Policy. We process information securely and do not sell
            your personal data.
          </Text>
        ),
      },
      {
        id: "availability",
        title: "8. Platform Availability",
        body: (
          <Text style={s.p}>
            We aim for consistent access but do not guarantee uninterrupted service. Maintenance, updates, or
            external factors may affect availability.
          </Text>
        ),
      },
      {
        id: "liability",
        title: "9. Limitation of Liability",
        body: (
          <View style={{ gap: 6 }}>
            <Text style={s.li}>• We’re not liable for real-world injuries or losses in matches.</Text>
            <Text style={s.li}>• We’re not liable for errors in match processing or ranking.</Text>
            <Text style={s.li}>• We’re not liable for user-generated content.</Text>
          </View>
        ),
      },
      {
        id: "law",
        title: "10. Governing Law",
        body: (
          <Text style={s.p}>
            These Terms are governed by the laws of the United Kingdom. Disputes are resolved in UK
            jurisdiction.
          </Text>
        ),
      },
      {
        id: "changes",
        title: "11. Changes to Terms",
        body: (
          <Text style={s.p}>
            We may update the Terms from time to time. Continued use after changes constitutes acceptance of
            the new Terms.
          </Text>
        ),
      },
      {
        id: "contact",
        title: "12. Contact",
        body: <Text style={s.p}>Questions? Email support@unitedpadel.co.uk</Text>,
      },
    ],
    []
  );

  const jumpTo = (targetId: string) => {
    // naive “jump”: find index and scroll to an approximate Y position
    const idx = sections.findIndex((s) => s.id === targetId);
    if (idx <= 0 || !scrollRef.current) return;
    // header ~220px + padding + card heights; this just gets us close
    scrollRef.current.scrollTo({ y: 220 + idx * 220, animated: true });
  };

  return (
    <View style={{ flex: 1, backgroundColor: palette.bg }}>
      <LinearGradient colors={["#111522", "#0b0e13"]} style={s.header}>
        <Text style={s.kicker}>Legal</Text>
        <Text style={s.title}>Terms of Service</Text>
        <View style={s.chips}>
          <View style={s.chip}>
            <Text style={s.chipText}>Last updated: Aug 3, 2025</Text>
          </View>
        </View>
      </LinearGradient>

      <ScrollView ref={scrollRef} contentContainerStyle={{ padding: 16, paddingBottom: 36 }}>
        {/* Quick jumps */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 12 }}>
          <View style={{ flexDirection: "row", gap: 8 }}>
            {sections.map((sct) => (
              <Pressable key={sct.id} onPress={() => jumpTo(sct.id)} style={s.pill}>
                <Text style={s.pillText}>{sct.title.replace(/^\d+\.\s/, "")}</Text>
              </Pressable>
            ))}
          </View>
        </ScrollView>

        {/* Content cards */}
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
