'use server'

import { db } from '@/lib/db'

export async function getClassesForOverview() {
  return db.class.findMany({
    orderBy: { name: 'asc' },
    select: { id: true, name: true, gradeLevel: true, section: true },
  })
}

export type ExtraFeeSummary = {
  id: string
  description: string
  amount: number
}

export type StudentPaymentSummary = {
  id: string
  name: string
  rollNumber: string
  baseFee: number
  extraFees: ExtraFeeSummary[]
  totalExtraFees: number
  totalExpected: number
  totalPaid: number
  balance: number
  status: 'paid' | 'partial' | 'unpaid'
}

export type ClassPaymentOverview = {
  students: StudentPaymentSummary[]
  summary: {
    totalExpected: number
    totalCollected: number
    totalOutstanding: number
    countPaid: number
    countPartial: number
    countUnpaid: number
  }
}

export async function getClassPaymentOverview(
  classId: string
): Promise<ClassPaymentOverview> {
  // Try to get year fee structure for active school year first
  const activeYear = await db.schoolYear.findFirst({
    where: { isActive: true },
    include: {
      yearFeeStructures: { where: { classId } },
    },
  })

  const students = await db.student.findMany({
    where: { classId, isActive: true },
    include: {
      payments: true,
      extraFees: { orderBy: { createdAt: 'asc' } },
      class: {
        include: {
          feeStructures: { where: { isActive: true } },
        },
      },
    },
    orderBy: { name: 'asc' },
  })

  const studentsWithSummary: StudentPaymentSummary[] = students.map(student => {
    // Use year fee structure if available, otherwise fall back to class fee structures
    let baseFee: number
    const yearFee = activeYear?.yearFeeStructures.find(f => f.classId === classId)
    if (yearFee) {
      baseFee = yearFee.amount
    } else {
      baseFee = student.class.feeStructures.reduce((sum, f) => sum + f.amount, 0)
    }

    const extraFeeItems: ExtraFeeSummary[] = student.extraFees.map(ef => ({
      id: ef.id,
      description: ef.description,
      amount: ef.amount,
    }))
    const totalExtraFees = extraFeeItems.reduce((s, ef) => s + ef.amount, 0)
    const totalExpected = baseFee + totalExtraFees

    const totalPaid = student.payments.reduce((sum, p) => sum + p.amount, 0)
    const balance = totalExpected - totalPaid

    let status: 'paid' | 'partial' | 'unpaid'
    if (totalPaid === 0) status = 'unpaid'
    else if (totalPaid >= totalExpected) status = 'paid'
    else status = 'partial'

    return {
      id: student.id,
      name: student.name,
      rollNumber: student.rollNumber,
      baseFee,
      extraFees: extraFeeItems,
      totalExtraFees,
      totalExpected,
      totalPaid,
      balance,
      status,
    }
  })

  const summary = {
    totalExpected: studentsWithSummary.reduce((s, st) => s + st.totalExpected, 0),
    totalCollected: studentsWithSummary.reduce((s, st) => s + st.totalPaid, 0),
    totalOutstanding: studentsWithSummary.reduce((s, st) => s + Math.max(0, st.balance), 0),
    countPaid: studentsWithSummary.filter(s => s.status === 'paid').length,
    countPartial: studentsWithSummary.filter(s => s.status === 'partial').length,
    countUnpaid: studentsWithSummary.filter(s => s.status === 'unpaid').length,
  }

  return { students: studentsWithSummary, summary }
}
