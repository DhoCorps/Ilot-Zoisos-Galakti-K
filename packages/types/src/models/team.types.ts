import { z } from 'zod';
import { BaseNodeSchema } from './common.types';

export const BirdRoleSchema = z.enum(['ADMIN', 'MODERATOR', 'BUILDER', 'SPECTATOR']);

export const TeamSchema = BaseNodeSchema.extend({
  nom: z.string().min(3).max(50),
  description: z.string().max(300).optional(),
  owner: z.string(),
  parent: z.string().nullable().optional(),
  
  // 🛡️ RÉGLAGES : Doit correspondre à ton TeamModel
  settings: z.object({
    isGlobalReducedSpeed: z.boolean().default(false),
    allowSearch: z.boolean().default(true),
  }).default({ isGlobalReducedSpeed: false, allowSearch: true }),

  collectiveHealth: z.object({
    averageMentalLoad: z.number().default(0),
    isOverloaded: z.boolean().default(false)
  }).optional()
});

export type ITeam = z.infer<typeof TeamSchema>;
// Pour Neo4j
export interface INestingRelation {
  since: Date;
  role: z.infer<typeof BirdRoleSchema>;
  nicknameInTeam?: string;
}