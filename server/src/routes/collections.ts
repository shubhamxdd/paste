import { Router, Request, Response } from 'express';
import { getDb } from '../db/client';
import { generateId } from '../lib/id';
import logger from '../lib/logger';
import posthog from '../lib/posthog';

interface CollectionDoc {
  _id: string;
  title: string;
  paste_ids: string[];
  created_at: Date;
}

const router = Router();
const collections = () => getDb().collection<CollectionDoc>('collections');

// POST /api/collections — create a collection
router.post('/', async (req: Request, res: Response) => {
  try {
    const { title, paste_ids } = req.body;

    if (!title || typeof title !== 'string' || title.trim() === '') {
      return res.status(400).json({ error: 'Title is required' });
    }
    if (!Array.isArray(paste_ids) || paste_ids.length === 0) {
      return res.status(400).json({ error: 'Select at least one paste' });
    }
    if (paste_ids.length > 20) {
      return res.status(400).json({ error: 'Maximum 20 pastes per gist' });
    }

    const id = generateId();
    await collections().insertOne({
      _id: id,
      title: title.trim(),
      paste_ids,
      created_at: new Date(),
    });

    posthog.capture({
      distinctId: 'server',
      event: 'collection created',
      properties: { collection_id: id, paste_count: paste_ids.length },
    });

    return res.status(201).json({ id });
  } catch (err) {
    logger.error({ err });
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/collections/:id — get collection with populated paste data
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const collection = await collections().findOne({ _id: req.params.id });
    if (!collection) {
      return res.status(404).json({ error: 'Gist not found' });
    }

    interface PasteDoc {
      _id: string;
      title: string | null;
      content: string;
      language: string;
      paraphrase: string | null;
      created_at: Date;
    }

    const db = getDb();
    const docs = await db
      .collection<PasteDoc>('pastes')
      .find({ _id: { $in: collection.paste_ids } } as object)
      .toArray();

    // Preserve the order paste_ids were added in
    const pasteMap = new Map(docs.map((d) => [d._id, d]));
    const pastes = collection.paste_ids
      .map((pid) => pasteMap.get(pid))
      .filter(Boolean)
      .map((p) => {
        const isProtected = !!p!.paraphrase;
        return {
          id: p!._id,
          title: p!.title,
          language: p!.language,
          created_at: p!.created_at,
          protected: isProtected,
          ...(isProtected ? {} : { content: p!.content }),
        };
      });

    posthog.capture({
      distinctId: 'server',
      event: 'collection viewed',
      properties: { collection_id: collection._id, paste_count: pastes.length },
    });

    return res.json({
      id: collection._id,
      title: collection.title,
      created_at: collection.created_at,
      pastes,
    });
  } catch (err) {
    logger.error({ err });
    return res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
