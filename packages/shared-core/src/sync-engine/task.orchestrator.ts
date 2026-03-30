import { TaskModel, ProjectModel } from '@ilot/infrastructure';
import { TransactionManager } from './transactionManager';
import { ITask } from '@ilot/types';

export class TaskOrchestrator {
  
  static async createTask(taskData: Partial<ITask>) {
    return TransactionManager.execute("CREATE_TASK", async (mongoSession, neo4jTx) => {
      const newTask = new TaskModel({
        ...taskData,
        status: taskData.status || 'TODO',
        isPrivate: taskData.isPrivate ?? true
      });

      // 🛠️ SOUDURE NEO4J : On utilise MATCH pour éviter de créer des fantômes
      const cypherBase = `
        MATCH (c:User {uid: $creatorUid})
        MATCH (p:Project {uid: $projectId})
        CREATE (t:Task {uid: $taskUid, status: $status, isPrivate: $isPrivate})
        MERGE (c)-[:CREATED]->(t)
        MERGE (t)-[:BELONGS_TO]->(p)
        RETURN t.uid as uid
      `;
      
      const result = await neo4jTx.run(cypherBase, {
        projectId: newTask.projectId,
        creatorUid: newTask.creatorUid,
        taskUid: newTask.uid,
        status: newTask.status,
        isPrivate: newTask.isPrivate
      });

      if (result.records.length === 0) {
        throw new Error("L'ancre a lâché : Le fragment parent ou votre profil n'existe pas dans le Graphe.");
      }

      if (newTask.assignees && newTask.assignees.length > 0) {
        const assignCypher = `
          MATCH (t:Task {uid: $taskUid})
          UNWIND $assignees AS assigneeUid
          MATCH (u:User {uid: assigneeUid})
          CREATE (u)-[:ASSIGNED_TO]->(t)
        `;
        await neo4jTx.run(assignCypher, { taskUid: newTask.uid, assignees: newTask.assignees });
      }

      await newTask.save({ session: mongoSession });
      
      await ProjectModel.findOneAndUpdate(
        { uid: newTask.projectId },
        { $push: { tasks: newTask._id } },
        { session: mongoSession }
      );
      
      return newTask;
    });
  }

  // 🛠️ UPDATE GLOBAL (Plus seulement le statut)
  static async updateTask(taskUid: string, updateData: any) {
    return TransactionManager.execute("UPDATE_TASK", async (mongoSession, neo4jTx) => {
      const updatedTask = await TaskModel.findOneAndUpdate(
        { uid: taskUid },
        { $set: updateData },
        { new: true, session: mongoSession }
      );

      if (!updatedTask) throw new Error("Brindille introuvable.");

      // Si le statut change, on prévient Neo4j
      if (updateData.status) {
        await neo4jTx.run(`MATCH (t:Task {uid: $taskUid}) SET t.status = $newStatus`, { 
          taskUid, 
          newStatus: updateData.status 
        });
      }

      return updatedTask;
    });
  }

  // 🛠️ DESTRUCTION DE LA TÂCHE
  static async deleteTask(taskUid: string) {
    return TransactionManager.execute("DELETE_TASK", async (mongoSession, neo4jTx) => {
      const deletedTask = await TaskModel.findOneAndDelete({ uid: taskUid }, { session: mongoSession });
      if (!deletedTask) throw new Error("Destruction impossible.");

      // Nettoyage dans le Projet Parent (Mongo)
      await ProjectModel.findOneAndUpdate(
        { uid: deletedTask.projectId },
        { $pull: { tasks: deletedTask._id } },
        { session: mongoSession }
      );

      // Désintégration dans Neo4j
      await neo4jTx.run(`MATCH (t:Task {uid: $uid}) DETACH DELETE t`, { uid: taskUid });

      return deletedTask;
    });
  }
}