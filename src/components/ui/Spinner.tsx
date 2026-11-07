interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg'
  label?: string
}

const SIZES = {
  sm: 'h-4 w-4 border-2',
  md: 'h-8 w-8 border-4',
  lg: 'h-12 w-12 border-4',
}

export function Spinner({ size = 'md', label = 'Cargando...' }: SpinnerProps) {
  return (
    <span role="status" className="inline-flex items-center">
      <span
        aria-hidden="true"
        className={`${SIZES[size]} animate-spin rounded-full border-current border-t-transparent`}
      />
      <span className="sr-only">{label}</span>
    </span>
  )
}

export function FullPageSpinner() {
  return (
    <div className="flex min-h-[50vh] items-center justify-center text-indigo-600">
      <Spinner size="lg" />
    </div>
  )
}