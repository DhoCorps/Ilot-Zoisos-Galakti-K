import { ProjectModel, TeamModel, getNeo4jDriver } from '@ilot/infrastructure';
import { Types } from 'mongoose';

export const HealthOrchestrator = {
  /**
   * 📉 Synchronise la santé collective d'un nid basée sur ses fragments actifs.
   */
  async syncTeamHealth(teamId: Types.ObjectId | string) {
    const teamObjectId = typeof teamId === 'string' ? new Types.ObjectId(teamId) : teamId;

    // 1. Agrégation des données de stress dans MongoDB
    const stats = await ProjectModel.aggregate([
      { 
        $match: { 
          teamId: teamObjectId.toString(), // On matche l'UID string stocké dans Project
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
    const load = Math.round(result.averageStress);
    
    // 🛡️ SÉCURITÉ : Activation automatique de la Vitesse Réduite si charge > 90%
    let isGlobalReducedSpeed = false;
    if (load > 90) {
      isGlobalReducedSpeed = true;
      await ProjectModel.updateMany(
        { teamId: teamObjectId.toString(), isArchived: false },
        { 
          $set: { 
            "wellbeing.isAtReducedSpeed": true,
            status: 'Vitesse Réduite' 
          } 
        }
      );
    }

    // Détermination de la surcharge
    const isOverloaded = load > 75 || result.projectCount > 10;

    // 2. Mise à jour de MongoDB (Source de vérité biométrique)
    const updatedTeam = await TeamModel.findByIdAndUpdate(
      teamObjectId,
      { 
        $set: { 
          "collectiveHealth.averageMentalLoad": load,
          "collectiveHealth.isOverloaded": isOverloaded,
          "settings.isGlobalReducedSpeed": isGlobalReducedSpeed // 👈 Mise à jour des réglages
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
            t.isGlobalReducedSpeed = $isGlobalReducedSpeed,
            t.updatedAt = datetime()
      `, {
        uid: updatedTeam.uid,
        load: load,
        isOverloaded: isOverloaded,
        isGlobalReducedSpeed: isGlobalReducedSpeed
      });
    } finally {
      await session.close();
    }

    return updatedTeam;
  }
};