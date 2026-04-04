'use client'

import { Moon, Sun, Bell } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { UserButton } from '@clerk/nextjs'
import { useState, useEffect } from 'react'

type Role = 'admin' | 'assistant'

export function Header({
  title,
  role,
}: {
  title?: string
  role?: Role
}) {
  const [dark, setDark] = useState(false)

  useEffect(() => {
    const isDark = document.documentElement.classList.contains('dark')
    setDark(isDark)
  }, [])

  const toggleTheme = () => {
    document.documentElement.classList.toggle('dark')
    setDark(d => !d)
  }

  return (
    <header className="sticky top-0 z-40 flex h-14 items-center gap-4 border-b bg-background/95 backdrop-blur px-6">
      {title && (
        <h1 className="text-lg font-semibold text-foreground hidden sm:block">
          {title}
        </h1>
      )}
      <div className="flex-1" />
      <div className="flex items-center gap-3">
        {role && (
          <span className="hidden sm:inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium bg-primary/10 text-primary border border-primary/20">
            {role === 'admin' ? 'Administrateur' : 'Assistant'}
          </span>
        )}
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleTheme}
          aria-label="Basculer le thème"
        >
          {dark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        </Button>
        <Button variant="ghost" size="icon" aria-label="Notifications">
          <Bell className="h-4 w-4" />
        </Button>
        <UserButton />
      </div>
    </header>
  )
}
