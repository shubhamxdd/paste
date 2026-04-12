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
