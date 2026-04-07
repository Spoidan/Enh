<!DOCTYPE html>
<html lang="fr" class="h-full">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="theme-color" content="#0f172a">
    <title>Mot de passe oublié — CDS_Stock Management</title>
    <link rel="manifest" href="/manifest.json">
    <script src="https://cdn.tailwindcss.com"></script>
    <script defer src="https://cdn.jsdelivr.net/npm/alpinejs@3.x.x/dist/cdn.min.js"></script>
    <style>[x-cloak]{display:none!important}</style>
</head>
<body class="h-full flex items-center justify-center p-4" style="background:linear-gradient(135deg,#0f172a 0%,#1e293b 60%,#0f172a 100%)">

    <div class="w-full max-w-md">
        <!-- Logo & Titre -->
        <div class="text-center mb-8">
            <div class="inline-flex items-center justify-center mb-4">
                <img src="/logo.png" alt="CDS_Stock Management" class="h-20 object-contain drop-shadow-lg">
            </div>
            <h1 class="text-2xl font-bold text-white">CDS_Stock Management</h1>
            <p class="text-slate-400 text-sm mt-1">Réinitialisation du mot de passe</p>
        </div>

        <!-- Carte -->
        <div class="bg-white rounded-2xl shadow-2xl p-8">
            <div class="flex items-center gap-3 mb-6">
                <div class="h-10 w-10 rounded-full bg-teal-100 flex items-center justify-center flex-shrink-0">
                    <svg class="h-5 w-5 text-teal-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z"/>
                    </svg>
                </div>
                <div>
                    <h2 class="text-lg font-semibold text-gray-900">Mot de passe oublié ?</h2>
                    <p class="text-sm text-gray-500">Entrez votre email pour recevoir un lien</p>
                </div>
            </div>

            @if(session('success'))
            <div class="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg flex items-start gap-3">
                <svg class="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                </svg>
                <p class="text-sm text-green-800">{{ session('success') }}</p>
            </div>
            @endif

            <form method="POST" action="{{ route('password.email') }}" x-data="{ loading: false }" @submit="loading = true">
                @csrf

                <div class="mb-5">
                    <label for="email" class="block text-sm font-medium text-gray-700 mb-1.5">
                        Adresse email
                    </label>
                    <input
                        type="email"
                        id="email"
                        name="email"
                        value="{{ old('email') }}"
                        autocomplete="email"
                        required
                        autofocus
                        class="w-full h-11 px-4 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 {{ $errors->has('email') ? 'border-red-400 bg-red-50' : 'border-gray-300' }}"
                        placeholder="votre@email.com"
                    >
                    @error('email')
                        <p class="mt-1 text-xs text-red-600">{{ $message }}</p>
                    @enderror
                </div>

                <button
                    type="submit"
                    :disabled="loading"
                    class="w-full h-11 text-white text-sm font-semibold rounded-lg transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                    style="background:#0d9488" onmouseover="this.style.background='#0f766e'" onmouseout="this.style.background='#0d9488'"
                >
                    <svg x-show="loading" x-cloak class="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span x-show="!loading">Envoyer le lien de réinitialisation</span>
                    <span x-show="loading" x-cloak>Envoi en cours...</span>
                </button>
            </form>
        </div>

        <div class="mt-4 text-center">
            <a href="{{ route('login') }}" class="text-slate-400 hover:text-white text-sm transition-colors">
                &larr; Retour à la connexion
            </a>
        </div>

        <p class="text-center text-slate-500 text-xs mt-4">
            © {{ date('Y') }} CDS_Stock Management
        </p>
    </div>
</body>
</html>
