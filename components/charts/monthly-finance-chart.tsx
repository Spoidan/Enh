'use client'

import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts'

interface MonthlyFinanceChartProps {
  data: { month: string; income: number; expenses: number }[]
}

function formatBIF(v: number) {
  return new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 0 }).format(v) + ' BIF'
}

export function MonthlyFinanceChart({ data }: MonthlyFinanceChartProps) {
  if (!data.length || data.every(d => d.income === 0 && d.expenses === 0)) {
    return (
      <div className="flex h-[300px] items-center justify-center text-muted-foreground text-sm">
        Aucune donnée disponible pour cette période
      </div>
    )
  }

  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={data} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
        <XAxis
          dataKey="month"
          tick={{ fontSize: 11 }}
          tickLine={false}
          axisLine={false}
        />
        <YAxis
          tick={{ fontSize: 11 }}
          tickLine={false}
          axisLine={false}
          tickFormatter={v => new Intl.NumberFormat('fr-FR', { notation: 'compact', maximumFractionDigits: 0 }).format(v)}
          width={65}
        />
        <Tooltip
          formatter={(value, name) => [formatBIF(Number(value)), name]}
          contentStyle={{
            backgroundColor: 'var(--color-card)',
            border: '1px solid var(--color-border)',
            borderRadius: '8px',
            fontSize: '13px',
          }}
        />
        <Legend wrapperStyle={{ fontSize: '13px' }} />
        <Bar dataKey="income" fill="var(--color-chart-2)" radius={[3, 3, 0, 0]} name="Revenus" />
        <Bar dataKey="expenses" fill="var(--color-chart-5)" radius={[3, 3, 0, 0]} name="Dépenses" />
      </BarChart>
    </ResponsiveContainer>
  )
}
