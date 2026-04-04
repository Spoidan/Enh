'use client'

import { useState, useEffect, useTransition } from 'react'
import { toast } from 'sonner'
import {
  Plus,
  Trash2,
  UserCheck,
  UserX,
  RefreshCw,
  Shield,
  User,
  Mail,
  Clock,
  CheckCircle2,
  XCircle,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  getUsers,
  createAuthorizedUser,
  updateUserRole,
  toggleUserActive,
  resetUserAccount,
  deleteUser,
} from '@/lib/actions/accounts'

type UserRecord = {
  id: string
  email: string
  name: string | null
  role: string
  isSetup: boolean
  isActive: boolean
  createdAt: Date
}

export default function AccountsPage() {
  const [users, setUsers] = useState<UserRecord[]>([])
  const [showAdd, setShowAdd] = useState(false)
  const [addEmail, setAddEmail] = useState('')
  const [addRole, setAddRole] = useState('assistant')
  const [addError, setAddError] = useState('')
  const [adding, setAdding] = useState(false)
  const [isPending, startTransition] = useTransition()

  const load = () => {
    getUsers().then(data => setUsers(data as UserRecord[]))
  }

  useEffect(() => { load() }, [])

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault()
    setAddError('')
    setAdding(true)
    try {
      await createAuthorizedUser(addEmail, addRole)
      toast.success(`Compte autorisé créé pour ${addEmail}`)
      setShowAdd(false)
      setAddEmail('')
      setAddRole('assistant')
      load()
    } catch (err: unknown) {
      setAddError(err instanceof Error ? err.message : 'Erreur inconnue')
    } finally {
      setAdding(false)
    }
  }

  const handleRoleChange = (id: string, role: string) => {
    startTransition(async () => {
      await updateUserRole(id, role)
      toast.success('Rôle mis à jour')
      load()
    })
  }

  const handleToggleActive = (id: string, current: boolean) => {
    startTransition(async () => {
      await toggleUserActive(id, !current)
      toast.success(current ? 'Compte désactivé' : 'Compte réactivé')
      load()
    })
  }

  const handleReset = (id: string, email: string) => {
    if (!confirm(`Réinitialiser le compte de ${email} ? Ils devront reconfigurer leur mot de passe.`)) return
    startTransition(async () => {
      await resetUserAccount(id)
      toast.success('Compte réinitialisé')
      load()
    })
  }

  const handleDelete = (id: string, email: string) => {
    if (!confirm(`Supprimer définitivement le compte de ${email} ?`)) return
    startTransition(async () => {
      await deleteUser(id)
      toast.success('Compte supprimé')
      load()
    })
  }

  const pending = users.filter(u => !u.isSetup)
  const active = users.filter(u => u.isSetup && u.isActive)
  const inactive = users.filter(u => u.isSetup && !u.isActive)

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Gestion des comptes</h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            Gérez les accès au système — {users.length} compte{users.length !== 1 ? 's' : ''} au total
          </p>
        </div>
        <Button onClick={() => setShowAdd(true)}>
          <Plus className="h-4 w-4" />
          Ajouter un compte
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'En attente de configuration', value: pending.length, icon: Clock, color: 'text-yellow-600 bg-yellow-50 border-yellow-200' },
          { label: 'Comptes actifs', value: active.length, icon: CheckCircle2, color: 'text-green-600 bg-green-50 border-green-200' },
          { label: 'Comptes désactivés', value: inactive.length, icon: XCircle, color: 'text-red-600 bg-red-50 border-red-200' },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className={`rounded-xl border p-4 flex items-center gap-3 ${color}`}>
            <Icon className="h-8 w-8 shrink-0" />
            <div>
              <p className="text-2xl font-bold">{value}</p>
              <p className="text-xs font-medium">{label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Users table */}
      <div className="rounded-xl border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 border-b">
            <tr>
              <th className="text-left font-medium px-4 py-3">Utilisateur</th>
              <th className="text-left font-medium px-4 py-3">Rôle</th>
              <th className="text-left font-medium px-4 py-3">Statut</th>
              <th className="text-left font-medium px-4 py-3">Ajouté le</th>
              <th className="text-right font-medium px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {users.map(user => (
              <tr key={user.id} className="hover:bg-muted/20 transition-colors">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2.5">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary text-xs font-semibold">
                      {user.name
                        ? user.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
                        : user.email[0].toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      {user.name && (
                        <p className="font-medium truncate">{user.name}</p>
                      )}
                      <p className={`text-muted-foreground truncate ${user.name ? 'text-xs' : 'text-sm'}`}>
                        {user.email}
                      </p>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <Select
                    value={user.role}
                    onValueChange={val => handleRoleChange(user.id, val)}
                    disabled={isPending}
                  >
                    <SelectTrigger className="h-7 w-36 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="admin">
                        <span className="flex items-center gap-1.5">
                          <Shield className="h-3 w-3" /> Administrateur
                        </span>
                      </SelectItem>
                      <SelectItem value="assistant">
                        <span className="flex items-center gap-1.5">
                          <User className="h-3 w-3" /> Assistant
                        </span>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </td>
                <td className="px-4 py-3">
                  {!user.isSetup ? (
                    <Badge variant="secondary" className="bg-yellow-100 text-yellow-700 border-yellow-200">
                      <Clock className="h-3 w-3 mr-1" />
                      En attente
                    </Badge>
                  ) : user.isActive ? (
                    <Badge variant="secondary" className="bg-green-100 text-green-700 border-green-200">
                      <CheckCircle2 className="h-3 w-3 mr-1" />
                      Actif
                    </Badge>
                  ) : (
                    <Badge variant="secondary" className="bg-red-100 text-red-700 border-red-200">
                      <XCircle className="h-3 w-3 mr-1" />
                      Désactivé
                    </Badge>
                  )}
                </td>
                <td className="px-4 py-3 text-muted-foreground">
                  {new Date(user.createdAt).toLocaleDateString('fr-FR')}
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-end gap-1">
                    {user.isSetup && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        title={user.isActive ? 'Désactiver le compte' : 'Réactiver le compte'}
                        onClick={() => handleToggleActive(user.id, user.isActive)}
                        disabled={isPending}
                      >
                        {user.isActive ? (
                          <UserX className="h-3.5 w-3.5 text-yellow-600" />
                        ) : (
                          <UserCheck className="h-3.5 w-3.5 text-green-600" />
                        )}
                      </Button>
                    )}
                    {user.isSetup && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        title="Réinitialiser le mot de passe"
                        onClick={() => handleReset(user.id, user.email)}
                        disabled={isPending}
                      >
                        <RefreshCw className="h-3.5 w-3.5 text-blue-600" />
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-destructive hover:text-destructive"
                      title="Supprimer le compte"
                      onClick={() => handleDelete(user.id, user.email)}
                      disabled={isPending}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </td>
              </tr>
            ))}

            {users.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-12 text-center text-muted-foreground">
                  <Mail className="h-8 w-8 mx-auto mb-2 opacity-40" />
                  <p>Aucun compte enregistré</p>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Add user dialog */}
      <Dialog open={showAdd} onOpenChange={setShowAdd}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Autoriser un nouveau compte</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleAdd}>
            <div className="grid gap-4 py-4">
              <div className="space-y-1.5">
                <Label>Adresse e-mail *</Label>
                <Input
                  type="email"
                  value={addEmail}
                  onChange={e => setAddEmail(e.target.value)}
                  placeholder="prenom.nom@email.com"
                  required
                  autoFocus
                />
              </div>
              <div className="space-y-1.5">
                <Label>Rôle *</Label>
                <Select value={addRole} onValueChange={setAddRole}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">Administrateur</SelectItem>
                    <SelectItem value="assistant">Assistant</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {addError && (
                <p className="text-sm text-destructive">{addError}</p>
              )}
              <p className="text-xs text-muted-foreground">
                L&apos;utilisateur recevra un lien pour configurer son mot de passe lors de sa première connexion.
              </p>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowAdd(false)}>
                Annuler
              </Button>
              <Button type="submit" disabled={adding}>
                {adding ? 'Ajout...' : 'Autoriser l\'accès'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
