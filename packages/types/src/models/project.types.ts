import { z } from 'zod';
import { BaseNodeSchema, StatutProjectSchema, PriorityLevelSchema } from './common.types';

/**
 * 🛰️ SCHÉMA GLOBAL DU PROJET
 * Aligné sur la santé de l'Îlot Zoizos
 */
export const ProjectSchema = BaseNodeSchema.extend({
  titre: z.string()
    .min(3, "Le titre du chantier doit contenir au moins 3 caractères")
    .max(100, "Titre trop long"),
  slug: z.string()
    .min(3)
    .regex(/^[a-z0-9-]+$/, "Le slug doit être au format url-friendly"),
  description: z.string().max(1000).default(''),
  
  // ⚡ SUTURE : On utilise 'owner' (UID String) pour la cohérence Graphe/Mongo
  owner: z.string().min(1, "L'UID du propriétaire est requis"),
  
  // ⚡ SUTURE : teamId est le pivot vers le Nid (Team)
  teamId: z.string().nullable().optional(),
  
  statut: StatutProjectSchema.default('Planifié'),
  priority: PriorityLevelSchema.default('medium'), // 👈 Utilise l'échelle trivial -> critical
  
  isArchived: z.boolean().default(false),
  parent: z.string().nullable().optional(),

  // 📈 BIOMÉTRIE : Intégration de la santé du fragment
  wellbeing: z.object({
    globalStressLevel: z.number().min(0).max(100).default(0),
    isAtReducedSpeed: z.boolean().default(false)
  }).default({ globalStressLevel: 0, isAtReducedSpeed: false }),
});

export type IProject = z.infer<typeof ProjectSchema>;

/**
 * 🏗️ SCHÉMA DE CRÉATION
 * On omet les IDs et dates générés par le serveur
 */
export const CreateProjectSchema = ProjectSchema.omit({
  _id: true,
  uid: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  owner: z.string().optional(), // Souvent injecté par la session côté serveur
});

export type ICreateProject = z.infer<typeof CreateProjectSchema>;