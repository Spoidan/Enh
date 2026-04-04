'use client'

import { useState, useTransition, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { School, Mail, Lock, ArrowRight, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { checkEmail, loginWithPassword } from '@/lib/actions/auth'
import { getSchoolSettings } from '@/lib/actions/etablissement'
import Image from 'next/image'

function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [step, setStep] = useState<'email' | 'password'>('email')
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')
  const [isPending, startTransition] = useTransition()
  const [schoolName, setSchoolName] = useState('Gestion Scolaire')
  const [logoUrl, setLogoUrl] = useState<string | null>(null)

  const isExpired = searchParams.get('expired') === '1'

  useEffect(() => {
    getSchoolSettings().then(s => {
      if (s?.schoolName) setSchoolName(s.schoolName)
      if (s?.logoUrl) setLogoUrl(s.logoUrl)
    })
  }, [])

  const handleEmailSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!email.trim()) return
    setError('')

    startTransition(async () => {
      const result = await checkEmail(email)
      if (result.status === 'not_found') {
        setError(
          "Vous n'êtes pas autorisé à accéder à cette plateforme. Veuillez contacter l'administrateur."
        )
      } else if (result.status === 'inactive') {
        setError('Votre compte a été désactivé. Veuillez contacter l\'administrateur.')
      } else if (result.status === 'needs_setup') {
        router.push('/login/complete')
      } else {
        setStep('password')
      }
    })
  }

  const handlePasswordSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError('')
    const fd = new FormData(e.currentTarget)
    const password = fd.get('password') as string

    startTransition(async () => {
      const result = await loginWithPassword(email, password)
      if (result?.error) setError(result.error)
    })
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm space-y-8">
        {/* Brand */}
        <div className="flex flex-col items-center gap-3">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-lg overflow-hidden">
            {logoUrl ? (
              <Image
                src={logoUrl}
                alt="Logo"
                width={56}
                height={56}
                className="h-full w-full object-cover"
                unoptimized
              />
            ) : (
              <School className="h-8 w-8" />
            )}
          </div>
          <div className="text-center">
            <h1 className="text-2xl font-bold">{schoolName}</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Connectez-vous à votre compte
            </p>
          </div>
        </div>

        {/* Session expired message */}
        {isExpired && (
          <div className="rounded-lg bg-yellow-50 border border-yellow-200 px-4 py-3 text-sm text-yellow-800 text-center">
            Votre session a expiré en raison d&apos;inactivité. Veuillez vous reconnecter.
          </div>
        )}

        {/* Card */}
        <div className="rounded-2xl border bg-card shadow-xl p-6 space-y-5">
          {step === 'email' ? (
            <form onSubmit={handleEmailSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="email">Adresse e-mail</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="votre@email.com"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    className="pl-9"
                    required
                    autoFocus
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
                  <>
                    Continuer
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </>
                )}
              </Button>
            </form>
          ) : (
            <form onSubmit={handlePasswordSubmit} className="space-y-4">
              <div className="rounded-lg bg-muted px-3 py-2 text-sm flex items-center gap-2">
                <Mail className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                <span className="text-muted-foreground truncate">{email}</span>
                <button
                  type="button"
                  onClick={() => { setStep('email'); setError('') }}
                  className="ml-auto text-primary text-xs hover:underline shrink-0"
                >
                  Modifier
                </button>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="password">Mot de passe</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="password"
                    name="password"
                    type="password"
                    placeholder="••••••••"
                    className="pl-9"
                    required
                    autoFocus
                  />
                </div>
              </div>

              {error && (
                <div className="rounded-lg bg-destructive/10 border border-destructive/20 px-3 py-2 text-sm text-destructive">
                  {error}
                </div>
              )}

              <Button type="submit" className="w-full" disabled={isPending}>
                {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Se connecter'}
              </Button>
            </form>
          )}
        </div>

        <p className="text-center text-xs text-muted-foreground">
          Accès réservé au personnel autorisé
        </p>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    }>
      <LoginForm />
    </Suspense>
  )
}
