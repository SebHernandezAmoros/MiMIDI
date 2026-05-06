import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Switch, Text, View } from 'react-native';
import { PrototypeShell } from '@/src/components/PrototypeShell';
import { RowItem, SectionTitle } from '@/src/components/PrototypeUI';
import { mimidiTheme } from '@/src/theme/mimidiTheme';

export function SettingsPrototypeScreen() {
  return (
    <PrototypeShell currentRoute="settings">
      <View style={styles.section}>
        <SectionTitle>Idioma</SectionTitle>
        <RowItem
          left={
            <>
              <Ionicons
                color={mimidiTheme.colors.inkMuted}
                name="globe-outline"
                size={20}
              />
              <Text style={styles.itemLabel}>Language</Text>
            </>
          }
          right={
            <>
              <Text style={styles.itemValue}>Español</Text>
              <Ionicons
                color={mimidiTheme.colors.inkMuted}
                name="chevron-forward"
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
              <Ionicons
                color={mimidiTheme.colors.inkMuted}
                name="sunny-outline"
                size={20}
              />
              <Text style={styles.itemLabel}>Modo Oscuro</Text>
            </>
          }
          right={<Switch value={false} trackColor={{ false: '#BBB2A8', true: '#1F1C19' }} />}
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
              <Text style={styles.itemValue}>Dispositivo</Text>
              <Ionicons
                color={mimidiTheme.colors.inkMuted}
                name="chevron-forward"
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
              <Text style={styles.itemValue}>No conectado</Text>
              <Ionicons
                color={mimidiTheme.colors.inkMuted}
                name="chevron-forward"
                size={18}
              />
            </>
          }
        />
      </View>
    </PrototypeShell>
  );
}

const styles = StyleSheet.create({
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
