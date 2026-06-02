// server/src/routes/previews.js - CRUD operations for link previews
import express from 'express';
import prisma from '../db.js';
import { scrapeMetadata } from '../scraper.js';

const router = express.Router();

// GET /api/previews - Fetch all previews for the default user with filtering
router.get('/', async (req, res, next) => {
  try {
    const { search, collectionId, status } = req.query;

    const where = {
      userId: req.user.id,
    };

    if (status && status !== 'all') {
      where.status = status;
    }

    if (collectionId && collectionId !== 'all') {
      where.collectionId = collectionId;
    }

    if (search) {
      where.OR = [
        { url: { contains: search } },
        { title: { contains: search } },
        { domain: { contains: search } },
        { description: { contains: search } },
      ];
    }

    const previews = await prisma.preview.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        collection: true,
      },
    });

    res.json(previews);
  } catch (err) {
    next(err);
  }
});

// POST /api/previews - Scrape metadata and save permanently to the database
router.post('/', async (req, res, next) => {
  try {
    const { url, collectionId } = req.body;
    if (!url) {
      return res.status(400).json({ error: 'URL is required' });
    }

    // Standardize URL
    let formattedUrl = url.trim();
    if (!/^https?:\/\//i.test(formattedUrl)) {
      formattedUrl = `https://${formattedUrl}`;
    }

    console.log(`[Scraper] Extracting metadata for: ${formattedUrl}`);
    const metadata = await scrapeMetadata(formattedUrl);

    // Create the preview record in database
    const preview = await prisma.preview.create({
      data: {
        url: metadata.url,
        domain: metadata.domain,
        title: metadata.title,
        description: metadata.description,
        ogImage: metadata.ogImage,
        favicon: metadata.favicon,
        status: metadata.status,
        userId: req.user.id,
        collectionId: collectionId || null,
      },
      include: {
        collection: true,
      },
    });

    // Record this in the request count of an active API Key if queried via key
    // For local interactive, we just log and return
    console.log(`[Database] Saved preview: ${preview.title} (${preview.id})`);
    res.status(201).json(preview);
  } catch (err) {
    next(err);
  }
});

// PATCH /api/previews/:id/collection - Assign preview to a collection
router.patch('/:id/collection', async (req, res, next) => {
  try {
    const { id } = req.params;
    const { collectionId } = req.body; // can be string, null, or category name

    // Find the collection if specified by name or ID
    let finalCollectionId = null;
    if (collectionId) {
      const collection = await prisma.collection.findFirst({
        where: {
          userId: req.user.id,
          OR: [
            { id: collectionId },
            { name: collectionId }
          ]
        }
      });
      if (collection) {
        finalCollectionId = collection.id;
      } else {
        // Create the collection dynamically if it is a new name passed from the client!
        const newCol = await prisma.collection.create({
          data: {
            name: collectionId,
            userId: req.user.id,
          }
        });
        finalCollectionId = newCol.id;
      }
    }

    const updated = await prisma.preview.update({
      where: { id, userId: req.user.id },
      data: {
        collectionId: finalCollectionId,
      },
      include: {
        collection: true,
      },
    });

    res.json(updated);
  } catch (err) {
    next(err);
  }
});

// POST /api/previews/:id/duplicate - Duplicate an existing preview
router.post('/:id/duplicate', async (req, res, next) => {
  try {
    const { id } = req.params;
    const existing = await prisma.preview.findFirst({
      where: { id, userId: req.user.id }
    });

    if (!existing) {
      return res.status(404).json({ error: 'Preview not found' });
    }

    const duplicated = await prisma.preview.create({
      data: {
        url: existing.url,
        domain: existing.domain,
        title: `${existing.title} (Copy)`,
        description: existing.description,
        ogImage: existing.ogImage,
        favicon: existing.favicon,
        status: existing.status,
        userId: req.user.id,
        collectionId: existing.collectionId,
      },
      include: {
        collection: true,
      },
    });

    res.status(201).json(duplicated);
  } catch (err) {
    next(err);
  }
});

// DELETE /api/previews/:id - Delete a preview permanently
router.delete('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;

    await prisma.preview.delete({
      where: { id, userId: req.user.id }
    });

    res.json({ success: true, message: 'Preview deleted successfully' });
  } catch (err) {
    next(err);
  }
});

export default router;
