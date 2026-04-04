import { getPayments } from '@/lib/actions/payments'
import { PaymentsClient } from './payments-client'

export default async function PaymentsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>
}) {
  const { page: pageStr } = await searchParams
  const page = Number(pageStr ?? 1)
  const { payments, total, pages } = await getPayments({ page })

  return <PaymentsClient payments={payments} total={total} pages={pages} currentPage={page} />
}
