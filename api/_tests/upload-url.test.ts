// @vitest-environment node
import type { VercelRequest, VercelResponse } from '@vercel/node'
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'

// vi.hoisted: los mocks se crean ANTES de que se carguen los módulos que los usan
const mocks = vi.hoisted(() => ({
  verifyIdToken: vi.fn(),
  getUserDoc: vi.fn(),
  getSignedUrl: vi.fn(),
}))

// ---------- Firebase Admin: sin credenciales ni red ----------
vi.mock('firebase-admin/app', () => ({
  cert: vi.fn(),
  getApps: () => [{}],
  initializeApp: vi.fn(),
}))
vi.mock('firebase-admin/auth', () => ({
  getAuth: () => ({ verifyIdToken: mocks.verifyIdToken }),
}))
vi.mock('firebase-admin/firestore', () => ({
  getFirestore: () => ({ doc: () => ({ get: mocks.getUserDoc }) }),
}))

// ---------- AWS SDK: nunca se conecta a S3 ----------
vi.mock('@aws-sdk/client-s3', () => ({
  S3Client: class {},
  PutObjectCommand: class {
    input: unknown
    constructor(input: unknown) {
      this.input = input
    }
  },
}))
vi.mock('@aws-sdk/s3-request-presigner', () => ({
  getSignedUrl: mocks.getSignedUrl,
}))

/* ---------- Request y response falsos ---------- */

interface FakeResponse {
  statusCode: number
  body: unknown
  headers: Record<string, string>
  status: (code: number) => FakeResponse
  json: (data: unknown) => FakeResponse
  setHeader: (name: string, value: string) => FakeResponse
}

function createResponse(): FakeResponse {
  const res: FakeResponse = {
    statusCode: 200,
    body: undefined,
    headers: {},
    status(code) {
      res.statusCode = code
      return res
    },
    json(data) {
      res.body = data
      return res
    },
    setHeader(name, value) {
      res.headers[name] = value
      return res
    },
  }
  return res
}

type Handler = (req: VercelRequest, res: VercelResponse) => Promise<unknown>
let handler: Handler

interface FakeRequest {
  method?: string
  headers?: Record<string, string>
  body?: unknown
}

async function callHandler(req: FakeRequest) {
  const res = createResponse()
  await handler(
    { method: 'POST', headers: {}, ...req } as unknown as VercelRequest,
    res as unknown as VercelResponse,
  )
  return res
}

const withToken = (body: unknown): FakeRequest => ({
  headers: { authorization: 'Bearer token-valido' },
  body,
})

const validBody = { contentType: 'image/png', size: 500_000 }

beforeAll(async () => {
  // La función lee estas variables al cargarse: las definimos antes de importarla
  process.env.AWS_REGION = 'sa-east-1'
  process.env.AWS_S3_BUCKET = 'bucket-de-prueba'
  handler = (await import('../upload-url')).default as Handler
})

beforeEach(() => {
  // Escenario feliz por defecto: token válido de un admin
  mocks.verifyIdToken.mockResolvedValue({ uid: 'admin-1' })
  mocks.getUserDoc.mockResolvedValue({ get: (field: string) => (field === 'role' ? 'admin' : undefined) })
  mocks.getSignedUrl.mockResolvedValue('https://s3.amazonaws.com/url-firmada')
})

describe('POST /api/upload-url', () => {
  it('rechaza métodos que no sean POST', async () => {
    const res = await callHandler({ method: 'GET' })
    expect(res.statusCode).toBe(405)
    expect(res.headers.Allow).toBe('POST')
  })

  it('401 sin token, sin siquiera intentar verificarlo', async () => {
    const res = await callHandler({ body: validBody })
    expect(res.statusCode).toBe(401)
    expect(mocks.verifyIdToken).not.toHaveBeenCalled()
  })

  it('401 si el token es inválido o está vencido', async () => {
    mocks.verifyIdToken.mockRejectedValue(new Error('auth/id-token-expired'))
    const res = await callHandler(withToken(validBody))
    expect(res.statusCode).toBe(401)
  })

  it('403 si el usuario no es admin, y nunca firma una URL', async () => {
    mocks.getUserDoc.mockResolvedValue({ get: () => 'customer' })
    const res = await callHandler(withToken(validBody))
    expect(res.statusCode).toBe(403)
    expect(mocks.getSignedUrl).not.toHaveBeenCalled()
  })

  it('400 con un formato no permitido', async () => {
    const res = await callHandler(withToken({ contentType: 'application/pdf', size: 1000 }))
    expect(res.statusCode).toBe(400)
  })

  it('400 con un tipo "tramposo" que existe en los objetos de JavaScript', async () => {
    const res = await callHandler(withToken({ contentType: 'toString', size: 1000 }))
    expect(res.statusCode).toBe(400)
  })

  it('400 si la imagen pesa más de 2 MB o no informa el tamaño', async () => {
    expect((await callHandler(withToken({ contentType: 'image/png', size: 3 * 1024 * 1024 }))).statusCode).toBe(400)
    expect((await callHandler(withToken({ contentType: 'image/png' }))).statusCode).toBe(400)
  })

  it('200 con un admin: firma una URL de 60 segundos dentro de products/', async () => {
    const res = await callHandler(withToken(validBody))

    expect(res.statusCode).toBe(200)
    expect(res.body).toEqual({
      uploadUrl: 'https://s3.amazonaws.com/url-firmada',
      publicUrl: expect.stringMatching(
        /^https:\/\/bucket-de-prueba\.s3\.sa-east-1\.amazonaws\.com\/products\/[\w-]+\.png$/,
      ),
    })

    expect(mocks.getSignedUrl).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        input: expect.objectContaining({
          Bucket: 'bucket-de-prueba',
          ContentType: 'image/png',
          Key: expect.stringMatching(/^products\//),
        }),
      }),
      { expiresIn: 60 },
    )
  })

  it('500 con un mensaje genérico si falla la firma, sin filtrar detalles internos', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
    mocks.getSignedUrl.mockRejectedValue(new Error('InvalidAccessKeyId: detalle interno'))

    const res = await callHandler(withToken(validBody))

    expect(res.statusCode).toBe(500)
    expect(res.body).toEqual({ error: 'No pudimos preparar la subida de la imagen.' })
  })
})