import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { PrototypeShell } from '@/src/components/PrototypeShell';
import { SurfacePanel } from '@/src/components/PrototypeUI';
import { mimidiTheme } from '@/src/theme/mimidiTheme';
import { useEditPrototypeState } from './useEditPrototypeState';

const laneLabels = ['C5', 'A4', 'G4', 'F4', 'E4', 'D4', 'C4'] as const;

export function EditPrototypeScreen() {
  const {
    barRange,
    cycleBarRange,
    movePlayhead,
    noteBlocks,
    playheadPosition,
    selectNote,
    selectedNote,
    selectedNoteId,
    toggleTrackMute,
    toggleTrackSolo,
    toggleViewMode,
    trackRows,
    viewMode,
  } = useEditPrototypeState();
  const { height, width } = useWindowDimensions();
  const isCompact = width < 940 || height < 560;

  return (
    <PrototypeShell currentRoute="edit">
      <View style={[styles.layout, isCompact ? styles.layoutCompact : null]}>
        <View style={[styles.toolbar, isCompact ? styles.toolbarCompact : null]}>
          <ToolbarButton
            icon={viewMode === 'notes' ? 'grid-outline' : 'albums-outline'}
            label={viewMode === 'notes' ? 'NOTAS' : 'TRACKS'}
            onPress={toggleViewMode}
          />
          <ToolbarButton icon="resize-outline" label={barRange} onPress={cycleBarRange} />
          <ToolbarButton icon="play-outline" label="MOVER" onPress={movePlayhead} />
        </View>

        <SurfacePanel title="Timeline de notas">
          <View style={styles.scaleHeader}>
            <View style={styles.leftSpacer} />
            <Text style={styles.scaleLabel}>1</Text>
            <Text style={styles.scaleLabel}>1.2</Text>
            <Text style={styles.scaleLabel}>1.3</Text>
            <Text style={styles.scaleLabel}>1.4</Text>
            <Text style={styles.scaleLabel}>2</Text>
          </View>

          <View style={styles.notesGrid}>
            <View style={styles.keyboardLanes}>
              {laneLabels.map((lane) => (
                <View key={lane} style={styles.keyboardLane}>
                  <Text style={styles.keyboardLabel}>{lane}</Text>
                </View>
              ))}
            </View>

            <View style={styles.timelineArea}>
              <View style={[styles.playhead, { left: `${playheadPosition * 100}%` }]} />
              {Array.from({ length: laneLabels.length }).map((_, laneIndex) => (
                <View key={`lane-${laneIndex}`} style={styles.timelineLane} />
              ))}
              {noteBlocks.map((note) => {
                const isSelected = note.id === selectedNoteId;

                return (
                  <Pressable
                    key={note.id}
                    onPress={() => selectNote(note.id)}
                    style={[
                      styles.noteBlock,
                      isSelected ? styles.noteBlockSelected : null,
                      {
                        left: `${note.start * 100}%`,
                        top: note.lane * 38 + 11,
                        width: `${note.width * 100}%`,
                      },
                    ]}
                  />
                );
              })}
            </View>
          </View>
        </SurfacePanel>

        <View style={[styles.bottomRow, isCompact ? styles.bottomRowCompact : null]}>
          <SurfacePanel title="Tracks">
            <View style={styles.trackPreview}>
              {trackRows.map((track, index) => (
                <View key={track.id} style={styles.trackRow}>
                  <View style={styles.trackMeta}>
                    <Text style={styles.trackIndex}>{index + 1}</Text>
                    <Text style={styles.trackName}>{track.name}</Text>
                    <Pressable
                      onPress={() => toggleTrackMute(track.id)}
                      style={[
                        styles.trackMiniButton,
                        track.muted ? styles.trackMiniButtonActive : null,
                      ]}
                    >
                      <Text
                        style={[
                          styles.trackMiniText,
                          track.muted ? styles.trackMiniTextActive : null,
                        ]}
                      >
                        M
                      </Text>
                    </Pressable>
                    <Pressable
                      onPress={() => toggleTrackSolo(track.id)}
                      style={[
                        styles.trackMiniButton,
                        track.solo ? styles.trackMiniButtonActive : null,
                      ]}
                    >
                      <Text
                        style={[
                          styles.trackMiniText,
                          track.solo ? styles.trackMiniTextActive : null,
                        ]}
                      >
                        S
                      </Text>
                    </Pressable>
                  </View>
                  <View style={styles.trackTimeline}>
                    <View
                      style={[
                        styles.trackClip,
                        {
                          left: `${track.start * 100}%`,
                          width: `${track.width * 100}%`,
                        },
                      ]}
                    />
                  </View>
                </View>
              ))}
            </View>
          </SurfacePanel>

          <SurfacePanel title="Estado de edicion">
            <View style={styles.summaryStack}>
              <SummaryPill label={`Vista ${viewMode === 'notes' ? 'notas' : 'tracks'}`} />
              <SummaryPill label={barRange} />
              <SummaryPill label={`Playhead ${(playheadPosition * 100).toFixed(0)}%`} />
              <SummaryPill label={`Nota ${selectedNote.id}`} />
              <SummaryPill label={`Lane ${selectedNote.lane + 1}`} />
            </View>
          </SurfacePanel>
        </View>
      </View>
    </PrototypeShell>
  );
}

function ToolbarButton({
  icon,
  label,
  onPress,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress: () => void;
}) {
  return (
    <Pressable onPress={onPress} style={styles.toolbarButton}>
      <Ionicons color={mimidiTheme.colors.ink} name={icon} size={18} />
      <Text style={styles.toolbarButtonText}>{label}</Text>
    </Pressable>
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
  toolbar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: mimidiTheme.spacing.md,
  },
  toolbarCompact: {
    gap: mimidiTheme.spacing.sm,
  },
  toolbarButton: {
    minHeight: 42,
    minWidth: 118,
    borderRadius: mimidiTheme.radius.sm,
    borderWidth: 1,
    borderColor: mimidiTheme.colors.borderStrong,
    backgroundColor: mimidiTheme.colors.cardAlt,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingHorizontal: mimidiTheme.spacing.md,
  },
  toolbarButtonText: {
    color: mimidiTheme.colors.ink,
    fontSize: 14,
    fontWeight: '700',
  },
  scaleHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingBottom: mimidiTheme.spacing.sm,
  },
  leftSpacer: {
    width: 60,
  },
  scaleLabel: {
    flex: 1,
    textAlign: 'center',
    color: mimidiTheme.colors.inkMuted,
    fontSize: 12,
    fontWeight: '600',
  },
  notesGrid: {
    flexDirection: 'row',
    borderRadius: mimidiTheme.radius.sm,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: mimidiTheme.colors.border,
  },
  keyboardLanes: {
    width: 60,
    backgroundColor: '#F6F2EC',
  },
  keyboardLane: {
    height: 38,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(189, 179, 169, 0.6)',
    justifyContent: 'center',
    paddingHorizontal: 8,
  },
  keyboardLabel: {
    color: mimidiTheme.colors.ink,
    fontSize: 11,
    fontWeight: '600',
  },
  timelineArea: {
    flex: 1,
    position: 'relative',
    backgroundColor: mimidiTheme.colors.keyWhite,
  },
  timelineLane: {
    height: 38,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(189, 179, 169, 0.45)',
  },
  playhead: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 2,
    backgroundColor: mimidiTheme.colors.ink,
    zIndex: 2,
  },
  noteBlock: {
    position: 'absolute',
    height: 14,
    borderRadius: 3,
    backgroundColor: '#707070',
  },
  noteBlockSelected: {
    backgroundColor: mimidiTheme.colors.accent,
  },
  bottomRow: {
    flexDirection: 'row',
    gap: mimidiTheme.spacing.md,
  },
  bottomRowCompact: {
    gap: mimidiTheme.spacing.sm,
  },
  trackPreview: {
    gap: mimidiTheme.spacing.sm,
  },
  trackRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: mimidiTheme.spacing.md,
  },
  trackMeta: {
    width: 180,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  trackIndex: {
    width: 16,
    color: mimidiTheme.colors.ink,
    fontSize: 14,
  },
  trackName: {
    flex: 1,
    color: mimidiTheme.colors.ink,
    fontSize: 15,
    fontWeight: '500',
  },
  trackMiniButton: {
    width: 24,
    height: 24,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: mimidiTheme.colors.borderStrong,
    alignItems: 'center',
    justifyContent: 'center',
  },
  trackMiniButtonActive: {
    backgroundColor: mimidiTheme.colors.ink,
    borderColor: mimidiTheme.colors.ink,
  },
  trackMiniText: {
    color: mimidiTheme.colors.ink,
    fontSize: 11,
    fontWeight: '700',
  },
  trackMiniTextActive: {
    color: mimidiTheme.colors.keyWhite,
  },
  trackTimeline: {
    flex: 1,
    height: 32,
    borderRadius: 6,
    backgroundColor: '#F7F4EF',
    position: 'relative',
    overflow: 'hidden',
  },
  trackClip: {
    position: 'absolute',
    top: 8,
    height: 16,
    borderRadius: 2,
    backgroundColor: '#707070',
  },
  summaryStack: {
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
});
