import { getSales } from '@/lib/actions/inventory'
import { SalesClient } from './sales-client'

export default async function SalesPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>
}) {
  const { page: pageStr } = await searchParams
  const page = Number(pageStr ?? 1)
  const { sales, total, pages } = await getSales({ page })

  return <SalesClient sales={sales} total={total} pages={pages} currentPage={page} />
}
