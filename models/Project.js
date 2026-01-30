import mongoose from 'mongoose';

const projectSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, required: true },
    githubLink: { type: String, default: '' },
    videoLink: { type: String, default: '' },
    technologies: { type: [String], default: [] },
    image: { type: String, default: '' }
  },
  { timestamps: true }
);

export default mongoose.model('Project', projectSchema);

