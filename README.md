# API Backend - Plateforme Permis

Backend Node.js/Express pour la gestion des examens de permis de conduire.

## Installation

### Prérequis
- Node.js (v16+)
- MariaDB/MySQL
- npm

### Étapes d'installation

1. **Installer les dépendances**
```bash
npm install
```

2. **Créer la base de données MariaDB**
```bash
mysql -u root -p < database.sql
```

3. **Configurer le fichier .env**
```bash
cp .env.example .env
```

Ensuite, éditez le fichier `.env` avec vos paramètres:
```
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=permis
PORT=5000
JWT_SECRET=your_secret_key_change_in_production
JWT_EXPIRE=7d
UPLOADS_DIR=./uploads
```

4. **Démarrer le serveur**
```bash
# Mode développement (avec rechargement automatique)
npm run dev

# Mode production
npm start
```

Le serveur démarre sur `http://localhost:5000`

## Structure du projet

```
permis-backend/
├── controllers/          # Logique métier
│   ├── usersController.js
│   ├── adminsController.js
│   ├── examsController.js
│   └── submissionsController.js
├── routes/              # Routes API
│   ├── users.js
│   ├── admins.js
│   └── submissions.js
├── middlewares/         # Middlewares
│   └── auth.js
├── uploads/             # Fichiers uploadés
├── db.js               # Configuration base de données
├── server.js           # Point d'entrée
└── database.sql        # Schéma base de données
```

## Documentation API

### Authentification

Toutes les routes protégées nécessitent un header `Authorization` avec un token JWT:
```
Authorization: Bearer YOUR_JWT_TOKEN
```

### Routes Publiques

#### 1. Inscription utilisateur
```
POST /users/register
Content-Type: application/json

{
  "nom": "John Doe",
  "email": "john@example.com",
  "telephone": "0123456789",
  "password": "password123",
  "confirm_password": "password123"
}

Response (201):
{
  "message": "Utilisateur enregistré avec succès"
}
```

#### 2. Connexion utilisateur
```
POST /users/login
Content-Type: application/json

{
  "email": "john@example.com",
  "password": "password123"
}

Response (200):
{
  "message": "Connexion réussie",
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "id": 1,
    "nom": "John Doe",
    "email": "john@example.com",
    "telephone": "0123456789"
  }
}
```

#### 3. Inscription administrateur
```
POST /admins/register
Content-Type: application/json

{
  "nom": "Admin User",
  "email": "admin@example.com",
  "password": "password123",
  "confirm_password": "password123"
}

Response (201):
{
  "message": "Administrateur enregistré avec succès"
}
```

#### 4. Connexion administrateur
```
POST /admins/login
Content-Type: application/json

{
  "email": "admin@example.com",
  "password": "password123"
}

Response (200):
{
  "message": "Connexion réussie",
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "admin": {
    "id": 1,
    "nom": "Admin User",
    "email": "admin@example.com"
  }
}
```

#### 5. Récupérer tous les examens disponibles
```
GET /admins/exams/public/all

Response (200):
[
  {
    "id": 1,
    "titre": "Examen Code 1",
    "description": "Test de connaissance du code de la route",
    "nombre_questions": 40,
    "question_count": 40
  }
]
```

#### 6. Récupérer les détails d'un examen
```
GET /admins/exams/public/:examId

Response (200):
{
  "id": 1,
  "titre": "Examen Code 1",
  "description": "...",
  "nombre_questions": 40,
  "questions": [
    {
      "id": 1,
      "exam_id": 1,
      "numero": 1,
      "image_path": "uploads/exams/1/image-123.jpg",
      "options": [
        {
          "id": 1,
          "letter": "A",
          "position": 1
        },
        {
          "id": 2,
          "letter": "B",
          "position": 2
        }
      ]
    }
  ]
}
```

### Routes Protégées (Utilisateurs)

#### 7. Récupérer le profil utilisateur
```
GET /users/profile
Authorization: Bearer {token}

Response (200):
{
  "id": 1,
  "nom": "John Doe",
  "email": "john@example.com",
  "telephone": "0123456789",
  "created_at": "2024-03-05T12:00:00.000Z"
}
```

#### 8. Mettre à jour le profil utilisateur
```
PUT /users/profile
Authorization: Bearer {token}
Content-Type: application/json

{
  "nom": "John Updated",
  "telephone": "0987654321"
}

Response (200):
{
  "message": "Profil mis à jour avec succès"
}
```

#### 9. Démarrer un examen
```
POST /submissions/exams/:examId/start
Authorization: Bearer {token}

Response (200):
{
  "message": "Examen commencé",
  "submission": {
    "id": 1,
    "user_id": 1,
    "exam_id": 1,
    "status": "en_cours"
  },
  "exam": {
    "id": 1,
    "titre": "Examen Code 1",
    "nombre_questions": 40
  }
}
```

#### 10. Sauvegarder une réponse
```
POST /submissions/answers/save
Authorization: Bearer {token}
Content-Type: application/json

{
  "submission_id": 1,
  "question_id": 1,
  "selected_options": [1, 2]
}

Response (200):
{
  "message": "Réponse sauvegardée",
  "is_correct": true
}
```

#### 11. Soumettre l'examen
```
POST /submissions/exams/submit
Authorization: Bearer {token}
Content-Type: application/json

{
  "submission_id": 1
}

Response (200):
{
  "message": "Examen soumis avec succès",
  "score": 35,
  "total": 40,
  "percentage": 87.5
}
```

#### 12. Récupérer l'historique des soumissions
```
GET /submissions/submissions
Authorization: Bearer {token}

Response (200):
[
  {
    "id": 1,
    "exam_id": 1,
    "titre": "Examen Code 1",
    "score": 35,
    "score_total": 40,
    "percentage": 87.5,
    "status": "soumis",
    "submitted_at": "2024-03-05T13:00:00.000Z"
  }
]
```

#### 13. Récupérer les détails d'une soumission
```
GET /submissions/submissions/:submissionId
Authorization: Bearer {token}

Response (200):
{
  "submission": {
    "id": 1,
    "user_id": 1,
    "exam_id": 1,
    "status": "soumis",
    "score": 35,
    "score_total": 40
  },
  "answers": [
    {
      "id": 1,
      "submission_id": 1,
      "question_id": 1,
      "numero": 1,
      "selected_letters": "A,B",
      "is_correct": 1
    }
  ]
}
```

### Routes Protégées (Administrateurs)

#### 14. Récupérer le profil administrateur
```
GET /admins/profile
Authorization: Bearer {token}

Response (200):
{
  "id": 1,
  "nom": "Admin User",
  "email": "admin@example.com",
  "created_at": "2024-03-05T10:00:00.000Z"
}
```

#### 15. Créer un examen
```
POST /admins/exams
Authorization: Bearer {token}
Content-Type: application/json

{
  "titre": "Examen Code 1",
  "description": "Test de connaissance du code de la route",
  "nombre_questions": 40
}

Response (201):
{
  "message": "Examen créé avec succès",
  "exam_id": 1
}
```

#### 16. Récupérer les examens d'un administrateur
```
GET /admins/exams
Authorization: Bearer {token}

Response (200):
[
  {
    "id": 1,
    "titre": "Examen Code 1",
    "description": "...",
    "question_count": 0
  }
]
```

#### 17. Ajouter une question avec image
```
POST /admins/exams/:examId/questions
Authorization: Bearer {token}
Content-Type: multipart/form-data

Form Data:
- exam_id: 1
- numero: 1
- image: [fichier image]

Response (201):
{
  "message": "Question ajoutée avec succès",
  "question_id": 1,
  "image_path": "uploads/exams/1/image-123.jpg"
}
```

#### 18. Ajouter les options de réponse
```
POST /admins/exams/:examId/questions/:questionId/options
Authorization: Bearer {token}
Content-Type: application/json

{
  "question_id": 1,
  "options": [
    {
      "letter": "A",
      "is_correct": false
    },
    {
      "letter": "B",
      "is_correct": true
    },
    {
      "letter": "C",
      "is_correct": false
    },
    {
      "letter": "D",
      "is_correct": false
    }
  ]
}

Response (200):
{
  "message": "Options de réponse ajoutées avec succès"
}
```

#### 19. Supprimer un examen
```
DELETE /admins/exams/:examId
Authorization: Bearer {token}

Response (200):
{
  "message": "Examen supprimé avec succès"
}
```

#### 20. Récupérer les soumissions pour un examen
```
GET /admins/exams/:examId/submissions
Authorization: Bearer {token}

Response (200):
[
  {
    "id": 1,
    "user_id": 1,
    "exam_id": 1,
    "nom": "John Doe",
    "email": "john@example.com",
    "score": 35,
    "score_total": 40,
    "percentage": 87.5,
    "status": "soumis",
    "submitted_at": "2024-03-05T13:00:00.000Z"
  }
]
```

## Codes d'erreur

- `200` - Succès
- `201` - Créé
- `400` - Requête invalide
- `401` - Non authentifié
- `403` - Accès refusé
- `404` - Non trouvé
- `409` - Conflit (email déjà utilisé)
- `500` - Erreur serveur

## Sécurité

- Les mots de passe sont hashés avec bcrypt
- Les tokens JWT expirent après 7 jours
- Les routes protégées nécessitent un token valide
- Les images sont uploadées dans des dossiers isolés
- Limites de taille de fichier: 10MB

## Développement

### Env de développement
```bash
npm run dev
```

Le serveur redémarrera automatiquement lors des modifications de fichiers.

### Logs
Les erreurs sont loggées dans la console pour faciliter le débogage.

## License

MIT
"# permis-backend" 
