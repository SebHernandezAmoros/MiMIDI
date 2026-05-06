import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';
import { PrototypeShell } from '@/src/components/PrototypeShell';
import { SelectLike, SurfacePanel } from '@/src/components/PrototypeUI';
import { mimidiTheme } from '@/src/theme/mimidiTheme';

const laneLabels = ['C5', 'A4', 'G4', 'F4', 'E4', 'D4', 'C4'] as const;
const noteBlocks = [
  { lane: 6, start: 0.02, width: 0.12 },
  { lane: 4, start: 0.16, width: 0.11 },
  { lane: 2, start: 0.3, width: 0.08 },
  { lane: 5, start: 0.41, width: 0.09 },
  { lane: 3, start: 0.52, width: 0.1 },
  { lane: 1, start: 0.69, width: 0.08 },
  { lane: 4, start: 0.82, width: 0.08 },
] as const;

const trackRows = [
  { name: 'Track 1', start: 0.34, width: 0.56 },
  { name: 'Track 2', start: 0.39, width: 0.5 },
  { name: 'Track 3', start: 0.42, width: 0.22 },
  { name: 'Track 4', start: 0.46, width: 0.45 },
] as const;

export function EditPrototypeScreen() {
  return (
    <PrototypeShell currentRoute="edit">
      <View style={styles.toolbar}>
        <SelectLike value="NOTAS" width={112} />
        <SelectLike value="1 BAR" width={120} />
        <View style={styles.searchButton}>
          <Ionicons color={mimidiTheme.colors.ink} name="search" size={18} />
        </View>
      </View>

      <SurfacePanel>
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
            <View style={styles.playhead} />
            {Array.from({ length: laneLabels.length }).map((_, laneIndex) => (
              <View key={`lane-${laneIndex}`} style={styles.timelineLane} />
            ))}
            {noteBlocks.map((note, index) => (
              <View
                key={`note-${index}`}
                style={[
                  styles.noteBlock,
                  {
                    left: `${note.start * 100}%`,
                    top: note.lane * 38 + 11,
                    width: `${note.width * 100}%`,
                  },
                ]}
              />
            ))}
          </View>
        </View>
      </SurfacePanel>

      <SurfacePanel title="Vista de tracks siguiente">
        <View style={styles.trackPreview}>
          {trackRows.map((track, index) => (
            <View key={track.name} style={styles.trackRow}>
              <View style={styles.trackMeta}>
                <Text style={styles.trackIndex}>{index + 1}</Text>
                <Text style={styles.trackName}>{track.name}</Text>
                <View style={styles.trackMiniButton}>
                  <Text style={styles.trackMiniText}>M</Text>
                </View>
                <View style={styles.trackMiniButton}>
                  <Text style={styles.trackMiniText}>S</Text>
                </View>
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
  searchButton: {
    width: 42,
    height: 42,
    borderRadius: mimidiTheme.radius.sm,
    borderWidth: 1,
    borderColor: mimidiTheme.colors.borderStrong,
    backgroundColor: mimidiTheme.colors.cardAlt,
    alignItems: 'center',
    justifyContent: 'center',
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
    left: '15%',
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
  trackMiniText: {
    color: mimidiTheme.colors.ink,
    fontSize: 11,
    fontWeight: '700',
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
});
