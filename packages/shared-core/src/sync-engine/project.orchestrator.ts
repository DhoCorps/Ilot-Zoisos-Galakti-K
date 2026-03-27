import { ProjectModel } from '@ilot/infrastructure';
import { getNeo4jDriver } from '@ilot/infrastructure';
import { v4 as uuidv4 } from 'uuid';
import { ICreateProject } from '@ilot/types';

const generateSlug = (text: string): string => {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')     // Enlève les caractères spéciaux
    .replace(/[\s_-]+/g, '-')     // Remplace les espaces et underscores par des tirets
    .replace(/^-+|-+$/g, '');     // Enlève les tirets au début et à la fin
};

export const ProjectOrchestrator = {

  async createProject(projectData: ICreateProject, ownerUid: string) {
    const uid = uuidv4().slice(0, 8);
    const slug = projectData.slug || generateSlug(projectData.titre);

    // 1. MONGO : On stocke les références techniques
    const mongoProject = await ProjectModel.create({
      ...projectData,
      uid,
      slug,
      owner: ownerUid,
      // On supporte le parent direct (Mongo ObjectId)
      parent: projectData.parent || null, 
      teamId: projectData.teamUid || null
    });

    // 2. NEO4J : On tisse la toile de relations
    const session = getNeo4jDriver().session();
    try {
      const cypher = `
        MATCH (u:User {uid: $ownerUid})
        OPTIONAL MATCH (t:Team {uid: $teamUid})
        OPTIONAL MATCH (parentP:Project {uid: $parentUid})
        
        CREATE (p:Project {
          uid: $uid,
          titre: $titre,
          statut: $statut,
          createdAt: datetime()
        })
        
        // Lien de propriété
        MERGE (u)-[:OWNS_PROJECT]->(p)
        
        // Lien avec le Nid (si présent)
        WITH p, t, parentP
        WHERE t IS NOT NULL
        MERGE (t)-[:HOSTS_PROJECT]->(p)
        
        // LIEN FRACTAL : Le projet devient un sous-projet
        WITH p, parentP
        WHERE parentP IS NOT NULL
        MERGE (parentP)-[:PARENT_OF]->(p)
        
        RETURN p
      `;

      await session.run(cypher, {
        uid,
        titre: projectData.titre,
        statut: projectData.statut || 'Planifié',
        ownerUid,
        teamUid: projectData.teamUid || null,
        parentUid: projectData.parent || null // Ici on passe l'UID du projet parent
      });

      return mongoProject;
    } finally {
      await session.close();
    }
  },
  async updateProject(projectUid: string, updateData: any, userUid: string) {
    // 1. Mise à jour MongoDB (Validation du propriétaire via 'owner')
    const mongoProject = await ProjectModel.findOneAndUpdate(
      { uid: projectUid, owner: userUid }, 
      { $set: updateData },
      { new: true }
    );

    if (!mongoProject) throw new Error("Fragment introuvable ou signature thermique non autorisée.");

    // 2. Mise à jour Neo4j (Seulement si les champs structurels changent)
    if (updateData.titre || updateData.statut || updateData.priority) {
      const driver = getNeo4jDriver();
      const session = driver.session();
      try {
        const cypherUpdate = `
          MATCH (p:Project {uid: $uid})
          SET p.titre = COALESCE($titre, p.titre),
              p.statut = COALESCE($statut, p.statut),
              p.priority = COALESCE($priority, p.priority),
              p.updatedAt = datetime()
          RETURN p
        `;
        await session.run(cypherUpdate, {
          uid: projectUid,
          titre: updateData.titre || null,
          statut: updateData.statut || null,
          priority: updateData.priority || null
        });
      } catch (error: any) {
        console.error("⚠️ Désynchronisation partielle du Graphe :", error);
        // On ne rollback pas l'update Mongo ici, mais on log l'erreur
      } finally {
        await session.close();
      }
    }

    return mongoProject;
  },

  async deleteProject(projectUid: string, userUid: string) {
    // 1. Suppression MongoDB
    const deletedMongo = await ProjectModel.findOneAndDelete({ 
      uid: projectUid, 
      owner: userUid 
    });

    if (!deletedMongo) throw new Error("Destruction impossible : fragment inexistant ou accès refusé.");

    // 2. Destruction en cascade Neo4j
    const driver = getNeo4jDriver();
    const session = driver.session();
    try {
      const cypherDelete = `
        MATCH (p:Project {uid: $uid})
        DETACH DELETE p
      `;
      await session.run(cypherDelete, { uid: projectUid });
    } catch (error: any) {
      console.error("💥 Résistance du Graphe à la suppression :", error);
      throw new Error("Erreur de désynchronisation : le fragment survit dans Neo4j.");
    } finally {
      await session.close();
    }
  }
};