'use client'

import { Moon, Sun, Bell, LogOut, User } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { useState, useEffect, useTransition } from 'react'
import { logout } from '@/lib/actions/auth'

type Role = 'admin' | 'assistant'

export function Header({
  title,
  role,
  userEmail,
  userName,
}: {
  title?: string
  role?: Role
  userEmail?: string
  userName?: string
}) {
  const [dark, setDark] = useState(false)
  const [isPending, startTransition] = useTransition()

  useEffect(() => {
    const isDark = document.documentElement.classList.contains('dark')
    setDark(isDark)
  }, [])

  const toggleTheme = () => {
    document.documentElement.classList.toggle('dark')
    setDark(d => !d)
  }

  const handleLogout = () => {
    startTransition(async () => {
      await logout()
    })
  }

  const initials = userName
    ? userName
        .split(' ')
        .map(n => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    : userEmail?.[0]?.toUpperCase() ?? '?'

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

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="relative h-8 w-8 rounded-full p-0">
              <Avatar className="h-8 w-8">
                <AvatarFallback className="bg-primary text-primary-foreground text-xs font-semibold">
                  {initials}
                </AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col space-y-1">
                {userName && userName !== userEmail && (
                  <p className="text-sm font-medium leading-none">{userName}</p>
                )}
                <p className="text-xs leading-none text-muted-foreground truncate">
                  {userEmail}
                </p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={handleLogout}
              disabled={isPending}
              className="text-destructive focus:text-destructive cursor-pointer"
            >
              <LogOut className="mr-2 h-4 w-4" />
              Se déconnecter
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
