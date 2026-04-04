import { SignIn } from '@clerk/nextjs'
import { School } from 'lucide-react'

export default function SignInPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-8">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-lg">
            <School className="h-7 w-7" />
          </div>
          <div>
            <p className="text-xl font-bold leading-none">Gestion Scolaire</p>
            <p className="text-sm text-muted-foreground mt-0.5">
              Système de gestion
            </p>
          </div>
        </div>

        {/* Clerk Sign-In widget */}
        <SignIn
          appearance={{
            elements: {
              rootBox: 'shadow-xl rounded-2xl overflow-hidden',
              card: 'shadow-none',
            },
          }}
        />
      </div>
    </div>
  )
}
