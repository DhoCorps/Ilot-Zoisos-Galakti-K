import mongoose, { Schema, Document, Model, Types } from 'mongoose';
import { v4 as uuidv4 } from 'uuid';

/**
 * 🗄️ INTERFACE (Contrat TypeScript)
 */
export interface ITeam extends Document {
  _id: Types.ObjectId; 
  uid: string; 
  nom: string;
  description?: string;
  avatarUrl?: string; 
  parent?: Types.ObjectId | ITeam | null; 
  createur: Types.ObjectId; 
  leader?: Types.ObjectId; 
  
  // 🛡️ RÉGLAGES : Le panneau de contrôle du Nid
  settings: {
    isGlobalReducedSpeed: boolean; 
    allowSearch: boolean;
  };
  
  // 📉 BIOMÉTRIE : Calculée par le HealthOrchestrator
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
    uid: { 
      type: String, 
      required: true, 
      unique: true, 
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

    moderation: {
      isFlagged: { type: Boolean, default: false }
    },

    // ⚡ OPTIONS DE GESTION
    settings: {
      isGlobalReducedSpeed: { type: Boolean, default: false }, // Bouton "Urgence"
      allowSearch: { type: Boolean, default: true }
    },

    // ⚡ DONNÉES DE SANTÉ COLLECTIVE
    collectiveHealth: {
      averageMentalLoad: { type: Number, min: 0, max: 100, default: 0 },
      isOverloaded: { type: Boolean, default: false }
    },
  }, 
  { timestamps: true }
);

/**
 * 👑 EXPORT DU MODÈLE
 */
export const TeamModel = (mongoose.models.Team as Model<ITeam>) || 
                         mongoose.model<ITeam>('Team', TeamSchema);