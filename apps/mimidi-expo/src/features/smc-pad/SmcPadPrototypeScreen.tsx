import { StyleSheet, Text, View } from 'react-native';
import { PrototypeShell } from '@/src/components/PrototypeShell';
import { SelectLike, SurfaceButton } from '@/src/components/PrototypeUI';
import { mimidiTheme } from '@/src/theme/mimidiTheme';

const padItems = [
  { index: 1, label: 'KICK' },
  { index: 2, label: 'SNARE' },
  { index: 3, label: 'HIHAT' },
  { index: 4, label: 'CLAP' },
  { index: 5, label: 'PERC 1' },
  { index: 6, label: 'PERC 2' },
  { index: 7, label: 'PERC 3' },
  { index: 8, label: 'PERC 4' },
] as const;

export function SmcPadPrototypeScreen() {
  return (
    <PrototypeShell currentRoute="smc-pad">
      <View style={styles.toolbar}>
        <View style={styles.toolbarLeft}>
          <SelectLike value="STANDARD" width={142} />
          <SelectLike value="TUNE" width={126} />
        </View>
        <SurfaceButton compact>↶</SurfaceButton>
      </View>

      <View style={styles.grid}>
        {padItems.map((pad) => (
          <View key={pad.index} style={styles.pad}>
            <Text style={styles.padIndex}>{pad.index}</Text>
            <Text style={styles.padLabel}>{pad.label}</Text>
          </View>
        ))}
      </View>
    </PrototypeShell>
  );
}

const styles = StyleSheet.create({
  toolbar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: mimidiTheme.spacing.md,
  },
  toolbarLeft: {
    flexDirection: 'row',
    gap: mimidiTheme.spacing.md,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: mimidiTheme.spacing.md,
  },
  pad: {
    width: '23.8%',
    minHeight: 142,
    borderRadius: mimidiTheme.radius.sm,
    borderWidth: 1,
    borderColor: mimidiTheme.colors.border,
    backgroundColor: mimidiTheme.colors.keyWhite,
    alignItems: 'center',
    justifyContent: 'center',
    gap: mimidiTheme.spacing.sm,
  },
  padIndex: {
    color: mimidiTheme.colors.ink,
    fontSize: 28,
    fontWeight: '500',
  },
  padLabel: {
    color: mimidiTheme.colors.ink,
    fontSize: 18,
    fontWeight: '500',
  },
});
