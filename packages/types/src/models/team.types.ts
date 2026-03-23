import { z } from 'zod';
import { BaseNodeSchema } from './common.types';

export const BirdRoleSchema = z.enum(['ADMIN', 'MODERATOR', 'BUILDER', 'SPECTATOR']);

export const TeamSchema = BaseNodeSchema.extend({
  name: z.string().min(3).max(50),
  slug: z.string(),
  description: z.string().max(300).optional(),
  avatarUrl: z.string().url().optional(),
  ownerUid: z.string(),
  settings: z.object({
    isPrivate: z.boolean().default(false),
    allowSearch: z.boolean().default(true),
  }).default({ isPrivate: false, allowSearch: true }),
  parent: z.string().nullable().optional(),
});

export type ITeam = z.infer<typeof TeamSchema>;

// Pour Neo4j
export interface INestingRelation {
  since: Date;
  role: z.infer<typeof BirdRoleSchema>;
  nicknameInTeam?: string;
}