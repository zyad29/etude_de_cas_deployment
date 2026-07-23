# Guide de déploiement — Visiplus (Jaydee Kanban)

> Document complété au fil des étapes du projet.
> Reste à ajouter : sécurisation (étape 6).

## Prérequis techniques

- **Node.js 20** (pour le développement local sans Docker)
- **Docker** et **Docker Compose** (pour l'exécution conteneurisée)
- Un fichier `.env` à la racine (voir section Variables d'environnement ci-dessous)

## Variables d'environnement

| Variable | Description | Exemple |
|---|---|---|
| `NODE_ENV` | Environnement d'exécution | `development` / `production` |
| `PORT` | Port d'écoute du serveur | `3000` |
| `MONGODB_URI` | URI de connexion MongoDB | `mongodb://localhost:27017/visiplus` |
| `JWT_SECRET` | Clé de signature des tokens (min. 32 caractères) | à générer, jamais commitée |
| `JWT_EXPIRES_IN` | Durée de validité des tokens | `7d` |
| `CORS_ORIGIN` | Origine(s) autorisée(s) pour le CORS | `*` |

## Exécution en local (sans Docker)

```bash
npm install
npm run dev
```
Nécessite une instance MongoDB accessible localement (voir `MONGODB_URI` dans `.env`).

## Commandes de test

```bash
npm test
```
Exécute l'ensemble des tests d'intégration (Vitest + Supertest) sur une instance MongoDB **en mémoire** (MongoDB Memory Server) : aucune base de données locale ou distante n'est nécessaire pour lancer les tests.

Au tout premier lancement, le binaire MongoDB (~600 Mo) est téléchargé et mis en cache localement — ce qui peut prendre quelques minutes selon la connexion. Les lancements suivants réutilisent ce cache et sont rapides.

```bash
npm run test:coverage
```
Génère un rapport de couverture de code (formats texte, JSON et HTML).

## Procédure de mise à jour

Pour déployer une nouvelle version de l'application :

1. Récupérer les derniers changements (`git pull`) et vérifier que les tests passent en local (`npm test`).
2. Reconstruire l'image Docker avec les changements :
   ```bash
   docker compose up --build
   ```
   Le flag `--build` force la reconstruction de l'image (sinon Docker réutiliserait l'ancienne image en cache).
3. Vérifier que le service répond correctement après redémarrage :
   ```bash
   curl http://localhost:3000/health
   ```
4. En cas de changement de schéma de données ou de variables d'environnement, mettre à jour le `.env` (ou les secrets CI/CD) **avant** de relancer le déploiement.

En environnement avec pipeline CI/CD (voir `CI_CD_STRATEGIE.md`), ces étapes sont automatisées à chaque merge sur `main`.

## Exécution avec Docker (recommandé)

### Pourquoi la conteneurisation

L'application est packagée avec Docker pour garantir un environnement d'exécution **identique** entre les postes de développement, l'intégration continue et la production — évitant les écarts de version de Node.js ou de configuration système ("ça marche sur ma machine").

### Architecture Docker

Le projet utilise deux fichiers :

- **`Dockerfile`** : image de l'application, construite en **deux étapes (multi-stage build)** :
  1. **Étape `build`** : installe toutes les dépendances (y compris TypeScript) et compile `src/` en JavaScript dans `dist/` via `npm run build`.
  2. **Étape `production`** : repart d'une image Node.js neuve et légère, installe uniquement les dépendances de production, puis copie le `dist/` compilé depuis l'étape précédente.

  Ce découpage permet d'obtenir une image finale plus légère (sans TypeScript ni dépendances de développement), tout en gardant un processus de build reproductible.

- **`docker-compose.yml`** : orchestre deux services ensemble :
  - `app` : l'application Node.js (construite à partir du `Dockerfile`)
  - `mongo` : une instance MongoDB officielle, avec un volume persistant (`mongo-data`) pour conserver les données entre les redémarrages

### Lancer le projet avec Docker

```bash
docker compose up --build
```

Cette commande construit l'image de l'application et démarre les deux conteneurs (`visiplus-app` et `visiplus-mongo`) sur le même réseau Docker, déjà configurés pour communiquer entre eux (`MONGODB_URI: mongodb://mongo:27017/visiplus`).

### Vérifier que tout fonctionne

```bash
curl http://localhost:3000/health
```
Réponse attendue :
```json
{"status":"ok","timestamp":"..."}
```

### Arrêter les conteneurs

```bash
docker compose down
```
(Ajouter `-v` pour aussi supprimer le volume `mongo-data`, donc les données MongoDB.)

### Notes et points de vigilance

- Le fichier `.env` n'est **jamais copié dans l'image** (exclu via `.dockerignore`) : les variables sont injectées via `docker-compose.yml` ou l'environnement, jamais en dur dans l'image.
- Le `JWT_SECRET` utilisé par défaut dans `docker-compose.yml` est une valeur de démonstration ; en production, il doit être surchargé via une variable d'environnement réelle.
- Si un conteneur MongoDB local (hors Compose) tourne déjà sur le port `27017`, il doit être arrêté avant de lancer `docker compose up`, sous peine de conflit de port.

---

## CI/CD

Le pipeline (détaillé dans `CI_CD_STRATEGIE.md`) s'exécute automatiquement à chaque `push` et `pull_request` :
1. Installation des dépendances (`npm install`)
2. Tests d'intégration (`npm test`)
3. Build TypeScript (`npm run build`)
4. Déploiement (build de l'image Docker), uniquement sur `main` et si les étapes précédentes ont réussi

Les secrets (`JWT_SECRET`, `MONGODB_URI` de production) sont gérés via les secrets chiffrés de la plateforme CI, jamais commitées dans le dépôt.

## Sécurisation

*À compléter à l'étape 6.*