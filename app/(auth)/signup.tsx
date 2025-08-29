import React, { useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  Pressable,
  ActivityIndicator,
  Alert,
  Platform,
  ScrollView,
} from "react-native";
import { Stack, Link, useRouter } from "expo-router";
import Ionicons from "@expo/vector-icons/Ionicons";
import { z } from "zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";

const C = {
  bg: "#0b0e13",
  panel: "#0e1116",
  border: "#1f2630",
  text: "#fff",
  sub: "#9aa0a6",
  orange: "#ff6a00",
  danger: "#ff5555",
};

type AccountType = "individual" | "club";
type Region = { id: string; name: string };

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(6, "Min 6 characters"),
  username: z.string().min(2).max(32),
  fullName: z.string().min(2).max(60),
  regionId: z.string().uuid().optional(),
  regionName: z.string().optional(),
  gender: z.enum(["male", "female", "other"]).optional(),
  preferred_format: z.enum(["singles", "doubles", "mixed"]).optional(),
  accountType: z.enum(["individual", "club"]),
  clubName: z.string().optional(),
  clubLocation: z.string().optional(),
  clubBio: z.string().optional(),
});

async function fetchRegions(): Promise<Region[]> {
  const { data, error } = await supabase
    .from("regions")
    .select("id, name")
    .order("name", { ascending: true });
  if (error) throw error;
  return (data ?? []) as Region[];
}

export default function SignupScreen() {
  const router = useRouter();

  // step control
  const [step, setStep] = useState<1 | 2 | 3>(1);

  // fields
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [username, setUsername] = useState("");
  const [fullName, setFullName] = useState("");

  // region from DB
  const { data: regions = [], isLoading: regionsLoading } = useQuery({
    queryKey: ["regions"],
    queryFn: fetchRegions,
  });
  const [regionId, setRegionId] = useState<string>("");
  const selectedRegion = regions.find((r) => r.id === regionId) || null;

  const [gender, setGender] = useState<"male" | "female" | "other" | "">("");
  const [preferred, setPreferred] = useState<"singles" | "doubles" | "mixed" | "">("");

  const [accountType, setAccountType] = useState<AccountType>("individual");
  const [clubName, setClubName] = useState("");
  const [clubLocation, setClubLocation] = useState("");
  const [clubBio, setClubBio] = useState("");

  const canNext1 = useMemo(() => email.length > 3 && password.length >= 6, [email, password]);
  const canNext2 = useMemo(() => username.length >= 2 && fullName.length >= 2, [username, fullName]);

  const signUp = useMutation({
    mutationFn: async () => {
      // validate
      const parsed = schema.safeParse({
        email,
        password,
        username,
        fullName,
        regionId: regionId || undefined,
        regionName: selectedRegion?.name || undefined,
        gender: (gender || undefined) as any,
        preferred_format: (preferred || undefined) as any,
        accountType,
        clubName: accountType === "club" ? clubName : undefined,
        clubLocation: accountType === "club" ? clubLocation : undefined,
        clubBio: accountType === "club" ? clubBio : undefined,
      });
      if (!parsed.success) {
        throw new Error(parsed.error.errors.map((e) => e.message).join("\n"));
      }

      // create auth user
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
            username,
            region_id: regionId || null,
            region: selectedRegion?.name || null,
            gender: gender || null,
            preferred_format: preferred || null,
            account_type: accountType,
          },
          emailRedirectTo: `${process.env.REACT_APP_APP_URL || "unitedpadel://"}/auth/callback`,
        },
      });
      if (error) throw error;

      // If we have a session (OAuth or email w/ auto-confirm), we can safely upsert now.
      // If no session (email needs verification), RLS will block writes — rely on the DB trigger.
      if (data.session) {
        const uid = data.user?.id;
        if (uid) {
          await supabase
            .from("profiles")
            .upsert({
              id: uid,
              username,
              email,
              region_id: regionId || null,
              region: selectedRegion?.name || null,
              account_type: accountType as any,
            } as any)
            .throwOnError();

          if (accountType === "club") {
            await supabase
              .from("clubs")
              .insert({
                name: clubName || "My Club",
                location: clubLocation || null,
                bio: clubBio || null,
                auth_user_id: uid,
                subscription_tier: "basic",
                subscription_plan: "basic",
              })
              .throwOnError();
          }
        }
      }

      return { needsVerify: !data.session };
    },
    onSuccess: ({ needsVerify }) => {
      if (needsVerify) {
        Alert.alert(
          "Verify your email",
          "We’ve sent a verification link. Open it to finish creating your account."
        );
        router.replace("/(auth)");
      } else {
        router.replace("/(tabs)/home");
      }
    },
    onError: (e: any) => Alert.alert("Signup failed", e?.message ?? "Try again."),
  });

  return (
    <View style={{ flex: 1, backgroundColor: C.bg }}>
      <Stack.Screen
        options={{
          title: "Create account",
          headerStyle: { backgroundColor: C.bg },
          headerTintColor: "#fff",
        }}
      />

      <ScrollView contentContainerStyle={{ padding: 16, gap: 12 }}>
        <Text style={S.h1}>Join United Padel</Text>
        <Steps step={step} />

        {step === 1 && (
          <Card title="Your account">
            <Label>Email</Label>
            <Input
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
              placeholder="you@example.com"
            />
            <Label style={{ marginTop: 10 }}>Password</Label>
            <Input
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              placeholder="••••••••"
            />

            <View style={{ flexDirection: "row", gap: 10, marginTop: 12 }}>
              <Pressable
                style={[S.primary, !canNext1 && { opacity: 0.5 }]}
                onPress={() => canNext1 && setStep(2)}
                disabled={!canNext1}
              >
                <Text style={S.primaryText}>Next</Text>
              </Pressable>
              <SecondaryLink to="/(auth)/login" label="Have an account? Log in" />
            </View>
          </Card>
        )}

        {step === 2 && (
          <Card title="Profile details">
            <Label>Username</Label>
            <Input value={username} onChangeText={setUsername} placeholder="your_handle" autoCapitalize="none" />
            <Label style={{ marginTop: 10 }}>Full name</Label>
            <Input value={fullName} onChangeText={setFullName} placeholder="First Last" />

            {/* Region from DB */}
            <Label style={{ marginTop: 10 }}>Region</Label>
            {regionsLoading ? (
              <View style={S.selectBtn}>
                <ActivityIndicator color={C.orange} />
              </View>
            ) : regions.length === 0 ? (
              <Text style={{ color: C.sub }}>
                No regions found. Add rows to <Text style={{ color: C.orange }}>public.regions</Text>.
              </Text>
            ) : (
              <RegionSelect
                regions={regions}
                selectedId={regionId}
                onSelect={setRegionId}
              />
            )}

            <Label style={{ marginTop: 10 }}>Gender</Label>
            <Pills
              items={[
                { key: "male", label: "Male" },
                { key: "female", label: "Female" },
                { key: "other", label: "Other" },
              ]}
              selectedKey={gender}
              onSelect={(k) => setGender(k as any)}
            />

            <Label style={{ marginTop: 10 }}>Preferred format</Label>
            <Pills
              items={[
                { key: "singles", label: "Singles" },
                { key: "doubles", label: "Doubles" },
                { key: "mixed", label: "Mixed" },
              ]}
              selectedKey={preferred}
              onSelect={(k) => setPreferred(k as any)}
            />

            <View style={{ flexDirection: "row", gap: 10, marginTop: 12 }}>
              <Pressable style={S.secondary} onPress={() => setStep(1)}>
                <Ionicons name="chevron-back" size={16} color={C.orange} />
                <Text style={S.secondaryText}>Back</Text>
              </Pressable>
              <Pressable
                style={[S.primary, !canNext2 && { opacity: 0.5 }]}
                onPress={() => canNext2 && setStep(3)}
                disabled={!canNext2}
              >
                <Text style={S.primaryText}>Next</Text>
              </Pressable>
            </View>
          </Card>
        )}

        {step === 3 && (
          <Card title="Account type">
            <Label>Choose one</Label>
            <Pills
              items={[
                { key: "individual", label: "Individual" },
                { key: "club", label: "Club" },
              ]}
              selectedKey={accountType}
              onSelect={(k) => setAccountType(k as AccountType)}
            />

            {accountType === "club" && (
              <View style={{ marginTop: 10 }}>
                <Label>Club name</Label>
                <Input value={clubName} onChangeText={setClubName} placeholder="United Padel Club" />
                <Label style={{ marginTop: 10 }}>Location</Label>
                <Input value={clubLocation} onChangeText={setClubLocation} placeholder="City / Area" />
                <Label style={{ marginTop: 10 }}>About the club</Label>
                <Input value={clubBio} onChangeText={setClubBio} multiline placeholder="Short description" />
              </View>
            )}

            <View style={{ flexDirection: "row", gap: 10, marginTop: 12 }}>
              <Pressable style={S.secondary} onPress={() => setStep(2)}>
                <Ionicons name="chevron-back" size={16} color={C.orange} />
                <Text style={S.secondaryText}>Back</Text>
              </Pressable>
              <Pressable
                style={[S.primary, signUp.isPending && { opacity: 0.7 }]}
                onPress={() => signUp.mutate()}
                disabled={signUp.isPending}
              >
                {signUp.isPending ? (
                  <ActivityIndicator color="#0b0e13" />
                ) : (
                  <Text style={S.primaryText}>Create account</Text>
                )}
              </Pressable>
            </View>

            <Text style={{ color: C.sub, fontSize: 12, marginTop: 10 }}>
              By continuing you agree to our{" "}
              <Text style={{ color: C.orange }} onPress={() => router.push("/legal/terms" as any)}>
                Terms
              </Text>{" "}
              and{" "}
              <Text style={{ color: C.orange }} onPress={() => router.push("/legal/privacy" as any)}>
                Privacy Policy
              </Text>
              .
            </Text>
          </Card>
        )}
      </ScrollView>
    </View>
  );
}

/* ---------- tiny UI helpers ---------- */

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={S.card}>
      <Text style={S.cardTitle}>{title}</Text>
      <View style={{ marginTop: 8, gap: 8 }}>{children}</View>
    </View>
  );
}

function Label({ children, style }: any) {
  return <Text style={[{ color: C.sub, fontWeight: "700" }, style]}>{children}</Text>;
}

function Input(props: any) {
  return (
    <TextInput
      {...props}
      placeholderTextColor="#6f7782"
      style={{
        backgroundColor: C.panel,
        borderWidth: 1,
        borderColor: C.border,
        color: C.text,
        paddingHorizontal: 12,
        paddingVertical: Platform.select({ ios: 12, default: 10 }),
        borderRadius: 12,
      }}
    />
  );
}

function Pills({
  items,
  selectedKey,
  onSelect,
}: {
  items: { key: string; label: string }[];
  selectedKey: string | "";
  onSelect: (k: string) => void;
}) {
  return (
    <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
      {items.map((it) => {
        const active = selectedKey === it.key;
        return (
          <Pressable
            key={it.key}
            onPress={() => onSelect(it.key)}
            style={[
              {
                borderWidth: 1,
                borderColor: active ? C.orange : "#28303a",
                borderRadius: 999,
                paddingHorizontal: 12,
                paddingVertical: 6,
                backgroundColor: active ? "#141821" : C.panel,
              },
            ]}
          >
            <Text style={{ color: active ? C.orange : C.sub, fontWeight: "700" }}>{it.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

function Steps({ step }: { step: 1 | 2 | 3 }) {
  const dots = [1, 2, 3] as const;
  return (
    <View style={{ flexDirection: "row", gap: 6, marginBottom: 2 }}>
      {dots.map((d) => (
        <View
          key={d}
          style={{
            width: 8,
            height: 8,
            borderRadius: 4,
            backgroundColor: d <= step ? C.orange : "#2a313c",
          }}
        />
      ))}
    </View>
  );
}

function RegionSelect({
  regions,
  selectedId,
  onSelect,
}: {
  regions: Region[];
  selectedId: string;
  onSelect: (id: string) => void;
}) {
  const selected = regions.find((r) => r.id === selectedId) || null;
  const [open, setOpen] = useState(false);

  return (
    <View>
      <Pressable
        style={S.selectBtn}
        onPress={() => setOpen((v) => !v)}
        accessibilityRole="button"
        accessibilityLabel="Select region"
      >
        <Text style={{ color: selected ? C.text : C.sub }}>
          {selected ? selected.name : "Choose your region"}
        </Text>
        <Ionicons name={open ? "chevron-up" : "chevron-down"} size={18} color={C.sub} />
      </Pressable>

      {open && (
        <View style={S.selectMenu}>
          {regions.map((r) => {
            const active = r.id === selectedId;
            return (
              <Pressable
                key={r.id}
                onPress={() => {
                  onSelect(r.id);
                  setOpen(false);
                }}
                style={[S.selectItem, active && { backgroundColor: "#141821", borderColor: C.orange }]}
              >
                <Text style={{ color: active ? C.orange : C.text }}>{r.name}</Text>
              </Pressable>
            );
          })}
        </View>
      )}
    </View>
  );
}

function SecondaryLink({ to, label }: { to: "/(auth)/login"; label: string }) {
  return (
    <Link href={to}>
      <Text style={{ color: C.sub, fontWeight: "700", alignSelf: "center", marginTop: 10 }}>{label}</Text>
    </Link>
  );
}

const S = StyleSheet.create({
  h1: { color: "#fff", fontSize: 24, fontWeight: "900", marginBottom: 6 },
  card: {
    backgroundColor: C.panel,
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 14,
    padding: 14,
  },
  cardTitle: { color: "#fff", fontWeight: "900", fontSize: 16 },

  primary: {
    flex: 1,
    backgroundColor: C.orange,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    minWidth: 120,
  },
  primaryText: { color: "#0b0e13", fontWeight: "900" },

  secondary: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: C.panel,
    borderWidth: 1,
    borderColor: C.orange,
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 12,
  },
  secondaryText: { color: C.orange, fontWeight: "800" },

  selectBtn: {
    backgroundColor: C.panel,
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: Platform.select({ ios: 12, default: 10 }),
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  selectMenu: {
    marginTop: 8,
    backgroundColor: "#0f131b",
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 12,
    overflow: "hidden",
  },
  selectItem: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#18202a",
  },
});
