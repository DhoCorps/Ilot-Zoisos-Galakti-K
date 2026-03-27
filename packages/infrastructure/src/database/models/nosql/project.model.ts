import mongoose, { Schema, Document, Model, Types } from 'mongoose';
import { v4 as uuidv4 } from 'uuid';

/**
 * 🗄️ INTERFACE (Contrat TypeScript)
 */
export interface IProjectDocument extends Document {
  uid: string;
  title: string; // 👈
  slug: string;
  description?: string;
  coverUrl?: string;
  startDate?: Date; // 👈
  estimatedEndDate?: Date; // 👈
  closedAt?: Date; // 👈
  deadline?: Date; 
  
  // ⚡ TRADUCTION DES ÉTATS ET PRIORITÉS
  status: 'PLANNED' | 'IN_PROGRESS' | 'COMPLETED' | 'PAUSED' | 'REDUCED_SPEED';
  priority: 'TRIVIAL' | 'EASY' | 'MEDIUM' | 'HARD' | 'EXTREME' | 'CRITICAL';
  
  wellbeing: {
    globalStressLevel: number;
    isAtReducedSpeed: boolean;
  };
  
  tags: string[]; // 👈 En String pour la flexibilité
  ownerId: string; // 👈 Cohérence avec Team
  parentId?: string | null; // 👈 En String
  progress: number;
  isArchived: boolean;
  
  moderation: {
    isFlagged: boolean;
  };
  
  teamId?: string | null; 
  createdAt: Date;
  updatedAt: Date;
}

/**
 * 🏗️ SCHÉMA (Configuration MongoDB)
 */
const ProjectSchema = new Schema<IProjectDocument>(
  {
    uid: { type: String, required: true, unique: true, default: () => uuidv4().slice(0, 8), index: true },
    title: { type: String, required: [true, "Title is required"], trim: true }, // 👈
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true, index: true },
    description: { type: String, trim: true },
    coverUrl: { type: String, default: '' }, 
    startDate: { type: Date, default: Date.now }, // 👈
    estimatedEndDate: { type: Date }, // 👈
    closedAt: { type: Date }, // 👈
    deadline: { type: Date },

    status: { 
      type: String, 
      enum: ['PLANNED', 'IN_PROGRESS', 'COMPLETED', 'PAUSED', 'REDUCED_SPEED'], 
      default: 'PLANNED' 
    },
    priority: { 
      type: String, 
      enum: ['TRIVIAL', 'EASY', 'MEDIUM', 'HARD', 'EXTREME', 'CRITICAL'], 
      default: 'MEDIUM' 
    },
    
    tags: [{ type: String }], // 👈

    ownerId: { type: String, required: true, index: true }, // 👈
    teamId: { type: String, default: null, index: true }, 
    parentId: { type: String, default: null }, // 👈
    
    progress: { type: Number, default: 0, min: 0, max: 100 },
    isArchived: { type: Boolean, default: false },

    wellbeing: {
      globalStressLevel: { type: Number, default: 0, min: 0, max: 100 },
      isAtReducedSpeed: { type: Boolean, default: false }
    },
    moderation: {
      isFlagged: { type: Boolean, default: false }
    }
  },
  { timestamps: true }
);

export const ProjectModel = (mongoose.models.Project as Model<IProjectDocument>) || 
                            mongoose.model<IProjectDocument>('Project', ProjectSchema);