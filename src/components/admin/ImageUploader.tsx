import { useId, useState, type ChangeEvent } from 'react'
import { ALLOWED_IMAGE_TYPES, validateImageFile } from '../../services/uploadService'

interface ImageUploaderProps {
  currentUrl?: string
  onFileChange: (file: File | null) => void
  error?: string
  disabled?: boolean
}

export function ImageUploader({ currentUrl, onFileChange, error, disabled }: ImageUploaderProps) {
  const inputId = useId()
  const [preview, setPreview] = useState<string | null>(null)
  const [fileError, setFileError] = useState<string | null>(null)

  function handleChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    // Limpiamos el input para poder volver a elegir el mismo archivo si hace falta
    event.target.value = ''
    if (!file) return

    const validationError = validateImageFile(file)
    if (validationError) {
      setFileError(validationError)
      return
    }

    setFileError(null)
    // Vista previa LOCAL: todavía no se sube nada a S3
    const reader = new FileReader()
    reader.onload = () => {
      setPreview(typeof reader.result === 'string' ? reader.result : null)
    }
    reader.readAsDataURL(file)
    onFileChange(file)
  }

  function handleDiscard() {
    setPreview(null)
    onFileChange(null)
  }

  const shownImage = preview ?? currentUrl
  const message = fileError ?? error

  return (
    <div className="flex flex-col gap-2">
      <span className="text-sm font-medium text-gray-700">Imagen</span>

      <div className="flex items-center gap-4">
        <div className="h-28 w-28 shrink-0 overflow-hidden rounded-lg border border-dashed border-gray-300 bg-gray-50">
          {shownImage ? (
            <img src={shownImage} alt="Vista previa del producto" className="h-full w-full object-cover" />
          ) : (
            <span className="flex h-full items-center justify-center text-xs text-gray-400">
              Sin imagen
            </span>
          )}
        </div>

        <div className="flex flex-col items-start gap-2">
          <label
            htmlFor={inputId}
            className={`cursor-pointer rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-800 transition hover:bg-gray-50 ${
              disabled ? 'pointer-events-none opacity-60' : ''
            }`}
          >
            {shownImage ? 'Cambiar imagen' : 'Elegir imagen'}
          </label>
          <input
            id={inputId}
            type="file"
            accept={ALLOWED_IMAGE_TYPES.join(',')}
            onChange={handleChange}
            disabled={disabled}
            className="sr-only"
          />
          {preview && (
            <button
              type="button"
              onClick={handleDiscard}
              disabled={disabled}
              className="text-xs text-gray-600 hover:underline"
            >
              Descartar imagen nueva
            </button>
          )}
          <p className="text-xs text-gray-500">JPG, PNG o WEBP · máx. 2 MB</p>
        </div>
      </div>

      {message && <p className="text-sm text-red-600">{message}</p>}
    </div>
  )
}