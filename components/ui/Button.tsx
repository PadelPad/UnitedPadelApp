// components/ui/Buttons.tsx
import React from "react";
import { Pressable, Text, View, ActivityIndicator, StyleSheet, ViewStyle } from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import { theme, radius } from "./Brand";

type BtnBase = {
  title: string;
  onPress?: () => void;
  leftIcon?: React.ReactNode;
  loading?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
  testID?: string;
};

export function PrimaryButton(props: BtnBase) {
  const { title, onPress, leftIcon, loading, disabled, style, testID } = props;
  return (
    <Pressable
      testID={testID}
      onPress={disabled || loading ? undefined : onPress}
      style={({ pressed }) => [
        styles.base,
        {
          backgroundColor: pressed ? theme.primary600 : theme.primary,
          borderColor: theme.primary,
        },
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color="#0b0e13" />
      ) : (
        <View style={styles.row}>
          {leftIcon ? <View style={styles.icon}>{leftIcon}</View> : null}
          <Text style={[styles.primaryText]}>{title}</Text>
        </View>
      )}
    </Pressable>
  );
}

export function OutlineButton(props: BtnBase) {
  const { title, onPress, leftIcon, loading, disabled, style, testID } = props;
  return (
    <Pressable
      testID={testID}
      onPress={disabled || loading ? undefined : onPress}
      style={({ pressed }) => [
        styles.base,
        {
          backgroundColor: "transparent",
          borderColor: pressed ? theme.primary600 : theme.primary,
        },
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={theme.primary} />
      ) : (
        <View style={styles.row}>
          {leftIcon ? <View style={styles.icon}>{leftIcon}</View> : null}
          <Text style={[styles.outlineText]}>{title}</Text>
        </View>
      )}
    </Pressable>
  );
}

export function SocialButton(props: BtnBase & { variant: "apple" | "google" }) {
  const { title, onPress, loading, variant, style } = props;
  const isApple = variant === "apple";
  return (
    <Pressable
      onPress={loading ? undefined : onPress}
      style={({ pressed }) => [
        styles.base,
        {
          backgroundColor: isApple ? (pressed ? "#0b0b0b" : "#000") : (pressed ? "#28303a" : "#1b222c"),
          borderColor: "#000",
        },
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color="#fff" />
      ) : (
        <View style={styles.row}>
          <Ionicons name={isApple ? "logo-apple" : "logo-google"} size={18} color="#fff" />
          <Text style={[styles.socialText]}>{title}</Text>
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    borderWidth: 1,
    borderRadius: radius.xl,
    paddingVertical: 16,
    paddingHorizontal: 18,
    alignItems: "center",
  },
  row: { flexDirection: "row", alignItems: "center", gap: 8 },
  icon: { marginRight: 6 },
  primaryText: { color: "#0b0e13", fontWeight: "800", fontSize: 16, letterSpacing: 0.3 },
  outlineText: { color: theme.primary, fontWeight: "800", fontSize: 16, letterSpacing: 0.3 },
  socialText: { color: "#fff", fontWeight: "800", fontSize: 16, letterSpacing: 0.3 },
});
