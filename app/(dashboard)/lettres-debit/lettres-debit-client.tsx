'use client'

import { useState, useTransition } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { FileUpload } from '@/components/ui/file-upload'
import { createDebitLetter, deleteDebitLetter } from '@/lib/actions/lettres-debit'
import { getMonthName } from '@/lib/utils'
import { toast } from 'sonner'
import { Plus, Trash2, FileText, Download, Loader2 } from 'lucide-react'

type Letter = {
  id: string
  month: number
  year: number
  fileUrl: string
  fileName: string
  notes: string | null
  createdAt: Date
}

const MONTHS = Array.from({ length: 12 }, (_, i) => i + 1)
const CURRENT_YEAR = new Date().getFullYear()
const YEARS = [CURRENT_YEAR - 1, CURRENT_YEAR, CURRENT_YEAR + 1]

export function LettresDebitClient({ letters }: { letters: Letter[] }) {
  const [open, setOpen] = useState(false)
  const [fileUrl, setFileUrl] = useState('')
  const [fileName, setFileName] = useState('')
  const [pending, startTransition] = useTransition()

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!fileUrl) { toast.error('Veuillez télécharger un fichier PDF'); return }
    const fd = new FormData(e.currentTarget)
    fd.set('fileUrl', fileUrl)
    fd.set('fileName', fileName)

    startTransition(async () => {
      const res = await createDebitLetter(fd)
      if (res && 'error' in res) toast.error(res.error as string)
      else {
        toast.success('Lettre ajoutée')
        setOpen(false)
        setFileUrl('')
        setFileName('')
      }
    })
  }

  function handleDelete(id: string) {
    startTransition(async () => {
      const res = await deleteDebitLetter(id)
      if (res && 'error' in res) toast.error(res.error as string)
      else toast.success('Lettre supprimée')
    })
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Lettres ({letters.length})</CardTitle>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="gap-2">
              <Plus className="h-4 w-4" /> Ajouter
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Nouvelle lettre de débit</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4 pt-2">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="month">Mois *</Label>
                  <select
                    id="month"
                    name="month"
                    required
                    className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm"
                  >
                    {MONTHS.map(m => (
                      <option key={m} value={m}>
                        {getMonthName(m)}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="year">Année *</Label>
                  <select
                    id="year"
                    name="year"
                    required
                    className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm"
                  >
                    {YEARS.map(y => (
                      <option key={y} value={y}>
                        {y}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label>Fichier PDF *</Label>
                <FileUpload
                  type="pdf"
                  value={fileUrl}
                  fileName={fileName}
                  onChange={(url, name) => { setFileUrl(url); setFileName(name) }}
                  onClear={() => { setFileUrl(''); setFileName('') }}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="notes">Notes</Label>
                <Input id="notes" name="notes" />
              </div>

              <Button type="submit" disabled={pending} className="w-full gap-2">
                {pending && <Loader2 className="h-4 w-4 animate-spin" />}
                Enregistrer
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        {letters.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-12">
            Aucune lettre de débit enregistrée.
          </p>
        ) : (
          <div className="divide-y">
            {letters.map(l => (
              <div key={l.id} className="flex items-center gap-4 py-3">
                <FileText className="h-8 w-8 text-primary/60 shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="font-medium">
                    {getMonthName(l.month)} {l.year}
                  </p>
                  <p className="text-sm text-muted-foreground truncate">
                    {l.fileName}
                  </p>
                  {l.notes && (
                    <p className="text-xs text-muted-foreground">{l.notes}</p>
                  )}
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <a href={l.fileUrl} target="_blank" rel="noopener noreferrer">
                    <Button variant="outline" size="sm" className="gap-1.5">
                      <Download className="h-3.5 w-3.5" /> Voir
                    </Button>
                  </a>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDelete(l.id)}
                    disabled={pending}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
