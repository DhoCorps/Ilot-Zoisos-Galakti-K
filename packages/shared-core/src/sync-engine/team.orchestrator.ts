import { ITeam, TeamModel, UserModel, getNeo4jSession } from '@ilot/infrastructure';
import { MoralChecker } from '../integrity/moral-checker';
import { TransactionManager } from './transactionManager';

export class TeamOrchestrator {

  static async promoteToAdmin(teamUid: string, targetUserUid: string) {
    const session = getNeo4jSession();
    try {
      const cypher = `
        MATCH (u:User {uid: $userUid})-[r:MEMBER_OF]->(t:Team {uid: $teamUid})
        SET r.role = 'ADMIN'
        RETURN coalesce(u.username, 'Inconnu') AS birdName, r.role AS newRole
      `;
      const result = await session.run(cypher, { userUid: targetUserUid, teamUid });
      if (result.records.length === 0) throw new Error("Promotion impossible : oiseau absent du nid.");
      return { success: true, birdName: result.records[0].get('birdName'), newRole: result.records[0].get('newRole') };
    } finally {
      await session.close();
    }
  }

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

      // 🌟 FIX MONGO : On ajoute le nid au tableau de l'oiseau fondateur
      await UserModel.findByIdAndUpdate(
        createur._id,
        { $push: { teams: newTeam._id } }, 
        { session: mongoSession }
      );

      // 🛡️ CYPHER PUR : Adieu APOC. Et création propre de l'Oiseau avec uid + username
      const cypher = `
        MERGE (u:User { uid: $creatorUid })
        ON CREATE SET u.username = $creatorName
        
        MERGE (t:Team { uid: $teamUid })
        ON CREATE SET t.name = $name, t.createdAt = datetime()
        
        MERGE (u)-[r:MEMBER_OF]->(t)
        ON CREATE SET r.role = 'ADMIN', r.since = datetime()
        
        // 4. Lien Optionnel : Équipe Parente
        WITH t
        OPTIONAL MATCH (p:Team { uid: $parentId })
        FOREACH (_ IN CASE WHEN p IS NOT NULL THEN [1] ELSE [] END |
          MERGE (t)-[:CHILD_OF]->(p)
        )
        RETURN count(t)
      `;

      await neo4jTx.run(cypher, {
        creatorUid: teamData.creatorUid,
        creatorName: createur.username, 
        teamUid: newTeam.uid,
        name: newTeam.name,
        parentId: teamData.parentId || null
      });

      return { success: true, team: newTeam };
    });
  }

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

  static async dissolveTeam(teamUid: string) {
    return await TransactionManager.execute("Dissolution de Nid", async (mongoSession, neo4jTx) => {
      await neo4jTx.run(`MATCH (t:Team {uid: $teamUid}) DETACH DELETE t`, { teamUid });
      
      const deletedTeam = await TeamModel.findOneAndDelete({ uid: teamUid }, { session: mongoSession });
      
      // 🌟 FIX MONGO : On retire cette équipe des tableaux de TOUS les utilisateurs
      if (deletedTeam) {
        await UserModel.updateMany(
          { teams: deletedTeam._id },
          { $pull: { teams: deletedTeam._id } },
          { session: mongoSession }
        );
      }
      
      return true;
    });
  }

  static async assignRole(teamUid: string, targetUserUid: string, role: string, permissions: string[] = []) {
    const session = getNeo4jSession();
    try {
      const cypher = `
        MERGE (u:User { uid: $userUid })
        WITH u
        MATCH (t:Team { uid: $teamUid })
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

  static async getTeamDetails(teamUid: string) {
    const team = await TeamModel.findOne({ uid: teamUid }).lean();
    if (!team) throw new Error("Ce nid n'existe pas ou a été détruit.");

    const session = getNeo4jSession();
    try {
      const cypher = `
        MATCH (u:User)-[r:MEMBER_OF]->(t:Team {uid: $teamUid})
        RETURN coalesce(u.uid, u.mongodbId) as uid, u.username as username, r.role as role, r.permissions as permissions
      `;
      const result = await session.run(cypher, { teamUid });
      
      const members = await Promise.all(result.records.map(async (record: any) => {
        const birdUid = record.get('uid');
        const mongoUser = await UserModel.findOne({ uid: birdUid }).select('email').lean();
        return {
          uid: birdUid,
          username: record.get('username') || 'Oiseau Fantôme',
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

  static async inviteMember(teamUid: string, email: string, role: string, permissions: string[] = []) {
    const user = await UserModel.findOne({ email });
    if (!user) throw new Error("Cet oiseau n'existe pas sur l'Îlot.");

    const session = getNeo4jSession();
    try {
      const cypher = `
        MERGE (u:User { uid: $userUid })
        ON CREATE SET u.username = $username
        WITH u
        MATCH (t:Team { uid: $teamUid })
        MERGE (u)-[r:MEMBER_OF]->(t)
        SET r.role = $role, 
            r.permissions = $permissions, 
            r.since = coalesce(r.since, datetime())
        RETURN r
      `;
      const result = await session.run(cypher, { userUid: user.uid, username: user.username, teamUid, role, permissions });
      if (result.records.length === 0) throw new Error("Impossible de lier l'oiseau au graphe.");
      return { success: true, userUid: user.uid };
    } finally {
      await session.close();
    }
  }

  static async removeMember(teamUid: string, targetUserUid: string, requesterUid: string) {
    if (targetUserUid === requesterUid) {
      throw new Error("🔒 Sécurité : Un oiseau ne peut pas s'expulser lui-même du nid.");
    }

    const session = getNeo4jSession();
    try {
      const cypher = `
        MATCH (u:User {uid: $targetUserUid})-[r:MEMBER_OF]->(t:Team {uid: $teamUid})
        DELETE r
        RETURN coalesce(u.username, 'Inconnu') AS birdName
      `;
      const result = await session.run(cypher, { targetUserUid, teamUid });
      if (result.records.length === 0) throw new Error("Impossible de bannir : oiseau introuvable.");
      return result.records[0].get('birdName');
    } finally {
      await session.close();
    }
  }

  static async getMemberRoleByEmail(teamUid: string, email: string): Promise<string | null> {
    const user = await UserModel.findOne({ email }).lean();
    if (!user) return null;

    const session = getNeo4jSession();
    try {
      const cypher = `
        MATCH (u:User {uid: $userUid})-[r:MEMBER_OF]->(t:Team {uid: $teamUid})
        RETURN r.role AS role
      `;
      const result = await session.run(cypher, { userUid: user.uid, teamUid });
      
      if (result.records.length === 0) return null;
      
      return result.records[0].get('role');
    } finally {
      await session.close();
    }
  }
}