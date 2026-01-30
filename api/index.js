import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import path from 'path';
import os from 'os';
import fs from 'fs';
import { fileURLToPath } from 'url';

import { connectDb } from '../config/db.js';
import proRouter from '../routes/routePro.js';
import { deployProjects } from '../deploy.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// On Vercel use /tmp (writable); locally use backend/uploads
const uploadsDir = process.env.VERCEL
  ? path.join(os.tmpdir(), 'portfolio-uploads')
  : path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

const app = express();

// Allow frontend/admin on Vercel and localhost
const allowedOrigins = [
  'http://localhost:3001', 'http://localhost:5173', 'http://localhost:5174',
  'http://127.0.0.1:5173', 'http://127.0.0.1:5174'
];
if (process.env.VITE_APP_URL) allowedOrigins.push(process.env.VITE_APP_URL);
const corsOptions = {
  origin: (origin, cb) => {
    const allow = !origin || allowedOrigins.includes(origin) || (origin && origin.endsWith('.vercel.app'));
    cb(null, allow);
  },
  credentials: true
};
app.use(cors(corsOptions));

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use('/uploads', express.static(uploadsDir));

// db connection
connectDb();

// api endpoints
app.get('/', (req, res) => {
  res.json({ success: true, message: 'API Working!' });
});

app.get('/api/test', (req, res) => {
  res.json({ success: true, message: 'Backend is working!' });
});

app.use('/api/projects', proRouter);

// Deploy endpoint
app.post('/api/deploy', async (req, res) => {
  try {
    const { projects } = req.body;
    if (!projects || !Array.isArray(projects)) {
      return res.status(400).json({ success: false, message: 'Invalid projects data' });
    }
    
    const result = await deployProjects({ projects });
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

export default app;

