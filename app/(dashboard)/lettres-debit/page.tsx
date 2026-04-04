import { requireAdmin } from '@/lib/auth'
import { listDebitLetters } from '@/lib/actions/lettres-debit'
import { LettresDebitClient } from './lettres-debit-client'

export default async function LettresDebitPage() {
  await requireAdmin()
  const letters = await listDebitLetters()

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">
          Lettres de Débit Salaires
        </h2>
        <p className="text-muted-foreground">
          Gérez les lettres de débit envoyées à la banque pour les salaires.
        </p>
      </div>
      <LettresDebitClient letters={letters} />
    </div>
  )
}
