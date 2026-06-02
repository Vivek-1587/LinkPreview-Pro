// server/src/routes/collections.js - CRUD operations for Collections
import express from 'express';
import prisma from '../db.js';

const router = express.Router();

// GET /api/collections - List all collections with preview counts
router.get('/', async (req, res, next) => {
  try {
    const collections = await prisma.collection.findMany({
      where: { userId: req.user.id },
      include: {
        previews: true,
      },
      orderBy: { createdAt: 'asc' },
    });

    res.json(collections);
  } catch (err) {
    next(err);
  }
});

// POST /api/collections - Create a new collection
router.post('/', async (req, res, next) => {
  try {
    const { name, description } = req.body;
    if (!name) {
      return res.status(400).json({ error: 'Collection name is required' });
    }

    const collection = await prisma.collection.create({
      data: {
        name: name.trim(),
        description: description ? description.trim() : '',
        userId: req.user.id,
      },
      include: {
        previews: true,
      },
    });

    res.status(201).json(collection);
  } catch (err) {
    next(err);
  }
});

// PUT /api/collections/:id - Update collection name/description
router.put('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, description } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'Collection name is required' });
    }

    const updated = await prisma.collection.update({
      where: { id, userId: req.user.id },
      data: {
        name: name.trim(),
        description: description ? description.trim() : '',
      },
      include: {
        previews: true,
      },
    });

    res.json(updated);
  } catch (err) {
    next(err);
  }
});

// DELETE /api/collections/:id - Delete a collection permanently (and unlink its previews)
router.delete('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;

    // Set preview collectionId to null for all previews inside this collection
    await prisma.preview.updateMany({
      where: { collectionId: id, userId: req.user.id },
      data: { collectionId: null },
    });

    await prisma.collection.delete({
      where: { id, userId: req.user.id },
    });

    res.json({ success: true, message: 'Collection deleted successfully' });
  } catch (err) {
    next(err);
  }
});

// PATCH /api/collections/:id/remove-preview - Remove a preview from this collection
router.patch('/:id/remove-preview', async (req, res, next) => {
  try {
    const { id } = req.params;
    const { previewId } = req.body;

    if (!previewId) {
      return res.status(400).json({ error: 'Preview ID is required' });
    }

    const updated = await prisma.preview.update({
      where: { id: previewId, collectionId: id, userId: req.user.id },
      data: { collectionId: null },
    });

    res.json(updated);
  } catch (err) {
    next(err);
  }
});

export default router;
