import { z } from 'zod';
import { BaseNodeSchema, StatutProjectSchema, PriorityLevelSchema } from './common.types';

export const ProjectSchema = BaseNodeSchema.extend({
  titre: z.string()
    .min(3, "Le titre du chantier doit contenir au moins 3 caractères")
    .max(100, "Titre trop long"),
  slug: z.string().min(3).regex(/^[a-z0-9-]+$/, "Le slug doit être au format url-friendly"),
  description: z.string().max(1000).default(''),
  ownerUid: z.string().uuid("L'UID du propriétaire doit être un UUID valide"),
  teamUid: z.string().uuid().nullable().optional(),
  statut: StatutProjectSchema.default('Planifié'),
  priority: PriorityLevelSchema.default('medium'),
  isArchived: z.boolean().default(false),
  parent: z.string().uuid().nullable().optional(),
});

export type IProject = z.infer<typeof ProjectSchema>;

// 👉 C'est lui que TypeScript cherche !
export const CreateProjectSchema = ProjectSchema.omit({
  _id: true,
  uid: true,
  createdAt: true,
  updatedAt: true,
});

export type ICreateProject = z.infer<typeof CreateProjectSchema>;