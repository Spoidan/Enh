'use server'

import { db } from '@/lib/db'
import { revalidatePath } from 'next/cache'

export async function getStudents(params?: {
  classId?: string
  search?: string
  page?: number
  limit?: number
}) {
  const { classId, search, page = 1, limit = 20 } = params ?? {}
  const where = {
    ...(classId && { classId }),
    ...(search && {
      OR: [
        { name: { contains: search } },
        { rollNumber: { contains: search } },
        { parentName: { contains: search } },
      ],
    }),
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

export async function getStudent(id: string) {
  return db.student.findUnique({
    where: { id },
    include: {
      class: { include: { feeStructures: true } },
      payments: { orderBy: { date: 'desc' } },
      sales: { include: { item: true }, orderBy: { date: 'desc' } },
    },
  })
}

export async function createStudent(data: {
  name: string
  rollNumber: string
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
  revalidatePath('/students')
  return result
}
