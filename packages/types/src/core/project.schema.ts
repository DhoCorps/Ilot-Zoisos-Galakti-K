import { z } from 'zod';
import { BaseNodeSchema, ProjectStatusSchema, ProjectPrioritySchema } from '../models/common.types';

export const ProjectSchema = BaseNodeSchema.extend({
  title: z.string()
    .min(3, "Le title du chantier doit contenir au moins 3 caractères")
    .max(100, "title trop long"),
  slug: z.string().min(3).regex(/^[a-z0-9-]+$/, "Le slug doit être au format url-friendly"),
  description: z.string().max(1000).default(''),
  
  // ⚡ SUTURE : On utilise 'owner' pour matcher le modèle Mongo
  ownerId: z.string().min(1, "Le propriétaire est requis"), 
  
  // ⚡ SUTURE : teamId est maintenant un String (UID Neo4j)
  teamId: z.string().nullable().optional(),
  
  status: ProjectStatusSchema.default('PLANNED'),
  priority: ProjectPrioritySchema.default('MEDIUM'),
  isArchived: z.boolean().default(false),
  isPrivate: z.boolean().default(true),

  
  tags: z.array(z.string()).default([]),
  startDate: z.coerce.date().optional(), // z.coerce.date() transforme la string du formulaire en objet Date
  estimatedEndDate: z.coerce.date().optional(),
  closedAt: z.coerce.date().optional(),
  deadline: z.coerce.date().optional(),
  
  // 📈 BIOMÉTRIE : Intégration de la santé du fragment
  wellbeing: z.object({
    globalStressLevel: z.number().min(0).max(100).default(0),
    isAtReducedSpeed: z.boolean().default(false)
  }).default({ globalStressLevel: 0, isAtReducedSpeed: false }),

  parent: z.string().nullable().optional(),
});

// Pour la création, on omet les champs générés par le Nexus
export const CreateProjectSchema = ProjectSchema.omit({
  _id: true,
  uid: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  // On peut rendre owner optionnel ici si l'API l'injecte elle-même
  owner: z.string().optional(), 
});

export type IProject = z.infer<typeof ProjectSchema>;
export type ICreateProject = z.infer<typeof CreateProjectSchema>;