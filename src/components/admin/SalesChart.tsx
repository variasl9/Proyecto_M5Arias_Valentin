import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import type { DailySales } from '../../utils/analytics'
import { formatPrice } from '../../utils/format'

const compactPrice = new Intl.NumberFormat('es-AR', {
  style: 'currency',
  currency: 'ARS',
  notation: 'compact',
  maximumFractionDigits: 1,
})

interface SalesChartProps {
  data: DailySales[]
}

export function SalesChart({ data }: SalesChartProps) {
  const total = data.reduce((sum, day) => sum + day.revenue, 0)

  return (
    <section className="rounded-xl border border-gray-200 bg-white p-4">
      <div className="flex flex-col gap-1 sm:flex-row sm:items-baseline sm:justify-between">
        <h2 className="text-lg font-semibold text-gray-900">Ventas de los últimos 14 días</h2>
        <p className="text-sm text-gray-500">Total: {formatPrice(total)}</p>
      </div>

      {total === 0 ? (
        <p className="py-12 text-center text-sm text-gray-500">
          Todavía no hay ventas en este período.
        </p>
      ) : (
        <div
          className="mt-4 h-64"
          role="img"
          aria-label={`Gráfico de ingresos por día. Total del período: ${formatPrice(total)}`}
        >
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
              <XAxis
                dataKey="label"
                tick={{ fontSize: 12, fill: '#6b7280' }}
                tickLine={false}
                axisLine={false}
                interval="preserveStartEnd"
                minTickGap={12}
              />
              <YAxis
                tickFormatter={(value: number) => compactPrice.format(value)}
                tick={{ fontSize: 12, fill: '#6b7280' }}
                tickLine={false}
                axisLine={false}
                width={72}
              />
              <Tooltip
                cursor={{ fill: '#eef2ff' }}
                formatter={(value) => [formatPrice(Number(value)), 'Ingresos']}
                labelFormatter={(label) => `Día ${String(label)}`}
              />
              <Bar dataKey="revenue" fill="#4f46e5" radius={[4, 4, 0, 0]} maxBarSize={32} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </section>
  )
}