import { ProjectModel, TeamModel, UserModel } from '@ilot/infrastructure';
import { v4 as uuidv4 } from 'uuid';
import { ICreateProject } from '@ilot/types';
import { TransactionManager } from './transactionManager';

const generateSlug = (text: string): string => {
  return text.toLowerCase().trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
};

export const ProjectOrchestrator = {

  async createProject(projectData: ICreateProject, ownerUid: string) {
    const uid = uuidv4().slice(0, 8);
    const slug = projectData.slug || generateSlug(projectData.title);

    return await TransactionManager.execute("Forge de Fragment", async (mongoSession, neo4jTx) => {
      // 1. MONGO
      const [mongoProject] = await ProjectModel.create([{
        ...projectData,
        uid,
        slug,
        ownerId: ownerUid,
        parentId: projectData.parentId || null,
        teamId: projectData.teamId || null
      }], { session: mongoSession });

      // 🌟 FIX MONGO : On peuple les tableaux des parents
      if (projectData.teamId) {
        await TeamModel.findOneAndUpdate(
          { uid: projectData.teamId },
          { $push: { projects: mongoProject._id } },
          { session: mongoSession }
        );
      }
      await UserModel.findOneAndUpdate(
        { uid: ownerUid },
        { $push: { projects: mongoProject._id } },
        { session: mongoSession }
      );

      // 2. NEO4J
      const cypher = `
        // 1. On crée le projet quoiqu'il arrive
        CREATE (p:Project {
          uid: $uid,
          title: $title,
          status: $status,
          createdAt: datetime()
        })
        
        // 2. On tisse le lien vital avec le Créateur
        WITH p
        MATCH (u:User {uid: $ownerUid})
        MERGE (u)-[:OWNS_PROJECT]->(p)
        
        // 3. Lien Optionnel : Équipe
        WITH p
        OPTIONAL MATCH (t:Team {uid: $teamId})
        FOREACH (_ IN CASE WHEN t IS NOT NULL THEN [1] ELSE [] END |
          MERGE (t)-[:HOSTS_PROJECT]->(p)
        )
        
        // 4. Lien Optionnel : Projet Parent
        WITH p
        OPTIONAL MATCH (parentP:Project {uid: $parentId})
        FOREACH (_ IN CASE WHEN parentP IS NOT NULL THEN [1] ELSE [] END |
          MERGE (parentP)-[:PARENT_OF]->(p)
        )
        
        RETURN p
      `;
      await neo4jTx.run(cypher, {
        uid,
        title: projectData.title,
        status: projectData.status || 'PLANNED',
        ownerUid,
        teamId: projectData.teamId || null,
        parentId: projectData.parentId || null
      });

      return mongoProject;
    });
  },

  async updateProject(projectUid: string, updateData: any, userUid: string) {
    return await TransactionManager.execute("Mutation de Fragment", async (mongoSession, neo4jTx) => {
      const mongoProject = await ProjectModel.findOneAndUpdate(
        { uid: projectUid, ownerId: userUid }, 
        { $set: updateData },
        { new: true, session: mongoSession }
      );

      if (!mongoProject) throw new Error("Fragment introuvable ou accès refusé.");

      if (updateData.title || updateData.status || updateData.priority) {
        const cypherUpdate = `
          MATCH (p:Project {uid: $uid})
          SET p.title = COALESCE($title, p.title),
              p.status = COALESCE($status, p.status),
              p.priority = COALESCE($priority, p.priority),
              p.updatedAt = datetime()
          RETURN p
        `;
        await neo4jTx.run(cypherUpdate, {
          uid: projectUid,
          title: updateData.title || null,
          status: updateData.status || null,
          priority: updateData.priority || null
        });
      }

      return mongoProject;
    });
  },

  async deleteProject(projectUid: string, userUid: string) {
    return await TransactionManager.execute("Destruction de Fragment", async (mongoSession, neo4jTx) => {
      const deletedMongo = await ProjectModel.findOneAndDelete(
        { uid: projectUid, ownerId: userUid }, 
        { session: mongoSession }
      );

      if (!deletedMongo) throw new Error("Destruction impossible ou accès refusé.");

      // 🌟 FIX MONGO : Chasse aux fantômes (on retire l'ID des tableaux)
      if (deletedMongo.teamId) {
        await TeamModel.findOneAndUpdate(
          { uid: deletedMongo.teamId },
          { $pull: { projects: deletedMongo._id } },
          { session: mongoSession }
        );
      }
      await UserModel.findOneAndUpdate(
        { uid: userUid },
        { $pull: { projects: deletedMongo._id } },
        { session: mongoSession }
      );

      await neo4jTx.run(`MATCH (p:Project {uid: $uid}) DETACH DELETE p`, { uid: projectUid });

      return deletedMongo;
    });
  }
};