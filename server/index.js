// server/index.js - Express server entry point
import express from 'express';
import cors from 'cors';
import prisma from './src/db.js';

// Import routes
import previewsRouter from './src/routes/previews.js';
import collectionsRouter from './src/routes/collections.js';
import apikeysRouter from './src/routes/apikeys.js';
import analyticsRouter from './src/routes/analytics.js';
import publicRouter from './src/routes/public.js';

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// Auto-seed default user on startup
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

// Global middleware to automatically inject the default user into the request context
app.use((req, res, next) => {
  req.user = { id: DEFAULT_USER_ID, email: 'user@linkpreview.pro' };
  next();
});

// Routes
app.get('/', (req, res) => {
  res.send('<html><head><title>Local Server</title></head><body><h1 style="color: #3B82F6; font-family: sans-serif; text-align: center; margin-top: 100px;">LinkPreview Pro Local Server</h1></body></html>');
});
app.use('/api/previews', previewsRouter);
app.use('/api/collections', collectionsRouter);
app.use('/api/apikeys', apikeysRouter);
app.use('/api/analytics', analyticsRouter);
app.use('/api/preview', publicRouter); // Public API using API Keys (Bearer token)

// Error Handler
app.use((err, req, res, next) => {
  console.error('[Server Error]', err);
  res.status(500).json({ error: 'Internal Server Error', message: err.message });
});

// Start listening and seed database
app.listen(PORT, async () => {
  console.log(`[Server] LinkPreview Pro backend running on http://localhost:${PORT}`);
  await seedDefaultUser();
});
