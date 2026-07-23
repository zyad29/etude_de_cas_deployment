# --- Étape 1 : build ---
# Compile le TypeScript en JavaScript (dist/) avec toutes les devDependencies
FROM node:20-alpine AS build

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY tsconfig.json ./
COPY src ./src

RUN npm run build

# --- Étape 2 : production ---
# Image finale allégée : uniquement le code compilé + dépendances de production
FROM node:20-alpine AS production

WORKDIR /app

ENV NODE_ENV=production

COPY package*.json ./
RUN npm ci --omit=dev

COPY --from=build /app/dist ./dist

EXPOSE 3000

CMD ["node", "dist/main.js"]