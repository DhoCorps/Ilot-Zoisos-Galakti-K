import { z } from 'zod';

export const ProjectRoleSchema = z.enum(['ADMIN', 'MODERATOR', 'BUILDER', 'SPECTATOR', 'OWNER', 'VIEWER']);
export type ProjectRole = z.infer<typeof ProjectRoleSchema>;

// 🔥 CAPACITÉS (Permissions fines unifiées)
export const CAPABILITIES = {
  TEAM: { CREATE: 'team:create', READ: 'team:read', UPDATE: 'team:update', DELETE: 'team:delete', MANAGE: 'team:manage-members' },
  MEMBER: { INVITE: 'member:invite', READ: 'member:read', LIST: 'member:list', UPDATE: 'member:update', EXILE: 'member:exile' },
  PROJECT: { CREATE: 'project:create', READ: 'project:read', UPDATE: 'project:update', DELETE: 'project:delete', ARCHIVE: 'project:archive' },
  TASK: { CREATE: 'task:create', READ: 'task:read', UPDATE: 'task:update', DELETE: 'task:delete', MOVE: 'task:move' },
  FILE: { UPLOAD: 'file:upload', READ: 'file:read', UPDATE: 'file:update', DOWNLOAD: 'file:download', BURN: 'file:burn' },
  SYSTEM: { MONITOR: 'wellbeing:monitor', MODERATE: 'moderation:execute', ALL: '*' }
} as const;

export interface PowerLevelGroup {
  id: string;
  label: string;
  description: string;
  capabilities: string[];
}

export const POWER_LEVELS: Record<string, PowerLevelGroup> = {
  ARCHITECTE: {
    id: 'ARCHITECTE',
    label: "Niveau Architecte (Accès Total)",
    description: "Contrôle absolu sur l'infrastructure et les oiseaux.",
    capabilities: [CAPABILITIES.SYSTEM.ALL] 
  },
  MODERATEUR: {
    id: 'MODERATEUR',
    label: "Niveau Gardien (Modération)",
    description: "Veille sur le bien-être mental et gère les conflits.",
    capabilities: [CAPABILITIES.SYSTEM.MONITOR, CAPABILITIES.SYSTEM.MODERATE, CAPABILITIES.MEMBER.READ, CAPABILITIES.MEMBER.LIST]
  },
  BATISSEUR: {
    id: 'BATISSEUR',
    label: "Niveau Bâtisseur (Création)",
    description: "Peut forger des projets, uploader des fichiers et créer des tâches.",
    capabilities: [
      CAPABILITIES.PROJECT.CREATE, CAPABILITIES.PROJECT.READ, CAPABILITIES.PROJECT.UPDATE,
      CAPABILITIES.TASK.CREATE, CAPABILITIES.TASK.READ, CAPABILITIES.TASK.UPDATE, CAPABILITIES.TASK.MOVE,
      CAPABILITIES.FILE.UPLOAD, CAPABILITIES.FILE.READ
    ]
  }
};