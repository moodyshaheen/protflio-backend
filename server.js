import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

import { connectDb } from './config/db.js';
import proRouter from './routes/routePro.js';
import { deployProjects } from './deploy.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// app config
const app = express();
const port = process.env.PORT || 3001;

// middleware
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use(cors({
  origin: [
    'http://localhost:3001',
    'http://localhost:5173',
    'http://localhost:5174',
    'http://127.0.0.1:5173',
    'http://127.0.0.1:5174'
  ],
  credentials: true
}));
app.use('/uploads', express.static(uploadsDir));

// db connection
connectDb();

// api endpoints
app.get('/', (req, res) => {
  res.send('API Working');
});

// Test endpoint
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

// For local development
if (process.env.NODE_ENV !== 'production') {
  app.listen(port, () => {
    console.log(`Server Started on http://localhost:${port}`);
  });
}

// Export for Vercel
export default app;
