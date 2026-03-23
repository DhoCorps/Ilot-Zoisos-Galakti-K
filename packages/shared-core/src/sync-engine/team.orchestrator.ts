import { TeamModel, UserModel, getNeo4jSession } from '@ilot/infrastructure';
import { MoralChecker } from '../integrity/moral-checker';

export class TeamOrchestrator {
  /**
   * 🏗️ FONDE UNE ESCOUADE (Gère les équipes d'équipes et l'auto-réparation)
   */
  static async fosterTeam(teamData: { 
    nom: string, 
    creatorUid: string, 
    description?: string,
    parentUid?: string // 👈 Le secret de l'Inception
  }) {
    const check = MoralChecker.analyze(teamData.nom);
    if (!check.isSafe) throw new Error(`Nom invalide : ${check.suggestion}`);

    const createur = await UserModel.findOne({ uid: teamData.creatorUid });
    if (!createur) throw new Error("Créateur introuvable.");

    // 1. Mongo : On cherche l'ObjectId du parent si un parentUid est fourni
    let parentObjectId = null;
    if (teamData.parentUid) {
      const parentTeam = await TeamModel.findOne({ uid: teamData.parentUid });
      if (!parentTeam) throw new Error("L'escouade parente n'existe pas.");
      parentObjectId = parentTeam._id;
    }

    const newTeam = await TeamModel.create({
      nom: teamData.nom,
      description: teamData.description,
      createur: createur._id,
      leader: createur._id,
      parent: parentObjectId // 👈 Mongo sait qui est le parent
    });

    // 2. Neo4j : Création du nœud, du leader, ET de la relation parentale
    const session = getNeo4jSession();
    try {
      // 🩹 FIX : MERGE au lieu de MATCH pour l'oiseau (Auto-guérison)
      let cypher = `
        MERGE (u:Oiseau { mongodbId: $creatorUid })
        MERGE (t:Team { mongodbId: $teamUid })
        ON CREATE SET t.nom = $nom, t.createdAt = datetime()
        MERGE (u)-[r:MEMBER_OF { role: 'ADMIN' }]->(t)
        ON CREATE SET r.since = coalesce(r.since, datetime())
      `;

      if (teamData.parentUid) {
        cypher += `
          WITH t
          MATCH (p:Team { mongodbId: $parentUid })
          MERGE (t)-[:CHILD_OF]->(p)
        `;
      }

      await session.run(cypher, {
        creatorUid: teamData.creatorUid,
        teamUid: newTeam.uid,
        nom: newTeam.nom,
        parentUid: teamData.parentUid
      });
    } finally {
      await session.close();
    }

    return { success: true, team: newTeam };
  }

  /**
   * 🎖️ ASSIGNE UN RÔLE SPÉCIFIQUE (Permissions granulaires)
   */
  static async assignRole(teamUid: string, targetUserUid: string, role: string) {
    const session = getNeo4jSession();
    try {
      // 🩹 FIX : On ajoute WITH u pour faire le pont entre MERGE et MATCH
      const cypher = `
        MERGE (u:Oiseau { mongodbId: $userUid })
        WITH u
        MATCH (t:Team { mongodbId: $teamUid })
        MERGE (u)-[r:MEMBER_OF]->(t)
        SET r.role = $role, r.since = coalesce(r.since, datetime())
        RETURN r.role AS assignedRole
      `;
      
      const result = await session.run(cypher, { userUid: targetUserUid, teamUid, role });
      if (result.records.length === 0) throw new Error("Impossible de lier l'oiseau (l'équipe n'existe pas dans le graphe).");
      
      return { success: true, role: result.records[0].get('assignedRole') };
    } finally {
      await session.close();
    }
  }
}