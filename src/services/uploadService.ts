import { auth } from './firebase'
import { AppError } from '../utils/errors'

// Mismos límites que valida la Vercel Function (api/upload-url.ts)
export const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp']
export const MAX_IMAGE_SIZE_BYTES = 2 * 1024 * 1024 // 2 MB

interface UploadUrlResponse {
  uploadUrl: string
  publicUrl: string
}

/** Valida en el navegador antes de llamar al servidor, para dar feedback inmediato */
export function validateImageFile(file: File): string | null {
  if (!ALLOWED_IMAGE_TYPES.includes(file.type)) return 'Formato no permitido. Usá JPG, PNG o WEBP.'
  if (file.size > MAX_IMAGE_SIZE_BYTES) return 'La imagen debe pesar menos de 2 MB.'
  return null
}

/**
 * Sube una imagen de producto a S3 y devuelve su URL pública.
 * 1) Pide una presigned URL a la Vercel Function (enviando el token de Firebase)
 * 2) Sube el archivo DIRECTO a S3 con esa URL
 * Las credenciales de AWS nunca pasan por el navegador.
 */
export async function uploadProductImage(file: File): Promise<string> {
  const validationError = validateImageFile(file)
  if (validationError) throw new AppError(validationError)

  const user = auth.currentUser
  if (!user) throw new AppError('Tenés que iniciar sesión para subir imágenes.')

  const token = await user.getIdToken()

  // Paso 1: pedir la URL firmada
  const response = await fetch('/api/upload-url', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ contentType: file.type, size: file.size }),
  })

  if (!response.ok) {
    const data = (await response.json().catch(() => null)) as { error?: string } | null
    throw new AppError(data?.error ?? 'No se pudo preparar la subida de la imagen.')
  }

  const { uploadUrl, publicUrl } = (await response.json()) as UploadUrlResponse

  // Paso 2: subir el archivo directo a S3
  const upload = await fetch(uploadUrl, {
    method: 'PUT',
    headers: { 'Content-Type': file.type },
    body: file,
  })

  if (!upload.ok) {
    throw new AppError('No se pudo subir la imagen. Intentá de nuevo.')
  }

  return publicUrl
}