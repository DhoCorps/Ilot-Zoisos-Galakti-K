import { z } from 'zod';
import { BaseNodeSchema, PriorityLevelSchema, ComplexityLevelSchema } from './common.types';

/**
 * 🍂 TASK SCHEMA (La Brindille)
 * Unité de travail atomique au sein d'un Fragment (Projet).
 */
export const TaskSchema = BaseNodeSchema.extend({
  // title de la tâche (min 2 caractères pour les noms courts comme "UI")
  title: z.string()
    .min(2, "Le title de la brindille est trop court")
    .max(100, "title trop long"),

  description: z.string().default(''),

  // Lien vers le Fragment parent (MongoDB & Neo4j)
  projetUid: z.string().uuid("L'UID du projet doit être un UUID valide"),

  // Les oiseaux assignés à cette brindille
  assignees: z.array(z.string().uuid()).default([]), 
  
  // Métadonnées de gestion
  priority: PriorityLevelSchema.default('medium'),
  complexity: ComplexityLevelSchema.default(1),
  
  // ID du status (référence au schéma de status du projet)
  status: z.string().min(1, "Un status est requis"), 
  
  /**
   * 🧘 WELLBEING (L'ADN de l'Îlot)
   * Mesure l'impact de la tâche sur la santé mentale du nid.
   */
  wellbeing: z.object({
    stressImpact: z.number().min(0).max(100).default(0),
    isBlocking: z.boolean().default(false),
  }).default({ stressImpact: 0, isBlocking: false }),

  /**
   * 🌳 HIÉRARCHIE (Neo4j)
   * Permet de créer des sous-tâches dans le graphe.
   */
  parent: z.string().uuid().nullable().optional(),
});

/**
 * 💡 TYPE INFERÉ
 * On l'appelle ITask pour correspondre à tes imports dans le reste de l'app.
 */
export type ITask = z.infer<typeof TaskSchema>;

/**
 * 🛠️ DTO pour la création (exclut les champs automatiques)
 */
export const CreateTaskSchema = TaskSchema.omit({
  _id: true,
  uid: true,
  createdAt: true,
  updatedAt: true,
});

export type ICreateTask = z.infer<typeof CreateTaskSchema>;