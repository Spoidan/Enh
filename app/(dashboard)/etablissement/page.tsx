import { requireAdmin } from '@/lib/auth'
import { getSchoolSettings } from '@/lib/actions/etablissement'
import { EtablissementForm } from './etablissement-form'

export default async function EtablissementPage() {
  await requireAdmin()
  const settings = await getSchoolSettings()

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Établissement</h2>
        <p className="text-muted-foreground">
          Informations de votre école et logo.
        </p>
      </div>
      <EtablissementForm settings={settings} />
    </div>
  )
}
