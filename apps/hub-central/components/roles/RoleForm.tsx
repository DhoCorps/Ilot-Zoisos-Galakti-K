'use client';

import React from 'react';
import { ProjectRole } from '@ilot/types';

interface RoleFormProps {
  currentRole: ProjectRole;
  onRoleChange: (role: ProjectRole) => void;
}

/**
 * 🟢 COMPOSANT EXPORTÉ : RoleForm
 * Gère la sélection du rôle global de l'oiseau (ADMIN, EDITOR, VIEWER)
 */
export const RoleForm = ({ currentRole, onRoleChange }: RoleFormProps) => {
  
  const roles: ProjectRole[] = ['ADMIN', 'MODERATOR', 'VIEWER'];

  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
      <h3 className="text-lg font-bold text-gray-800 mb-4">1. Choisir le Rôle</h3>
      <div className="flex space-x-4">
        {roles.map((role) => (
          <button
            key={role}
            type="button"
            // Déclenche le changement de rôle dans le parent
            onClick={() => onRoleChange(role)}
            className={`px-6 py-2 rounded-lg font-semibold transition-all shadow-sm ${
              currentRole === role
                ? 'bg-indigo-600 text-white ring-2 ring-indigo-300'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {role}
          </button>
        ))}
      </div>
      <p className="text-xs text-gray-400 mt-4 italic">
        Le rôle définit le niveau de base des permissions.
      </p>
    </div>
  );
};