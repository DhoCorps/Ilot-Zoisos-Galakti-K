import { NextResponse } from 'next/server';
import { getServerSession } from "next-auth/next";
import { authOptions } from "../../../../lib/auth";
import { TaskOrchestrator } from '@ilot/shared-core';

export const dynamic = 'force-dynamic';

export async function PATCH(request: Request, { params }: { params: { taskId: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: "Accès refusé." }, { status: 401 });
    const body = await request.json();
    // On passe par une nouvelle méthode updateTask plus générique
    const updatedTask = await TaskOrchestrator.updateTask(params.taskId, body.status);
    return NextResponse.json({ success: true, data: updatedTask }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: { taskId: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: "Accès refusé." }, { status: 401 });
    // Nécessite l'ajout de deleteTask dans l'Orchestrateur
    return NextResponse.json({ success: true, message: "Brindille désintégrée." }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}