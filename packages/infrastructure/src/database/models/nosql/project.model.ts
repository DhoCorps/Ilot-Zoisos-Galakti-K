import mongoose, { Schema, Document, Model, Types } from 'mongoose';
import { v4 as uuidv4 } from 'uuid';

/**
 * 🗄️ INTERFACE (Contrat TypeScript)
 */
export interface IProjectDocument extends Document {
  uid: string;
  titre: string;
  slug: string;
  description?: string;
  coverUrl?: string;
  dateDebut?: Date;
  dateFinEstimee?: Date;
  dateCloture?: Date;
  deadline?: Date; 
  // ⚡ SUTURE : Aligné sur StatutProjectSchema
  statut: 'Planifié' | 'En Cours' | 'Terminé' | 'En Pause' | 'Vitesse Réduite';
  priority: 'trivial' | 'easy' | 'medium' | 'hard' | 'extreme' | 'critical';
  wellbeing: {
    globalStressLevel: number;
    isAtReducedSpeed: boolean;
  };
  tags: Types.ObjectId[];
  owner: string; 
  parent?: Types.ObjectId | null; 
  progress: number;
  isArchived: boolean;
  
  moderation: {
    isFlagged: boolean;
  };
  
  teamId?: string | null; // ⚡ Pivot UID Neo4j
  createdAt: Date;
  updatedAt: Date;
}

/**
 * 🏗️ SCHÉMA (Configuration MongoDB)
 */
const ProjectSchema = new Schema<IProjectDocument>(
  {
    uid: { 
      type: String, 
      required: true, 
      unique: true, 
      default: () => uuidv4().slice(0, 8), 
      index: true 
    },
    titre: { type: String, required: [true, "Le titre est requis"], trim: true },
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true, index: true },
    description: { type: String, trim: true },
    coverUrl: { type: String, default: '' }, 
    dateDebut: { type: Date, default: Date.now },
    dateFinEstimee: { type: Date },
    dateCloture: { type: Date },
    deadline: { type: Date },

    statut: { 
      type: String, 
      // ⚡ Validation stricte des statuts de l'Îlot
      enum: ['Planifié', 'En Cours', 'Terminé', 'En Pause', 'Vitesse Réduite'], 
      default: 'Planifié' 
    },
    priority: { 
      type: String, 
      // ⚡ Échelle de priorité Galakti-K
      enum: ['trivial', 'easy', 'medium', 'hard', 'extreme', 'critical'], 
      default: 'medium' 
    },
    tags: [{ type: Schema.Types.ObjectId, ref: 'Tag' }],

    owner: { type: String, required: true, index: true },
    
    // ⚡ SUTURE : On utilise String pour matcher l'UID Neo4j et faciliter la synchro
    teamId: { type: String, default: null, index: true }, 

    parent: { type: Schema.Types.ObjectId, ref: 'Project', default: null },
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