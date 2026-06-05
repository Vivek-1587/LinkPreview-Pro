// server/src/routes/apikeys.js - Secure API key management
import express from 'express';
import prisma from '../db.js';
import { nanoid } from 'nanoid';
import crypto from 'crypto';

const router = express.Router();

function generateKeySecret() {
  return `lp_live_${nanoid(24)}`;
}

function hashKey(rawKey) {
  return crypto.createHash('sha256').update(rawKey).digest('hex');
}

function maskKey(rawKey) {
  return `${rawKey.slice(0, 12)}...${rawKey.slice(-4)}`;
}

// GET /api/apikeys - List API keys (without raw or hashed secrets)
router.get('/', async (req, res, next) => {
  try {
    const keys = await prisma.apiKey.findMany({
      where: { userId: req.user.id },
      select: {
        id: true,
        name: true,
        maskedKey: true,
        requestCount: true,
        lastUsedAt: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json(keys);
  } catch (err) {
    next(err);
  }
});

// POST /api/apikeys - Create a new API Key (returns raw secret ONCE)
router.post('/', async (req, res, next) => {
  try {
    const { name } = req.body;
    if (!name) {
      return res.status(400).json({ error: 'API key name is required' });
    }

    const rawKey = generateKeySecret();
    const hashed = hashKey(rawKey);
    const masked = maskKey(rawKey);

    const apiKey = await prisma.apiKey.create({
      data: {
        name: name.trim(),
        key: hashed,
        maskedKey: masked,
        userId: req.user.id,
      },
    });

    // Return raw key only once on creation
    res.status(201).json({
      id: apiKey.id,
      name: apiKey.name,
      key: rawKey,
      maskedKey: masked,
      createdAt: apiKey.createdAt,
    });
  } catch (err) {
    next(err);
  }
});

// POST /api/apikeys/:id/regenerate - Regenerate key (returns raw secret ONCE)
router.post('/:id/regenerate', async (req, res, next) => {
  try {
    const { id } = req.params;

    const keyRecord = await prisma.apiKey.findFirst({
      where: { id, userId: req.user.id }
    });

    if (!keyRecord) {
      return res.status(404).json({ error: 'API key not found' });
    }

    const rawKey = generateKeySecret();
    const hashed = hashKey(rawKey);
    const masked = maskKey(rawKey);

    const updated = await prisma.apiKey.update({
      where: { id },
      data: {
        key: hashed,
        maskedKey: masked,
        requestCount: 0,
        lastUsedAt: null,
      },
    });

    res.json({
      id: updated.id,
      name: updated.name,
      key: rawKey,
      maskedKey: masked,
      createdAt: updated.createdAt,
    });
  } catch (err) {
    next(err);
  }
});

// DELETE /api/apikeys/:id - Revoke API Key
router.delete('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;

    await prisma.apiKey.delete({
      where: { id, userId: req.user.id }
    });

    res.json({ success: true, message: 'API key revoked successfully' });
  } catch (err) {
    next(err);
  }
});

export default router;
