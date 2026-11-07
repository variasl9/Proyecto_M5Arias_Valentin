interface QuantitySelectorProps {
  value: number
  onChange: (value: number) => void
  max: number
  min?: number
  label?: string
}

const BUTTON_CLASSES =
  'flex h-10 w-10 items-center justify-center text-lg text-gray-700 transition hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-40'

export function QuantitySelector({
  value,
  onChange,
  max,
  min = 1,
  label = 'Cantidad',
}: QuantitySelectorProps) {
  return (
    <div
      role="group"
      aria-label={label}
      className="inline-flex items-center overflow-hidden rounded-lg border border-gray-300 bg-white"
    >
      <button
        type="button"
        aria-label="Restar una unidad"
        className={BUTTON_CLASSES}
        disabled={value <= min}
        onClick={() => onChange(value - 1)}
      >
        −
      </button>
      <span className="w-10 text-center text-sm font-medium" aria-live="polite">
        {value}
      </span>
      <button
        type="button"
        aria-label="Sumar una unidad"
        className={BUTTON_CLASSES}
        disabled={value >= max}
        onClick={() => onChange(value + 1)}
      >
        +
      </button>
    </div>
  )
}