'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

interface Term {
  id: string
  name: string
}

interface SchoolYear {
  id: string
  name: string
  isActive: boolean
  terms: Term[]
}

interface DashboardFiltersProps {
  schoolYears: SchoolYear[]
  selectedYearId: string
  selectedTermId: string
}

export function DashboardFilters({
  schoolYears,
  selectedYearId,
  selectedTermId,
}: DashboardFiltersProps) {
  const router = useRouter()
  const searchParams = useSearchParams()

  const selectedYear = schoolYears.find(y => y.id === selectedYearId)

  function updateParam(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString())
    if (value && value !== 'all') {
      params.set(key, value)
    } else {
      params.delete(key)
    }
    if (key === 'yearId') params.delete('termId')
    router.push(`/?${params.toString()}`)
  }

  return (
    <div className="flex flex-wrap items-center gap-3">
      <Select value={selectedYearId || 'all'} onValueChange={v => updateParam('yearId', v)}>
        <SelectTrigger className="w-48">
          <SelectValue placeholder="Toutes les années" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Toutes les années</SelectItem>
          {schoolYears.map(year => (
            <SelectItem key={year.id} value={year.id}>
              {year.name}
              {year.isActive && ' (Active)'}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {selectedYear && selectedYear.terms.length > 0 && (
        <Select value={selectedTermId || 'all'} onValueChange={v => updateParam('termId', v)}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Tous les trimestres" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous les trimestres</SelectItem>
            {selectedYear.terms.map(term => (
              <SelectItem key={term.id} value={term.id}>
                {term.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}
    </div>
  )
}
