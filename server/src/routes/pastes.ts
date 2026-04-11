import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { getDb } from '../db/client';
import { generateId } from '../lib/id';

interface PasteDoc {
  _id: string;
  title: string | null;
  content: string;
  language: string;
  paraphrase: string | null;
  created_at: Date;
}

const router = Router();

const pastes = () => getDb().collection<PasteDoc>('pastes');

const CUSTOM_ID_RE = /^[a-zA-Z0-9_-]{3,60}$/;

// GET /api/pastes — list pastes with optional full-text search
router.get('/', async (req: Request, res: Response) => {
  try {
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit as string) || 20));
    const q = (req.query.q as string)?.trim();

    const filter: Record<string, unknown> = q ? { $text: { $search: q } } : {};

    const [docs, total] = await Promise.all([
      pastes()
        .find(filter, { projection: { content: 0 } })
        .sort(q ? { score: { $meta: 'textScore' } } : { created_at: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .toArray(),
      pastes().countDocuments(filter),
    ]);

    return res.json({
      pastes: docs.map((d) => ({
        id: d._id,
        title: d.title,
        language: d.language,
        created_at: d.created_at,
        protected: !!d.paraphrase,
      })),
      total,
      page,
      limit,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/pastes — create a paste
router.post('/', async (req: Request, res: Response) => {
  try {
    const { title, content, language = 'plaintext', paraphrase, customId } = req.body;

    if (!content || typeof content !== 'string' || content.trim() === '') {
      return res.status(400).json({ error: 'Content is required' });
    }

    if (customId !== undefined) {
      if (typeof customId !== 'string' || !CUSTOM_ID_RE.test(customId)) {
        return res.status(400).json({
          error: 'Custom URL may only contain letters, numbers, hyphens, and underscores (3–60 chars)',
        });
      }
    }

    const id = customId ?? generateId();
    const hashedParaphrase = paraphrase ? await bcrypt.hash(paraphrase, 10) : null;

    await pastes().insertOne({
      _id: id,
      title: title || null,
      content,
      language,
      paraphrase: hashedParaphrase,
      created_at: new Date(),
    });

    return res.status(201).json({ id });
  } catch (err) {
    if (err instanceof Error && 'code' in err && (err as { code: number }).code === 11000) {
      return res.status(409).json({ error: 'This custom URL is already taken' });
    }
    console.error(err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/pastes/:id — get paste (omits content if protected)
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const paste = await pastes().findOne({ _id: req.params.id });

    if (!paste) {
      return res.status(404).json({ error: 'Paste not found' });
    }

    if (paste.paraphrase) {
      return res.json({
        id: paste._id,
        title: paste.title,
        language: paste.language,
        created_at: paste.created_at,
        protected: true,
      });
    }

    return res.json({
      id: paste._id,
      title: paste.title,
      content: paste.content,
      language: paste.language,
      created_at: paste.created_at,
      protected: false,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/pastes/:id/unlock — verify paraphrase and return content
router.post('/:id/unlock', async (req: Request, res: Response) => {
  try {
    const { paraphrase } = req.body;

    if (!paraphrase) {
      return res.status(400).json({ error: 'Paraphrase is required' });
    }

    const paste = await pastes().findOne({ _id: req.params.id });

    if (!paste) {
      return res.status(404).json({ error: 'Paste not found' });
    }

    const match = await bcrypt.compare(paraphrase, paste.paraphrase!);
    if (!match) {
      return res.status(401).json({ error: 'Incorrect paraphrase' });
    }

    return res.json({
      id: paste._id,
      title: paste.title,
      content: paste.content,
      language: paste.language,
      created_at: paste.created_at,
      protected: true,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/pastes/:id/raw — raw text (use ?paraphrase=xxx for protected pastes)
router.get('/:id/raw', async (req: Request, res: Response) => {
  try {
    const paste = await pastes().findOne({ _id: req.params.id });

    if (!paste) {
      return res.status(404).send('Paste not found');
    }

    if (paste.paraphrase) {
      const { paraphrase } = req.query;
      if (!paraphrase || typeof paraphrase !== 'string') {
        return res.status(401).send('This paste is protected. Provide ?paraphrase=your_paraphrase');
      }
      const match = await bcrypt.compare(paraphrase, paste.paraphrase);
      if (!match) {
        return res.status(401).send('Incorrect paraphrase');
      }
    }

    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    return res.send(paste.content);
  } catch (err) {
    console.error(err);
    return res.status(500).send('Internal server error');
  }
});

export default router;
