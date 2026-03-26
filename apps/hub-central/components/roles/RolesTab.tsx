'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { ProjectRole } from '@ilot/types';
import { RoleForm } from './RoleForm'; 
import { PermissionForm } from '../permissions/PermissionForm';
import { teams } from '../../lib/apiClient';

interface RolesTabProps {
  targetUserId: string;
  targetUserEmail: string;
  projectId: string;
  initialRole?: ProjectRole;
  initialCaps?: string[];
}

export const RolesTab = ({
  targetUserId,
  targetUserEmail,
  projectId,
  initialRole = 'VIEWER',
  initialCaps = []
}: RolesTabProps) => {
  const { status } = useSession();

  // États locaux
  const [role, setRole] = useState<ProjectRole>(initialRole);
  const [caps, setCaps] = useState<string[]>(initialCaps);
  const [isSaving, setIsSaving] = useState(false);

  // 🔓 On autorise l'interaction si on est authentifié ou en cours de chargement
  const isAuthorized = status === "authenticated" || status === "loading";

  /**
   * 🔄 Synchronisation initiale :
   * On ne met à jour l'état que si targetUserId change (changement d'oiseau)
   * pour ne pas écraser les modifications manuelles de l'utilisateur.
   */
  useEffect(() => {
    setRole(initialRole);
    setCaps(initialCaps && initialCaps.length > 0 ? initialCaps : []);
  }, [targetUserId, initialRole, initialCaps]);

  const handleRoleChange = (newRole: ProjectRole) => {
    setRole(newRole);
  };

  const handleToggleCapability = (capId: string) => {
    setCaps((prev) =>
      prev.includes(capId) ? prev.filter((c) => c !== capId) : [...prev, capId]
    );
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await teams.invite({
        teamId: projectId,
        email: targetUserEmail,
        role: role,
        permissions: caps
      });
      alert("L'oiseau a été mis à jour avec succès !");
    } catch (error: any) {
      console.error("Erreur save:", error);
      alert(`Erreur: ${error.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto py-6 space-y-8">
      {/* Header avec bouton d'enregistrement */}
      <div className="flex justify-between items-center bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Configuration des Accès</h2>
          <p className="text-sm text-gray-500">Gestion de l'oiseau : {targetUserEmail}</p>
        </div>
        <button
          onClick={handleSave}
          disabled={isSaving || status === "unauthenticated"}
          className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-6 rounded-lg transition-all disabled:opacity-50 shadow-md"
        >
          {isSaving ? 'Synchronisation...' : 'Enregistrer les modifications'}
        </button>
      </div>

      {/* Formulaires */}
      <div className={!isAuthorized ? "opacity-50 pointer-events-none" : ""}>
        <RoleForm 
          currentRole={role} 
          onRoleChange={handleRoleChange} 
        />
        
        <PermissionForm 
          selectedCaps={caps} 
          onToggleCapability={handleToggleCapability} 
        />
      </div>
    </div>
  );
};