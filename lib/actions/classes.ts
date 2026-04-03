'use server'

import { db } from '@/lib/db'
import { revalidatePath } from 'next/cache'

export async function getClasses() {
  return db.class.findMany({
    include: { _count: { select: { students: true } } },
    orderBy: { name: 'asc' },
  })
}

export async function getClass(id: string) {
  return db.class.findUnique({
    where: { id },
    include: {
      students: { orderBy: { rollNumber: 'asc' } },
      feeStructures: true,
      _count: { select: { students: true } },
    },
  })
}

export async function createClass(data: {
  name: string
  section?: string
  gradeLevel?: string
  capacity?: number
}) {
  const cls = await db.class.create({ data })
  revalidatePath('/classes')
  return cls
}

export async function updateClass(id: string, data: {
  name?: string
  section?: string
  gradeLevel?: string
  capacity?: number
}) {
  const cls = await db.class.update({ where: { id }, data })
  revalidatePath('/classes')
  revalidatePath(`/classes/${id}`)
  return cls
}

export async function deleteClass(id: string) {
  await db.class.delete({ where: { id } })
  revalidatePath('/classes')
}
