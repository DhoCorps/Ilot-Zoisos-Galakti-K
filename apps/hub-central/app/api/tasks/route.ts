import { NextResponse } from 'next/server';
import { getServerSession } from "next-auth/next";
import { authOptions } from "../../../lib/auth"; 
import { connectToDatabase, TaskModel, getNeo4jSession } from '@ilot/infrastructure';
import { TaskSchema } from '@ilot/types';
import { TaskOrchestrator } from '@ilot/shared-core';

export const dynamic = 'force-dynamic';

// 🛡️ Sceau de validation strict pour l'Inception
const CreateTaskValidation = TaskSchema.omit({
  uid: true,
  createdAt: true,
  updatedAt: true,
  creatorUid: true,
  completedPomodoros: true // Protégé à la création
});

/**
 * 📖 GET : Le Radar de l'Oiseau (Récupère SES brindilles)
 */
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Accès refusé. Identification requise." }, { status: 401 });
    }

    const userUid = (session.user as any).uid;
    await connectToDatabase();

    // 🎯 LE RADAR NEO4J (Le fameux correctif anti-fuite de mémoire)
    const neoSession = getNeo4jSession();
    try {
      // On cherche les tâches où l'oiseau est SOIT Créateur, SOIT Assigné
      const cypher = `
        MATCH (u:User {uid: $userUid})
        OPTIONAL MATCH (u)-[:ASSIGNED_TO]->(t1:Task)
        OPTIONAL MATCH (u)-[:CREATED]->(t2:Task)
        WITH collect(t1.uid) + collect(t2.uid) AS allUids
        UNWIND allUids AS taskUid
        // On filtre les nulls au cas où l'oiseau n'a aucune tâche
        WITH taskUid WHERE taskUid IS NOT NULL
        RETURN DISTINCT taskUid
      `;
      const result = await neoSession.run(cypher, { userUid });
      
      const authorizedUids = result.records.map(rec => rec.get('taskUid'));

      if (authorizedUids.length === 0) {
        return NextResponse.json({ success: true, data: [] });
      }

      // 🕊️ LÉGÈRETÉ : On interroge MongoDB uniquement pour les UIDs autorisés
      const tasks = await TaskModel.find({ uid: { $in: authorizedUids } })
        .sort({ priority: -1, createdAt: -1 }) // Les plus prioritaires en haut
        .lean();

      return NextResponse.json({ success: true, data: tasks });
    } finally {
      // 🛡️ CORRECTION DU BUG NEO4J : Fermeture garantie de la session
      await neoSession.close(); 
    }
  } catch (error: any) {
    console.error("🚨 [GET TASKS API ERROR] :", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

/**
 * 🏗️ POST : Forge une nouvelle brindille (Tom-Hat-Toes)
 */
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Session expirée ou invalide." }, { status: 401 });
    }

    const body = await request.json();

    // 1. Validation Zod (Anti-casse)
    const parsedData = CreateTaskValidation.safeParse(body);
    if (!parsedData.success) {
      return NextResponse.json({ 
        error: "L'ADN de la tâche est corrompu.", 
        details: parsedData.error.format() 
      }, { status: 400 });
    }

    // 2. Extraction sécurisée de l'identité du pilote
    const creatorUid = (session.user as any).uid;

    // 3. 🛡️ Inception sous Sceau Transactionnel via l'Orchestrateur
    const newTask = await TaskOrchestrator.createTask({
      ...parsedData.data,
      creatorUid: creatorUid,
    });

    return NextResponse.json(
      { success: true, uid: newTask.uid, message: "La brindille a été tissée avec succès." }, 
      { status: 201 }
    );

  } catch (error: any) {
    console.error("🚨 [POST TASK API ERROR] :", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}