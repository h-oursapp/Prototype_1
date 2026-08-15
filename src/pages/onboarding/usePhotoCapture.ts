import { useEffect, useState } from 'react'

/** Manages a locally-picked photo as an object URL — shared by StepVerify (TODO #2.3) and
 *  StepPhoto (TODO #2.5), the two places in onboarding that let you take/choose a photo and
 *  preview it without saving it anywhere. Revokes the previous URL whenever it's replaced or the
 *  component unmounts, so retaking/re-choosing a photo a few times doesn't leak memory for the
 *  rest of the tab's life. */
export function usePhotoCapture() {
  const [photoUrl, setPhotoUrl] = useState<string | null>(null)

  useEffect(() => {
    return () => {
      if (photoUrl) URL.revokeObjectURL(photoUrl)
    }
  }, [photoUrl])

  const choosePhoto = (file: File) => {
    setPhotoUrl((current) => {
      if (current) URL.revokeObjectURL(current)
      return URL.createObjectURL(file)
    })
  }

  return { photoUrl, choosePhoto }
}
