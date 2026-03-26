import { TeamModel, UserModel, getNeo4jSession } from '@ilot/infrastructure';
import { MoralChecker } from '../integrity/moral-checker';

export class TeamOrchestrator {

  /**
   * 👑 PROMOTION : Élève un oiseau au rang d'ADMIN dans un nid spécifique
   */
  static async promoteToAdmin(teamUid: string, targetUserUid: string) {
    const session = getNeo4jSession();
    try {
      // On cible le lien exact entre cet oiseau et ce nid pour modifier son rôle
      const cypher = `
        MATCH (u:Oiseau {mongodbId: $userUid})-[r:MEMBER_OF]->(t:Team {mongodbId: $teamUid})
        SET r.role = 'ADMIN'
        RETURN u.username AS birdName, r.role AS newRole
      `;
      
      const result = await session.run(cypher, { 
        userUid: targetUserUid, 
        teamUid: teamUid 
      });
      
      // Si la requête ne retourne rien, c'est que l'oiseau n'est pas dans le nid
      if (result.records.length === 0) {
        throw new Error("Impossible de promouvoir cet oiseau : il n'a pas encore rejoint ce nid.");
      }
      
      return { 
        success: true, 
        birdName: result.records[0].get('birdName'),
        newRole: result.records[0].get('newRole')
      };
    } finally {
      await session.close();
    }
  }

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

  /**
   * 🔍 GET : Récupère les détails du nid (Mongo) + ses habitants (Neo4j)
   */
  static async getTeamDetails(teamUid: string) {
    const team = await TeamModel.findOne({ uid: teamUid }).lean();
    if (!team) throw new Error("Ce nid n'existe pas ou a été détruit.");

    const session = getNeo4jSession();
    try {
      const cypher = `
        MATCH (u:Oiseau)-[r:MEMBER_OF]->(t:Team {mongodbId: $teamUid})
        RETURN u.mongodbId as uid, u.username as username, r.role as role, r.permissions as permissions
      `;
      const result = await session.run(cypher, { teamUid });
      
      // 🟢 LA SUTURE HYBRIDE : On complète les données Neo4j avec les emails de MongoDB
      const members = await Promise.all(result.records.map(async (record: any) => {
        const birdUid = record.get('uid');
        
        // On va chercher l'email dans Mongo
        const mongoUser = await UserModel.findOne({ uid: birdUid }).select('email').lean();
        
        return {
          uid: birdUid,
          username: record.get('username'),
          email: mongoUser?.email || "email.inconnu@ilot.fr", // 👈 La plume manquante !
          role: record.get('role'),
          permissions: record.get('permissions') || [] 
        };
      }));

      return { ...team, members };
    } finally {
      await session.close();
    }
  }
  
  /**
   * 🔄 PUT : Mutation du nid (Synchronisée Mongo/Neo4j)
   */
  static async mutateTeam(teamUid: string, data: { nom?: string, description?: string }) {
    if (data.nom) {
      const check = MoralChecker.analyze(data.nom);
      if (!check.isSafe) throw new Error(`Nom invalide : ${check.suggestion}`);
    }

    const updatedTeam = await TeamModel.findOneAndUpdate(
      { uid: teamUid },
      { $set: data },
      { new: true }
    );
    if (!updatedTeam) throw new Error("Nid introuvable pour la mutation.");

    // Synchro Neo4j uniquement si le nom change
    if (data.nom) {
      const session = getNeo4jSession();
      try {
        await session.run(`MATCH (t:Team {mongodbId: $teamUid}) SET t.nom = $nom`, { teamUid, nom: data.nom });
      } finally {
        await session.close();
      }
    }
    return updatedTeam;
  }

  /**
   * 🗑️ DELETE : Destruction totale et propre du nid
   */
  static async dissolveTeam(teamUid: string) {
    const session = getNeo4jSession();
    try {
      // 1. On coupe les ponts dans le graphe
      await session.run(`MATCH (t:Team {mongodbId: $teamUid}) DETACH DELETE t`, { teamUid });
      
      // 2. On rase le nid dans Mongo
      await TeamModel.findOneAndDelete({ uid: teamUid });
      return true;
    } finally {
      await session.close();
    }
  }

  /**
   * 💌 INVITE UN MEMBRE (Avec rôle et permissions granulaires ABAC)
   */
  static async inviteMember(teamUid: string, email: string, role: string, permissions: string[] = []) {
    // 1. On cherche l'oiseau par son email dans Mongo
    const user = await UserModel.findOne({ email });
    if (!user) throw new Error("Cet oiseau n'existe pas sur l'Îlot.");

    const session = getNeo4jSession();
    try {
      // 2. On le lie à l'équipe dans Neo4j avec son rôle ET ses permissions spécifiques
      const cypher = `
        MERGE (u:Oiseau { mongodbId: $userUid })
        WITH u
        MATCH (t:Team { mongodbId: $teamUid })
        MERGE (u)-[r:MEMBER_OF]->(t)
        SET r.role = $role, 
            r.permissions = $permissions, 
            r.since = coalesce(r.since, datetime())
        RETURN r
      `;
      
      const result = await session.run(cypher, { 
        userUid: user.uid, 
        teamUid, 
        role, 
        permissions 
      });
      
      if (result.records.length === 0) throw new Error("Impossible de lier l'oiseau (le nid n'existe pas dans le graphe).");
      
      return { success: true, userUid: user.uid };
    } finally {
      await session.close();
    }
  }

  /**
   * 🚫 BANNIT UN MEMBRE (Détruit la relation dans Neo4j)
   */
  static async removeMember(teamUid: string, targetUserUid: string) {
    const session = getNeo4jSession();
    try {
      // On cherche la relation exacte entre cet oiseau précis et ce nid précis, puis on la coupe.
      const cypher = `
        MATCH (u:Oiseau {mongodbId: $targetUserUid})-[r:MEMBER_OF]->(t:Team {mongodbId: $teamUid})
        DELETE r
        RETURN u.username AS birdName
      `;
      
      const result = await session.run(cypher, { targetUserUid, teamUid });
      
      if (result.records.length === 0) {
        throw new Error("Impossible de bannir : cet oiseau ne fait pas partie de ce nid.");
      }
      
      return result.records[0].get('birdName');
    } finally {
      await session.close();
    }
  }
}

