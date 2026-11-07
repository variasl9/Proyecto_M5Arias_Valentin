export function ProductCardSkeleton() {
  return (
    <div className="flex animate-pulse flex-col overflow-hidden rounded-xl border border-gray-200 bg-white">
      <div className="aspect-square bg-gray-200" />
      <div className="flex flex-col gap-2 p-3">
        <div className="h-3 w-1/3 rounded bg-gray-200" />
        <div className="h-4 w-3/4 rounded bg-gray-200" />
        <div className="h-5 w-1/2 rounded bg-gray-200" />
      </div>
    </div>
  )
}