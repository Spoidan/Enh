import { NextResponse } from 'next/server'
import { migrateStudentsToActiveYear } from '@/lib/actions/enrollments'
import { requireAdmin } from '@/lib/auth'

export async function POST() {
  try {
    await requireAdmin()
    const result = await migrateStudentsToActiveYear()
    return NextResponse.json(result)
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
