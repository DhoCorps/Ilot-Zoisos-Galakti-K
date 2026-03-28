import { ProjectModel } from '@ilot/infrastructure';
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

      // 2. NEO4J
      const cypher = `
        MATCH (u:User {uid: $ownerUid})
        OPTIONAL MATCH (t:Team {uid: $teamId})
        OPTIONAL MATCH (parentP:Project {uid: $parentId})
        
        CREATE (p:Project {
          uid: $uid,
          title: $title,
          status: $status,
          createdAt: datetime()
        })
        
        MERGE (u)-[:OWNS_PROJECT]->(p)
        
        WITH p, t, parentP
        WHERE t IS NOT NULL
        MERGE (t)-[:HOSTS_PROJECT]->(p)
        
        WITH p, parentP
        WHERE parentP IS NOT NULL
        MERGE (parentP)-[:PARENT_OF]->(p)
        
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

      await neo4jTx.run(`MATCH (p:Project {uid: $uid}) DETACH DELETE p`, { uid: projectUid });

      return deletedMongo;
    });
  }
};