import { getStudent } from '@/lib/actions/students'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { formatCurrency, formatDate } from '@/lib/utils'
import { ArrowLeft, Pencil, CreditCard, ShoppingBag, History } from 'lucide-react'

function calculateAge(dob: Date): number {
  const today = new Date()
  let age = today.getFullYear() - dob.getFullYear()
  const m = today.getMonth() - dob.getMonth()
  if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) age--
  return age
}

export default async function StudentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const student = await getStudent(id)
  if (!student) notFound()

  const totalDue = student.class.feeStructures
    .filter(f => f.isActive)
    .reduce((s, f) => s + f.amount, 0)
  const totalPaid = student.payments.reduce((s, p) => s + p.amount, 0)
  const balance = totalDue - totalPaid

  const latestEnrollment = student.enrollments?.[0]
  const enrollmentStatus = latestEnrollment?.status ?? (student.isActive ? 'active' : 'inactive')

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/students"><ArrowLeft className="h-4 w-4" /></Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold">{student.name}</h1>
            <p className="text-muted-foreground text-sm">
              {student.rollNumber ? `Matricule #${student.rollNumber} · ` : ''}{student.class.name}
            </p>
          </div>
        </div>
        <Button asChild>
          <Link href={`/students/${id}/edit`}>
            <Pencil className="h-4 w-4" />
            Modifier
          </Link>
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Info Card */}
        <Card className="lg:col-span-1">
          <CardHeader><CardTitle className="text-base">Informations</CardTitle></CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Statut</span>
              <Badge variant={enrollmentStatus === 'active' ? 'success' : 'outline'}>
                {enrollmentStatus === 'active' ? 'Actif' : 'Inactif'}
              </Badge>
            </div>
            {latestEnrollment?.inactiveReason && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Motif</span>
                <span className="text-xs">{latestEnrollment.inactiveReason}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-muted-foreground">Genre</span>
              <span className="capitalize">{student.gender === 'male' ? 'Masculin' : student.gender === 'female' ? 'Féminin' : '—'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Date de naissance</span>
              <span>{student.dateOfBirth ? new Date(student.dateOfBirth).toLocaleDateString('fr-FR') : '—'}</span>
            </div>
            {student.dateOfBirth && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Âge</span>
                <span>{calculateAge(new Date(student.dateOfBirth))} ans</span>
              </div>
            )}
            <Separator />
            <div className="flex justify-between">
              <span className="text-muted-foreground">Parent</span>
              <span>{student.parentName ?? '—'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Téléphone</span>
              <span>{student.parentPhone ?? '—'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Email</span>
              <span className="text-xs">{student.parentEmail ?? '—'}</span>
            </div>
            <Separator />
            <div className="flex justify-between">
              <span className="text-muted-foreground">Adresse</span>
              <span className="text-right text-xs">{student.address ?? '—'}</span>
            </div>

            {/* Enrollment history */}
            {student.enrollments && student.enrollments.length > 0 && (
              <>
                <Separator />
                <div>
                  <p className="text-muted-foreground flex items-center gap-1 mb-2">
                    <History className="h-3.5 w-3.5" />
                    Historique des inscriptions
                  </p>
                  <div className="space-y-1">
                    {student.enrollments.map(e => (
                      <div key={e.id} className="flex justify-between text-xs">
                        <span>{e.schoolYear.name} — {e.class.name}</span>
                        <Badge
                          variant={e.status === 'active' ? 'success' : 'outline'}
                          className="text-[10px] py-0"
                        >
                          {e.status === 'active' ? 'Actif' : 'Inactif'}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        <div className="lg:col-span-2 space-y-4">
          {/* Financial Summary */}
          <div className="grid grid-cols-3 gap-3">
            <Card>
              <CardContent className="p-4">
                <p className="text-xs text-muted-foreground uppercase tracking-wide">Total dû</p>
                <p className="text-xl font-bold mt-1">{formatCurrency(totalDue)}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <p className="text-xs text-muted-foreground uppercase tracking-wide">Payé</p>
                <p className="text-xl font-bold mt-1 text-green-600">{formatCurrency(totalPaid)}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <p className="text-xs text-muted-foreground uppercase tracking-wide">Solde</p>
                <p className={`text-xl font-bold mt-1 ${balance > 0 ? 'text-destructive' : 'text-green-600'}`}>
                  {formatCurrency(Math.abs(balance))}
                  <span className="text-xs font-normal ml-1">{balance > 0 ? 'dû' : 'crédit'}</span>
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Payment History */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <CreditCard className="h-4 w-4" />
                Historique des paiements
              </CardTitle>
              <Button size="sm" asChild>
                <Link href={`/payments/new?studentId=${id}`}>Ajouter paiement</Link>
              </Button>
            </CardHeader>
            <CardContent>
              {student.payments.length === 0 ? (
                <p className="text-sm text-muted-foreground">Aucun paiement enregistré</p>
              ) : (
                <div className="space-y-2">
                  {student.payments.map(p => (
                    <div key={p.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                      <div>
                        <p className="text-sm font-medium">{formatDate(p.date)}</p>
                        <p className="text-xs text-muted-foreground capitalize">
                          {p.method === 'cash' ? 'Espèces' :
                           p.method === 'bank transfer' ? 'Virement' :
                           p.method === 'check' ? 'Chèque' : p.method}
                          {p.reference ? ` · Réf: ${p.reference}` : ''}
                        </p>
                      </div>
                      <span className="text-sm font-semibold text-green-600">{formatCurrency(p.amount)}</span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Sales History */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <ShoppingBag className="h-4 w-4" />
                Historique des achats
              </CardTitle>
            </CardHeader>
            <CardContent>
              {student.sales.length === 0 ? (
                <p className="text-sm text-muted-foreground">Aucun achat enregistré</p>
              ) : (
                <div className="space-y-2">
                  {student.sales.map(s => (
                    <div key={s.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                      <div>
                        <p className="text-sm font-medium">{s.item.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {formatDate(s.date)} · Qté : {s.quantity} × {formatCurrency(s.unitPrice)}
                        </p>
                      </div>
                      <span className="text-sm font-semibold">{formatCurrency(s.amount)}</span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
