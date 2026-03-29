import mongoose, { Schema, Document, Model } from 'mongoose';
import { v4 as uuidv4 } from 'uuid';
import { ITask } from "@ilot/types";

// ⚡ L'INTERFACE STRICTE 
export interface ITaskDocument extends Document {
  uid: string;
  title: string;
  description: string;
  
  projectId: string; // 👈 STRING (Pont Neo4j)
  creatorUid: string; // 👈 STRING 
  assignees: string[]; // 👈 Array de STRING 
  parentId?: string | null;
  
  isPrivate: boolean;
  priority: string;
  complexity: number;
  status: string;
  
  wellbeing: {
    stressImpact: number;
    isBlocking: boolean;
  };

  estimatedPomodoros: number;
  completedPomodoros: number;

  tags: string[];
  startDate?: Date;
  dueDate?: Date;
  completedAt?: Date;
  isArchived: boolean;
  
  moderation?: {
    isFlagged: boolean;
    systemNote: string;
  };
}

// 🏗️ LA CONFIGURATION MONGOOSE
const TaskSchema = new Schema<ITaskDocument>({
  uid: { type: String, required: true, unique: true, default: () => uuidv4(), index: true },
  title: { type: String, required: true },
  description: { type: String, default: '' },
  
  // --- LE PONT NEO4J (Indexé pour la vitesse) ---
  projectId: { type: String, required: true, index: true },
  creatorUid: { type: String, required: true, index: true },
  assignees: [{ type: String }],
  parentId: { type: String, default: null },

  // --- CONFIGURATION ---
  isPrivate: { type: Boolean, default: true },
  priority: { type: String, default: 'MEDIUM' },
  complexity: { type: Number, default: 1 },
  status: { type: String, default: 'TODO', index: true },
  
  // --- MÉTRIQUES ---
  wellbeing: {
    stressImpact: { type: Number, default: 0 },
    isBlocking: { type: Boolean, default: false }
  },
  estimatedPomodoros: { type: Number, default: 1 },
  completedPomodoros: { type: Number, default: 0 },

  // --- DIVERS ---
  tags: [{ type: String }],
  startDate: { type: Date },
  dueDate: { type: Date },
  completedAt: { type: Date },
  isArchived: { type: Boolean, default: false },
  
  moderation: {
    isFlagged: { type: Boolean, default: false },
    systemNote: { type: String, default: '' }
  }
}, { timestamps: true });

export const TaskModel = (mongoose.models.Task as Model<ITaskDocument>) || 
                         mongoose.model<ITaskDocument>('Task', TaskSchema);