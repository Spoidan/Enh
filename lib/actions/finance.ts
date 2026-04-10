'use server'

import { db } from '@/lib/db'
import { revalidatePath } from 'next/cache'

export async function getDeposits(params?: { page?: number; limit?: number }) {
  const { page = 1, limit = 15 } = params ?? {}
  const [deposits, total] = await Promise.all([
    db.deposit.findMany({
      orderBy: { date: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
    db.deposit.count(),
  ])
  return { deposits, total, pages: Math.ceil(total / limit) }
}

export async function createDeposit(data: {
  date: string
  amount: number
  source: string
  bankName?: string
  reference?: string
  notes?: string
}) {
  const deposit = await db.deposit.create({
    data: { ...data, amount: Number(data.amount), date: new Date(data.date) },
  })
  revalidatePath('/finance')
  return deposit
}

export async function deleteDeposit(id: string) {
  await db.deposit.delete({ where: { id } })
  revalidatePath('/finance')
}

export async function getExpenses(params?: {
  page?: number
  limit?: number
  startDate?: string
  endDate?: string
}) {
  const { page = 1, limit = 15 } = params ?? {}
  const dateFilter = params?.startDate && params?.endDate
    ? { date: { gte: new Date(params.startDate), lte: new Date(params.endDate) } }
    : undefined
  const [expenses, total] = await Promise.all([
    db.expense.findMany({
      where: dateFilter,
      orderBy: { date: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
    db.expense.count({ where: dateFilter }),
  ])
  return { expenses, total, pages: Math.ceil(total / limit) }
}

export async function createExpense(data: {
  date: string
  amount: number
  category: string
  description?: string
  payee?: string
  reference?: string
}) {
  const expense = await db.expense.create({
    data: { ...data, amount: Number(data.amount), date: new Date(data.date) },
  })
  revalidatePath('/finance')
  return expense
}

export async function deleteExpense(id: string) {
  await db.expense.delete({ where: { id } })
  revalidatePath('/finance')
}

export async function getFinancialSummary() {
  const [payments, deposits, expenses, sales] = await Promise.all([
    db.payment.aggregate({ _sum: { amount: true } }),
    db.deposit.aggregate({ _sum: { amount: true } }),
    db.expense.aggregate({ _sum: { amount: true } }),
    db.sale.aggregate({ _sum: { amount: true } }),
  ])

  const totalPayments = payments._sum.amount ?? 0
  const totalDeposits = deposits._sum.amount ?? 0
  const totalSales = sales._sum.amount ?? 0
  const totalIncome = totalPayments + totalDeposits + totalSales
  const totalExpenses = expenses._sum.amount ?? 0
  const netBalance = totalIncome - totalExpenses

  return { totalPayments, totalDeposits, totalSales, totalIncome, totalExpenses, netBalance }
}

export async function getRevenueChartData(days = 30) {
  const startDate = new Date()
  startDate.setDate(startDate.getDate() - days)

  const [payments, sales, expenses] = await Promise.all([
    db.payment.findMany({ where: { date: { gte: startDate } }, select: { amount: true, date: true } }),
    db.sale.findMany({ where: { date: { gte: startDate } }, select: { amount: true, date: true } }),
    db.expense.findMany({ where: { date: { gte: startDate } }, select: { amount: true, date: true } }),
  ])

  const byDate = new Map<string, { income: number; expenses: number }>()
  const addDate = (d: Date, income: number, expense: number) => {
    const key = d.toISOString().split('T')[0]
    const cur = byDate.get(key) ?? { income: 0, expenses: 0 }
    byDate.set(key, { income: cur.income + income, expenses: cur.expenses + expense })
  }

  payments.forEach(p => addDate(p.date, p.amount, 0))
  sales.forEach(s => addDate(s.date, s.amount, 0))
  expenses.forEach(e => addDate(e.date, 0, e.amount))

  return Array.from(byDate.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, vals]) => ({ date, ...vals }))
}

export async function getFeeStructures(classId?: string) {
  return db.feeStructure.findMany({
    where: classId ? { classId } : undefined,
    include: { class: true },
    orderBy: { createdAt: 'desc' },
  })
}

export async function createFeeStructure(data: {
  classId: string
  name: string
  amount: number
  period?: string
  description?: string
}) {
  const fee = await db.feeStructure.create({
    data: { ...data, amount: Number(data.amount) },
  })
  revalidatePath('/finance')
  revalidatePath('/classes')
  return fee
}

export async function deleteFeeStructure(id: string) {
  await db.feeStructure.delete({ where: { id } })
  revalidatePath('/finance')
  revalidatePath('/classes')
}

const MONTHS_FR = [
  'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
  'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre',
]

export async function getMonthlyChartData(startDate: Date, endDate: Date) {
  const [payments, sales, deposits, expenses] = await Promise.all([
    db.payment.findMany({ where: { date: { gte: startDate, lte: endDate } }, select: { amount: true, date: true } }),
    db.sale.findMany({ where: { date: { gte: startDate, lte: endDate } }, select: { amount: true, date: true } }),
    db.deposit.findMany({ where: { date: { gte: startDate, lte: endDate } }, select: { amount: true, date: true } }),
    db.expense.findMany({ where: { date: { gte: startDate, lte: endDate } }, select: { amount: true, date: true } }),
  ])

  type MonthEntry = { income: number; expenses: number; order: number }
  const byMonth = new Map<string, MonthEntry>()

  // Pre-populate all months in range
  const cursor = new Date(startDate)
  cursor.setDate(1)
  while (cursor <= endDate) {
    const key = `${cursor.getFullYear()}-${String(cursor.getMonth() + 1).padStart(2, '0')}`
    if (!byMonth.has(key)) {
      byMonth.set(key, { income: 0, expenses: 0, order: cursor.getFullYear() * 12 + cursor.getMonth() })
    }
    cursor.setMonth(cursor.getMonth() + 1)
  }

  const add = (date: Date, income: number, expense: number) => {
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
    const cur = byMonth.get(key)
    if (cur) byMonth.set(key, { ...cur, income: cur.income + income, expenses: cur.expenses + expense })
  }

  payments.forEach(p => add(p.date, p.amount, 0))
  sales.forEach(s => add(s.date, s.amount, 0))
  deposits.forEach(d => add(d.date, d.amount, 0))
  expenses.forEach(e => add(e.date, 0, e.amount))

  return Array.from(byMonth.entries())
    .sort(([, a], [, b]) => a.order - b.order)
    .map(([key, vals]) => {
      const month = parseInt(key.split('-')[1], 10)
      return { month: MONTHS_FR[month - 1], income: vals.income, expenses: vals.expenses }
    })
}

export async function getExpenseBreakdown(startDate?: Date, endDate?: Date) {
  const where = startDate && endDate ? { date: { gte: startDate, lte: endDate } } : undefined
  const expenses = await db.expense.findMany({
    where,
    select: { category: true, amount: true },
  })

  const byCategory = new Map<string, number>()
  for (const e of expenses) {
    byCategory.set(e.category, (byCategory.get(e.category) ?? 0) + e.amount)
  }

  return Array.from(byCategory.entries())
    .map(([category, amount]) => ({ category, amount }))
    .sort((a, b) => b.amount - a.amount)
}
