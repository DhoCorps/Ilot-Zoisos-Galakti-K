// packages/shared-core/src/sync-engine/orchestrator.ts

import { MoralChecker } from '../integrity/moral-checker';
// On importe la fonction de baguage depuis l'infrastructure
import { baguerOiseau } from '@ilot/infrastructure'; 

export interface SyncResult {
  source: 'mongodb' | 'neo4j';
  status: 'success' | 'failed';
  timestamp: number;
}

export class SyncOrchestrator {
  /**
   * Synchronise un nouvel utilisateur entre Mongo et Neo4j
   * On bague l'oiseau pour qu'il existe dans le réseau social de l'Îlot
   */
  static async syncUserCreation(userData: { 
    mongodbId: string; 
    username: string; 
    role: string 
  }) {
    console.log(`✨ [Orchestrator] Début du baguage pour l'oiseau : ${userData.username}`);
    
    try {
      // 1. Appel de la fonction de l'infrastructure pour créer le NODE (:Oiseau)
      // On utilise le "mongodbId" comme clé unique pour éviter les doublons
      const node = await baguerOiseau({
        mongodbId: userData.mongodbId,
        username: userData.username,
        role: userData.role
      });
      
      console.log(`✅ [Orchestrator] Baguage réussi dans Neo4j pour l'ID: ${userData.mongodbId}`);

      return { 
        status: 'success' as const, 
        source: 'neo4j' as const, 
        timestamp: Date.now(),
        data: node 
      };
    } catch (error) {
      console.error(`🔥 [Sync Error] Échec du baguage Neo4j :`, error);
      // On throw pour que l'API de register puisse gérer l'erreur de synchro
      throw error; 
    }
  }

  /**
   * Méthode de sécurité : Vérifie l'intégrité avant de synchroniser
   */
  static async validateAndSync(content: string, action: () => Promise<any>) {
    const analysis = MoralChecker.analyze(content);
    
    if (!analysis.isSafe) {
      throw new Error(`Action bloquée par le MoralChecker : ${analysis.suggestion}`);
    }

    return await action();
  }
}