'use server'

import { db } from '@/lib/db'
import { revalidatePath } from 'next/cache'

export async function getDeposits(params?: { page?: number; limit?: number }) {
  const { page = 1, limit = 20 } = params ?? {}
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

export async function getExpenses(params?: { page?: number; limit?: number }) {
  const { page = 1, limit = 20 } = params ?? {}
  const [expenses, total] = await Promise.all([
    db.expense.findMany({
      orderBy: { date: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
    db.expense.count(),
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
