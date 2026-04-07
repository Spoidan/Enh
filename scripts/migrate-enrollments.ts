/**
 * One-time migration script: enroll all existing students into the active school year.
 * Run after applying the prisma migration:
 *   npx tsx scripts/migrate-enrollments.ts
 */

import { PrismaClient } from '../app/generated/prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL!,
  ssl: { rejectUnauthorized: false },
})
const db = new PrismaClient({ adapter })

async function main() {
  const activeYear = await db.schoolYear.findFirst({ where: { isActive: true } })
  if (!activeYear) {
    console.log('No active school year found. Create one first.')
    process.exit(1)
  }

  console.log(`Migrating students to school year: ${activeYear.name}`)

  const students = await db.student.findMany({ select: { id: true, classId: true, name: true } })
  console.log(`Found ${students.length} students.`)

  let created = 0
  let skipped = 0

  for (const student of students) {
    const existing = await db.studentEnrollment.findUnique({
      where: { studentId_schoolYearId: { studentId: student.id, schoolYearId: activeYear.id } },
    })
    if (existing) {
      skipped++
      continue
    }
    await db.studentEnrollment.create({
      data: {
        studentId: student.id,
        schoolYearId: activeYear.id,
        classId: student.classId,
        status: 'active',
      },
    })
    created++
  }

  console.log(`Done! Created: ${created}, Skipped (already enrolled): ${skipped}`)
}

main()
  .catch(e => { console.error(e); process.exit(1) })
  .finally(() => db.$disconnect())
