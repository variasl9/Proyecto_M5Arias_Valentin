import { useState, type ChangeEvent, type FormEvent } from 'react'
import { Link, Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { Alert } from '../components/ui/Alert'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { getFirebaseErrorMessage } from '../utils/firebaseErrors'
import {
  hasErrors,
  validateRegister,
  type FieldErrors,
  type RegisterValues,
} from '../utils/validators'

interface LocationState {
  from?: string
}

const INITIAL_VALUES: RegisterValues = {
  displayName: '',
  email: '',
  password: '',
  confirmPassword: '',
}

export function RegisterPage() {
  const { status, register, loginWithGoogle } = useAuth()
  const location = useLocation()
  const from = (location.state as LocationState | null)?.from ?? '/'

  const [values, setValues] = useState<RegisterValues>(INITIAL_VALUES)
  const [errors, setErrors] = useState<FieldErrors<keyof RegisterValues>>({})
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [pending, setPending] = useState<'email' | 'google' | null>(null)

  if (status === 'authenticated') return <Navigate to={from} replace />

  function handleChange(event: ChangeEvent<HTMLInputElement>) {
    const { name, value } = event.target
    setValues((prev) => ({ ...prev, [name]: value }))
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const validation = validateRegister(values)
    setErrors(validation)
    if (hasErrors(validation)) return

    setSubmitError(null)
    setPending('email')
    try {
      await register(values.email.trim(), values.password, values.displayName.trim())
    } catch (error) {
      setSubmitError(getFirebaseErrorMessage(error))
    } finally {
      setPending(null)
    }
  }

  async function handleGoogle() {
    setSubmitError(null)
    setPending('google')
    try {
      await loginWithGoogle()
    } catch (error) {
      setSubmitError(getFirebaseErrorMessage(error))
    } finally {
      setPending(null)
    }
  }

  return (
    <div className="mx-auto w-full max-w-sm">
      <h1 className="mb-6 text-2xl font-bold text-gray-900">Crear cuenta</h1>

      <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
        {submitError && <Alert>{submitError}</Alert>}

        <Input
          label="Nombre"
          name="displayName"
          autoComplete="name"
          value={values.displayName}
          onChange={handleChange}
          error={errors.displayName}
        />
        <Input
          label="Email"
          name="email"
          type="email"
          autoComplete="email"
          value={values.email}
          onChange={handleChange}
          error={errors.email}
        />
        <Input
          label="Contraseña"
          name="password"
          type="password"
          autoComplete="new-password"
          value={values.password}
          onChange={handleChange}
          error={errors.password}
        />
        <Input
          label="Repetir contraseña"
          name="confirmPassword"
          type="password"
          autoComplete="new-password"
          value={values.confirmPassword}
          onChange={handleChange}
          error={errors.confirmPassword}
        />

        <Button type="submit" fullWidth isLoading={pending === 'email'} disabled={pending !== null}>
          Crear cuenta
        </Button>
      </form>

      <div className="my-4 flex items-center gap-3 text-xs text-gray-400">
        <span className="h-px flex-1 bg-gray-200" />o<span className="h-px flex-1 bg-gray-200" />
      </div>

      <Button
        variant="secondary"
        fullWidth
        onClick={() => void handleGoogle()}
        isLoading={pending === 'google'}
        disabled={pending !== null}
      >
        Registrarse con Google
      </Button>

      <p className="mt-6 text-center text-sm text-gray-600">
        ¿Ya tenés cuenta?{' '}
        <Link to="/login" state={location.state} className="font-medium text-indigo-600 hover:underline">
          Iniciá sesión
        </Link>
      </p>
    </div>
  )
}