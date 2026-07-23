import express, { Express } from 'express';
import cors from 'cors';
import { env } from './config/env.js';
import { logger } from './config/logger.js';
import routes from './routes/index.js';
import { errorHandler } from './middlewares/error.middleware.js';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';

/**
 * Creates and configures the Express application.
 * 
 * Sets up middleware (CORS, JSON parsing) and routes.
 * Error handler must be the last middleware.
 * Exported for use in server.ts and testing.
 * 
 * @returns Configured Express application
 * 
 * @example
 * ```typescript
 * import { createApp } from './app';
 * const app = createApp();
 * ```
 */
export function createApp(): Express {
  const app = express();

  // Sécurisation des en-têtes HTTP
  app.use(helmet());

  // Limitation du nombre de requêtes pour éviter les abus
  const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limite chaque IP à 100 requêtes par fenêtre (ici, par 15 minutes)
    message: { error: 'Too many requests, please try again later' },
  });
  app.use('/api', limiter);

  // Middleware
  app.use(cors({ origin: env.CORS_ORIGIN }));
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Request logging
  app.use((req, res, next) => {
    logger.info({ method: req.method, url: req.url }, 'Incoming request');
    next();
  });

  // Health check endpoint
  app.get('/health', (req, res) => {
    res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  // API routes
  app.use('/api', routes);

  // Error handler (must be last)
  app.use(errorHandler);

  return app;
}

