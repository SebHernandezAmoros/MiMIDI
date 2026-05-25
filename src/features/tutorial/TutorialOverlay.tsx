import { createPortal } from "react-dom"
import { useEffect, useLayoutEffect, useState } from "react"
import { navigateTo } from "../../app/navigation"
import { BASIC_TUTORIAL_STEPS, BASIC_TOTAL_STEPS, type BasicTutorialStep } from "./tutorialSteps"
import { tutorialBasicTexts, type TutorialLangTexts } from "./tutorialTexts"
import type { AppLanguage } from "../../app/appI18n"
import "./TutorialOverlay.css"

type TutorialOverlayProps = {
  active: boolean
  step: number
  language: AppLanguage
  onStep: (step: number) => void
  onClose: () => void
  onLanguageChange?: (lang: AppLanguage) => void
  steps?: BasicTutorialStep[]
  totalSteps?: number
  customTexts?: Record<AppLanguage, TutorialLangTexts>
}

export function TutorialOverlay({
  active,
  step,
  language,
  onStep,
  onClose,
  onLanguageChange,
  steps,
  totalSteps,
  customTexts,
}: TutorialOverlayProps) {
  const [spotlightRect, setSpotlightRect] = useState<DOMRect | null>(null)
  const isDark = localStorage.getItem("mimidi-dark-mode") === "true"

  const resolvedSteps = steps ?? BASIC_TUTORIAL_STEPS
  const resolvedTotalSteps = totalSteps ?? BASIC_TOTAL_STEPS
  const texts = (customTexts ?? tutorialBasicTexts)[language]

  const isLangStep = step === 0 && !!onLanguageChange
  const stepIndex = step - 1
  const currentStep = isLangStep ? null : resolvedSteps[stepIndex]
  const stepTexts = isLangStep ? null : texts.steps[stepIndex]
  const isLastStep = step === resolvedTotalSteps

  useLayoutEffect(() => {
    if (!active) return

    ;(document.querySelector('[data-tutorial="dialog-close"]') as HTMLElement | null)?.click()

    if (isLangStep || !currentStep) {
      setSpotlightRect(null)
      return
    }

    navigateTo(currentStep.view)

    if (!currentStep.target) {
      setSpotlightRect(null)
      return
    }

    let innerTimer: number | null = null
    const timer = window.setTimeout(() => {
      if (currentStep.triggerBefore) {
        const triggerEl = document.querySelector(`[data-tutorial="${currentStep.triggerBefore}"]`) as HTMLElement | null
        triggerEl?.click()
        innerTimer = window.setTimeout(() => {
          if (!currentStep.target) { setSpotlightRect(null); return }
          const el = document.querySelector(`[data-tutorial="${currentStep.target}"]`)
          if (!el) { setSpotlightRect(null); return }
          el.scrollIntoView({ behavior: "smooth", block: "center" })
          setSpotlightRect(el.getBoundingClientRect())
        }, 250)
        return
      }
      const el = document.querySelector(`[data-tutorial="${currentStep.target}"]`)
      if (!el) { setSpotlightRect(null); return }
      el.scrollIntoView({ behavior: "smooth", block: "center" })
      setSpotlightRect(el.getBoundingClientRect())
    }, 200)

    return () => { clearTimeout(timer); if (innerTimer !== null) clearTimeout(innerTimer) }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active, step])

  useEffect(() => {
    if (!active || !currentStep?.target) return
    function update() {
      const target = currentStep?.target
      if (!target) return
      const el = document.querySelector(`[data-tutorial="${target}"]`)
      if (el) setSpotlightRect(el.getBoundingClientRect())
    }
    window.addEventListener("resize", update)
    return () => window.removeEventListener("resize", update)
  }, [active, step, currentStep])

  if (!active) return null

  function handleNext() {
    if (isLastStep) { onClose(); return }
    onStep(step + 1)
  }

  function handlePrev() {
    if (step > 1) onStep(step - 1)
  }

  function handleSkip() {
    onClose()
  }

  function handleLangSelect(lang: AppLanguage) {
    onLanguageChange?.(lang)
    onStep(1)
  }

  return createPortal(
    <div
      aria-label="Tutorial"
      className="tutorial-root"
      data-ui-theme={isDark ? "dark" : undefined}
      role="dialog"
    >
      <div aria-hidden="true" className="tutorial-backdrop">
        {spotlightRect && (
          <div
            className="tutorial-spotlight"
            style={{
              top: spotlightRect.top - 6,
              left: spotlightRect.left - 6,
              width: spotlightRect.width + 12,
              height: spotlightRect.height + 12,
            }}
          />
        )}
      </div>

      {isLangStep ? (
        <div className="tutorial-modal tutorial-modal-lang">
          <p className="tutorial-lang-title">{texts.langSelectTitle}</p>
          <p className="tutorial-lang-sub">{texts.langSelectSubtitle}</p>
          <div className="tutorial-lang-buttons">
            <button className="tutorial-lang-btn" onClick={() => handleLangSelect("es")} type="button">
              Español
            </button>
            <button className="tutorial-lang-btn" onClick={() => handleLangSelect("en")} type="button">
              English
            </button>
          </div>
        </div>
      ) : stepTexts ? (
        <div className="tutorial-modal">
          <button className="tutorial-skip-btn" onClick={handleSkip} type="button">
            {texts.ui.skip}
          </button>

          <div className="tutorial-modal-content">
            {stepTexts.title && (
              <strong className="tutorial-step-title">{stepTexts.title}</strong>
            )}
            <p className="tutorial-step-text">{stepTexts.text}</p>
          </div>

          <div className="tutorial-modal-footer">
            <span className="tutorial-step-counter">
              {texts.ui.stepOf(step, resolvedTotalSteps)}
            </span>
            <div className="tutorial-modal-actions">
              {step > 1 && (
                <button className="tutorial-btn-secondary" onClick={handlePrev} type="button">
                  {texts.ui.prev}
                </button>
              )}
              <button className="tutorial-btn-primary" onClick={handleNext} type="button">
                {isLastStep ? texts.ui.closeLabel : texts.ui.next}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>,
    document.body,
  )
}
