// server/src/cache.js - in-memory cache (simulates Redis)
import NodeCache from 'node-cache';

const cache = new NodeCache({ stdTTL: 3600, checkperiod: 600 });

export default cache;
