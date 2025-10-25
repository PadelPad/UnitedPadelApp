import { Pressable, Text } from "react-native";
import { useRouter } from "expo-router";
import * as Haptics from "expo-haptics";
import { supabase } from "@/lib/supabase";
import { colors, radii } from "@/lib/theme";

export default function LogoutButton() {
  const router = useRouter();

  const onLogout = async () => {
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      await supabase.auth.signOut();
      router.replace("/(auth)"); // back to welcome
    } catch (e) {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      console.warn("[Logout]", e);
    }
  };

  return (
    <Pressable
      onPress={onLogout}
      style={{ borderWidth: 1, borderColor: colors.outline, paddingVertical: 10, borderRadius: radii.md, alignItems: "center" }}
    >
      <Text style={{ color: "#fff", fontWeight: "700" }}>Log out</Text>
    </Pressable>
  );
}
