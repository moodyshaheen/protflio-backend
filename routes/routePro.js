import express from 'express';
import multer from 'multer';
import fs from 'fs-extra';
import path from 'path';
import os from 'os';
import { fileURLToPath } from 'url';

import Project from '../models/Project.js';

const router = express.Router();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
// On Vercel use /tmp (writable); locally use backend/uploads
const uploadsDir = process.env.VERCEL
  ? path.join(os.tmpdir(), 'portfolio-uploads')
  : path.join(__dirname, '..', 'uploads');
fs.ensureDirSync(uploadsDir);

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `${uniqueSuffix}${path.extname(file.originalname)}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    if (mimetype && extname) {
      return cb(null, true);
    }
    return cb(new Error('Only image files are allowed'));
  }
});

const parseTechnologies = (value) => {
  if (!value) return [];
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

const resolveUploadPath = (storedPath) => {
  if (!storedPath) return null;
  const normalized = storedPath.startsWith('/') ? storedPath.slice(1) : storedPath;
  return path.join(__dirname, '..', normalized);
};

router.get('/', async (req, res) => {
  try {
    const projects = await Project.find().sort({ createdAt: -1 });
    res.json(projects);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch projects' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }
    res.json(project);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch project' });
  }
});

router.post('/', upload.single('image'), async (req, res) => {
  try {
    const { title, description, githubLink, videoLink, technologies } = req.body;

    if (!title || !description) {
      return res.status(400).json({ error: 'Title and description are required' });
    }

    const project = await Project.create({
      title,
      description,
      githubLink: githubLink || '',
      videoLink: videoLink || '',
      technologies: parseTechnologies(technologies),
      image: req.file ? `/uploads/${req.file.filename}` : ''
    });

    res.status(201).json(project);
  } catch (error) {
    res.status(500).json({ error: error.message || 'Failed to create project' });
  }
});

router.put('/:id', upload.single('image'), async (req, res) => {
  try {
    const { title, description, githubLink, videoLink, technologies } = req.body;
    const project = await Project.findById(req.params.id);

    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    if (req.file && project.image) {
      const oldImagePath = resolveUploadPath(project.image);
      if (oldImagePath && (await fs.pathExists(oldImagePath))) {
        await fs.remove(oldImagePath);
      }
    }

    project.title = title || project.title;
    project.description = description || project.description;
    project.githubLink = githubLink !== undefined ? githubLink : project.githubLink;
    project.videoLink = videoLink !== undefined ? videoLink : project.videoLink;
    project.technologies = technologies ? parseTechnologies(technologies) : project.technologies;
    project.image = req.file ? `/uploads/${req.file.filename}` : project.image;

    await project.save();
    res.json(project);
  } catch (error) {
    res.status(500).json({ error: error.message || 'Failed to update project' });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    if (project.image) {
      const imagePath = resolveUploadPath(project.image);
      if (imagePath && (await fs.pathExists(imagePath))) {
        await fs.remove(imagePath);
      }
    }

    await project.deleteOne();
    res.json({ message: 'Project deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete project' });
  }
});

export default router;

