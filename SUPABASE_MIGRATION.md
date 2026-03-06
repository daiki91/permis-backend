# Migration vers Supabase PostgreSQL

Ce document décrit la migration du backend de MariaDB local vers Supabase PostgreSQL.

## 📋 Changements effectués

### 1. **Dépendances**
- ✅ Suppression de `mysql2`
- ✅ Ajout de `pg` (8.11.3)
- ✅ `@supabase/supabase-js` (déjà présent)

### 2. **Configuration de connexion (db.js)**
- ✅ Migration de `mysql2/promise` vers `pg`
- ✅ Création d'une couche d'abstraction pour compatibilité backward
- ✅ Support automatique de conversion des paramètres `?` vers `$1, $2` (PostgreSQL)
- ✅ Gestion SSL pour connexion sécurisée Supabase

### 3. **Script d'initialisation (database_init.js)**
- ✅ Conversion de la syntaxe MySQL vers PostgreSQL
- ✅ Remplacement `INT AUTO_INCREMENT` par `SERIAL`
- ✅ Remplacement `JSON` par `JSONB` (mieux optimisé)
- ✅ Triggers pour gestion des `updated_at` (remplace `ON UPDATE CURRENT_TIMESTAMP`)
- ✅ Connections sans création de DB (déjà créée sur Supabase)

### 4. **Code des contrôleurs**
- ✅ Remplacement `execute()` par `query()` (compatible PostgreSQL)
- ✅ Format des requêtes déjà compatible grâce à la couche d'abstraction

### 5. **Variables d'environnement (.env)**
```bash
# Connexion directe Supabase PostgreSQL
DATABASE_URL=postgresql://postgres:P%40sser2022daiki@db.jbnlncweknkqjhuuqfaw.supabase.co:5432/postgres
DB_HOST=db.jbnlncweknkqjhuuqfaw.supabase.co
DB_USER=postgres
DB_PASSWORD=P@sser2022daiki
DB_NAME=postgres
DB_PORT=5432

# Clés Supabase
SUPABASE_URL=https://jbnlncweknkqjhuuqfaw.supabase.co
SUPABASE_ANON_KEY=sb_publishable_qJ6-dUpGNWpRR-Eei6IQ7w_18lxcW2u
```

**⚠️ Important:** Le `@` du mot de passe doit être encodé en `%40` dans DATABASE_URL!

## 🚀 Installation

### Étape 1: Installer les dépendances
```bash
cd permis-backend
npm install
```

### Étape 2: Initialiser la base de données
```bash
node database_init.js
```

Vous devriez voir:
```
🗄️  INITIALISATION SUPABASE PostgreSQL
═══════════════════════════════════════════════════════════════════

Configuration:
  Database URL: ✓ Configuré
  Host: db.jbnlncweknkqjhuuqfaw.supabase.co
  User: postgres
  Database: postgres

🔄 Connexion à Supabase PostgreSQL...
✓ Connecté à Supabase PostgreSQL

🔄 Création des tables...
  ✓ CREATE TABLE: "users"
  ✓ CREATE TABLE: "admins"
  ✓ CREATE TABLE: "submissions"
  ✓ CREATE TABLE: "sessions"
  ✓ CREATE TABLE: "exam_progress"
  ✓ CREATE TABLE: "audit_log"
  ✓ CREATE FUNCTION: "update_updated_at_column"
  ✓ CREATE TRIGGER: "update_users_updated_at"
  ...

📊 Tables dans la base de données:
  • admins
  • audit_log
  • exam_progress
  • sessions
  • submissions
  • users

✅ Base de données initialisée avec succès!
```

### Étape 3: Lancer le backend
```bash
npm run dev
```

Vous devriez voir:
```
✓ Connecté à Supabase PostgreSQL
Serveur lancé sur https://permis-backend-6ddi.onrender.com/
```

## 🔄 Couche d'abstraction

Le fichier `db.js` contient une couche d'abstraction (`ConnectionWrapper`) qui:

1. **Convertit automatiquement les paramètres**
   - Entrée: `SELECT * FROM users WHERE id = ?`
   - Conversion: `SELECT * FROM users WHERE id = $1`
   - Transparent pour le code des contrôleurs

2. **Simule l'interface mysql2**
   - Les contrôleurs utilisent toujours `pool.getConnection()`
   - Retour toujours au format `[rows, fields]`
   - Aucun changement nécessaire dans les contrôleurs existants

## 📊 Différences PostgreSQL vs MySQL

| Feature | MySQL | PostgreSQL |
|---------|-------|-----------|
| Paramètres | `?` | `$1, $2, ...` |
| Auto-increment | `INT AUTO_INCREMENT` | `SERIAL` / `BIGSERIAL` |
| Booléen | `BOOLEAN` (alias TINYINT) | `BOOLEAN` |
| JSON | `JSON` | `JSON` / `JSONB` |
| Timestamp update | `ON UPDATE CURRENT_TIMESTAMP` | Trigger |
| Données temporelles | `TIMESTAMP` | `TIMESTAMP WITH TIME ZONE` |


## ⚙️ Configuration Supabase

### Infos du projet
- **URL**: https://jbnlncweknkqjhuuqfaw.supabase.co
- **Projet**: daiki91's Project
- **Host**: db.jbnlncweknkqjhuuqfaw.supabase.co
- **User**: postgres
- **Password**: P@sser2022daiki
- **Port**: 5432
- **Database**: postgres

### Connexion directe
```bash
psql "postgresql://postgres:P%40sser2022daiki@db.jbnlncweknkqjhuuqfaw.supabase.co:5432/postgres"
```

⚠️ **Important:** Le `@` du mot de passe doit être encodé en `%40` dans la connection string!

## 🔐 Sécurité

- ✅ Connexion SSL activée en production
- ✅ Connection pooling (max 20 connexions)
- ✅ Timeouts configurés (2 sec de timeout de connexion)
- ✅ Variables d'environnement sécurisées (.env ignoré par git)

## 🐛 Troubleshooting

### Erreur: "connect ECONNREFUSED"
- Vérifier que `DATABASE_URL` est correct dans `.env`
- Vérifier la connexion internet
- Vérifier les IPs autorisées sur Supabase (Project Settings → Security)

### Erreur: "invalid input syntax for integer"
- Vérifier que les IDs sont bien des nombres
- PostgreSQL est plus strict que MySQL sur les types

### Erreur: "permission denied"
- Vérifier l'utilisateur PostgreSQL et le mot de passe
- Vérifier que l'utilisateur a les permissions sur la base `postgres`

## 📚 Ressources

- [Supabase Docs](https://supabase.com/docs)
- [PostgreSQL Docs](https://www.postgresql.org/docs/)
- [Node pg Driver](https://github.com/brianc/node-postgres)
