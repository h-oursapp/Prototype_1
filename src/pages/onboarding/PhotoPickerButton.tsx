interface PhotoPickerButtonProps {
  label: string
  /** `'user'` opens the phone's own front camera directly. Omitted, the OS's normal photo/file
   *  picker decides instead (camera roll, files, ...) — the two different buttons TODO #2.5 asks
   *  for ("take a picture" vs. "choose from your phone") are exactly this one prop, not two
   *  different mechanisms. */
  capture?: 'user' | 'environment'
  onChoose: (file: File) => void
}

/** A styled button wrapping a visually-hidden `<input type="file">` — the real input stays in the
 *  DOM and tabbable (clipped, not `display: none`), so it's reachable by keyboard/screen reader
 *  like any other file input. Shared by StepVerify and StepPhoto (see usePhotoCapture.ts). */
export function PhotoPickerButton({ label, capture, onChoose }: PhotoPickerButtonProps) {
  return (
    <label className="onboarding-step__photo-button">
      <input
        className="onboarding-step__photo-input"
        type="file"
        accept="image/*"
        capture={capture}
        onChange={(event) => {
          const file = event.target.files?.[0]
          if (file) onChoose(file)
        }}
      />
      {label}
    </label>
  )
}
