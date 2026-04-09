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
  trimester: number | null
}

export type DiscountSummary = {
  id: string
  description: string
  amount: number
  trimester: number | null
}

export type StudentPaymentSummary = {
  id: string
  name: string
  rollNumber: string
  baseFee: number
  extraFees: ExtraFeeSummary[]
  totalExtraFees: number
  discounts: DiscountSummary[]
  totalDiscounts: number
  totalExpected: number
  totalPaid: number
  balance: number
  status: 'paid' | 'partial' | 'unpaid'
  enrollmentStatus: string
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
  feeStructure: {
    paymentFrequency: string
    amountT1: number | null
    amountT2: number | null
    amountT3: number | null
    specificTrimester: number | null
  } | null
}

/**
 * Compute expected fee for a trimester from the fee structure.
 * trimester=0 means "all year" (no trimester filter).
 */
function computeExpectedFee(
  yearFee: {
    amount: number
    paymentFrequency: string
    amountT1: number | null
    amountT2: number | null
    amountT3: number | null
    specificTrimester: number | null
  } | null,
  fallbackFee: number,
  trimester: number // 0=all, 1, 2, 3
): number {
  if (!yearFee) return fallbackFee

  const freq = yearFee.paymentFrequency

  if (trimester === 0) {
    // Full year total
    return yearFee.amount
  }

  if (freq === 'annual_t1') {
    return trimester === 1 ? yearFee.amount : 0
  }

  if (freq === 'per_trimester') {
    if (trimester === 1) return yearFee.amountT1 ?? 0
    if (trimester === 2) return yearFee.amountT2 ?? 0
    if (trimester === 3) return yearFee.amountT3 ?? 0
    return 0
  }

  if (freq === 'specific_trimester') {
    return trimester === yearFee.specificTrimester ? yearFee.amount : 0
  }

  return yearFee.amount
}

export async function getClassPaymentOverview(
  classId: string,
  options?: {
    schoolYearId?: string
    trimester?: number // 0=all, 1, 2, 3
  }
): Promise<ClassPaymentOverview> {
  const trimester = options?.trimester ?? 0

  // Get the target school year (specified or active)
  const schoolYear = options?.schoolYearId
    ? await db.schoolYear.findUnique({
        where: { id: options.schoolYearId },
        include: { yearFeeStructures: { where: { classId } } },
      })
    : await db.schoolYear.findFirst({
        where: { isActive: true },
        include: { yearFeeStructures: { where: { classId } } },
      })

  const yearFee = schoolYear?.yearFeeStructures[0] ?? null

  // Get students enrolled in this class for the school year
  let students
  if (schoolYear) {
    const enrollments = await db.studentEnrollment.findMany({
      where: { schoolYearId: schoolYear.id, classId, status: 'active' },
      include: {
        student: {
          include: {
            payments: true,
            extraFees: { orderBy: { createdAt: 'asc' } },
            discounts: { orderBy: { createdAt: 'asc' } },
            class: { include: { feeStructures: { where: { isActive: true } } } },
          },
        },
      },
      orderBy: { student: { name: 'asc' } },
    })
    students = enrollments.map(e => ({ ...e.student, enrollmentStatus: e.status }))
  } else {
    // Fallback: no school year — show all active students in class
    const rawStudents = await db.student.findMany({
      where: { classId, isActive: true },
      include: {
        payments: true,
        extraFees: { orderBy: { createdAt: 'asc' } },
        discounts: { orderBy: { createdAt: 'asc' } },
        class: { include: { feeStructures: { where: { isActive: true } } } },
      },
      orderBy: { name: 'asc' },
    })
    students = rawStudents.map(s => ({ ...s, enrollmentStatus: 'active' }))
  }

  const fallbackFee = students[0]?.class.feeStructures.reduce((s, f) => s + f.amount, 0) ?? 0

  const studentsWithSummary: StudentPaymentSummary[] = students.map(student => {
    const baseFee = computeExpectedFee(yearFee, fallbackFee, trimester)

    // Filter extra fees by trimester
    const extraFeeItems: ExtraFeeSummary[] = student.extraFees
      .filter(ef => {
        if (trimester === 0) return true
        if (ef.trimester === null) return true // applies to all trimesters
        return ef.trimester === trimester
      })
      .map(ef => ({
        id: ef.id,
        description: ef.description,
        amount: ef.amount,
        trimester: ef.trimester ?? null,
      }))

    const totalExtraFees = extraFeeItems.reduce((s, ef) => s + ef.amount, 0)

    // Filter discounts by trimester
    const discountItems: DiscountSummary[] = student.discounts
      .filter(d => {
        if (trimester === 0) return true
        if (d.trimester === null) return true
        return d.trimester === trimester
      })
      .map(d => ({
        id: d.id,
        description: d.description,
        amount: d.amount,
        trimester: d.trimester ?? null,
      }))

    const totalDiscounts = discountItems.reduce((s, d) => s + d.amount, 0)
    const totalExpected = Math.max(0, baseFee + totalExtraFees - totalDiscounts)
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
      discounts: discountItems,
      totalDiscounts,
      totalExpected,
      totalPaid,
      balance,
      status,
      enrollmentStatus: student.enrollmentStatus,
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

  const feeStructure = yearFee
    ? {
        paymentFrequency: yearFee.paymentFrequency,
        amountT1: yearFee.amountT1,
        amountT2: yearFee.amountT2,
        amountT3: yearFee.amountT3,
        specificTrimester: yearFee.specificTrimester,
      }
    : null

  return { students: studentsWithSummary, summary, feeStructure }
}
