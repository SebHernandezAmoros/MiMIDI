import type { MidiNoteEvent } from "../../engine/midi/events"
import "./MidiEventLog.css"

type MidiEventLogProps = {
  events: MidiNoteEvent[]
}

export function MidiEventLog({ events }: MidiEventLogProps) {
  return (
    <section className="midi-event-log" aria-label="Eventos MIDI">
      <h2>Eventos MIDI</h2>

      {events.length === 0 ? (
        <p className="midi-event-empty">Sin eventos todavia.</p>
      ) : (
        <ol className="midi-event-list">
          {events.map((event) => (
            <li className="midi-event-item" key={event.id}>
              <span>{event.type}</span>
              <strong>{event.note}</strong>
              <span>{event.time.toFixed(2)}s</span>
            </li>
          ))}
        </ol>
      )}
    </section>
  )
}
