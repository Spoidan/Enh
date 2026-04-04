import { requireAdmin } from '@/lib/auth'
import { listINSSPayments } from '@/lib/actions/inss'
import { INSSClient } from './inss-client'

export default async function INSSPage() {
  await requireAdmin()
  const payments = await listINSSPayments()

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Paiements INSS</h2>
        <p className="text-muted-foreground">
          Suivi des cotisations INSS mensuelles avec justificatifs.
        </p>
      </div>
      <INSSClient payments={payments} />
    </div>
  )
}
