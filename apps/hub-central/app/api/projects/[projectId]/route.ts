import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../../lib/auth';
import { ProjectOrchestrator } from '@ilot/shared-core';
import { ProjectModel } from '@ilot/infrastructure';

export const dynamic = 'force-dynamic';

export async function GET(req: Request, { params }: { params: { projectId: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    const project = await ProjectModel.findOne({ uid: params.projectId }).lean();
    if (!project) return NextResponse.json({ error: "Fragment introuvable." }, { status: 404 });
    return NextResponse.json(project, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ error: "Erreur de lecture" }, { status: 500 });
  }
}

export async function PATCH(req: Request, { params }: { params: { projectId: string } }) {
  try {
    const session = await getServerSession(authOptions);
    const userId = session?.user?.uid || (session?.user as any)?._id || (session?.user as any)?.id;
    if (!userId) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    const body = await req.json();
    const updatedProject = await ProjectOrchestrator.updateProject(params.projectId, body, userId);
    return NextResponse.json(updatedProject, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Erreur technique.' }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: { projectId: string } }) {
  try {
    const session = await getServerSession(authOptions);
    const userId = session?.user?.uid || (session?.user as any)?._id || (session?.user as any)?.id;
    if (!userId) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    await ProjectOrchestrator.deleteProject(params.projectId, userId);
    return NextResponse.json({ message: "Effacé de la matrice." }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Le nœud résiste." }, { status: 500 });
  }
}