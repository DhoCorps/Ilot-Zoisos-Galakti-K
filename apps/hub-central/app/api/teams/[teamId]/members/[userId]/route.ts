import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../../../../../../lib/auth"; // 🟢 IMPORTANT : N'oublie pas le cerveau !
import { TeamOrchestrator } from "@ilot/shared-core";

export const dynamic = 'force-dynamic';

export async function PATCH(
  req: Request,
  { params }: { params: { teamId: string, userId: string } }
) {
  try {
    // 🛡️ La Douane (Même vérification que pour le DELETE)
    let session;
    if (process.env.NODE_ENV === 'test') {
      session = { user: { email: "test-bird@ilot.fr", uid: "test-admin-uid" } };
    } else {
      const { authOptions } = await import("../../../../../../lib/auth");
      session = await getServerSession(authOptions);
    }

    if (!session) {
      return NextResponse.json({ error: "Accès refusé. Autorisation requise." }, { status: 401 });
    }

    const { teamId, userId } = params;

    // 👑 Appel à l'Orchestrateur pour la promotion
    const promotion = await TeamOrchestrator.promoteToAdmin(teamId, userId);
    
    return NextResponse.json({ 
      success: true, 
      message: `${promotion.birdName} a été promu au rang d'ADMIN.`,
      newRole: promotion.newRole
    }, { status: 200 });

  } catch (error: any) {
    console.error("❌ [API PROMOTE MEMBER] Erreur :", error.message);
    const status = error.message.includes("n'a pas encore rejoint") ? 404 : 500;
    return NextResponse.json({ error: error.message }, { status });
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: { teamId: string, userId: string } }
) {
  try {
    // 🛡️ La Douane
    let session;
    if (process.env.NODE_ENV === 'test') {
      session = { user: { email: "test-bird@ilot.fr", uid: "test-admin-uid" } };
    } else {
      // 🟢 On passe authOptions ici !
      session = await getServerSession(authOptions);
    }

    if (!session) {
      return NextResponse.json({ error: "Accès refusé. Autorisation de bannissement requise." }, { status: 401 });
    }

    const { teamId, userId } = params;

    // 🏗️ Appel à l'Orchestrateur
    const birdName = await TeamOrchestrator.removeMember(teamId, userId);
    
    return NextResponse.json({ 
      success: true, 
      message: `${birdName} a été exclu de l'escouade.` 
    }, { status: 200 });

  } catch (error: any) {
    console.error("❌ [API BAN MEMBER] Erreur :", error.message);
    const status = error.message.includes("fait pas partie") ? 404 : 500;
    return NextResponse.json({ error: error.message }, { status });
  }
}