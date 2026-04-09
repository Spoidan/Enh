import { getPayments } from '@/lib/actions/payments'
import { getStudent } from '@/lib/actions/students'
import { PaymentsClient } from './payments-client'

export default async function PaymentsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; studentId?: string }>
}) {
  const { page: pageStr, studentId } = await searchParams
  const page = Number(pageStr ?? 1)

  const [{ payments, total, pages }, student] = await Promise.all([
    getPayments({ page }),
    studentId ? getStudent(studentId) : null,
  ])

  const preselectedStudent = student
    ? { id: student.id, name: student.name, class: { name: student.class.name } }
    : null

  return (
    <PaymentsClient
      payments={payments}
      total={total}
      pages={pages}
      currentPage={page}
      preselectedStudentId={studentId}
      preselectedStudent={preselectedStudent}
    />
  )
}
