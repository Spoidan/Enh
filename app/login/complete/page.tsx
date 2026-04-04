'use client'

import { useState, useTransition } from 'react'
import { School, User, Lock, Loader2, CheckCircle2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { completeAccountSetup } from '@/lib/actions/auth'

export default function CompleteAccountPage() {
  const [error, setError] = useState('')
  const [isPending, startTransition] = useTransition()

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError('')
    const fd = new FormData(e.currentTarget)
    const name = fd.get('name') as string
    const password = fd.get('password') as string
    const confirm = fd.get('confirm') as string

    if (password !== confirm) {
      setError('Les mots de passe ne correspondent pas.')
      return
    }
    if (password.length < 8) {
      setError('Le mot de passe doit contenir au moins 8 caractères.')
      return
    }

    startTransition(async () => {
      const result = await completeAccountSetup({ name, password })
      if (result?.error) setError(result.error)
    })
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="w-full max-w-sm space-y-8 px-4">
        {/* Brand */}
        <div className="flex flex-col items-center gap-3">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-lg">
            <School className="h-8 w-8" />
          </div>
          <div className="text-center">
            <h1 className="text-2xl font-bold">Configurer votre compte</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Bienvenue ! Créez votre nom d&apos;utilisateur et mot de passe.
            </p>
          </div>
        </div>

        {/* Steps info */}
        <div className="rounded-xl border bg-primary/5 border-primary/20 px-4 py-3 space-y-2">
          {[
            'Choisissez un nom à afficher',
            'Créez un mot de passe sécurisé',
            'Accédez au tableau de bord',
          ].map((step, i) => (
            <div key={i} className="flex items-center gap-2 text-sm">
              <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />
              <span>{step}</span>
            </div>
          ))}
        </div>

        {/* Form card */}
        <div className="rounded-2xl border bg-card shadow-xl p-6 space-y-5">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="name">Nom complet</Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="name"
                  name="name"
                  type="text"
                  placeholder="Jean Dupont"
                  className="pl-9"
                  required
                  autoFocus
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="password">Mot de passe</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="password"
                  name="password"
                  type="password"
                  placeholder="Minimum 8 caractères"
                  className="pl-9"
                  required
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="confirm">Confirmer le mot de passe</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="confirm"
                  name="confirm"
                  type="password"
                  placeholder="Répétez votre mot de passe"
                  className="pl-9"
                  required
                />
              </div>
            </div>

            {error && (
              <div className="rounded-lg bg-destructive/10 border border-destructive/20 px-3 py-2 text-sm text-destructive">
                {error}
              </div>
            )}

            <Button type="submit" className="w-full" disabled={isPending}>
              {isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                'Créer mon compte et accéder'
              )}
            </Button>
          </form>
        </div>
      </div>
    </div>
  )
}
