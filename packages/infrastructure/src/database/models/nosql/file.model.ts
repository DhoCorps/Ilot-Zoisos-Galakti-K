import mongoose, { Schema, Document } from 'mongoose';
import { IlotFile } from "@ilot/types";

// On définit l'interface Mongoose en se basant sur le type Core
export interface IFile extends Document, Omit<IlotFile, 'id' | 'createdAt'> {
  _id: mongoose.Types.ObjectId;
  createdAt: Date;
}

const FileSchema = new Schema<IFile>({
  name: { type: String, required: true },
  path: { type: String, required: true },
  size: { type: Number, required: true },
  mimeType: { type: String, required: true },
  // On stocke l'UID string pour la cohérence avec Neo4j
  ownerId: { type: String, required: true, index: true }, 
  entityType: { 
    type: String, 
    enum: ['project', 'task', 'team'], 
    required: true 
  },
  // On stocke l'UID de la cible (Task ou Project)
  entityId: { type: String, required: true, index: true },
  createdAt: { type: Date, default: Date.now }
});

// Création d'index pour accélérer les recherches de fichiers par projet ou par tâche
FileSchema.index({ entityId: 1, entityType: 1 });

export const FileModel = mongoose.models.File || mongoose.model<IFile>('File', FileSchema);