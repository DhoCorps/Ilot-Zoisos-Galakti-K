import { NextResponse } from 'next/server';
import { getServerSession } from "next-auth/next";
import { authOptions } from "../../../../lib/auth"; // 👈 Vérifie bien le nombre de "../" selon ton dossier
import { TaskOrchestrator } from '@ilot/shared-core';

export const dynamic = 'force-dynamic';

/**
 * 🔄 PATCH : Met à jour une brindille spécifique (Ex: Changement de statut Kanban)
 */
export async function PATCH(
  request: Request,
  { params }: { params: { taskId: string } }
) {
  try {
    // 1. 🛂 LA DOUANE
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Accès refusé. Identification requise." }, { status: 401 });
    }

    const { taskId } = params;
    const body = await request.json();

    // 2. ⚙️ AIGUILLAGE : Mise à jour du statut
    if (body.status) {
      const updatedTask = await TaskOrchestrator.updateTaskStatus(taskId, body.status);
      
      return NextResponse.json({ 
        success: true, 
        message: "Statut de la brindille mis à jour.",
        data: updatedTask 
      }, { status: 200 });
    }

    // (Tu pourras rajouter d'autres if ici plus tard pour mettre à jour le titre, les tomates, etc.)

    return NextResponse.json({ error: "Aucune donnée valide à mettre à jour." }, { status: 400 });

  } catch (error: any) {
    console.error(`🚨 [PATCH TASK ${params.taskId} API ERROR] :`, error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}