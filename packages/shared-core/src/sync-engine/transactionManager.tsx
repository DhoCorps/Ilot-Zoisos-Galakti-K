import mongoose, { ClientSession } from 'mongoose';
import { getNeo4jDriver } from '@ilot/infrastructure';

export const TransactionManager = {
  /**
   * 🛡️ Exécute une opération sécurisée sur MongoDB et Neo4j simultanément.
   * Si le moindre grain de sable enraye la machine, TOUT est annulé (Rollback absolu).
   */
  async execute<T>(
    operationName: string,
    operation: (mongoSession: ClientSession, neo4jTx: any) => Promise<T>
  ): Promise<T> {
    
    // 1. Ouverture simultanée des deux canaux
    const mongoSession = await mongoose.startSession();
    mongoSession.startTransaction();

    const neo4jSession = getNeo4jDriver().session();
    const neo4jTx = neo4jSession.beginTransaction();

    try {
      // 2. Inception : Exécution de ton code métier à l'intérieur de la bulle
      const result = await operation(mongoSession, neo4jTx);

      // 3. Succès total : On scelle les deux bases de données
      await mongoSession.commitTransaction();
      await neo4jTx.commit();
      
      console.log(`✅ [NEXUS] Transaction blindée réussie : ${operationName}`);
      return result;

    } catch (error) {
      // 🚨 4. CRASH : Annulation immédiate des deux côtés
      await mongoSession.abortTransaction();
      await neo4jTx.rollback();
      
      console.error(`❌ [NEXUS] Brèche détectée sur : ${operationName}. Rollback exécuté pour préserver l'Îlot.`);
      throw error; // On propage l'erreur pour que l'interface affiche "Création impossible"

    } finally {
      // 5. Nettoyage des canaux de communication
      await mongoSession.endSession();
      await neo4jSession.close();
    }
  }
};