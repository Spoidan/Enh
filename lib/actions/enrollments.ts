'use server'

import { db } from '@/lib/db'
import { requireAuth } from '@/lib/auth'
import { revalidatePath } from 'next/cache'

// Get active school year with its enrollments
export async function getActiveSchoolYear() {
  return db.schoolYear.findFirst({
    where: { isActive: true },
    include: { enrollments: true },
  })
}

// Get all school years (for dropdown selector)
export async function getSchoolYearsSimple() {
  return db.schoolYear.findMany({
    where: { isArchived: false },
    orderBy: { startDate: 'desc' },
    select: { id: true, name: true, isActive: true },
  })
}

// Get students enrolled in a specific school year (and optional class)
export async function getEnrolledStudents(params: {
  schoolYearId: string
  classId?: string
  search?: string
  status?: string // 'active' | 'inactive' | 'all'
  page?: number
  limit?: number
}) {
  await requireAuth()
  const { schoolYearId, classId, search, status = 'active', page = 1, limit = 20 } = params

  const enrollmentWhere = {
    schoolYearId,
    ...(classId && { classId }),
    ...(status !== 'all' && { status }),
  }

  const studentWhere = search
    ? {
        OR: [
          { name: { contains: search } },
          { rollNumber: { contains: search } },
          { parentName: { contains: search } },
        ],
      }
    : {}

  const [enrollments, total] = await Promise.all([
    db.studentEnrollment.findMany({
      where: {
        ...enrollmentWhere,
        student: studentWhere,
      },
      include: {
        student: { include: { class: true } },
        class: true,
        schoolYear: true,
      },
      orderBy: { student: { rollNumber: 'asc' } },
      skip: (page - 1) * limit,
      take: limit,
    }),
    db.studentEnrollment.count({
      where: {
        ...enrollmentWhere,
        student: studentWhere,
      },
    }),
  ])

  return {
    enrollments,
    total,
    pages: Math.ceil(total / limit),
  }
}

// Create an enrollment for a student in a school year
export async function createEnrollment(data: {
  studentId: string
  schoolYearId: string
  classId: string
}) {
  await requireAuth()
  const enrollment = await db.studentEnrollment.upsert({
    where: { studentId_schoolYearId: { studentId: data.studentId, schoolYearId: data.schoolYearId } },
    create: { ...data, status: 'active' },
    update: { classId: data.classId, status: 'active' },
  })
  revalidatePath('/students')
  return enrollment
}

// Update enrollment status (active/inactive) and optional reason
export async function updateEnrollmentStatus(data: {
  studentId: string
  schoolYearId: string
  status: 'active' | 'inactive'
  inactiveReason?: string
}) {
  await requireAuth()
  const enrollment = await db.studentEnrollment.update({
    where: { studentId_schoolYearId: { studentId: data.studentId, schoolYearId: data.schoolYearId } },
    data: {
      status: data.status,
      inactiveReason: data.status === 'inactive' ? (data.inactiveReason ?? null) : null,
    },
  })
  revalidatePath('/students')
  return enrollment
}

// Promote students: copy enrollments from source year/class to destination year/class
export async function promoteStudents(data: {
  sourceYearId: string
  sourceClassId: string
  destYearId: string
  destClassId: string
  studentIds: string[]
}) {
  await requireAuth()
  const { sourceYearId, sourceClassId, destYearId, destClassId, studentIds } = data

  if (studentIds.length === 0) return { promoted: 0 }

  // Verify students are enrolled in source year/class
  const sourceEnrollments = await db.studentEnrollment.findMany({
    where: {
      schoolYearId: sourceYearId,
      classId: sourceClassId,
      studentId: { in: studentIds },
    },
  })

  if (sourceEnrollments.length === 0) return { promoted: 0 }

  // Create new enrollments in destination year/class (upsert to avoid duplicates)
  let promoted = 0
  for (const enrollment of sourceEnrollments) {
    await db.studentEnrollment.upsert({
      where: {
        studentId_schoolYearId: {
          studentId: enrollment.studentId,
          schoolYearId: destYearId,
        },
      },
      create: {
        studentId: enrollment.studentId,
        schoolYearId: destYearId,
        classId: destClassId,
        status: 'active',
      },
      update: {
        classId: destClassId,
        status: 'active',
      },
    })
    // Also update the student's classId to the new class
    await db.student.update({
      where: { id: enrollment.studentId },
      data: { classId: destClassId },
    })
    promoted++
  }

  revalidatePath('/students')
  return { promoted }
}

// Migrate existing students to active school year (run once)
export async function migrateStudentsToActiveYear() {
  const activeYear = await db.schoolYear.findFirst({ where: { isActive: true } })
  if (!activeYear) return { migrated: 0 }

  const students = await db.student.findMany({ select: { id: true, classId: true } })
  let migrated = 0

  for (const student of students) {
    await db.studentEnrollment.upsert({
      where: { studentId_schoolYearId: { studentId: student.id, schoolYearId: activeYear.id } },
      create: {
        studentId: student.id,
        schoolYearId: activeYear.id,
        classId: student.classId,
        status: 'active',
      },
      update: {},
    })
    migrated++
  }

  return { migrated }
}

// Get students in a class/year for promotion UI
export async function getStudentsForPromotion(schoolYearId: string, classId: string) {
  await requireAuth()
  return db.studentEnrollment.findMany({
    where: { schoolYearId, classId },
    include: {
      student: true,
    },
    orderBy: { student: { name: 'asc' } },
  })
}
