import mongoose, { Schema, Document, Model } from 'mongoose';
import { connectToDatabase } from '../../mongoose';

// ⚡ FORCE L'INITIALISATION DE LA CONNEXION
// Cela garantit que dès que le modèle est importé, Mongoose tente de se brancher
connectToDatabase().catch((err: any ) => console.error("Erreur d'auto-connexion Mongoose:", err));

export interface IPomodoroSession extends Document {
  task: mongoose.Types.ObjectId;
  user: mongoose.Types.ObjectId;
  startTime: Date;
  endTime?: Date;
  duration: number; // minutes
  status: 'completed' | 'interrupted';
}

const PomodoroSessionSchema = new Schema<IPomodoroSession>({
  // ✅ On s'assure que les références pointent vers les bons noms de modèles
  task: { type: Schema.Types.ObjectId as any, ref: 'Task', required: true },
  user: { type: Schema.Types.ObjectId as any, ref: 'User', required: true },
  startTime: { type: Date, default: Date.now },
  endTime: { type: Date },
  duration: { type: Number, required: true },
  status: { type: String, enum: ['completed', 'interrupted'], default: 'completed' }
}, { timestamps: true });

export const PomodoroSessionModel: Model<IPomodoroSession> = 
  mongoose.models.PomodoroSession || mongoose.model<IPomodoroSession>('PomodoroSession', PomodoroSessionSchema);