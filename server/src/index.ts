import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { connectDb, getDb } from './db/client';
import pastesRouter from './routes/pastes';
import collectionsRouter from './routes/collections';
import logger from './lib/logger';
import posthog from './lib/posthog';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

app.use('/api/pastes', pastesRouter);
app.use('/api/collections', collectionsRouter);

app.get('/api/stats', async (_req, res) => {
  try {
    const db = getDb();
    const pastes = db.collection('pastes');
    const collections = db.collection('collections');
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    const [
      totalPastes,
      totalCollections,
      totalViewsResult,
      mostViewed,
      topLanguages,
      protectedCount,
      recentCount,
    ] = await Promise.all([
      pastes.countDocuments(),
      collections.countDocuments(),
      pastes.aggregate([{ $group: { _id: null, total: { $sum: '$views' } } }]).toArray(),
      pastes.find({}).sort({ views: -1 }).limit(1).project({ content: 0 }).toArray(),
      pastes.aggregate([
        { $group: { _id: '$language', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 5 },
      ]).toArray(),
      pastes.countDocuments({ paraphrase: { $ne: null } }),
      pastes.countDocuments({ created_at: { $gte: sevenDaysAgo } }),
    ]);

    const top = mostViewed[0];

    return res.json({
      total_pastes: totalPastes,
      total_collections: totalCollections,
      total_views: totalViewsResult[0]?.total ?? 0,
      protected_pastes: protectedCount,
      pastes_last_7_days: recentCount,
      most_viewed: top ? { id: top._id, title: top.title, language: top.language, views: top.views ?? 0 } : null,
      top_languages: topLanguages.map((l) => ({ language: l._id as string, count: l.count as number })),
    });
  } catch (err) {
    logger.error({ err });
    return res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/health', async (_req, res) => {
  try {
    const db = getDb();
    await db.command({ ping: 1 });

    const mem = process.memoryUsage();
    const [pastesCount, collectionsCount] = await Promise.all([
      db.collection('pastes').countDocuments(),
      db.collection('collections').countDocuments(),
    ]);

    res.status(200).json({
      status: 'ok',
      uptime: Math.floor(process.uptime()),
      mongodb: 'connected',
      memory: {
        used_mb: Math.round(mem.rss / 1024 / 1024),
        heap_used_mb: Math.round(mem.heapUsed / 1024 / 1024),
        heap_total_mb: Math.round(mem.heapTotal / 1024 / 1024),
      },
      node_version: process.version,
      stats: {
        pastes: pastesCount,
        collections: collectionsCount,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    logger.error({ err }, 'Health check failed');
    res.status(503).json({
      status: 'error',
      mongodb: 'unreachable',
      timestamp: new Date().toISOString(),
    });
  }
});

async function main() {
  await connectDb();
  app.listen(PORT, () => {
    logger.info(`Server running on port ${PORT}`);
  });
}

main().catch((err) => {
  logger.error({ err }, 'Failed to start server');
  process.exit(1);
});

process.on('SIGTERM', async () => {
  await posthog.shutdown();
  process.exit(0);
});

process.on('SIGINT', async () => {
  await posthog.shutdown();
  process.exit(0);
});
