import { useEffect, useState } from 'react'

/**
 * Devuelve el valor recién cuando dejó de cambiar durante `delay` ms.
 * Cada cambio cancela el temporizador anterior y arranca uno nuevo.
 */
export function useDebounce<T>(value: T, delay = 400): T {
  const [debouncedValue, setDebouncedValue] = useState(value)

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay)
    return () => clearTimeout(timer)
  }, [value, delay])

  return debouncedValue
}