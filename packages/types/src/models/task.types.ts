import { z } from 'zod';
import { BaseNodeSchema, ProjectPrioritySchema, ComplexityLevelSchema } from './common.types';

/**
 * 🍂 TASK SCHEMA (La Brindille)
 * Unité de travail atomique au sein d'un Fragment (Projet).
 */
export const TaskSchema = BaseNodeSchema.extend({
  title: z.string()
    .min(2, "Le titre de la brindille est trop court")
    .max(100, "Titre trop long"),

  description: z.string().default(''),

  // 🔗 LES PIVOTS (Format String UID pour le pont Neo4j)
  projectId: z.string().min(1, "L'UID du fragment est requis"), 
  creatorUid: z.string().min(1, "L'UID du créateur est requis"), 
  assignees: z.array(z.string()).default([]), 
  parentId: z.string().nullable().optional(), // Si c'est une sous-tâche
  
  // 🛡️ MÉTADONNÉES
  isPrivate: z.boolean().default(true),
  priority: ProjectPrioritySchema.default('MEDIUM'),
  complexity: ComplexityLevelSchema.default(1),
  status: z.string().default('TODO'), // Flexibilité pour les colonnes Kanban
  
  // 🧘 WELLBEING (L'ADN de l'Îlot)
  wellbeing: z.object({
    stressImpact: z.number().min(0).max(100).default(0),
    isBlocking: z.boolean().default(false),
  }).default({ stressImpact: 0, isBlocking: false }),

  // 🍅 TOM-HAT-TOES (La mécanique d'effort)
  estimatedPomodoros: z.number().int().min(1).default(1),
  completedPomodoros: z.number().int().min(0).default(0),
});

export type ITask = z.infer<typeof TaskSchema>;