# NUTRIOCUS — Plateforme de Coaching Nutritionnel

Plateforme web full-stack de coaching nutritionnel pour athlètes d'endurance.

## Stack technique

- **Frontend** : Next.js 14 (App Router) + TypeScript
- **Styles** : Tailwind CSS + Framer Motion
- **Base de données** : Supabase (PostgreSQL)
- **Auth** : Supabase Auth (magic link)
- **Charts** : Recharts
- **Hébergement** : Vercel

## Démarrage rapide

### 1. Installer Node.js

```bash
# Via Homebrew (recommandé Mac)
brew install node

# Via NVM
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
nvm install 20
nvm use 20
```

### 2. Installer les dépendances

```bash
cd nutriocus
npm install
```

### 3. Configurer Supabase

1. Créer un projet sur [supabase.com](https://supabase.com)
2. Copier vos clés dans `.env.local` :

```bash
NEXT_PUBLIC_SUPABASE_URL=https://VOTRE_PROJECT_ID.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=VOTRE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY=VOTRE_SERVICE_ROLE_KEY
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

3. Exécuter le schema dans Supabase SQL Editor :
   - Ouvrir `supabase/schema.sql` → copier → coller dans l'éditeur SQL Supabase
   - Exécuter `supabase/seed.sql` pour les données de démo

4. Configurer l'auth Supabase :
   - Authentication > Settings > Site URL = `http://localhost:3000`
   - Authentication > Email Templates → personnaliser le magic link

### 4. Lancer le développement

```bash
npm run dev
```

Ouvrir [http://localhost:3000](http://localhost:3000)

## Architecture des pages

```
/                          → Page d'accueil
/auth                      → Authentification magic link
/athlete/dashboard         → Tableau de bord athlète
/athlete/questionnaire     → Questionnaire 7 étapes
/athlete/body              → Suivi corporel & IRE
/athlete/physiological     → Profil physiologique & zones
/athlete/energy-log        → Carnet d'énergie
/athlete/sweat-rate        → Taux de sudation
/athlete/race-energy       → Dépenses énergétiques
/athlete/meal-plans        → Plans alimentaires
/athlete/supplements       → Compléments alimentaires
/athlete/shopping          → Listes de courses
/athlete/products          → Produits de l'effort
/athlete/roadmap           → Roadmap de saison
/athlete/race-strategy     → Stratégies de course
/athlete/planning          → Planification hebdomadaire
/athlete/race-reports      → Comptes rendus
/athlete/tests             → Tests à l'effort
/athlete/recipes           → Recettes IA
/athlete/formation         → Formation
/athlete/gpts              → Mes GPTs
/coach                     → Dashboard coach
/coach/athletes            → Liste athlètes
/coach/athletes/[id]       → Profil athlète (vue coach)
```

## Déploiement Vercel

```bash
npx vercel
```

Variables d'environnement à configurer dans Vercel :
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `NEXT_PUBLIC_APP_URL`

## Personnalisation charte graphique

Modifier les variables CSS dans `src/styles/globals.css` :

```css
:root {
  --color-primary: #059669;    /* Vert performance */
  --color-accent: #f97316;     /* Orange effort */
  /* ... */
}
```
