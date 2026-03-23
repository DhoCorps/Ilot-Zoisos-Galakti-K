import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { connectToDatabase } from "@ilot/infrastructure";
import { TeamOrchestrator } from "@ilot/shared-core"; 
import { TeamModel } from "@ilot/infrastructure"; // Assure-toi que TeamModel est bien importé

export const dynamic = 'force-dynamic';


export async function GET() {
  try {
    await connectToDatabase();
    
    // On ne récupère QUE l'uid et le nom du nid
    const teams = await TeamModel.find({}, 'uid nom').sort({ nom: 1 }).lean();
    
    return NextResponse.json({ success: true, data: teams }, { status: 200 });
  } catch (error) {
    console.error("❌ [GET TEAMS] Erreur :", error);
    return NextResponse.json({ error: "Impossible de scanner les nids existants." }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    // 🛡️ BYPASS DE TEST : On évite l'erreur headers de Next.js
    let session;
    if (process.env.NODE_ENV === 'test') {
      session = { user: { id: "user-test-123", email: "test-bird@ilot.fr", uid: "uid-du-testeur" } };
    } else {
      session = await getServerSession();
    }

    if (!session || !session.user) {
      return NextResponse.json({ error: "Accès refusé. L'oiseau n'est pas identifié." }, { status: 401 });
    }

    await connectToDatabase();
    const body = await req.json();

    // Vérification des champs requis
    if (!body.nom) {
       return NextResponse.json({ error: "Le nom de l'escouade est requis." }, { status: 400 });
    }

    // 🏗️ INCEPTION VIA L'ORCHESTRATEUR (Évolution)
    // On passe maintenant le parentUid s'il existe dans le body
    const result = await TeamOrchestrator.fosterTeam({
      nom: body.nom,
      description: body.description,
      creatorUid: session.user.uid || body.creatorUid,
      parentUid: body.parentUid // 👈 Le secret pour créer des nids dans des nids
    });

    // 🎖️ DISTRIBUTION DES RÔLES
    // Si on invite des oiseaux avec des rôles précis dès la fondation
    if (body.members && Array.isArray(body.members)) {
      for (const member of body.members) {
        // member doit ressembler à { uid: "123", role: "BUILDER" }
        await TeamOrchestrator.assignRole(result.team.uid, member.uid, member.role);
      }
    }

    return NextResponse.json({ 
      success: true, 
      message: "L'escouade a pris son envol !",
      data: result.team 
    }, { status: 201 });

  } catch (error: any) {
    console.error("❌ [POST TEAM] Erreur :", error.message);
    
    // Si c'est le MoralChecker qui bloque, on renvoie une 400
    if (error.message.includes("Nom d'escouade invalide")) {
        return NextResponse.json({ error: error.message }, { status: 400 });
    }
    
    return NextResponse.json({ error: "Tempête serveur lors de la création." }, { status: 500 });
  }
}