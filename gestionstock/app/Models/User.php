<?php

namespace App\Models;

use App\Notifications\ResetPasswordNotification;
use Illuminate\Auth\Passwords\CanResetPassword;
use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable
{
    use HasApiTokens, HasFactory, Notifiable, CanResetPassword;

    protected $fillable = [
        'name',
        'email',
        'password',
        'role',
        'is_active',
        'phone',
        'must_change_password',
    ];

    protected $hidden = [
        'password',
        'remember_token',
    ];

    protected $casts = [
        'email_verified_at'    => 'datetime',
        'password'             => 'hashed',
        'is_active'            => 'boolean',
        'must_change_password' => 'boolean',
    ];

    /**
     * Constantes pour les rôles.
     */
    const ROLE_SUPER_ADMIN        = 'super_admin';
    const ROLE_GESTIONNAIRE_STOCK = 'gestionnaire_stock';
    const ROLE_LECTEUR            = 'lecteur';

    /**
     * Libellés des rôles en français.
     */
    public static function rolesLabels(): array
    {
        return [
            self::ROLE_SUPER_ADMIN        => 'Super Administrateur',
            self::ROLE_GESTIONNAIRE_STOCK => 'Gestionnaire de Stock',
            self::ROLE_LECTEUR            => 'Lecteur',
        ];
    }

    public function getRoleLabelAttribute(): string
    {
        return self::rolesLabels()[$this->role] ?? $this->role;
    }

    public function isSuperAdmin(): bool
    {
        return $this->role === self::ROLE_SUPER_ADMIN;
    }

    public function isGestionnaire(): bool
    {
        return $this->role === self::ROLE_GESTIONNAIRE_STOCK;
    }

    public function isLecteur(): bool
    {
        return $this->role === self::ROLE_LECTEUR;
    }

    /**
     * Vérifier si l'utilisateur peut accéder à un entrepôt donné.
     */
    public function hasAccessToEntrepot(int $entrepotId): bool
    {
        if ($this->isSuperAdmin()) {
            return true;
        }
        return $this->entrepots()->where('entrepots.id', $entrepotId)->exists();
    }

    /**
     * Relations
     */
    public function entrepots()
    {
        return $this->belongsToMany(Entrepot::class, 'entrepot_users');
    }

    public function entrepotsResponsable()
    {
        return $this->hasMany(Entrepot::class, 'responsable_id');
    }

    public function mouvements()
    {
        return $this->hasMany(MouvementStock::class);
    }

    public function sendPasswordResetNotification($token): void
    {
        $this->notify(new ResetPasswordNotification($token));
    }
}
