import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';
import { PrototypeShell } from '@/src/components/PrototypeShell';
import { SurfaceButton, SurfacePanel } from '@/src/components/PrototypeUI';
import { mimidiTheme } from '@/src/theme/mimidiTheme';

const pluginItems = [
  { id: 'MC', name: 'M Compressor', meta: 'v1.0.0 · Dynamics', enabled: true },
  { id: 'MR', name: 'M Reverb', meta: 'v1.2.3 · Reverb', enabled: true },
  { id: 'MD', name: 'M Delay', meta: 'v1.0.1 · Delay', enabled: false },
  { id: 'MF', name: 'M Filter', meta: 'v1.1.0 · Filter', enabled: true },
  { id: 'CH', name: 'M Chorus', meta: 'v1.0.0 · Modulation', enabled: false },
] as const;

export function PluginsPrototypeScreen() {
  return (
    <PrototypeShell currentRoute="plugins" scrollable>
      <View style={styles.toolbar}>
        <SurfaceButton>IMPORT</SurfaceButton>
        <SurfaceButton>PLUGIN FOLDER</SurfaceButton>
      </View>

      <SurfacePanel>
        {pluginItems.map((plugin) => (
          <View key={plugin.id} style={styles.pluginRow}>
            <View style={styles.pluginBadge}>
              <Text style={styles.pluginBadgeText}>{plugin.id}</Text>
            </View>
            <View style={styles.pluginInfo}>
              <Text style={styles.pluginName}>{plugin.name}</Text>
              <Text style={styles.pluginMeta}>{plugin.meta}</Text>
            </View>
            <View
              style={[
                styles.checkbox,
                plugin.enabled ? styles.checkboxActive : null,
              ]}
            >
              {plugin.enabled ? (
                <Ionicons color="#F4EFE8" name="checkmark" size={14} />
              ) : null}
            </View>
            <Ionicons
              color={mimidiTheme.colors.inkMuted}
              name="chevron-forward"
              size={18}
            />
          </View>
        ))}
      </SurfacePanel>
    </PrototypeShell>
  );
}

const styles = StyleSheet.create({
  toolbar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: mimidiTheme.spacing.md,
  },
  pluginRow: {
    minHeight: 72,
    borderRadius: mimidiTheme.radius.sm,
    borderWidth: 1,
    borderColor: mimidiTheme.colors.border,
    backgroundColor: mimidiTheme.colors.keyWhite,
    flexDirection: 'row',
    alignItems: 'center',
    gap: mimidiTheme.spacing.md,
    paddingHorizontal: mimidiTheme.spacing.md,
  },
  pluginBadge: {
    width: 40,
    height: 40,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: mimidiTheme.colors.borderStrong,
    backgroundColor: mimidiTheme.colors.cardAlt,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pluginBadgeText: {
    color: mimidiTheme.colors.ink,
    fontSize: 16,
    fontWeight: '700',
  },
  pluginInfo: {
    flex: 1,
  },
  pluginName: {
    color: mimidiTheme.colors.ink,
    fontSize: 18,
    fontWeight: '600',
  },
  pluginMeta: {
    marginTop: 3,
    color: mimidiTheme.colors.inkMuted,
    fontSize: 13,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: mimidiTheme.colors.borderStrong,
    backgroundColor: '#F9F6F1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxActive: {
    backgroundColor: mimidiTheme.colors.ink,
  },
});
