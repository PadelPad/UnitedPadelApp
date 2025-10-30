// components/ui/Button.tsx
import React from 'react';
import { Pressable, Text, ViewStyle, TextStyle } from 'react-native';
import { colors, radii } from '@/lib/theme';

type Variant = 'primary' | 'outline' | 'ghost';
type Size = 'md' | 'lg';

type Props = {
  title: string;
  onPress?: () => void;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  variant?: Variant;
  size?: Size;
  style?: ViewStyle;
  textStyle?: TextStyle;
  disabled?: boolean;
  accessibilityLabel?: string;
};

export default function Button({
  title,
  onPress,
  leftIcon,
  rightIcon,
  variant = 'primary',
  size = 'md',
  style,
  textStyle,
  disabled,
  accessibilityLabel,
}: Props) {
  const padV = size === 'lg' ? 14 : 12;
  const padH = size === 'lg' ? 18 : 14;

  const bg =
    variant === 'primary' ? colors.primary : variant === 'outline' ? 'transparent' : 'transparent';
  const borderColor = variant === 'outline' ? colors.primary : colors.outline;
  const textColor = variant === 'primary' ? colors.bg : colors.text;

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel || title}
      style={[
        {
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: radii.lg,
          paddingVertical: padV,
          paddingHorizontal: padH,
          backgroundColor: bg,
          borderWidth: variant === 'outline' ? 1 : 0,
          borderColor,
          opacity: disabled ? 0.6 : 1,
        },
        style,
      ]}
    >
      {leftIcon ? <>{leftIcon}</> : null}
      <Text
        style={[
          {
            color: textColor,
            fontWeight: '900',
            fontSize: size === 'lg' ? 16 : 15,
            marginHorizontal: 8,
          },
          textStyle,
        ]}
      >
        {title}
      </Text>
      {rightIcon ? <>{rightIcon}</> : null}
    </Pressable>
  );
}
