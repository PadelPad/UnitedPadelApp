import { useState } from 'react';
import { View, Text, TextInput, Pressable, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { supabase } from '@/lib/supabase';

export default function SetNewPassword() {
  const r = useRouter();
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);

  const onSave = async () => {
    if (!password || password.length < 6) return Alert.alert('Password too short', 'Use at least 6 characters.');
    setBusy(true);
    const { error } = await supabase.auth.updateUser({ password });
    setBusy(false);
    if (error) Alert.alert('Error', error.message);
    else {
      Alert.alert('Updated', 'Your password has been changed.');
      r.replace('/(tabs)/home');
    }
  };

  return (
    <View style={{ flex:1, backgroundColor:'#0b0e13', padding:20, justifyContent:'center', gap:12 }}>
      <Text style={{ color:'#fff', fontSize:24, fontWeight:'900' }}>Set a new password</Text>
      <TextInput
        placeholder="New password"
        placeholderTextColor="#6f7783"
        secureTextEntry
        value={password}
        onChangeText={setPassword}
        style={{ color:'#fff', backgroundColor:'#10151d', borderWidth:1, borderColor:'#1f2630', borderRadius:10, padding:12 }}
      />
      <Pressable disabled={busy} onPress={onSave} style={{ backgroundColor:'#ff6a00', padding:12, borderRadius:12, alignItems:'center', marginTop:8 }}>
        <Text style={{ color:'#0b0e13', fontWeight:'800' }}>{busy ? 'Saving…' : 'Save password'}</Text>
      </Pressable>
    </View>
  );
}
