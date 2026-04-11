import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { connectDb } from './db/client';
import pastesRouter from './routes/pastes';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

app.use('/api/pastes', pastesRouter);

async function main() {
  await connectDb();
  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

main().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
