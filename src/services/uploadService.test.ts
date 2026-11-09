import { beforeEach, describe, expect, it, vi } from 'vitest'
import { auth } from './firebase'
import { uploadProductImage, validateImageFile } from './uploadService'

const PRESIGNED_URL = 'https://bucket.s3.sa-east-1.amazonaws.com/products/abc.png?X-Amz-Signature=xyz'
const PUBLIC_URL = 'https://bucket.s3.sa-east-1.amazonaws.com/products/abc.png'

const fetchMock = vi.fn()

/** Simula una respuesta de fetch sin depender de la API Response del entorno */
function jsonResponse(status: number, data?: unknown) {
  return { ok: status >= 200 && status < 300, status, json: async () => data }
}

/** `auth` es el objeto mockeado en setup.ts: le ponemos un usuario de prueba */
function setCurrentUser(user: unknown) {
  ;(auth as unknown as { currentUser: unknown }).currentUser = user
}

const image = new File(['contenido'], 'campera.png', { type: 'image/png' })

beforeEach(() => {
  vi.stubGlobal('fetch', fetchMock)
  setCurrentUser({ getIdToken: vi.fn(async () => 'token-123') })
})

describe('validateImageFile', () => {
  it('acepta JPG, PNG y WEBP', () => {
    expect(validateImageFile(image)).toBeNull()
  })

  it('rechaza otros formatos', () => {
    const gif = new File(['x'], 'animacion.gif', { type: 'image/gif' })
    expect(validateImageFile(gif)).toBe('Formato no permitido. Usá JPG, PNG o WEBP.')
  })

  it('rechaza imágenes de más de 2 MB', () => {
    const big = new File([new Uint8Array(3 * 1024 * 1024)], 'grande.png', { type: 'image/png' })
    expect(validateImageFile(big)).toBe('La imagen debe pesar menos de 2 MB.')
  })
})

describe('uploadProductImage', () => {
  it('pide la URL firmada con el token y sube el archivo directo a S3', async () => {
    fetchMock
      .mockResolvedValueOnce(jsonResponse(200, { uploadUrl: PRESIGNED_URL, publicUrl: PUBLIC_URL }))
      .mockResolvedValueOnce(jsonResponse(200))

    await expect(uploadProductImage(image)).resolves.toBe(PUBLIC_URL)

    // 1) Nuestra Vercel Function, autenticada
    const [apiUrl, apiOptions] = fetchMock.mock.calls[0] as [string, RequestInit]
    expect(apiUrl).toBe('/api/upload-url')
    expect(apiOptions.method).toBe('POST')
    expect(apiOptions.headers).toMatchObject({ Authorization: 'Bearer token-123' })
    expect(JSON.parse(apiOptions.body as string)).toEqual({
      contentType: 'image/png',
      size: image.size,
    })

    // 2) S3, con la URL firmada (sin credenciales de AWS en el navegador)
    const [s3Url, s3Options] = fetchMock.mock.calls[1] as [string, RequestInit]
    expect(s3Url).toBe(PRESIGNED_URL)
    expect(s3Options.method).toBe('PUT')
    expect(s3Options.body).toBe(image)
  })

  it('valida el archivo antes de llamar al servidor', async () => {
    const gif = new File(['x'], 'animacion.gif', { type: 'image/gif' })
    await expect(uploadProductImage(gif)).rejects.toThrow('Formato no permitido')
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('exige sesión iniciada', async () => {
    setCurrentUser(null)
    await expect(uploadProductImage(image)).rejects.toThrow('Tenés que iniciar sesión')
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('muestra el mensaje del servidor si la función rechaza el pedido', async () => {
    fetchMock.mockResolvedValueOnce(
      jsonResponse(403, { error: 'Solo un administrador puede subir imágenes.' }),
    )

    await expect(uploadProductImage(image)).rejects.toThrow(
      'Solo un administrador puede subir imágenes.',
    )
    expect(fetchMock).toHaveBeenCalledTimes(1) // nunca llegó a S3
  })

  it('explica el problema si S3 bloquea la subida (por ejemplo, por CORS)', async () => {
    fetchMock
      .mockResolvedValueOnce(jsonResponse(200, { uploadUrl: PRESIGNED_URL, publicUrl: PUBLIC_URL }))
      .mockRejectedValueOnce(new TypeError('Failed to fetch'))

    await expect(uploadProductImage(image)).rejects.toThrow('Revisá la configuración de CORS')
  })

  it('avisa si S3 rechaza la imagen', async () => {
    fetchMock
      .mockResolvedValueOnce(jsonResponse(200, { uploadUrl: PRESIGNED_URL, publicUrl: PUBLIC_URL }))
      .mockResolvedValueOnce(jsonResponse(403))

    await expect(uploadProductImage(image)).rejects.toThrow('S3 rechazó la imagen')
  })
})