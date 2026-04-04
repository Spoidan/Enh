import { getStudent } from '@/lib/actions/students'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { formatCurrency, formatDate } from '@/lib/utils'
import { ArrowLeft, Pencil, CreditCard, ShoppingBag } from 'lucide-react'

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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/students"><ArrowLeft className="h-4 w-4" /></Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold">{student.name}</h1>
            <p className="text-muted-foreground text-sm">Roll #{student.rollNumber} · {student.class.name}</p>
          </div>
        </div>
        <Button asChild>
          <Link href={`/students/${id}/edit`}><Pencil className="h-4 w-4" />Edit</Link>
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Info */}
        <Card className="lg:col-span-1">
          <CardHeader><CardTitle className="text-base">Student Info</CardTitle></CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Statut</span>
              <Badge variant={student.isActive ? 'success' : 'outline'}>
                {student.isActive ? 'Actif' : 'Inactif'}
              </Badge>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Gender</span>
              <span className="capitalize">{student.gender ?? '—'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">DOB</span>
              <span>{student.dateOfBirth ? formatDate(student.dateOfBirth) : '—'}</span>
            </div>
            <Separator />
            <div className="flex justify-between">
              <span className="text-muted-foreground">Parent</span>
              <span>{student.parentName ?? '—'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Phone</span>
              <span>{student.parentPhone ?? '—'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Email</span>
              <span className="text-xs">{student.parentEmail ?? '—'}</span>
            </div>
            <Separator />
            <div className="flex justify-between">
              <span className="text-muted-foreground">Address</span>
              <span className="text-right text-xs">{student.address ?? '—'}</span>
            </div>
          </CardContent>
        </Card>

        <div className="lg:col-span-2 space-y-4">
          {/* Financial Summary */}
          <div className="grid grid-cols-3 gap-3">
            <Card>
              <CardContent className="p-4">
                <p className="text-xs text-muted-foreground uppercase tracking-wide">Total Due</p>
                <p className="text-xl font-bold mt-1">{formatCurrency(totalDue)}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <p className="text-xs text-muted-foreground uppercase tracking-wide">Paid</p>
                <p className="text-xl font-bold mt-1 text-green-600">{formatCurrency(totalPaid)}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <p className="text-xs text-muted-foreground uppercase tracking-wide">Balance</p>
                <p className={`text-xl font-bold mt-1 ${balance > 0 ? 'text-destructive' : 'text-green-600'}`}>
                  {formatCurrency(Math.abs(balance))}
                  {balance > 0 ? ' owed' : ' credit'}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Payment History */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <CreditCard className="h-4 w-4" />
                Payment History
              </CardTitle>
              <Button size="sm" asChild>
                <Link href={`/payments/new?studentId=${id}`}>Add Payment</Link>
              </Button>
            </CardHeader>
            <CardContent>
              {student.payments.length === 0 ? (
                <p className="text-sm text-muted-foreground">No payments recorded</p>
              ) : (
                <div className="space-y-2">
                  {student.payments.map(p => (
                    <div key={p.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                      <div>
                        <p className="text-sm font-medium">{formatDate(p.date)}</p>
                        <p className="text-xs text-muted-foreground capitalize">
                          {p.method} {p.reference ? `· Ref: ${p.reference}` : ''}
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
                Purchase History
              </CardTitle>
            </CardHeader>
            <CardContent>
              {student.sales.length === 0 ? (
                <p className="text-sm text-muted-foreground">No purchases recorded</p>
              ) : (
                <div className="space-y-2">
                  {student.sales.map(s => (
                    <div key={s.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                      <div>
                        <p className="text-sm font-medium">{s.item.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {formatDate(s.date)} · Qty: {s.quantity} × {formatCurrency(s.unitPrice)}
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
