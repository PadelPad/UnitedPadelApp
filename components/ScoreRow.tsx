// components/ScoreRow.tsx
import { View, TextInput, Text, Switch } from 'react-native';

export function ScoreRow({
  value,
  onChange,
  index,
  allowSuper,
}: {
  value: { t1: number; t2: number; super_tiebreak?: boolean };
  onChange: (v: { t1: number; t2: number; super_tiebreak?: boolean }) => void;
  index: number;
  allowSuper?: boolean;
}) {
  const update = (k: 't1' | 't2', n: string) => {
    const v = parseInt(n.replace(/[^0-9]/g, ''), 10);
    onChange({ ...value, [k]: Number.isFinite(v) ? v : 0 });
  };

  const stb = !!value.super_tiebreak;

  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
      <Text style={{ width: 60 }}>Set {index + 1}</Text>
      <TextInput
        keyboardType="number-pad"
        value={String(value.t1 ?? 0)}
        onChangeText={(t) => update('t1', t)}
        style={{ borderWidth: 1, padding: 8, width: 50, borderRadius: 8 }}
        accessibilityLabel={`Team 1 games set ${index + 1}`}
      />
      <Text style={{ fontSize: 16 }}>–</Text>
      <TextInput
        keyboardType="number-pad"
        value={String(value.t2 ?? 0)}
        onChangeText={(t) => update('t2', t)}
        style={{ borderWidth: 1, padding: 8, width: 50, borderRadius: 8 }}
        accessibilityLabel={`Team 2 games set ${index + 1}`}
      />
      {allowSuper && (
        <View style={{ flexDirection: 'row', alignItems: 'center', marginLeft: 8 }}>
          <Text>Super TB</Text>
          <Switch value={stb} onValueChange={(v) => onChange({ ...value, super_tiebreak: v })} />
        </View>
      )}
    </View>
  );
}
