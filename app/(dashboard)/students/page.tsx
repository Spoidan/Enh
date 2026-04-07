import { getStudents } from '@/lib/actions/students'
import { getClasses } from '@/lib/actions/classes'
import { getSchoolYearsSimple } from '@/lib/actions/enrollments'
import { db } from '@/lib/db'
import { StudentsClient } from './students-client'

export default async function StudentsPage({
  searchParams,
}: {
  searchParams: Promise<{
    search?: string
    classId?: string
    page?: string
    yearId?: string
    status?: string
  }>
}) {
  const params = await searchParams
  const page = Number(params.page ?? 1)

  // Determine active year if none specified
  let yearId = params.yearId
  if (!yearId) {
    const active = await db.schoolYear.findFirst({ where: { isActive: true } })
    yearId = active?.id
  }

  const [{ students, total, pages }, classes, schoolYears] = await Promise.all([
    getStudents({
      search: params.search,
      classId: params.classId,
      page,
      schoolYearId: yearId,
      status: params.status ?? 'active',
    }),
    getClasses(),
    getSchoolYearsSimple(),
  ])

  return (
    <StudentsClient
      students={students as Parameters<typeof StudentsClient>[0]['students']}
      classes={classes}
      total={total}
      pages={pages}
      currentPage={page}
      schoolYears={schoolYears}
      activeYearId={yearId ?? null}
    />
  )
}
