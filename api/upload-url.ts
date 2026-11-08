import { randomUUID } from 'node:crypto'
import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import type { VercelRequest, VercelResponse } from '@vercel/node'
import { cert, getApps, initializeApp, type App } from 'firebase-admin/app'
import { getAuth } from 'firebase-admin/auth'
import { getFirestore } from 'firebase-admin/firestore'

/* ---------- Configuración ---------- */

// Tipos permitidos y su extensión. Se repite en el frontend (uploadService) para validar antes.
const ALLOWED_TYPES = new Map<string, string>([
  ['image/jpeg', 'jpg'],
  ['image/png', 'png'],
  ['image/webp', 'webp'],
])
const MAX_SIZE_BYTES = 2 * 1024 * 1024 // 2 MB
const URL_EXPIRATION_SECONDS = 60

const REGION = process.env.AWS_REGION
const BUCKET = process.env.AWS_S3_BUCKET

// El SDK de AWS lee AWS_ACCESS_KEY_ID y AWS_SECRET_ACCESS_KEY solo, desde las variables de entorno
const s3 = new S3Client({ region: REGION })

/** Inicializa Firebase Admin una sola vez (Vercel reutiliza la instancia entre llamadas) */
function getAdminApp(): App {
  return (
    getApps()[0] ??
    initializeApp({
      credential: cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        // En las variables de entorno los saltos de línea vienen como "\n" literal
        privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      }),
    })
  )
}

/* ---------- Handler ---------- */

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST')
    return res.status(405).json({ error: 'Método no permitido.' })
  }

  if (!REGION || !BUCKET) {
    console.error('Faltan las variables AWS_REGION o AWS_S3_BUCKET')
    return res.status(500).json({ error: 'El servidor no está configurado.' })
  }

  // 1) ¿Quién es? Verificamos el token de Firebase que manda el navegador
  const header = req.headers.authorization
  const token = header?.startsWith('Bearer ') ? header.slice('Bearer '.length) : null
  if (!token) {
    return res.status(401).json({ error: 'Tenés que iniciar sesión.' })
  }

  let uid: string
  try {
    const decoded = await getAuth(getAdminApp()).verifyIdToken(token)
    uid = decoded.uid
  } catch {
    return res.status(401).json({ error: 'Sesión inválida o vencida. Volvé a iniciar sesión.' })
  }

  // 2) ¿Es admin? El rol se lee de Firestore desde el servidor: no se puede falsificar
  try {
    const userDoc = await getFirestore(getAdminApp()).doc(`users/${uid}`).get()
    if (userDoc.get('role') !== 'admin') {
      return res.status(403).json({ error: 'Solo un administrador puede subir imágenes.' })
    }
  } catch (error) {
    console.error('Error leyendo el rol del usuario', error)
    return res.status(500).json({ error: 'No pudimos verificar tus permisos.' })
  }

  // 3) ¿Qué quiere subir? Validamos tipo y tamaño
  const { contentType, size } = (req.body ?? {}) as { contentType?: unknown; size?: unknown }

  const extension = typeof contentType === 'string' ? ALLOWED_TYPES.get(contentType) : undefined
  if (!extension) {
    return res.status(400).json({ error: 'Formato no permitido. Usá JPG, PNG o WEBP.' })
  }
  if (typeof size !== 'number' || size <= 0 || size > MAX_SIZE_BYTES) {
    return res.status(400).json({ error: 'La imagen debe pesar menos de 2 MB.' })
  }

  // 4) Firmamos una URL temporal para subir UN archivo a products/
  try {
    // El nombre lo genera el servidor: el cliente no puede elegir dónde escribir
    const key = `products/${randomUUID()}.${extension}`

    const command = new PutObjectCommand({
      Bucket: BUCKET,
      Key: key,
      ContentType: contentType as string,
    })

    const uploadUrl = await getSignedUrl(s3, command, { expiresIn: URL_EXPIRATION_SECONDS })
    const publicUrl = `https://${BUCKET}.s3.${REGION}.amazonaws.com/${key}`

    return res.status(200).json({ uploadUrl, publicUrl })
  } catch (error) {
    console.error('Error generando la presigned URL', error)
    return res.status(500).json({ error: 'No pudimos preparar la subida de la imagen.' })
  }
}