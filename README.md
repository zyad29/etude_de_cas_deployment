# Visiplus - Kanban Node.js Server

Serveur Express/TypeScript connecté à MongoDB, pour l'application interne de suivi de production **Jaydee Kanban**.

## Contexte

Jaydee, entreprise spécialisée dans la fabrication de pièces plastiques par injection, utilise cette application pour suivre sa production et gérer ses priorités. Ce dépôt documente la mise en production de l'application existante : analyse du code, tests d'intégration, conteneurisation, stratégie CI/CD et sécurisation.

## Structure du projet

```
├── src/
│   ├── main.ts                 # Entrée principale (création du serveur)
│   ├── server.ts               # Configuration Express
│   ├── app.ts                  # Exporte Express app (pour tests)
│   ├── config/
│   │   ├── env.ts              # Chargement et validation des variables d'environnement
│   │   ├── db.ts               # Connexion base de données (Mongoose)
│   │   └── logger.ts           # Logger (Pino)
│   ├── models/
│   │   ├── OF.ts               # Modèle Ordre de Fabrication
│   │   ├── Column.ts           # Modèle Colonne
│   │   └── User.ts             # Modèle Utilisateur
│   ├── routes/
│   │   ├── index.ts            # Regroupe les routes (OF, Columns, Auth)
│   │   ├── ofs.routes.ts
│   │   ├── columns.routes.ts
│   │   └── auth.routes.ts
│   ├── controllers/
│   │   ├── ofs.controller.ts   # Appelle les services (move, create, delete)
│   │   └── columns.controller.ts
│   └── middlewares/
│       ├── auth.middleware.ts  # Vérification JWT
│       ├── error.middleware.ts # Gestion globale des erreurs
│       └── validate.middleware.ts # Validation Zod
├── tests/                      # Tests d'intégration (Vitest + Supertest)
├── Dockerfile
├── docker-compose.yml
├── vitest.config.ts
├── tsconfig.json
└── package.json
```

## Installation et exécution

### Prérequis
- Node.js 20
- Docker et Docker Compose
- npm ou yarn

### En local

1. Installer les dépendances :
```bash
npm install
```

2. Créer un fichier `.env` à la racine du projet :
```env
NODE_ENV=development
PORT=3000
MONGODB_URI=mongodb://localhost:27017/visiplus
JWT_SECRET=your-super-secret-jwt-key-at-least-32-characters-long
JWT_EXPIRES_IN=7d
CORS_ORIGIN=*
```

3. Démarrer une instance MongoDB locale (ou utiliser docker, voir ci-dessous) :
```bash
docker run -d -p 27017:27017 --name mongo-visiplus mongo
```
(Ou toute autre instance MongoDB déjà installée/accessible en local.)

4. Démarrer le serveur en mode développement :
```bash
npm run dev
```

5. Vérifier que le serveur répond :
```bash
curl http://localhost:3000/health
```

### Avec Docker (recommandé)

1. Créer le fichier `.env` (identique à l'étape 2 ci-dessus).

2. Démarrer l'application et MongoDB ensemble :
```bash
docker compose up --build
```

3. Vérifier que le serveur répond :
```bash
curl http://localhost:3000/health
```

### Tests
```bash
npm test              # Lance tous les tests
npm test -- --watch   # Mode watch
```
Utilise MongoDB Memory Server (base en mémoire) — aucune installation MongoDB requise pour les tests. Voir `tests/README.md` pour plus de détails.

### Scripts disponibles

| Commande | Description |
|---|---|
| `npm run dev` | Mode développement avec hot reload (tsx watch) |
| `npm run build` | Compile TypeScript en JavaScript (`dist/`) |
| `npm start` | Démarre en production (nécessite `npm run build` au préalable) |
| `npm test` | Lance les tests avec Vitest |
| `npm run test:coverage` | Génère un rapport de couverture de code |

> Procédure détaillée (installation, Docker, mise à jour) : voir **`DEPLOYMENT_GUIDE.md`**.

## API — endpoints principaux

| Méthode | Route | Description | Auth requise |
|---|---|---|---|
| POST | `/api/auth/register` | Créer un compte | Non |
| POST | `/api/auth/login` | Se connecter | Non |
| GET | `/api/columns` | Lister les colonnes | Oui |
| GET | `/api/columns/:id` | Obtenir une colonne | Oui |
| POST | `/api/columns` | Créer une colonne | Oui |
| PUT | `/api/columns/:id` | Mettre à jour une colonne | Oui |
| DELETE | `/api/columns/:id` | Supprimer une colonne | Oui |
| GET | `/api/ofs` | Lister les OFs (`?columnId=xxx` optionnel) | Oui |
| GET | `/api/ofs/:id` | Obtenir un OF | Oui |
| POST | `/api/ofs` | Créer un OF | Oui |
| PUT | `/api/ofs/:id` | Mettre à jour un OF | Oui |
| PATCH | `/api/ofs/:id/move` | Déplacer un OF | Oui |
| DELETE | `/api/ofs/:id` | Supprimer un OF | Oui |
| GET | `/health` | Vérifier l'état du serveur | Non |

## Choix techniques

- **TypeScript + Express 5 + Mongoose** : typage strict, validation des entrées via **Zod**.
- **Conteneurisation Docker** (multi-stage build) : environnement identique entre dev, CI et production. Détails : `Dockerfile`, `docker-compose.yml`.
- **Tests d'intégration** (Vitest + Supertest + MongoDB Memory Server) : aucune dépendance externe nécessaire pour tester l'API.
- **CI/CD** : pipeline automatisé (install → test → build → déploiement). Détails : `CI_CD_STRATEGIE.md`.

## Sécurité

- **`helmet`** : sécurisation des en-têtes HTTP.
- **`express-rate-limit`** : 100 requêtes/15 min par IP sur `/api/*`, protège notamment l'authentification contre le brute-force.
- Authentification par **JWT**, validation stricte des entrées (Zod), secrets jamais commités (`.env` exclu via `.gitignore`).

> Risques identifiés et limites de l'approche : voir **`NOTE_SECURITE.md`**.

## Documentation complémentaire

| Fichier | Contenu |
|---|---|
| `ANALYSE_EXISTANT.md` | Structure du projet, anomalies et risques constatés à l'analyse initiale |
| `CI_CD_STRATEGIE.md` | Stratégie CI/CD complète (déclencheurs, pipeline, secrets) |
| `NOTE_SECURITE.md` | Risques de sécurité identifiés et mesures appliquées |
| `DEPLOYMENT_GUIDE.md` | Guide de déploiement détaillé (local, Docker, tests, mise à jour) |