import { ITeam, TeamModel, UserModel, getNeo4jSession } from '@ilot/infrastructure';
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
    creatorId: any, // 👈 Ajoute cette ligne (tu peux mettre Types.ObjectId si tu as importé de mongoose)
    description?: string,
    parentUid?: string,
    settings?: any // 👈 Ajoute aussi ceci pour être tranquille avec les réglages
}) {
    const check = MoralChecker.analyze(teamData.nom);
    if (!check.isSafe) throw new Error(`Nom invalide : ${check.suggestion}`);

    // 1. Validation de l'existence du créateur dans Mongo
    const createur = await UserModel.findOne({ uid: teamData.creatorUid });
    if (!createur) throw new Error("Créateur introuvable.");

    let parentObjectId = null;
    if (teamData.parentUid) {
      const parentTeam = await TeamModel.findOne({ uid: teamData.parentUid });
      if (!parentTeam) throw new Error("L'escouade parente n'existe pas dans la matrice Mongo.");
      parentObjectId = parentTeam._id;
    }

    // 2. Création Mongo
    const newTeam = await TeamModel.create({
      nom: teamData.nom,
      description: teamData.description,
      createur: createur._id,
      leader: createur._id,
      parent: parentObjectId 
    });

    // 3. Forge Neo4j
    const session = getNeo4jSession();
    try {
      // On utilise des paramètres explicites pour éviter toute confusion
      const cypher = `
        MERGE (u:Oiseau { uid: $creatorUid })
        MERGE (t:Team { uid: $teamUid })
        ON CREATE SET t.nom = $nom, t.createdAt = datetime()
        MERGE (u)-[r:MEMBER_OF { role: 'ADMIN' }]->(t)
        ON CREATE SET r.since = datetime()
        WITH t
        // Cette partie ne s'exécute que si parentUid est fourni
        CALL apoc.do.when(
          $parentUid IS NOT NULL,
          'MATCH (p:Team { uid: parentUid }) MERGE (t)-[:CHILD_OF]->(p) RETURN t',
          'RETURN t',
          {t: t, parentUid: $parentUid}
        ) YIELD value
        RETURN count(t)
      `;

      await session.run(cypher, {
        creatorUid: teamData.creatorUid,
        teamUid: newTeam.uid, // On utilise bien l'UUID
        nom: newTeam.nom,
        parentUid: teamData.parentUid || null
      });
    } catch (neoError) {
      // Si Neo4j échoue, on devrait idéalement rollback Mongo, 
      // mais au moins on log l'alerte de désynchronisation
      console.error("⚠️ Désynchronisation Graphique :", neoError);
    } finally {
      await session.close();
    }

    return { success: true, team: newTeam };
  }

  /**
   * 🎖️ ASSIGNE UN RÔLE SPÉCIFIQUE (Et ses permissions granulaires sur-mesure)
   */
  static async assignRole(teamUid: string, targetUserUid: string, role: string, permissions: string[] = []) {
    const session = getNeo4jSession();
    try {
      const cypher = `
        MERGE (u:Oiseau { mongodbId: $userUid })
        WITH u
        MATCH (t:Team { mongodbId: $teamUid })
        MERGE (u)-[r:MEMBER_OF]->(t)
        // 🟢 FIX : On enregistre maintenant le rôle ET les permissions spécifiques !
        SET r.role = $role, 
            r.permissions = $permissions, 
            r.since = coalesce(r.since, datetime())
        RETURN r.role AS assignedRole, r.permissions AS assignedPermissions
      `;
      
      const result = await session.run(cypher, { 
        userUid: targetUserUid, 
        teamUid, 
        role, 
        permissions // 👈 On injecte le tableau de plumes
      });

      if (result.records.length === 0) throw new Error("Impossible de lier l'oiseau (l'équipe n'existe pas dans le graphe).");
      
      return { 
        success: true, 
        role: result.records[0].get('assignedRole'),
        permissions: result.records[0].get('assignedPermissions')
      };
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
  static async mutateTeam(teamUid: string, data: Partial<ITeam>) {
    if (data.nom) {
      const check = MoralChecker.analyze(data.nom);
      if (!check.isSafe) throw new Error(`Nom invalide : ${check.suggestion}`);
    }

    // On effectue la mise à jour dans Mongo
    const updatedTeam = await TeamModel.findOneAndUpdate(
      { uid: teamUid },
      { $set: data },
      { new: true }
    );
    
    if (!updatedTeam) throw new Error("Nid introuvable pour la mutation.");

    // Si le nom a changé, on synchronise Neo4j
    if (data.nom) {
      const session = getNeo4jSession();
      try {
        await session.run(
          `MATCH (t:Team {uid: $teamUid}) SET t.nom = $nom`, 
          { teamUid, nom: data.nom }
        );
      } finally {
        await session.close();
      }
    }

    // 📉 On déclenche le HealthOrchestrator si besoin
    // (Par exemple si la vitesse globale a été modifiée)
    
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

