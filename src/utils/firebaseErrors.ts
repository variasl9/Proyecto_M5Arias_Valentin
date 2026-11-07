import { FirebaseError } from 'firebase/app'

const AUTH_ERRORS: Record<string, string> = {
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
  'permission-denied': 'No tenés permisos para realizar esta acción.',
}

export function getFirebaseErrorMessage(error: unknown): string {
  if (error instanceof FirebaseError) {
    return AUTH_ERRORS[error.code] ?? 'Ocurrió un error inesperado. Intentá de nuevo.'
  }
  return 'Ocurrió un error inesperado. Intentá de nuevo.'
}