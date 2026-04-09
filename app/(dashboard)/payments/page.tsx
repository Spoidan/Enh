import { getPayments } from '@/lib/actions/payments'
import { PaymentsClient } from './payments-client'

export default async function PaymentsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; studentId?: string }>
}) {
  const { page: pageStr, studentId } = await searchParams
  const page = Number(pageStr ?? 1)
  const { payments, total, pages } = await getPayments({ page })

  return <PaymentsClient payments={payments} total={total} pages={pages} currentPage={page} preselectedStudentId={studentId} />
}
