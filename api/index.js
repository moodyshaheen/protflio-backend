import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import path from 'path';
import os from 'os';
import fs from 'fs';
import { fileURLToPath } from 'url';

import { connectDb } from './config/db.js';
import proRouter from './routes/routePro.js';
import { deployProjects } from './deploy.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// uploads dir
const uploadsDir = process.env.VERCEL
  ? path.join(os.tmpdir(), 'portfolio-uploads')
  : path.join(__dirname, 'uploads');

if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

const app = express();

// cors
app.use(cors({ origin: true, credentials: true }));

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use('/uploads', express.static(uploadsDir));

// db
connectDb();

// routes
app.get('/', (req, res) => {
  res.json({ success: true, message: 'API Working!' });
});

app.get('/api/test', (req, res) => {
  res.json({ success: true, message: 'Backend is working!' });
});

app.use('/api/projects', proRouter);

app.post('/api/deploy', async (req, res) => {
  try {
    const { projects } = req.body;
    if (!Array.isArray(projects)) {
      return res.status(400).json({ success: false, message: 'Invalid projects data' });
    }
    const result = await deployProjects({ projects });
    res.json(result);
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

export default app;
