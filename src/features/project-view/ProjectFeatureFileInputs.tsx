import type { ChangeEventHandler, Ref } from "react"

type ProjectFeatureFileInputsProps = {
  bundleInputRef: Ref<HTMLInputElement>
  jsonInputRef: Ref<HTMLInputElement>
  onBundleChange: ChangeEventHandler<HTMLInputElement>
  onJsonChange: ChangeEventHandler<HTMLInputElement>
}

export function ProjectFeatureFileInputs({
  bundleInputRef,
  jsonInputRef,
  onBundleChange,
  onJsonChange,
}: ProjectFeatureFileInputsProps) {
  return (
    <>
      <input
        accept=".json,application/json"
        hidden
        onChange={onJsonChange}
        ref={jsonInputRef}
        type="file"
      />
      <input
        accept=".mimidi"
        hidden
        onChange={onBundleChange}
        ref={bundleInputRef}
        type="file"
      />
    </>
  )
}
