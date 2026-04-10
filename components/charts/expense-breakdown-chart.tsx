'use client'

import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts'

interface ExpenseBreakdownChartProps {
  data: { category: string; amount: number }[]
}

const COLORS = [
  '#6366f1', '#f59e0b', '#ef4444', '#22c55e', '#3b82f6',
  '#8b5cf6', '#ec4899', '#14b8a6', '#f97316', '#64748b',
]

function formatBIF(v: number) {
  return new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 0 }).format(v) + ' BIF'
}

export function ExpenseBreakdownChart({ data }: ExpenseBreakdownChartProps) {
  const filtered = data.filter(d => d.amount > 0)

  if (!filtered.length) {
    return (
      <div className="flex h-[280px] items-center justify-center text-muted-foreground text-sm">
        Aucune donnée disponible pour cette période
      </div>
    )
  }

  return (
    <ResponsiveContainer width="100%" height={280}>
      <PieChart>
        <Pie
          data={filtered}
          cx="50%"
          cy="50%"
          innerRadius={55}
          outerRadius={95}
          paddingAngle={2}
          dataKey="amount"
          nameKey="category"
        >
          {filtered.map((_, index) => (
            <Cell key={index} fill={COLORS[index % COLORS.length]} />
          ))}
        </Pie>
        <Tooltip
          formatter={(value, name) => [formatBIF(Number(value)), name]}
          contentStyle={{
            backgroundColor: 'var(--color-card)',
            border: '1px solid var(--color-border)',
            borderRadius: '8px',
            fontSize: '12px',
          }}
        />
        <Legend
          wrapperStyle={{ fontSize: '12px' }}
          formatter={(value) => value}
        />
      </PieChart>
    </ResponsiveContainer>
  )
}
