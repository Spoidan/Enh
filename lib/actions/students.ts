'use server'

import { db } from '@/lib/db'
import { revalidatePath } from 'next/cache'

export async function getStudents(params?: {
  classId?: string
  search?: string
  page?: number
  limit?: number
  schoolYearId?: string
  status?: string // 'active' | 'inactive' | 'all'
}) {
  const { classId, search, page = 1, limit = 20, schoolYearId, status = 'active' } = params ?? {}

  // If schoolYearId provided, query through enrollments
  if (schoolYearId) {
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
        where: { ...enrollmentWhere, student: studentWhere },
        include: {
          student: { include: { class: true } },
          class: true,
        },
        orderBy: { student: { rollNumber: 'asc' } },
        skip: (page - 1) * limit,
        take: limit,
      }),
      db.studentEnrollment.count({
        where: { ...enrollmentWhere, student: studentWhere },
      }),
    ])

    // Return students shaped like old API but with enrollment info
    const students = enrollments.map(e => ({
      ...e.student,
      classId: e.classId,
      class: e.class,
      enrollmentStatus: e.status,
      inactiveReason: e.inactiveReason,
      enrollmentId: e.id,
    }))

    return { students, total, pages: Math.ceil(total / limit) }
  }

  // Legacy fallback without school year filter
  const where = {
    ...(classId && { classId }),
    ...(search && {
      OR: [
        { name: { contains: search } },
        { rollNumber: { contains: search } },
        { parentName: { contains: search } },
      ],
    }),
    ...(status !== 'all' && { isActive: status === 'active' }),
  }

  const [students, total] = await Promise.all([
    db.student.findMany({
      where,
      include: { class: true },
      orderBy: { rollNumber: 'asc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
    db.student.count({ where }),
  ])

  return { students, total, pages: Math.ceil(total / limit) }
}

export async function getStudentsForDropdown() {
  return db.student.findMany({
    select: { id: true, name: true, class: { select: { name: true } } },
    orderBy: { name: 'asc' },
  })
}

export async function getStudent(id: string) {
  return db.student.findUnique({
    where: { id },
    include: {
      class: { include: { feeStructures: true } },
      payments: { orderBy: { date: 'desc' } },
      sales: { include: { item: true }, orderBy: { date: 'desc' } },
      enrollments: {
        include: { schoolYear: true, class: true },
        orderBy: { createdAt: 'desc' },
      },
    },
  })
}

export async function createStudent(data: {
  name: string
  rollNumber?: string
  classId: string
  parentName?: string
  parentPhone?: string
  parentEmail?: string
  address?: string
  gender?: string
  dateOfBirth?: string
}) {
  const student = await db.student.create({
    data: {
      ...data,
      dateOfBirth: data.dateOfBirth ? new Date(data.dateOfBirth) : undefined,
    },
  })

  // Auto-enroll in active school year
  const activeYear = await db.schoolYear.findFirst({ where: { isActive: true } })
  if (activeYear) {
    await db.studentEnrollment.create({
      data: {
        studentId: student.id,
        schoolYearId: activeYear.id,
        classId: data.classId,
        status: 'active',
      },
    })
  }

  revalidatePath('/students')
  return student
}

export async function updateStudent(id: string, data: {
  name?: string
  rollNumber?: string
  classId?: string
  parentName?: string
  parentPhone?: string
  parentEmail?: string
  address?: string
  gender?: string
  dateOfBirth?: string
  isActive?: boolean
}) {
  const student = await db.student.update({
    where: { id },
    data: {
      ...data,
      dateOfBirth: data.dateOfBirth ? new Date(data.dateOfBirth) : undefined,
    },
  })
  revalidatePath('/students')
  revalidatePath(`/students/${id}`)
  return student
}

export async function deleteStudent(id: string) {
  await db.student.delete({ where: { id } })
  revalidatePath('/students')
}

export async function bulkCreateStudents(students: {
  name: string
  rollNumber: string
  classId: string
  parentName?: string
  parentPhone?: string
}[]) {
  const result = await db.student.createMany({ data: students })

  // Auto-enroll bulk students in active school year
  const activeYear = await db.schoolYear.findFirst({ where: { isActive: true } })
  if (activeYear) {
    const created = await db.student.findMany({
      where: { rollNumber: { in: students.map(s => s.rollNumber) } },
      select: { id: true, classId: true },
    })
    for (const s of created) {
      await db.studentEnrollment.upsert({
        where: { studentId_schoolYearId: { studentId: s.id, schoolYearId: activeYear.id } },
        create: { studentId: s.id, schoolYearId: activeYear.id, classId: s.classId, status: 'active' },
        update: {},
      })
    }
  }

  revalidatePath('/students')
  return result
}
