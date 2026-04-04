import { Sidebar } from '@/components/layout/sidebar'
import { Header } from '@/components/layout/header'
import { getCurrentUserRole } from '@/lib/auth'
import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { userId } = await auth()
  if (!userId) redirect('/sign-in')

  const role = await getCurrentUserRole()

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar role={role ?? 'assistant'} />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Header role={role ?? 'assistant'} />
        <main className="flex-1 overflow-y-auto p-6">{children}</main>
      </div>
    </div>
  )
}
