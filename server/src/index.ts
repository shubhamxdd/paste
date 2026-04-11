import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { connectDb } from './db/client';
import pastesRouter from './routes/pastes';
import collectionsRouter from './routes/collections';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

app.use('/api/pastes', pastesRouter);
app.use('/api/collections', collectionsRouter);

app.get("/health",(req,res)=>{
  res.status(200).json({status:"ok"});
})

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
