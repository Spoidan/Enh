'use client'

import { useState, useTransition } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { LogoUpload } from '@/components/ui/logo-upload'
import { upsertSchoolSettings } from '@/lib/actions/etablissement'
import { toast } from 'sonner'
import { Loader2, Save } from 'lucide-react'

interface Settings {
  schoolName: string
  address?: string | null
  phone?: string | null
  email?: string | null
  directorName?: string | null
  logoUrl?: string | null
}

export function EtablissementForm({ settings }: { settings: Settings | null }) {
  const [logoUrl, setLogoUrl] = useState(settings?.logoUrl ?? '')
  const [pending, startTransition] = useTransition()

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    // Inject the base64 logo (or empty string to clear)
    fd.set('logoUrl', logoUrl)

    startTransition(async () => {
      const result = await upsertSchoolSettings(fd)
      if (result && 'error' in result) {
        toast.error(result.error)
      } else {
        toast.success('Informations enregistrées avec succès')
      }
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl">
      <Card>
        <CardHeader>
          <CardTitle>Logo de l&apos;établissement</CardTitle>
        </CardHeader>
        <CardContent>
          <LogoUpload
            value={logoUrl}
            onChange={base64 => setLogoUrl(base64)}
            onClear={() => setLogoUrl('')}
          />
          {logoUrl && (
            <p className="mt-2 text-xs text-muted-foreground">
              Le logo sera sauvegardé lorsque vous cliquerez sur &quot;Enregistrer&quot;.
            </p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Informations de l&apos;établissement</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2 space-y-1.5">
            <Label htmlFor="schoolName">Nom de l&apos;établissement *</Label>
            <Input
              id="schoolName"
              name="schoolName"
              defaultValue={settings?.schoolName ?? ''}
              required
              placeholder="École Primaire ..."
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="directorName">Nom du directeur</Label>
            <Input
              id="directorName"
              name="directorName"
              defaultValue={settings?.directorName ?? ''}
              placeholder="M. / Mme ..."
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="phone">Téléphone</Label>
            <Input
              id="phone"
              name="phone"
              defaultValue={settings?.phone ?? ''}
              placeholder="+257 ..."
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              name="email"
              type="email"
              defaultValue={settings?.email ?? ''}
              placeholder="ecole@example.com"
            />
          </div>

          <div className="sm:col-span-2 space-y-1.5">
            <Label htmlFor="address">Adresse</Label>
            <Input
              id="address"
              name="address"
              defaultValue={settings?.address ?? ''}
              placeholder="Quartier, Avenue, Commune ..."
            />
          </div>
        </CardContent>
      </Card>

      <Button type="submit" disabled={pending} className="gap-2">
        {pending ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Save className="h-4 w-4" />
        )}
        Enregistrer
      </Button>
    </form>
  )
}
