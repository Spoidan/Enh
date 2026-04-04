import { requireAdmin } from '@/lib/auth'
import { listMutuellePayments } from '@/lib/actions/mutuelle'
import { MutuelleClient } from './mutuelle-client'

export default async function MutuellePage() {
  await requireAdmin()
  const payments = await listMutuellePayments()

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">
          Paiements Mutuelle
        </h2>
        <p className="text-muted-foreground">
          Suivi des cotisations mutuelle de santé mensuelles.
        </p>
      </div>
      <MutuelleClient payments={payments} />
    </div>
  )
}
