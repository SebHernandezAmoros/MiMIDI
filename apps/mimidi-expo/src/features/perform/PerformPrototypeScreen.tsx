import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { PrototypeShell } from '@/src/components/PrototypeShell';
import { mimidiShadows } from '@/src/theme/mimidiShadows';
import { mimidiTheme } from '@/src/theme/mimidiTheme';

const naturalKeys = ['C4', 'D4', 'E4', 'F4', 'G4', 'A4', 'B4', 'C5'] as const;
const sharpKeys = [
  { label: 'C#4', leftIndex: 0 },
  { label: 'D#4', leftIndex: 1 },
  { label: 'F#4', leftIndex: 3 },
  { label: 'G#4', leftIndex: 4 },
  { label: 'A#4', leftIndex: 5 },
] as const;

export function PerformPrototypeScreen() {
  const activeNaturalKey = 'C4';

  return (
    <PrototypeShell currentRoute="perform">
      <View style={styles.primaryRow}>
        <View style={styles.transportRow}>
          <Pressable style={[styles.transportButton, styles.recordButton]}>
            <View style={styles.recordDot} />
          </Pressable>
          <Pressable style={styles.transportButton}>
            <View style={styles.stopSquare} />
          </Pressable>
        </View>
        <Pressable style={styles.trackAddButton}>
          <Text style={styles.trackAddText}>+ TRACK</Text>
        </Pressable>
      </View>

      <View style={styles.primaryRow}>
        <View style={styles.trackSelector}>
          <Pressable style={styles.slimButton}>
            <Ionicons color={mimidiTheme.colors.ink} name="chevron-back" size={16} />
          </Pressable>
          <View style={styles.trackValue}>
            <Text style={styles.trackValueText}>TRACK 1</Text>
            <Ionicons color={mimidiTheme.colors.ink} name="chevron-down" size={14} />
          </View>
          <Pressable style={styles.slimButton}>
            <Ionicons color={mimidiTheme.colors.ink} name="chevron-forward" size={16} />
          </Pressable>
        </View>

        <View style={styles.octaveCluster}>
          <Text style={styles.octaveLabel}>OCTAVA</Text>
          <View style={styles.octaveRow}>
            <Pressable style={styles.slimButton}>
              <Text style={styles.slimButtonText}>-</Text>
            </Pressable>
            <View style={styles.octaveValue}>
              <Text style={styles.octaveValueText}>4</Text>
            </View>
            <Pressable style={styles.slimButton}>
              <Text style={styles.slimButtonText}>+</Text>
            </Pressable>
          </View>
        </View>
      </View>

      <View style={styles.pianoSurface}>
        <View style={styles.naturalKeysRow}>
          {naturalKeys.map((note) => (
            <View
              key={note}
              style={[
                styles.naturalKey,
                note === activeNaturalKey ? styles.naturalKeyActive : null,
              ]}
            >
              <Text
                style={[
                  styles.naturalKeyLabel,
                  note === activeNaturalKey ? styles.naturalKeyLabelActive : null,
                ]}
              >
                {note}
              </Text>
            </View>
          ))}
        </View>

        {sharpKeys.map((note) => (
          <View
            key={note.label}
            style={[
              styles.sharpKey,
              {
                left: `${((note.leftIndex + 1) / naturalKeys.length) * 100}%`,
              },
            ]}
          >
            <Text style={styles.sharpKeyLabel}>{note.label}</Text>
          </View>
        ))}
      </View>

      <View style={styles.quickPanel}>
        <Text style={styles.quickPanelTitle}>Modo activo</Text>
        <View style={styles.quickPills}>
          <View style={styles.quickPill}>
            <MaterialCommunityIcons
              color={mimidiTheme.colors.ink}
              name="piano"
              size={16}
            />
            <Text style={styles.quickPillText}>Teclado</Text>
          </View>
          <View style={styles.quickPill}>
            <Text style={styles.quickPillText}>Track 1</Text>
          </View>
          <View style={styles.quickPill}>
            <Text style={styles.quickPillText}>Octava 4</Text>
          </View>
        </View>
      </View>
    </PrototypeShell>
  );
}

const styles = StyleSheet.create({
  primaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: mimidiTheme.spacing.sm,
  },
  transportRow: {
    flexDirection: 'row',
    gap: mimidiTheme.spacing.sm,
  },
  transportButton: {
    width: 58,
    height: 44,
    borderRadius: mimidiTheme.radius.sm,
    backgroundColor: mimidiTheme.colors.cardAlt,
    alignItems: 'center',
    justifyContent: 'center',
    ...mimidiShadows.pressed,
  },
  recordButton: {
    borderColor: 'rgba(232, 91, 67, 0.25)',
  },
  recordDot: {
    width: 18,
    height: 18,
    borderRadius: 999,
    backgroundColor: mimidiTheme.colors.accent,
  },
  stopSquare: {
    width: 16,
    height: 16,
    borderRadius: 3,
    backgroundColor: mimidiTheme.colors.ink,
  },
  trackAddButton: {
    minWidth: 122,
    paddingHorizontal: mimidiTheme.spacing.md,
    paddingVertical: mimidiTheme.spacing.sm + 1,
    borderRadius: mimidiTheme.radius.sm,
    backgroundColor: mimidiTheme.colors.cardAlt,
    alignItems: 'center',
    justifyContent: 'center',
    ...mimidiShadows.pressed,
  },
  trackAddText: {
    color: mimidiTheme.colors.ink,
    fontSize: 18,
    fontWeight: '700',
  },
  trackSelector: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: mimidiTheme.spacing.sm,
  },
  slimButton: {
    width: 46,
    height: 42,
    borderRadius: mimidiTheme.radius.sm,
    backgroundColor: mimidiTheme.colors.cardAlt,
    alignItems: 'center',
    justifyContent: 'center',
    ...mimidiShadows.pressed,
  },
  slimButtonText: {
    color: mimidiTheme.colors.ink,
    fontSize: 24,
    fontWeight: '700',
  },
  trackValue: {
    flex: 1,
    minHeight: 42,
    borderRadius: mimidiTheme.radius.sm,
    backgroundColor: mimidiTheme.colors.cardAlt,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingHorizontal: mimidiTheme.spacing.md,
    ...mimidiShadows.pressed,
  },
  trackValueText: {
    color: mimidiTheme.colors.ink,
    fontSize: 18,
    fontWeight: '700',
  },
  octaveCluster: {
    minWidth: 196,
    alignItems: 'center',
    gap: 4,
  },
  octaveLabel: {
    color: mimidiTheme.colors.inkMuted,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1,
  },
  octaveRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  octaveValue: {
    minWidth: 44,
    alignItems: 'center',
  },
  octaveValueText: {
    color: mimidiTheme.colors.ink,
    fontSize: 28,
    fontWeight: '700',
  },
  pianoSurface: {
    position: 'relative',
    height: 290,
    borderRadius: mimidiTheme.radius.sm,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: mimidiTheme.colors.border,
    backgroundColor: '#F8F4EE',
  },
  naturalKeysRow: {
    flex: 1,
    flexDirection: 'row',
  },
  naturalKey: {
    flex: 1,
    borderRightWidth: 1,
    borderRightColor: 'rgba(142, 133, 124, 0.4)',
    backgroundColor: mimidiTheme.colors.keyWhite,
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingBottom: 14,
  },
  naturalKeyActive: {
    borderColor: mimidiTheme.colors.accent,
    borderWidth: 2,
    borderBottomWidth: 4,
  },
  naturalKeyLabel: {
    color: mimidiTheme.colors.inkMuted,
    fontSize: 14,
    fontWeight: '600',
  },
  naturalKeyLabelActive: {
    color: mimidiTheme.colors.accent,
    fontWeight: '700',
  },
  sharpKey: {
    position: 'absolute',
    top: 0,
    width: 34,
    height: 120,
    marginLeft: -17,
    borderBottomLeftRadius: 8,
    borderBottomRightRadius: 8,
    backgroundColor: mimidiTheme.colors.keyBlack,
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingBottom: 12,
  },
  sharpKeyLabel: {
    color: '#F2EFEB',
    fontSize: 11,
    fontWeight: '700',
  },
  quickPanel: {
    borderRadius: mimidiTheme.radius.sm,
    borderWidth: 1,
    borderColor: mimidiTheme.colors.border,
    backgroundColor: mimidiTheme.colors.keyWhite,
    padding: mimidiTheme.spacing.md,
    gap: mimidiTheme.spacing.sm,
  },
  quickPanelTitle: {
    color: mimidiTheme.colors.inkMuted,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  quickPills: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: mimidiTheme.spacing.sm,
  },
  quickPill: {
    minHeight: 34,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: mimidiTheme.colors.border,
    backgroundColor: mimidiTheme.colors.cardAlt,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  quickPillText: {
    color: mimidiTheme.colors.ink,
    fontSize: 14,
    fontWeight: '600',
  },
});
