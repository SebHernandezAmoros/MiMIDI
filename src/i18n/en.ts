export const enMessages = {
  appMode: {
    title: "MiMIDI",
    subtitle:
      "Initial horizontal shell for the future app mode. The main views are already born here even if their content is still migrating.",
    openLab: "Go to lab",
    languageLabel: "Language",
    activeViewSummaryAriaLabel: "Active view summary",
    navigationAriaLabel: "Main app mode navigation",
  },
  views: {
    piano: {
      label: "Piano",
      description: "Piano, arpeggiator, instrument selection and recording.",
      intro:
        "Screen intended for performance, sound exploration and take recording without the density of the editing screen.",
      workspaceTitle: "Piano workspace",
      workspaceBody:
        "This area will host piano, arpeggiator, recording takes and quick instrument control.",
    },
    edit: {
      label: "Edit",
      description: "Track timeline, note timeline and fine editing.",
      intro:
        "Recommended first screen for the migration from the lab. Its natural boundary is the temporal editing of the project.",
      workspaceTitle: "Edit workspace",
      workspaceBody:
        "This area will host the track timeline, note timeline, selected note editor and fine editing tools.",
    },
    project: {
      label: "Project",
      description: "Tracks, mix, export and global project state.",
      intro:
        "Screen to manage the project as a whole: tracks, mix, export and general state.",
      workspaceTitle: "Project workspace",
      workspaceBody:
        "This area will host project naming, per-track mix, JSON/WAV export and structural project actions.",
    },
    plugins: {
      label: "Plugins",
      description: "Plugin manager and future extensible surfaces.",
      intro:
        "Future screen to manage plugins with a cleaner interface and less crowding than the current monoview.",
      workspaceTitle: "Plugins workspace",
      workspaceBody:
        "This area will host the full plugin manager and, later, the extra surfaces a plugin may register.",
    },
    settings: {
      label: "Settings",
      description: "Preferences and global environment parameters.",
      intro:
        "Reserved screen for global preferences, general parameters and future environment adjustments.",
      workspaceTitle: "Settings workspace",
      workspaceBody:
        "This placeholder is ready for the moment when the app stops depending on the lab as the only configuration surface.",
    },
    sampler: {
      label: "Sampler",
      description: "Audio recording, trimming and sample playback.",
      intro:
        "Dedicated view for capturing live audio, importing samples, trimming them and assigning them to triggerable slots.",
      workspaceTitle: "Sampler workspace",
      workspaceBody:
        "This area will host live audio recording, waveform viewer, sample slots and trimming tools.",
    },
    pad: {
      label: "Pad",
      description: "SMC Pad — percussion hits and rhythm recording.",
      intro:
        "Dedicated view for the SMC Pad: trigger hits, record rhythms and manage percussion patterns.",
      workspaceTitle: "Pad workspace",
      workspaceBody:
        "This area hosts the SMC Pad with its 8 percussion pads, track selector and recording controls.",
    },
  },
} as const
