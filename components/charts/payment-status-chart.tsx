'use client'

import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts'

interface PaymentStatusChartProps {
  fullyPaid: number
  partial: number
  noPay: number
}

const COLORS = ['#22c55e', '#f59e0b', '#ef4444']

export function PaymentStatusChart({ fullyPaid, partial, noPay }: PaymentStatusChartProps) {
  const data = [
    { name: 'Fully Paid', value: fullyPaid },
    { name: 'Partial', value: partial },
    { name: 'Pending', value: noPay },
  ].filter(d => d.value > 0)

  if (!data.length) {
    return (
      <div className="flex h-[250px] items-center justify-center text-muted-foreground text-sm">
        No student data yet
      </div>
    )
  }

  return (
    <ResponsiveContainer width="100%" height={250}>
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          innerRadius={60}
          outerRadius={95}
          paddingAngle={3}
          dataKey="value"
        >
          {data.map((_, index) => (
            <Cell key={index} fill={COLORS[index % COLORS.length]} />
          ))}
        </Pie>
        <Tooltip
          contentStyle={{
            backgroundColor: 'var(--color-card)',
            border: '1px solid var(--color-border)',
            borderRadius: '8px',
            fontSize: '13px',
          }}
        />
        <Legend wrapperStyle={{ fontSize: '13px' }} />
      </PieChart>
    </ResponsiveContainer>
  )
}
