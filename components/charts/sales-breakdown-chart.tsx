'use client'

import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts'

interface SalesBreakdownChartProps {
  uniformSales: number
  bookSales: number
  otherSales: number
}

const COLORS = ['var(--color-chart-1)', 'var(--color-chart-3)', 'var(--color-chart-4)']

function formatBIF(v: number) {
  return new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 0 }).format(v) + ' BIF'
}

export function SalesBreakdownChart({ uniformSales, bookSales, otherSales }: SalesBreakdownChartProps) {
  const data = [
    { name: 'Uniformes', value: uniformSales },
    { name: 'Livres', value: bookSales },
    { name: 'Autre', value: otherSales },
  ].filter(d => d.value > 0)

  if (!data.length) {
    return (
      <div className="flex h-[200px] items-center justify-center text-muted-foreground text-sm">
        Aucune vente
      </div>
    )
  }

  return (
    <ResponsiveContainer width="100%" height={200}>
      <PieChart>
        <Pie data={data} cx="50%" cy="50%" outerRadius={70} paddingAngle={3} dataKey="value">
          {data.map((_, i) => (
            <Cell key={i} fill={COLORS[i % COLORS.length]} />
          ))}
        </Pie>
        <Tooltip
          formatter={(value, name) => [formatBIF(Number(value)), name]}
          contentStyle={{
            backgroundColor: 'var(--color-card)',
            border: '1px solid var(--color-border)',
            borderRadius: '8px',
            fontSize: '13px',
          }}
        />
        <Legend wrapperStyle={{ fontSize: '12px' }} />
      </PieChart>
    </ResponsiveContainer>
  )
}
