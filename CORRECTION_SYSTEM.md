# Guide d'Installation - Système de Correction Automatique

## Vue d'ensemble

Le système de correction automatique permet:
- ✅ **Correction instantanée** des examens basée sur le fichier `correction.js`
- 📊 **Calcul automatique** des notes et pourcentages
- 💾 **Enregistrement** des résultats en base de données MariaDB
- 📈 **Analyse détaillée** des réponses correctes vs. incorrectes

## Étapes d'installation

### 1. Créer la table `submissions` en base de données

```bash
# Via MySQL/MariaDB CLI
mysql -u root -p permis < migrations/create_submissions_table.sql

# Ou exécuter manuellement le SQL desde un client MySQL
```

Ou exécuter directement le script SQL:

```sql
-- Créer la table submissions
CREATE TABLE IF NOT EXISTS submissions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  exam_code VARCHAR(5) NOT NULL,
  answers JSON NOT NULL,
  correct_count INT NOT NULL,
  total_count INT NOT NULL DEFAULT 25,
  percentage INT NOT NULL,
  submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  INDEX idx_user_id (user_id),
  INDEX idx_exam_code (exam_code),
  INDEX idx_submitted_at (submitted_at),
  UNIQUE INDEX idx_user_exam_time (user_id, exam_code, submitted_at)
);

-- Ajouter colonne is_passed (note: GENERATED ALWAYS AS ... STORED pour MariaDB)
ALTER TABLE submissions ADD COLUMN IF NOT EXISTS is_passed BOOLEAN DEFAULT FALSE;
```

### 2. Backend Node.js

Le backend est prêt avec:
- ✅ `correction.js` - Fichier avec les bonnes réponses (B01-B12)
- ✅ `controllers/submissionsController.js` - Logique de correction
- ✅ `routes/submissions.js` - Endpoints de soumission
- ✅ `examsStaticController.js` - Serveur d'images statiques

Vérifiez que `server.js` inclut:

```javascript
const submissionsRoutes = require("./routes/submissions");
app.use("/submissions", submissionsRoutes);
```

### 3. Mobile (React Native Expo)

Les écrans sont mis à jour pour:
- **ExamScreen.js** - Envoie les réponses au backend pour correction
- **ResultScreen.js** - Affiche les résultats détaillés avec les bonnes réponses

L'userId est actuellement codé en dur (`userId = 1`). À modifier:

```javascript
// TODO: Récupérer depuis AuthContext
import { useContext } from 'react';
import { AuthContext } from '../context/AuthContext';

// Dans le composant:
const { userId } = useContext(AuthContext);
```

## Structure des Données

### Format d'envoi (ExamScreen → Backend)

```javascript
{
  userId: 1,
  examCode: 'B01',
  answers: {
    1: ['A'],
    2: ['B'],
    3: ['A', 'C'],
    // ...
    25: ['B']
  }
}
```

### Format de correction (Backend)

```javascript
{
  correctCount: 20,
  totalQuestions: 25,
  percentage: 80,
  isPassed: true,
  details: [
    {
      questionNum: 1,
      correctAnswers: ['A'],
      userAnswers: ['A'],
      isCorrect: true
    },
    // ...
  ]
}
```

### Table `submissions`

```
id              | user_id | exam_code | answers (JSON) | correct_count | total_count | percentage | is_passed | submitted_at
1               | 1       | B01       | {...}          | 20            | 25          | 80         | 1         | 2026-03-05...
```

## Endpoints API

### POST `/submissions/submit`
Soumettre un examen et obtenir la correction automatique

**Requête:**
```json
{
  "userId": 1,
  "examCode": "B01",
  "answers": {
    "1": ["A"],
    "2": ["B"]
  }
}
```

**Réponse:**
```json
{
  "success": true,
  "data": {
    "examCode": "B01",
    "correctCount": 20,
    "totalQuestions": 25,
    "percentage": 80,
    "isPassed": true,
    "details": [...]
  }
}
```

### GET `/submissions/user/:userId`
Récupérer tous les résultats d'un utilisateur

**Réponse:**
```json
{
  "success": true,
  "data": {
    "totalSubmissions": 5,
    "results": [
      {
        "id": 1,
        "exam_code": "B01",
        "correct_count": 20,
        "percentage": 80,
        "submitted_at": "2026-03-05T10:30:00Z"
      }
    ]
  }
}
```

### GET `/submissions/result/:userId/:examCode`
Récupérer le dernier résultat d'un examen spécifique

## Comment Fonctionne la Correction

1. **Utilisateur** soumet ses réponses depuis `ExamScreen`
2. **Backend** reçoit les réponses et compare avec `correction.js`
3. **Chaque question** est vérifiée:
   - Les réponses doivent correspondre EXACTEMENT
   - Ordre et complétude importent
4. **Score** est calculé: `(bonnes réponses / total) × 100`
5. **Statut** `isPassed` si `percentage >= 80`
6. **Résultats** enregistrés dans la table `submissions`
7. **Mobile** reçoit les détails et affiche les résultats

## Fichier de Correction

Le fichier `correction.js` contient les bonnes réponses pour les 12 examens:

```javascript
corrections = {
  B01: ['BD', 'AD', 'B', 'BC', 'B', ...], // 25 questions
  B02: ['AD', 'BD', 'BD', 'B', 'AD', ...],
  // ... B03 à B12
}
```

Chaque chaîne représente les lettres correctes (ex: 'BD' = B et D sont bonnes).

### Modifier les bonnes réponses:

```javascript
// Avant de modifier, faire une sauvegarde:
corrections.B01[0] = 'ABC'; // Ajouter C à la question 1
```

## Dépannage

### Test de l'API
```bash
# Soumettre un examen
curl -X POST http://localhost:5000/submissions/submit \
  -H "Content-Type: application/json" \
  -d '{
    "userId": 1,
    "examCode": "B01",
    "answers": {"1": ["A"], "2": ["B"], "3": ["A"]}
  }'

# Récupérer les résultats
curl http://localhost:5000/submissions/user/1
```

### Table non créée?
```sql
SHOW TABLES;
DESC submissions;
```

### Résultats non enregistrés?
Vérifier les logs du backend:
```bash
npm run dev
# Chercher les erreurs SQL ou de logique
```

## Schéma Base de Données

```
Utilisateurs (users)
    ↓
Soumissions (submissions) ← Chaque réponse à un examen
    ├── user_id (FK)
    ├── exam_code (B01-B12)
    ├── answers (JSON avec les choix)
    ├── correct_count (résultat de la correction)
    ├── percentage (note en %)
    └── is_passed (boolean: >= 80%)
```

## Prochaines Améliorations

- [ ] Authentification (userId depuis JWT token)
- [ ] Historique des tentatives par examen
- [ ] Comparaison des résultats avec la moyennenationale
- [ ] Notifications de progression
- [ ] Détails question-par-question sur les erreurs
- [ ] Export PDF des résultats
