import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IStatus extends Document {
  uid: string;      // Requis pour Neo4j et dnd-kit
  intitule: string;
  color?: string;   // Pour le style {{ backgroundColor: status.color }}
  ordre: number;    // Pour que tes colonnes restent dans le bon ordre
}

const StatusSchema: Schema<IStatus> = new Schema({
  uid: { 
    type: String, 
    required: true, 
    unique: true 
  },
  intitule: { 
    type: String, 
    required: [true, "L'intitulé est obligatoire"], 
    unique: true 
  },
  color: { 
    type: String, 
    default: '#64748b' 
  },
  ordre: { 
    type: Number, 
    default: 0 
  }
}, { timestamps: true });

// Ton fix Anti-Zombie est gardé précieusement
if (mongoose.models.Status) {
  delete mongoose.models.Status;
}

export const StatusModel: Model<IStatus> = 
  mongoose.model<IStatus>('Status', StatusSchema);