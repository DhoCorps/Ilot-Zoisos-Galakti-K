import mongoose, { Schema, Document, Model, Types } from 'mongoose';
import { v4 as uuidv4 } from 'uuid';

import './status.model'; // Pré-charge le modèle Status pour les refs

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
  statut: string; 
  priority: 'low' | 'medium' | 'high' | 'critical';
  tags: Types.ObjectId[];
  owner: string; // Maintien du format string pour accepter l'UID Neo4j
  parent?: Types.ObjectId | null; 
  progress: number;
  isArchived: boolean;
  
  // Alignement avec l'Ilot Zoizos
  wellbeing: {
    globalStressLevel: number;
    isAtReducedSpeed: boolean; // Ajouté ici
  };
  moderation: {
    isFlagged: boolean;
  };
  
  teamId?: Types.ObjectId | null; 
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
    titre: { 
      type: String, 
      required: [true, "Le titre est requis"], 
      trim: true 
    },
    slug: { 
      type: String, 
      required: true, 
      unique: true, 
      lowercase: true,
      trim: true,
      index: true 
    },
    description: { type: String, trim: true },
    coverUrl: { type: String, default: '' }, 

    dateDebut: { type: Date, default: Date.now },
    dateFinEstimee: { type: Date },
    dateCloture: { type: Date },
    deadline: {type : Date},

    statut: { 
      type: String, 
      default: 'Planifié' 
    },
    priority: { 
      type: String, 
      enum: ['low', 'medium', 'high', 'critical'], 
      default: 'medium' 
    },
    tags: [{ type: Schema.Types.ObjectId, ref: 'Tag' }],

    // --- RELATIONS ---
    owner: { 
      type: String, 
      required: true,
      index: true 
    },
    
    teamId: { 
      type: Schema.Types.ObjectId, 
      ref: 'Team', 
      default: null 
    },

    parent: { 
      type: Schema.Types.ObjectId, 
      ref: 'Project', 
      default: null 
    },
    
    progress: { type: Number, default: 0, min: 0, max: 100 },
    isArchived: { type: Boolean, default: false },

    // --- SANTÉ DU PROJET ---
    wellbeing: {
      globalStressLevel: { type: Number, default: 0, min: 0, max: 100 },
      isAtReducedSpeed: { type: Boolean, default: false } // Déposé délicatement ici
    },
    moderation: {
      isFlagged: { type: Boolean, default: false }
    }
  },
  { timestamps: true }
);



export const ProjectModel = (mongoose.models.Project as Model<IProjectDocument>) || 
                            mongoose.model<IProjectDocument>('Project', ProjectSchema);