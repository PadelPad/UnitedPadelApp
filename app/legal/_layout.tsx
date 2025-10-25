import { Stack } from "expo-router";

export default function LegalLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: "#0b0e13" },
        headerTintColor: "#fff",
        headerShadowVisible: false,
      }}
    />
  );
}
