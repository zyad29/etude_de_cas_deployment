# Guide de déploiement -- Visiplus (Jaydee Kanban)

> Document en cours de rédaction, complété au fil des étapes du projet.
> État actuel : partie Docker (étape 3) rédigée. CI/CD (étape 4) et sécurité (étape 6) à ajouter.

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

## Exécution avec Docker (recommandé)

### Pourquoi la conteneurisation

L'application est packagée avec Docker pour garantir un environnement d'exécution **identique** entre les postes de développement, l'intégration continue et la production -- évitant les écarts de version de Node.js ou de configuration système ("ça marche sur ma machine").

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

*À compléter à l'étape 4.*

## Sécurisation

*À compléter à l'étape 6.*