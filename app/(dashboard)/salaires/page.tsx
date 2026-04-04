import { requireAdmin } from '@/lib/auth'
import { listStaff, listSalaryPayments } from '@/lib/actions/salaires'
import { SalairesClient } from './salaires-client'

export default async function SalairesPage() {
  await requireAdmin()

  const [staff, payments] = await Promise.all([
    listStaff(),
    listSalaryPayments(),
  ])

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">
          Gestion des Salaires
        </h2>
        <p className="text-muted-foreground">
          Gérez le personnel et les paiements de salaires.
        </p>
      </div>
      <SalairesClient staff={staff} payments={payments} />
    </div>
  )
}
