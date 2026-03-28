import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../../../../../../lib/auth"; 
import { TeamOrchestrator } from "@ilot/shared-core";

export const dynamic = 'force-dynamic';

// 🟢 MISE À JOUR (PATCH) : Promotion en ADMIN
export async function PATCH(
  req: Request,
  { params }: { params: { teamId: string, userId: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json({ error: "Accès refusé. Autorisation requise." }, { status: 401 });
    }

    const { teamId, userId } = params;
    const requesterEmail = session.user.email;

    // 🛡️ Sceau de Feu : Seul un ADMIN ou BATISSEUR peut promouvoir
    const requesterRole = await TeamOrchestrator.getMemberRoleByEmail(teamId, requesterEmail!);
    if (requesterRole !== 'ADMIN' && requesterRole !== 'BATISSEUR') {
      return NextResponse.json({ error: "🔒 Droits insuffisants pour promouvoir." }, { status: 403 });
    }

    const promotion = await TeamOrchestrator.promoteToAdmin(teamId, userId);
    
    return NextResponse.json({ 
      success: true, 
      message: `${promotion.birdName} a été promu au rang d'ADMIN.`,
      newRole: promotion.newRole
    }, { status: 200 });

  } catch (error: any) {
    console.error("❌ [API PROMOTE MEMBER] Erreur :", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// 🔴 SUPPRESSION (DELETE) : Bannissement du membre
export async function DELETE(
  req: Request,
  { params }: { params: { teamId: string, userId: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json({ error: "Accès refusé. Autorisation de bannissement requise." }, { status: 401 });
    }

    const { teamId, userId } = params; // userId est l'oiseau ciblé
    const requesterUid = (session.user as any).uid;
    const requesterEmail = session.user.email;

    // 🛡️ Sceau de Feu : Vérification des droits du demandeur
    const requesterRole = await TeamOrchestrator.getMemberRoleByEmail(teamId, requesterEmail!);
    if (requesterRole !== 'ADMIN' && requesterRole !== 'BATISSEUR') {
      return NextResponse.json({ error: "🔒 Droits insuffisants pour bannir." }, { status: 403 });
    }

    // 🏗️ Appel à l'Orchestrateur avec le Sceau de Préservation (requesterUid)
    // On récupère le nom de l'oiseau pour le message final
    const birdName = await TeamOrchestrator.removeMember(teamId, userId, requesterUid);
    
    return NextResponse.json({ 
      success: true, 
      message: `${birdName} a été exclu de l'escouade.` 
    }, { status: 200 });

  } catch (error: any) {
    console.error("❌ [API BAN MEMBER] Erreur :", error.message);
    // Gestion propre de l'erreur anti-suicide
    const isForbidden = error.message.includes("Sécurité") || error.message.includes("Droits");
    return NextResponse.json({ error: error.message }, { status: isForbidden ? 403 : 500 });
  }
}