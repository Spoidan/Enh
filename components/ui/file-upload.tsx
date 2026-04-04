'use client'

import { useState, useRef } from 'react'
import { Upload, X, FileText, Image as ImageIcon, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

type UploadType = 'image' | 'pdf'

interface FileUploadProps {
  type: UploadType
  value?: string
  fileName?: string
  onChange: (url: string, name: string) => void
  onClear: () => void
  className?: string
}

export function FileUpload({
  type,
  value,
  fileName,
  onChange,
  onClear,
  className,
}: FileUploadProps) {
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const accept = type === 'image' ? 'image/*' : 'application/pdf'
  const label = type === 'image' ? 'image' : 'PDF'
  const Icon = type === 'image' ? ImageIcon : FileText

  async function handleFile(file: File) {
    setError(null)
    setUploading(true)
    try {
      const form = new FormData()
      form.append('file', file)
      form.append('type', type)

      const res = await fetch('/api/upload', { method: 'POST', body: form })
      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Erreur de téléchargement')
        return
      }
      onChange(data.url, data.name)
    } catch {
      setError('Erreur réseau lors du téléchargement')
    } finally {
      setUploading(false)
    }
  }

  if (value) {
    return (
      <div
        className={cn(
          'flex items-center gap-3 rounded-lg border p-3 bg-muted/40',
          className
        )}
      >
        <Icon className="h-5 w-5 text-primary shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium truncate">{fileName || value}</p>
          {type === 'pdf' && (
            <a
              href={value}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-primary hover:underline"
            >
              Voir le fichier
            </a>
          )}
          {type === 'image' && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={value}
              alt="Aperçu"
              className="mt-2 h-16 w-16 object-cover rounded"
            />
          )}
        </div>
        <Button variant="ghost" size="icon" onClick={onClear}>
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
        accept={accept}
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
        disabled={uploading}
        className="w-full flex flex-col items-center gap-2 rounded-lg border-2 border-dashed border-muted-foreground/30 p-6 text-center hover:border-primary/50 hover:bg-muted/30 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {uploading ? (
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        ) : (
          <Upload className="h-8 w-8 text-muted-foreground" />
        )}
        <p className="text-sm text-muted-foreground">
          {uploading
            ? 'Téléchargement en cours...'
            : `Cliquer pour télécharger un ${label}`}
        </p>
      </button>
      {error && <p className="mt-1 text-xs text-destructive">{error}</p>}
    </div>
  )
}
