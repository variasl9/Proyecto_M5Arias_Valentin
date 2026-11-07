import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  updateProfile,
  type User,
} from 'firebase/auth'
import { doc, getDoc, runTransaction, serverTimestamp } from 'firebase/firestore'
import { auth, db, googleProvider } from './firebase'
import type { UserProfile } from '../types'

const USERS_COLLECTION = 'users'

/**
 * Garantiza que exista el perfil del usuario en Firestore y lo devuelve.
 * Usa una transacción porque al registrarse, tanto register() como el
 * listener de onAuthStateChanged pueden llamar a esta función casi al
 * mismo tiempo: la transacción asegura que el perfil se cree una sola vez.
 */
export async function ensureUserProfile(
  user: User,
  displayName?: string,
): Promise<UserProfile> {
  const ref = doc(db, USERS_COLLECTION, user.uid)

  await runTransaction(db, async (transaction) => {
    const snap = await transaction.get(ref)

    if (!snap.exists()) {
      transaction.set(ref, {
        uid: user.uid,
        email: user.email ?? '',
        displayName: displayName ?? user.displayName ?? null,
        role: 'customer',
        createdAt: serverTimestamp(),
      })
      return
    }

    // Si el perfil se creó sin nombre (por la carrera), lo completamos
    if (displayName && !snap.data().displayName) {
      transaction.update(ref, { displayName })
    }
  })

  const snap = await getDoc(ref)
  return snap.data() as UserProfile
}

export async function register(
  email: string,
  password: string,
  displayName: string,
): Promise<void> {
  const { user } = await createUserWithEmailAndPassword(auth, email, password)
  await updateProfile(user, { displayName })
  await ensureUserProfile(user, displayName)
}

export async function login(email: string, password: string): Promise<void> {
  await signInWithEmailAndPassword(auth, email, password)
}

export async function loginWithGoogle(): Promise<void> {
  const { user } = await signInWithPopup(auth, googleProvider)
  // La primera vez que entra con Google no tiene perfil: lo creamos
  await ensureUserProfile(user)
}

export async function logout(): Promise<void> {
  await signOut(auth)
}