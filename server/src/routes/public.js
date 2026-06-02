// server/src/routes/public.js - Public programmatic API using API Keys (Bearer token)
import express from 'express';
import prisma from '../db.js';
import cache from '../cache.js';
import { scrapeMetadata } from '../scraper.js';

const router = express.Router();

router.get('/', async (req, res, next) => {
  try {
    const { url } = req.query;
    if (!url) {
      return res.status(400).json({ error: 'Missing required query parameter: url' });
    }

    // 1. Verify authorization header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Unauthorized. Missing or malformed Bearer Token.' });
    }

    const apiKeyToken = authHeader.slice(7).trim();

    // 2. Query key in database
    const apiKeyRecord = await prisma.apiKey.findUnique({
      where: { key: apiKeyToken },
    });

    if (!apiKeyRecord) {
      return res.status(401).json({ error: 'Unauthorized. Invalid API key token credentials.' });
    }

    // 3. Update API Key usage stats
    await prisma.apiKey.update({
      where: { id: apiKeyRecord.id },
      data: {
        requestCount: { increment: 1 },
        lastUsedAt: new Date(),
      },
    });

    // 4. Try getting metadata from in-memory cache
    const cacheKey = `preview:${url}`;
    const cachedResult = cache.get(cacheKey);

    if (cachedResult) {
      console.log(`[Cache Hit] Serving public API for: ${url}`);
      return res.json({
        ...cachedResult,
        cached: true,
      });
    }

    // 5. Scrape fresh metadata
    console.log(`[Cache Miss] Scraping public API for: ${url}`);
    const scraped = await scrapeMetadata(url);

    // Save also to previews table for the user so it displays on their log
    await prisma.preview.create({
      data: {
        url: scraped.url,
        domain: scraped.domain,
        title: scraped.title,
        description: scraped.description,
        ogImage: scraped.ogImage,
        favicon: scraped.favicon,
        status: scraped.status,
        userId: apiKeyRecord.userId,
      }
    });

    // Cache the scraped results
    if (scraped.status === 'Success') {
      cache.set(cacheKey, scraped);
    }

    res.json({
      ...scraped,
      cached: false,
    });
  } catch (err) {
    next(err);
  }
});

export default router;
