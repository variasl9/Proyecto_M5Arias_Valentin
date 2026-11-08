import { useId, type SelectHTMLAttributes } from 'react'

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label: string
  options: readonly string[]
  placeholder?: string
  error?: string
}

export function Select({
  label,
  options,
  placeholder,
  error,
  id,
  className = '',
  ...props
}: SelectProps) {
  const generatedId = useId()
  const selectId = id ?? generatedId
  const errorId = `${selectId}-error`

  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={selectId} className="text-sm font-medium text-gray-700">
        {label}
      </label>
      <select
        id={selectId}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? errorId : undefined}
        className={`rounded-lg border bg-white px-3 py-2.5 text-base outline-none transition focus:ring-2 ${
          error
            ? 'border-red-500 focus:ring-red-200'
            : 'border-gray-300 focus:border-indigo-500 focus:ring-indigo-200'
        } ${className}`}
        {...props}
      >
        {placeholder && <option value="">{placeholder}</option>}
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
      {error && (
        <p id={errorId} className="text-sm text-red-600">
          {error}
        </p>
      )}
    </div>
  )
}