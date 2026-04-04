'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  Users,
  GraduationCap,
  CreditCard,
  ShoppingBag,
  Landmark,
  BookOpen,
  BarChart3,
  School,
  ChevronLeft,
  ChevronRight,
  Building2,
  Banknote,
  FileText,
  Shield,
  HeartHandshake,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useState } from 'react'

type Role = 'admin' | 'assistant'

const commonNavItems = [
  { href: '/', icon: LayoutDashboard, label: 'Tableau de bord' },
  { href: '/students', icon: Users, label: 'Élèves' },
  { href: '/classes', icon: GraduationCap, label: 'Classes' },
  { href: '/payments', icon: CreditCard, label: 'Paiements' },
  { href: '/inventory', icon: ShoppingBag, label: 'Inventaire' },
  { href: '/sales', icon: BookOpen, label: 'Ventes' },
  { href: '/finance', icon: Landmark, label: 'Finance' },
  { href: '/reports', icon: BarChart3, label: 'Rapports' },
]

const adminNavItems = [
  { href: '/etablissement', icon: Building2, label: 'Établissement' },
  { href: '/salaires', icon: Banknote, label: 'Salaires' },
  { href: '/lettres-debit', icon: FileText, label: 'Lettres Débit' },
  { href: '/inss', icon: Shield, label: 'Paiements INSS' },
  { href: '/mutuelle', icon: HeartHandshake, label: 'Mutuelle' },
]

export function Sidebar({ role }: { role: Role }) {
  const pathname = usePathname()
  const [collapsed, setCollapsed] = useState(false)
  const isAdmin = role === 'admin'

  const renderNav = (items: typeof commonNavItems) =>
    items.map(({ href, icon: Icon, label }) => {
      const active =
        href === '/' ? pathname === '/' : pathname.startsWith(href)
      return (
        <Link
          key={href}
          href={href}
          className={cn(
            'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
            active
              ? 'bg-primary text-primary-foreground'
              : 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-foreground',
            collapsed && 'justify-center px-2'
          )}
          title={collapsed ? label : undefined}
        >
          <Icon className="h-4 w-4 shrink-0" />
          {!collapsed && <span>{label}</span>}
        </Link>
      )
    })

  return (
    <aside
      className={cn(
        'flex flex-col bg-sidebar border-r border-sidebar-border transition-all duration-300 h-screen sticky top-0',
        collapsed ? 'w-16' : 'w-64'
      )}
    >
      {/* Logo */}
      <div
        className={cn(
          'flex items-center gap-3 p-4 border-b border-sidebar-border',
          collapsed && 'justify-center'
        )}
      >
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground">
          <School className="h-5 w-5" />
        </div>
        {!collapsed && (
          <div>
            <p className="font-bold text-sm text-sidebar-foreground leading-none">
              Gestion Scolaire
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Système de gestion
            </p>
          </div>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto p-2 space-y-1">
        {renderNav(commonNavItems)}

        {isAdmin && (
          <>
            {!collapsed && (
              <p className="px-3 pt-4 pb-1 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Administration
              </p>
            )}
            {collapsed && <div className="border-t border-sidebar-border my-2" />}
            {renderNav(adminNavItems)}
          </>
        )}
      </nav>

      {/* Collapse toggle */}
      <div className="p-2 border-t border-sidebar-border">
        <button
          onClick={() => setCollapsed(!collapsed)}
          className={cn(
            'flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-sidebar-accent transition-colors',
            collapsed && 'justify-center px-2'
          )}
        >
          {collapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <ChevronLeft className="h-4 w-4" />
          )}
          {!collapsed && <span>Réduire</span>}
        </button>
      </div>
    </aside>
  )
}
