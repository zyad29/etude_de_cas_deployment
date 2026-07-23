import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    setupFiles: ['./tests/setup.ts'],
    pool: 'forks',
    fileParallelism: false, // évite que chaque fichier de test télécharge le binaire MongoDB en parallèle lors du 1er run
    hookTimeout: 120000, // laisse le temps au 1er téléchargement du binaire MongoDB (mis en cache ensuite)
    exclude: [
      'node_modules/**',
      'dist/**', // évite de ré-exécuter les .js compilés
    ],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'tests/',
        'dist/',
        '**/*.test.ts',
        '**/*.spec.ts',
      ],
    },
  },
});