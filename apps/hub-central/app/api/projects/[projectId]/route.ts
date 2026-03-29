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

// 🛠️ LA NOUVELLE PORTE D'ENTRÉE POUR LES MODIFICATIONS
export async function PATCH(req: Request, { params }: { params: { projectId: string } }) {
  try {
    const { projectId } = params;
    
    // On récupère les nouvelles données envoyées par ton formulaire
    const body = await req.json();

    // 1. Connexion à la base (si tu as une fonction connectToDatabase() dans ce fichier)
    // await connectToDatabase();

    // 2. Mise à jour dans MongoDB
    // On utilise findOneAndUpdate pour trouver par l'UID et renvoyer le nouveau document
    const updatedProject = await ProjectModel.findOneAndUpdate(
      { uid: projectId }, // On cherche l'UID
      { $set: body },     // On injecte les nouvelles données (status, priority, title...)
      { new: true }       // On demande à Mongo de nous renvoyer la version mise à jour
    );

    if (!updatedProject) {
      return NextResponse.json({ error: "Fragment introuvable dans la matrice." }, { status: 404 });
    }

    // 🌟 (Optionnel) Si le titre ou le statut de ton projet existe aussi dans Neo4j, 
    // c'est ici qu'il faudrait appeler ton Orchestrator pour mettre à jour le Graphe !
    // await SyncOrchestrator.updateProject(projectId, body);

    return NextResponse.json(updatedProject);

  } catch (error: any) {
    console.error('🔥 Panne moteur lors de la mise à jour :', error);
    return NextResponse.json({ error: 'Erreur technique lors de la soudure.' }, { status: 500 });
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