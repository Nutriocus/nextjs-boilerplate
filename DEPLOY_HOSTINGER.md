# Déploiement NUTRIOCUS sur Hostinger
**Domaine :** https://plateforme.nutriocus.com

---

## ÉTAPE 1 — Préparer Supabase (dashboard Supabase)

Avant tout, configurez Supabase pour votre domaine de production :

1. Allez sur [supabase.com](https://supabase.com) → votre projet
2. **Authentication > URL Configuration** :
   - Site URL : `https://plateforme.nutriocus.com`
   - Redirect URLs → Ajouter : `https://plateforme.nutriocus.com/auth/callback`
3. **Authentication > Email Templates** → vérifier que le lien magic link pointe bien vers votre domaine
4. **SQL Editor** → exécuter `supabase/schema.sql` puis `supabase/seed.sql`

---

## ÉTAPE 2 — Préparer votre repo GitHub

### Sur votre machine locale :

```bash
cd /Users/florianmouchel/nutriocus

# Initialiser git (si pas encore fait)
git init
git add .
git commit -m "Initial NUTRIOCUS commit"

# Créer un repo sur github.com, puis :
git remote add origin https://github.com/VOTRE_USERNAME/nutriocus.git
git branch -M main
git push -u origin main
```

> ⚠️ Le fichier `.env.production` est dans `.gitignore` — ne le commitez jamais.

---

## ÉTAPE 3 — Configurer l'app sur Hostinger (hPanel)

1. Connectez-vous sur [hpanel.hostinger.com](https://hpanel.hostinger.com)
2. Allez dans **Hébergement** → votre hébergement → **Node.js**
3. Configurez :
   - **Node.js version** : 20.x (LTS recommandé)
   - **Application root** : `nutriocus` (ou le chemin de votre dossier)
   - **Application URL** : `plateforme.nutriocus.com`
   - **Application startup file** : `server.js`
4. Cliquez **Save**

---

## ÉTAPE 4 — Se connecter en SSH à Hostinger

Dans hPanel → **SSH Access** → récupérez :
- Host SSH (ex: `srv123.hostinger.com` ou l'IP)
- Port SSH (généralement `65002` sur Hostinger)
- Nom d'utilisateur

```bash
# Depuis votre terminal local :
ssh -p 65002 u123456789@srv123.hostinger.com
# (remplacez par vos vraies infos SSH Hostinger)
```

---

## ÉTAPE 5 — Cloner et configurer sur le serveur

Une fois connecté en SSH, exécutez ces commandes **dans l'ordre** :

```bash
# 1. Aller dans le dossier home de votre hébergement
cd ~/domains/plateforme.nutriocus.com/public_html
# OU selon l'arborescence Hostinger :
cd ~/nutriocus  # si configuré comme application root

# 2. Cloner votre repo GitHub
git clone https://github.com/VOTRE_USERNAME/nutriocus.git .

# 3. Vérifier la version de Node.js
node --version  # doit être 18+ idéalement 20

# 4. Créer le fichier d'environnement de production
# (ne peut pas venir de GitHub — contient vos clés secrètes)
nano .env.production
```

Dans nano, collez ceci avec VOS vraies valeurs :
```
NEXT_PUBLIC_SUPABASE_URL=https://VOTRE_PROJECT_ID.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=VOTRE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY=VOTRE_SERVICE_ROLE_KEY
NEXT_PUBLIC_APP_URL=https://plateforme.nutriocus.com
NODE_ENV=production
```
Sauvez avec `Ctrl+O` → `Entrée` → `Ctrl+X`

```bash
# 5. Installer les dépendances
npm install

# 6. Builder l'application Next.js
npm run build
# ⏳ Cette étape prend 1-3 minutes

# 7. Tester que le serveur démarre correctement
node server.js
# Vous devriez voir : > NUTRIOCUS ready on http://0.0.0.0:XXXX
# Ctrl+C pour arrêter le test
```

---

## ÉTAPE 6 — Démarrer l'app depuis hPanel

Retournez dans hPanel → **Node.js** → cliquez **Restart** (ou **Start**).

Hostinger lance automatiquement `node server.js` et redirige le trafic de `plateforme.nutriocus.com` vers votre app.

---

## ÉTAPE 7 — Vérification

1. Ouvrez https://plateforme.nutriocus.com
2. Vous devriez voir la page d'accueil NUTRIOCUS
3. Testez la connexion magic link avec votre email coach

---

## Mises à jour futures (workflow)

À chaque modification du code :

```bash
# Depuis votre machine locale :
git add .
git commit -m "Description de la modification"
git push origin main

# Depuis le serveur SSH :
cd ~/nutriocus  # ou votre chemin
git pull origin main
npm run build   # rebuild Next.js
```

Puis dans hPanel → **Node.js** → **Restart**.

---

## Dépannage courant

| Problème | Solution |
|----------|----------|
| Page blanche | Vérifier les logs : `cat ~/.pm2/logs/nutriocus-error.log` |
| Erreur Supabase | Vérifier que les clés dans `.env.production` sont correctes |
| 502 Bad Gateway | Redémarrer l'app dans hPanel → Node.js → Restart |
| Auth magic link ne marche pas | Vérifier Supabase → Auth → Site URL = `https://plateforme.nutriocus.com` |
| `npm run build` échoue | Vérifier la version Node : `node --version` (besoin de 18+) |

---

## Variables d'environnement dans hPanel (alternative au fichier)

Si Hostinger le propose, vous pouvez aussi saisir les variables directement dans hPanel :
- **hPanel → Node.js → Environment Variables**
- Ajouter chaque variable une par une (plus sécurisé que le fichier `.env.production`)
