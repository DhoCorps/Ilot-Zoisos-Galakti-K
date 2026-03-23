import mongoose, { Schema, Document, Model, Types } from 'mongoose';
import { v4 as uuidv4 } from 'uuid';


// 1. L'INTERFACE
export interface ITeam extends Document {
  _id: Types.ObjectId; 
  uid: string; 
  nom: string;
  description?: string;
  avatarUrl?: string; 
  parent?: Types.ObjectId | ITeam | null; 
  createur: Types.ObjectId; // Marqué requis ici aussi
  leader?: Types.ObjectId; 
  
  collectiveHealth: {
    averageMentalLoad?: number;
    isOverloaded: boolean;
  };
  moderation: {
    isFlagged: boolean;
  };
  
  createdAt: Date;
  updatedAt: Date;
}

// 2. LE SCHÉMA
const TeamSchema = new Schema<ITeam>(
  {
    uid: { 
      type: String, 
      required: true, 
      unique: true, 
      // ⚡ FIX: On passe la fonction, pas le résultat de la fonction
      default: () => uuidv4() 
    },
    nom: { 
      type: String, 
      required: true,
      unique: true,
      trim: true
    },
    description: { type: String },
    avatarUrl: { type: String, default: '' },
    
    // --- INCEPTION (Récursivité) ---
    parent: { 
      type: Schema.Types.ObjectId, 
      ref: 'Team', 
      default: null 
    },
    
    createur: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true 
    },

    leader: {
      type: Schema.Types.ObjectId,
      ref: 'User'
    },

    collectiveHealth: {
      averageMentalLoad: { type: Number, min: 0, max: 100, default: 0 },
      isOverloaded: { type: Boolean, default: false }
    },
    moderation: {
      isFlagged: { type: Boolean, default: false }
    }
  }, 
  { 
    timestamps: true 
  }
);

// --- PATTERN NEXT.JS ROBUSTE ---
// ⚡ FIX: Utilise 'Team' (majuscule) partout pour la cohérence
export const TeamModel = (mongoose.models.Team as Model<ITeam>) || mongoose.model<ITeam>('Team', TeamSchema);