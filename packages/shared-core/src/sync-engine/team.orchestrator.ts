import { ITeam, TeamModel, UserModel, getNeo4jSession } from '@ilot/infrastructure';
import { MoralChecker } from '../integrity/moral-checker';
import { TransactionManager } from './transactionManager';

export class TeamOrchestrator {

  /**
   * 👑 PROMOTION : Élève un oiseau au rang d'ADMIN dans un nid spécifique
   */
  static async promoteToAdmin(teamUid: string, targetUserUid: string) {
    const session = getNeo4jSession();
    try {
      const cypher = `
        MATCH (u:Oiseau {mongodbId: $userUid})-[r:MEMBER_OF]->(t:Team {mongodbId: $teamUid})
        SET r.role = 'ADMIN'
        RETURN u.username AS birdName, r.role AS newRole
      `;
      const result = await session.run(cypher, { userUid: targetUserUid, teamUid });
      if (result.records.length === 0) throw new Error("Promotion impossible : oiseau absent du nid.");
      return { success: true, birdName: result.records[0].get('birdName'), newRole: result.records[0].get('newRole') };
    } finally {
      await session.close();
    }
  }

  /**
   * 🏗️ FONDE UNE ESCOUADE (Hybride Mongo/Neo4j sous Sceau)
   */
  static async fosterTeam(teamData: { 
    name: string, 
    creatorUid: string, 
    creatorId?: any, 
    description?: string,
    parentId?: string,
    settings?: any 
  }) {
    const check = MoralChecker.analyze(teamData.name);
    if (!check.isSafe) throw new Error(`Nom invalide : ${check.suggestion}`);

    const createur = await UserModel.findOne({ uid: teamData.creatorUid });
    if (!createur) throw new Error("Créateur introuvable.");

    let parentObjectId = null;
    if (teamData.parentId) {
      const parentTeam = await TeamModel.findOne({ uid: teamData.parentId });
      if (!parentTeam) throw new Error("L'escouade parente n'existe pas.");
      parentObjectId = parentTeam._id;
    }

    return await TransactionManager.execute("Fondation d'Escouade", async (mongoSession, neo4jTx) => {
      const [newTeam] = await TeamModel.create([{
        name: teamData.name,
        description: teamData.description,
        ownerId: createur._id,
        leaderId: createur._id,
        parentId: parentObjectId 
      }], { session: mongoSession });

      const cypher = `
        MERGE (u:Oiseau { uid: $creatorUid })
        MERGE (t:Team { uid: $teamUid })
        ON CREATE SET t.name = $name, t.createdAt = datetime()
        MERGE (u)-[r:MEMBER_OF { role: 'ADMIN' }]->(t)
        ON CREATE SET r.since = datetime()
        WITH t
        CALL apoc.do.when(
          $parentId IS NOT NULL,
          'MATCH (p:Team { uid: parentId }) MERGE (t)-[:CHILD_OF]->(p) RETURN t',
          'RETURN t',
          {t: t, parentId: $parentId}
        ) YIELD value
        RETURN count(t)
      `;

      await neo4jTx.run(cypher, {
        creatorUid: teamData.creatorUid,
        teamUid: newTeam.uid,
        name: newTeam.name,
        parentId: teamData.parentId || null
      });

      return { success: true, team: newTeam };
    });
  }

  /**
   * 🔄 PUT : Mutation du nid (Synchronisée sous Sceau)
   */
  static async mutateTeam(teamUid: string, data: Partial<ITeam>) {
    if (data.name) {
      const check = MoralChecker.analyze(data.name);
      if (!check.isSafe) throw new Error(`Nom invalide : ${check.suggestion}`);
    }

    return await TransactionManager.execute("Mutation de Nid", async (mongoSession, neo4jTx) => {
      const updatedTeam = await TeamModel.findOneAndUpdate(
        { uid: teamUid },
        { $set: data },
        { new: true, session: mongoSession }
      );
      
      if (!updatedTeam) throw new Error("Nid introuvable pour la mutation.");

      if (data.name) {
        await neo4jTx.run(
          `MATCH (t:Team {uid: $teamUid}) SET t.name = $name`, 
          { teamUid, name: data.name }
        );
      }
      return updatedTeam;
    });
  }

  /**
   * 🗑️ DELETE : Destruction totale et propre du nid (Sous Sceau)
   */
  static async dissolveTeam(teamUid: string) {
    return await TransactionManager.execute("Dissolution de Nid", async (mongoSession, neo4jTx) => {
      await neo4jTx.run(`MATCH (t:Team {uid: $teamUid}) DETACH DELETE t`, { teamUid });
      await TeamModel.findOneAndDelete({ uid: teamUid }, { session: mongoSession });
      return true;
    });
  }

  /**
   * 🎖️ ASSIGNE UN RÔLE SPÉCIFIQUE (Neo4j)
   */
  static async assignRole(teamUid: string, targetUserUid: string, role: string, permissions: string[] = []) {
    const session = getNeo4jSession();
    try {
      const cypher = `
        MERGE (u:Oiseau { mongodbId: $userUid })
        WITH u
        MATCH (t:Team { mongodbId: $teamUid })
        MERGE (u)-[r:MEMBER_OF]->(t)
        SET r.role = $role, 
            r.permissions = $permissions, 
            r.since = coalesce(r.since, datetime())
        RETURN r.role AS assignedRole, r.permissions AS assignedPermissions
      `;
      const result = await session.run(cypher, { userUid: targetUserUid, teamUid, role, permissions });
      if (result.records.length === 0) throw new Error("Impossible de lier l'oiseau.");
      return { success: true, role: result.records[0].get('assignedRole'), permissions: result.records[0].get('assignedPermissions') };
    } finally {
      await session.close();
    }
  }

  /**
   * 🔍 GET : Récupère les détails du nid + membres hybrides
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
      
      const members = await Promise.all(result.records.map(async (record: any) => {
        const birdUid = record.get('uid');
        const mongoUser = await UserModel.findOne({ uid: birdUid }).select('email').lean();
        return {
          uid: birdUid,
          username: record.get('username'),
          email: mongoUser?.email || "email.inconnu@ilot.fr",
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
   * 💌 INVITE UN MEMBRE (Neo4j)
   */
  static async inviteMember(teamUid: string, email: string, role: string, permissions: string[] = []) {
    const user = await UserModel.findOne({ email });
    if (!user) throw new Error("Cet oiseau n'existe pas sur l'Îlot.");

    const session = getNeo4jSession();
    try {
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
      const result = await session.run(cypher, { userUid: user.uid, teamUid, role, permissions });
      if (result.records.length === 0) throw new Error("Impossible de lier l'oiseau.");
      return { success: true, userUid: user.uid };
    } finally {
      await session.close();
    }
  }

  /**
   * 🚫 BANNIT UN MEMBRE (Neo4j)
   */
  static async removeMember(teamUid: string, targetUserUid: string) {
    const session = getNeo4jSession();
    try {
      const cypher = `
        MATCH (u:Oiseau {mongodbId: $targetUserUid})-[r:MEMBER_OF]->(t:Team {mongodbId: $teamUid})
        DELETE r
        RETURN u.username AS birdName
      `;
      const result = await session.run(cypher, { targetUserUid, teamUid });
      if (result.records.length === 0) throw new Error("Impossible de bannir : oiseau introuvable.");
      return result.records[0].get('birdName');
    } finally {
      await session.close();
    }
  }
}