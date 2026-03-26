import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { connectToDatabase } from "@ilot/infrastructure";
import { TeamOrchestrator } from "@ilot/shared-core";

export async function POST(req: Request) {
  try {
    let session;
    if (process.env.NODE_ENV === 'test') {
      session = { user: { email: "test-bird@ilot.fr" } };
    } else {
      session = await getServerSession();
    }

    if (!session) {
      return NextResponse.json({ error: "Accès refusé. L'oiseau n'est pas identifié." }, { status: 401 });
    }

    await connectToDatabase();
    const body = await req.json();
    
    // On extrait les données, y compris le nouveau tableau optionnel de permissions
    const { teamId, email, role, permissions } = body;

    if (!teamId || !email || !role) {
      return NextResponse.json({ error: "Les données d'invitation sont incomplètes." }, { status: 400 });
    }

    // 🏗️ Appel à l'Orchestrateur
    await TeamOrchestrator.inviteMember(teamId, email, role, permissions || []);

    return NextResponse.json({ 
      success: true, 
      message: `L'oiseau a été invité avec succès dans le nid avec le rôle ${role}.` 
    }, { status: 200 });

  } catch (error: any) {
    console.error("❌ [POST INVITE] Erreur :", error.message);
    const status = error.message.includes("n'existe pas") ? 404 : 500;
    return NextResponse.json({ error: error.message }, { status });
  }
}