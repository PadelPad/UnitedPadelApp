// components/ui/CustomTabBar.tsx
import React from 'react';
import { View, Pressable, Text, StyleSheet } from 'react-native';
import { type BottomTabBarProps } from '@react-navigation/bottom-tabs';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '@/lib/theme';

const ICON_FOR: Record<string, keyof typeof Ionicons.glyphMap> = {
  'home/index': 'home',
  'matches/index': 'tennisball',
  'leaderboard/index': 'trophy',
  'clubs/index': 'business',
  'profile/index': 'person',
};

export default function CustomTabBar(props: BottomTabBarProps) {
  const { state, descriptors, navigation } = props;
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.wrap, { paddingBottom: Math.max(insets.bottom, 8) }]}>
      <View style={styles.bar}>
        {state.routes.map((route, index) => {
          const focused = state.index === index;
          const { options } = descriptors[route.key];

          // normalize label to string (avoid function/ReactNode type error)
          let label: string =
            (typeof options.tabBarLabel === 'string' && options.tabBarLabel) ||
            (typeof options.title === 'string' && options.title) ||
            route.name.replace('/index', '').split('/').pop() ||
            'Tab';

        const iconName: keyof typeof Ionicons.glyphMap =
            ICON_FOR[route.name] || 'ellipse';

          const onPress = () => {
            if (!focused) {
              navigation.navigate(route.name as never);
            }
          };

          const onLongPress = () => {
            navigation.emit({ type: 'tabLongPress', target: route.key });
          };

          return (
            <Pressable
              key={route.key}
              onPress={onPress}
              onLongPress={onLongPress}
              style={styles.tab}
              accessibilityRole="button"
              accessibilityLabel={label}
            >
              <View style={[styles.iconPill, focused && styles.iconPillActive]}>
                <Ionicons
                  name={iconName}
                  size={18}
                  color={focused ? colors.primary : '#cfd3da'}
                />
              </View>
              <Text style={[styles.label, focused && styles.labelActive]}>
                {label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    backgroundColor: 'transparent',
  },
  bar: {
    marginHorizontal: 10,
    marginTop: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.outline,
    backgroundColor: '#0e1116ee',
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    gap: 6,
  },
  iconPill: {
    width: 34,
    height: 34,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.outline,
    backgroundColor: colors.card,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconPillActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primary15,
  },
  label: {
    fontSize: 11,
    color: '#cfd3da',
    fontWeight: '700',
  },
  labelActive: {
    color: colors.primary,
  },
});
