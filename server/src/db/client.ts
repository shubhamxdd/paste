import { MongoClient, Db } from 'mongodb';
import dotenv from 'dotenv';

dotenv.config();

const client = new MongoClient(process.env.MONGODB_URI || 'mongodb://localhost:27017');
let db: Db;

export async function connectDb(): Promise<void> {
  await client.connect();
  db = client.db(process.env.MONGODB_DB || 'pastebin');
  // Text index for full-text search on pastes
  await db
    .collection('pastes')
    .createIndex(
      { title: 'text', content: 'text' },
      { name: 'paste_text_search', language_override: 'search_language' }
    );
  console.log('Connected to MongoDB');
}

export function getDb(): Db {
  if (!db) throw new Error('Database not connected. Call connectDb() first.');
  return db;
}
