import { z } from 'zod';
import { BaseNodeSchema, ProjectStatusSchema, ProjectPrioritySchema } from './common.types';

/**
 * 🛰️ SCHÉMA GLOBAL DU PROJET
 * Aligné sur la santé de l'Îlot Zoizos (100% Anglais)
 */
export const ProjectSchema = BaseNodeSchema.extend({
  title: z.string() // 👈 Ex-title
    .min(3, "Le title du chantier doit contenir au moins 3 caractères")
    .max(100, "title trop long"),
  slug: z.string()
    .min(3)
    .regex(/^[a-z0-9-]+$/, "Le slug doit être au format url-friendly"),
  description: z.string().max(1000).default(''),
  
  // ⚡ SUTURE : Nouveaux pivots
  ownerId: z.string().min(1, "L'UID du propriétaire est requis"), // 👈 Ex-owner
  teamId: z.string().nullable().optional(),
  parentId: z.string().nullable().optional(), // 👈 Ex-parent
  
  status: ProjectStatusSchema.default('PLANNED'), // 👈 Ex-status
  priority: ProjectPrioritySchema.default('MEDIUM'), // 👈 Ex-priority
  
  isArchived: z.boolean().default(false),

  // 📈 BIOMÉTRIE : Intégration de la santé du fragment
  wellbeing: z.object({
    globalStressLevel: z.number().min(0).max(100).default(0),
    isAtReducedSpeed: z.boolean().default(false)
  }).default({ globalStressLevel: 0, isAtReducedSpeed: false }),
});

export type IProject = z.infer<typeof ProjectSchema>;

/**
 * 🏗️ SCHÉMA DE CRÉATION
 */
export const CreateProjectSchema = ProjectSchema.omit({
  _id: true,
  uid: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  ownerId: z.string().optional(), // 👈 Ex-owner
});

export type ICreateProject = z.infer<typeof CreateProjectSchema>;