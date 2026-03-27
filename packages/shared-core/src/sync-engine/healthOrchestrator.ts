import { ProjectModel, TeamModel, getNeo4jDriver } from '@ilot/infrastructure';
import { Types } from 'mongoose';

export const HealthOrchestrator = {
  /**
   * 📉 Synchronise la santé collective d'un nid basée sur ses fragments actifs.
   */
  async syncTeamHealth(teamId: Types.ObjectId | string) {
    // 1. Agrégation des données de stress dans MongoDB
    // On ne compte que les fragments non-archivés
    const stats = await ProjectModel.aggregate([
      { 
        $match: { 
          teamId: new Types.ObjectId(teamId), 
          isArchived: false 
        } 
      },
      { 
        $group: {
          _id: "$teamId",
          averageStress: { $avg: "$wellbeing.globalStressLevel" },
          projectCount: { $sum: 1 }
        }
      }
    ]);

    const result = stats[0] || { averageStress: 0, projectCount: 0 };
    
    // Détermination de la surcharge (seuil arbitraire à 75% ou trop de projets)
    const isOverloaded = result.averageStress > 75 || result.projectCount > 10;

    // 2. Mise à jour de MongoDB (Source de vérité biométrique)
    const updatedTeam = await TeamModel.findByIdAndUpdate(
      teamId,
      { 
        $set: { 
          "collectiveHealth.averageMentalLoad": Math.round(result.averageStress),
          "collectiveHealth.isOverloaded": isOverloaded
        } 
      },
      { new: true }
    );

    if (!updatedTeam) return;

    // 3. Synchronisation Neo4j (Visualisation de la température du Graphe)
    const session = getNeo4jDriver().session();
    try {
      await session.run(`
        MATCH (t:Team {uid: $uid})
        SET t.averageMentalLoad = $load,
            t.isOverloaded = $isOverloaded,
            t.updatedAt = datetime()
      `, {
        uid: updatedTeam.uid,
        load: Math.round(result.averageStress),
        isOverloaded: isOverloaded
      });
    } finally {
      await session.close();
    }

    return updatedTeam;
  }
};