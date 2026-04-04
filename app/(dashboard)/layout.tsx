import { Sidebar } from '@/components/layout/sidebar'
import { Header } from '@/components/layout/header'
import { SessionTimeout } from '@/components/session-timeout'
import { getSession } from '@/lib/session'
import { getSchoolSettings } from '@/lib/actions/etablissement'
import { redirect } from 'next/navigation'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await getSession()
  if (!session) redirect('/login')

  const settings = await getSchoolSettings()

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar
        role={session.role}
        schoolName={settings?.schoolName || ''}
        logoUrl={settings?.logoUrl || ''}
      />
      <div className="flex flex-1 flex-col overflow-hidden min-w-0">
        <Header role={session.role} userEmail={session.email} userName={session.email} />
        <main className="flex-1 overflow-y-auto p-4 md:p-6">{children}</main>
      </div>
      <SessionTimeout />
    </div>
  )
}
