import mongoose, { Schema, Document, Model, Types } from 'mongoose';
import { v4 as uuidv4 } from 'uuid';

/**
 * 🗄️ INTERFACE (Contrat TypeScript)
 */
export interface ITeam extends Document {
  _id: Types.ObjectId; 
  uid: string; 
  name: string; // 👈 
  description?: string;
  avatarUrl?: string; 
  parentId?: string | null; // 👈 Unifié en String pour le pivot Neo4j
  ownerId: string; // 👈 
  leaderId?: string; // 👈 
  
  settings: {
    isGlobalReducedSpeed: boolean; 
    allowSearch: boolean;
  };
  
  collectiveHealth: {
    averageMentalLoad: number;
    isOverloaded: boolean;
  };

  moderation: {
    isFlagged: boolean;
  };
  
  createdAt: Date;
  updatedAt: Date;
}

/**
 * 🏗️ SCHÉMA (Configuration MongoDB)
 */
const TeamSchema = new Schema<ITeam>(
  {
    uid: { type: String, required: true, unique: true, default: () => uuidv4() },
    name: { type: String, required: true, unique: true, trim: true }, // 👈
    description: { type: String },
    avatarUrl: { type: String, default: '' },
    
    parentId: { type: String, default: null }, // 👈
    ownerId: { type: String, required: true }, // 👈
    leaderId: { type: String }, // 👈

    moderation: {
      isFlagged: { type: Boolean, default: false }
    },

    settings: {
      isGlobalReducedSpeed: { type: Boolean, default: false },
      allowSearch: { type: Boolean, default: true }
    },

    collectiveHealth: {
      averageMentalLoad: { type: Number, min: 0, max: 100, default: 0 },
      isOverloaded: { type: Boolean, default: false }
    },
  }, 
  { timestamps: true }
);

export const TeamModel = (mongoose.models.Team as Model<ITeam>) || 
                         mongoose.model<ITeam>('Team', TeamSchema);