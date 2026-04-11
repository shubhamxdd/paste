import { MongoClient, Db } from 'mongodb';
import dotenv from 'dotenv';
import logger from '../lib/logger';

dotenv.config();

const client = new MongoClient(process.env.MONGODB_URI || 'mongodb://localhost:27017');
let db: Db;

export async function connectDb(): Promise<void> {
  await client.connect();
  db = client.db(process.env.MONGODB_DB || 'pastebin');
  await db
    .collection('pastes')
    .createIndex(
      { title: 'text', content: 'text' },
      { name: 'paste_text_search', language_override: 'search_language' }
    );
  logger.info('Connected to MongoDB');
}

export function getDb(): Db {
  if (!db) throw new Error('Database not connected. Call connectDb() first.');
  return db;
}
