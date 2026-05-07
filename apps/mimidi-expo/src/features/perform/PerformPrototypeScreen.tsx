import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { PrototypeShell } from '@/src/components/PrototypeShell';
import { usePerformPrototypeAudio } from '@/src/features/perform/usePerformPrototypeAudio';
import { mimidiShadows } from '@/src/theme/mimidiShadows';
import { mimidiTheme } from '@/src/theme/mimidiTheme';
import { usePerformPrototypeState } from '@/src/features/perform/usePerformPrototypeState';

export function PerformPrototypeScreen() {
  const { height, width } = useWindowDimensions();
  const {
    activeNote,
    addTrack,
    canDecreaseOctave,
    canGoNextTrack,
    canGoPreviousTrack,
    canIncreaseOctave,
    currentTrackLabel,
    decreaseOctave,
    increaseOctave,
    isRecording,
    lastPlayedNote,
    naturalKeys,
    octave,
    releaseNote,
    selectNextTrack,
    selectPreviousTrack,
    sharpKeys,
    stopTransport,
    toggleRecording,
    trackCount,
    transportState,
    activateNote,
  } = usePerformPrototypeState();
  const { pressNote, releaseNote: releaseAudioNote, stopAllNotes } =
    usePerformPrototypeAudio();
  const isCompact = width < 960 || height < 560;
  const isTight = width < 840 || height < 500;
  const pianoHeight = Math.max(
    isTight ? 138 : isCompact ? 170 : 210,
    Math.min(isTight ? 164 : isCompact ? 196 : 290, height - (isTight ? 270 : isCompact ? 292 : 330)),
  );
  const controlButtonSize = isTight ? 38 : 46;
  const transportButtonSize = isTight ? 42 : 58;
  const keyLabelSize = isTight ? 11 : 14;
  const octaveValueSize = isTight ? 22 : 28;
  const titleSize = isTight ? 16 : 18;

  function handlePressNote(note: string) {
    activateNote(note);
    pressNote(note);
  }

  function handleReleaseNote(note: string) {
    releaseNote(note);
    releaseAudioNote(note);
  }

  return (
    <PrototypeShell currentRoute="perform">
      <View
        style={[
          styles.primaryRow,
          isCompact ? styles.primaryRowCompact : null,
          isTight ? styles.primaryRowTight : null,
        ]}
      >
        <View style={styles.transportRow}>
          <Pressable
            style={[
              styles.transportButton,
              styles.recordButton,
              isRecording ? styles.transportButtonActive : null,
              {
                width: transportButtonSize,
                height: isTight ? 38 : 44,
              },
            ]}
            onPress={toggleRecording}
          >
            <View style={styles.recordDot} />
          </Pressable>
          <Pressable
            style={[
              styles.transportButton,
              transportState === 'idle' ? styles.transportButtonIdle : null,
              {
                width: transportButtonSize,
                height: isTight ? 38 : 44,
              },
            ]}
            onPress={() => {
              stopTransport();
              stopAllNotes();
            }}
          >
            <View style={styles.stopSquare} />
          </Pressable>
        </View>
        <Pressable
          style={[styles.trackAddButton, isTight ? styles.trackAddButtonTight : null]}
          onPress={addTrack}
        >
          <Text style={[styles.trackAddText, { fontSize: titleSize }]}>+ TRACK</Text>
        </Pressable>
      </View>

      <View
        style={[
          styles.primaryRow,
          isCompact ? styles.primaryRowCompact : null,
          isTight ? styles.primaryRowTight : null,
        ]}
      >
        <View style={styles.trackSelector}>
          <Pressable
            style={[
              styles.slimButton,
              !canGoPreviousTrack ? styles.disabledButton : null,
              { width: controlButtonSize, height: isTight ? 38 : 42 },
            ]}
            disabled={!canGoPreviousTrack}
            onPress={selectPreviousTrack}
          >
            <Ionicons color={mimidiTheme.colors.ink} name="chevron-back" size={16} />
          </Pressable>
          <View style={[styles.trackValue, isTight ? styles.trackValueTight : null]}>
            <Text style={[styles.trackValueText, { fontSize: isTight ? 16 : 18 }]}>
              {currentTrackLabel.toUpperCase()}
            </Text>
            <Ionicons color={mimidiTheme.colors.ink} name="chevron-down" size={14} />
          </View>
          <Pressable
            style={[
              styles.slimButton,
              !canGoNextTrack ? styles.disabledButton : null,
              { width: controlButtonSize, height: isTight ? 38 : 42 },
            ]}
            disabled={!canGoNextTrack}
            onPress={selectNextTrack}
          >
            <Ionicons color={mimidiTheme.colors.ink} name="chevron-forward" size={16} />
          </Pressable>
        </View>

        <View style={[styles.octaveCluster, isTight ? styles.octaveClusterTight : null]}>
          <Text style={[styles.octaveLabel, isTight ? styles.octaveLabelTight : null]}>OCTAVA</Text>
          <View style={styles.octaveRow}>
            <Pressable
              style={[
                styles.slimButton,
                !canDecreaseOctave ? styles.disabledButton : null,
                { width: controlButtonSize, height: isTight ? 38 : 42 },
              ]}
              disabled={!canDecreaseOctave}
              onPress={decreaseOctave}
            >
              <Text style={styles.slimButtonText}>-</Text>
            </Pressable>
            <View style={styles.octaveValue}>
              <Text style={[styles.octaveValueText, { fontSize: octaveValueSize }]}>
                {octave}
              </Text>
            </View>
            <Pressable
              style={[
                styles.slimButton,
                !canIncreaseOctave ? styles.disabledButton : null,
                { width: controlButtonSize, height: isTight ? 38 : 42 },
              ]}
              disabled={!canIncreaseOctave}
              onPress={increaseOctave}
            >
              <Text style={styles.slimButtonText}>+</Text>
            </Pressable>
          </View>
        </View>
      </View>

      <View style={[styles.pianoSurface, { height: pianoHeight }]}>
        <View style={styles.naturalKeysRow}>
          {naturalKeys.map((note) => (
            <Pressable
              key={note}
              onPressIn={() => handlePressNote(note)}
              onPressOut={() => handleReleaseNote(note)}
              style={[
                styles.naturalKey,
                note === activeNote ? styles.naturalKeyActive : null,
              ]}
            >
              <Text
                style={[
                  styles.naturalKeyLabel,
                  { fontSize: keyLabelSize },
                  note === activeNote ? styles.naturalKeyLabelActive : null,
                ]}
              >
                {note}
              </Text>
            </Pressable>
          ))}
        </View>

        {sharpKeys.map((note) => (
          <Pressable
            key={note.note}
            onPressIn={() => handlePressNote(note.note)}
            onPressOut={() => handleReleaseNote(note.note)}
            style={[
              styles.sharpKey,
              note.note === activeNote ? styles.sharpKeyActive : null,
              {
                left: `${((note.leftIndex + 1) / naturalKeys.length) * 100}%`,
              },
            ]}
          >
            <Text style={styles.sharpKeyLabel}>{note.note}</Text>
          </Pressable>
        ))}
      </View>

      <View style={[styles.quickPanel, isTight ? styles.quickPanelTight : null]}>
        <Text style={[styles.quickPanelTitle, isTight ? styles.quickPanelTitleTight : null]}>
          Modo activo
        </Text>
        <View style={[styles.quickPills, isTight ? styles.quickPillsTight : null]}>
          <View style={styles.quickPill}>
            <MaterialCommunityIcons
              color={mimidiTheme.colors.ink}
              name="piano"
              size={16}
            />
            <Text style={styles.quickPillText}>Teclado</Text>
          </View>
          <View style={styles.quickPill}>
            <Text style={styles.quickPillText}>{currentTrackLabel}</Text>
          </View>
          <View style={styles.quickPill}>
            <Text style={styles.quickPillText}>Octava {octave}</Text>
          </View>
          <View style={styles.quickPill}>
            <Text style={styles.quickPillText}>
              {isRecording ? 'Grabando' : 'Idle'}
            </Text>
          </View>
          <View style={styles.quickPill}>
            <Text style={styles.quickPillText}>
              {lastPlayedNote ?? 'Sin nota'}
            </Text>
          </View>
          <View style={styles.quickPill}>
            <Text style={styles.quickPillText}>{trackCount} tracks</Text>
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
  primaryRowCompact: {
    alignItems: 'stretch',
  },
  primaryRowTight: {
    gap: mimidiTheme.spacing.xs,
  },
  transportRow: {
    flexDirection: 'row',
    gap: mimidiTheme.spacing.sm,
    flexWrap: 'wrap',
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
  transportButtonActive: {
    backgroundColor: '#F3D7D1',
  },
  transportButtonIdle: {
    opacity: 0.92,
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
  trackAddButtonTight: {
    minWidth: 108,
    paddingHorizontal: mimidiTheme.spacing.sm,
    paddingVertical: mimidiTheme.spacing.xs + 2,
  },
  trackSelector: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: mimidiTheme.spacing.sm,
    minWidth: 0,
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
  disabledButton: {
    opacity: 0.45,
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
  trackValueTight: {
    paddingHorizontal: mimidiTheme.spacing.sm,
  },
  octaveCluster: {
    minWidth: 172,
    alignItems: 'center',
    gap: 4,
  },
  octaveClusterTight: {
    minWidth: 150,
  },
  octaveLabel: {
    color: mimidiTheme.colors.inkMuted,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1,
  },
  octaveLabelTight: {
    fontSize: 11,
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
  sharpKeyActive: {
    backgroundColor: '#3A3531',
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
  quickPanelTight: {
    padding: mimidiTheme.spacing.sm,
  },
  quickPanelTitle: {
    color: mimidiTheme.colors.inkMuted,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  quickPanelTitleTight: {
    fontSize: 11,
  },
  quickPills: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: mimidiTheme.spacing.sm,
    flexWrap: 'wrap',
  },
  quickPillsTight: {
    gap: mimidiTheme.spacing.xs,
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
