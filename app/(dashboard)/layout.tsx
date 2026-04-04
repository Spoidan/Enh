import { Sidebar } from '@/components/layout/sidebar'
import { Header } from '@/components/layout/header'
import { getSession } from '@/lib/session'
import { redirect } from 'next/navigation'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await getSession()
  if (!session) redirect('/login')

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar role={session.role} />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Header role={session.role} userEmail={session.email} userName={session.email} />
        <main className="flex-1 overflow-y-auto p-6">{children}</main>
      </div>
    </div>
  )
}
