import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../../lib/auth';
import { ProjectOrchestrator } from '@ilot/shared-core';
import { ProjectModel } from '@ilot/infrastructure';

// 🔍 LECTURE D'UN SEUL PROJET
export async function GET(req: Request, { params }: { params: { projectId: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.uid) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

    const project = await ProjectModel.findOne({ uid: params.projectId }).lean();
    if (!project) return NextResponse.json({ error: "Fragment introuvable." }, { status: 404 });

    // Sécurité : vérifier que l'oiseau a le droit de voir ce projet (soit owner, soit dans la team)
    // À affiner selon tes règles de permissions !
    
    return NextResponse.json(project, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ error: "Erreur de lecture" }, { status: 500 });
  }
}

// 🔄 MISE À JOUR (PUT / PATCH)
export async function PUT(req: Request, { params }: { params: { projectId: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.uid) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

    const body = await req.json();
    
    // Appel à l'orchestrateur pour la double mise à jour
    const updatedProject = await ProjectOrchestrator.updateProject(params.projectId, body, session.user.uid);

    return NextResponse.json(updatedProject, { status: 200 });
  } catch (error: any) {
    console.error("🚨 Erreur de mise à jour :", error);
    return NextResponse.json({ error: error.message || "Échec de la mutation." }, { status: 500 });
  }
}

// 💥 DESTRUCTION (DELETE)
export async function DELETE(req: Request, { params }: { params: { projectId: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.uid) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

    // Appel à l'orchestrateur pour la double destruction
    await ProjectOrchestrator.deleteProject(params.projectId, session.user.uid);

    return NextResponse.json({ message: "Le fragment a été effacé de la matrice." }, { status: 200 });
  } catch (error: any) {
    console.error("🚨 Erreur de destruction :", error);
    return NextResponse.json({ error: error.message || "Le nœud résiste à la destruction." }, { status: 500 });
  }
}