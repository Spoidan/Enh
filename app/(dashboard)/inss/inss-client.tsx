'use client'

import { useState, useTransition } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { FileUpload } from '@/components/ui/file-upload'
import { createINSSPayment, deleteINSSPayment } from '@/lib/actions/inss'
import { formatCurrency, getMonthName } from '@/lib/utils'
import { toast } from 'sonner'
import { Plus, Trash2, Download, FileText, Loader2 } from 'lucide-react'

type Payment = {
  id: string
  month: number
  year: number
  amount: number
  date: Date
  status: string
  fileUrl: string | null
  fileName: string | null
  reference: string | null
  notes: string | null
}

const MONTHS = Array.from({ length: 12 }, (_, i) => i + 1)
const CURRENT_YEAR = new Date().getFullYear()
const YEARS = [CURRENT_YEAR - 1, CURRENT_YEAR, CURRENT_YEAR + 1]

export function INSSClient({ payments }: { payments: Payment[] }) {
  const [open, setOpen] = useState(false)
  const [fileUrl, setFileUrl] = useState('')
  const [fileName, setFileName] = useState('')
  const [pending, startTransition] = useTransition()

  const totalAnnuel = payments
    .filter(p => p.year === CURRENT_YEAR)
    .reduce((s, p) => s + p.amount, 0)

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    fd.set('fileUrl', fileUrl)
    fd.set('fileName', fileName)

    startTransition(async () => {
      const res = await createINSSPayment(fd)
      if (res && 'error' in res) toast.error(res.error as string)
      else {
        toast.success('Paiement INSS enregistré')
        setOpen(false)
        setFileUrl('')
        setFileName('')
      }
    })
  }

  function handleDelete(id: string) {
    startTransition(async () => {
      const res = await deleteINSSPayment(id)
      if (res && 'error' in res) toast.error(res.error as string)
      else toast.success('Paiement supprimé')
    })
  }

  return (
    <div className="space-y-4">
      {/* Summary */}
      <div className="grid gap-4 sm:grid-cols-2">
        <Card className="bg-primary/5">
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Total {CURRENT_YEAR}</p>
            <p className="text-2xl font-bold mt-1">{formatCurrency(totalAnnuel)}</p>
          </CardContent>
        </Card>
        <Card className="bg-primary/5">
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Paiements effectués</p>
            <p className="text-2xl font-bold mt-1">{payments.length}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Historique des paiements</CardTitle>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="gap-2">
                <Plus className="h-4 w-4" /> Nouveau
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Nouveau paiement INSS</DialogTitle>
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
                        <option key={m} value={m}>{getMonthName(m)}</option>
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
                        <option key={y} value={y}>{y}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="amount">Montant (BIF) *</Label>
                  <Input id="amount" name="amount" type="number" required min={0} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="date">Date de paiement *</Label>
                  <Input
                    id="date"
                    name="date"
                    type="date"
                    required
                    defaultValue={new Date().toISOString().split('T')[0]}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="reference">Référence</Label>
                  <Input id="reference" name="reference" />
                </div>
                <div className="space-y-1.5">
                  <Label>Justificatif (PDF)</Label>
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
          {payments.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-12">
              Aucun paiement INSS enregistré.
            </p>
          ) : (
            <div className="divide-y">
              {payments.map(p => (
                <div key={p.id} className="flex items-center gap-4 py-3">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium">
                      {getMonthName(p.month)} {p.year}
                    </p>
                    {p.reference && (
                      <p className="text-xs text-muted-foreground">
                        Réf: {p.reference}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <span className="font-semibold text-sm">
                      {formatCurrency(p.amount)}
                    </span>
                    <Badge variant={p.status === 'payé' ? 'default' : 'secondary'}>
                      {p.status}
                    </Badge>
                    {p.fileUrl && (
                      <a href={p.fileUrl} target="_blank" rel="noopener noreferrer">
                        <Button variant="ghost" size="icon">
                          <Download className="h-4 w-4" />
                        </Button>
                      </a>
                    )}
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(p.id)}
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
    </div>
  )
}
