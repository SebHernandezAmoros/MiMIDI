import { useMemo, useState } from 'react';

export type EditViewMode = 'notes' | 'tracks';

type NoteBlock = {
  id: string;
  lane: number;
  start: number;
  width: number;
};

type TrackRow = {
  id: string;
  name: string;
  start: number;
  width: number;
  muted: boolean;
  solo: boolean;
};

const initialNoteBlocks: NoteBlock[] = [
  { id: 'note-1', lane: 6, start: 0.02, width: 0.12 },
  { id: 'note-2', lane: 4, start: 0.16, width: 0.11 },
  { id: 'note-3', lane: 2, start: 0.3, width: 0.08 },
  { id: 'note-4', lane: 5, start: 0.41, width: 0.09 },
  { id: 'note-5', lane: 3, start: 0.52, width: 0.1 },
  { id: 'note-6', lane: 1, start: 0.69, width: 0.08 },
  { id: 'note-7', lane: 4, start: 0.82, width: 0.08 },
];

const initialTracks: TrackRow[] = [
  { id: 'track-1', name: 'Track 1', start: 0.34, width: 0.56, muted: false, solo: false },
  { id: 'track-2', name: 'Track 2', start: 0.39, width: 0.5, muted: false, solo: false },
  { id: 'track-3', name: 'Track 3', start: 0.42, width: 0.22, muted: true, solo: false },
  { id: 'track-4', name: 'Track 4', start: 0.46, width: 0.45, muted: false, solo: true },
];

const barRanges = ['1 BAR', '2 BARS', '4 BARS'] as const;

export function useEditPrototypeState() {
  const [viewMode, setViewMode] = useState<EditViewMode>('notes');
  const [barRangeIndex, setBarRangeIndex] = useState(0);
  const [playheadPosition, setPlayheadPosition] = useState(0.15);
  const [selectedNoteId, setSelectedNoteId] = useState(initialNoteBlocks[0].id);
  const [trackRows, setTrackRows] = useState(initialTracks);

  const selectedNote = useMemo(
    () => initialNoteBlocks.find((note) => note.id === selectedNoteId) ?? initialNoteBlocks[0],
    [selectedNoteId],
  );

  function toggleViewMode() {
    setViewMode((current) => (current === 'notes' ? 'tracks' : 'notes'));
  }

  function cycleBarRange() {
    setBarRangeIndex((current) => (current + 1) % barRanges.length);
  }

  function movePlayhead() {
    setPlayheadPosition((current) => {
      const next = current + 0.12;
      return next > 0.9 ? 0.12 : Number(next.toFixed(2));
    });
  }

  function toggleTrackMute(trackId: string) {
    setTrackRows((current) =>
      current.map((track) =>
        track.id === trackId ? { ...track, muted: !track.muted } : track,
      ),
    );
  }

  function toggleTrackSolo(trackId: string) {
    setTrackRows((current) =>
      current.map((track) =>
        track.id === trackId ? { ...track, solo: !track.solo } : track,
      ),
    );
  }

  function selectNote(noteId: string) {
    setSelectedNoteId(noteId);
  }

  return {
    barRange: barRanges[barRangeIndex],
    cycleBarRange,
    movePlayhead,
    noteBlocks: initialNoteBlocks,
    playheadPosition,
    selectNote,
    selectedNote,
    selectedNoteId,
    toggleTrackMute,
    toggleTrackSolo,
    toggleViewMode,
    trackRows,
    viewMode,
  };
}
