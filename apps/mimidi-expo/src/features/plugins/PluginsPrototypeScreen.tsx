import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { PrototypeShell } from '@/src/components/PrototypeShell';
import { SurfaceButton, SurfacePanel } from '@/src/components/PrototypeUI';
import { mimidiTheme } from '@/src/theme/mimidiTheme';
import { usePluginsPrototypeState } from './usePluginsPrototypeState';

export function PluginsPrototypeScreen() {
  const {
    enabledCount,
    folderOpenCount,
    importCount,
    plugins,
    selectedPlugin,
    selectedPluginId,
    selectPlugin,
    simulateImport,
    simulateOpenFolder,
    togglePlugin,
  } = usePluginsPrototypeState();
  const { height, width } = useWindowDimensions();
  const isCompact = width < 900 || height < 560;

  return (
    <PrototypeShell currentRoute="plugins">
      <View style={[styles.toolbar, isCompact ? styles.toolbarCompact : null]}>
        <SurfaceButton compact={isCompact} onPress={simulateImport}>
          <View style={styles.toolbarAction}>
            <Ionicons color={mimidiTheme.colors.ink} name="download-outline" size={18} />
            <Text style={styles.toolbarLabel}>IMPORT</Text>
          </View>
        </SurfaceButton>
        <SurfaceButton compact={isCompact} onPress={simulateOpenFolder}>
          <View style={styles.toolbarAction}>
            <Ionicons color={mimidiTheme.colors.ink} name="folder-open-outline" size={18} />
            <Text style={styles.toolbarLabel}>PLUGIN FOLDER</Text>
          </View>
        </SurfaceButton>
      </View>

      <View style={[styles.layout, isCompact ? styles.layoutCompact : null]}>
        <SurfacePanel title="Rack activo">
          <View style={styles.summaryRow}>
            <SummaryPill label={`${enabledCount} activos`} />
            <SummaryPill label={`${plugins.length} instalados`} />
            <SummaryPill label={`${importCount} imports`} />
            <SummaryPill label={`${folderOpenCount} carpetas`} />
          </View>
        </SurfacePanel>

        <View style={[styles.contentRow, isCompact ? styles.contentRowCompact : null]}>
          <SurfacePanel title="Lista de plugins">
            <View style={styles.pluginList}>
              {plugins.map((plugin) => {
                const isSelected = plugin.id === selectedPluginId;

                return (
                  <Pressable
                    key={plugin.id}
                    onPress={() => selectPlugin(plugin.id)}
                    style={[
                      styles.pluginRow,
                      isSelected ? styles.pluginRowSelected : null,
                    ]}
                  >
                    <View style={styles.pluginBadge}>
                      <Text style={styles.pluginBadgeText}>{plugin.id}</Text>
                    </View>
                    <View style={styles.pluginInfo}>
                      <Text style={styles.pluginName}>{plugin.name}</Text>
                      <Text style={styles.pluginMeta}>
                        {plugin.version} - {plugin.category}
                      </Text>
                    </View>
                    <Pressable
                      onPress={() => togglePlugin(plugin.id)}
                      style={[
                        styles.checkbox,
                        plugin.enabled ? styles.checkboxActive : null,
                      ]}
                    >
                      {plugin.enabled ? (
                        <Ionicons color={mimidiTheme.colors.keyWhite} name="checkmark" size={14} />
                      ) : null}
                    </Pressable>
                    <Ionicons
                      color={mimidiTheme.colors.inkMuted}
                      name="chevron-forward"
                      size={18}
                    />
                  </Pressable>
                );
              })}
            </View>
          </SurfacePanel>

          <SurfacePanel title="Plugin seleccionado">
            <View style={styles.detailCard}>
              <View style={styles.detailHeader}>
                <View style={styles.detailBadge}>
                  <Text style={styles.detailBadgeText}>{selectedPlugin.id}</Text>
                </View>
                <View style={styles.detailTextGroup}>
                  <Text style={styles.detailTitle}>{selectedPlugin.name}</Text>
                  <Text style={styles.detailMeta}>
                    {selectedPlugin.version} - {selectedPlugin.category}
                  </Text>
                </View>
              </View>

              <Text style={styles.detailBody}>{selectedPlugin.description}</Text>

              <View style={styles.detailFooter}>
                <SummaryPill
                  accent={selectedPlugin.enabled}
                  label={selectedPlugin.enabled ? 'Encendido' : 'Apagado'}
                />
                <SummaryPill label="Mock local" />
              </View>
            </View>
          </SurfacePanel>
        </View>
      </View>
    </PrototypeShell>
  );
}

function SummaryPill({
  accent = false,
  label,
}: {
  accent?: boolean;
  label: string;
}) {
  return (
    <View style={[styles.summaryPill, accent ? styles.summaryPillAccent : null]}>
      <Text style={[styles.summaryPillText, accent ? styles.summaryPillTextAccent : null]}>
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  toolbar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: mimidiTheme.spacing.md,
  },
  toolbarCompact: {
    gap: mimidiTheme.spacing.sm,
  },
  toolbarAction: {
    minHeight: 44,
    minWidth: 118,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingHorizontal: mimidiTheme.spacing.sm,
  },
  toolbarLabel: {
    color: mimidiTheme.colors.ink,
    fontSize: 14,
    fontWeight: '700',
  },
  layout: {
    flex: 1,
    gap: mimidiTheme.spacing.md,
  },
  layoutCompact: {
    gap: mimidiTheme.spacing.sm,
  },
  summaryRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: mimidiTheme.spacing.sm,
  },
  summaryPill: {
    minHeight: 34,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: mimidiTheme.colors.border,
    backgroundColor: mimidiTheme.colors.cardAlt,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 14,
  },
  summaryPillAccent: {
    backgroundColor: mimidiTheme.colors.ink,
    borderColor: mimidiTheme.colors.ink,
  },
  summaryPillText: {
    color: mimidiTheme.colors.ink,
    fontSize: 13,
    fontWeight: '600',
  },
  summaryPillTextAccent: {
    color: mimidiTheme.colors.keyWhite,
  },
  contentRow: {
    flex: 1,
    minHeight: 0,
    flexDirection: 'row',
    gap: mimidiTheme.spacing.md,
  },
  contentRowCompact: {
    gap: mimidiTheme.spacing.sm,
  },
  pluginList: {
    gap: mimidiTheme.spacing.sm,
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
  pluginRowSelected: {
    borderColor: mimidiTheme.colors.ink,
    backgroundColor: '#F7F1E8',
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
  detailCard: {
    flex: 1,
    justifyContent: 'space-between',
    gap: mimidiTheme.spacing.md,
    borderRadius: mimidiTheme.radius.sm,
    borderWidth: 1,
    borderColor: mimidiTheme.colors.border,
    backgroundColor: '#F8F5F0',
    padding: mimidiTheme.spacing.md,
  },
  detailHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: mimidiTheme.spacing.md,
  },
  detailBadge: {
    width: 52,
    height: 52,
    borderRadius: 12,
    backgroundColor: mimidiTheme.colors.ink,
    alignItems: 'center',
    justifyContent: 'center',
  },
  detailBadgeText: {
    color: mimidiTheme.colors.keyWhite,
    fontSize: 20,
    fontWeight: '700',
  },
  detailTextGroup: {
    flex: 1,
    gap: 2,
  },
  detailTitle: {
    color: mimidiTheme.colors.ink,
    fontSize: 20,
    fontWeight: '700',
  },
  detailMeta: {
    color: mimidiTheme.colors.inkMuted,
    fontSize: 14,
  },
  detailBody: {
    color: mimidiTheme.colors.ink,
    fontSize: 15,
    lineHeight: 22,
  },
  detailFooter: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: mimidiTheme.spacing.sm,
  },
});
