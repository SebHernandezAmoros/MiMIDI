import {
  playSmcPadHit,
  smcPadSounds,
  type SmcPadSoundId,
} from "../../application/use-cases/playSmcPadHit"
import "./MiniSmcPad.css"

type MiniSmcPadProps = {
  onTrigger?: (soundId: SmcPadSoundId) => void
}

export function MiniSmcPad({ onTrigger }: MiniSmcPadProps) {
  function triggerSound(soundId: SmcPadSoundId) {
    playSmcPadHit(soundId)
    onTrigger?.(soundId)
  }

  return (
    <section className="smc-pad" aria-label="Mini SMC Pad">
      <div className="smc-pad-header">
        <div className="smc-pad-eyebrow">Laboratorio de percusion</div>
        <div className="smc-pad-header-row">
          <h2>Mini SMC Pad</h2>
          <span className="smc-pad-badge">Noise + sintesis</span>
        </div>
        <p>Prueba rapida de golpes matematicos grabables dentro del flujo actual.</p>
      </div>

      <div className="smc-pad-grid">
        {smcPadSounds.map((sound) => (
          <button
            className={`smc-pad-button ${sound.accent}`}
            key={sound.id}
            onClick={() => triggerSound(sound.id)}
            type="button"
          >
            <span className="smc-pad-label">{sound.label}</span>
            <span className="smc-pad-description">{sound.description}</span>
          </button>
        ))}
      </div>
    </section>
  )
}
