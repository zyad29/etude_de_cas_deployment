# Stratégie CI/CD -- Visiplus (Jaydee Kanban)

## Objectifs de la CI/CD

- **Automatisation** : éviter les déploiements manuels sujets à erreur (oubli de build, de tests, de variables d'environnement).
- **Fiabilité** : ne jamais déployer du code qui casse les tests ou qui ne compile pas.
- **Qualité** : détecter les régressions le plus tôt possible, avant qu'elles n'atteignent la production.

## Déclencheurs du pipeline

| Événement | Action déclenchée |
|---|---|
| `push` sur une branche de feature | Lint + tests (validation rapide en cours de développement) |
| `pull_request` vers `main` | Lint + tests + build (bloque la fusion si échec) |
| `push`/merge sur `main` | Lint + tests + build + build de l'image Docker + déploiement |
| `release` (tag versionné) | Pipeline complet + publication de l'image Docker taguée |

## Étapes principales du pipeline

1. **Installation** -- `npm install`, avec mise en cache des dépendances entre les runs pour accélérer les exécutions suivantes.
2. **Test** -- `npm test`, exécution des tests d'intégration (Vitest + Supertest + MongoDB Memory Server), sans dépendance à une base de données externe.
3. **Build** -- `npm run build`, compilation TypeScript ; le pipeline échoue si la compilation échoue (garde-fou déjà rencontré pendant ce projet).
4. **Déploiement** -- construction de l'image Docker (`docker build`) puis déploiement sur l'environnement cible, uniquement si les étapes précédentes ont réussi.

## Extrait YAML simplifié (GitHub Actions)

```yaml
name: CI
on: [push, pull_request]
jobs:
  build-and-test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
      - run: npm install
      - run: npm test
      - run: npm run build
```

## Gestion des secrets

- Les secrets (`JWT_SECRET`, `MONGODB_URI` de production, identifiants de déploiement) sont stockés dans les **secrets chiffrés** de la plateforme CI (ex. GitHub Actions Secrets), jamais en clair dans le pipeline ni committés dans le dépôt.
- Le fichier `.env` reste local uniquement (exclu via `.gitignore` et `.dockerignore`) ; en CI/CD, les variables sont injectées à l'exécution via ces secrets.

## Validations avant mise en production

- Les tests (`npm test`) et le build (`npm run build`) doivent réussir avant tout déploiement -- aucune étape n'est ignorée, même en urgence.
- La fusion vers `main` nécessite une pull request validée (pipeline vert), évitant qu'un code non testé n'atteigne la branche de production.
- Le healthcheck `GET /health` peut être interrogé juste après déploiement pour confirmer que le nouveau conteneur répond correctement avant de considérer le déploiement réussi.