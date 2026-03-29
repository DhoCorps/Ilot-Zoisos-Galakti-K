import { TaskModel, ProjectModel } from '@ilot/infrastructure';
import { TransactionManager } from './transactionManager';
import { ITask } from '@ilot/types';

export class TaskOrchestrator {
  
  static async createTask(taskData: Partial<ITask>) {
    return TransactionManager.execute("CREATE_TASK", async (mongoSession, neo4jTx) => {
      
      // 1. Préparation de la coque MongoDB
      const newTask = new TaskModel({
        ...taskData,
        status: taskData.status || 'TODO',
        isPrivate: taskData.isPrivate ?? true
      });

      // 2. Câblage dans le Graphe Neo4j (Directement via neo4jTx)
      const cypherBase = `
        // 1. On crée la tâche de manière absolue
        CREATE (t:Task {uid: $taskUid, status: $status, isPrivate: $isPrivate})
        
        // 2. On s'assure que le Créateur existe (et on le lie)
        WITH t
        MERGE (c:User {uid: $creatorUid})
        MERGE (c)-[:CREATED]->(t)
        
        // 3. On s'assure que le Projet existe (et on le lie)
        WITH t
        MERGE (p:Project {uid: $projectId})
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
        throw new Error("Impossible de lier la tâche. Le fragment ou le créateur n'existe pas dans la matrice.");
      }

      // 3. Assignation des oiseaux (S'il y en a)
      if (newTask.assignees && newTask.assignees.length > 0) {
        const assignCypher = `
          MATCH (t:Task {uid: $taskUid})
          UNWIND $assignees AS assigneeUid
          MATCH (u:User {uid: assigneeUid})
          CREATE (u)-[:ASSIGNED_TO]->(t)
        `;
        await neo4jTx.run(assignCypher, { 
          taskUid: newTask.uid, 
          assignees: newTask.assignees 
        });
      }

      // 4. Sauvegarde finale dans MongoDB
      await newTask.save({ session: mongoSession });
      
      // 🌟 FIX MONGO : On pousse la tâche dans le tableau du projet parent
      await ProjectModel.findOneAndUpdate(
        { uid: newTask.projectId },
        { $push: { tasks: newTask._id } },
        { session: mongoSession }
      );
      
      return newTask;
    });
  }

  static async updateTaskStatus(taskUid: string, newStatus: string) {
    return TransactionManager.execute("UPDATE_TASK_STATUS", async (mongoSession, neo4jTx) => {
      
      // 1. Maj Mongo
      const updatedTask = await TaskModel.findOneAndUpdate(
        { uid: taskUid },
        { status: newStatus },
        { new: true, session: mongoSession }
      );

      if (!updatedTask) throw new Error("Tâche introuvable.");

      // 2. Maj Neo4j 
      const cypher = `
        MATCH (t:Task {uid: $taskUid})
        SET t.status = $newStatus
        RETURN t.uid
      `;
      await neo4jTx.run(cypher, { taskUid, newStatus });

      return updatedTask;
    });
  }
}