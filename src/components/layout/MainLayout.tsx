import { Suspense } from 'react'
import { Outlet } from 'react-router-dom'
import { FullPageSpinner } from '../ui/Spinner'
import { Navbar } from './Navbar'

export function MainLayout() {
  return (
    <div className="flex min-h-svh flex-col bg-gray-50">
      <Navbar />
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6">
        {/* La navbar queda visible mientras se descarga una página lazy */}
        <Suspense fallback={<FullPageSpinner />}>
          <Outlet />
        </Suspense>
      </main>
    </div>
  )
}