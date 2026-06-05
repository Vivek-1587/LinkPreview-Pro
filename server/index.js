// server/index.js - Express server entry point
import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import prisma from './src/db.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const isProd = process.env.NODE_ENV === 'production';
import { validateEmailConfig } from './src/email.js';

// Import routes
import previewsRouter from './src/routes/previews.js';
import collectionsRouter from './src/routes/collections.js';
import apikeysRouter from './src/routes/apikeys.js';
import analyticsRouter from './src/routes/analytics.js';
import publicRouter from './src/routes/public.js';
import authRouter from './src/routes/auth.js';
import { requireAuth } from './src/auth.js';

const app = express();
const PORT = process.env.PORT || 3001;

// ─── Process-level crash guards (prevents HTTP 502 from uncaught errors) ────────
process.on('uncaughtException', (err) => {
  console.error('[Server] UNCAUGHT EXCEPTION — server will remain running:', err);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('[Server] UNHANDLED PROMISE REJECTION:', reason, 'at promise:', promise);
});

// ─── Middleware ──────────────────────────────────────────────────────────────────
// In production the frontend is built into /dist and served by Express.
// In development, Vite dev server handles the frontend on port 5173.
if (isProd) {
  app.use(express.static(path.join(__dirname, '..', 'dist')));
} else {
  app.use(cors());
}
app.use(express.json());

// ─── Request logger (helps diagnose 502-triggering routes) ──────────────────────
app.use((req, _res, next) => {
  console.log(`[Request] ${req.method} ${req.path}`);
  next();
});

// ─── Auto-seed default user on startup ──────────────────────────────────────────
const DEFAULT_USER_ID = 'default-user-id';

async function seedDefaultUser() {
  try {
    const user = await prisma.user.upsert({
      where: { id: DEFAULT_USER_ID },
      update: {},
      create: {
        id: DEFAULT_USER_ID,
        email: 'user@linkpreview.pro',
        name: 'Developer Workspace',
        password: 'default-password-hash-unused',
      },
    });
    console.log(`[Database] Default user verified: ${user.email} (${user.id})`);

    // Pre-seed some default collections if none exist
    const collectionsCount = await prisma.collection.count({
      where: { userId: DEFAULT_USER_ID }
    });

    if (collectionsCount === 0) {
      console.log('[Database] Pre-seeding default collections...');
      const defaultCollections = [
        { name: 'Work Projects', description: 'Link previews crawled for core work systems and APIs.' },
        { name: 'Design Inspo', description: 'Visual references and premium user interfaces to study.' },
        { name: 'Tech Docs', description: 'Important developer guidelines and technology references.' },
        { name: 'SaaS Tools', description: 'Landing page references and open-source tooling models.' },
      ];

      for (const col of defaultCollections) {
        await prisma.collection.create({
          data: {
            name: col.name,
            description: col.description,
            userId: DEFAULT_USER_ID,
          }
        });
      }
    }
  } catch (err) {
    console.error('[Database] Seeding default user failed:', err);
  }
}

// ─── Routes ─────────────────────────────────────────────────────────────────────
app.use('/api/auth', authRouter);
app.use('/api/previews', requireAuth, previewsRouter);
app.use('/api/collections', requireAuth, collectionsRouter);
app.use('/api/apikeys', requireAuth, apikeysRouter);
app.use('/api/analytics', requireAuth, analyticsRouter);
app.use('/api/preview', publicRouter); // Public API using API Keys (Bearer token)

// ─── SPA Fallback (production only) ─────────────────────────────────────────────
// All non-API routes return index.html so React Router handles client-side routing.
if (isProd) {
  app.get('/{*splat}', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'dist', 'index.html'));
  });
} else {
  app.get('/', (req, res) => {
    res.send('<html><head><title>Local Server</title></head><body><h1 style="color: #3B82F6; font-family: sans-serif; text-align: center; margin-top: 100px;">LinkPreview Pro — API Server Running</h1></body></html>');
  });
}

// ─── Global Error Handler ────────────────────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error(`[Server Error] ${req.method} ${req.path} →`, err.message || err);
  if (err.stack) {
    console.error('[Server Error] Stack:', err.stack);
  }
  res.status(500).json({ error: 'Internal Server Error', message: err.message });
});

// ─── Start Server ────────────────────────────────────────────────────────────────
app.listen(PORT, async () => {
  console.log(`[Server] LinkPreview Pro backend running on http://localhost:${PORT}`);
  await seedDefaultUser();
  // Validate email config and log status at startup
  validateEmailConfig(true);
});
