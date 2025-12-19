# GitHub Actions - Xandeum pNodes Crawler

## 📋 Configuration

Ce workflow exécute automatiquement le crawler Xandeum toutes les **10 minutes**.

### 🔐 Secrets requis

Ajoute ces secrets dans ton repo GitHub :

1. **Settings** → **Secrets and variables** → **Actions** → **New repository secret**

2. Ajoute ces 2 secrets :

| Nom | Valeur | Description |
|-----|--------|-------------|
| `SUPABASE_URL` | `https://xxx.supabase.co` | URL de ton projet Supabase |
| `SUPABASE_ANON_KEY` | `eyJhbGc...` | Clé publique (anon) de Supabase |

### ⏱️ Fréquence du cron

**Actuel :** Toutes les 10 minutes (`*/10 * * * *`)

**Pour changer la fréquence :**

```yaml
# Toutes les 5 minutes
- cron: '*/5 * * * *'

# Toutes les 15 minutes
- cron: '*/15 * * * *'

# Toutes les heures
- cron: '0 * * * *'
```

### 🚀 Lancement manuel

Tu peux lancer le crawler manuellement :

1. Va sur **Actions** dans GitHub
2. Clique sur **Xandeum pNodes Crawler**
3. Clique **Run workflow** → **Run workflow**

### 📊 Voir les logs

1. **Actions** → Clique sur un run
2. Clique sur **crawl** job
3. Clique sur **Run pNodes crawler** step

Tu verras :
```
🚀 Starting Xandeum pNodes crawler...
📡 Discovering pNodes...
✅ Metadata discovery complete. Found X versions and Y pubkeys.
💾 Upserting XX pnodes to Supabase...
✅ Successfully upserted XX pnodes
✅ Crawler completed successfully!
```

### 💰 Coût

**100% GRATUIT** sur GitHub Actions (2000 minutes/mois incluses)

- 1 run = ~2-3 minutes
- 6 runs/heure × 24h × 30j = ~12,960 minutes/mois
- **Largement dans la limite gratuite !**

### ⚠️ Limites

- **Timeout :** 10 minutes max par run
- Si le crawler prend plus de 10 min, optimise-le ou augmente le timeout

### 🔧 Troubleshooting

**Erreur "Secrets not found" :**
- Vérifie que tu as bien ajouté `SUPABASE_URL` et `SUPABASE_ANON_KEY` dans les secrets GitHub

**Erreur "npm ci failed" :**
- Vérifie que ton `package-lock.json` est à jour
- Commit et push les changements

**Crawler timeout :**
- Augmente `timeout-minutes: 15` dans le workflow
- Ou optimise le crawler pour aller plus vite
