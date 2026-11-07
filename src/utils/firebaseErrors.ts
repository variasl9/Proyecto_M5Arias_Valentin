import { FirebaseError } from 'firebase/app'
import { AppError } from './errors'

const DEFAULT_MESSAGE = 'Ocurrió un error inesperado. Intentá de nuevo.'

const ERROR_MESSAGES: Record<string, string> = {
  // Authentication
  'auth/email-already-in-use': 'Ya existe una cuenta con ese email.',
  'auth/invalid-email': 'El email no es válido.',
  'auth/weak-password': 'La contraseña debe tener al menos 6 caracteres.',
  'auth/invalid-credential': 'Email o contraseña incorrectos.',
  'auth/user-not-found': 'Email o contraseña incorrectos.',
  'auth/wrong-password': 'Email o contraseña incorrectos.',
  'auth/too-many-requests': 'Demasiados intentos. Esperá unos minutos e intentá de nuevo.',
  'auth/popup-closed-by-user': 'Cerraste la ventana de Google antes de terminar.',
  'auth/popup-blocked': 'El navegador bloqueó la ventana de Google. Habilitá las ventanas emergentes.',
  'auth/network-request-failed': 'Error de conexión. Revisá tu internet.',
  // Firestore
  'permission-denied': 'No tenés permisos para realizar esta acción.',
  unavailable: 'No hay conexión con el servidor. Revisá tu internet.',
  aborted: 'Hubo un conflicto con otra operación. Intentá de nuevo.',
}

/** Convierte cualquier error en un mensaje claro para el usuario */
export function getFirebaseErrorMessage(error: unknown): string {
  if (error instanceof AppError) return error.message
  if (error instanceof FirebaseError) return ERROR_MESSAGES[error.code] ?? DEFAULT_MESSAGE
  return DEFAULT_MESSAGE
}