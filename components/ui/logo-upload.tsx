'use client'

import { useRef, useState } from 'react'
import { Upload, X, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

const MAX_BYTES = 2 * 1024 * 1024 // 2 MB
const ACCEPTED = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/svg+xml']

interface LogoUploadProps {
  value: string        // current base64 or URL
  onChange: (base64: string) => void
  onClear: () => void
  className?: string
}

export function LogoUpload({ value, onChange, onClear, className }: LogoUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function handleFile(file: File) {
    setError(null)

    if (!ACCEPTED.includes(file.type)) {
      setError('Format non supporté. Utilisez PNG, JPG, WEBP ou SVG.')
      return
    }
    if (file.size > MAX_BYTES) {
      setError('Le fichier est trop volumineux. Taille maximale : 2 Mo.')
      return
    }

    setLoading(true)
    const reader = new FileReader()
    reader.onload = e => {
      const result = e.target?.result as string
      onChange(result)
      setLoading(false)
    }
    reader.onerror = () => {
      setError('Erreur lors de la lecture du fichier.')
      setLoading(false)
    }
    reader.readAsDataURL(file)
  }

  if (value) {
    return (
      <div className={cn('flex items-center gap-4 rounded-lg border p-4 bg-muted/30', className)}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={value}
          alt="Logo aperçu"
          className="h-16 w-16 object-contain rounded-lg border bg-white"
        />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-green-700">Logo chargé ✓</p>
          <p className="text-xs text-muted-foreground mt-0.5">
            Cliquez sur Enregistrer pour sauvegarder.
          </p>
        </div>
        <Button type="button" variant="ghost" size="icon" onClick={onClear} title="Supprimer le logo">
          <X className="h-4 w-4" />
        </Button>
      </div>
    )
  }

  return (
    <div className={className}>
      <input
        ref={inputRef}
        type="file"
        accept={ACCEPTED.join(',')}
        className="sr-only"
        onChange={e => {
          const file = e.target.files?.[0]
          if (file) handleFile(file)
          e.target.value = ''
        }}
      />
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={loading}
        className={cn(
          'w-full flex flex-col items-center gap-3 rounded-lg border-2 border-dashed border-muted-foreground/30',
          'p-8 text-center hover:border-primary/50 hover:bg-muted/20 transition-colors',
          'disabled:opacity-50 disabled:cursor-not-allowed'
        )}
      >
        {loading
          ? <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          : <Upload className="h-8 w-8 text-muted-foreground" />
        }
        <div>
          <p className="text-sm font-medium">
            {loading ? 'Chargement...' : 'Cliquer pour sélectionner un logo'}
          </p>
          <p className="text-xs text-muted-foreground mt-1">PNG, JPG, WEBP, SVG — max 2 Mo</p>
        </div>
      </button>
      {error && <p className="mt-2 text-xs text-destructive font-medium">{error}</p>}
    </div>
  )
}
