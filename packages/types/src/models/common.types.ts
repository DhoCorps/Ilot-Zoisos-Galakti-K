import { z } from 'zod';

// 1. Renommé pour éviter la collision avec status.types.ts
export type StatusEnum = 'TODO' | 'IN_PROGRESS' | 'DONE' | 'ARCHIVED' | 'BLOCKED' | 'ABANDONED';

export const STATUS_CONFIG: Record<StatusEnum, { label: string, color: string }> = {
  TODO: { label: '?', color: 'gray' },
  IN_PROGRESS: { label: '...', color: 'blue' },
  DONE: { label: '!', color: 'green' },
  ARCHIVED: { label: 'M', color: 'purple' },
  BLOCKED: { label: 'B', color: 'orange' },
  ABANDONED : { label: 'X', color: 'red' }
};

// 🏗️ Le Pivot MongoDB / Neo4j
export const BaseNodeSchema = z.object({
  _id: z.string().optional(), 
  uid: z.string().uuid().optional(), 
  createdAt: z.union([z.date(), z.string()]).optional(),
  updatedAt: z.union([z.date(), z.string()]).optional(),
});

// 👉 L'EXPORT MANQUANT : on génère IBaseNode pour les autres fichiers
export type IBaseNode = z.infer<typeof BaseNodeSchema>;

// 📊 Constantes Globales
export const StatutProjectSchema = z.enum(['Planifié', 'En Cours', 'Terminé', 'En Pause', 'Vitesse Réduite']);
export const PriorityLevelSchema = z.enum(['trivial', 'easy', 'medium', 'hard', 'extreme', 'critical']); // 👈 Échelle complète
// 👉 L'EXPORT MANQUANT POUR TASKS
export const ComplexityLevelSchema = z.number().min(1).max(10).default(1);