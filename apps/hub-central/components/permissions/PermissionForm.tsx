'use client';

import React from 'react';
// Import des types de l'Ilot Zoizos
import { POWER_LEVELS, PowerLevelGroup } from '@ilot/types';

interface PermissionFormProps {
  selectedCaps: string[]; 
  onToggleCapability: (capString: string) => void;
}

/**
 * 🟢 COMPOSANT EXPORTÉ : PermissionForm
 * Gère l'affichage et la sélection des capacités (Plumes)
 */
export const PermissionForm = ({ selectedCaps, onToggleCapability }: PermissionFormProps) => {
  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 mt-6">
      <h3 className="text-lg font-bold text-gray-800 mb-2">2. Ajuster les Plumes (Permissions)</h3>
      <p className="text-sm text-gray-500 mb-6">
        Modifiez les droits spécifiques de cet oiseau à votre guise.
      </p>

      <div className="space-y-8">
        {/* On parcourt chaque groupe défini dans POWER_LEVELS */}
        {Object.values(POWER_LEVELS).map((group: PowerLevelGroup) => (
          <div key={group.id} className="border-t border-gray-100 pt-4">
            <div className="mb-3">
              <h4 className="text-md font-semibold text-gray-700">{group.label}</h4>
              {group.description && (
                <p className="text-xs text-gray-500 italic">{group.description}</p>
              )}
            </div>
                    
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {group.capabilities.map((capString) => { 
                const isChecked = selectedCaps.includes(capString);
                
                return (
                  <label 
                    key={capString} 
                    className={`flex items-start space-x-3 cursor-pointer p-3 rounded-lg border transition-all ${
                      isChecked 
                        ? 'bg-indigo-50 border-indigo-200 shadow-sm' 
                        : 'bg-gray-50 border-transparent hover:bg-gray-100'
                    }`}
                  >
                    <div className="flex items-center h-5">
                      <input
                        type="checkbox"
                        checked={isChecked}
                        // 🟢 Déclenche le changement immédiatement
                        onChange={() => onToggleCapability(capString)}
                        className="h-4 w-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500 cursor-pointer"
                      />
                    </div>
                    <div className="flex flex-col justify-center">
                      <span className={`text-sm font-medium ${isChecked ? 'text-indigo-900' : 'text-gray-700'}`}>
                        {capString}
                      </span>
                    </div>
                  </label>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};