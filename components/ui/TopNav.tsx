import React from 'react';
import { View, Text, Pressable, Image } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';
import { colors } from '@/lib/theme';

/** ✅ Your actual logo file (NOT the wallpaper) */
const logo = require('../../assets/logo/unitedpadel-mark.png');

export default function TopNav() {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  return (
    <View
      style={{
        paddingTop: insets.top + 6,
        paddingHorizontal: 18,
        paddingBottom: 10,
        backgroundColor: 'transparent', // let wallpaper show through
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        <Image
          source={logo}
          style={{
            width: 28,
            height: 28,
            borderRadius: 8,
            marginRight: 10,
          }}
        />
        <Text
          style={{
            color: '#fff',
            fontSize: 22,
            fontWeight: '900',
            flex: 1,
          }}
          numberOfLines={1}
        >
          United Padel
        </Text>

        <Pressable
          onPress={() => router.push('/search')}
          style={{
            width: 40,
            height: 40,
            borderRadius: 12,
            backgroundColor: 'rgba(255,255,255,0.06)',
            borderWidth: 1,
            borderColor: 'rgba(255,255,255,0.08)',
            alignItems: 'center',
            justifyContent: 'center',
            marginRight: 8,
          }}
        >
          <Ionicons name="search" size={18} color="#fff" />
        </Pressable>

        <Pressable
          onPress={() => router.push('/notifications')}
          style={{
            width: 40,
            height: 40,
            borderRadius: 12,
            backgroundColor: 'rgba(255,255,255,0.06)',
            borderWidth: 1,
            borderColor: 'rgba(255,255,255,0.08)',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Ionicons name="notifications-outline" size={18} color="#fff" />
        </Pressable>
      </View>
    </View>
  );
}
