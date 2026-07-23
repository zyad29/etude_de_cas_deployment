# Analyse de l'existant -- Visiplus (Jaydee Kanban)

## Structure du projet

Serveur **Node.js / Express 5** en **TypeScript** (ESM), connecté à **MongoDB** via Mongoose.
Architecture en couches classique : `routes/` → `controllers/` → `models/`, avec `middlewares/` (auth JWT, validation Zod, gestion d'erreurs) et `config/` (env, db, logger).
Tests prévus avec **Vitest + Supertest**, exécutables sans MongoDB local grâce à **mongodb-memory-server**.

## Dépendances principales

- **Runtime** : express, mongoose, jsonwebtoken, bcryptjs, zod, cors, helmet, express-rate-limit, pino
- **Dev** : typescript, tsx, vitest, supertest, mongodb-memory-server

## Variables d'environnement utilisées

`NODE_ENV`, `PORT`, `MONGODB_URI`, `JWT_SECRET` (min. 32 caractères), `JWT_EXPIRES_IN`, `CORS_ORIGIN`.
Validées au démarrage via un schéma **Zod** (`src/config/env.ts`) : échec rapide et explicite si une variable est manquante ou invalide -- bonne pratique déjà en place.

## Tests existants

Aucun test n'est présent dans `tests/` au moment de l'analyse (dossier à créer, cf. étape 2 du brief).

## Anomalies et risques constatés

1. **Conflit `tsconfig.json` bloquant le build** -- `rootDir: "./src"` alors que `include` référence aussi `tests/**/*`, dossier frère de `src/`. TypeScript exige que tous les fichiers inclus soient sous `rootDir`. Conséquence : `npm run dev` fonctionne (tsx ne vérifie pas strictement), mais **`npm run build` échoue**. Bloquant pour la mise en production.
2. **`moduleResolution: "node"` déprécié** -- sera supprimé en TypeScript 7. À migrer vers `"nodenext"` ou `"bundler"`, plus cohérent avec un projet ESM (`"type": "module"`).
3. **Absence de `.gitignore` et de dépôt Git initialisé** -- risque concret d'exposer `.env` (donc le `JWT_SECRET`) ainsi que `node_modules/` et `dist/` lors d'un premier commit.
4. **Dossier `dist/` déjà présent** sans qu'un build ait été lancé en local -- à ne pas committer ; source de confusion sur l'état réel du code compilé.
5. **`node_modules/` généré en local** -- à exclure explicitement du dépôt.
6. **Options obsolètes/déplacées dans `tests/setup.ts`** -- reliquats d'une version antérieure de `mongodb-memory-server`, bloquant `npm run build` :
   - `skipMD5` et `autoStart` : options supprimées dans la v10 actuellement installée (`^10.2.3`), leur comportement étant désormais natif par défaut. Correction : suppression pure et simple, sans impact fonctionnel.
   - `launchTimeout` : option toujours valide mais réorganisée dans la v10 -- déplacée du premier niveau vers l'objet `instance`. Correction : déplacement, sans impact fonctionnel.

## Priorités avant mise en production

1. Corriger le conflit `tsconfig.json` (sortir `tests/` du build ou ajuster `rootDir`) pour débloquer `npm run build`.
2. Ajouter un `.gitignore` couvrant `node_modules/`, `dist/`, `.env`.
3. Migrer `moduleResolution` vers une valeur non dépréciée.
4. Initialiser le dépôt Git une fois les deux points précédents traités, pour éviter de committer des secrets ou du code compilé obsolète.