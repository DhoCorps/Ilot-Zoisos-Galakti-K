import mongoose, { Schema, Document, Model, Types } from 'mongoose';
import { v4 as uuidv4 } from 'uuid';
import { ITask } from "@ilot/types";

// ⚡ LA MAGIE EST ICI : On adapte Task pour la base de données
// On "Omit" les champs de l'interface pure qui entrent en conflit avec les références MongoDB
export interface ITaskDocument extends Omit<ITask, 'projetUid' | 'status' | 'assignees' | '_id' | 'id'>, Document {
  projet: Types.ObjectId;
  status: Types.ObjectId;
  assignees: Types.ObjectId[];
  reporter: Types.ObjectId;
  tags: Types.ObjectId[];
  
  dateDebut?: Date;
  dateFinEstimee?: Date;
  dateCloture?: Date;
  deadline?: Date;
  timeEstimate?: number;
  timeSpent?: number;
  commentsCount?: number;
  isArchived?: boolean;
  
  moderation?: {
    isFlagged?: boolean;
    reportCount?: number;
    systemNote?: string; // 🐛 CORRECTION : 'string' en minuscule pour TypeScript !
  };
}

const TaskSchema = new Schema<ITaskDocument>({
  // --- LE PONT NEO4J ---
  uid: { 
    type: String, 
    required: true, 
    unique: true, 
    default: () => uuidv4(),
    index: true 
  },

  title: { 
    type: String, 
    required: [true, "Le title est obligatoire"], 
    trim: true 
  },
  description: { 
    type: String, 
    trim: true 
  },

  // --- PLANNING ---
  dateDebut: { type: Date },
  dateFinEstimee: { type: Date },
  dateCloture: { type: Date },
  deadline: { type: Date },
  
  // --- TIME TRACKING ---
  timeEstimate: { type: Number, default: 0, min: 0 },
  timeSpent: { type: Number, default: 0, min: 0 },

  // --- CLASSIFICATION ---
  status: { 
    type: Schema.Types.ObjectId, 
    ref: 'Status', 
    required: true, 
    index: true 
  }, 
  complexity: { 
    type: Number, 
    enum: [1, 2, 3, 5, 8, 13], 
    default: 1 
  }, 
  tags: [{ type: Schema.Types.ObjectId, ref: 'Tag' }],

  // --- RELATIONS ---
  projet: { 
    type: Schema.Types.ObjectId, 
    ref: 'Project', 
    required: true, 
    index: true 
  },
  assignees: [{ 
    type: Schema.Types.ObjectId, 
    ref: 'User' 
  }],
  reporter: { 
    type: Schema.Types.ObjectId, 
    ref: 'User',
    required: true 
  },

  // --- SOCIAL & CYCLE DE VIE ---
  commentsCount: { type: Number, default: 0 },
  isArchived: { type: Boolean, default: false }, 

  // --- MODULES SPÉCIFIQUES ---
 priority: {
  type: String,
  enum: ['TRIVIAL', 'EASY', 'MEDIUM', 'HARD', 'EXTREME', 'CRITICAL'], 
      default: "MEDIUM",                
  },
  wellbeing: {
    stressImpact: { type: Number, default: 0, min: 0, max: 100 },
    isBlocking: { type: Boolean, default: false }
  },
  moderation: {
    isFlagged: { type: Boolean, default: false },
    reportCount: { type: Number, default: 0 },
    systemNote: { type: String, trim: true } // Ici String avec majuscule est correct pour Mongoose
  }

}, {
  timestamps: true 
});

// L'export harmonisé !
export const TaskModel = (mongoose.models.Task as Model<ITaskDocument>) || mongoose.model<ITaskDocument>('Task', TaskSchema);