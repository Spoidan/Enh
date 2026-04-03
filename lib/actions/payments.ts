'use server'

import { db } from '@/lib/db'
import { revalidatePath } from 'next/cache'

export async function getPayments(params?: {
  studentId?: string
  page?: number
  limit?: number
}) {
  const { studentId, page = 1, limit = 20 } = params ?? {}
  const where = studentId ? { studentId } : {}

  const [payments, total] = await Promise.all([
    db.payment.findMany({
      where,
      include: { student: { include: { class: true } } },
      orderBy: { date: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
    db.payment.count({ where }),
  ])

  return { payments, total, pages: Math.ceil(total / limit) }
}

export async function createPayment(data: {
  studentId: string
  amount: number
  date: string
  method?: string
  reference?: string
  notes?: string
  month?: number
  year?: number
}) {
  const payment = await db.payment.create({
    data: {
      ...data,
      amount: Number(data.amount),
      date: new Date(data.date),
      month: data.month ? Number(data.month) : undefined,
      year: data.year ? Number(data.year) : undefined,
    },
  })
  revalidatePath('/payments')
  revalidatePath(`/students/${data.studentId}`)
  return payment
}

export async function deletePayment(id: string, studentId: string) {
  await db.payment.delete({ where: { id } })
  revalidatePath('/payments')
  revalidatePath(`/students/${studentId}`)
}

export async function getStudentFinancialSummary(studentId: string) {
  const student = await db.student.findUnique({
    where: { id: studentId },
    include: {
      class: { include: { feeStructures: true } },
      payments: true,
    },
  })

  if (!student) return null

  const totalDue = student.class.feeStructures
    .filter(f => f.isActive)
    .reduce((sum, f) => sum + f.amount, 0)
  const totalPaid = student.payments.reduce((sum, p) => sum + p.amount, 0)
  const balance = totalDue - totalPaid

  return { totalDue, totalPaid, balance, student }
}

export async function getPaymentStats() {
  const now = new Date()
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)

  const [recentPayments, allStudents] = await Promise.all([
    db.payment.findMany({
      where: { date: { gte: thirtyDaysAgo } },
      include: { student: { include: { class: { include: { feeStructures: true } } } } },
    }),
    db.student.findMany({
      include: {
        class: { include: { feeStructures: true } },
        payments: true,
      },
    }),
  ])

  let fullyPaid = 0, partial = 0, noPay = 0
  for (const s of allStudents) {
    const due = s.class.feeStructures.filter(f => f.isActive).reduce((a, f) => a + f.amount, 0)
    const paid = s.payments.reduce((a, p) => a + p.amount, 0)
    if (paid === 0) noPay++
    else if (paid >= due) fullyPaid++
    else partial++
  }

  return { recentPayments, fullyPaid, partial, noPay }
}
