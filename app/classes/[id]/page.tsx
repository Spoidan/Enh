import { getClass } from '@/lib/actions/classes'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, Users, DollarSign } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'
import { FeeStructureManager } from './fee-structure-manager'

export default async function ClassDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const cls = await getClass(id)
  if (!cls) notFound()

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/classes"><ArrowLeft className="h-4 w-4" /></Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold">{cls.name}</h1>
          <p className="text-muted-foreground text-sm">
            {cls._count.students} students enrolled
            {cls.section && ` · Section ${cls.section}`}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Students */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Users className="h-4 w-4" />
              Students
            </CardTitle>
            <Button size="sm" asChild>
              <Link href={`/students?classId=${id}`}>View All</Link>
            </Button>
          </CardHeader>
          <CardContent>
            {cls.students.length === 0 ? (
              <p className="text-sm text-muted-foreground">No students in this class</p>
            ) : (
              <div className="space-y-2">
                {cls.students.slice(0, 10).map(s => (
                  <div key={s.id} className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/30">
                    <div>
                      <Link href={`/students/${s.id}`} className="text-sm font-medium hover:underline">
                        {s.name}
                      </Link>
                      <p className="text-xs text-muted-foreground">#{s.rollNumber}</p>
                    </div>
                    <Badge variant={s.isActive ? 'success' : 'outline'} >
                      {s.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                  </div>
                ))}
                {cls.students.length > 10 && (
                  <p className="text-xs text-muted-foreground text-center pt-2">
                    +{cls.students.length - 10} more students
                  </p>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Fee Structures */}
        <div>
          <FeeStructureManager classId={id} feeStructures={cls.feeStructures} />
        </div>
      </div>
    </div>
  )
}
