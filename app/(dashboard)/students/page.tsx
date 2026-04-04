import { getStudents } from '@/lib/actions/students'
import { getClasses } from '@/lib/actions/classes'
import { StudentsClient } from './students-client'

export default async function StudentsPage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string; classId?: string; page?: string }>
}) {
  const params = await searchParams
  const page = Number(params.page ?? 1)
  const [{ students, total, pages }, classes] = await Promise.all([
    getStudents({ search: params.search, classId: params.classId, page }),
    getClasses(),
  ])

  return (
    <StudentsClient
      students={students}
      classes={classes}
      total={total}
      pages={pages}
      currentPage={page}
    />
  )
}
