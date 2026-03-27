import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../lib/auth'; 
import { ProjectOrchestrator } from '@ilot/shared-core';
import { CreateProjectSchema } from '@ilot/types';
import { ProjectModel } from '@ilot/infrastructure';

export async function POST(req: Request) {
  try {
    // 1. Identification de l'entité
    const session = await getServerSession(authOptions);
    const userId = session?.user?.uid || (session?.user as any)?._id || (session?.user as any)?.id;

    if (!userId) {
      return NextResponse.json(
        { error: "Accès refusé. Entité non reconnue par le Nexus." }, 
        { status: 401 }
      );
    }

    // 2. Récupération du body
    const body = await req.json();
    
    // 3. Validation Zod
    // On retire "owner" de la validation car on va l'injecter nous-mêmes par sécurité
    const validationSchema = CreateProjectSchema.omit({ owner: true });
    const parsedData = validationSchema.parse(body);

    // 4. Préparation des données finales (Suture owner + isArchived)
    const projectData = { 
      ...parsedData, 
      owner: userId,      // On utilise le champ unifié "owner"
      isArchived: false   // On force l'état initial
    };

    // 5. Inception via l'Orchestrateur
    const newProject = await ProjectOrchestrator.createProject(projectData, userId);

    return NextResponse.json(newProject, { status: 201 });

  } catch (error: any) {
    console.error("🚨 Échec critique de l'inception :", error);
    
    if (error.name === 'ZodError' || error.issues) {
      return NextResponse.json(
        { error: "Données corrompues ou incompatibles", details: error.issues || error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: error.message || "Une perturbation a empêché la forge du fragment." },
      { status: 500 }
    );
  }
}

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    const userId = session?.user?.uid || (session?.user as any)?._id || (session?.user as any)?.id;

    if (!userId) {
      return NextResponse.json(
        { error: "Accès refusé. Oiseau non identifié." }, 
        { status: 401 }
      );
    }

    // On cherche par "owner" (ton nouveau standard)
    const projects = await ProjectModel.find({ owner: userId })
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json(projects, { status: 200 });

  } catch (error: any) {
    console.error("🚨 Erreur lors du scan de la matrice :", error);
    return NextResponse.json(
      { error: "Impossible de lire les données." },
      { status: 500 }
    );
  }
}