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
      session = await getServerSession(); // Assure-toi d'avoir (authOptions) ici si nécessaire dans ta config
    }

    if (!session || !session.user || !session.user.email) {
      return NextResponse.json({ error: "Accès refusé. L'oiseau n'est pas identifié." }, { status: 401 });
    }

    await connectToDatabase();
    const body = await req.json();
    
    const { teamId, email, role, permissions } = body;

    if (!teamId || !email || !role) {
      return NextResponse.json({ error: "Les données d'invitation sont incomplètes." }, { status: 400 });
    }

    // ==========================================================
    // 🚨 LE SCEAU DE FEU : VÉRIFICATION D'AUTORISATION BACK-END
    // ==========================================================
    const requesterEmail = session.user.email;
    
    const requesterRole = await TeamOrchestrator.getMemberRoleByEmail(teamId, requesterEmail);
    
    // Si l'oiseau n'a pas de rôle, ou s'il n'est ni ADMIN ni BATISSEUR
    if (requesterRole !== 'ADMIN' && requesterRole !== 'BATISSEUR') {
      console.warn(`🚨 Tentative de putsch bloquée ! L'oiseau ${requesterEmail} a essayé de modifier le Nid ${teamId}`);
      return NextResponse.json({ 
        error: "🔒 ALERTE SÉCURITÉ : Vous n'avez pas l'accréditation pour modifier cette escouade." 
      }, { status: 403 });
    }
    // ==========================================================

    // 🏗️ Appel à l'Orchestrateur (Seulement si le Sceau de Feu a laissé passer)
    await TeamOrchestrator.inviteMember(teamId, email, role, permissions || []);

    return NextResponse.json({ 
      success: true, 
      message: `L'oiseau a été mis à jour avec succès dans le nid avec le rôle ${role}.` 
    }, { status: 200 });

  } catch (error: any) {
    console.error("❌ [POST INVITE] Erreur :", error.message);
    const status = error.message.includes("n'existe pas") ? 404 : 500;
    return NextResponse.json({ error: error.message }, { status });
  }
}