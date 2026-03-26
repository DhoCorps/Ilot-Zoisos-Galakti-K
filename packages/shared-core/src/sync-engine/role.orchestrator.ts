import { RoleModel, PermissionModel, getNeo4jSession } from '@ilot/infrastructure';

export class RoleOrchestrator {
  
  // ==========================================
  // 🛡️ GESTION DES PERMISSIONS (Le Dictionnaire)
  // ==========================================

  /**
   * ➕ Ajoute une nouvelle permission granulaire (Mongo uniquement)
   */
  static async createPermission(data: { intitule: string, code: string, description?: string }) {
    // Les permissions vivent uniquement dans Mongo comme dictionnaire de référence.
    // Dans Neo4j, elles sont injectées sous forme de tableau de strings sur la relation [:MEMBER_OF].
    return await PermissionModel.create(data);
  }

  /**
   * 📖 Liste toutes les permissions disponibles
   */
  static async getAllPermissions() {
    return await PermissionModel.find({}).sort({ intitule: 1 }).lean();
  }

  /**
   * 🔍 Cherche une permission précise
   */
  static async getPermission(idOrUid: string) {
    // On gère la recherche par ObjectId ou par UID UUIDv4
    const isObjectId = idOrUid.match(/^[0-9a-fA-F]{24}$/);
    const query = isObjectId ? { _id: idOrUid } : { uid: idOrUid };
    
    const perm = await PermissionModel.findOne(query).lean();
    if (!perm) throw new Error("Permission introuvable dans les archives.");
    return perm;
  }

  // ==========================================
  // 🎖️ GESTION DES RÔLES (L'hybridation Mongo/Neo4j)
  // ==========================================

  /**
   * 🔨 Forge un nouveau grade (Mongo + Neo4j)
   */
  static async createRole(data: { intitule: string, description?: string, status?: string, isSystem?: boolean, permissions?: any[] }) {
    const intituleNormalise = data.intitule.toUpperCase();

    // 1. Sauvegarde détaillée dans MongoDB (Le Passeport)
    const newRole = await RoleModel.create({
      ...data,
      intitule: intituleNormalise
    });

    // 2. 🏐 LE SMASH VERS NEO4J (Le Nœud de Référence Global)
    const session = getNeo4jSession();
    try {
      // On crée un nœud :Role de référence. Même si on utilise des strings 
      // sur la relation MEMBER_OF, avoir les rôles en tant que nœuds permet 
      // de futures requêtes analytiques (ex: "Combien d'oiseaux ont le rôle X globalement ?")
      const cypher = `
        MERGE (r:Role { mongodbId: $uid })
        ON CREATE SET r.intitule = $intitule, r.createdAt = datetime()
        ON MATCH SET r.intitule = $intitule
        RETURN r
      `;
      await session.run(cypher, { uid: newRole.uid, intitule: intituleNormalise });
    } finally {
      await session.close();
    }

    return newRole;
  }

  /**
   * 🛰️ Récupère la hiérarchie complète des rôles avec leurs permissions peuplées
   */
  static async getAllRoles() {
    return await RoleModel.find({}).populate('permissions').sort({ intitule: 1 }).lean();
  }

  /**
   * 🔍 Cherche un grade précis
   */
  static async getRole(uid: string) {
    const role = await RoleModel.findOne({ uid }).populate('permissions').lean();
    if (!role) throw new Error("Ce grade n'existe pas dans le Bunker.");
    return role;
  }
}