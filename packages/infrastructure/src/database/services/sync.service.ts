import { runQuery } from '../neo4j'; // Plus besoin de getNeo4jDriver ici
import { UserModel } from '../models/nosql/user.model';       // 👈 BUG 1 CORRIGÉ (sans accolades)
import { ProjectModel } from '../models/nosql/project.model'; // 👈 BUG 1 CORRIGÉ (sans accolades)
import { ProjectRole } from '@ilot/types';
export const syncUserToGraph = async (user: any) => {
  const cypher = `
    MERGE (u:User {uid: $uid})
    SET u.username = $username,
        u.email = $email,
        u.avatarUrl = $avatarUrl,
        u.updatedAt = datetime()
    RETURN u
  `;
  
  try {
    // 🛡️ Correction : On s'assure de mapper 'uid' sur '_id' si nécessaire
    // et on garantit que 'email' est présent.
    await runQuery(cypher, {
      uid: user.uid || user._id?.toString(), 
      username: user.username,
      email: user.email, // C'est ce paramètre qui manquait !
      avatarUrl: user.avatarUrl || null
    });
    console.log(`✨ [Graphe] Sync réussie pour l'oiseau : ${user.username}`);
  } catch (error) {
    console.error("❌ Erreur syncUserToGraph :", error);
    throw error;
  }
};

/**
 * 🎖️ SYNCHRONISATION RÔLE
 */
export const syncRoleToGraph = async (role: any) => {
  const cypher = `
    MERGE (r:Role {id: $id})
    SET r.intitule = $intitule,
        r.color = $color,
        r.updatedAt = datetime()
    RETURN r
  `;
  try {
    await runQuery(cypher, {
      id: role.id || role._id?.toString(),
      intitule: role.intitule,
      color: role.color || '#6366f1'
    });
  } catch (error) {
    console.error("❌ Erreur syncRoleToGraph :", error);
    throw error;
  }
};

/**
 * 🔗 INVITATION : Lie un oiseau à une équipe
 */
export const inviteMember = async (teamUid: string, userEmail: string, initialCaps: any[]) => {
  try {
    const user = await UserModel.findOne({ email: userEmail.toLowerCase() });
    if (!user) throw new Error("Cet oiseau n'est pas encore inscrit sur l'Îlot.");

    const query = `
      MATCH (u:User {uid: $userUid})
      MERGE (t:Team {uid: $teamUid})
      MERGE (u)-[r:MEMBER_OF]->(t)
      SET r.caps = $initialCaps, r.grantedAt = datetime()
      RETURN r
    `;
    await runQuery(query, { teamUid, userUid: user.uid, initialCaps });
    return { success: true, message: `Liaison établie pour ${user.username}.` };
  } catch (error: any) {
    console.error("❌ Erreur invitation (Graphe) :", error.message);
    throw error;
  }
};

/**
 * 🏗️ PROJET : Mise à jour synchronisée (Mongo + Neo4j)
 */
export const updateProjectSync = async (uid: string, data: any) => {
  try {
    const finalTitre = data.titre || data.nom; // On sécurise la bascule

    // 1. Mise à jour MongoDB
    const updatedMongo = await ProjectModel.findOneAndUpdate(
      { uid: uid },
      { $set: { 
          titre: finalTitre, 
          description: data.description,
          statut: data.statut 
        } 
      },
      { new: true }
    );

    if (!updatedMongo) throw new Error("Projet introuvable dans MongoDB.");

    // 2. Mise à jour Neo4j (👈 BUG 2 CORRIGÉ : On utilise 'titre')
    const cypher = `
      MATCH (p:Project {uid: $uid})
      SET p.titre = $titre, p.updatedAt = datetime()
      RETURN p
    `;
    await runQuery(cypher, { uid: uid, titre: finalTitre });

    return updatedMongo;
  } catch (error: any) {
    console.error("❌ Erreur synchro projet :", error.message);
    throw error;
  }
};
/**
 * 🔐 DROITS DANS LE GRAPHE (Relation User -> Project)
 */
export const updateUserProjectCapabilities = async (
  projectUid: string,
  targetUserUid: string,
  newRole: ProjectRole,
  newCaps: string[] // 👈 On utilise string[] ici pour correspondre à tes PowerLevelGroups
) => {
  const cypher = `
    MATCH (u:User {uid: $userUid})
    MATCH (p:Project {uid: $projectUid})
    MERGE (u)-[r:MEMBER_OF]->(p)
    SET r.role = $role,
        r.capabilities = $caps,
        r.updatedAt = datetime()
    RETURN r
  `;

  try {
    const records = await runQuery(cypher, {
      userUid: targetUserUid,
      projectUid: projectUid,
      role: newRole,
      caps: newCaps
    });

    if (records.records.length === 0) {
      throw new Error("Utilisateur ou Projet introuvable dans Neo4j.");
    }

    return records.records[0].get('r').properties;
  } catch (error) {
    console.error("❌ Erreur Neo4j (updateUserProjectCapabilities) :", error);
    throw error;
  }
};


/**
 * 🧹 DELETE BIRD
 */
export async function deleteBird(userUid: string): Promise<void> {
  try {
    await runQuery(
      'MATCH (u:User {uid: $userUid}) DETACH DELETE u',
      { userUid }
    );
    console.log(`✅ [Sync] Zoizo ${userUid} effacé du ciel de l'Îlot.`);
  } catch (error) {
    console.error(`❌ [Sync] Erreur lors de la suppression du Zoizo ${userUid}:`, error);
    throw error;
  }
}