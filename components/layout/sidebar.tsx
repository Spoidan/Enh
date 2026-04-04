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
  UserCog,
  PieChart,
  CalendarDays,
  Menu,
  X,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useState, useEffect } from 'react'
import Image from 'next/image'

type Role = 'admin' | 'assistant'

const commonNavItems = [
  { href: '/', icon: LayoutDashboard, label: 'Tableau de bord' },
  { href: '/students', icon: Users, label: 'Élèves' },
  { href: '/classes', icon: GraduationCap, label: 'Classes' },
  { href: '/payments', icon: CreditCard, label: 'Paiements' },
  { href: '/payment-overview', icon: PieChart, label: 'Aperçu paiements' },
  { href: '/inventory', icon: ShoppingBag, label: 'Inventaire' },
  { href: '/sales', icon: BookOpen, label: 'Ventes' },
  { href: '/finance', icon: Landmark, label: 'Finance' },
  { href: '/reports', icon: BarChart3, label: 'Rapports' },
]

const adminNavItems = [
  { href: '/school-years', icon: CalendarDays, label: 'Années scolaires' },
  { href: '/etablissement', icon: Building2, label: 'Établissement' },
  { href: '/salaires', icon: Banknote, label: 'Salaires' },
  { href: '/lettres-debit', icon: FileText, label: 'Lettres Débit' },
  { href: '/inss', icon: Shield, label: 'Paiements INSS' },
  { href: '/mutuelle', icon: HeartHandshake, label: 'Mutuelle' },
  { href: '/admin/accounts', icon: UserCog, label: 'Gestion des comptes' },
]

interface SidebarProps {
  role: Role
  schoolName?: string
  logoUrl?: string
}

export function Sidebar({ role, schoolName, logoUrl }: SidebarProps) {
  const pathname = usePathname()
  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const isAdmin = role === 'admin'
  const displayName = schoolName || 'Gestion Scolaire'

  // Close mobile menu on route change
  useEffect(() => {
    setMobileOpen(false)
  }, [pathname])

  // Prevent body scroll when mobile menu is open
  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => { document.body.style.overflow = '' }
  }, [mobileOpen])

  const renderNav = (items: typeof commonNavItems) =>
    items.map(({ href, icon: Icon, label }) => {
      const active =
        href === '/' ? pathname === '/' : pathname.startsWith(href)
      return (
        <Link
          key={href}
          href={href}
          className={cn(
            'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors min-h-[44px]',
            active
              ? 'bg-primary text-primary-foreground'
              : 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-foreground',
            collapsed && !mobileOpen && 'justify-center px-2'
          )}
          title={collapsed && !mobileOpen ? label : undefined}
        >
          <Icon className="h-4 w-4 shrink-0" />
          {(!collapsed || mobileOpen) && <span>{label}</span>}
        </Link>
      )
    })

  const sidebarContent = (
    <aside
      className={cn(
        'flex flex-col bg-sidebar border-r border-sidebar-border h-full',
        collapsed ? 'w-16' : 'w-64'
      )}
    >
      {/* Logo */}
      <div
        className={cn(
          'flex items-center gap-3 p-4 border-b border-sidebar-border',
          collapsed && !mobileOpen && 'justify-center'
        )}
      >
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground overflow-hidden">
          {logoUrl ? (
            <Image
              src={logoUrl}
              alt="Logo"
              width={36}
              height={36}
              className="h-full w-full object-cover"
              unoptimized
            />
          ) : (
            <School className="h-5 w-5" />
          )}
        </div>
        {(!collapsed || mobileOpen) && (
          <div className="min-w-0">
            <p className="font-bold text-sm text-sidebar-foreground leading-none truncate">
              {displayName}
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
            {(!collapsed || mobileOpen) && (
              <p className="px-3 pt-4 pb-1 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Administration
              </p>
            )}
            {collapsed && !mobileOpen && <div className="border-t border-sidebar-border my-2" />}
            {renderNav(adminNavItems)}
          </>
        )}
      </nav>

      {/* Collapse toggle — desktop only */}
      <div className="p-2 border-t border-sidebar-border hidden md:block">
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

  return (
    <>
      {/* Mobile hamburger button — shown in header area */}
      <button
        onClick={() => setMobileOpen(true)}
        className="fixed top-3 left-3 z-50 flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-md md:hidden"
        aria-label="Ouvrir le menu"
      >
        <Menu className="h-5 w-5" />
      </button>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 md:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Mobile drawer */}
      <div
        className={cn(
          'fixed inset-y-0 left-0 z-50 transition-transform duration-300 md:hidden',
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <div className="relative h-full w-64">
          <button
            onClick={() => setMobileOpen(false)}
            className="absolute right-2 top-2 z-10 flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-sidebar-accent"
            aria-label="Fermer le menu"
          >
            <X className="h-4 w-4" />
          </button>
          {sidebarContent}
        </div>
      </div>

      {/* Desktop sidebar */}
      <div
        className={cn(
          'hidden md:flex flex-col transition-all duration-300 h-screen sticky top-0',
          collapsed ? 'w-16' : 'w-64'
        )}
      >
        {sidebarContent}
      </div>
    </>
  )
}
