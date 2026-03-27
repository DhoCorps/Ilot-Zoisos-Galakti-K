'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { IRole } from '@ilot/types'; 
import { RoleForm } from './RoleForm'; 
import { PermissionForm } from '../permissions/PermissionForm';
import { teams } from '../../lib/apiClient';

interface RolesTabProps {
  targetUserId: string;
  targetUserEmail: string;
  projectId: string;
  initialRole?: string;
  initialCaps?: string[];
  onSuccess?: () => void; // 🟢 LA CORRECTION EST ICI : Nouvelle propriété
}

export const RolesTab = ({
  targetUserId,
  targetUserEmail,
  projectId,
  initialRole = 'VIEWER',
  initialCaps = [],
  onSuccess // 🟢 LA CORRECTION EST ICI
}: RolesTabProps) => {
  const { status } = useSession();

  const [role, setRole] = useState<string>(initialRole);
  const [caps, setCaps] = useState<string[]>(initialCaps);
  const [isSaving, setIsSaving] = useState(false);
  
  const [dbRoles, setDbRoles] = useState<IRole[]>([]);
  const [isLoadingRoles, setIsLoadingRoles] = useState(true);

  const isAuthorized = status === "authenticated" || status === "loading";

  useEffect(() => {
    const fetchRolesFromDB = async () => {
      try {
        const response = await fetch('/api/roles');
        if (response.ok) {
          const data = await response.json();
          setDbRoles(Array.isArray(data) ? data : []); 
        }
      } catch (error) {
        console.error("Erreur de récupération des rôles:", error);
      } finally {
        setIsLoadingRoles(false);
      }
    };
    
    fetchRolesFromDB();
  }, []);

  const initialCapsString = JSON.stringify(initialCaps || []);

  useEffect(() => {
    setRole(initialRole || 'VIEWER');
    setCaps(initialCaps || []);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [targetUserId, initialRole, initialCapsString]);
  
  const handleRoleChange = (newRoleName: string, defaultPermissions: string[]) => {
    setRole(newRoleName);
    setCaps(defaultPermissions); 
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
      
      // 🟢 LA CORRECTION EST ICI : On appelle onSuccess pour prévenir le parent
      if (onSuccess) {
        onSuccess();
      }
      
    } catch (error: any) {
      console.error("Erreur save:", error);
      alert(`Erreur: ${error.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto py-6 space-y-8">
      <div className="flex justify-between items-center bg-slate-900/60 p-6 rounded-2xl shadow-xl border border-emerald-500/20 backdrop-blur-xl">
        <div>
          <h2 className="text-2xl font-bold text-white mb-1">Configuration des Accès</h2>
          <p className="text-sm text-emerald-400/70 font-mono">Cible : {targetUserEmail}</p>
        </div>
        <button
          onClick={handleSave}
          disabled={isSaving || status === "unauthenticated"}
          className="bg-gradient-to-r from-emerald-600 to-cyan-600 hover:from-emerald-500 hover:to-cyan-500 text-white font-bold py-3 px-6 rounded-xl transition-all disabled:opacity-50 shadow-lg shadow-emerald-900/20 border border-emerald-500/50"
        >
          {isSaving ? 'Synchronisation...' : 'Enregistrer les modifications'}
        </button>
      </div>

      <div className={!isAuthorized ? "opacity-50 pointer-events-none grayscale transition-all" : "space-y-6"}>
        <RoleForm 
          currentRole={role} 
          availableRoles={dbRoles} 
          isLoading={isLoadingRoles} 
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