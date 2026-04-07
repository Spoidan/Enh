'use server'

import { db } from '@/lib/db'
import { requireAdmin } from '@/lib/auth'
import { revalidatePath } from 'next/cache'

export async function getSchoolYears() {
  return db.schoolYear.findMany({
    include: {
      terms: { orderBy: { startDate: 'asc' } },
      yearFeeStructures: { include: { class: true } },
      _count: true,
    },
    orderBy: { startDate: 'desc' },
  })
}

export async function createSchoolYear(data: {
  name: string
  startDate: string
  endDate: string
  isActive?: boolean
}) {
  await requireAdmin()

  if (data.isActive) {
    await db.schoolYear.updateMany({ data: { isActive: false } })
  }

  const year = await db.schoolYear.create({
    data: {
      name: data.name,
      startDate: new Date(data.startDate),
      endDate: new Date(data.endDate),
      isActive: data.isActive ?? false,
    },
  })

  revalidatePath('/school-years')
  return year
}

export async function setActiveSchoolYear(id: string) {
  await requireAdmin()
  await db.schoolYear.updateMany({ data: { isActive: false } })
  await db.schoolYear.update({ where: { id }, data: { isActive: true, isArchived: false } })
  revalidatePath('/school-years')
}

export async function archiveSchoolYear(id: string) {
  await requireAdmin()
  await db.schoolYear.update({ where: { id }, data: { isArchived: true, isActive: false } })
  revalidatePath('/school-years')
}

export async function deleteSchoolYear(id: string) {
  await requireAdmin()
  await db.schoolYear.delete({ where: { id } })
  revalidatePath('/school-years')
}

export async function createTerm(data: {
  schoolYearId: string
  name: string
  startDate: string
  endDate: string
  isActive?: boolean
}) {
  await requireAdmin()

  if (data.isActive) {
    await db.term.updateMany({
      where: { schoolYearId: data.schoolYearId },
      data: { isActive: false },
    })
  }

  const term = await db.term.create({
    data: {
      schoolYearId: data.schoolYearId,
      name: data.name,
      startDate: new Date(data.startDate),
      endDate: new Date(data.endDate),
      isActive: data.isActive ?? false,
    },
  })

  revalidatePath('/school-years')
  return term
}

export async function setActiveTerm(termId: string, schoolYearId: string) {
  await requireAdmin()
  await db.term.updateMany({ where: { schoolYearId }, data: { isActive: false } })
  await db.term.update({ where: { id: termId }, data: { isActive: true } })
  revalidatePath('/school-years')
}

export async function deleteTerm(id: string) {
  await requireAdmin()
  await db.term.delete({ where: { id } })
  revalidatePath('/school-years')
}

export async function getClasses() {
  return db.class.findMany({ orderBy: { name: 'asc' } })
}

export async function upsertYearFeeStructure(
  schoolYearId: string,
  classId: string,
  amount: number,
  description?: string,
  feeOptions?: {
    paymentFrequency?: string
    amountT1?: number
    amountT2?: number
    amountT3?: number
    specificTrimester?: number
  }
) {
  await requireAdmin()

  const freq = feeOptions?.paymentFrequency ?? 'annual_t1'

  // Compute canonical `amount` from frequency data
  let canonicalAmount = amount
  if (freq === 'per_trimester') {
    const t1 = feeOptions?.amountT1 ?? 0
    const t2 = feeOptions?.amountT2 ?? 0
    const t3 = feeOptions?.amountT3 ?? 0
    canonicalAmount = t1 + t2 + t3
  } else if (freq === 'specific_trimester') {
    canonicalAmount = amount
  }

  const data = {
    amount: canonicalAmount,
    description,
    paymentFrequency: freq,
    amountT1: feeOptions?.amountT1 ?? null,
    amountT2: feeOptions?.amountT2 ?? null,
    amountT3: feeOptions?.amountT3 ?? null,
    specificTrimester: feeOptions?.specificTrimester ?? null,
  }

  const result = await db.yearFeeStructure.upsert({
    where: { schoolYearId_classId: { schoolYearId, classId } },
    create: { schoolYearId, classId, ...data },
    update: data,
  })

  revalidatePath('/school-years')
  return result
}

export async function deleteYearFeeStructure(id: string) {
  await requireAdmin()
  await db.yearFeeStructure.delete({ where: { id } })
  revalidatePath('/school-years')
}
