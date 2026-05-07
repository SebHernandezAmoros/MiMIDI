import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Switch, Text, View, useWindowDimensions } from 'react-native';
import { PrototypeShell } from '@/src/components/PrototypeShell';
import { RowItem, SectionTitle, SurfacePanel } from '@/src/components/PrototypeUI';
import { mimidiTheme } from '@/src/theme/mimidiTheme';
import { useSettingsPrototypeState } from './useSettingsPrototypeState';

export function SettingsPrototypeScreen() {
  const {
    audioOutput,
    cycleAudioOutput,
    cycleLanguage,
    cycleMidiStatus,
    darkModeEnabled,
    language,
    midiStatus,
    toggleDarkMode,
  } = useSettingsPrototypeState();
  const { height, width } = useWindowDimensions();
  const isCompact = width < 900 || height < 560;

  return (
    <PrototypeShell currentRoute="settings">
      <View style={[styles.layout, isCompact ? styles.layoutCompact : null]}>
        <SurfacePanel title="Estado de sesion">
          <View style={styles.summaryRow}>
            <SummaryPill label={language} />
            <SummaryPill label={darkModeEnabled ? 'Oscuro activo' : 'Tema claro'} />
            <SummaryPill label={audioOutput} />
            <SummaryPill label={midiStatus} />
          </View>
        </SurfacePanel>

        <View style={styles.section}>
          <SectionTitle>Idioma</SectionTitle>
          <RowItem
            left={
              <>
                <Ionicons color={mimidiTheme.colors.inkMuted} name="globe-outline" size={20} />
                <Text style={styles.itemLabel}>Language</Text>
              </>
            }
            right={
              <>
                <Text onPress={cycleLanguage} style={styles.itemValue}>
                  {language}
                </Text>
                <Ionicons
                  color={mimidiTheme.colors.inkMuted}
                  name="chevron-forward"
                  onPress={cycleLanguage}
                  size={18}
                />
              </>
            }
          />
        </View>

        <View style={styles.section}>
          <SectionTitle>Tema</SectionTitle>
          <RowItem
            left={
              <>
                <Ionicons color={mimidiTheme.colors.inkMuted} name="sunny-outline" size={20} />
                <Text style={styles.itemLabel}>Modo Oscuro</Text>
              </>
            }
            right={
              <Switch
                onValueChange={toggleDarkMode}
                trackColor={{ false: '#BBB2A8', true: '#1F1C19' }}
                value={darkModeEnabled}
              />
            }
          />
        </View>

        <View style={styles.section}>
          <SectionTitle>Audio</SectionTitle>
          <RowItem
            left={
              <>
                <Ionicons
                  color={mimidiTheme.colors.inkMuted}
                  name="volume-high-outline"
                  size={20}
                />
                <Text style={styles.itemLabel}>Salida de Audio</Text>
              </>
            }
            right={
              <>
                <Text onPress={cycleAudioOutput} style={styles.itemValue}>
                  {audioOutput}
                </Text>
                <Ionicons
                  color={mimidiTheme.colors.inkMuted}
                  name="chevron-forward"
                  onPress={cycleAudioOutput}
                  size={18}
                />
              </>
            }
          />
        </View>

        <View style={styles.section}>
          <SectionTitle>MIDI</SectionTitle>
          <RowItem
            left={
              <>
                <Ionicons
                  color={mimidiTheme.colors.inkMuted}
                  name="musical-notes-outline"
                  size={20}
                />
                <Text style={styles.itemLabel}>MIDI Dispositivo</Text>
              </>
            }
            right={
              <>
                <Text onPress={cycleMidiStatus} style={styles.itemValue}>
                  {midiStatus}
                </Text>
                <Ionicons
                  color={mimidiTheme.colors.inkMuted}
                  name="chevron-forward"
                  onPress={cycleMidiStatus}
                  size={18}
                />
              </>
            }
          />
        </View>
      </View>
    </PrototypeShell>
  );
}

function SummaryPill({ label }: { label: string }) {
  return (
    <View style={styles.summaryPill}>
      <Text style={styles.summaryPillText}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
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
  summaryPillText: {
    color: mimidiTheme.colors.ink,
    fontSize: 13,
    fontWeight: '600',
  },
  section: {
    gap: mimidiTheme.spacing.sm,
  },
  itemLabel: {
    color: mimidiTheme.colors.ink,
    fontSize: 16,
  },
  itemValue: {
    color: mimidiTheme.colors.inkMuted,
    fontSize: 15,
  },
});
