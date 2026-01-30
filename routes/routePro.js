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

// تحديد مسار الـ uploads حسب البيئة
const uploadsDir = process.env.VERCEL
  ? path.join(os.tmpdir(), 'portfolio-uploads') // قابل للكتابة على Vercel
  : path.join(__dirname, '..', 'uploads');     // محلي

// التأكد من وجود المجلد
fs.ensureDirSync(uploadsDir);

// إعداد التخزين للملفات
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadsDir),
  filename: (req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `${uniqueSuffix}${path.extname(file.originalname)}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    if (mimetype && extname) return cb(null, true);
    return cb(new Error('Only image files are allowed'));
  },
});

// تحويل JSON للتقنيات
const parseTechnologies = (value) => {
  if (!value) return [];
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

// دالة لإيجاد مسار الصورة المخزنة بشكل صحيح حسب البيئة
const resolveUploadPath = (storedPath) => {
  if (!storedPath) return null;
  // إذا على Vercel، الملفات موجودة في uploadsDir
  if (process.env.VERCEL) {
    return path.join(uploadsDir, path.basename(storedPath));
  }
  // محلي
  return path.join(__dirname, '..', storedPath.startsWith('/') ? storedPath.slice(1) : storedPath);
};

// ---------------- ROUTES ------------------

// جلب كل المشاريع
router.get('/', async (req, res) => {
  try {
    const projects = await Project.find().sort({ createdAt: -1 });
    res.json(projects);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch projects' });
  }
});

// جلب مشروع محدد
router.get('/:id', async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ error: 'Project not found' });
    res.json(project);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch project' });
  }
});

// إنشاء مشروع جديد
router.post('/', (req, res, next) => {
  upload.single('image')(req, res, (err) => {
    if (err) return res.status(400).json({ error: err.message });
    next();
  });
}, async (req, res) => {
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
      image: req.file ? `/uploads/${req.file.filename}` : '',
    });

    res.status(201).json(project);
  } catch (error) {
    res.status(500).json({ error: error.message || 'Failed to create project' });
  }
});

// تعديل مشروع موجود
router.put('/:id', (req, res, next) => {
  upload.single('image')(req, res, (err) => {
    if (err) return res.status(400).json({ error: err.message });
    next();
  });
}, async (req, res) => {
  try {
    const { title, description, githubLink, videoLink, technologies } = req.body;
    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ error: 'Project not found' });

    if (req.file && project.image) {
      const oldImagePath = resolveUploadPath(project.image);
      if (oldImagePath && await fs.pathExists(oldImagePath)) {
        await fs.remove(oldImagePath);
      }
    }

    project.title = title || project.title;
    project.description = description || project.description;
    project.githubLink = githubLink !== undefined ? githubLink : project.githubLink;
    project.videoLink = videoLink !== undefined ? videoLink : project.videoLink;
    project.technologies = technologies !== undefined ? parseTechnologies(technologies) : project.technologies;
    project.image = req.file ? `/uploads/${req.file.filename}` : project.image;

    await project.save();
    res.json(project);
  } catch (error) {
    res.status(500).json({ error: error.message || 'Failed to update project' });
  }
});

// حذف مشروع
router.delete('/:id', async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ error: 'Project not found' });

    if (project.image) {
      const imagePath = resolveUploadPath(project.image);
      if (imagePath && await fs.pathExists(imagePath)) {
        await fs.remove(imagePath);
      }
    }

    await project.deleteOne();
    res.json({ message: 'Project deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete project' });
  }
});

// serve uploads statically
router.use('/uploads', express.static(uploadsDir));

export default router;
