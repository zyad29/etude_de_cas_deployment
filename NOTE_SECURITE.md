# Note de sécurité -- Visiplus (Jaydee Kanban)

## Risques techniques identifiés

### 1. Absence de sécurisation des en-têtes HTTP

`helmet` était présent dans les dépendances (`package.json`) mais **jamais activé** dans `src/app.ts`. Sans lui, l'API répond avec les en-têtes HTTP par défaut d'Express, qui exposent notamment la technologie utilisée (`X-Powered-By`) et n'appliquent aucune politique de sécurité du contenu -- facilitant la reconnaissance de la stack technique et certaines attaques côté navigateur (clickjacking, MIME sniffing).

### 2. Absence de limitation du nombre de requêtes

`express-rate-limit` était également présent dans les dépendances mais non activé. Sans limitation, `POST /api/auth/login` est exposé à des attaques par **force brute** (test automatisé de mots de passe), et l'ensemble de l'API est vulnérable à des abus (spam de requêtes, déni de service basique par saturation).

## Middleware implémenté

Les deux middlewares ont été activés dans `src/app.ts`, en tête de la chaîne de middlewares (avant les routes) :

- **`helmet()`** -- applique un ensemble d'en-têtes HTTP de sécurité par défaut (désactivation de `X-Powered-By`, `X-Content-Type-Options`, `X-Frame-Options`, etc.).
- **`express-rate-limit`** -- limite chaque IP à **100 requêtes par tranche de 15 minutes** sur les routes `/api/*`. Au-delà, l'API répond `429 Too Many Requests`.

## Vérification

Le comportement d'authentification est couvert par les tests d'intégration existants (`tests/columns.test.ts`, `tests/auth.test.ts`, `tests/ofs.test.ts`) : chaque route protégée est testée pour confirmer qu'elle renvoie bien **401 Unauthorized** en l'absence de token JWT valide. Ces tests passent (`npm test`), ce qui constitue la vérification demandée sans nécessiter de test manuel supplémentaire.

## Limites de cette implémentation

- Le seuil de `express-rate-limit` (100 requêtes / 15 min) est une valeur de départ raisonnable pour un environnement de développement/démonstration ; en production, ce seuil devrait être ajusté selon le trafic réel attendu, et idéalement différencié par route (ex. seuil plus strict sur `/api/auth/login` que sur `/api/columns`).
- La limitation actuelle est **par IP**, stockée en mémoire du process : elle ne persiste pas entre redémarrages et ne serait pas partagée entre plusieurs instances du serveur en environnement scalé (nécessiterait un store partagé, ex. Redis, en production réelle).
- Cette note couvre les deux risques explicitement demandés par le brief ; d'autres axes (validation stricte des entrées avec Zod, gestion des erreurs centralisée) sont déjà en place dans le projet mais n'entraient pas dans le périmètre de cette étape.