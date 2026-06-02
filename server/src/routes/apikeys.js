// server/src/routes/apikeys.js - CRUD operations for API credentials keys
import express from 'express';
import prisma from '../db.js';
import { nanoid } from 'nanoid';

const router = express.Router();

// Helper to generate a secure random API key token
function generateKeySecret() {
  return `lp_live_${nanoid(24)}`;
}

// GET /api/apikeys - List all API keys for the user
router.get('/', async (req, res, next) => {
  try {
    const keys = await prisma.apiKey.findMany({
      where: { userId: req.user.id },
      orderBy: { createdAt: 'desc' },
    });

    res.json(keys);
  } catch (err) {
    next(err);
  }
});

// POST /api/apikeys - Create a new API Key
router.post('/', async (req, res, next) => {
  try {
    const { name } = req.body;
    if (!name) {
      return res.status(400).json({ error: 'API key name description is required' });
    }

    const key = await prisma.apiKey.create({
      data: {
        name: name.trim(),
        key: generateKeySecret(),
        userId: req.user.id,
      },
    });

    res.status(201).json(key);
  } catch (err) {
    next(err);
  }
});

// POST /api/apikeys/:id/regenerate - Invalidate and regenerate API Key string token
router.post('/:id/regenerate', async (req, res, next) => {
  try {
    const { id } = req.params;

    const keyRecord = await prisma.apiKey.findFirst({
      where: { id, userId: req.user.id }
    });

    if (!keyRecord) {
      return res.status(404).json({ error: 'API key credential not found' });
    }

    const updated = await prisma.apiKey.update({
      where: { id },
      data: {
        key: generateKeySecret(),
        requestCount: 0,
        lastUsedAt: null,
      },
    });

    res.json(updated);
  } catch (err) {
    next(err);
  }
});

// DELETE /api/apikeys/:id - Permanently revoke/delete API Key credential
router.delete('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;

    await prisma.apiKey.delete({
      where: { id, userId: req.user.id }
    });

    res.json({ success: true, message: 'API credential key revoked successfully' });
  } catch (err) {
    next(err);
  }
});

export default router;
